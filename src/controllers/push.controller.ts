import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';

const registerPushTokenSchema = z.object({
  fcmToken: z.string().min(1, 'fcmToken обязателен'),
});

/**
 * Android-клиент вызывает это: 1) сразу после успешного логина/регистрации,
 * 2) при старте приложения, если пользователь уже залогинен, 3) из
 * FirebaseMessagingService.onNewToken, когда Firebase сам меняет токен.
 * Идемпотентно — повторный вызов с тем же токеном просто перезаписывает то же значение.
 */
export async function registerPushToken(req: Request, res: Response) {
  const { fcmToken } = registerPushTokenSchema.parse(req.body);

  await prisma.user.update({
    where: { id: req.userId! },
    data: { fcmToken },
  });

  res.status(204).send();
}
