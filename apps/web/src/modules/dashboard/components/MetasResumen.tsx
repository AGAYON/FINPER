import { Target } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/currency';
import type { DashboardMeta } from '../dashboard.types';

function MetaCard({ meta }: { meta: DashboardMeta }) {
    const barraAncho = Math.min(meta.porcentaje, 100);
    const completada = meta.porcentaje >= 100;

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                    <Target className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <span className="min-w-0 flex-1 truncate font-medium text-gray-900">{meta.nombre}</span>
                <span className={`shrink-0 text-sm font-semibold ${completada ? 'text-green-700' : 'text-indigo-700'}`}>
                    {meta.porcentaje}%
                </span>
            </div>
            <div className="mt-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${completada ? 'bg-green-500' : 'bg-indigo-500'}`}
                        style={{ width: `${barraAncho}%` }}
                    />
                </div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>{formatCurrency(meta.progreso)}</span>
                <span>{formatCurrency(meta.objetivo)}</span>
            </div>
        </div>
    );
}

interface MetasResumenProps {
    metas: DashboardMeta[];
}

export function MetasResumen({ metas }: MetasResumenProps) {
    if (metas.length === 0) {
        return <p className="text-sm text-gray-400">Sin metas activas.</p>;
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metas.map((m) => (
                <MetaCard key={m.id} meta={m} />
            ))}
        </div>
    );
}
