import { Prisma } from '@prisma/client';
import { db } from '../../shared/db';

export interface TotalesMensualesRow {
    mes: string;
    ingresos: number;
    gastos: number;
    ratio: number;
}

export interface CategoriaPorMesRow {
    mes: string;
    categoria_id: string;
    categoria_nombre: string;
    categoria_color: string;
    total: number;
}

export interface ReportesData {
    totales_mensuales: TotalesMensualesRow[];
    gastos_por_categoria: CategoriaPorMesRow[];
    ingresos_por_categoria: CategoriaPorMesRow[];
}

/** Parsea YYYY-MM a primer día del mes (Date) y último día del mes (Date) */
function parseMesRange(desde: string, hasta: string): { inicio: Date; fin: Date } {
    const [yD, mD] = desde.split('-').map(Number);
    const [yH, mH] = hasta.split('-').map(Number);
    const inicio = new Date(yD, mD - 1, 1);
    const fin = new Date(yH, mH, 0, 23, 59, 59);
    return { inicio, fin };
}

export async function getReportes(desde: string, hasta: string): Promise<ReportesData> {
    const { inicio, fin } = parseMesRange(desde, hasta);

    // Solo transacciones cuya cuenta origen esté activa
    const cuentaActivaFilter = Prisma.sql`EXISTS (
        SELECT 1 FROM cuentas c
        WHERE c.id = t.cuenta_origen_id AND c.activa = true
    )`;

    // ── Totales mensuales (ingresos, gastos, ratio) ─────────────────────────────
    const totalesRaw = await db.$queryRaw<
        Array<{ mes: string; ingresos: string; gastos: string }>
    >(Prisma.sql`
        SELECT
            to_char(DATE_TRUNC('month', t.fecha)::date, 'YYYY-MM') AS mes,
            COALESCE(SUM(CASE WHEN t.tipo = 'ingreso' THEN t.monto ELSE 0 END), 0)::text AS ingresos,
            COALESCE(SUM(CASE WHEN t.tipo = 'gasto' THEN t.monto ELSE 0 END), 0)::text AS gastos
        FROM transacciones t
        WHERE ${cuentaActivaFilter}
          AND t.fecha >= ${inicio}::date AND t.fecha <= ${fin}::date
        GROUP BY DATE_TRUNC('month', t.fecha)
        ORDER BY mes ASC
    `);

    const totales_mensuales: TotalesMensualesRow[] = totalesRaw.map((r) => {
        const ingresos = Number(r.ingresos);
        const gastos = Number(r.gastos);
        const ratio = gastos > 0 ? ingresos / gastos : (ingresos > 0 ? 999 : 0);
        return { mes: r.mes, ingresos, gastos, ratio };
    });

    // ── Gastos por categoría y mes ──────────────────────────────────────────────
    const gastosRaw = await db.$queryRaw<
        Array<{ mes: string; categoria_id: string; categoria_nombre: string; categoria_color: string; total: string }>
    >(Prisma.sql`
        SELECT
            to_char(DATE_TRUNC('month', t.fecha)::date, 'YYYY-MM') AS mes,
            t.categoria_id AS categoria_id,
            cat.nombre AS categoria_nombre,
            COALESCE(cat.color, '#6B7280') AS categoria_color,
            SUM(t.monto)::text AS total
        FROM transacciones t
        INNER JOIN categorias cat ON cat.id = t.categoria_id
        WHERE ${cuentaActivaFilter}
          AND t.tipo = 'gasto'
          AND t.fecha >= ${inicio}::date AND t.fecha <= ${fin}::date
        GROUP BY DATE_TRUNC('month', t.fecha), t.categoria_id, cat.nombre, cat.color
        ORDER BY mes ASC, total DESC
    `);

    const gastos_por_categoria: CategoriaPorMesRow[] = gastosRaw.map((r) => ({
        mes: r.mes,
        categoria_id: r.categoria_id,
        categoria_nombre: r.categoria_nombre,
        categoria_color: r.categoria_color,
        total: Number(r.total),
    }));

    // ── Ingresos por categoría y mes ───────────────────────────────────────────
    const ingresosRaw = await db.$queryRaw<
        Array<{ mes: string; categoria_id: string; categoria_nombre: string; categoria_color: string; total: string }>
    >(Prisma.sql`
        SELECT
            to_char(DATE_TRUNC('month', t.fecha)::date, 'YYYY-MM') AS mes,
            t.categoria_id AS categoria_id,
            cat.nombre AS categoria_nombre,
            COALESCE(cat.color, '#6B7280') AS categoria_color,
            SUM(t.monto)::text AS total
        FROM transacciones t
        INNER JOIN categorias cat ON cat.id = t.categoria_id
        WHERE ${cuentaActivaFilter}
          AND t.tipo = 'ingreso'
          AND t.fecha >= ${inicio}::date AND t.fecha <= ${fin}::date
        GROUP BY DATE_TRUNC('month', t.fecha), t.categoria_id, cat.nombre, cat.color
        ORDER BY mes ASC, total DESC
    `);

    const ingresos_por_categoria: CategoriaPorMesRow[] = ingresosRaw.map((r) => ({
        mes: r.mes,
        categoria_id: r.categoria_id,
        categoria_nombre: r.categoria_nombre,
        categoria_color: r.categoria_color,
        total: Number(r.total),
    }));

    return {
        totales_mensuales,
        gastos_por_categoria,
        ingresos_por_categoria,
    };
}
