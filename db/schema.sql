create extension if not exists "uuid-ossp";

create type user_role as enum (
  'admin',
  'clerk',
  'deputy_ceo',
  'executor',
  'observer'
);

create type document_direction as enum ('Входящая', 'Исходящая');

create type document_status as enum (
  'Новое',
  'На рассмотрении',
  'На исполнении',
  'Просрочено',
  'На согласовании',
  'На подписи',
  'Исполнено',
  'Отправлено',
  'В архиве',
  'Черновик'
);

create type registration_request_status as enum (
  'Черновик заявки',
  'На проверке канцелярии',
  'Вернули на уточнение',
  'Зарегистрировано',
  'Отклонено'
);

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text not null unique,
  role user_role not null default 'executor',
  department text,
  password_hash text,
  must_set_password boolean not null default true,
  last_login_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists document_counters (
  prefix text not null,
  year int not null,
  month int not null,
  value int not null default 0,
  primary key(prefix, year, month)
);

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  number text not null unique,
  direction document_direction not null,
  registered_at date not null default current_date,
  registration_month int generated always as (extract(month from registered_at)::int) stored,
  registration_year int generated always as (extract(year from registered_at)::int) stored,
  sender text,
  recipient text,
  addressee text,
  subject text not null,
  summary text,
  letter_type text,
  due_at date,
  executor_id uuid references users(id),
  executor_name text,
  department text,
  status document_status not null default 'Новое',
  related_document_id uuid references documents(id),
  manager_resolution text,
  completed_at date,
  is_overdue boolean not null default false,
  is_archived boolean not null default false,
  archived_at timestamptz,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists registration_requests (
  id uuid primary key default uuid_generate_v4(),
  request_number text not null unique,
  official_document_id uuid references documents(id),
  official_number text,
  direction text not null check (direction in ('Входящее письмо', 'Исходящее письмо')),
  sender text,
  recipient text,
  addressee text,
  subject text not null,
  summary text,
  owner_id uuid references users(id),
  owner_name text,
  department text,
  status registration_request_status not null default 'Черновик заявки',
  clerk_comment text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz
);

create index if not exists registration_requests_status_idx on registration_requests(status);
create index if not exists registration_requests_owner_idx on registration_requests(owner_id);
create index if not exists registration_requests_search_idx on registration_requests using gin(
  to_tsvector('simple', coalesce(request_number, '') || ' ' || coalesce(subject, '') || ' ' || coalesce(sender, ''))
);

create index if not exists documents_direction_idx on documents(direction);
create index if not exists documents_status_idx on documents(status);
create index if not exists documents_due_at_idx on documents(due_at);
create index if not exists documents_registered_at_idx on documents(registered_at);
create index if not exists documents_search_idx on documents using gin(
  to_tsvector('simple', coalesce(number, '') || ' ' || coalesce(subject, '') || ' ' || coalesce(sender, '') || ' ' || coalesce(summary, ''))
);

create table if not exists tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  color text not null default '#e30613'
);

create table if not exists document_tags (
  document_id uuid not null references documents(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key(document_id, tag_id)
);

create table if not exists attachments (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  storage_provider text not null default 'local',
  storage_key text not null,
  ocr_text text,
  ocr_confidence int,
  uploaded_by uuid references users(id),
  uploaded_at timestamptz not null default now()
);

create index if not exists attachments_ocr_search_idx on attachments using gin(to_tsvector('simple', coalesce(ocr_text, '')));

create table if not exists approval_routes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  letter_type text,
  direction document_direction,
  is_active boolean not null default true
);

create table if not exists approval_steps (
  id uuid primary key default uuid_generate_v4(),
  route_id uuid not null references approval_routes(id) on delete cascade,
  step_order int not null,
  title text not null,
  role user_role,
  assignee_id uuid references users(id),
  due_days int not null default 5,
  unique(route_id, step_order)
);

create table if not exists approvals (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  step_title text not null,
  actor_id uuid references users(id),
  actor_name text,
  action text not null,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  language text not null check (language in ('ru', 'ky')),
  letter_type text not null,
  legal_entity text,
  body text not null,
  design_variant text not null default 'minimal',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references documents(id) on delete cascade,
  recipient_id uuid references users(id),
  channel text not null check (channel in ('email', 'google_chat', 'corporate_chat')),
  subject text not null,
  body text not null,
  send_at timestamptz not null,
  sent_at timestamptz,
  status text not null default 'scheduled'
);

create table if not exists audit_log (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references documents(id) on delete set null,
  actor_id uuid references users(id),
  actor_name text,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into tags(name, color) values
  ('Госорган', '#e30613'),
  ('Претензия', '#b45309'),
  ('Судебное', '#7c3aed'),
  ('Финансы', '#15803d'),
  ('Налоги', '#0369a1'),
  ('HR', '#be185d'),
  ('Закуп', '#4b5563'),
  ('Договор', '#0f766e'),
  ('Ответ обязателен', '#dc2626'),
  ('Срочно', '#e30613'),
  ('Контроль ЗГД', '#991b1b'),
  ('Проверка', '#475569'),
  ('Жалоба', '#c2410c'),
  ('Уведомление', '#2563eb'),
  ('Запрос информации', '#16a34a')
on conflict(name) do nothing;

insert into users(full_name, email, role, department, must_set_password, is_active) values
  ('Арсений Маслов', 'arseniy.maslov@redpetroleum.kg', 'admin', 'Администрация', true, true),
  ('Зарина Акматова', 'zarina.akmatova@redpetroleum.kg', 'clerk', 'Канцелярия', true, true)
on conflict(email) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  department = excluded.department,
  is_active = true;
