import { useState } from 'react';
import { useReportes } from '../hooks/useReportes';
import { DonutCategoria } from '../components/DonutCategoria';
import { RatioHistorico } from '../components/RatioHistorico';
import { ComparativoCategorias } from '../components/ComparativoCategorias';
import { TendenciaCategorias } from '../components/TendenciaCategorias';
import type { RangoMeses } from '../reportes.types';

function getMesAnterior(mes: string): string {
    const [y, m] = mes.split('-').map(Number);
    const d = new Date(y, m - 2, 1); // m-2 porque mes 1 = enero = index 0
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const OPCIONES_RANGO: { value: RangoMeses; label: string }[] = [
    { value: 3, label: 'Últimos 3 meses' },
    { value: 6, label: 'Últimos 6 meses' },
    { value: 12, label: 'Últimos 12 meses' },
];

export function ReportesPage() {
    const [rango, setRango] = useState<RangoMeses>(6);
    const { data, isLoading, isError, mesMasReciente } = useReportes(rango);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <p className="text-gray-500">Cargando reportes…</p>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
                <div className="rounded-md bg-red-50 p-4 text-red-700">
                    No se pudieron cargar los reportes. Vuelve a intentar.
                </div>
            </div>
        );
    }

    const gastosMesReciente = data.gastos_por_categoria.filter((g) => g.mes === mesMasReciente);
    const ingresosMesReciente = data.ingresos_por_categoria.filter((i) => i.mes === mesMasReciente);
    const mesAnterior = getMesAnterior(mesMasReciente);
    const mesesOrdenados = [...new Set(data.totales_mensuales.map((t) => t.mes))].sort();

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24 sm:p-6">
            <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
                    <p className="mt-0.5 text-sm text-gray-500">
                        Análisis por período y categoría
                    </p>
                </div>
                <select
                    value={rango}
                    onChange={(e) => setRango(Number(e.target.value) as RangoMeses)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                    {OPCIONES_RANGO.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </header>

            <div className="space-y-8">
                <DonutCategoria
                    gastos={gastosMesReciente}
                    ingresos={ingresosMesReciente}
                    title="Distribución del mes más reciente"
                />

                <RatioHistorico totales={data.totales_mensuales} meses={rango} />

                <ComparativoCategorias
                    gastosPorCategoria={data.gastos_por_categoria}
                    mesActual={mesMasReciente}
                    mesAnterior={mesAnterior}
                    tipo="gasto"
                />

                <ComparativoCategorias
                    gastosPorCategoria={data.ingresos_por_categoria}
                    mesActual={mesMasReciente}
                    mesAnterior={mesAnterior}
                    tipo="ingreso"
                />

                <TendenciaCategorias
                    datos={data.gastos_por_categoria}
                    tipo="gasto"
                    meses={mesesOrdenados}
                />

                <TendenciaCategorias
                    datos={data.ingresos_por_categoria}
                    tipo="ingreso"
                    meses={mesesOrdenados}
                />
            </div>
        </div>
    );
}
