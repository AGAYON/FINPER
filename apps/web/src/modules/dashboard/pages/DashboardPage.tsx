import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { useReportes } from '../../reportes/hooks/useReportes';
import { NetWorthCard } from '../components/NetWorthCard';
import { ResumenMes } from '../components/ResumenMes';
import { PresupuestoBarra } from '../components/PresupuestoBarra';
import { RecurrentesPendientes } from '../components/RecurrentesPendientes';
import { MetasResumen } from '../components/MetasResumen';
import { NetWorthChart } from '../components/NetWorthChart';
import { DonutGastosMini } from '../components/DonutGastosMini';
import { RatioMiniChart } from '../components/RatioMiniChart';

export function DashboardPage() {
    const { data, isLoading, isError, ejecutarRecurrente, isEjecutando, ejecutandoId } = useDashboard();
    const { data: reportesData, mesMasReciente } = useReportes(6);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <p className="text-gray-500">Cargando dashboard…</p>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
                <div className="rounded-md bg-red-50 p-4 text-red-700">
                    No se pudo cargar el dashboard. Vuelve a intentar.
                </div>
            </div>
        );
    }

    const presupuestosAlerta = data.presupuestos.filter(
        (p) => p.estado === 'advertencia' || p.estado === 'excedido',
    );
    const hayAlertas = data.recurrentes_pendientes.length > 0 || presupuestosAlerta.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24 sm:p-6">
            {/* Header */}
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-0.5 text-sm text-gray-500">Resumen financiero</p>
            </header>

            {/* Sección 1 + 2: Net Worth + Resumen mes */}
            <div className="grid gap-4 sm:grid-cols-2">
                <NetWorthCard netWorth={data.net_worth} />
                <ResumenMes mes={data.mes_actual} />
            </div>

            {/* Sección 3: Presupuestos del mes */}
            {data.presupuestos.length > 0 && (
                <section className="mt-6">
                    <h2 className="mb-3 text-base font-semibold text-gray-900">
                        Presupuestos del mes
                    </h2>
                    <div className="space-y-3">
                        {data.presupuestos.map((p) => (
                            <PresupuestoBarra key={p.categoria} presupuesto={p} />
                        ))}
                    </div>
                </section>
            )}

            {/* Sección 4: Alertas */}
            {hayAlertas && (
                <section className="mt-6">
                    <h2 className="mb-3 text-base font-semibold text-gray-900">Alertas</h2>
                    <div className="space-y-4">
                        <RecurrentesPendientes
                            recurrentes={data.recurrentes_pendientes}
                            onEjecutar={ejecutarRecurrente}
                            isEjecutando={isEjecutando}
                            ejecutandoId={ejecutandoId}
                        />
                        {presupuestosAlerta.length > 0 && (
                            <div>
                                <h3 className="mb-2 text-sm font-semibold text-red-700">
                                    Presupuestos en riesgo ({presupuestosAlerta.length})
                                </h3>
                                <div className="space-y-2">
                                    {presupuestosAlerta.map((p) => (
                                        <PresupuestoBarra key={p.categoria} presupuesto={p} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Sección 5: Gráfica Net Worth */}
            <section className="mt-6">
                <h2 className="mb-3 text-base font-semibold text-gray-900">
                    Evolución del patrimonio
                </h2>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <NetWorthChart snapshots={data.snapshots_net_worth} />
                </div>
            </section>

            {/* Sección 6: Metas activas */}
            <section className="mt-6">
                <h2 className="mb-3 text-base font-semibold text-gray-900">Metas activas</h2>
                <MetasResumen metas={data.metas} />
            </section>

            {/* Sección 7: Resumen reportes (donut gastos + ratio 6 meses) */}
            {reportesData && (
                <section className="mt-6">
                    <h2 className="mb-3 text-base font-semibold text-gray-900">Resumen reportes</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <DonutGastosMini
                            gastos={reportesData.gastos_por_categoria.filter((g) => g.mes === mesMasReciente)}
                            mesLabel={new Date(mesMasReciente + '-01').toLocaleDateString('es-MX', {
                                month: 'long',
                                year: 'numeric',
                            })}
                        />
                        <RatioMiniChart totales={reportesData.totales_mensuales} meses={6} />
                    </div>
                </section>
            )}

            {/* Card: Ver reportes completos */}
            <section className="mt-6">
                <Link
                    to="/reportes"
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
                >
                    <span className="font-medium text-gray-900">Ver reportes completos</span>
                    <ChevronRight className="h-5 w-5 text-indigo-600" />
                </Link>
            </section>
        </div>
    );
}
