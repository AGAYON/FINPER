import { useState } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { formatCurrency } from '../../../shared/utils/currency';
import type { CategoriaPorMes } from '../reportes.types';

type VistaTendencia = 'lineas' | 'area' | 'barras';

interface TendenciaCategoriasProps {
    datos: CategoriaPorMes[];
    tipo: 'gasto' | 'ingreso';
    meses: string[];
}

export function TendenciaCategorias({ datos, tipo, meses }: TendenciaCategoriasProps) {
    const [vista, setVista] = useState<VistaTendencia>('lineas');

    const categorias = Array.from(
        new Map(datos.map((d) => [d.categoria_id, { id: d.categoria_id, nombre: d.categoria_nombre, color: d.categoria_color }])).values(),
    );

    const byMesCategoria = new Map<string, number>();
    datos.forEach((d) => {
        byMesCategoria.set(`${d.mes}-${d.categoria_id}`, d.total);
    });

    const data = meses.map((mes) => {
        const point: Record<string, string | number> = {
            mes: new Date(mes + '-01').toLocaleDateString('es-MX', {
                month: 'short',
                year: '2-digit',
            }),
        };
        categorias.forEach((c) => {
            point[c.nombre] = byMesCategoria.get(`${mes}-${c.id}`) ?? 0;
        });
        return point;
    });

    if (categorias.length === 0 || data.length === 0) {
        return (
            <div className="flex h-[280px] items-center justify-center rounded-xl border border-gray-200 bg-white">
                <p className="text-sm text-gray-400">Sin datos de tendencia</p>
            </div>
        );
    }

    const colorByCategoria = new Map(categorias.map((c) => [c.nombre, c.color]));

    return (
        <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-gray-900">
                    Tendencia por categoría ({tipo === 'gasto' ? 'Gastos' : 'Ingresos'})
                </h2>
                <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                    {(
                        [
                            { value: 'lineas' as const, label: 'Líneas' },
                            { value: 'area' as const, label: 'Área apilada' },
                            { value: 'barras' as const, label: 'Barras' },
                        ] as const
                    ).map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setVista(value)}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                vista === value
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <ResponsiveContainer width="100%" height={320}>
                    {vista === 'lineas' && (
                        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis
                                dataKey="mes"
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tickFormatter={(v) => formatCurrency(v)}
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                axisLine={false}
                                tickLine={false}
                                width={64}
                            />
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                            />
                            <Legend />
                            {categorias.map((c) => (
                                <Line
                                    key={c.id}
                                    type="monotone"
                                    dataKey={c.nombre}
                                    stroke={c.color}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: c.color }}
                                    activeDot={{ r: 5 }}
                                />
                            ))}
                        </LineChart>
                    )}
                    {vista === 'area' && (
                        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis
                                dataKey="mes"
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tickFormatter={(v) => formatCurrency(v)}
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                axisLine={false}
                                tickLine={false}
                                width={64}
                            />
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                            />
                            <Legend />
                            {categorias.map((c) => (
                                <Area
                                    key={c.id}
                                    type="monotone"
                                    dataKey={c.nombre}
                                    stackId="1"
                                    stroke={c.color}
                                    fill={c.color}
                                    fillOpacity={0.6}
                                />
                            ))}
                        </AreaChart>
                    )}
                    {vista === 'barras' && (
                        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis
                                dataKey="mes"
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tickFormatter={(v) => formatCurrency(v)}
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                axisLine={false}
                                tickLine={false}
                                width={64}
                            />
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                            />
                            <Legend />
                            {categorias.map((c) => (
                                <Bar key={c.id} dataKey={c.nombre} fill={c.color} radius={[2, 2, 0, 0]} stackId="a" />
                            ))}
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </section>
    );
}
