import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Area,
    ComposedChart,
} from 'recharts';
import type { TotalesMensuales } from '../reportes.types';

interface RatioHistoricoProps {
    totales: TotalesMensuales[];
    /** Cantidad de meses a mostrar (últimos N) */
    meses?: number;
}

export function RatioHistorico({ totales, meses = 12 }: RatioHistoricoProps) {
    const data = totales
        .slice(-meses)
        .map((t) => ({
            mes: new Date(t.mes + '-01').toLocaleDateString('es-MX', {
                month: 'short',
                year: '2-digit',
            }),
            ratio: t.ratio,
            ingresos: t.ingresos,
            gastos: t.gastos,
        }));

    if (data.length === 0) {
        return (
            <div className="flex h-[220px] items-center justify-center rounded-xl border border-gray-200 bg-white">
                <p className="text-sm text-gray-400">Sin datos para el período</p>
            </div>
        );
    }

    return (
        <section>
            <h2 className="mb-3 text-base font-semibold text-gray-900">
                Ratio ingresos / gastos (referencia 1.0 = equilibrio)
            </h2>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                        <defs>
                            <linearGradient id="ratioGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis
                            dataKey="mes"
                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            domain={['auto', 'auto']}
                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                            axisLine={false}
                            tickLine={false}
                            width={36}
                            tickFormatter={(v) => String(v)}
                        />
                        <Tooltip
                            formatter={(value: number) => [value.toFixed(2), 'Ratio']}
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                            labelFormatter={(label) => `Mes: ${label}`}
                        />
                        <ReferenceLine y={1} stroke="#dc2626" strokeWidth={1.5} strokeDasharray="4 4" />
                        <Area
                            type="monotone"
                            dataKey="ratio"
                            fill="url(#ratioGrad)"
                            stroke="none"
                        />
                        <Line
                            type="monotone"
                            dataKey="ratio"
                            stroke="#6366f1"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#6366f1' }}
                            activeDot={{ r: 5 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
                <p className="mt-1 text-xs text-gray-500">
                    Ratio &gt; 1 = saludable · Ratio &lt; 1 = déficit
                </p>
            </div>
        </section>
    );
}
