import { Router } from 'express';
import { CuentasService } from './cuentas.service';
import { AppError } from '../../shared/error.handler';
import { z } from 'zod';
import { TipoCuentaSchema, ColorHex, UUID } from '../../shared/validators';

export const cuentasRouter = Router();
const service = new CuentasService();

const CuentaCreateSchema = z.object({
    nombre: z.string().min(1).max(80),
    tipo: TipoCuentaSchema,
    saldoInicial: z.number().default(0),
    fechaInicio: z.string().optional(),
    moneda: z.string().length(3).default('MXN'),
    color: ColorHex.default('#6B7280'),
    icono: z.string().max(40).default('bank'),
    incluirEnTotal: z.boolean().default(true),
});

// GET /api/cuentas — Lista todas con saldo calculado
cuentasRouter.get('/', async (_req, res, next) => {
    try {
        const cuentas = await service.listarCuentas();
        res.json(cuentas);
    } catch (err) {
        next(err);
    }
});

// POST /api/cuentas — Crear cuenta
cuentasRouter.post('/', async (req, res, next) => {
    try {
        const data = CuentaCreateSchema.parse(req.body);
        const cuenta = await service.crearCuenta(data);
        res.status(201).json(cuenta);
    } catch (err) {
        next(err);
    }
});

// PUT /api/cuentas/:id — Editar
cuentasRouter.put('/:id', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        const data = CuentaCreateSchema.partial().parse(req.body);
        const cuenta = await service.actualizarCuenta(id, data);
        res.json(cuenta);
    } catch (err) {
        next(err);
    }
});

// PATCH /api/cuentas/:id/archivar — Soft delete
cuentasRouter.patch('/:id/archivar', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        await service.archivarCuenta(id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});
