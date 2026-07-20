// Позволяет писать req.userId в контроллерах после того, как middleware проверил JWT,
// без необходимости приводить типы (as any) в каждом месте использования.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
