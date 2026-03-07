export interface TotalesMensuales {
    mes: string;
    ingresos: number;
    gastos: number;
    ratio: number;
}

export interface CategoriaPorMes {
    mes: string;
    categoria_id: string;
    categoria_nombre: string;
    categoria_color: string;
    total: number;
}

export interface ReportesData {
    totales_mensuales: TotalesMensuales[];
    gastos_por_categoria: CategoriaPorMes[];
    ingresos_por_categoria: CategoriaPorMes[];
}

export type RangoMeses = 3 | 6 | 12;
