export interface DashboardNetWorth {
    total: number;
    activos: number;
    pasivos: number;
}

export interface DashboardMesActual {
    ingresos: number;
    gastos: number;
    balance: number;
}

export type EstadoPresupuestoDashboard = 'ok' | 'advertencia' | 'excedido';

export interface DashboardPresupuesto {
    categoria: string;
    limite: number;
    gastado: number;
    porcentaje: number;
    estado: EstadoPresupuestoDashboard;
}

export interface DashboardRecurrentePendiente {
    id: string;
    nombre: string;
    monto: number | string;
    tipo: 'ingreso' | 'gasto';
    diaDelMes: number;
    activo: boolean;
    categoriaId: string;
    cuentaId: string;
    ultimaEjecucion?: string | null;
    createdAt: string;
    updatedAt: string;
    categoria: {
        id: string;
        nombre: string;
        color: string;
        icono: string;
    };
}

export interface DashboardMeta {
    id: string;
    nombre: string;
    progreso: number;
    objetivo: number;
    porcentaje: number;
}

export interface DashboardSnapshot {
    fecha: string;
    total: number | string;
}

export interface DashboardData {
    net_worth: DashboardNetWorth;
    mes_actual: DashboardMesActual;
    presupuestos: DashboardPresupuesto[];
    recurrentes_pendientes: DashboardRecurrentePendiente[];
    metas: DashboardMeta[];
    snapshots_net_worth: DashboardSnapshot[];
}
