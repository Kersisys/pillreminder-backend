import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';

const confirmationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date должен быть в формате YYYY-MM-DD'),
  confirmedAt: z.string().min(1),
  photoUrl: z.string().url(),
  photoPublicId: z.string().min(1),
  status: z.string().default('pill_taken'),
});

/**
 * upsert по (userId, date) — если с того же дня уже есть запись (например, повторная
 * отправка после сбоя сети), она просто перезаписывается, а не плодит дубликаты.
 */
export async function saveConfirmation(req: Request, res: Response) {
  const data = confirmationSchema.parse(req.body);
  const userId = req.userId!;

  const confirmation = await prisma.confirmation.upsert({
    where: { userId_date: { userId, date: data.date } },
    update: data,
    create: { ...data, userId },
  });

  res.status(201).json(confirmation);
}

const rangeQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

/** Используется клиентом для восстановления истории (например, на новом устройстве). */
export async function listConfirmations(req: Request, res: Response) {
  const { from, to } = rangeQuerySchema.parse(req.query);
  const userId = req.userId!;

  const confirmations = await prisma.confirmation.findMany({
    where: {
      userId,
      ...(from || to
        ? { date: { gte: from ?? undefined, lte: to ?? undefined } }
        : {}),
    },
    orderBy: { date: 'asc' },
  });

  res.json(confirmations);
}
