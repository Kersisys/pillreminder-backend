import { NextFunction, Request, Response } from 'express';

/** Позволяет контроллерам просто throw new ApiError(...), не думая про статус-коды в каждом месте. */
export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

/**
 * Подключается последним в цепочке middleware (см. index.ts). Ловит и ApiError,
 * и любые непредвиденные исключения — клиент никогда не получит "сырой" стектрейс.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error('Необработанная ошибка:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}
