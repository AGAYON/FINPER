import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../../shared/utils/currency';
import type { CategoriaPorMes } from '../../reportes/reportes.types';

interface DonutGastosMiniProps {
    gastos: CategoriaPorMes[];
    mesLabel: string;
}

export function DonutGastosMini({ gastos, mesLabel }: DonutGastosMiniProps) {
    const data = gastos.map((g) => ({
        name: g.categoria_nombre,
        value: g.total,
        color: g.categoria_color,
    }));

    if (data.length === 0) {
        return (
            <div className="flex h-[160px] items-center justify-center rounded-lg border border-gray-200 bg-white">
                <p className="text-xs text-gray-400">Sin gastos este mes</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="mb-1 text-center text-xs font-medium text-gray-500">Gastos · {mesLabel}</p>
            <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={48}
                        paddingAngle={1}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e5e7eb' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
