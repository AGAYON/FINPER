import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../shared/db';
import { UUID } from '../../shared/validators';

export const metasRouter = Router();

const MetaSchema = z.object({
    nombre: z.string().min(1).max(80),
    descripcion: z.string().optional().nullable(),
    montoObjetivo: z.number().positive(),
    fechaLimite: z.string().optional().nullable(),
    cuentaId: z.string().uuid().optional().nullable(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6B7280'),
});

const AportacionSchema = z.object({
    monto: z.number().positive(),
    fecha: z.string().optional(),
    nota: z.string().optional().nullable(),
    transaccionId: z.string().uuid().optional().nullable(),
});

function calcularProyeccion(meta: {
    montoActual: number;
    montoObjetivo: number;
    fechaLimite: Date | null;
    aportaciones: Array<{ monto: number; fecha: Date }>;
}) {
    const faltante = meta.montoObjetivo - meta.montoActual;

    // Promedio de los últimos 3 meses
    const hace3Meses = new Date();
    hace3Meses.setMonth(hace3Meses.getMonth() - 3);
    const aportacionesRecientes = meta.aportaciones.filter((a) => a.fecha >= hace3Meses);
    const ritmoActual =
        aportacionesRecientes.length > 0
            ? aportacionesRecientes.reduce((sum, a) => sum + Number(a.monto), 0) / 3
            : 0;

    let ritmoNecesario: number | null = null;
    let fechaProyectada: Date | null = null;
    let enCamino = false;

    if (meta.fechaLimite) {
        const mesesRestantes = Math.max(
            1,
            (meta.fechaLimite.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30),
        );
        ritmoNecesario = faltante / mesesRestantes;
        enCamino = ritmoActual >= ritmoNecesario;
    }

    if (ritmoActual > 0) {
        const mesesFaltantes = faltante / ritmoActual;
        fechaProyectada = new Date();
        fechaProyectada.setMonth(fechaProyectada.getMonth() + mesesFaltantes);
    }

    return { faltante, ritmoActual, ritmoNecesario, fechaProyectada, enCamino };
}

// GET /api/metas — Lista con proyección calculada
metasRouter.get('/', async (_req, res, next) => {
    try {
        const metas = await db.meta.findMany({
            include: { aportaciones: { select: { monto: true, fecha: true } } },
            orderBy: { createdAt: 'asc' },
        });

        const resultado = metas.map((m) => ({
            ...m,
            proyeccion: calcularProyeccion({
                montoActual: Number(m.montoActual),
                montoObjetivo: Number(m.montoObjetivo),
                fechaLimite: m.fechaLimite,
                aportaciones: m.aportaciones.map((a) => ({ monto: Number(a.monto), fecha: a.fecha })),
            }),
        }));

        res.json(resultado);
    } catch (err) {
        next(err);
    }
});

// POST /api/metas — Crear
metasRouter.post('/', async (req, res, next) => {
    try {
        const data = MetaSchema.parse(req.body);
        const meta = await db.meta.create({
            data: {
                ...data,
                fechaLimite: data.fechaLimite ? new Date(data.fechaLimite) : null,
                cuentaId: data.cuentaId ?? null,
                descripcion: data.descripcion ?? null,
            },
        });
        res.status(201).json(meta);
    } catch (err) {
        next(err);
    }
});

// PUT /api/metas/:id — Editar
metasRouter.put('/:id', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        const data = MetaSchema.partial().parse(req.body);
        const meta = await db.meta.update({
            where: { id },
            data: {
                ...data,
                fechaLimite: data.fechaLimite ? new Date(data.fechaLimite) : undefined,
            },
        });
        res.json(meta);
    } catch (err) {
        next(err);
    }
});

// POST /api/metas/:id/aportacion — Registrar aportación
metasRouter.post('/:id/aportacion', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        const data = AportacionSchema.parse(req.body);

        const [aportacion] = await db.$transaction([
            db.aportacionMeta.create({
                data: {
                    metaId: id,
                    monto: data.monto,
                    fecha: data.fecha ? new Date(data.fecha) : new Date(),
                    nota: data.nota ?? null,
                    transaccionId: data.transaccionId ?? null,
                },
            }),
            db.meta.update({
                where: { id },
                data: { montoActual: { increment: data.monto } },
            }),
        ]);

        res.status(201).json(aportacion);
    } catch (err) {
        next(err);
    }
});
