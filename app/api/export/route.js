import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSql } from "../../../lib/db";

export async function GET() {
  const sql = getSql();
  const documents = sql
    ? await sql`
        select number, direction as type, registered_at as date, sender, recipient,
               subject, executor_name as executor, department, due_at as deadline, status
        from documents
        order by registered_at desc, number desc
      `
    : [];

  const sheet = XLSX.utils.json_to_sheet(
    documents.map((doc) => ({
      "Номер": doc.number,
      "Тип": doc.type || doc.direction,
      "Дата": doc.date || doc.registered_at,
      "Отправитель": doc.sender,
      "Получатель": doc.recipient,
      "Тема": doc.subject,
      "Исполнитель": doc.executor || doc.executor_name,
      "Подразделение": doc.department,
      "Срок": doc.deadline || doc.due_at,
      "Статус": doc.status
    }))
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Реестр");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=red-petroleum-register.xlsx"
    }
  });
}
