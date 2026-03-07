import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '../../../shared/utils/currency';
import type { CategoriaPorMes } from '../reportes.types';

interface DonutCategoriaProps {
    /** Gastos del mes más reciente: categoría + total */
    gastos: CategoriaPorMes[];
    /** Ingresos del mes más reciente: categoría + total */
    ingresos: CategoriaPorMes[];
    /** Título opcional */
    title?: string;
}

function DonutSingle({
    data,
    title,
    emptyLabel,
}: {
    data: Array<{ name: string; value: number; color: string }>;
    title: string;
    emptyLabel: string;
}) {
    if (data.length === 0) {
        return (
            <div className="flex h-[240px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50/50">
                <p className="text-sm text-gray-400">{emptyLabel}</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="mb-2 text-center text-sm font-medium text-gray-600">{title}</p>
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={1}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                    />
                    <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        formatter={(value, entry) => (
                            <span className="text-xs text-gray-700">
                                <span
                                    className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: (entry as { color?: string }).color }}
                                />
                                {value} — {formatCurrency(entry.payload?.value ?? 0)}
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export function DonutCategoria({ gastos, ingresos, title }: DonutCategoriaProps) {
    const gastosData = gastos.map((g) => ({
        name: g.categoria_nombre,
        value: g.total,
        color: g.categoria_color,
    }));

    const ingresosData = ingresos.map((i) => ({
        name: i.categoria_nombre,
        value: i.total,
        color: i.categoria_color,
    }));

    return (
        <section>
            {title && (
                <h2 className="mb-3 text-base font-semibold text-gray-900">{title}</h2>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
                <DonutSingle
                    data={gastosData}
                    title="Gastos del mes"
                    emptyLabel="Sin gastos en este mes"
                />
                <DonutSingle
                    data={ingresosData}
                    title="Ingresos del mes"
                    emptyLabel="Sin ingresos en este mes"
                />
            </div>
        </section>
    );
}
