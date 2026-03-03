import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
    constructor(
        public readonly message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    // Error de validación Zod
    if (err instanceof ZodError) {
        res.status(400).json({
            error: 'Error de validación',
            issues: err.flatten().fieldErrors,
        });
        return;
    }

    // Error de dominio controlado
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }

    // Error de Prisma — registro no encontrado
    if (typeof err === 'object' && err !== null && 'code' in err) {
        const prismaErr = err as { code: string; message: string };
        if (prismaErr.code === 'P2025') {
            res.status(404).json({ error: 'Registro no encontrado' });
            return;
        }
        if (prismaErr.code === 'P2002') {
            res.status(409).json({ error: 'Ya existe un registro con esos datos' });
            return;
        }
    }

    // Error genérico
    console.error('Error no controlado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
}
