import os from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";
import Tesseract from "tesseract.js";

export const runtime = "nodejs";
export const maxDuration = 60;

const workerPath = path.join(process.cwd(), "node_modules", "tesseract.js", "src", "worker-script", "node", "index.js");
const supportedImageTypes = new Set(["image/png", "image/jpeg", "image/jpg", "image/tiff", "image/bmp", "image/webp"]);
const maxWarmWorkerJobs = 150;
const ocrState = globalThis.__redPetroleumOcrState || {
  workerPromise: null,
  queue: Promise.resolve(),
  jobs: 0
};

globalThis.__redPetroleumOcrState = ocrState;

async function createOcrWorker() {
  return Tesseract.createWorker(["rus", "eng"], 1, {
    workerPath,
    cachePath: path.join(os.tmpdir(), "red-petroleum-tesseract"),
    langPath: "https://tessdata.projectnaptha.com/4.0.0_fast",
    logger: () => {}
  });
}

async function getOcrWorker() {
  if (ocrState.workerPromise && ocrState.jobs >= maxWarmWorkerJobs) {
    const staleWorker = await ocrState.workerPromise.catch(() => null);
    await staleWorker?.terminate?.().catch(() => {});
    ocrState.workerPromise = null;
    ocrState.jobs = 0;
  }

  if (!ocrState.workerPromise) {
    ocrState.workerPromise = createOcrWorker();
  }

  return ocrState.workerPromise;
}

async function runQueuedOcr(task) {
  const queuedTask = ocrState.queue.then(task, task);
  ocrState.queue = queuedTask.catch(() => {});
  return queuedTask;
}

function normalizeText(text = "") {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeDate(value = "") {
  const [day, month, year] = value.replaceAll("-", ".").replaceAll("/", ".").split(".");
  if (!day || !month || !year) {
    return value;
  }

  return `${day.padStart(2, "0")}.${month.padStart(2, "0")}.${year.length === 2 ? `20${year}` : year}`;
}

function findLine(text, patterns) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  for (const pattern of patterns) {
    const direct = lines.find((line) => pattern.test(line));
    if (direct) {
      return direct.replace(pattern, "").replace(/^[:№\-\s]+/, "").trim();
    }
  }

  return "";
}

function inferFields(text, fallbackFileName = "") {
  const contentText = text
    .split("\n")
    .filter((line) => !/^Файл:/i.test(line.trim()))
    .join("\n");
  const compact = contentText.replace(/\s+/g, " ");
  const date = compact.match(/\b([0-3]?\d[./-][01]?\d[./-](?:20)?\d{2})\b/)?.[1] || "";
  const numberLine = findLine(contentText, [
    /^(?:номер\s+письма|номер|№)\s*[:№-]*/i,
    /^(?:исх\.?|вх\.?)\s*[:№-]*/i
  ]);
  const number =
    numberLine.match(/[A-Za-zА-Яа-я0-9/-]{3,}/)?.[0] ||
    compact.match(/(?:№|номер|исх\.?|вх\.?)\s*[:№-]?\s*([A-Za-zА-Яа-я0-9/-]{3,})/i)?.[1] ||
    compact.match(/\b\d{1,4}[-/]\d{1,6}\b/)?.[0] ||
    "";
  const sender = findLine(contentText, [/^(?:отправитель|исходящий от|от)\s*[:\s-]*/i]) || "";
  const recipient = findLine(contentText, [/^(?:получатель|адресат|кому)\s*[:\s-]*/i]) || "";
  const subject =
    findLine(contentText, [/^(?:тема|касательно)\s*[:\s-]*/i, /^о\s+/i]) ||
    contentText.split("\n").map((line) => line.trim()).find((line) => line.length > 18 && line.length < 180) ||
    fallbackFileName.replace(/\.[^.]+$/, "");

  return [
    { label: "Отправитель", value: sender || "Требуется проверка" },
    { label: "Дата письма", value: date ? normalizeDate(date) : "Требуется проверка" },
    { label: "Номер письма", value: number || "Требуется проверка" },
    { label: "Тема", value: subject || "Требуется проверка" },
    { label: "Получатель", value: recipient || "ОсОО «Red Petroleum»" },
    { label: "Адресат", value: recipient || "Канцелярия" }
  ];
}

async function recognizeImage(file) {
  const buffer = Buffer.from(await file.arrayBuffer());

  return runQueuedOcr(async () => {
    const startedAt = Date.now();
    const worker = await getOcrWorker();

    try {
      const result = await worker.recognize(buffer, { rotateAuto: false });
      ocrState.jobs += 1;

      return {
        text: normalizeText(result.data.text),
        confidence: Math.round(result.data.confidence || 0),
        processingMs: Date.now() - startedAt
      };
    } catch (error) {
      const failedWorker = await ocrState.workerPromise.catch(() => null);
      await failedWorker?.terminate?.().catch(() => {});
      ocrState.workerPromise = null;
      ocrState.jobs = 0;
      throw error;
    }
  });
}

export async function POST(request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({
      confidence: 0,
      source: "No file",
      files: [],
      fields: inferFields("", ""),
      extractedText: "Выберите скан или изображение письма для OCR.",
      warnings: ["Файл не был передан."]
    });
  }

  const formData = await request.formData();
  const uploadedFiles = formData
    .getAll("files")
    .filter((file) => typeof file === "object" && file?.name);
  const files = uploadedFiles.map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream"
  }));
  const imageFiles = uploadedFiles.filter((file) => supportedImageTypes.has(file.type));
  const unsupportedFiles = uploadedFiles.filter((file) => !supportedImageTypes.has(file.type));

  if (imageFiles.length === 0) {
    return NextResponse.json({
      confidence: 0,
      source: "Unsupported file",
      files,
      fields: inferFields("", files[0]?.name || ""),
      extractedText: "Для настоящего OCR загрузите JPG, PNG, TIFF, BMP или WEBP. PDF-сканы подключим отдельным конвертером страниц.",
      warnings: unsupportedFiles.map((file) => `${file.name}: формат ${file.type || "не определен"} пока не распознается.`)
    });
  }

  const recognizedPages = [];
  const warnings = unsupportedFiles.map((file) => `${file.name}: формат ${file.type || "не определен"} пропущен.`);

  for (const file of imageFiles.slice(0, 3)) {
    try {
      const result = await recognizeImage(file);
      recognizedPages.push({ fileName: file.name, ...result });
    } catch (error) {
      warnings.push(`${file.name}: OCR не смог распознать файл (${error.message}).`);
    }
  }

  const extractedText = normalizeText(
    recognizedPages.map((page) => `Файл: ${page.fileName}\n${page.text}`).join("\n\n")
  );
  const confidence = recognizedPages.length
    ? Math.round(recognizedPages.reduce((sum, page) => sum + page.confidence, 0) / recognizedPages.length)
    : 0;

  return NextResponse.json({
    confidence,
    source: `Tesseract OCR rus+eng · ${recognizedPages.reduce((sum, page) => sum + (page.processingMs || 0), 0)} ms`,
    files,
    fields: inferFields(extractedText, files[0]?.name || ""),
    extractedText: extractedText || "Текст не найден. Проверьте качество скана: контраст, ориентацию, разрешение.",
    warnings
  });
}
