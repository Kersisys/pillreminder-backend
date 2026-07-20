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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Ошибка конфигурации .env:', parsed.error.flatten().fieldErrors);
  throw new Error('Некорректная конфигурация окружения — см. .env.example');
}

export const env = parsed.data;
