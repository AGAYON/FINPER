import { useState } from 'react';
import {
    Play, CheckCircle2, Circle,
    ShoppingCart, ShoppingBag, Utensils, Coffee, Car, Fuel,
    Home, Zap, Heart, Stethoscope, Dumbbell, Plane,
    Book, GraduationCap, Monitor, Music, Gift, Wrench,
    Briefcase, DollarSign, TrendingUp, PawPrint, Baby, Scissors,
} from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/currency';
import type { DashboardRecurrentePendiente } from '../dashboard.types';

const ICONO_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    ShoppingCart, ShoppingBag, Utensils, Coffee, Car, Fuel,
    Home, Zap, Heart, Stethoscope, Dumbbell, Plane,
    Book, GraduationCap, Monitor, Music, Gift, Wrench,
    Briefcase, DollarSign, TrendingUp, PawPrint, Baby, Scissors, Circle,
};

interface RecurrentesPendientesProps {
    recurrentes: DashboardRecurrentePendiente[];
    onEjecutar: (id: string) => Promise<unknown>;
    isEjecutando: boolean;
    ejecutandoId?: string;
}

function RecurrenteRow({
    r,
    onEjecutar,
    isEjecutando,
    ejecutandoId,
}: {
    r: DashboardRecurrentePendiente;
    onEjecutar: (id: string) => Promise<unknown>;
    isEjecutando: boolean;
    ejecutandoId?: string;
}) {
    const [exito, setExito] = useState(false);
    const Icono = ICONO_MAP[r.categoria.icono] ?? Circle;
    const monto = Number(r.monto);
    const esteEjecutando = isEjecutando && ejecutandoId === r.id;

    const handleEjecutar = async () => {
        await onEjecutar(r.id);
        setExito(true);
        setTimeout(() => setExito(false), 3000);
    };

    return (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: r.categoria.color + '22' }}
            >
                <Icono className="h-4 w-4" style={{ color: r.categoria.color }} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{r.nombre}</p>
                <p className="text-xs text-gray-500">
                    {r.categoria.nombre} · Día {r.diaDelMes}
                </p>
            </div>
            <div className="shrink-0 text-right">
                <p className={`text-sm font-semibold tabular-nums ${r.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                    {r.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(monto)}
                </p>
                {exito ? (
                    <span className="flex items-center justify-end gap-1 text-xs text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Hecho
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={handleEjecutar}
                        disabled={esteEjecutando}
                        className="mt-0.5 inline-flex items-center gap-1 rounded border border-indigo-200 bg-white px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                    >
                        <Play className="h-3 w-3" />
                        {esteEjecutando ? 'Ejecutando…' : 'Ejecutar'}
                    </button>
                )}
            </div>
        </div>
    );
}

export function RecurrentesPendientes({ recurrentes, onEjecutar, isEjecutando, ejecutandoId }: RecurrentesPendientesProps) {
    if (recurrentes.length === 0) return null;

    return (
        <div>
            <h3 className="mb-2 text-sm font-semibold text-amber-700">
                Recurrentes pendientes ({recurrentes.length})
            </h3>
            <div className="space-y-2">
                {recurrentes.map((r) => (
                    <RecurrenteRow
                        key={r.id}
                        r={r}
                        onEjecutar={onEjecutar}
                        isEjecutando={isEjecutando}
                        ejecutandoId={ejecutandoId}
                    />
                ))}
            </div>
        </div>
    );
}
