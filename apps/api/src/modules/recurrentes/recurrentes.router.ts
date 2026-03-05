import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../shared/db';
import { UUID } from '../../shared/validators';

export const recurrentesRouter = Router();

const RecurrenteSchema = z.object({
    nombre: z.string().min(1).max(80),
    monto: z.number().positive(),
    tipo: z.enum(['ingreso', 'gasto']),
    categoriaId: z.string().uuid(),
    cuentaId: z.string().uuid(),
    diaDelMes: z.number().int().min(1).max(31),
});

// GET /api/recurrentes — Lista con próxima fecha calculada
recurrentesRouter.get('/', async (_req, res, next) => {
    try {
        const recurrentes = await db.recurrente.findMany({
            include: { categoria: true, cuenta: true },
            orderBy: [{ activo: 'desc' }, { diaDelMes: 'asc' }],
        });

        const hoy = new Date();
        const resultado = recurrentes.map((r) => {
            if (!r.activo) return { ...r, proximaFecha: null, pendiente: false };

            const dia = r.diaDelMes;
            let proximaFecha = new Date(hoy.getFullYear(), hoy.getMonth(), dia);
            if (proximaFecha <= hoy) {
                proximaFecha = new Date(hoy.getFullYear(), hoy.getMonth() + 1, dia);
            }

            const pendiente =
                !r.ultimaEjecucion ||
                r.ultimaEjecucion.getMonth() < hoy.getMonth() ||
                r.ultimaEjecucion.getFullYear() < hoy.getFullYear();

            return { ...r, proximaFecha, pendiente };
        });

        res.json(resultado);
    } catch (err) {
        next(err);
    }
});

// POST /api/recurrentes — Crear
recurrentesRouter.post('/', async (req, res, next) => {
    try {
        const data = RecurrenteSchema.parse(req.body);
        const recurrente = await db.recurrente.create({
            data,
            include: { categoria: true, cuenta: true },
        });
        res.status(201).json(recurrente);
    } catch (err) {
        next(err);
    }
});

// PUT /api/recurrentes/:id — Editar
recurrentesRouter.put('/:id', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        const data = RecurrenteSchema.partial().parse(req.body);
        const recurrente = await db.recurrente.update({
            where: { id },
            data,
            include: { categoria: true, cuenta: true },
        });
        res.json(recurrente);
    } catch (err) {
        next(err);
    }
});

// POST /api/recurrentes/:id/ejecutar — Genera transacción y actualiza ultima_ejecucion
recurrentesRouter.post('/:id/ejecutar', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        const recurrente = await db.recurrente.findUniqueOrThrow({ where: { id } });

        const [transaccion] = await db.$transaction([
            db.transaccion.create({
                data: {
                    fecha: new Date(),
                    monto: recurrente.monto,
                    descripcion: recurrente.nombre,
                    tipo: recurrente.tipo as 'ingreso' | 'gasto',
                    cuentaOrigenId: recurrente.cuentaId,
                    categoriaId: recurrente.categoriaId,
                    recurrenteId: recurrente.id,
                },
            }),
            db.recurrente.update({
                where: { id },
                data: { ultimaEjecucion: new Date() },
            }),
        ]);

        res.status(201).json(transaccion);
    } catch (err) {
        next(err);
    }
});
