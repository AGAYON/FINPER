import { useState } from 'react';
import {
    ShoppingCart, ShoppingBag, Utensils, Coffee, Car, Fuel,
    Home, Zap, Heart, Stethoscope, Dumbbell, Plane,
    Book, GraduationCap, Monitor, Music, Gift, Wrench,
    Briefcase, DollarSign, TrendingUp, PawPrint, Baby, Scissors, Circle,
    ArrowRight, Pencil, Trash2, X,
} from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/currency';
import { formatDate } from '../../../shared/utils/dates';
import { TIPO_TRANSACCION_META } from '../transacciones.types';
import type { Transaccion } from '../transacciones.types';

const ICONO_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    ShoppingCart, ShoppingBag, Utensils, Coffee, Car, Fuel,
    Home, Zap, Heart, Stethoscope, Dumbbell, Plane,
    Book, GraduationCap, Monitor, Music, Gift, Wrench,
    Briefcase, DollarSign, TrendingUp, PawPrint, Baby, Scissors, Circle,
};

interface TransaccionItemProps {
    transaccion: Transaccion;
    onEditar: (t: Transaccion) => void;
    onEliminar: (t: Transaccion) => void;
    isDeleting?: boolean;
}

export function TransaccionItem({
    transaccion: t,
    onEditar,
    onEliminar,
    isDeleting,
}: TransaccionItemProps) {
    const [confirmar, setConfirmar] = useState(false);

    const meta = TIPO_TRANSACCION_META[t.tipo];
    const monto = Number(t.monto);

    const CategoriaIcono = t.categoria
        ? (ICONO_MAP[t.categoria.icono] ?? Circle)
        : null;

    const handleEliminar = () => {
        if (!confirmar) {
            setConfirmar(true);
            return;
        }
        onEliminar(t);
        setConfirmar(false);
    };

    return (
        <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
            {/* Indicador de categoría o tipo */}
            <div
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={
                    t.categoria
                        ? { backgroundColor: t.categoria.color + '22' }
                        : { backgroundColor: '#6366f122' }
                }
            >
                {CategoriaIcono ? (
                    <CategoriaIcono
                        className="h-4 w-4"
                        style={{ color: t.categoria?.color }}
                    />
                ) : (
                    <ArrowRight className="h-4 w-4 text-indigo-500" />
                )}
            </div>

            {/* Contenido principal */}
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{t.descripcion}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(t.fecha)}{' '}
                            {t.categoria && (
                                <span>· {t.categoria.nombre}</span>
                            )}
                        </p>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className={`font-semibold tabular-nums ${meta.colorMonto}`}>
                            {meta.signo}
                            {formatCurrency(monto, t.cuentaOrigen.moneda)}
                        </p>
                    </div>
                </div>

                {/* Cuentas */}
                <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
                    <span
                        className="max-w-[120px] truncate rounded px-1.5 py-0.5"
                        style={{ backgroundColor: t.cuentaOrigen.color + '22', color: t.cuentaOrigen.color }}
                    >
                        {t.cuentaOrigen.nombre}
                    </span>
                    {t.cuentaDestino && (
                        <>
                            <ArrowRight className="h-3 w-3 shrink-0" />
                            <span
                                className="max-w-[120px] truncate rounded px-1.5 py-0.5"
                                style={{ backgroundColor: t.cuentaDestino.color + '22', color: t.cuentaDestino.color }}
                            >
                                {t.cuentaDestino.nombre}
                            </span>
                        </>
                    )}
                </div>

                {/* Notas */}
                {t.notas && (
                    <p className="mt-1 text-xs text-gray-400 italic truncate">{t.notas}</p>
                )}

                {/* Acciones */}
                <div className="mt-2 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onEditar(t)}
                        className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                    </button>

                    {!confirmar ? (
                        <button
                            type="button"
                            onClick={handleEliminar}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                        </button>
                    ) : (
                        <>
                            <span className="self-center text-xs text-gray-500">¿Confirmar?</span>
                            <button
                                type="button"
                                onClick={handleEliminar}
                                disabled={isDeleting}
                                className="inline-flex items-center gap-1 rounded border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                                Sí, eliminar
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmar(false)}
                                className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            >
                                <X className="h-3.5 w-3.5" />
                                Cancelar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
