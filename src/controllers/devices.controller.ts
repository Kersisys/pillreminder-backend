import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';

/**
 * Устройства аккаунта — нужно, чтобы из панели управления можно было заглушить
 * будильник на конкретном телефоне (см. её devices.controller/DevicesScreen),
 * не трогая вход и историю на нём — это НЕ управление сессиями/логаутом,
 * только флаг remindersEnabled (см. doc модели Device в schema.prisma).
 */

const registerSchema = z.object({
  deviceId: z.string().trim().min(1, 'deviceId обязателен'),
  deviceName: z.string().trim().min(1, 'deviceName обязателен'),
});

/**
 * Вызывается Android-приложением при каждом цикле фоновой синхронизации
 * (см. SyncWorker) — это одновременно "регистрация нового устройства" и
 * "heartbeat" уже известного. Специально НЕ трогает remindersEnabled при
 * обновлении существующей записи: если бы каждый heartbeat сбрасывал его
 * обратно в true, "удаление" устройства из панели отменялось бы само собой
 * при следующей же синхронизации телефона — весь смысл фичи потерялся бы.
 *
 * Ответ содержит актуальный remindersEnabled — именно по нему Android решает,
 * планировать ли дальше локальные напоминания на этом конкретном устройстве
 * (см. CheckServerReminderTimeUseCase/SyncWorker).
 */
export async function registerDevice(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);
  const userId = req.userId!;

  const device = await prisma.device.upsert({
    where: { userId_deviceId: { userId, deviceId: data.deviceId } },
    update: { deviceName: data.deviceName, lastSeenAt: new Date() },
    create: {
      userId,
      deviceId: data.deviceId,
      deviceName: data.deviceName,
    },
  });

  res.json({
    id: device.id,
    deviceName: device.deviceName,
    remindersEnabled: device.remindersEnabled,
    lastSeenAt: device.lastSeenAt,
  });
}

/**
 * Список для панели управления. Отключённые (remindersEnabled=false)
 * намеренно НЕ возвращаются — с точки зрения панели такое устройство уже
 * "удалено из списка" (см. запрос пользователя), хотя запись в БД остаётся
 * (см. почему в disableDeviceReminders ниже).
 */
export async function listDevices(req: Request, res: Response) {
  const devices = await prisma.device.findMany({
    where: { userId: req.userId!, remindersEnabled: true },
    orderBy: { lastSeenAt: 'desc' },
  });
  res.json(
    devices.map((d) => ({
      id: d.id,
      deviceName: d.deviceName,
      lastSeenAt: d.lastSeenAt,
    })),
  );
}

/**
 * "Удаление" устройства из панели — по факту не DELETE FROM, а гашение флага.
 * Физическое удаление строки было бы бессмысленно: телефон продолжает слать
 * register (heartbeat) на каждом фоновом синке и тут же создал бы запись
 * заново со стандартным remindersEnabled=true, будильник включился бы обратно
 * без какого-либо действия со стороны пользователя панели.
 */
export async function disableDeviceReminders(req: Request, res: Response) {
  // updateMany, а не update по id: гарантирует, что нельзя погасить будильник
  // на чужом устройстве, подобрав id — фильтр по userId обязателен.
  await prisma.device.updateMany({
    where: { id: req.params.id, userId: req.userId! },
    data: { remindersEnabled: false },
  });
  res.status(204).send();
}
