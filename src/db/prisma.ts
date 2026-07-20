import { PrismaClient } from '@prisma/client';

/**
 * Единственный экземпляр PrismaClient на всё приложение — создавать новый клиент
 * на каждый запрос дорого и быстро исчерпывает пул соединений с БД.
 */
export const prisma = new PrismaClient();
