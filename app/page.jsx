"use client";

import { useMemo, useState } from "react";
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
  ["Рабочий стол", IconHome, "active", ""],
  ["Входящие", IconInbox, "", "42"],
  ["Исходящие", IconSend, "", "18"],
  ["Черновики", IconFileText, "", "7"],
  ["На согласовании", IconClipboardList, "", "12"],
  ["На подписи", IconPencil, "", "5"],
  ["Просроченные", IconClock, "", "3"],
  ["Архив", IconArchive, "", ""],
  ["Шаблоны", IconFileInvoice, "", ""],
  ["Справочники", IconDatabase, "", ""],
  ["Маршруты", IconShieldLock, "", ""],
  ["Отчеты и аналитика", IconLayoutDashboard, "", ""],
  ["Уведомления", IconBell, "", ""],
  ["Настройки", IconSettings, "", ""],
  ["Пользователи и роли", IconUsers, "", ""]
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

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Image src="/logo.png" alt="Red Petroleum" width={160} height={55} priority />
      </div>
      <nav className="nav-list" aria-label="Основная навигация">
        {navItems.map(([label, Icon, state, count]) => (
          <button key={label} className={clsx("nav-item", state)}>
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

function Topbar() {
  return (
    <header className="topbar">
      <div>
        <h1>Канцелярия / Делопроизводитель</h1>
        <p>Рабочее место</p>
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
          <span className="avatar">АМ</span>
          <div>
            <strong>Алия М.</strong>
            <small>Делопроизводитель</small>
          </div>
          <IconChevronDown size={16} />
        </div>
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

export default function Home() {
  const [allDocuments] = useState(seedDocuments);
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

  return (
    <main className="app-shell">
      <Sidebar />
      <div className="workspace">
        <Topbar />
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
      </div>
    </main>
  );
}
