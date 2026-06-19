import { NextResponse } from "next/server";
import { getSql } from "../../../lib/db";

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
    owner: submission.owner || submission.owner_name || "",
    created_at: submission.created_at || new Date().toISOString()
  };
}

export async function GET() {
  const sql = getSql();

  if (!sql) {
    return NextResponse.json({ database: "demo", requests: [] });
  }

  const rows = await sql`
    select id, request_number, status, official_number, direction, subject, sender, recipient, owner_name, created_at
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
    return NextResponse.json({
      database: "demo",
      request: {
        id: crypto.randomUUID(),
        request_number: "ЗАЯВКА-2026-06-0012",
        status: "На проверке канцелярии",
        official_number: null,
        created_at: new Date().toISOString(),
        ...payload
      }
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
    insert into registration_requests(request_number, direction, sender, recipient, subject, owner_name, status)
    values (${requestNumber}, ${payload.direction}, ${payload.sender}, ${payload.recipient}, ${payload.subject}, ${payload.owner}, 'На проверке канцелярии')
    returning *
  `;

  await sql`
    insert into audit_log(action, actor_name, payload)
    values ('registration_request.created', ${payload.owner}, ${JSON.stringify({ requestNumber })}::jsonb)
  `;

  return NextResponse.json({ database: "connected", request: normalizeSubmission(submission) });
}
