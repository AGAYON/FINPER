import { z } from 'zod';

// ── Tipos compartidos ──────────────────────────────────────────────────────────

export const UUID = z.string().uuid();

export const TipoCuentaSchema = z.enum([
    'banco',
    'efectivo',
    'ahorro',
    'inversion',
    'credito',
    'prestamo',
]);

export const TipoTransaccionSchema = z.enum([
    'ingreso',
    'gasto',
    'transferencia',
    'ajuste',
]);

export const TipoCategoriaSchema = z.enum(['ingreso', 'gasto']);

// ── Schemas Zod reutilizables ─────────────────────────────────────────────────

export const MesSchema = z.string().regex(/^\d{4}-\d{2}$/, {
    message: 'El mes debe tener el formato YYYY-MM',
});

export const MontoPositivo = z
    .number()
    .positive({ message: 'El monto debe ser mayor a 0' });

export const ColorHex = z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Color debe ser hex válido (#RRGGBB)' });

export const FechaISO = z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha debe ser YYYY-MM-DD' }));

// ── Paginación ────────────────────────────────────────────────────────────────

export const PaginacionSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
