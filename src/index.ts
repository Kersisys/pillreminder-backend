import { app } from './app';
import { env } from './config/env';

// Используется для локального запуска (npm run dev) и для деплоя на Render —
// там backend работает как обычный долгоживущий процесс, слушающий порт.
// На Vercel этот файл вообще не используется, там своя точка входа — api/index.ts.
app.listen(env.PORT, () => {
  console.log(`PillReminder backend запущен на порту ${env.PORT}`);
});
