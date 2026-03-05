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

        // ── Instrumentos (créditos e inversiones) ─────────────────────────────────
        const instrumentos = await db.instrumento.findMany({
            where: { activo: true },
            include: { cuenta: true },
        });

        const creditos: Array<{
            nombre: string;
            saldo_insoluto: number;
            proximo_pago: {
                fecha: string;
                monto_total: number;
                monto_capital: number;
                monto_interes: number;
            } | null;
            porcentaje_pagado: number | null;
        }> = [];

        const inversiones: Array<{
            nombre: string;
            saldo_actual: number;
            rendimiento_acumulado: number;
        }> = [];

        for (const inst of instrumentos) {
            if (inst.tipo === 'credito' && inst.subtipo === 'tasa_fija') {
                const capitalInicial = Number(inst.capitalInicial ?? 0);
                if (
                    !capitalInicial ||
                    !inst.tasaAnual ||
                    !inst.plazoMeses ||
                    !inst.fechaInicio ||
                    !inst.periodicidadDias
                ) {
                    continue;
                }

                const pagos = await db.movimientoInstrumento.findMany({
                    where: { instrumentoId: inst.id, tipo: 'pago' },
                    orderBy: { fecha: 'asc' },
                });
                const ajustes = await db.movimientoInstrumento.findMany({
                    where: { instrumentoId: inst.id, tipo: 'ajuste' },
                });

                const totalCapitalPagado = pagos.reduce(
                    (sum, p) => sum + Number(p.montoCapital ?? 0),
                    0,
                );
                const totalAjustes = ajustes.reduce(
                    (sum, a) => sum + Number(a.montoTotal ?? 0),
                    0,
                );

                const saldoInsoluto = Math.max(
                    0,
                    capitalInicial - totalCapitalPagado + totalAjustes,
                );

                const plazoMeses = Number(inst.plazoMeses);
                const periodicidadDias = Number(inst.periodicidadDias);
                const n = Math.round((plazoMeses * 30) / periodicidadDias);
                const tasaAnual = Number(inst.tasaAnual);
                const tasaPeriodo = tasaAnual / (365 / periodicidadDias);
                const cuota =
                    tasaPeriodo === 0
                        ? capitalInicial / n
                        : capitalInicial *
                          ((tasaPeriodo * Math.pow(1 + tasaPeriodo, n)) /
                              (Math.pow(1 + tasaPeriodo, n) - 1));

                let saldo = capitalInicial;
                const periodos: Array<{
                    capital: number;
                    interes: number;
                    fecha: string;
                }> = [];
                const fechaInicio = inst.fechaInicio as Date;

                for (let i = 1; i <= n; i++) {
                    const interes = saldo * tasaPeriodo;
                    let capital = cuota - interes;
                    if (capital > saldo) capital = saldo;
                    saldo -= capital;
                    const fecha = new Date(
                        fechaInicio.getTime() + periodicidadDias * i * 24 * 60 * 60 * 1000,
                    )
                        .toISOString()
                        .slice(0, 10);
                    periodos.push({
                        capital: Number(capital.toFixed(2)),
                        interes: Number(interes.toFixed(2)),
                        fecha,
                    });
                }

                const periodoActual = pagos.length;
                const proximo =
                    periodoActual < periodos.length ? periodos[periodoActual] : null;
                const porcentajePagado =
                    capitalInicial > 0
                        ? (totalCapitalPagado / capitalInicial) * 100
                        : null;

                creditos.push({
                    nombre: inst.nombre,
                    saldo_insoluto: Number(saldoInsoluto.toFixed(2)),
                    proximo_pago: proximo
                        ? {
                              fecha: proximo.fecha,
                              monto_total: Number(cuota.toFixed(2)),
                              monto_capital: proximo.capital,
                              monto_interes: proximo.interes,
                          }
                        : null,
                    porcentaje_pagado:
                        porcentajePagado != null
                            ? Number(porcentajePagado.toFixed(1))
                            : null,
                });
            } else if (inst.tipo === 'inversion') {
                const movimientos = await db.movimientoInstrumento.findMany({
                    where: { instrumentoId: inst.id },
                });
                const aportaciones = movimientos
                    .filter((m) => m.tipo === 'aportacion')
                    .reduce((sum, m) => sum + Number(m.montoTotal), 0);
                const rescates = movimientos
                    .filter((m) => m.tipo === 'rescate')
                    .reduce((sum, m) => sum + Number(m.montoTotal), 0);
                const ajustes = movimientos
                    .filter((m) => m.tipo === 'ajuste')
                    .reduce((sum, m) => sum + Number(m.montoTotal), 0);

                const capitalInicial = Number(inst.capitalInicial ?? 0);
                const saldoActual = capitalInicial + aportaciones - rescates + ajustes;

                inversiones.push({
                    nombre: inst.nombre,
                    saldo_actual: Number(saldoActual.toFixed(2)),
                    rendimiento_acumulado: Number(ajustes.toFixed(2)),
                });
            }
        }

        res.json({
            net_worth: netWorth,
            mes_actual: mesActualData,
            presupuestos: presupuestosConProgreso,
            recurrentes_pendientes: recurrentesPendientes,
            metas: metasConProgreso,
            snapshots_net_worth: snapshots,
            instrumentos: {
                creditos,
                inversiones,
            },
        });
    } catch (err) {
        next(err);
    }
});
