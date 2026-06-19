import { NextResponse } from "next/server";
import { getSql, toDatabaseDocument } from "../../../lib/db";
import { getDemoStore, nextDemoNumber } from "../../../lib/demo-store";

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

export async function GET() {
  const sql = getSql();

  if (!sql) {
    const store = getDemoStore();
    return NextResponse.json({ database: "demo", documents: store.documents.map(normalizeDocument) });
  }

  const rows = await sql`
    select id, number, direction as type, registered_at as date, sender, recipient,
           subject, executor_name as executor, department, due_at as deadline,
           status, is_overdue as overdue
    from documents
    order by registered_at desc, number desc
    limit 100
  `;

  return NextResponse.json({ database: "connected", documents: rows.map(normalizeDocument) });
}

export async function POST(request) {
  const sql = getSql();
  const payload = toDatabaseDocument(await request.json());

  if (!sql) {
    const now = new Date();
    const prefix = payload.type === "Исходящая" ? "ИСХ" : "ВХ";
    const store = getDemoStore();
    const document = normalizeDocument({
      id: crypto.randomUUID(),
      number: nextDemoNumber(prefix),
      direction: payload.type,
      registered_at: now,
      ...payload
    });
    store.documents.unshift(document);

    return NextResponse.json({
      database: "demo",
      document
    });
  }

  const prefix = payload.type === "Исходящая" ? "ИСХ" : "ВХ";
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
    insert into documents(number, direction, status, sender, recipient, subject, executor_name, department, due_at)
    values (${number}, ${payload.type}, ${payload.status}, ${payload.sender}, ${payload.recipient},
            ${payload.subject}, ${payload.executor}, ${payload.department}, ${payload.deadline})
    returning *
  `;

  await sql`
    insert into audit_log(document_id, action, actor_name, payload)
    values (${document.id}, 'document.created', 'Алия М.', ${JSON.stringify({ number, status: payload.status })}::jsonb)
  `;

  return NextResponse.json({ database: "connected", document: normalizeDocument(document) });
}
