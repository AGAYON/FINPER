import { Router } from 'express';
import { z } from 'zod';
import { MesSchema } from '../../shared/validators';
import { getReportes } from './reportes.service';

export const reportesRouter = Router();

const QuerySchema = z.object({
    desde: MesSchema.optional(),
    hasta: MesSchema.optional(),
});

function getDefaultRango(): { desde: string; hasta: string } {
    const hoy = new Date();
    const hasta = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    const desdeDate = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
    const desde = `${desdeDate.getFullYear()}-${String(desdeDate.getMonth() + 1).padStart(2, '0')}`;
    return { desde, hasta };
}

// GET /api/reportes?desde=2025-01&hasta=2025-06
reportesRouter.get('/', async (req, res, next) => {
    try {
        const parsed = QuerySchema.safeParse(req.query);
        const { desde, hasta } = parsed.success && parsed.data.desde && parsed.data.hasta
            ? { desde: parsed.data.desde, hasta: parsed.data.hasta }
            : getDefaultRango();

        const data = await getReportes(desde, hasta);
        res.json(data);
    } catch (err) {
        next(err);
    }
});
