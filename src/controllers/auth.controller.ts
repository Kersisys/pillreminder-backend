import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { ApiError } from '../middleware/errorHandler';
import { hashPassword, issueAccessToken, verifyPassword } from '../services/auth.service';

const credentialsSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Пароль должен быть не короче 8 символов'),
});

export async function register(req: Request, res: Response) {
  const { email, password } = credentialsSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'Пользователь с таким email уже зарегистрирован');
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  res.status(201).json({ accessToken: issueAccessToken(user.id) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = credentialsSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  // Намеренно одинаковое сообщение для "нет такого email" и "неверный пароль" —
  // не даём злоумышленнику узнать, какие email вообще зарегистрированы.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new ApiError(401, 'Неверный email или пароль');
  }

  res.json({ accessToken: issueAccessToken(user.id) });
}
