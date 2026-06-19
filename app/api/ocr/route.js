import { NextResponse } from "next/server";
import { suggestedOcr } from "../../../lib/mock-data";

export async function POST(request) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let files = [];
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    files = formData
      .getAll("files")
      .filter((file) => typeof file === "object" && file?.name)
      .map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream"
      }));
  }

  return NextResponse.json({
    ...suggestedOcr,
    confidence: files.length > 0 ? 94 : 88,
    source: files.length > 0 ? "Uploaded scan" : "Demo OCR",
    files,
    extractedText:
      "Просим предоставить финансовую отчетность за II квартал 2026 года в срок до 10.06.2026."
  });
}
