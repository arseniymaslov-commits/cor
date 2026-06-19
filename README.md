# Red Petroleum EDO

Минималистичный MVP электронного документооборота для входящей и исходящей корреспонденции.

## Что внутри

- Next.js App Router и API routes.
- Рабочий стол канцелярии: реестр, форма регистрации, OCR, вложения, маршрут согласования.
- Самостоятельная подача письма сотрудником: временная заявка, OCR, проверка данных, отправка в канцелярию.
- Автонумерация формата `ВХ-YYYY-MM-0001` и `ИСХ-YYYY-MM-0001`.
- Реестр и заявки загружаются из API/Neon; без записей показывается пустое состояние.
- Neon PostgreSQL schema: пользователи, роли, документы, теги, вложения, маршруты, согласования, уведомления, аудит.
- Excel export через `/api/export`.
- API заявок на регистрацию через `/api/submissions`.
- Первый вход по корпоративной почте: пользователь задает пароль, пароль хранится хэшем.
- Демо-режим без базы: приложение работает сразу, а при наличии `DATABASE_URL` пишет в Neon.

## Локальный запуск

```bash
npm install
npm run dev
```

Откройте `http://127.0.0.1:3000`.

## Neon

1. Создайте проект в Neon.
2. Скопируйте connection string.
3. Создайте `.env` из `.env.example` и вставьте:

```bash
DATABASE_URL="postgresql://user:password@ep-example.neon.tech/neondb?sslmode=require"
AUTH_SECRET="replace-with-a-long-random-secret"
```

4. Выполните SQL из `db/schema.sql` в Neon SQL Editor.
5. Если база уже была создана раньше, выполните также `db/auth-users.sql`.

## Vercel

1. Загрузите проект в GitHub.
2. В Vercel выберите `New Project` и импортируйте репозиторий.
3. В `Environment Variables` добавьте `DATABASE_URL`, `AUTH_SECRET` и `NEXT_PUBLIC_APP_NAME`.
4. Deploy.

## GitHub

```bash
git init
git add .
git commit -m "Build Red Petroleum EDO MVP"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Следующий слой

- Реальная авторизация: NextAuth/Auth.js или корпоративный SSO.
- Реальная загрузка файлов: Google Drive API или S3-compatible storage.
- OCR: Google Vision, Tesseract worker или корпоративный OCR-сервис.
- Cron reminders: Vercel Cron для уведомлений за 3 дня, за 1 день, в день срока и при просрочке.
