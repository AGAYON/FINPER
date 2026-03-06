export type EstadoMeta = 'en_progreso' | 'completada' | 'cancelada';

export interface Meta {
    id: string;
    nombre: string;
    descripcion?: string | null;
    montoObjetivo: number | string; // Decimal Prisma → usar Number()
    montoActual: number | string;   // Decimal Prisma → usar Number()
    fechaLimite?: string | null;
    cuentaId?: string | null;
    color: string;
    estado: EstadoMeta;
    // Calculados por el backend
    porcentaje: number;
    diasRestantes?: number | null;
    fechaProyectada?: string | null;
    enCamino?: boolean | null;
    createdAt: string;
    updatedAt: string;
}

export interface MetaCreateInput {
    nombre: string;
    descripcion?: string | null;
    montoObjetivo: number;
    fechaLimite?: string | null;
    cuentaId?: string | null;
    color?: string;
}

export type MetaUpdateInput = Partial<MetaCreateInput>;

export interface AportacionInput {
    monto: number;
    nota?: string | null;
    fecha?: string;
}

export const COLORES_META: string[] = [
    '#6366f1', // indigo
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#EF4444', // red
    '#F97316', // orange
    '#EAB308', // yellow
    '#22C55E', // green
    '#14B8A6', // teal
    '#3B82F6', // blue
    '#0EA5E9', // sky
];

export const ESTADO_META_UI: Record<
    EstadoMeta,
    { label: string; barCls: string; textCls: string; bgCls: string; borderCls: string }
> = {
    en_progreso: {
        label: 'En progreso',
        barCls: 'bg-indigo-500',
        textCls: 'text-indigo-700',
        bgCls: 'bg-indigo-50',
        borderCls: 'border-indigo-200',
    },
    completada: {
        label: 'Completada',
        barCls: 'bg-green-500',
        textCls: 'text-green-700',
        bgCls: 'bg-green-50',
        borderCls: 'border-green-200',
    },
    cancelada: {
        label: 'Cancelada',
        barCls: 'bg-gray-400',
        textCls: 'text-gray-600',
        bgCls: 'bg-gray-100',
        borderCls: 'border-gray-200',
    },
};
