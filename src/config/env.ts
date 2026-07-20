import 'dotenv/config';
import { z } from 'zod';

/**
 * Валидируем .env один раз при старте приложения — если чего-то не хватает,
 * сервер падает сразу с понятной ошибкой, а не где-то в середине обработки запроса.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL обязателен'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET должен быть длиной хотя бы 16 символов'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  PORT: z.coerce.number().default(3000),

  // Service Account ключ Firebase (JSON, целиком) — закодирован в base64, чтобы не
  // мучиться с многострочным private_key и экранированием кавычек в .env.
  // Получить: Firebase Console -> Project Settings -> Service accounts ->
  // Generate new private key, затем: base64 -i service-account.json (Mac/Linux)
  // или certutil -encode (Windows), убрать переносы строк из вывода certutil.
  // Оставлено опциональным: без него сервер всё равно поднимается и работает —
  // просто push-уведомления не отправляются (см. push.service.ts).
  FIREBASE_SERVICE_ACCOUNT_BASE64: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Ошибка конфигурации .env:', parsed.error.flatten().fieldErrors);
  throw new Error('Некорректная конфигурация окружения — см. .env.example');
}

export const env = parsed.data;
