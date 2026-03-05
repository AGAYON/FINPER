import { useState } from 'react';
import {
    ShoppingCart, ShoppingBag, Utensils, Coffee, Car, Fuel,
    Home, Zap, Heart, Stethoscope, Dumbbell, Plane,
    Book, GraduationCap, Monitor, Music, Gift, Wrench,
    Briefcase, DollarSign, TrendingUp, PawPrint, Baby, Scissors, Circle,
    Pencil, Play, ToggleLeft, ToggleRight, CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/currency';
import type { Recurrente } from '../recurrentes.types';

const ICONO_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    ShoppingCart, ShoppingBag, Utensils, Coffee, Car, Fuel,
    Home, Zap, Heart, Stethoscope, Dumbbell, Plane,
    Book, GraduationCap, Monitor, Music, Gift, Wrench,
    Briefcase, DollarSign, TrendingUp, PawPrint, Baby, Scissors, Circle,
};

interface RecurrenteItemProps {
    recurrente: Recurrente;
    onEditar: (r: Recurrente) => void;
    onToggleActivo: (r: Recurrente) => void;
    onEjecutar: (r: Recurrente) => Promise<void>;
    isEjecutando: boolean;
    ejecutandoId?: string;
}

export function RecurrenteItem({
    recurrente: r,
    onEditar,
    onToggleActivo,
    onEjecutar,
    isEjecutando,
    ejecutandoId,
}: RecurrenteItemProps) {
    const [exito, setExito] = useState(false);

    const CategoriaIcono = ICONO_MAP[r.categoria.icono] ?? Circle;
    const monto = Number(r.monto);
    const esteEjecutando = isEjecutando && ejecutandoId === r.id;

    const proximaFechaStr = r.proximaFecha
        ? new Date(r.proximaFecha).toLocaleDateString('es-MX', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
          })
        : null;

    const handleEjecutar = async () => {
        await onEjecutar(r);
        setExito(true);
        setTimeout(() => setExito(false), 3000);
    };

    return (
        <div
            className={`flex items-start gap-3 rounded-lg border bg-white p-3 shadow-sm sm:p-4 transition-opacity ${
                !r.activo ? 'opacity-60' : ''
            } ${r.pendiente && r.activo ? 'border-amber-300' : 'border-gray-200'}`}
        >
            {/* Icono de categoría */}
            <div
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: r.categoria.color + '22' }}
            >
                <CategoriaIcono className="h-4 w-4" style={{ color: r.categoria.color }} />
            </div>

            {/* Contenido */}
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{r.nombre}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {r.categoria.nombre}
                            {' · '}
                            <span
                                className="rounded px-1 py-0.5"
                                style={{ backgroundColor: r.cuenta.color + '22', color: r.cuenta.color }}
                            >
                                {r.cuenta.nombre}
                            </span>
                        </p>
                    </div>
                    <div className="shrink-0 text-right">
                        <p
                            className={`font-semibold tabular-nums ${
                                r.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                            }`}
                        >
                            {r.tipo === 'ingreso' ? '+' : '-'}
                            {formatCurrency(monto)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Día {r.diaDelMes}</p>
                    </div>
                </div>

                {/* Próxima fecha y estado pendiente */}
                {r.activo && (
                    <div className="mt-1.5 flex items-center gap-2 text-xs">
                        {r.pendiente && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 font-medium">
                                Pendiente este mes
                            </span>
                        )}
                        {proximaFechaStr && (
                            <span className="text-gray-400">Próxima: {proximaFechaStr}</span>
                        )}
                    </div>
                )}

                {/* Feedback de éxito */}
                {exito && (
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Transacción generada correctamente
                    </div>
                )}

                {/* Acciones */}
                <div className="mt-2 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onEditar(r)}
                        className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                    </button>

                    <button
                        type="button"
                        onClick={() => onToggleActivo(r)}
                        className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
                            r.activo
                                ? 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                        title={r.activo ? 'Desactivar' : 'Activar'}
                    >
                        {r.activo ? (
                            <ToggleRight className="h-3.5 w-3.5 text-indigo-500" />
                        ) : (
                            <ToggleLeft className="h-3.5 w-3.5 text-gray-400" />
                        )}
                        {r.activo ? 'Activo' : 'Inactivo'}
                    </button>

                    {r.activo && (
                        <button
                            type="button"
                            onClick={handleEjecutar}
                            disabled={esteEjecutando}
                            className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                        >
                            <Play className="h-3.5 w-3.5" />
                            {esteEjecutando ? 'Ejecutando…' : 'Ejecutar'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
