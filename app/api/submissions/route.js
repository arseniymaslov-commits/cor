import { NextResponse } from "next/server";
import { getSql } from "../../../lib/db";

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
        ...payload
      }
    });
  }

  const [counter] = await sql`
    insert into document_counters(prefix, year, month, value)
    values ('ЗАЯВКА', 2026, 6, 1)
    on conflict(prefix, year, month)
    do update set value = document_counters.value + 1
    returning value
  `;
  const requestNumber = `ЗАЯВКА-2026-06-${String(counter.value).padStart(4, "0")}`;

  const [submission] = await sql`
    insert into registration_requests(request_number, direction, sender, recipient, subject, owner_name, status)
    values (${requestNumber}, ${payload.direction}, ${payload.sender}, ${payload.recipient}, ${payload.subject}, ${payload.owner}, 'На проверке канцелярии')
    returning *
  `;

  await sql`
    insert into audit_log(action, actor_name, payload)
    values ('registration_request.created', ${payload.owner}, ${JSON.stringify({ requestNumber })}::jsonb)
  `;

  return NextResponse.json({ database: "connected", request: submission });
}
