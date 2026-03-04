export type TipoTransaccion = 'ingreso' | 'gasto' | 'transferencia' | 'ajuste';

/** Cuenta resumida como viene incluida en la respuesta de transacciones */
export interface CuentaResumen {
    id: string;
    nombre: string;
    tipo: string;
    color: string;
    moneda: string;
    icono: string;
}

/** Categoría resumida como viene incluida en la respuesta de transacciones */
export interface CategoriaResumen {
    id: string;
    nombre: string;
    tipo: string;
    color: string;
    icono: string;
}

/** Transacción tal como la devuelve la API (con relaciones incluidas) */
export interface Transaccion {
    id: string;
    fecha: string;
    monto: number;
    descripcion: string;
    tipo: TipoTransaccion;
    cuentaOrigenId: string;
    cuentaDestinoId: string | null;
    categoriaId: string | null;
    notas: string | null;
    recurrenteId: string | null;
    createdAt: string;
    updatedAt: string;
    categoria: CategoriaResumen | null;
    cuentaOrigen: CuentaResumen;
    cuentaDestino: CuentaResumen | null;
}

/** Payload para crear una transacción */
export interface TransaccionCreateInput {
    id?: string;            // UUID opcional (generado por cliente para soporte offline)
    fecha: string;          // YYYY-MM-DD
    monto: number;          // > 0
    descripcion: string;
    tipo: TipoTransaccion;
    cuentaOrigenId: string;
    cuentaDestinoId?: string | null;
    categoriaId?: string | null;
    notas?: string | null;
}

/** Payload para editar */
export type TransaccionUpdateInput = Partial<Omit<TransaccionCreateInput, 'id'>>;

/** Respuesta paginada del GET /api/transacciones */
export interface TransaccionesResponse {
    total: number;
    page: number;
    pageSize: number;
    items: Transaccion[];
}

/** Filtros para el listado (page empieza en 1) */
export interface TransaccionFiltros {
    desde?: string;
    hasta?: string;
    cuenta?: string;
    categoria?: string;
    tipo?: TipoTransaccion;
    page: number;
    pageSize: number;
}

export const FILTROS_DEFAULT: TransaccionFiltros = {
    page: 1,
    pageSize: 30,
};

/** Metadatos visuales por tipo de transacción */
export const TIPO_TRANSACCION_META: Record<
    TipoTransaccion,
    { label: string; signo: string; colorMonto: string; badgeCls: string }
> = {
    ingreso: {
        label: 'Ingreso',
        signo: '+',
        colorMonto: 'text-green-600',
        badgeCls: 'bg-green-100 text-green-700',
    },
    gasto: {
        label: 'Gasto',
        signo: '-',
        colorMonto: 'text-red-600',
        badgeCls: 'bg-red-100 text-red-700',
    },
    transferencia: {
        label: 'Transferencia',
        signo: '↔',
        colorMonto: 'text-indigo-600',
        badgeCls: 'bg-indigo-100 text-indigo-700',
    },
    ajuste: {
        label: 'Ajuste',
        signo: '~',
        colorMonto: 'text-gray-600',
        badgeCls: 'bg-gray-100 text-gray-600',
    },
};
