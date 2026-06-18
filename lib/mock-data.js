export const tags = [
  "Госорган",
  "Финансы",
  "Ответ обязателен",
  "Срочно",
  "Контроль ЗГД",
  "Претензия",
  "Налоги",
  "Запрос информации"
];

export const documents = [
  {
    id: "doc-7",
    number: "ВХ-2026-06-0007",
    type: "Входящая",
    date: "02.06.2026",
    sender: "Министерство энергетики КР",
    recipient: "ОсОО «Red Petroleum»",
    subject: "Запрос информации о поставках",
    executor: "Касымов Р. А.",
    department: "Финансовый отдел",
    deadline: "10.06.2026",
    status: "На рассмотрении",
    overdue: false
  },
  {
    id: "doc-6",
    number: "ВХ-2026-06-0006",
    type: "Входящая",
    date: "02.06.2026",
    sender: "ГНС при МФ КР",
    recipient: "ОсОО «Red Petroleum»",
    subject: "О предоставлении отчетности за май 2026",
    executor: "Ибраева Д. Т.",
    department: "Бухгалтерия",
    deadline: "07.06.2026",
    status: "Новое",
    overdue: false
  },
  {
    id: "doc-42",
    number: "ИСХ-2026-06-0042",
    type: "Исходящая",
    date: "01.06.2026",
    sender: "ОсОО «Red Petroleum»",
    recipient: "Министерство юстиции КР",
    subject: "Ответ на запрос о предоставлении данных",
    executor: "Садыков Н. Б.",
    department: "Юридический отдел",
    deadline: "06.06.2026",
    status: "На согласовании",
    overdue: false
  },
  {
    id: "doc-5",
    number: "ВХ-2026-06-0005",
    type: "Входящая",
    date: "01.06.2026",
    sender: "ОсОО «СтройСнаб»",
    recipient: "ОсОО «Red Petroleum»",
    subject: "Претензия по договору №45-2026",
    executor: "Усенов А. К.",
    department: "Юридический отдел",
    deadline: "06.06.2026",
    status: "На исполнении",
    overdue: false
  },
  {
    id: "doc-41",
    number: "ИСХ-2026-06-0041",
    type: "Исходящая",
    date: "01.06.2026",
    sender: "ОсОО «Red Petroleum»",
    recipient: "ТехноПром",
    subject: "Уведомление о расторжении договора",
    executor: "Касымов Р. А.",
    department: "Финансовый отдел",
    deadline: "05.06.2026",
    status: "На подписи",
    overdue: false
  },
  {
    id: "doc-4",
    number: "ВХ-2026-06-0004",
    type: "Входящая",
    date: "31.05.2026",
    sender: "АО «Кыргызнефтегаз»",
    recipient: "ОсОО «Red Petroleum»",
    subject: "Приглашение на совещание",
    executor: "Ибраева Д. Т.",
    department: "Администрация",
    deadline: "03.06.2026",
    status: "Исполнено",
    overdue: false
  },
  {
    id: "doc-40",
    number: "ИСХ-2026-06-0040",
    type: "Исходящая",
    date: "31.05.2026",
    sender: "ОсОО «Red Petroleum»",
    recipient: "Государственное агентство",
    subject: "Сопроводительное письмо к документам",
    executor: "Садыков Н. Б.",
    department: "Юридический отдел",
    deadline: "02.06.2026",
    status: "Отправлено",
    overdue: false
  },
  {
    id: "doc-3",
    number: "ВХ-2026-06-0003",
    type: "Входящая",
    date: "30.05.2026",
    sender: "ИП Иванов",
    recipient: "ОсОО «Red Petroleum»",
    subject: "Жалоба на качество услуг",
    executor: "Усенов А. К.",
    department: "Сервис",
    deadline: "04.06.2026",
    status: "Просрочено",
    overdue: true
  },
  {
    id: "doc-39",
    number: "ИСХ-2026-06-0039",
    type: "Исходящая",
    date: "30.05.2026",
    sender: "ОсОО «Red Petroleum»",
    recipient: "ОсОО «КыргызЛогистик»",
    subject: "Ответ на претензию",
    executor: "Садыков Н. Б.",
    department: "Юридический отдел",
    deadline: "30.05.2026",
    status: "В архиве",
    overdue: false
  }
];

export const suggestedOcr = {
  confidence: 92,
  fields: [
    { label: "Отправитель", value: "Министерство финансов КР" },
    { label: "Дата письма", value: "02.06.2026" },
    { label: "Номер письма", value: "03-12/5678" },
    { label: "Тема", value: "О предоставлении отчетности за II квартал 2026 года" },
    { label: "Получатель", value: "ОсОО «Red Petroleum»" },
    { label: "Адресат", value: "Заместитель генерального директора" }
  ]
};

export const stats = [
  { label: "Входящие", value: "42", delta: "+12% за месяц" },
  { label: "Исходящие", value: "18", delta: "+6% за месяц" },
  { label: "Просрочено", value: "3", delta: "ежедневный контроль" },
  { label: "На согласовании", value: "12", delta: "5 сегодня" },
  { label: "Без ответа", value: "9", delta: "требуют решения" }
];
