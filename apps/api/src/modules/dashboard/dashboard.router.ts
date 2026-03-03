import { Router } from 'express';
import { db } from '../../shared/db';
import { CuentasService } from '../cuentas/cuentas.service';

export const dashboardRouter = Router();
const cuentasService = new CuentasService();

// GET /api/dashboard — Todo en una sola llamada
dashboardRouter.get('/', async (_req, res, next) => {
    try {
        const hoy = new Date();
        const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);

        // ── Cuentas y net worth ──────────────────────────────────────────────────
        const cuentas = await db.cuenta.findMany({ where: { activa: true } });
        let activos = 0;
        let pasivos = 0;

        for (const cuenta of cuentas) {
            if (!cuenta.incluirEnTotal) continue;
            const saldo = await cuentasService.calcularSaldo(cuenta.id);
            if (['credito', 'prestamo'].includes(cuenta.tipo)) {
                pasivos += Math.abs(saldo);
            } else {
                activos += saldo;
            }
        }

        const netWorth = { total: activos - pasivos, activos, pasivos };

        // ── Mes actual (ingresos / gastos / balance) ─────────────────────────────
        const [ingresosMes, gastosMes] = await Promise.all([
            db.transaccion.aggregate({
                where: { tipo: 'ingreso', fecha: { gte: inicioMes, lte: finMes } },
                _sum: { monto: true },
            }),
            db.transaccion.aggregate({
                where: { tipo: 'gasto', fecha: { gte: inicioMes, lte: finMes } },
                _sum: { monto: true },
            }),
        ]);

        const ingresos = Number(ingresosMes._sum.monto ?? 0);
        const gastos = Number(gastosMes._sum.monto ?? 0);
        const mesActualData = { ingresos, gastos, balance: ingresos - gastos };

        // ── Presupuestos del mes con progreso ────────────────────────────────────
        const presupuestos = await db.presupuesto.findMany({
            where: { OR: [{ mes: mesActual }, { mes: null }] },
            include: { categoria: true },
        });

        const presupuestosConProgreso = await Promise.all(
            presupuestos.map(async (p) => {
                const agg = await db.transaccion.aggregate({
                    where: {
                        categoriaId: p.categoriaId,
                        tipo: 'gasto',
                        fecha: { gte: inicioMes, lte: finMes },
                    },
                    _sum: { monto: true },
                });
                const gastado = Number(agg._sum.monto ?? 0);
                const limite = Number(p.montoLimite);
                const porcentaje = limite > 0 ? (gastado / limite) * 100 : 0;
                return {
                    categoria: p.categoria.nombre,
                    limite,
                    gastado,
                    porcentaje: Math.round(porcentaje),
                    estado: porcentaje < 80 ? 'ok' : porcentaje <= 100 ? 'advertencia' : 'excedido',
                };
            }),
        );

        // ── Recurrentes pendientes del mes ───────────────────────────────────────
        const recurrentes = await db.recurrente.findMany({
            where: { activo: true },
            include: { categoria: true },
        });
        const recurrentesPendientes = recurrentes.filter(
            (r) =>
                !r.ultimaEjecucion ||
                r.ultimaEjecucion.getMonth() < hoy.getMonth() ||
                r.ultimaEjecucion.getFullYear() < hoy.getFullYear(),
        );

        // ── Metas con progreso ───────────────────────────────────────────────────
        const metas = await db.meta.findMany({
            where: { completada: false },
            include: { aportaciones: { select: { monto: true, fecha: true } } },
        });

        const metasConProgreso = metas.map((m) => ({
            id: m.id,
            nombre: m.nombre,
            progreso: Number(m.montoActual),
            objetivo: Number(m.montoObjetivo),
            porcentaje: Math.round((Number(m.montoActual) / Number(m.montoObjetivo)) * 100),
        }));

        // ── Snapshots net worth (últimos 12 meses) ───────────────────────────────
        const snapshots = await db.snapshotNetWorth.findMany({
            orderBy: { fecha: 'desc' },
            take: 12,
            select: { fecha: true, total: true },
        });

        // Guardar snapshot del día si no existe
        const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const snapshotHoy = await db.snapshotNetWorth.findUnique({
            where: { fecha: fechaHoy },
        });

        if (!snapshotHoy) {
            const detalleSnapshot: Record<string, number> = {};
            for (const cuenta of cuentas) {
                detalleSnapshot[cuenta.id] = await cuentasService.calcularSaldo(cuenta.id);
            }
            await db.snapshotNetWorth.create({
                data: {
                    fecha: fechaHoy,
                    total: netWorth.total,
                    detalle: detalleSnapshot,
                },
            });
        }

        res.json({
            net_worth: netWorth,
            mes_actual: mesActualData,
            presupuestos: presupuestosConProgreso,
            recurrentes_pendientes: recurrentesPendientes,
            metas: metasConProgreso,
            snapshots_net_worth: snapshots,
        });
    } catch (err) {
        next(err);
    }
});
