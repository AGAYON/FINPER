import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/currency';
import type { DashboardNetWorth } from '../dashboard.types';

interface NetWorthCardProps {
    netWorth: DashboardNetWorth;
}

export function NetWorthCard({ netWorth }: NetWorthCardProps) {
    const { total, activos, pasivos } = netWorth;
    const positivo = total >= 0;

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Patrimonio neto</p>
            <div className="mt-1 flex items-end gap-2">
                <p className={`text-3xl font-bold tabular-nums ${positivo ? 'text-gray-900' : 'text-red-600'}`}>
                    {formatCurrency(total)}
                </p>
                {positivo ? (
                    <TrendingUp className="mb-1 h-5 w-5 text-green-500" />
                ) : (
                    <TrendingDown className="mb-1 h-5 w-5 text-red-500" />
                )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-green-50 px-3 py-2">
                    <p className="text-xs font-medium text-green-700">Activos</p>
                    <p className="mt-0.5 text-base font-semibold tabular-nums text-green-800">
                        {formatCurrency(activos)}
                    </p>
                </div>
                <div className="rounded-lg bg-red-50 px-3 py-2">
                    <p className="text-xs font-medium text-red-700">Pasivos</p>
                    <p className="mt-0.5 text-base font-semibold tabular-nums text-red-800">
                        {formatCurrency(pasivos)}
                    </p>
                </div>
            </div>
        </div>
    );
}
