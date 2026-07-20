import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { ApiError } from '../middleware/errorHandler';

/**
 * Android-клиент периодически опрашивает этот эндпоинт (не пуш — см. обсуждение
 * в ТЗ про "не обращаться к серверу постоянно") и сравнивает reminderUpdatedAt
 * со своим последним известным значением. Если оно новее — применяет изменения
 * локально и помечает источник как SERVER (см. ReminderTimeSource в Android-коде).
 */
export async function getReminderSettings(req: Request, res: Response) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });

  res.json({
    reminderTime: user.reminderTime,
    isEnabled: user.reminderEnabled,
    repeatIntervalMinutes: user.repeatIntervalMinutes,
    updatedAt: user.reminderUpdatedAt,
  });
}

const updateSchema = z.object({
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Формат времени — HH:mm'),
  isEnabled: z.boolean(),
});

/**
 * На этом этапе вызывается вручную (например, через Postman/будущую админку) —
 * это как раз тот способ "сервер меняет время", который в ТЗ описан как будущий
 * сценарий. Сам Android-клиент это не вызывает — у него есть свой локальный
 * экран настроек (UpdateReminderTimeUseCase), это разные, независимые пути.
 */
export async function updateReminderSettings(req: Request, res: Response) {
  const data = updateSchema.parse(req.body);
  const userId = req.userId!;

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new ApiError(404, 'Пользователь не найден');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      reminderTime: data.reminderTime,
      reminderEnabled: data.isEnabled,
      reminderUpdatedAt: new Date(),
    },
  });

  res.json({
    reminderTime: user.reminderTime,
    isEnabled: user.reminderEnabled,
    repeatIntervalMinutes: user.repeatIntervalMinutes,
    updatedAt: user.reminderUpdatedAt,
  });
}
