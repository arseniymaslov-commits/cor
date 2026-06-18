import { NextResponse } from "next/server";
import { documents } from "../../../lib/mock-data";
import { getSql, toDatabaseDocument } from "../../../lib/db";

export async function GET() {
  const sql = getSql();

  if (!sql) {
    return NextResponse.json({ database: "demo", documents });
  }

  const rows = await sql`
    select id, number, direction as type, registered_at as date, sender, recipient,
           subject, executor_name as executor, department, due_at as deadline,
           status, is_overdue as overdue
    from documents
    order by registered_at desc, number desc
    limit 100
  `;

  return NextResponse.json({ database: "connected", documents: rows });
}

export async function POST(request) {
  const sql = getSql();
  const payload = toDatabaseDocument(await request.json());

  if (!sql) {
    return NextResponse.json({
      database: "demo",
      document: {
        id: crypto.randomUUID(),
        number: payload.type === "Исходящая" ? "ИСХ-2026-06-0043" : "ВХ-2026-06-0008",
        ...payload
      }
    });
  }

  const prefix = payload.type === "Исходящая" ? "ИСХ" : "ВХ";
  const [counter] = await sql`
    insert into document_counters(prefix, year, month, value)
    values (${prefix}, 2026, 6, 1)
    on conflict(prefix, year, month)
    do update set value = document_counters.value + 1
    returning value
  `;
  const number = `${prefix}-2026-06-${String(counter.value).padStart(4, "0")}`;

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

  return NextResponse.json({ database: "connected", document });
}
