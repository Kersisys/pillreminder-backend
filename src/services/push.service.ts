import { env } from '../config/env';

/**
 * firebase-admin инициализируется лениво и только один раз (модуль кешируется
 * Node'ом, так что при serverless-повторных вызовах на Vercel initializeApp
 * не будет вызван дважды в рамках одного "тёплого" инстанса функции).
 *
 * Если FIREBASE_SERVICE_ACCOUNT_BASE64 не задан — push просто не отправляется,
 * сервер продолжает работать как раньше (см. env.ts, поле опционально).
 */
let messagingPromise: Promise<import('firebase-admin').messaging.Messaging | null> | null = null;

async function getMessaging() {
  if (messagingPromise) return messagingPromise;

  messagingPromise = (async () => {
    if (!env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      console.warn(
        'FIREBASE_SERVICE_ACCOUNT_BASE64 не задан — push-уведомления отключены, ' +
          'клиент будет узнавать об изменениях только через периодическую синхронизацию.',
      );
      return null;
    }

    const admin = await import('firebase-admin');

    const serviceAccountJson = Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    const app = admin.apps.length
      ? admin.apps[0]!
      : admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

    return admin.messaging(app);
  })();

  return messagingPromise;
}

/**
 * Отправляется при каждом PUT /api/reminder-settings (см. reminder.controller.ts).
 * Data-only сообщение (без notification-блока) — на телефоне его ловит
 * PillReminderMessagingService.onMessageReceived и молча пересчитывает будильник,
 * без показа системного уведомления пользователю.
 *
 * Ошибки здесь НЕ должны ронять запрос на изменение настроек — настройки уже
 * сохранены в базе, push — это just-in-time ускорение, а не источник истины
 * (источник истины всё равно GET /api/reminder-settings, который клиент дёргает
 * при получении пуша).
 */
export async function sendReminderUpdatedPush(fcmToken: string): Promise<void> {
  try {
    const messaging = await getMessaging();
    if (!messaging) return;

    await messaging.send({
      token: fcmToken,
      data: {
        type: 'reminder_updated',
      },
      android: {
        // высокий приоритет — доставить как можно быстрее, даже если приложение
        // свёрнуто или экран выключен (в разумных пределах Doze/App Standby)
        priority: 'high',
      },
    });
  } catch (error) {
    console.error('Не удалось отправить push об изменении напоминания:', error);
  }
}
