import { NextResponse } from "next/server";
import { getSql } from "../../../lib/db";
import { getDemoStore, nextDemoNumber } from "../../../lib/demo-store";

function normalizeSubmission(submission) {
  return {
    id: submission.id,
    request_number: submission.request_number,
    status: submission.status,
    official_number: submission.official_number || null,
    direction: submission.direction,
    subject: submission.subject,
    sender: submission.sender,
    recipient: submission.recipient,
    addressee: submission.addressee || "Канцелярия",
    summary: submission.summary || "",
    owner: submission.owner || submission.owner_name || "",
    clerk_comment: submission.clerk_comment || "",
    created_at: submission.created_at || new Date().toISOString()
  };
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string" && /^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("ru-RU").format(date);
}

function normalizeDocument(document) {
  return {
    id: document.id,
    number: document.number,
    type: document.type || document.direction,
    date: formatDate(document.date || document.registered_at || new Date()),
    sender: document.sender || "",
    recipient: document.recipient || "",
    subject: document.subject || "",
    executor: document.executor || document.executor_name || "",
    department: document.department || "",
    deadline: formatDate(document.deadline || document.due_at),
    status: document.status || "Новое",
    overdue: Boolean(document.overdue || document.is_overdue)
  };
}

function requestToDocumentPayload(submission, number) {
  const direction = submission.direction === "Исходящее письмо" ? "Исходящая" : "Входящая";

  return {
    id: crypto.randomUUID(),
    number,
    direction,
    registered_at: new Date(),
    sender: submission.sender,
    recipient: submission.recipient,
    addressee: submission.addressee || "Канцелярия",
    subject: submission.subject,
    summary: submission.summary || "",
    executor_name: "Канцелярия",
    department: "Канцелярия",
    due_at: null,
    status: "Новое",
    is_overdue: false
  };
}

export async function GET() {
  const sql = getSql();

  if (!sql) {
    const store = getDemoStore();
    return NextResponse.json({ database: "demo", requests: store.requests.map(normalizeSubmission) });
  }

  const rows = await sql`
    select id, request_number, status, official_number, direction, subject, sender, recipient, addressee, summary,
           owner_name, clerk_comment, created_at
    from registration_requests
    order by created_at desc
    limit 50
  `;

  return NextResponse.json({ database: "connected", requests: rows.map(normalizeSubmission) });
}

export async function POST(request) {
  const payload = await request.json();
  const sql = getSql();

  if (!sql) {
    const requestNumber = nextDemoNumber("ЗАЯВКА");
    const store = getDemoStore();
    const demoRequest = {
      id: crypto.randomUUID(),
      request_number: requestNumber,
      status: "На проверке канцелярии",
      official_number: null,
      created_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      ...payload
    };
    store.requests.unshift(demoRequest);

    return NextResponse.json({
      database: "demo",
      request: normalizeSubmission(demoRequest)
    });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const [counter] = await sql`
    insert into document_counters(prefix, year, month, value)
    values ('ЗАЯВКА', ${year}, ${month}, 1)
    on conflict(prefix, year, month)
    do update set value = document_counters.value + 1
    returning value
  `;
  const requestNumber = `ЗАЯВКА-${year}-${String(month).padStart(2, "0")}-${String(counter.value).padStart(4, "0")}`;

  const [submission] = await sql`
    insert into registration_requests(request_number, direction, sender, recipient, addressee, subject, summary, owner_name, status, submitted_at)
    values (${requestNumber}, ${payload.direction}, ${payload.sender}, ${payload.recipient}, ${payload.addressee || "Канцелярия"},
            ${payload.subject}, ${payload.summary || ""}, ${payload.owner}, 'На проверке канцелярии', now())
    returning *
  `;

  await sql`
    insert into audit_log(action, actor_name, payload)
    values ('registration_request.created', ${payload.owner}, ${JSON.stringify({ requestNumber })}::jsonb)
  `;

  return NextResponse.json({ database: "connected", request: normalizeSubmission(submission) });
}

export async function PATCH(request) {
  const { id, action, comment = "" } = await request.json();

  if (!id || !["approve", "return"].includes(action)) {
    return NextResponse.json({ error: "Некорректное действие по заявке." }, { status: 400 });
  }

  const sql = getSql();

  if (!sql) {
    const store = getDemoStore();
    const submission = store.requests.find((item) => item.id === id);

    if (!submission) {
      return NextResponse.json({ error: "Заявка не найдена." }, { status: 404 });
    }

    if (action === "return") {
      submission.status = "Вернули на уточнение";
      submission.clerk_comment = comment || "Проверьте реквизиты письма.";
      submission.reviewed_at = new Date().toISOString();
      return NextResponse.json({ database: "demo", request: normalizeSubmission(submission) });
    }

    const prefix = submission.direction === "Исходящее письмо" ? "ИСХ" : "ВХ";
    const document = requestToDocumentPayload(submission, nextDemoNumber(prefix));
    const normalizedDocument = normalizeDocument(document);
    store.documents.unshift(normalizedDocument);

    submission.status = "Зарегистрировано";
    submission.official_number = normalizedDocument.number;
    submission.official_document_id = normalizedDocument.id;
    submission.reviewed_at = new Date().toISOString();

    return NextResponse.json({
      database: "demo",
      request: normalizeSubmission(submission),
      document: normalizedDocument
    });
  }

  const [submission] = await sql`
    select *
    from registration_requests
    where id = ${id}
    limit 1
  `;

  if (!submission) {
    return NextResponse.json({ error: "Заявка не найдена." }, { status: 404 });
  }

  if (action === "return") {
    const [updated] = await sql`
      update registration_requests
      set status = 'Вернули на уточнение',
          clerk_comment = ${comment || "Проверьте реквизиты письма."},
          reviewed_at = now()
      where id = ${id}
      returning *
    `;

    await sql`
      insert into audit_log(action, actor_name, payload)
      values ('registration_request.returned', 'Канцелярия', ${JSON.stringify({ requestNumber: updated.request_number })}::jsonb)
    `;

    return NextResponse.json({ database: "connected", request: normalizeSubmission(updated) });
  }

  const prefix = submission.direction === "Исходящее письмо" ? "ИСХ" : "ВХ";
  const direction = submission.direction === "Исходящее письмо" ? "Исходящая" : "Входящая";
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const [counter] = await sql`
    insert into document_counters(prefix, year, month, value)
    values (${prefix}, ${year}, ${month}, 1)
    on conflict(prefix, year, month)
    do update set value = document_counters.value + 1
    returning value
  `;
  const number = `${prefix}-${year}-${String(month).padStart(2, "0")}-${String(counter.value).padStart(4, "0")}`;

  const [document] = await sql`
    insert into documents(number, direction, status, sender, recipient, addressee, subject, summary, executor_name, department)
    values (${number}, ${direction}, 'Новое', ${submission.sender}, ${submission.recipient}, ${submission.addressee || "Канцелярия"},
            ${submission.subject}, ${submission.summary || ""}, 'Канцелярия', 'Канцелярия')
    returning *
  `;

  const [updated] = await sql`
    update registration_requests
    set status = 'Зарегистрировано',
        official_number = ${number},
        official_document_id = ${document.id},
        clerk_comment = ${comment},
        reviewed_at = now()
    where id = ${id}
    returning *
  `;

  await sql`
    insert into audit_log(document_id, action, actor_name, payload)
    values (${document.id}, 'registration_request.approved', 'Канцелярия', ${JSON.stringify({ requestNumber: updated.request_number, number })}::jsonb)
  `;

  return NextResponse.json({
    database: "connected",
    request: normalizeSubmission(updated),
    document: normalizeDocument(document)
  });
}
