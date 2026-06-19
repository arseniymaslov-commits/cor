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

const navItems = [
  ["clerk", "Рабочий стол", IconHome, ""],
  ["self-service", "Подать письмо", IconFileText, "новое"],
  ["clerk", "Входящие", IconInbox, "42"],
  ["clerk", "Исходящие", IconSend, "18"],
  ["clerk", "Черновики", IconFileText, "7"],
  ["clerk", "На согласовании", IconClipboardList, "12"],
  ["clerk", "На подписи", IconPencil, "5"],
  ["clerk", "Просроченные", IconClock, "3"],
  ["clerk", "Архив", IconArchive, ""],
  ["clerk", "Шаблоны", IconFileInvoice, ""],
  ["clerk", "Справочники", IconDatabase, ""],
  ["clerk", "Маршруты", IconShieldLock, ""],
  ["clerk", "Отчеты и аналитика", IconLayoutDashboard, ""],
  ["clerk", "Уведомления", IconBell, ""],
  ["clerk", "Настройки", IconSettings, ""],
  ["clerk", "Пользователи и роли", IconUsers, ""]
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
  "В архиве": "gray"
};

const routeSteps = ["Регистрация", "Рассмотрение", "Исполнение", "Согласование", "Подпись", "Архив"];

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
        {navItems.filter(([, label]) => canAdmin || label !== "Пользователи и роли").map(([view, label, Icon, count]) => (
          <button
            key={label}
            className={clsx("nav-item", activeView === view && label === (view === "clerk" ? "Рабочий стол" : "Подать письмо") && "active")}
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
  const visibleRole = user?.roleLabel || userRole;

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
      </div>
      <footer className="pagination">
        <span>Показано 1-25 из 128</span>
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

function DocumentForm({ selected, savedMessage, onSaveDraft, onSave }) {
  return (
    <section className="form-panel">
      <div className="section-heading accent">
        <h2>Новый входящий документ</h2>
        <IconChevronDown size={18} />
      </div>
      <div className="form-grid">
        <Field label="Регистрационный номер">
          <div className="readonly-input">
            <span>ВХ-2026-06-0008</span>
            <IconShieldLock size={17} />
          </div>
          <small className="hint">Присваивается автоматически</small>
        </Field>
        <Field label="Дата регистрации" required>
          <div className="control">
            <input defaultValue="03.06.2026" />
            <IconCalendar size={17} />
          </div>
        </Field>
        <Field label="Отправитель" required>
          <select defaultValue={selected.sender}>
            <option>{selected.sender}</option>
            <option>Министерство финансов Кыргызской Республики</option>
            <option>ГНС при МФ КР</option>
          </select>
        </Field>
        <Field label="Получатель">
          <select defaultValue="ОсОО «Red Petroleum»">
            <option>ОсОО «Red Petroleum»</option>
            <option>Red Petroleum Holding</option>
          </select>
        </Field>
        <Field label="Адресат">
          <select defaultValue="Заместитель генерального директора">
            <option>Заместитель генерального директора</option>
            <option>Финансовый отдел</option>
            <option>Юридический отдел</option>
          </select>
        </Field>
        <Field label="Тема / Заголовок" required>
          <input defaultValue="О предоставлении отчетности за II квартал 2026 года" maxLength={250} />
          <small className="counter">56 / 250</small>
        </Field>
        <Field label="Краткое содержание">
          <textarea defaultValue="Просят предоставить финансовую отчетность за II квартал 2026 года в соответствии с требованиями письма." />
          <small className="counter">118 / 1000</small>
        </Field>
        <div className="two-columns">
          <Field label="Тип письма" required>
            <select defaultValue="Запрос">
              <option>Запрос</option>
              <option>Претензия</option>
              <option>Уведомление</option>
            </select>
          </Field>
          <Field label="Срок исполнения" required>
            <div className="control">
              <input defaultValue="10.06.2026" />
              <IconCalendar size={17} />
            </div>
          </Field>
        </div>
        <div className="two-columns">
          <Field label="Ответственный исполнитель" required>
            <select defaultValue="Касымов Р. А.">
              <option>Касымов Р. А.</option>
              <option>Ибраева Д. Т.</option>
              <option>Садыков Н. Б.</option>
            </select>
          </Field>
          <Field label="Подразделение" required>
            <select defaultValue="Финансовый отдел">
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
        <button className="outline-button">Направить руководителю</button>
      </footer>
    </section>
  );
}

function OcrPanel({ ocr, onRunOcr, isProcessing, onExport }) {
  return (
    <section className="ocr-panel">
      <div className="section-heading">
        <h2>OCR и вложения</h2>
        <IconChevronDown size={18} />
      </div>
      <div className="upload-zone">
        <IconUpload size={48} stroke={1.6} />
        <strong>Перетащите файлы сюда<br />или нажмите для выбора</strong>
        <small>PDF, JPG, PNG, TIF (до 20 МБ)</small>
      </div>
      <div className="ocr-actions">
        <button className="primary-button" onClick={onRunOcr}>
          <IconSparkles size={17} />
          {isProcessing ? "Распознаем..." : "Запустить OCR"}
        </button>
        <button className="ghost-button">Импорт со сканера Konica</button>
        <button className="ghost-button" onClick={onExport}>
          <IconFileExport size={17} />
          Excel
        </button>
      </div>
      <div className="confidence">
        <div>
          <span>Распознавание текста</span>
          <strong>Уверенность: {ocr.confidence}%</strong>
        </div>
        <progress value={ocr.confidence} max="100" />
      </div>
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
      <div className="attachments">
        <h3>Вложения (1)</h3>
        <div className="attachment">
          <span>PDF</span>
          <div>
            <strong>MF_KR_03-12_5678_02.06.2026.pdf</strong>
            <small>PDF · 1.2 МБ · текст индексирован</small>
          </div>
          <button>•••</button>
        </div>
      </div>
    </section>
  );
}

function SelfServicePortal() {
  const [direction, setDirection] = useState("Входящее письмо");
  const [step, setStep] = useState(1);
  const [ocr, setOcr] = useState(suggestedOcr);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitState, setSubmitState] = useState("idle");
  const [requestNumber, setRequestNumber] = useState("ЗАЯВКА-2026-06-0012");

  async function runSelfOcr() {
    setIsProcessing(true);
    const response = await fetch("/api/ocr", { method: "POST" });
    const payload = await response.json();
    setOcr(payload);
    setIsProcessing(false);
    setStep(2);
  }

  async function submitRequest() {
    setSubmitState("sending");
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        direction,
        sender: "Министерство финансов КР",
        recipient: "ОсОО «Red Petroleum»",
        subject: "О предоставлении отчетности за II квартал 2026 года",
        owner: "Данияр К."
      })
    });
    const payload = await response.json();
    setRequestNumber(payload.request.request_number);
    setSubmitState("sent");
    setStep(3);
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
              onClick={() => setStep(index + 1)}
            >
              <span>{index + 1}</span>
              {item}
            </button>
          ))}
        </div>

        <div className="self-content">
          {step === 1 ? (
            <div className="self-upload-grid">
              <div className="upload-zone self-upload">
                <IconUpload size={52} stroke={1.6} />
                <strong>Загрузите скан, PDF или фото письма</strong>
                <small>PDF, JPG, PNG, TIF. Канцелярия увидит файл вместе с заявкой.</small>
              </div>
              <div className="self-note">
                <h3>Что произойдет дальше</h3>
                <p>OCR предложит заполнить поля. Вы сможете исправить данные перед отправкой.</p>
                <button className="primary-button" onClick={runSelfOcr}>
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
                  <input defaultValue="Министерство финансов КР" />
                </Field>
                <Field label="Получатель" required>
                  <input defaultValue="ОсОО «Red Petroleum»" />
                </Field>
              </div>
              <Field label="Тема / Заголовок" required>
                <input defaultValue="О предоставлении отчетности за II квартал 2026 года" />
              </Field>
              <Field label="Краткое содержание">
                <textarea defaultValue="Просим зарегистрировать письмо и направить его в канцелярию для проверки реквизитов." />
              </Field>
              <div className="two-columns">
                <Field label="Адресат">
                  <select defaultValue="Канцелярия">
                    <option>Канцелярия</option>
                    <option>Заместитель генерального директора</option>
                    <option>Финансовый отдел</option>
                  </select>
                </Field>
                <Field label="Желаемый срок">
                  <div className="control">
                    <input defaultValue="10.06.2026" />
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
                <div><span>Тема</span><strong>О предоставлении отчетности за II квартал 2026 года</strong></div>
                <div><span>Следующий шаг</span><strong>Проверка канцелярией</strong></div>
              </div>
            </div>
          ) : null}
        </div>

        <footer className="self-actions">
          <button className="secondary-button" onClick={() => setStep(Math.max(1, step - 1))}>Назад</button>
          {step < 3 ? (
            <button className="primary-button" onClick={() => setStep(step + 1)}>Продолжить</button>
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
        <div className="self-status-card">
          <span>ЗАЯВКА-2026-06-0011</span>
          <strong>Зарегистрировано</strong>
          <small>Присвоен номер ВХ-2026-06-0007</small>
        </div>
        <div className="self-status-card">
          <span>ЗАЯВКА-2026-06-0010</span>
          <strong>Вернули на уточнение</strong>
          <small>Канцелярия просит добавить адресата.</small>
        </div>
      </aside>
    </section>
  );
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [allDocuments] = useState(seedDocuments);
  const [activeView, setActiveView] = useState("clerk");
  const [selectedId, setSelectedId] = useState(seedDocuments[0].id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Все");
  const [ocr, setOcr] = useState(suggestedOcr);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

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

  const selected = allDocuments.find((doc) => doc.id === selectedId) || allDocuments[0];

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

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setActiveView("clerk");
  }

  async function runOcr() {
    setIsProcessing(true);
    const response = await fetch("/api/ocr", { method: "POST" });
    const payload = await response.json();
    setOcr(payload);
    setIsProcessing(false);
  }

  async function saveDocument(status = "Новое") {
    setSavedMessage("Сохраняем...");
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "Входящая",
        status,
        sender: "Министерство финансов Кыргызской Республики",
        recipient: "ОсОО «Red Petroleum»",
        subject: "О предоставлении отчетности за II квартал 2026 года"
      })
    });
    const payload = await response.json();
    setSavedMessage(payload.database === "connected" ? "Сохранено в Neon" : "Сохранено в демо-режиме");
    setTimeout(() => setSavedMessage(""), 2600);
  }

  function exportExcel() {
    window.location.href = "/api/export";
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
        {activeView === "self-service" ? (
          <>
            <Topbar
              title="Подать письмо"
              subtitle="Самостоятельная регистрация для сотрудников"
              user={user}
              onLogout={logout}
            />
            <SelfServicePortal />
          </>
        ) : (
          <>
            <Topbar title="Канцелярия / Делопроизводитель" subtitle="Рабочее место" user={user} onLogout={logout} />
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
              <DocumentForm
                selected={selected}
                savedMessage={savedMessage}
                onSaveDraft={() => saveDocument("Черновик")}
                onSave={() => saveDocument("Новое")}
              />
              <OcrPanel ocr={ocr} onRunOcr={runOcr} isProcessing={isProcessing} onExport={exportExcel} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
