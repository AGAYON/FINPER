import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrencyCompact } from '../../../shared/utils/currency';
import type { DashboardSnapshot } from '../dashboard.types';

interface NetWorthChartProps {
    snapshots: DashboardSnapshot[];
}

export function NetWorthChart({ snapshots }: NetWorthChartProps) {
    if (snapshots.length === 0) {
        return (
            <p className="py-8 text-center text-sm text-gray-400">
                Sin datos históricos todavía.
            </p>
        );
    }

    // Snapshots come ordered desc from backend — reverse for chronological display
    const data = [...snapshots].reverse().map((s) => ({
        fecha: new Date(s.fecha).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
        total: Number(s.total),
    }));

    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tickFormatter={(v: number) => formatCurrencyCompact(v)}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={64}
                />
                <Tooltip
                    formatter={(value: number) => [formatCurrencyCompact(value), 'Net worth']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#6366f1' }}
                    activeDot={{ r: 5 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
