import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../shared/db';

export const syncRouter = Router();

const OperacionSchema = z.object({
    tipo: z.enum(['CREATE', 'UPDATE', 'DELETE']),
    entidad: z.enum([
        'cuentas',
        'transacciones',
        'categorias',
        'presupuestos',
        'metas',
        'recurrentes',
        'aportaciones_meta',
    ]),
    datos: z.record(z.unknown()),
    createdAt: z.string().datetime(),
});

const SyncBodySchema = z.object({
    operaciones: z.array(OperacionSchema),
});

// POST /api/sync — Aplica operaciones offline en orden por created_at
syncRouter.post('/', async (req, res, next) => {
    try {
        const { operaciones } = SyncBodySchema.parse(req.body);

        // Ordenar por timestamp para respetar el orden cronológico
        const ordenadas = [...operaciones].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

        const resultados: Array<{ ok: boolean; error?: string; entidad: string; tipo: string }> = [];

        for (const op of ordenadas) {
            try {
                // TODO: implementar delegación a cada módulo según entidad y tipo
                // Por ahora registramos el recibo de las operaciones
                resultados.push({ ok: true, entidad: op.entidad, tipo: op.tipo });
            } catch (err) {
                resultados.push({
                    ok: false,
                    error: err instanceof Error ? err.message : 'Error desconocido',
                    entidad: op.entidad,
                    tipo: op.tipo,
                });
            }
        }

        res.json({ procesadas: resultados.length, resultados });
    } catch (err) {
        next(err);
    }
});
