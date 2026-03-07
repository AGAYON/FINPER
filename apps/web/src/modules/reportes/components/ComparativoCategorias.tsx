import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell,
} from 'recharts';
import { formatCurrency } from '../../../shared/utils/currency';
import type { CategoriaPorMes } from '../reportes.types';

interface ComparativoCategoriasProps {
    gastosPorCategoria: CategoriaPorMes[];
    mesActual: string;
    mesAnterior: string;
    tipo: 'gasto' | 'ingreso';
}

export function ComparativoCategorias({
    gastosPorCategoria,
    mesActual,
    mesAnterior,
    tipo,
}: ComparativoCategoriasProps) {
    const categoriasMesActual = gastosPorCategoria.filter((r) => r.mes === mesActual);
    const categoriasMesAnterior = gastosPorCategoria.filter((r) => r.mes === mesAnterior);

    const categoriaIds = [
        ...new Set([
            ...categoriasMesActual.map((c) => c.categoria_id),
            ...categoriasMesAnterior.map((c) => c.categoria_id),
        ]),
    ];

    const byIdActual = new Map(categoriasMesActual.map((c) => [c.categoria_id, c]));
    const byIdAnterior = new Map(categoriasMesAnterior.map((c) => [c.categoria_id, c]));

    const data = categoriaIds.map((id) => {
        const actual = byIdActual.get(id);
        const anterior = byIdAnterior.get(id);
        const totalActual = actual?.total ?? 0;
        const totalAnterior = anterior?.total ?? 0;
        const delta =
            totalAnterior > 0
                ? ((totalActual - totalAnterior) / totalAnterior) * 100
                : (totalActual > 0 ? 100 : 0);
        return {
            nombre: actual?.categoria_nombre ?? anterior?.categoria_nombre ?? id.slice(0, 8),
            color: actual?.categoria_color ?? anterior?.categoria_color ?? '#6B7280',
            actual: totalActual,
            anterior: totalAnterior,
            delta: Math.round(delta),
        };
    });

    // Ordenar por total actual descendente
    data.sort((a, b) => b.actual - a.actual);

    if (data.length === 0) {
        return (
            <div className="flex h-[280px] items-center justify-center rounded-xl border border-gray-200 bg-white">
                <p className="text-sm text-gray-400">Sin datos para comparar</p>
            </div>
        );
    }

    const mesActualLabel = new Date(mesActual + '-01').toLocaleDateString('es-MX', {
        month: 'short',
        year: '2-digit',
    });
    const mesAnteriorLabel = new Date(mesAnterior + '-01').toLocaleDateString('es-MX', {
        month: 'short',
        year: '2-digit',
    });

    return (
        <section>
            <h2 className="mb-3 text-base font-semibold text-gray-900">
                Comparativo por categoría ({tipo === 'gasto' ? 'Gastos' : 'Ingresos'})
            </h2>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <ResponsiveContainer width="100%" height={Math.max(280, data.length * 36)}>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 4, right: 24, left: 90, bottom: 4 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                        <XAxis
                            type="number"
                            tickFormatter={(v) => formatCurrency(v)}
                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="nombre"
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            axisLine={false}
                            tickLine={false}
                            width={84}
                        />
                        <Tooltip
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                            formatter={(value: number) => [formatCurrency(value), '']}
                            labelFormatter={(label) => label}
                        />
                        <Legend
                            formatter={() => (
                                <>
                                    <span className="text-xs text-gray-600">
                                        {mesActualLabel} (color) · {mesAnteriorLabel} (gris) · Δ %
                                    </span>
                                </>
                            )}
                        />
                        <Bar dataKey="anterior" name={mesAnteriorLabel} fill="#9ca3af" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="actual" name={mesActualLabel} radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {data.map((d) => (
                        <span key={d.nombre}>
                            <strong className="text-gray-700">{d.nombre}:</strong>{' '}
                            <span className={d.delta >= 0 ? 'text-red-600' : 'text-green-600'}>
                                {d.delta >= 0 ? '+' : ''}{d.delta}%
                            </span>
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
