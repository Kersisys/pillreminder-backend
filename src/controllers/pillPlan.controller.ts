import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';

/**
 * Раздел 39-41 ТЗ: сервер — источник истины для схемы упаковки/даты начала
 * цикла. Android хранит локальную копию как кэш (см. Stage 2 плана — PillPlan
 * на Android теперь синхронизируется с этим же эндпоинтом, а не живёт только
 * локально, как раньше).
 *
 * "Текущий" курс — тот, у которого позднее startDate (при равенстве —
 * позднее createdAt); история — всё остальное. Тот же принцип, что уже был
 * реализован на Android до переноса на сервер: не храним отдельный флаг
 * "активный", вычисляем по сортировке.
 */
export async function listPillPlans(req: Request, res: Response) {
  const plans = await prisma.pillPlan.findMany({
    where: { userId: req.userId! },
    orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
  });
  res.json(plans);
}

const createSchema = z.object({
  brandName: z.string().trim().min(1, 'Название препарата обязательно'),
  activePills: z.number().int().positive(),
  placeboPills: z.number().int().min(0),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат даты — YYYY-MM-DD'),
});

/**
 * Начинает новый курс (POST, а не PUT — это всегда ДОБАВЛЕНИЕ новой записи,
 * не редактирование существующей; предыдущий курс автоматически становится
 * "историей" по сортировке в listPillPlans, никакого отдельного действия
 * "завершить курс" не требуется).
 *
 * Специально без @@unique([userId, startDate]) на уровне БД (см. schema.prisma) —
 * запись с той же датой, что и уже существующая, разрешена (например,
 * исправление опечатки в названии), Android уже поддерживает этот сценарий
 * локально через сортировку по времени вставки.
 */
export async function createPillPlan(req: Request, res: Response) {
  const data = createSchema.parse(req.body);

  const plan = await prisma.pillPlan.create({
    data: {
      userId: req.userId!,
      brandName: data.brandName,
      activePills: data.activePills,
      placeboPills: data.placeboPills,
      startDate: data.startDate,
    },
  });

  res.status(201).json(plan);
}

/** Удаляет ошибочную запись (опечатка, случайный лишний тап и т.п.) — см. Android CocCourseRepository.deleteCourse. */
export async function deletePillPlan(req: Request, res: Response) {
  // deleteMany, а не delete по id: гарантирует, что пользователь не сможет
  // удалить чужую запись, просто подобрав id — фильтр по userId обязателен.
  await prisma.pillPlan.deleteMany({
    where: { id: req.params.id, userId: req.userId! },
  });
  res.status(204).send();
}
