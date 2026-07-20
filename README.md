# PillReminder Backend

Node.js + Express + TypeScript + PostgreSQL (через Prisma) + Cloudinary.

## Что реализовано

- Регистрация/логин по email+паролю (JWT, 30 дней)
- Выдача подписи для прямой загрузки фото с телефона в Cloudinary
  (фото никогда не проходят через наш сервер — только ссылка на них)
- Сохранение и получение истории подтверждений приёма
- Получение/изменение настроек времени напоминания

## Локальный запуск

1. Установить зависимости:
   ```bash
   npm install
   ```
2. Скопировать `.env.example` в `.env` и заполнить реальными значениями
   (DATABASE_URL, JWT_SECRET, данные Cloudinary — Dashboard → Account Details).
3. Применить схему БД:
   ```bash
   npm run prisma:migrate
   ```
4. Запустить в режиме разработки (авто-перезапуск при изменениях):
   ```bash
   npm run dev
   ```
5. Проверить, что сервер жив: `GET http://localhost:3000/health` → `{"status":"ok"}`

## Быстрый бесплатный деплой (без своего сервера)

- **База данных**: [Neon](https://neon.tech) или [Supabase](https://supabase.com) — бесплатный PostgreSQL, дают готовую `DATABASE_URL`.
- **Сам backend**: [Railway](https://railway.app) или [Render](https://render.com) — подключаете GitHub-репозиторий,
  задаёте те же переменные окружения из `.env`, деплой автоматический при пуше.
- **Cloudinary**: бесплатный тариф на [cloudinary.com](https://cloudinary.com) — берёте Cloud Name / API Key / API Secret из Dashboard.

## API

Все эндпоинты, кроме `/api/auth/*` и `/health`, требуют заголовок:
```
Authorization: Bearer <accessToken>
```

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/auth/register` | `{ email, password }` → `{ accessToken }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ accessToken }` |
| GET | `/api/cloudinary/signature` | → `{ signature, timestamp, apiKey, cloudName, folder }` |
| POST | `/api/confirmations` | `{ date, confirmedAt, photoUrl, photoPublicId, status }` |
| GET | `/api/confirmations?from=&to=` | список подтверждений (для восстановления истории) |
| GET | `/api/reminder-settings` | → `{ reminderTime, isEnabled, repeatIntervalMinutes, updatedAt }` |
| PUT | `/api/reminder-settings` | `{ reminderTime, isEnabled }` — обновление времени "от сервера" |

## Сценарий загрузки фото с Android (полностью)

1. Телефон: `GET /api/cloudinary/signature` (с JWT).
2. Телефон загружает фото напрямую в Cloudinary, используя полученные
   `signature`/`timestamp`/`apiKey`/`cloudName`/`folder` (через Cloudinary Android SDK).
3. Cloudinary возвращает `secure_url` и `public_id`.
4. Телефон: `POST /api/confirmations` с этими данными — запись сохраняется в БД,
   после чего локальную копию фото на телефоне можно удалить (см. `PhotoRepository.deleteLocalCopy`
   в Android-коде — это уже подготовлено под этот шаг).

## Следующий шаг

Android-часть: сетевой слой на Retrofit, интеграция Cloudinary Android SDK,
WorkManager-воркер для фоновой синхронизации неотправленных записей
(поле `isSyncedWithServer` в `DayRecord` уже для этого подготовлено),
и периодическая проверка `GET /reminder-settings` для применения времени,
изменённого "с сервера".

---

## Деплой на Vercel (serverless, без карты, без постоянно работающего сервера)

Backend перестроен так, что работает в двух режимах одновременно, без дублирования кода:
- **Обычный процесс** (`src/index.ts`) — для локальной разработки (`npm run dev`) или деплоя на Render.
- **Serverless-функция** (`api/index.ts`) — для Vercel: код выполняется только по факту
  входящего запроса, а не крутится постоянно. Это лучше подходит, если backend
  используется нечасто (например, около часа в день) — не нужно ни думать
  про "просыпание" после простоя, ни платить за постоянно работающий сервер.

### Как задеплоить

1. Код уже должен быть в GitHub-репозитории (см. инструкцию про `git push` выше).
2. [vercel.com](https://vercel.com) → **Add New → Project** → выберите репозиторий → **Import**.
3. Vercel сам определит Node.js-проект. **Environment Variables** — добавьте те же
   значения, что в `.env`:
   ```
   DATABASE_URL
   JWT_SECRET
   CLOUDINARY_CLOUD_NAME
   CLOUDINARY_API_KEY
   CLOUDINARY_API_SECRET
   ```
   (`PORT` не нужен — Vercel сам управляет портом для serverless-функций)
4. **Deploy** — через 1-2 минуты получите адрес вида `https://pillreminder-backend.vercel.app`

### Важно: используйте POOLED-адрес Neon, а не обычный

В serverless-режиме каждый запрос потенциально может открыть отдельное соединение
к базе данных — с обычной строкой подключения Neon это может быстро исчерпать лимит
соединений PostgreSQL. У Neon для этого есть специальный **pooled connection string**:

Neon Dashboard → Connection Details → переключатель **"Pooled connection"** (включить) →
скопировать эту строку в `DATABASE_URL` вместо обычной. Отличается обычно наличием
`-pooler` в адресе хоста.

### Проверка после деплоя

```
https://pillreminder-backend.vercel.app/health
```
→ `{"status":"ok"}`

Админ-панель (просмотр фото) — по тому же адресу, `https://pillreminder-backend.vercel.app/`.

### На будущее: Tesseract / распознавание блистера на фото

Serverless-функции Vercel Hobby ограничены 60 секундами на выполнение — для
Tesseract.js на некрупных фото этого более чем достаточно. Логику распознавания
можно будет добавить прямо контроллером в `POST /api/confirmations` (проверка
сразу при сохранении) или отдельным эндпоинтом — оба варианта впишутся в
текущую архитектуру без переделок.

---

## Админ-панель (просмотр истории и фото)

Простая веб-страница по адресу `http://localhost:3000/` (или на адресе вашего
деплоя) — не отдельный проект, раздаётся тем же Express-сервером из `public/`.

**Как пользоваться:**
1. Открыть в браузере, залогиниться тем же email/паролем, что и в приложении.
2. Кнопка **"Все фото"** — покажет всю историю.
3. Или выбрать дату и нажать **"Показать"** — только записи за этот день.

**Экономия ресурсов Cloudinary** — то, о чём вы просили — решена не только
фильтрацией по дате, но и на уровне самих изображений: в галерее показываются
**превью 200×200** (трансформация добавляется прямо в URL Cloudinary,
`w_200,h_200,c_fill,q_auto`), а не оригиналы. Полный размер подгружается
только если кликнуть на конкретное фото (открывается поверх на весь экран).
Так при просмотре "всех фото" вы не тянете десятки полноразмерных снимков разом.

Токен хранится только в `sessionStorage` (не `localStorage`) — исчезает при
закрытии вкладки, чтобы не оставлять токен доступа к медицинским данным
надолго в браузере.
