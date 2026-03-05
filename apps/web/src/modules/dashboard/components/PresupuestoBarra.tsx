import { formatCurrency } from '../../../shared/utils/currency';
import type { DashboardPresupuesto } from '../dashboard.types';

const ESTADO_MAP = {
    ok: {
        label: 'En rango',
        barCls: 'bg-green-500',
        textCls: 'text-green-700',
        bgCls: 'bg-green-100',
    },
    advertencia: {
        label: 'Cerca del límite',
        barCls: 'bg-yellow-400',
        textCls: 'text-yellow-700',
        bgCls: 'bg-yellow-100',
    },
    excedido: {
        label: 'Excedido',
        barCls: 'bg-red-500',
        textCls: 'text-red-700',
        bgCls: 'bg-red-100',
    },
} as const;

interface PresupuestoBarraProps {
    presupuesto: DashboardPresupuesto;
}

export function PresupuestoBarra({ presupuesto }: PresupuestoBarraProps) {
    const { categoria, limite, gastado, porcentaje, estado } = presupuesto;
    const estadoUI = ESTADO_MAP[estado];
    const barraAncho = Math.min(porcentaje, 100);

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-gray-900 truncate">{categoria}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${estadoUI.bgCls} ${estadoUI.textCls}`}>
                    {estadoUI.label}
                </span>
            </div>
            <div className="mt-2">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${estadoUI.barCls}`}
                        style={{ width: `${barraAncho}%` }}
                    />
                </div>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                    <span className={`font-medium ${estadoUI.textCls}`}>{formatCurrency(gastado)}</span>
                    {' de '}
                    <span className="font-medium text-gray-900">{formatCurrency(limite)}</span>
                </span>
                <span className={`font-semibold ${estadoUI.textCls}`}>{porcentaje.toFixed(0)}%</span>
            </div>
        </div>
    );
}
