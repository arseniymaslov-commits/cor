import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { documents } from "../../../lib/mock-data";

export async function GET() {
  const sheet = XLSX.utils.json_to_sheet(
    documents.map((doc) => ({
      "Номер": doc.number,
      "Тип": doc.type,
      "Дата": doc.date,
      "Отправитель": doc.sender,
      "Получатель": doc.recipient,
      "Тема": doc.subject,
      "Исполнитель": doc.executor,
      "Подразделение": doc.department,
      "Срок": doc.deadline,
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
