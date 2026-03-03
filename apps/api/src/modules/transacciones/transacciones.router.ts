import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../shared/db';
import { TipoTransaccionSchema, UUID, FechaISO } from '../../shared/validators';

export const transaccionesRouter = Router();

const TransaccionCreateSchema = z.object({
    id: z.string().uuid().optional(), // el cliente puede enviar el UUID (modo offline)
    fecha: FechaISO,
    monto: z.number().positive(),
    descripcion: z.string().min(1).max(120),
    tipo: TipoTransaccionSchema,
    cuentaOrigenId: z.string().uuid(),
    cuentaDestinoId: z.string().uuid().optional().nullable(),
    categoriaId: z.string().uuid().optional().nullable(),
    notas: z.string().optional().nullable(),
    recurrenteId: z.string().uuid().optional().nullable(),
}).refine(
    (d) => d.tipo !== 'transferencia' || d.cuentaDestinoId != null,
    { message: 'Transferencia requiere cuentaDestinoId', path: ['cuentaDestinoId'] },
).refine(
    (d) => ['transferencia', 'ajuste'].includes(d.tipo) || d.categoriaId != null,
    { message: 'Ingreso y gasto requieren categoriaId', path: ['categoriaId'] },
);

const FiltrosSchema = z.object({
    desde: z.string().optional(),
    hasta: z.string().optional(),
    cuenta: z.string().uuid().optional(),
    categoria: z.string().uuid().optional(),
    tipo: TipoTransaccionSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

// GET /api/transacciones — Lista con filtros
transaccionesRouter.get('/', async (req, res, next) => {
    try {
        const filtros = FiltrosSchema.parse(req.query);
        const skip = (filtros.page - 1) * filtros.pageSize;

        const where: Record<string, unknown> = {};
        if (filtros.desde || filtros.hasta) {
            where.fecha = {
                ...(filtros.desde ? { gte: new Date(filtros.desde) } : {}),
                ...(filtros.hasta ? { lte: new Date(filtros.hasta) } : {}),
            };
        }
        if (filtros.cuenta) {
            where.OR = [
                { cuentaOrigenId: filtros.cuenta },
                { cuentaDestinoId: filtros.cuenta },
            ];
        }
        if (filtros.categoria) where.categoriaId = filtros.categoria;
        if (filtros.tipo) where.tipo = filtros.tipo;

        const [total, items] = await Promise.all([
            db.transaccion.count({ where }),
            db.transaccion.findMany({
                where,
                include: { categoria: true, cuentaOrigen: true, cuentaDestino: true },
                orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
                skip,
                take: filtros.pageSize,
            }),
        ]);

        res.json({ total, page: filtros.page, pageSize: filtros.pageSize, items });
    } catch (err) {
        next(err);
    }
});

// GET /api/transacciones/:id — Detalle
transaccionesRouter.get('/:id', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        const transaccion = await db.transaccion.findUniqueOrThrow({
            where: { id },
            include: { categoria: true, cuentaOrigen: true, cuentaDestino: true, recurrente: true },
        });
        res.json(transaccion);
    } catch (err) {
        next(err);
    }
});

// POST /api/transacciones — Crear
transaccionesRouter.post('/', async (req, res, next) => {
    try {
        const data = TransaccionCreateSchema.parse(req.body);
        const transaccion = await db.transaccion.create({
            data: {
                ...(data.id ? { id: data.id } : {}),
                fecha: new Date(data.fecha),
                monto: data.monto,
                descripcion: data.descripcion,
                tipo: data.tipo,
                cuentaOrigenId: data.cuentaOrigenId,
                cuentaDestinoId: data.cuentaDestinoId ?? null,
                categoriaId: data.categoriaId ?? null,
                notas: data.notas ?? null,
                recurrenteId: data.recurrenteId ?? null,
            },
            include: { categoria: true, cuentaOrigen: true, cuentaDestino: true },
        });
        res.status(201).json(transaccion);
    } catch (err) {
        next(err);
    }
});

// PUT /api/transacciones/:id — Editar
transaccionesRouter.put('/:id', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        const data = TransaccionCreateSchema.partial().parse(req.body);
        const transaccion = await db.transaccion.update({
            where: { id },
            data: {
                ...(data.fecha ? { fecha: new Date(data.fecha) } : {}),
                ...data,
            },
            include: { categoria: true, cuentaOrigen: true, cuentaDestino: true },
        });
        res.json(transaccion);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/transacciones/:id — Eliminar
transaccionesRouter.delete('/:id', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        await db.transaccion.delete({ where: { id } });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});
