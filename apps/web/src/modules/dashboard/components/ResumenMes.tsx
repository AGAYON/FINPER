import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/currency';
import type { DashboardMesActual } from '../dashboard.types';

interface ResumenMesProps {
    mes: DashboardMesActual;
}

export function ResumenMes({ mes }: ResumenMesProps) {
    const { ingresos, gastos, balance } = mes;
    const balancePositivo = balance > 0;
    const balanceCero = balance === 0;

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Este mes</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
                <div>
                    <p className="text-xs font-medium text-gray-400">Ingresos</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold tabular-nums text-green-700">
                        <ArrowUp className="h-3.5 w-3.5 shrink-0" />
                        {formatCurrency(ingresos)}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-400">Gastos</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold tabular-nums text-red-600">
                        <ArrowDown className="h-3.5 w-3.5 shrink-0" />
                        {formatCurrency(gastos)}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-400">Balance</p>
                    <p className={`mt-0.5 flex items-center gap-1 text-sm font-bold tabular-nums ${
                        balanceCero ? 'text-gray-600' : balancePositivo ? 'text-green-700' : 'text-red-600'
                    }`}>
                        {balanceCero ? (
                            <Minus className="h-3.5 w-3.5 shrink-0" />
                        ) : balancePositivo ? (
                            <ArrowUp className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                            <ArrowDown className="h-3.5 w-3.5 shrink-0" />
                        )}
                        {formatCurrency(Math.abs(balance))}
                    </p>
                </div>
            </div>
        </div>
    );
}
