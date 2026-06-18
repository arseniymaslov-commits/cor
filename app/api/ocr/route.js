import { NextResponse } from "next/server";
import { suggestedOcr } from "../../../lib/mock-data";

export async function POST() {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return NextResponse.json({
    ...suggestedOcr,
    confidence: 94,
    source: "Konica Minolta scan import",
    extractedText:
      "Просим предоставить финансовую отчетность за II квартал 2026 года в срок до 10.06.2026."
  });
}
