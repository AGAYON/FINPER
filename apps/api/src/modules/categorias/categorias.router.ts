import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../shared/db';
import { TipoCategoriaSchema, ColorHex, UUID } from '../../shared/validators';

export const categoriasRouter = Router();

const CategoriaSchema = z.object({
    nombre: z.string().min(1).max(60),
    tipo: TipoCategoriaSchema,
    color: ColorHex.default('#6B7280'),
    icono: z.string().max(40).default('circle'),
});

// GET /api/categorias — Todas, agrupadas por tipo
categoriasRouter.get('/', async (_req, res, next) => {
    try {
        const categorias = await db.categoria.findMany({
            where: { activa: true },
            orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
        });

        const agrupadas = {
            ingreso: categorias.filter((c) => c.tipo === 'ingreso'),
            gasto: categorias.filter((c) => c.tipo === 'gasto'),
        };

        res.json(agrupadas);
    } catch (err) {
        next(err);
    }
});

// POST /api/categorias — Crear
categoriasRouter.post('/', async (req, res, next) => {
    try {
        const data = CategoriaSchema.parse(req.body);
        const categoria = await db.categoria.create({ data });
        res.status(201).json(categoria);
    } catch (err) {
        next(err);
    }
});

// PUT /api/categorias/:id — Editar
categoriasRouter.put('/:id', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        const data = CategoriaSchema.partial().parse(req.body);
        const categoria = await db.categoria.update({ where: { id }, data });
        res.json(categoria);
    } catch (err) {
        next(err);
    }
});

// PATCH /api/categorias/:id/archivar — Soft delete
categoriasRouter.patch('/:id/archivar', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        await db.categoria.update({ where: { id }, data: { activa: false } });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});
