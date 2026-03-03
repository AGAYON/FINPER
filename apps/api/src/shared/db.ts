import { PrismaClient } from '@prisma/client';

// Singleton de Prisma Client — evita múltiples conexiones en desarrollo (hot reload)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = db;
}
