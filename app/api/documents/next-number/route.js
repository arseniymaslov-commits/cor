import { NextResponse } from "next/server";
import { getSql } from "../../../../lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction") || "incoming";
  const prefix = direction === "outgoing" ? "ИСХ" : "ВХ";
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthText = String(month).padStart(2, "0");
  const sql = getSql();

  if (!sql) {
    return NextResponse.json({ number: `${prefix}-${year}-${monthText}-0008`, database: "demo" });
  }

  const [counter] = await sql`
    select coalesce(value, 0) + 1 as next_value
    from document_counters
    where prefix = ${prefix} and year = ${year} and month = ${month}
  `;

  const nextValue = counter?.next_value || 1;
  return NextResponse.json({
    number: `${prefix}-${year}-${monthText}-${String(nextValue).padStart(4, "0")}`,
    database: "connected"
  });
}
