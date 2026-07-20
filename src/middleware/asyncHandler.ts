import { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Express 4 не перехватывает автоматически ошибки, брошенные внутри async-функций —
 * такая ошибка становится необработанным отклонённым Promise, что в Node 15+
 * по умолчанию завершает весь процесс (а не просто возвращает ошибку клиенту).
 *
 * Оборачиваем каждый async-контроллер этой функцией — она ловит ошибку и передаёт
 * её в next(err), откуда её уже подхватывает errorHandler (middleware/errorHandler.ts).
 */
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}
