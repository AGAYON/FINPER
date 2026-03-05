import type { Categoria } from '../categorias/categorias.types';

export type EstadoPresupuesto = 'ok' | 'advertencia' | 'excedido';

export interface Presupuesto {
    id: string;
    categoriaId: string;
    mes: string | null; // null = default permanente
    montoLimite: number | string; // Decimal Prisma → usar Number()
    gastoReal: number;
    porcentaje: number;
    estado: EstadoPresupuesto;
    categoria: Categoria;
    createdAt: string;
    updatedAt: string;
}

export interface PresupuestoCreateInput {
    categoriaId: string;
    mes?: string | null;
    montoLimite: number;
}

export interface PresupuestoUpdateInput {
    montoLimite: number;
}

export const ESTADO_META: Record<
    EstadoPresupuesto,
    { label: string; barCls: string; textCls: string; bgCls: string }
> = {
    ok: {
        label: 'En rango',
        barCls: 'bg-green-500',
        textCls: 'text-green-700',
        bgCls: 'bg-green-100',
    },
    advertencia: {
        label: 'Cerca del límite',
        barCls: 'bg-yellow-400',
        textCls: 'text-yellow-700',
        bgCls: 'bg-yellow-100',
    },
    excedido: {
        label: 'Excedido',
        barCls: 'bg-red-500',
        textCls: 'text-red-700',
        bgCls: 'bg-red-100',
    },
};
