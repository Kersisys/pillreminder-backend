import cors from 'cors';
import express from 'express';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth.routes';
import { cloudinaryRouter } from './routes/cloudinary.routes';
import { confirmationsRouter } from './routes/confirmations.routes';
import { reminderRouter } from './routes/reminder.routes';

// Дополнительная защита сверх asyncHandler — на случай ошибки вне Express-роутинга.
// В serverless-режиме (Vercel) каждый вызов — отдельный процесс, поэтому здесь это
// скорее подстраховка для локального запуска/Render, чем для Vercel, но не мешает.
process.on('unhandledRejection', (reason) => {
  console.error('Необработанный отклонённый Promise:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Необработанное исключение:', error);
});

/**
 * Сам Express-app без app.listen() — вынесен отдельно от src/index.ts специально,
 * чтобы один и тот же код можно было использовать двумя разными способами:
 * 1) src/index.ts — локальный запуск и деплой на Render (обычный процесс, слушает порт);
 * 2) api/index.ts — обёртка для Vercel serverless-функции (Vercel сам вызывает app
 *    как обработчик запроса, никакого .listen() не нужно и не должно быть).
 */
export const app = express();

app.use(cors());
app.use(express.json());

// Простая админ-панель (логин + просмотр истории/фото) — статические файлы
// из public/, ничего не собирается и не требует отдельного фронтенд-проекта.
// На Vercel эта папка дополнительно раздаётся автоматически как статика (см. vercel.json),
// но оставляем и здесь — не мешает, и нужен для локального запуска/Render.
app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/cloudinary', cloudinaryRouter);
app.use('/api/confirmations', confirmationsRouter);
app.use('/api/reminder-settings', reminderRouter);

// Обработчик ошибок обязательно подключается последним — Express находит его
// по количеству аргументов (4), поэтому порядок регистрации middleware важен.
app.use(errorHandler);
