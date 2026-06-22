"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import {
  IconArchive,
  IconBell,
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconClipboardList,
  IconClock,
  IconDatabase,
  IconFileExport,
  IconFileInvoice,
  IconFileText,
  IconFilter,
  IconHome,
  IconInbox,
  IconLayoutDashboard,
  IconLogout,
  IconPencil,
  IconSearch,
  IconSend,
  IconSettings,
  IconShieldLock,
  IconSparkles,
  IconUpload,
  IconUsers
} from "@tabler/icons-react";
import { documents as seedDocuments, suggestedOcr, tags } from "../lib/mock-data";
import { defaultUsers, roleLabels } from "../lib/user-data";

const navItems = [
  ["dashboard", "Рабочий стол", IconHome, ""],
  ["self-service", "Подать письмо", IconFileText, "новое"],
  ["inbox", "Входящие", IconInbox, ""],
  ["outbox", "Исходящие", IconSend, ""],
  ["drafts", "Черновики", IconFileText, ""],
  ["approval", "На согласовании", IconClipboardList, ""],
  ["signature", "На подписи", IconPencil, ""],
  ["overdue", "Просроченные", IconClock, ""],
  ["archive", "Архив", IconArchive, ""],
  ["templates", "Шаблоны", IconFileInvoice, ""],
  ["directories", "Справочники", IconDatabase, ""],
  ["routes", "Маршруты", IconShieldLock, ""],
  ["reports", "Отчеты и аналитика", IconLayoutDashboard, ""],
  ["notifications", "Уведомления", IconBell, ""],
  ["settings", "Настройки", IconSettings, ""],
  ["users", "Пользователи и роли", IconUsers, "", true]
];

const statusMap = {
  "Новое": "blue",
  "На рассмотрении": "amber",
  "На исполнении": "sky",
  "Просрочено": "red",
  "На согласовании": "violet",
  "На подписи": "orange",
  "Исполнено": "green",
  "Отправлено": "green",
  "В архиве": "gray",
  "Черновик": "gray",
  "Черновик заявки": "gray",
  "На проверке канцелярии": "amber",
  "Вернули на уточнение": "orange",
  "Зарегистрировано": "green",
  "Отклонено": "red"
};

const routeSteps = ["Регистрация", "Рассмотрение", "Исполнение", "Согласование", "Подпись", "Архив"];

const viewTitles = {
  dashboard: ["Канцелярия / Делопроизводитель", "Рабочее место"],
  "self-service": ["Подать письмо", "Самостоятельная регистрация для сотрудников"],
  inbox: ["Входящие", "Зарегистрированные входящие письма"],
  outbox: ["Исходящие", "Исходящая корреспонденция компании"],
  drafts: ["Черновики", "Документы, сохраненные без отправки"],
  approval: ["На согласовании", "Документы, ожидающие внутреннего согласования"],
  signature: ["На подписи", "Документы, ожидающие подписи руководителя"],
  overdue: ["Просроченные", "Документы с истекшим сроком исполнения"],
  archive: ["Архив", "Завершенные и архивные документы"],
  templates: ["Шаблоны", "Типовые формы для регистрации"],
  directories: ["Справочники", "Контрагенты, подразделения и исполнители"],
  routes: ["Маршруты", "Правила движения документов"],
  reports: ["Отчеты и аналитика", "Контроль нагрузки и сроков"],
  notifications: ["Уведомления", "Системные события и напоминания"],
  settings: ["Настройки", "Параметры рабочего места"],
  users: ["Пользователи и роли", "Доступы сотрудников"]
};

const blankDocument = {
  id: "new",
  number: "",
  type: "Входящая",
  date: "",
  sender: "Министерство финансов Кыргызской Республики",
  recipient: "ОсОО «Red Petroleum»",
  subject: "О предоставлении отчетности за II квартал 2026 года",
  executor: "Касымов Р. А.",
  department: "Финансовый отдел",
  deadline: "10.06.2026",
  status: "Новое",
  overdue: false
};

const initialSelfForm = {
  sender: "Министерство финансов КР",
  recipient: "ОсОО «Red Petroleum»",
  subject: "О предоставлении отчетности за II квартал 2026 года",
  summary: "Просим зарегистрировать письмо и направить его в канцелярию для проверки реквизитов.",
  addressee: "Канцелярия",
  deadline: "10.06.2026"
};

const acceptedScanTypes = ".jpg,.jpeg,.png,.tif,.tiff,.bmp,.webp";

function formatFileSize(size = 0) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function getFileBadge(fileName = "") {
  const extension = fileName.split(".").pop()?.toUpperCase();
  return extension && extension.length <= 4 ? extension : "FILE";
}

function getOcrValue(ocr, label, fallback = "") {
  return ocr.fields.find((field) => field.label === label)?.value || fallback;
}

function normalizeOcrText(text = "") {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeOcrDate(value = "") {
  const [day, month, year] = value.replaceAll("-", ".").replaceAll("/", ".").split(".");
  if (!day || !month || !year) {
    return value;
  }

  return `${day.padStart(2, "0")}.${month.padStart(2, "0")}.${year.length === 2 ? `20${year}` : year}`;
}

function findOcrLine(text, patterns) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  for (const pattern of patterns) {
    const direct = lines.find((line) => pattern.test(line));
    if (direct) {
      return direct.replace(pattern, "").replace(/^[:№\-\s]+/, "").trim();
    }
  }

  return "";
}

function inferOcrFields(text, fallbackFileName = "") {
  const contentText = text
    .split("\n")
    .filter((line) => !/^Файл:/i.test(line.trim()))
    .join("\n");
  const compact = contentText.replace(/\s+/g, " ");
  const date = compact.match(/\b([0-3]?\d[./-][01]?\d[./-](?:20)?\d{2})\b/)?.[1] || "";
  const numberLine = findOcrLine(contentText, [
    /^(?:номер\s+письма|номер|№)\s*[:№-]*/i,
    /^(?:исх\.?|вх\.?)\s*[:№-]*/i
  ]);
  const number =
    numberLine.match(/[A-Za-zА-Яа-я0-9/-]{3,}/)?.[0] ||
    compact.match(/(?:№|номер|исх\.?|вх\.?)\s*[:№-]?\s*([A-Za-zА-Яа-я0-9/-]{3,})/i)?.[1] ||
    compact.match(/\b\d{1,4}[-/]\d{1,6}\b/)?.[0] ||
    "";
  const sender = findOcrLine(contentText, [/^(?:отправитель|исходящий от|от)\s*[:\s-]*/i]) || "";
  const recipient = findOcrLine(contentText, [/^(?:получатель|адресат|кому)\s*[:\s-]*/i]) || "";
  const subject =
    findOcrLine(contentText, [/^(?:тема|касательно)\s*[:\s-]*/i, /^о\s+/i]) ||
    contentText.split("\n").map((line) => line.trim()).find((line) => line.length > 18 && line.length < 180) ||
    fallbackFileName.replace(/\.[^.]+$/, "");

  return [
    { label: "Отправитель", value: sender || "Требуется проверка" },
    { label: "Дата письма", value: date ? normalizeOcrDate(date) : "Требуется проверка" },
    { label: "Номер письма", value: number || "Требуется проверка" },
    { label: "Тема", value: subject || "Требуется проверка" },
    { label: "Получатель", value: recipient || "ОсОО «Red Petroleum»" },
    { label: "Адресат", value: recipient || "Канцелярия" }
  ];
}

function createDocumentDraft(document = blankDocument) {
  return {
    type: document.type || "Входящая",
    date: document.date || new Intl.DateTimeFormat("ru-RU").format(new Date()),
    sender: document.sender || "",
    recipient: document.recipient || "ОсОО «Red Petroleum»",
    addressee: document.addressee || "Заместитель генерального директора",
    subject: document.subject || "",
    summary: document.summary || "Просят предоставить финансовую отчетность за II квартал 2026 года в соответствии с требованиями письма.",
    letterType: document.letterType || "Запрос",
    deadline: document.deadline || "10.06.2026",
    executor: document.executor || "Касымов Р. А.",
    department: document.department || "Финансовый отдел"
  };
}

async function postOcrToServer(files, timeoutMs = 18000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const response = await fetch("/api/ocr", {
      method: "POST",
      body: formData,
      signal: controller.signal
    });
    const raw = await response.text();
    let payload = {};

    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch {
      payload = { error: raw.slice(0, 160) };
    }

    if (!response.ok) {
      throw new Error(payload.error || `OCR вернул ошибку ${response.status}`);
    }

    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Серверный OCR не ответил за 18 секунд.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function postJsonWithTimeout(url, payload, timeoutMs = 12000, method = "POST") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Сервер вернул ошибку ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Сервер не ответил за 12 секунд. Проверьте соединение и попробуйте еще раз.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getBrowserOcrState() {
  if (!globalThis.__redPetroleumBrowserOcrState) {
    globalThis.__redPetroleumBrowserOcrState = {
      workerPromise: null,
      queue: Promise.resolve(),
      jobs: 0
    };
  }

  return globalThis.__redPetroleumBrowserOcrState;
}

async function getBrowserOcrWorker() {
  const state = getBrowserOcrState();

  if (!state.workerPromise || state.jobs >= 100) {
    if (state.workerPromise) {
      const staleWorker = await state.workerPromise.catch(() => null);
      await staleWorker?.terminate?.().catch(() => {});
    }

    const { createWorker } = await import("tesseract.js");
    state.workerPromise = createWorker("rus", 1, {
      langPath: "https://tessdata.projectnaptha.com/4.0.0_fast",
      logger: () => {}
    });
    state.jobs = 0;
  }

  return state.workerPromise;
}

async function runBrowserOcr(task) {
  const state = getBrowserOcrState();
  const queuedTask = state.queue.then(async () => {
    const worker = await getBrowserOcrWorker();

    try {
      const result = await task(worker);
      state.jobs += 1;
      return result;
    } catch (error) {
      const failedWorker = await state.workerPromise?.catch(() => null);
      await failedWorker?.terminate?.().catch(() => {});
      state.workerPromise = null;
      state.jobs = 0;
      throw error;
    }
  });

  state.queue = queuedTask.catch(() => {});
  return queuedTask;
}

async function prepareImageForOcr(file) {
  if (typeof window === "undefined" || !file.type?.startsWith("image/") || file.type === "image/tiff") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1800;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));

    if (scale >= 1) {
      bitmap.close?.();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    return await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", 0.88);
    });
  } catch {
    return file;
  }
}

async function recognizeOcrInBrowser(files) {
  const imageFiles = files.filter((file) => file.type?.startsWith("image/")).slice(0, 3);

  if (imageFiles.length === 0) {
    throw new Error("Для OCR загрузите изображение JPG, PNG, TIF, BMP или WEBP.");
  }

  const startedAt = Date.now();
  const pages = [];

  for (const file of imageFiles) {
    const result = await runBrowserOcr(async (worker) => {
      const preparedImage = await prepareImageForOcr(file);
      return worker.recognize(preparedImage, { rotateAuto: false });
    });
    pages.push({
      fileName: file.name,
      text: normalizeOcrText(result.data.text),
      confidence: Math.round(result.data.confidence || 0)
    });
  }

  const extractedText = normalizeOcrText(
    pages.map((page) => `Файл: ${page.fileName}\n${page.text}`).join("\n\n")
  );
  const confidence = pages.length
    ? Math.round(pages.reduce((sum, page) => sum + page.confidence, 0) / pages.length)
    : 0;

  return {
    confidence,
    source: `Browser OCR rus · ${Date.now() - startedAt} ms`,
    files: files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream"
    })),
    fields: inferOcrFields(extractedText, files[0]?.name || ""),
    extractedText: extractedText || "Текст не найден. Проверьте качество скана: контраст, ориентацию, разрешение.",
    warnings: ["OCR выполняется в браузере. Повторные распознавания будут быстрее после прогрева."]
  };
}

async function recognizeOcr(files) {
  if (files.length > 0 && typeof window !== "undefined") {
    return recognizeOcrInBrowser(files);
  }

  try {
    return await postOcrToServer(files);
  } catch (serverError) {
    if (files.length === 0) {
      throw serverError;
    }

    try {
      const browserPayload = await recognizeOcrInBrowser(files);
      return {
        ...browserPayload,
        warnings: [serverError.message, ...(browserPayload.warnings || [])]
      };
    } catch (browserError) {
      throw new Error(`${serverError.message} ${browserError.message}`);
    }
  }
}

function StatusChip({ status }) {
  return <span className={clsx("status-chip", statusMap[status] || "gray")}>{status}</span>;
}

function LoginScreen({ onAuthenticated }) {
  const [email, setEmail] = useState("arseniy.maslov@redpetroleum.kg");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState("check");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        mode: step === "set-password" ? "set-password" : showPassword ? "login" : "check"
      })
    });
    const payload = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setMessage(payload.error || "Не удалось войти.");
      return;
    }

    if (payload.requiresPasswordSetup) {
      setStep("set-password");
      setShowPassword(true);
      setPassword("");
      setMessage("Первый вход: придумайте пароль для этой учетной записи.");
      return;
    }

    if (!showPassword && step === "check") {
      setShowPassword(true);
      setPassword("");
      setMessage("Пользователь найден. Введите пароль.");
      return;
    }

    onAuthenticated(payload.user);
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <Image src="/logo.png" alt="Red Petroleum" width={176} height={62} priority />
        <div>
          <h1>Вход в ЭДО</h1>
          <p>Используйте корпоративную почту Red Petroleum.</p>
        </div>
        <form onSubmit={submit} className="login-form">
          <Field label="Корпоративная почта">
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
          </Field>
          {step === "set-password" || showPassword ? (
            <Field label={step === "set-password" ? "Новый пароль" : "Пароль"}>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                minLength={8}
                placeholder="Минимум 8 символов"
              />
            </Field>
          ) : null}
          {message ? <p className="login-message">{message}</p> : null}
          <button className="primary-button" type="submit">
            {isLoading ? "Проверяем..." : step === "set-password" ? "Создать пароль и войти" : "Продолжить"}
          </button>
          {step === "check" && !showPassword ? (
            <button type="button" className="ghost-button" onClick={() => setShowPassword(true)}>
              У меня уже есть пароль
            </button>
          ) : null}
        </form>
        <div className="login-users">
          <strong>Доступы заведены:</strong>
          <span>arseniy.maslov@redpetroleum.kg — администратор</span>
          <span>zarina.akmatova@redpetroleum.kg — делопроизводитель</span>
        </div>
      </section>
    </main>
  );
}

function Sidebar({ activeView, setActiveView, user }) {
  const canAdmin = user?.role === "admin";

  return (
    <aside className="sidebar">
      <div className="brand">
        <Image src="/logo.png" alt="Red Petroleum" width={160} height={55} priority />
      </div>
      <nav className="nav-list" aria-label="Основная навигация">
        {navItems.filter(([, , , , adminOnly]) => canAdmin || !adminOnly).map(([view, label, Icon, count]) => (
          <button
            key={label}
            aria-label={label}
            data-view={view}
            className={clsx("nav-item", activeView === view && "active")}
            onClick={() => setActiveView(view)}
          >
            <Icon size={18} stroke={1.85} />
            <span>{label}</span>
            {count ? <strong>{count}</strong> : null}
          </button>
        ))}
      </nav>
      <button className="collapse-button">
        <IconChevronRight size={17} />
        Свернуть меню
      </button>
    </aside>
  );
}

function Topbar({ title, subtitle, user, onLogout, userName = "Алия М.", userRole = "Делопроизводитель" }) {
  const visibleName = user?.fullName || userName;
  const visibleRole = user?.roleLabel || roleLabels[user?.role] || userRole;

  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar-actions">
        <button className="icon-button" aria-label="Уведомления">
          <IconBell size={22} />
          <span className="notification-dot">6</span>
        </button>
        <button className="icon-button" aria-label="Справка">
          <span className="question">?</span>
        </button>
        <div className="profile">
          <span className="avatar">{visibleName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
          <div>
            <strong>{visibleName}</strong>
            <small>{visibleRole}</small>
          </div>
          <IconChevronDown size={16} />
        </div>
        <button className="icon-button" aria-label="Выйти" onClick={onLogout} title="Выйти">
          <IconLogout size={20} />
        </button>
      </div>
    </header>
  );
}

function Registry({ documents, selectedId, setSelectedId, search, setSearch, filter, setFilter }) {
  return (
    <section className="registry-panel">
      <div className="section-heading">
        <h2>Реестр корреспонденции</h2>
        <button className="ghost-button">
          <IconFilter size={17} />
          Фильтры
        </button>
      </div>
      <div className="tabs">
        {["Все", "Входящие", "Исходящие"].map((item) => (
          <button
            key={item}
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <label className="search-field">
        <IconSearch size={18} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по теме, отправителю, номеру..."
        />
      </label>
      <div className="registry-table" role="table" aria-label="Реестр документов">
        <div className="registry-row table-head" role="row">
          <span>Номер / Дата</span>
          <span>Тема</span>
          <span>Статус</span>
        </div>
        {documents.map((doc) => (
          <button
            key={doc.id}
            className={clsx("registry-row", selectedId === doc.id && "selected", doc.overdue && "overdue")}
            onClick={() => setSelectedId(doc.id)}
            role="row"
          >
            <span>
              <strong>{doc.number}</strong>
              <small>{doc.date}</small>
            </span>
            <span>
              <strong>{doc.subject}</strong>
              <small>{doc.sender}</small>
            </span>
            <span className="row-status">
              <StatusChip status={doc.status} />
              <IconChevronRight size={16} />
            </span>
          </button>
        ))}
        {documents.length === 0 ? (
          <div className="empty-state">
            <strong>Реестр пока пустой</strong>
            <span>Создайте первый документ или отправьте заявку на регистрацию.</span>
          </div>
        ) : null}
      </div>
      <footer className="pagination">
        <span>Показано {documents.length} из {documents.length}</span>
        <div>
          <button>‹</button>
          <button className="active">1</button>
          <button>2</button>
          <button>3</button>
          <button>4</button>
          <button>5</button>
          <button>...</button>
          <button>›</button>
        </div>
      </footer>
    </section>
  );
}

function Field({ label, children, required }) {
  return (
    <label className="field">
      <span>
        {label}
        {required ? <b>*</b> : null}
      </span>
      {children}
    </label>
  );
}

function DocumentForm({ selected, draft, onDraftChange, savedMessage, onSaveDraft, onSave, onSendManager }) {
  function updateDraft(field, value) {
    onDraftChange((current) => ({ ...current, [field]: value }));
  }

  return (
    <section className="form-panel">
      <div className="section-heading accent">
        <h2>{selected.id === "new" ? "Новый входящий документ" : selected.subject}</h2>
        <IconChevronDown size={18} />
      </div>
      <div className="form-grid">
        <Field label="Регистрационный номер">
          <div className="readonly-input">
            <span>{selected.number || "Будет присвоен автоматически"}</span>
            <IconShieldLock size={17} />
          </div>
          <small className="hint">Присваивается автоматически</small>
        </Field>
        <Field label="Дата регистрации" required>
          <div className="control">
            <input value={draft.date} onChange={(event) => updateDraft("date", event.target.value)} />
            <IconCalendar size={17} />
          </div>
        </Field>
        <Field label="Отправитель" required>
          <select value={draft.sender} onChange={(event) => updateDraft("sender", event.target.value)}>
            <option>{draft.sender}</option>
            <option>Министерство финансов Кыргызской Республики</option>
            <option>Министерство финансов КР</option>
            <option>ГНС при МФ КР</option>
          </select>
        </Field>
        <Field label="Получатель">
          <select value={draft.recipient} onChange={(event) => updateDraft("recipient", event.target.value)}>
            <option>ОсОО «Red Petroleum»</option>
            <option>Red Petroleum Holding</option>
          </select>
        </Field>
        <Field label="Адресат">
          <select value={draft.addressee} onChange={(event) => updateDraft("addressee", event.target.value)}>
            <option>Заместитель генерального директора</option>
            <option>Канцелярия</option>
            <option>Финансовый отдел</option>
            <option>Юридический отдел</option>
          </select>
        </Field>
        <Field label="Тема / Заголовок" required>
          <input value={draft.subject} onChange={(event) => updateDraft("subject", event.target.value)} maxLength={250} />
          <small className="counter">{draft.subject.length} / 250</small>
        </Field>
        <Field label="Краткое содержание">
          <textarea value={draft.summary} onChange={(event) => updateDraft("summary", event.target.value)} maxLength={1000} />
          <small className="counter">{draft.summary.length} / 1000</small>
        </Field>
        <div className="two-columns">
          <Field label="Тип письма" required>
            <select value={draft.letterType} onChange={(event) => updateDraft("letterType", event.target.value)}>
              <option>Запрос</option>
              <option>Претензия</option>
              <option>Уведомление</option>
            </select>
          </Field>
          <Field label="Срок исполнения" required>
            <div className="control">
              <input value={draft.deadline} onChange={(event) => updateDraft("deadline", event.target.value)} />
              <IconCalendar size={17} />
            </div>
          </Field>
        </div>
        <div className="two-columns">
          <Field label="Ответственный исполнитель" required>
            <select value={draft.executor} onChange={(event) => updateDraft("executor", event.target.value)}>
              <option>Касымов Р. А.</option>
              <option>Ибраева Д. Т.</option>
              <option>Садыков Н. Б.</option>
            </select>
          </Field>
          <Field label="Подразделение" required>
            <select value={draft.department} onChange={(event) => updateDraft("department", event.target.value)}>
              <option>Финансовый отдел</option>
              <option>Юридический отдел</option>
              <option>HR</option>
            </select>
          </Field>
        </div>
        <Field label="Теги">
          <div className="tag-input">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag}>{tag}<button>x</button></span>
            ))}
            <IconChevronDown size={16} />
          </div>
        </Field>
        <Field label="Связанный документ">
          <select defaultValue="">
            <option value="">Начните вводить номер или тему...</option>
            <option>ИСХ-2026-05-0034</option>
          </select>
        </Field>
      </div>
      <div className="route">
        <h3>Маршрут согласования</h3>
        <div className="route-line">
          {routeSteps.map((step, index) => (
            <div key={step} className={clsx("route-step", index === 0 && "active")}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
              {index === 0 ? <small>Текущий шаг</small> : null}
            </div>
          ))}
        </div>
      </div>
      <footer className="form-actions">
        {savedMessage ? <span className="save-message">{savedMessage}</span> : null}
        <button className="secondary-button" onClick={onSaveDraft}>Сохранить черновик</button>
        <button className="primary-button" onClick={onSave}>Сохранить</button>
        <button className="outline-button" onClick={onSendManager}>Направить руководителю</button>
      </footer>
    </section>
  );
}

function OcrPanel({ ocr, onRunOcr, isProcessing, onExport }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const attachmentFiles = selectedFiles.length > 0 ? selectedFiles : ocr.files || [];

  function handleFilesChange(event) {
    setSelectedFiles(Array.from(event.target.files || []));
  }

  return (
    <section className="ocr-panel">
      <div className="section-heading">
        <h2>OCR и вложения</h2>
        <IconChevronDown size={18} />
      </div>
      <label className={clsx("upload-zone", selectedFiles.length > 0 && "has-files")}>
        <input
          className="file-input"
          type="file"
          accept={acceptedScanTypes}
          multiple
          onChange={handleFilesChange}
        />
        <IconUpload size={48} stroke={1.6} />
        <strong>{selectedFiles.length > 0 ? "Файл выбран" : "Нажмите, чтобы выбрать скан"}</strong>
        <small>
          {selectedFiles.length > 0
            ? `${selectedFiles.length} файл(ов) готово к распознаванию`
            : "JPG, PNG, TIF, BMP, WEBP (до 20 МБ)"}
        </small>
      </label>
      <div className="ocr-actions">
        <button className="primary-button" onClick={() => onRunOcr(selectedFiles)} disabled={isProcessing || selectedFiles.length === 0}>
          <IconSparkles size={17} />
          {isProcessing ? "Распознаем..." : "Запустить OCR"}
        </button>
        <button className="ghost-button" onClick={() => onRunOcr([])} disabled={isProcessing}>Импорт со сканера Konica</button>
        <button className="ghost-button" onClick={onExport}>
          <IconFileExport size={17} />
          Excel
        </button>
      </div>
      <div className="confidence">
        <div>
          <span>Распознавание текста {ocr.source ? `· ${ocr.source}` : ""}</span>
          <strong>Уверенность: {ocr.confidence}%</strong>
        </div>
        <progress value={ocr.confidence} max="100" />
      </div>
      {ocr.warnings?.length ? (
        <div className="ocr-warnings">
          {ocr.warnings.map((warning) => (
            <span key={warning}>{warning}</span>
          ))}
        </div>
      ) : null}
      <div className="suggestions">
        <h3>Предлагаемые данные <small>(проверьте и подтвердите)</small></h3>
        {ocr.fields.map((item) => (
          <div className="suggestion-row" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <IconCheck size={17} />
          </div>
        ))}
      </div>
      {ocr.extractedText ? (
        <div className="ocr-text">
          <h3>Распознанный текст</h3>
          <pre>{ocr.extractedText}</pre>
        </div>
      ) : null}
      <div className="attachments">
        <h3>Вложения ({attachmentFiles.length})</h3>
        {attachmentFiles.length > 0 ? (
          attachmentFiles.map((file) => (
            <div className="attachment" key={`${file.name}-${file.size}`}>
              <span>{getFileBadge(file.name)}</span>
              <div>
                <strong>{file.name}</strong>
                <small>{file.type || "Файл"} · {formatFileSize(file.size)} · готов к индексации</small>
              </div>
              <button>•••</button>
            </div>
          ))
        ) : (
          <div className="attachment empty">
            <span>+</span>
            <div>
              <strong>Скан еще не выбран</strong>
              <small>Выберите PDF, фото или TIFF для распознавания.</small>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewQueue({ requests, isReviewing, onReview }) {
  const pendingRequests = requests.filter((request) => request.status === "На проверке канцелярии");
  const latestRequests = requests.slice(0, 4);

  return (
    <section className="review-queue">
      <div className="section-heading">
        <h2>Проверка канцелярией</h2>
        <span className="status-chip amber">{pendingRequests.length} на проверке</span>
      </div>
      {pendingRequests.length > 0 ? (
        <div className="review-cards">
          {pendingRequests.map((request) => (
            <article className="review-card" key={request.id}>
              <div className="review-card-head">
                <div>
                  <span>{request.request_number}</span>
                  <strong>{request.subject}</strong>
                </div>
                <StatusChip status={request.status} />
              </div>
              <dl>
                <div><dt>Тип</dt><dd>{request.direction}</dd></div>
                <div><dt>Отправитель</dt><dd>{request.sender}</dd></div>
                <div><dt>Получатель</dt><dd>{request.recipient}</dd></div>
                <div><dt>Заявитель</dt><dd>{request.owner || "Сотрудник"}</dd></div>
              </dl>
              <div className="review-actions">
                <button className="primary-button" onClick={() => onReview(request.id, "approve")} disabled={isReviewing}>
                  <IconCheck size={17} />
                  Зарегистрировать
                </button>
                <button className="secondary-button" onClick={() => onReview(request.id, "return")} disabled={isReviewing}>
                  Вернуть на уточнение
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state compact">
          <strong>Нет заявок на проверку</strong>
          <span>Когда сотрудник отправит письмо, оно появится здесь для регистрации.</span>
        </div>
      )}
      {latestRequests.length > pendingRequests.length ? (
        <div className="review-history">
          <h3>Последние заявки</h3>
          {latestRequests.filter((request) => request.status !== "На проверке канцелярии").map((request) => (
            <div key={request.id}>
              <span>{request.request_number}</span>
              <strong>{request.official_number || request.subject}</strong>
              <StatusChip status={request.status} />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function filterDocumentsForView(documents, view) {
  return documents.filter((doc) => {
    if (view === "inbox") return doc.type === "Входящая";
    if (view === "outbox") return doc.type === "Исходящая";
    if (view === "drafts") return doc.status === "Черновик";
    if (view === "approval") return doc.status === "На согласовании";
    if (view === "signature") return doc.status === "На подписи";
    if (view === "overdue") return doc.overdue || doc.status === "Просрочено";
    if (view === "archive") return doc.status === "В архиве" || doc.status === "Исполнено" || doc.status === "Отправлено";
    return true;
  });
}

function DocumentsModule({ view, documents, selectedId, setSelectedId, setActiveView }) {
  const [actionMessage, setActionMessage] = useState("");
  const visibleDocuments = filterDocumentsForView(documents, view);
  const selected = visibleDocuments.find((doc) => doc.id === selectedId) || visibleDocuments[0];
  const [title, subtitle] = viewTitles[view] || viewTitles.dashboard;

  function showAction(message) {
    setActionMessage(message);
    setTimeout(() => setActionMessage(""), 2600);
  }

  return (
    <section className="module-page">
      <div className="module-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span className="module-count">{visibleDocuments.length} документов</span>
      </div>
      <div className="module-layout">
        <div className="module-list">
          {visibleDocuments.map((doc) => (
            <button
              key={doc.id}
              className={clsx("module-row", selected?.id === doc.id && "active")}
              onClick={() => setSelectedId(doc.id)}
            >
              <span>
                <strong>{doc.number}</strong>
                <small>{doc.date}</small>
              </span>
              <span>
                <strong>{doc.subject}</strong>
                <small>{doc.sender || doc.recipient}</small>
              </span>
              <StatusChip status={doc.status} />
            </button>
          ))}
          {visibleDocuments.length === 0 ? (
            <div className="empty-state">
              <strong>В этом разделе пока пусто</strong>
              <span>Когда появятся подходящие документы, они отобразятся здесь.</span>
            </div>
          ) : null}
        </div>
        <aside className="module-detail">
          {selected ? (
            <>
              <div className="detail-head">
                <span>{selected.number}</span>
                <StatusChip status={selected.status} />
              </div>
              <h3>{selected.subject}</h3>
              <dl>
                <div><dt>Тип</dt><dd>{selected.type}</dd></div>
                <div><dt>Дата</dt><dd>{selected.date}</dd></div>
                <div><dt>Отправитель</dt><dd>{selected.sender || "Не указан"}</dd></div>
                <div><dt>Получатель</dt><dd>{selected.recipient || "Не указан"}</dd></div>
                <div><dt>Исполнитель</dt><dd>{selected.executor || "Не назначен"}</dd></div>
                <div><dt>Срок</dt><dd>{selected.deadline || "Без срока"}</dd></div>
              </dl>
              <div className="module-actions">
                <button className="secondary-button" onClick={() => setActiveView("dashboard")}>Открыть карточку</button>
                <button className="primary-button" onClick={() => showAction("Маршрут подготовлен. В тестовом режиме действие зафиксировано без отправки.")}>Передать дальше</button>
              </div>
              {actionMessage ? <div className="module-message">{actionMessage}</div> : null}
            </>
          ) : (
            <div className="empty-state compact">
              <strong>Документ не выбран</strong>
              <span>Выберите документ в списке слева.</span>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function TemplatesModule() {
  const [message, setMessage] = useState("");
  const templates = [
    ["Входящее письмо", "Регистрация внешнего письма, заявления или уведомления"],
    ["Исходящее письмо", "Подготовка исходящего номера и отправка адресату"],
    ["Служебная записка", "Внутреннее обращение между подразделениями"],
    ["Акт приема-передачи", "Фиксация передачи документов или материалов"]
  ];

  return (
    <section className="module-page">
      <div className="module-header">
        <div>
          <h2>Шаблоны</h2>
          <p>Типовые формы для быстрого создания документов.</p>
        </div>
      </div>
      <div className="module-card-grid">
        {templates.map(([name, description]) => (
          <article className="module-card" key={name}>
            <IconFileInvoice size={24} />
            <h3>{name}</h3>
            <p>{description}</p>
            <button className="secondary-button" onClick={() => {
              setMessage(`Шаблон «${name}» выбран. Для теста можно создать документ на рабочем столе.`);
              setTimeout(() => setMessage(""), 2800);
            }}>Создать</button>
          </article>
        ))}
      </div>
      {message ? <div className="module-message floating">{message}</div> : null}
    </section>
  );
}

function DirectoriesModule() {
  const groups = [
    ["Контрагенты", ["Министерство финансов КР", "ГНС при МФ КР", "Konica Scanner", "Red Petroleum Holding"]],
    ["Подразделения", ["Канцелярия", "Финансовый отдел", "Юридический отдел", "Операционный отдел"]],
    ["Исполнители", ["Арсений Маслов", "Зарина Акматова", "Данияр К.", "Касымов Р. А."]]
  ];

  return (
    <section className="module-page">
      <div className="module-header">
        <div>
          <h2>Справочники</h2>
          <p>Базовые списки для заполнения карточек документов.</p>
        </div>
      </div>
      <div className="directory-grid">
        {groups.map(([title, items]) => (
          <article className="directory-card" key={title}>
            <h3>{title}</h3>
            {items.map((item) => <div key={item}>{item}</div>)}
          </article>
        ))}
      </div>
    </section>
  );
}

function RoutesModule() {
  const routes = [
    ["Входящее письмо", "Канцелярия", "Заместитель генерального директора", "Исполнитель", "Архив"],
    ["Исходящее письмо", "Автор", "Согласование", "Подпись", "Отправка"],
    ["Служебная записка", "Автор", "Руководитель отдела", "Исполнитель", "Закрытие"]
  ];

  return (
    <section className="module-page">
      <div className="module-header">
        <div>
          <h2>Маршруты</h2>
          <p>Правила движения документов по подразделениям.</p>
        </div>
      </div>
      <div className="route-board">
        {routes.map(([name, ...steps]) => (
          <article className="route-card" key={name}>
            <h3>{name}</h3>
            <div>
              {steps.map((step, index) => (
                <span key={step}>{index + 1}. {step}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReportsModule({ documents, requests, onExport }) {
  const pending = requests.filter((request) => request.status === "На проверке канцелярии").length;
  const overdue = documents.filter((doc) => doc.overdue || doc.status === "Просрочено").length;
  const outgoing = documents.filter((doc) => doc.type === "Исходящая").length;

  return (
    <section className="module-page">
      <div className="module-header">
        <div>
          <h2>Отчеты и аналитика</h2>
          <p>Быстрый срез по документообороту.</p>
        </div>
        <button className="ghost-button" onClick={onExport}><IconFileExport size={17} /> Excel</button>
      </div>
      <div className="metrics-grid">
        <article><span>Всего документов</span><strong>{documents.length}</strong></article>
        <article><span>На проверке</span><strong>{pending}</strong></article>
        <article><span>Исходящие</span><strong>{outgoing}</strong></article>
        <article><span>Просроченные</span><strong>{overdue}</strong></article>
      </div>
      <div className="module-card">
        <h3>Нагрузка по этапам</h3>
        {routeSteps.map((step, index) => (
          <div className="report-line" key={step}>
            <span>{step}</span>
            <progress value={Math.max(12, documents.length * 8 - index * 7)} max="100" />
          </div>
        ))}
      </div>
    </section>
  );
}

function NotificationsModule({ requests }) {
  const items = [
    ...requests.slice(0, 5).map((request) => [`${request.request_number}`, request.status, request.subject]),
    ["Система", "OCR готов", "Можно тестировать распознавание на новых сканах"],
    ["Система", "Доступы", "Администратор может открыть раздел пользователей"]
  ];

  return (
    <section className="module-page">
      <div className="module-header">
        <div>
          <h2>Уведомления</h2>
          <p>Последние события по заявкам и документам.</p>
        </div>
      </div>
      <div className="notification-list">
        {items.map(([source, status, text]) => (
          <article key={`${source}-${text}`}>
            <IconBell size={18} />
            <div>
              <span>{source} · {status}</span>
              <strong>{text}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsModule({ users }) {
  const employees = users;
  const [departments, setDepartments] = useState([
    {
      name: "Канцелярия",
      code: "01-01",
      approver: "zarina.akmatova@redpetroleum.kg",
      executor: "zarina.akmatova@redpetroleum.kg"
    },
    {
      name: "Отдел УЧР",
      code: "02-01",
      approver: "ainura.usengazieva@redpetroleum.kg",
      executor: "alima.mambetakunova@redpetroleum.kg"
    }
  ]);
  const [departmentDraft, setDepartmentDraft] = useState({
    name: "",
    code: "",
    approver: employees[0]?.email || "",
    executor: employees[0]?.email || ""
  });
  const [message, setMessage] = useState("");

  function updateDraft(field, value) {
    setDepartmentDraft((current) => ({ ...current, [field]: value }));
  }

  function createDepartment() {
    if (!departmentDraft.name.trim() || !departmentDraft.code.trim()) {
      setMessage("Укажите название отдела и индекс номенклатуры.");
      setTimeout(() => setMessage(""), 2600);
      return;
    }

    setDepartments((current) => [
      {
        name: departmentDraft.name.trim(),
        code: departmentDraft.code.trim(),
        approver: departmentDraft.approver || employees[0]?.email || "",
        executor: departmentDraft.executor || departmentDraft.approver || employees[0]?.email || ""
      },
      ...current
    ]);
    setDepartmentDraft({
      name: "",
      code: "",
      approver: employees[0]?.email || "",
      executor: employees[0]?.email || ""
    });
    setMessage("Отдел создан, руководитель для согласования и исполнитель назначены.");
    setTimeout(() => setMessage(""), 3000);
  }

  return (
    <section className="module-page">
      <div className="module-header">
        <div>
          <h2>Настройки</h2>
          <p>Параметры регистрации и рабочего места.</p>
        </div>
      </div>
      <div className="settings-grid">
        {[
          ["Нумерация", "Автоматически присваивать ВХ/ИСХ номера по месяцу"],
          ["OCR", "Распознавать сканы в браузере без ожидания Vercel"],
          ["Отделы", "Разрешить делопроизводителю создавать отделы"],
          ["Маршрут отдела", "Назначать руководителя для согласования и исполнителя"]
        ].map(([title, text]) => (
          <label className="setting-row" key={title}>
            <input type="checkbox" defaultChecked />
            <span><strong>{title}</strong><small>{text}</small></span>
          </label>
        ))}
      </div>
      <div className="nomenclature-panel">
        <div className="module-header compact">
          <div>
            <h2>Отделы и номенклатура</h2>
            <p>При создании отдела указывается индекс, руководитель отдела как согласующее лицо и исполнитель.</p>
          </div>
        </div>
        <div className="department-form">
          <Field label="Название отдела" required>
            <input
              value={departmentDraft.name}
              onChange={(event) => updateDraft("name", event.target.value)}
              placeholder="Например: Отдел снабжения"
            />
          </Field>
          <Field label="Индекс номенклатуры" required>
            <input
              value={departmentDraft.code}
              onChange={(event) => updateDraft("code", event.target.value)}
              placeholder="Например: 03-04"
            />
          </Field>
          <Field label="Руководитель отдела / согласующее лицо">
            <select value={departmentDraft.approver} onChange={(event) => updateDraft("approver", event.target.value)}>
              {employees.map((employee) => (
                <option key={employee.email} value={employee.email}>{employee.fullName} · {employee.email}</option>
              ))}
            </select>
          </Field>
          <Field label="Исполнитель">
            <select value={departmentDraft.executor} onChange={(event) => updateDraft("executor", event.target.value)}>
              {employees.map((employee) => (
                <option key={employee.email} value={employee.email}>{employee.fullName} · {employee.email}</option>
              ))}
            </select>
          </Field>
          <button className="primary-button" onClick={createDepartment}>Создать отдел</button>
        </div>
        {message ? <div className="module-message floating">{message}</div> : null}
        <div className="department-table">
          {departments.map((department) => {
            const approver = users.find((item) => item.email === department.approver);
            const executor = users.find((item) => item.email === department.executor);
            return (
              <article key={`${department.name}-${department.code}`}>
                <div>
                  <strong>{department.name}</strong>
                  <small>Номенклатура {department.code}</small>
                </div>
                <div>
                  <span>Согласующее лицо</span>
                  <strong>{approver?.fullName || department.approver}</strong>
                  <small>{department.approver}</small>
                </div>
                <div>
                  <span>Исполнитель</span>
                  <strong>{executor?.fullName || department.executor}</strong>
                  <small>{department.executor}</small>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function UsersModule({ user }) {
  const users = defaultUsers;

  return (
    <section className="module-page">
      <div className="module-header">
        <div>
          <h2>Пользователи и роли</h2>
          <p>Доступы для тестирования сотрудниками.</p>
        </div>
        <span className="module-count">{user.roleLabel || roleLabels[user.role] || user.role}</span>
      </div>
      <div className="user-table">
        {users.map((item) => (
          <article key={item.email}>
            <span className="avatar">{item.fullName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
            <div>
              <strong>{item.fullName}</strong>
              <small>{item.email}</small>
            </div>
            <StatusChip status={item.role === "admin" ? "Новое" : "Зарегистрировано"} />
            <span>{roleLabels[item.role] || item.role}</span>
            <small>{item.department}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function SelfServicePortal({ onRequestCreated }) {
  const [direction, setDirection] = useState("Входящее письмо");
  const [step, setStep] = useState(1);
  const [ocr, setOcr] = useState(suggestedOcr);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitState, setSubmitState] = useState("idle");
  const [submitError, setSubmitError] = useState("");
  const [requestNumber, setRequestNumber] = useState("Будет присвоен после отправки");
  const [requests, setRequests] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selfForm, setSelfForm] = useState(initialSelfForm);

  useEffect(() => {
    async function loadRequests() {
      const response = await fetch("/api/submissions");
      if (response.ok) {
        const payload = await response.json();
        setRequests(payload.requests || []);
      }
    }

    loadRequests();
  }, []);

  function handleSelfFilesChange(event) {
    setSelectedFiles(Array.from(event.target.files || []));
  }

  function updateSelfForm(field, value) {
    setSelfForm((current) => ({ ...current, [field]: value }));
  }

  async function runSelfOcr() {
    setIsProcessing(true);
    setOcr((current) => ({
      ...current,
      source: "Browser OCR",
      warnings: ["Распознавание выполняется в браузере. Первый запуск может занять дольше из-за загрузки языковых данных."]
    }));

    try {
      const payload = await recognizeOcr(selectedFiles);

      setOcr(payload);
      setSelfForm((current) => ({
        ...current,
        sender: getOcrValue(payload, "Отправитель", current.sender),
        recipient: getOcrValue(payload, "Получатель", current.recipient),
        subject: getOcrValue(payload, "Тема", current.subject),
        addressee: getOcrValue(payload, "Адресат", current.addressee)
      }));
      setStep(2);
    } catch (error) {
      setOcr((current) => ({
        ...current,
        confidence: 0,
        source: "OCR error",
        warnings: [error.message || "Не удалось распознать файл."],
        extractedText: "OCR не выполнен. Попробуйте другой JPG/PNG или повторите позже."
      }));
    } finally {
      setIsProcessing(false);
    }
  }

  async function submitRequest() {
    setSubmitState("sending");
    setSubmitError("");

    try {
      const payload = await postJsonWithTimeout("/api/submissions", {
        direction,
        ...selfForm,
        owner: "Данияр К.",
        attachments: selectedFiles.map((file) => ({ name: file.name, size: file.size, type: file.type }))
      });
      const createdRequest = payload.request;
      setRequestNumber(createdRequest.request_number);
      setRequests((current) => [createdRequest, ...current]);
      onRequestCreated?.(createdRequest);
      setSubmitState("sent");
      setStep(3);
    } catch (error) {
      setSubmitError(error.message || "Не удалось отправить заявку.");
      setSubmitState("idle");
    }
  }

  return (
    <section className="self-service">
      <div className="self-main">
        <div className="self-header">
          <div>
            <h2>Самостоятельная подача письма</h2>
            <p>Заполните заявку, приложите файл и отправьте в канцелярию на проверку.</p>
          </div>
          <div className="request-badge">
            <span>Временный номер</span>
            <strong>{requestNumber}</strong>
          </div>
        </div>

        <div className="direction-switch">
          {["Входящее письмо", "Исходящее письмо"].map((item) => (
            <button
              key={item}
              className={direction === item ? "active" : ""}
              onClick={() => setDirection(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="self-steps">
          {["Файл", "Данные", "Отправка"].map((item, index) => (
            <button
              key={item}
              className={clsx(step === index + 1 && "active", step > index + 1 && "done")}
              onClick={() => {
                if (index === 0 || selectedFiles.length > 0 || step > index + 1) {
                  setStep(index + 1);
                }
              }}
            >
              <span>{index + 1}</span>
              {item}
            </button>
          ))}
        </div>

        <div className="self-content">
          {step === 1 ? (
            <div className="self-upload-grid">
              <label className={clsx("upload-zone self-upload", selectedFiles.length > 0 && "has-files")}>
                <input
                  className="file-input"
                  type="file"
                  accept={acceptedScanTypes}
                  multiple
                  onChange={handleSelfFilesChange}
                />
                <IconUpload size={52} stroke={1.6} />
                <strong>{selectedFiles.length > 0 ? "Скан выбран" : "Загрузите скан, PDF или фото письма"}</strong>
                <small>
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} файл(ов): ${selectedFiles.map((file) => file.name).join(", ")}`
                    : "JPG, PNG, TIF, BMP, WEBP. Канцелярия увидит файл вместе с заявкой."}
                </small>
              </label>
              <div className="self-note">
                <h3>Что произойдет дальше</h3>
                <p>OCR предложит заполнить поля. Вы сможете исправить данные перед отправкой.</p>
                <button className="primary-button" onClick={runSelfOcr} disabled={isProcessing || selectedFiles.length === 0}>
                  <IconSparkles size={17} />
                  {isProcessing ? "Распознаем..." : "Загрузить и распознать"}
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="self-form">
              <div className="two-columns">
                <Field label="Тип заявки">
                  <input value={direction} readOnly />
                </Field>
                <Field label="Статус">
                  <input value="Черновик заявки" readOnly />
                </Field>
              </div>
              <div className="two-columns">
                <Field label="Отправитель" required>
                  <input value={selfForm.sender} onChange={(event) => updateSelfForm("sender", event.target.value)} />
                </Field>
                <Field label="Получатель" required>
                  <input value={selfForm.recipient} onChange={(event) => updateSelfForm("recipient", event.target.value)} />
                </Field>
              </div>
              <Field label="Тема / Заголовок" required>
                <input value={selfForm.subject} onChange={(event) => updateSelfForm("subject", event.target.value)} />
              </Field>
              <Field label="Краткое содержание">
                <textarea value={selfForm.summary} onChange={(event) => updateSelfForm("summary", event.target.value)} />
              </Field>
              <div className="two-columns">
                <Field label="Адресат">
                  <select value={selfForm.addressee} onChange={(event) => updateSelfForm("addressee", event.target.value)}>
                    <option>Канцелярия</option>
                    <option>Заместитель генерального директора</option>
                    <option>Финансовый отдел</option>
                  </select>
                </Field>
                <Field label="Желаемый срок">
                  <div className="control">
                    <input value={selfForm.deadline} onChange={(event) => updateSelfForm("deadline", event.target.value)} />
                    <IconCalendar size={17} />
                  </div>
                </Field>
              </div>
              <div className="self-ocr-summary">
                <strong>OCR: уверенность {ocr.confidence}%</strong>
                <span>Найдено полей: {ocr.fields.length}. Номер письма: 03-12/5678.</span>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="self-review">
              <div className={clsx("result-panel", submitState === "sent" && "sent")}>
                <IconCheck size={28} />
                <div>
                  <h3>{submitState === "sent" ? "Заявка отправлена в канцелярию" : "Проверьте заявку перед отправкой"}</h3>
                  <p>
                    {submitState === "sent"
                      ? "Канцелярия проверит реквизиты и присвоит официальный входящий или исходящий номер."
                      : "После отправки письмо получит статус «На проверке канцелярии»."}
                  </p>
                </div>
              </div>
              <div className="review-list">
                <div><span>Заявка</span><strong>{requestNumber}</strong></div>
                <div><span>Тип</span><strong>{direction}</strong></div>
                <div><span>Тема</span><strong>{selfForm.subject}</strong></div>
                <div><span>Файлы</span><strong>{selectedFiles.length > 0 ? selectedFiles.map((file) => file.name).join(", ") : "Не выбраны"}</strong></div>
                <div><span>Следующий шаг</span><strong>Проверка канцелярией</strong></div>
              </div>
            </div>
          ) : null}
        </div>

        <footer className="self-actions">
          {submitError ? <span className="submit-error">{submitError}</span> : null}
          <button className="secondary-button" onClick={() => setStep(Math.max(1, step - 1))}>Назад</button>
          {step === 1 ? (
            <button className="primary-button" onClick={runSelfOcr} disabled={isProcessing || selectedFiles.length === 0}>
              {isProcessing ? "Распознаем..." : "Продолжить"}
            </button>
          ) : step < 3 ? (
            <button className="primary-button" onClick={() => setStep(step + 1)} disabled={!selfForm.subject.trim() || !selfForm.sender.trim()}>
              Продолжить
            </button>
          ) : (
            <button className="primary-button" onClick={submitRequest}>
              {submitState === "sending" ? "Отправляем..." : "Отправить в канцелярию"}
            </button>
          )}
        </footer>
      </div>

      <aside className="self-side">
        <div className="section-heading">
          <h2>Мои заявки</h2>
          <span className="status-chip amber">На проверке</span>
        </div>
        <div className="self-status-card current">
          <span>{requestNumber}</span>
          <strong>{submitState === "sent" ? "На проверке канцелярии" : "Черновик заявки"}</strong>
          <small>Официальный номер появится после проверки.</small>
        </div>
        <div className="request-timeline">
          {["Создано сотрудником", "OCR выполнен", "Проверка канцелярией", "Официальная регистрация"].map((item, index) => (
            <div key={item} className={clsx(index < (submitState === "sent" ? 3 : 2) && "done")}>
              <span>{index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
        {requests.length === 0 ? (
          <div className="self-status-card">
            <span>Нет заявок</span>
            <strong>История пока пустая</strong>
            <small>После отправки заявки она появится здесь.</small>
          </div>
        ) : null}
        {requests.filter((request) => request.request_number !== requestNumber).map((request) => (
          <div className="self-status-card" key={request.id}>
            <span>{request.request_number}</span>
            <strong>{request.status}</strong>
            <small>{request.official_number ? `Присвоен номер ${request.official_number}` : request.subject}</small>
          </div>
        ))}
      </aside>
    </section>
  );
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [allDocuments, setAllDocuments] = useState(seedDocuments);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(seedDocuments[0]?.id || "new");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Все");
  const [ocr, setOcr] = useState(suggestedOcr);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [reviewMessage, setReviewMessage] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [documentDraft, setDocumentDraft] = useState(createDocumentDraft(blankDocument));

  const filteredDocuments = useMemo(() => {
    return allDocuments.filter((doc) => {
      const matchesFilter =
        filter === "Все" ||
        (filter === "Входящие" && doc.type === "Входящая") ||
        (filter === "Исходящие" && doc.type === "Исходящая");
      const haystack = `${doc.number} ${doc.subject} ${doc.sender}`.toLowerCase();
      return matchesFilter && haystack.includes(search.toLowerCase());
    });
  }, [allDocuments, filter, search]);

  const selected = allDocuments.find((doc) => doc.id === selectedId) || allDocuments[0] || blankDocument;

  useEffect(() => {
    setDocumentDraft(createDocumentDraft(selected));
  }, [selected.id]);

  useEffect(() => {
    async function loadSession() {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const payload = await response.json();
        setUser(payload.user);
      }
      setIsAuthLoading(false);
    }

    loadSession();
  }, []);

  async function refreshWorkspace() {
    if (!user) {
      return;
    }

    const [documentsResponse, requestsResponse] = await Promise.all([
      fetch("/api/documents"),
      fetch("/api/submissions")
    ]);

    if (documentsResponse.ok) {
      const payload = await documentsResponse.json();
      const nextDocuments = payload.documents || [];
      setAllDocuments(nextDocuments);
      setSelectedId((current) => nextDocuments.some((doc) => doc.id === current) ? current : nextDocuments[0]?.id || "new");
    }

    if (requestsResponse.ok) {
      const payload = await requestsResponse.json();
      setRegistrationRequests(payload.requests || []);
    }
  }

  useEffect(() => {
    refreshWorkspace();
  }, [user]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setActiveView("dashboard");
  }

  async function runOcr(files = []) {
    setIsProcessing(true);
    setSavedMessage(files.length > 0 ? "Распознаем в браузере..." : "Распознаем скан...");
    if (files.length > 0) {
      setOcr((current) => ({
        ...current,
        source: "Browser OCR",
        warnings: ["Распознавание выполняется в браузере. Первый запуск может занять дольше из-за загрузки языковых данных."]
      }));
    }

    try {
      const payload = await recognizeOcr(files);

      setOcr(payload);
      setDocumentDraft((current) => ({
        ...current,
        sender: getOcrValue(payload, "Отправитель", current.sender),
        recipient: getOcrValue(payload, "Получатель", current.recipient),
        addressee: getOcrValue(payload, "Адресат", current.addressee),
        subject: getOcrValue(payload, "Тема", current.subject),
        date: getOcrValue(payload, "Дата письма", current.date),
        summary: payload.extractedText || current.summary
      }));
      setSavedMessage(files.length > 0 ? "OCR применен к форме" : "Данные импортированы из сканера");
    } catch (error) {
      setOcr((current) => ({
        ...current,
        confidence: 0,
        source: "OCR error",
        warnings: [error.message || "Не удалось распознать файл."],
        extractedText: "OCR не выполнен. Попробуйте другой JPG/PNG или повторите позже."
      }));
      setSavedMessage("OCR не выполнен");
    } finally {
      setIsProcessing(false);
      setTimeout(() => setSavedMessage(""), 3200);
    }
  }

  async function saveDocument(status = "Новое") {
    setSavedMessage("Сохраняем...");
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: documentDraft.type,
        status,
        sender: documentDraft.sender,
        recipient: documentDraft.recipient,
        addressee: documentDraft.addressee,
        subject: documentDraft.subject,
        summary: documentDraft.summary,
        letterType: documentDraft.letterType,
        executor: documentDraft.executor,
        department: documentDraft.department,
        deadline: documentDraft.deadline
      })
    });
    const payload = await response.json();
    if (payload.document) {
      setAllDocuments((current) => [payload.document, ...current]);
      setSelectedId(payload.document.id);
    }
    setSavedMessage(payload.database === "connected" ? "Сохранено в Neon" : "Сохранено в демо-режиме");
    setTimeout(() => setSavedMessage(""), 2600);
  }

  function handleRequestCreated(request) {
    setRegistrationRequests((current) => [request, ...current.filter((item) => item.id !== request.id)]);
  }

  async function reviewRequest(id, action) {
    setIsReviewing(true);
    setReviewMessage(action === "approve" ? "Регистрируем заявку..." : "Возвращаем на уточнение...");

    try {
      const payload = await postJsonWithTimeout("/api/submissions", {
        id,
        action,
        comment: action === "return" ? "Канцелярия просит уточнить реквизиты письма." : ""
      }, 12000, "PATCH");

      setRegistrationRequests((current) =>
        current.map((request) => (request.id === id ? payload.request : request))
      );

      if (payload.document) {
        setAllDocuments((current) => [payload.document, ...current.filter((doc) => doc.id !== payload.document.id)]);
        setSelectedId(payload.document.id);
      }

      setReviewMessage(action === "approve" ? `Заявка зарегистрирована: ${payload.request.official_number}` : "Заявка возвращена на уточнение");
      setTimeout(() => setReviewMessage(""), 3200);
    } catch (error) {
      setReviewMessage(error.message || "Не удалось обработать заявку.");
      setTimeout(() => setReviewMessage(""), 4200);
    } finally {
      setIsReviewing(false);
    }
  }

  function exportExcel() {
    window.location.href = "/api/export";
  }

  function renderActiveView() {
    if (activeView === "self-service") {
      return <SelfServicePortal onRequestCreated={handleRequestCreated} />;
    }

    if (["inbox", "outbox", "drafts", "approval", "signature", "overdue", "archive"].includes(activeView)) {
      return (
        <DocumentsModule
          view={activeView}
          documents={allDocuments}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          setActiveView={setActiveView}
        />
      );
    }

    if (activeView === "templates") return <TemplatesModule />;
    if (activeView === "directories") return <DirectoriesModule />;
    if (activeView === "routes") return <RoutesModule />;
    if (activeView === "reports") return <ReportsModule documents={allDocuments} requests={registrationRequests} onExport={exportExcel} />;
    if (activeView === "notifications") return <NotificationsModule requests={registrationRequests} />;
    if (activeView === "settings") return <SettingsModule users={defaultUsers} />;
    if (activeView === "users") return <UsersModule user={user} />;

    return (
      <div className="work-grid">
        <Registry
          documents={filteredDocuments}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
        />
        <div className="center-stack">
          <ReviewQueue
            requests={registrationRequests}
            isReviewing={isReviewing}
            onReview={reviewRequest}
          />
          {reviewMessage ? <div className="stack-message">{reviewMessage}</div> : null}
          <DocumentForm
            key={selected.id}
            selected={selected}
            draft={documentDraft}
            onDraftChange={setDocumentDraft}
            savedMessage={savedMessage}
            onSaveDraft={() => saveDocument("Черновик")}
            onSave={() => saveDocument("Новое")}
            onSendManager={() => saveDocument("На рассмотрении")}
          />
        </div>
        <OcrPanel ocr={ocr} onRunOcr={runOcr} isProcessing={isProcessing} onExport={exportExcel} />
      </div>
    );
  }

  if (isAuthLoading) {
    return <main className="loading-screen">Проверяем сессию...</main>;
  }

  if (!user) {
    return <LoginScreen onAuthenticated={setUser} />;
  }

  return (
    <main className="app-shell">
      <Sidebar activeView={activeView} setActiveView={setActiveView} user={user} />
      <div className="workspace">
        <Topbar
          title={(viewTitles[activeView] || viewTitles.dashboard)[0]}
          subtitle={(viewTitles[activeView] || viewTitles.dashboard)[1]}
          user={user}
          onLogout={logout}
        />
        {renderActiveView()}
      </div>
    </main>
  );
}
