import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../shared/db';
import { UUID, MesSchema } from '../../shared/validators';

export const presupuestosRouter = Router();

const PresupuestoSchema = z.object({
    categoriaId: z.string().uuid(),
    mes: MesSchema.optional().nullable(), // NULL = default permanente
    montoLimite: z.number().positive(),
});

// GET /api/presupuestos?mes=2025-03 — Presupuestos del mes con progreso calculado
presupuestosRouter.get('/', async (req, res, next) => {
    try {
        const mes = typeof req.query.mes === 'string' ? MesSchema.parse(req.query.mes) : undefined;

        // Busca presupuestos específicos del mes o defaults (mes=NULL)
        const presupuestos = await db.presupuesto.findMany({
            where: mes
                ? { OR: [{ mes }, { mes: null }] }
                : { mes: null },
            include: { categoria: true },
        });

        // Si hay mes, preferir el específico sobre el default por categoría
        const porCategoria = new Map<string, typeof presupuestos[number]>();
        for (const p of presupuestos) {
            const existing = porCategoria.get(p.categoriaId);
            // El específico del mes tiene prioridad sobre el default
            if (!existing || (p.mes !== null && existing.mes === null)) {
                porCategoria.set(p.categoriaId, p);
            }
        }

        // Calcular gasto real del mes para cada presupuesto
        const resultado = await Promise.all(
            Array.from(porCategoria.values()).map(async (p) => {
                let gastoReal = 0;

                if (mes) {
                    const [year, month] = mes.split('-').map(Number);
                    const desde = new Date(year, month - 1, 1);
                    const hasta = new Date(year, month, 0, 23, 59, 59);

                    const agg = await db.transaccion.aggregate({
                        where: {
                            categoriaId: p.categoriaId,
                            tipo: 'gasto',
                            fecha: { gte: desde, lte: hasta },
                        },
                        _sum: { monto: true },
                    });
                    gastoReal = Number(agg._sum.monto ?? 0);
                }

                const limite = Number(p.montoLimite);
                const porcentaje = limite > 0 ? (gastoReal / limite) * 100 : 0;

                return {
                    ...p,
                    gastoReal,
                    porcentaje: Math.round(porcentaje * 100) / 100,
                    estado: porcentaje < 80 ? 'ok' : porcentaje <= 100 ? 'advertencia' : 'excedido',
                };
            }),
        );

        res.json(resultado);
    } catch (err) {
        next(err);
    }
});

// POST /api/presupuestos — Crear
presupuestosRouter.post('/', async (req, res, next) => {
    try {
        const data = PresupuestoSchema.parse(req.body);
        const presupuesto = await db.presupuesto.create({
            data: { ...data, mes: data.mes ?? null },
            include: { categoria: true },
        });
        res.status(201).json(presupuesto);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/presupuestos/:id — Eliminar (hard delete)
presupuestosRouter.delete('/:id', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        await db.presupuesto.delete({ where: { id } });
        res.status(204).end();
    } catch (err) {
        next(err);
    }
});

// PUT /api/presupuestos/:id — Editar monto
presupuestosRouter.put('/:id', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        const data = PresupuestoSchema.partial().parse(req.body);
        const presupuesto = await db.presupuesto.update({
            where: { id },
            data,
            include: { categoria: true },
        });
        res.json(presupuesto);
    } catch (err) {
        next(err);
    }
});
