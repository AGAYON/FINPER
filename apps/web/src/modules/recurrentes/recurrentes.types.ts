import type { Categoria } from '../categorias/categorias.types';
import type { Cuenta } from '../cuentas/cuentas.types';

export type TipoRecurrente = 'ingreso' | 'gasto';

export interface Recurrente {
    id: string;
    nombre: string;
    monto: number | string; // Decimal Prisma → usar Number()
    tipo: TipoRecurrente;
    categoriaId: string;
    cuentaId: string;
    diaDelMes: number;
    activo: boolean;
    ultimaEjecucion?: string | null;
    createdAt: string;
    updatedAt: string;
    // Relaciones incluidas
    categoria: Categoria;
    cuenta: Cuenta;
    // Calculados por el backend (solo en recurrentes activos)
    proximaFecha?: string;
    pendiente?: boolean;
}

export interface RecurrenteCreateInput {
    nombre: string;
    monto: number;
    tipo: TipoRecurrente;
    categoriaId: string;
    cuentaId: string;
    diaDelMes: number;
}

export type RecurrenteUpdateInput = Partial<RecurrenteCreateInput> & {
    activo?: boolean;
};
