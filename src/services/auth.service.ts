import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const SALT_ROUNDS = 12;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

/**
 * Без expiresIn — токен не истекает вообще (личное приложение для одного
 * пользователя, а не публичный многопользовательский сервис, поэтому здесь
 * это разумный компромисс: не нужно логиниться заново раз в 30 дней).
 *
 * Если понадобится отозвать доступ (например, потерян телефон) — единственный
 * способ сейчас: сменить JWT_SECRET в .env, это разом инвалидирует ВСЕ токены
 * всех пользователей (при одном пользователе — не проблема).
 */
export function issueAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET);
}
