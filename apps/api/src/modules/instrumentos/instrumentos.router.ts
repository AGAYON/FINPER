import { Router } from 'express';
import { z } from 'zod';
import { FechaISO, MontoPositivo, UUID } from '../../shared/validators';
import { InstrumentosService } from './instrumentos.service';

export const instrumentosRouter = Router();
const service = new InstrumentosService();

const TipoInstrumentoSchema = z.enum(['credito', 'inversion']);
const SubtipoInstrumentoSchema = z.enum(['tasa_fija', 'tasa_variable']);

const InstrumentoCreateSchema = z
    .object({
        nombre: z.string().min(1).max(80),
        tipo: TipoInstrumentoSchema,
        subtipo: SubtipoInstrumentoSchema,
        cuentaId: z.string().uuid(),

        // Solo para tasa fija
        capitalInicial: z.number().positive().optional(),
        tasaAnual: z.number().positive().max(9.999999).optional(),
        plazoMeses: z.number().int().positive().optional(),
        fechaInicio: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha_inicio debe ser YYYY-MM-DD' })
            .optional(),
        periodicidadDias: z
            .number()
            .int()
            .refine((v) => v === 15 || v === 30, {
                message: 'periodicidad_dias debe ser 15 o 30',
            })
            .optional(),

        notas: z.string().optional().nullable(),
    })
    .refine(
        (d) =>
            d.subtipo !== 'tasa_fija' ||
            (d.capitalInicial != null &&
                d.tasaAnual != null &&
                d.plazoMeses != null &&
                d.fechaInicio != null &&
                d.periodicidadDias != null),
        {
            message:
                'Para instrumentos de tasa_fija se requieren capital_inicial, tasa_anual, plazo_meses, fecha_inicio y periodicidad_dias',
            path: ['subtipo'],
        },
    );

const InstrumentoUpdateSchema = z.object({
    nombre: z.string().min(1).max(80).optional(),
    notas: z.string().optional().nullable(),
    tasaAnual: z.number().positive().max(9.999999).optional(),
    capitalInicial: z.number().positive().optional(),
    plazoMeses: z.number().int().positive().optional(),
});

const PagosHistoricosSchema = z.object({
    numeroPagos: z.number().int().positive(),
    cuentaOrigenId: z.string().uuid(),
    fechaPrimerPago: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'fechaPrimerPago debe ser YYYY-MM-DD' })
        .optional(),
});

const PagoSchema = z.object({
    fecha: FechaISO,
    montoTotal: MontoPositivo,
    cuentaOrigenId: z.string().uuid(),
    montoInteresAjuste: z.number().optional(), // puede ser negativo
    notas: z.string().optional().nullable(),
});

const AjusteVariableSchema = z.object({
    montoReal: z.number().min(0),
    fecha: FechaISO.optional(),
    notas: z.string().optional().nullable(),
});

// GET /api/instrumentos — Lista todos con saldo actual y próximo pago
instrumentosRouter.get('/', async (_req, res, next) => {
    try {
        const items = await service.listarInstrumentos();
        res.json(items);
    } catch (err) {
        next(err);
    }
});

// POST /api/instrumentos — Crear instrumento
instrumentosRouter.post('/', async (req, res, next) => {
    try {
        const data = InstrumentoCreateSchema.parse(req.body);
        const instrumento = await service.crearInstrumento(data);
        res.status(201).json(instrumento);
    } catch (err) {
        next(err);
    }
});

// PUT /api/instrumentos/:id — Editar nombre, notas, tasa (si variable)
instrumentosRouter.put('/:id', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        const data = InstrumentoUpdateSchema.parse(req.body);
        const instrumento = await service.actualizarInstrumento(id, data);
        res.json(instrumento);
    } catch (err) {
        next(err);
    }
});

// PATCH /api/instrumentos/:id/archivar — Soft delete (activo = false)
instrumentosRouter.patch('/:id/archivar', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        await service.archivarInstrumento(id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// GET /api/instrumentos/:id/tabla — Tabla de amortización completa
instrumentosRouter.get('/:id/tabla', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        const desdePeriodo =
            typeof req.query.desde_periodo === 'string'
                ? Number.parseInt(req.query.desde_periodo, 10)
                : undefined;
        const tabla = await service.obtenerTabla(id, Number.isNaN(desdePeriodo) ? undefined : desdePeriodo);
        res.json(tabla);
    } catch (err) {
        next(err);
    }
});

// GET /api/instrumentos/:id/proyeccion — Proyección de prepago
instrumentosRouter.get('/:id/proyeccion', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        const abonoExtraRaw = req.query.abono_extra;
        const abonoExtra = typeof abonoExtraRaw === 'string' ? Number(abonoExtraRaw) : NaN;
        if (!Number.isFinite(abonoExtra) || abonoExtra <= 0) {
            return res.status(400).json({
                error: 'abono_extra debe ser un número positivo',
            });
        }
        const proyeccion = await service.proyeccionPrepago(id, abonoExtra);
        res.json(proyeccion);
    } catch (err) {
        next(err);
    }
});

// POST /api/instrumentos/:id/pagos-historicos — Registrar N pagos previos al inicio del sistema
instrumentosRouter.post('/:id/pagos-historicos', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        const data = PagosHistoricosSchema.parse(req.body);
        const resultado = await service.registrarPagosHistoricos(id, data);
        res.status(201).json(resultado);
    } catch (err) {
        next(err);
    }
});

// POST /api/instrumentos/:id/pago — Registrar pago de crédito
instrumentosRouter.post('/:id/pago', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        const data = PagoSchema.parse(req.body);
        const resultado = await service.registrarPagoCredito(id, data);
        res.status(201).json(resultado);
    } catch (err) {
        next(err);
    }
});

// POST /api/instrumentos/:id/ajuste — Ajuste de inversión tasa variable
instrumentosRouter.post('/:id/ajuste', async (req, res, next) => {
    try {
        const id = UUID.parse(req.params.id);
        const data = AjusteVariableSchema.parse(req.body);
        const resultado = await service.registrarAjusteVariable(id, data);
        res.status(201).json(resultado);
    } catch (err) {
        next(err);
    }
});

