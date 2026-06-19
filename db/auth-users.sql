alter table users add column if not exists password_hash text;
alter table users add column if not exists must_set_password boolean not null default true;
alter table users add column if not exists last_login_at timestamptz;

insert into users(full_name, email, role, department, must_set_password, is_active) values
  ('Арсений Маслов', 'arseniy.maslov@redpetroleum.kg', 'admin', 'Администрация', true, true),
  ('Зарина Акматова', 'zarina.akmatova@redpetroleum.kg', 'clerk', 'Канцелярия', true, true)
on conflict(email) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  department = excluded.department,
  is_active = true;
