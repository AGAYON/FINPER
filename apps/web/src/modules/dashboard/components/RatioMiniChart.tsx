import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import type { TotalesMensuales } from '../../reportes/reportes.types';

interface RatioMiniChartProps {
    totales: TotalesMensuales[];
    meses?: number;
}

export function RatioMiniChart({ totales, meses = 6 }: RatioMiniChartProps) {
    const data = totales.slice(-meses).map((t) => ({
        mes: new Date(t.mes + '-01').toLocaleDateString('es-MX', {
            month: 'short',
            year: '2-digit',
        }),
        ratio: t.ratio,
    }));

    if (data.length === 0) {
        return (
            <div className="flex h-[120px] items-center justify-center rounded-lg border border-gray-200 bg-white">
                <p className="text-xs text-gray-400">Sin datos</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="mb-1 text-center text-xs font-medium text-gray-500">
                Ratio ingresos/gastos (ref. 1.0)
            </p>
            <ResponsiveContainer width="100%" height={120}>
                <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <XAxis
                        dataKey="mes"
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        domain={[0, 'auto']}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        width={28}
                        tickFormatter={(v) => String(v)}
                    />
                    <Tooltip
                        formatter={(value: number) => [value.toFixed(2), 'Ratio']}
                        contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e5e7eb' }}
                    />
                    <ReferenceLine y={1} stroke="#dc2626" strokeWidth={1} strokeDasharray="2 2" />
                    <Bar
                        dataKey="ratio"
                        fill="#6366f1"
                        radius={[2, 2, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
