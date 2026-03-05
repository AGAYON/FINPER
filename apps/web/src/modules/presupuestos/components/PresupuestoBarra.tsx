import { useState } from 'react';
import {
    ShoppingCart, ShoppingBag, Utensils, Coffee, Car, Fuel,
    Home, Zap, Heart, Stethoscope, Dumbbell, Plane,
    Book, GraduationCap, Monitor, Music, Gift, Wrench,
    Briefcase, DollarSign, TrendingUp, PawPrint, Baby, Scissors, Circle,
    Pencil, Trash2, Check, X,
} from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/currency';
import { ESTADO_META } from '../presupuestos.types';
import type { Presupuesto, PresupuestoUpdateInput } from '../presupuestos.types';
import type { IconoCategoria } from '../../categorias/categorias.types';

const ICONO_MAP: Record<IconoCategoria, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    ShoppingCart, ShoppingBag, Utensils, Coffee, Car, Fuel,
    Home, Zap, Heart, Stethoscope, Dumbbell, Plane,
    Book, GraduationCap, Monitor, Music, Gift, Wrench,
    Briefcase, DollarSign, TrendingUp, PawPrint, Baby, Scissors, Circle,
};

interface PresupuestoBarraProps {
    presupuesto: Presupuesto;
    onActualizar: (id: string, data: PresupuestoUpdateInput) => Promise<void>;
    onEliminar: (id: string) => Promise<void>;
    isUpdating: boolean;
    isDeleting: boolean;
}

export function PresupuestoBarra({ presupuesto, onActualizar, onEliminar, isUpdating, isDeleting }: PresupuestoBarraProps) {
    const [editando, setEditando] = useState(false);
    const [confirmarEliminar, setConfirmarEliminar] = useState(false);
    const [nuevoLimite, setNuevoLimite] = useState('');
    const [errorApi, setErrorApi] = useState<string | null>(null);

    const handleEliminar = () => {
        if (!confirmarEliminar) {
            setConfirmarEliminar(true);
            return;
        }
        onEliminar(presupuesto.id);
        setConfirmarEliminar(false);
    };

    const limite = Number(presupuesto.montoLimite);
    const gasto = presupuesto.gastoReal;
    const porcentaje = presupuesto.porcentaje;
    const barraAncho = Math.min(porcentaje, 100);
    const estado = ESTADO_META[presupuesto.estado];

    const Icono = ICONO_MAP[presupuesto.categoria.icono as IconoCategoria] ?? Circle;

    const iniciarEdicion = () => {
        setNuevoLimite(String(limite));
        setErrorApi(null);
        setEditando(true);
    };

    const cancelarEdicion = () => {
        setEditando(false);
        setErrorApi(null);
    };

    const guardarEdicion = async () => {
        const valor = parseFloat(nuevoLimite);
        if (isNaN(valor) || valor <= 0) {
            setErrorApi('Ingresa un monto válido mayor a 0.');
            return;
        }
        try {
            await onActualizar(presupuesto.id, { montoLimite: valor });
            setEditando(false);
            setErrorApi(null);
        } catch (err) {
            setErrorApi(err instanceof Error ? err.message : 'Error al guardar');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') guardarEdicion();
        if (e.key === 'Escape') cancelarEdicion();
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            {/* Cabecera: ícono + nombre + badges */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: presupuesto.categoria.color + '25' }}
                    >
                        <Icono
                            className="h-4 w-4"
                            style={{ color: presupuesto.categoria.color }}
                        />
                    </div>
                    <span className="font-medium text-gray-900 truncate">
                        {presupuesto.categoria.nombre}
                    </span>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                    {presupuesto.mes === null && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            Default
                        </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estado.bgCls} ${estado.textCls}`}>
                        {estado.label}
                    </span>
                </div>
            </div>

            {/* Barra de progreso */}
            <div className="mt-3">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${estado.barCls}`}
                        style={{ width: `${barraAncho}%` }}
                    />
                </div>
            </div>

            {/* Números y edición */}
            <div className="mt-2 flex items-center justify-between gap-2">
                <div className="text-sm text-gray-600">
                    <span className={`font-medium ${estado.textCls}`}>
                        {formatCurrency(gasto)}
                    </span>
                    {' de '}
                    {!editando ? (
                        <span className="font-medium text-gray-900">{formatCurrency(limite)}</span>
                    ) : (
                        <span className="inline-flex items-center gap-1">
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={nuevoLimite}
                                onChange={(e) => setNuevoLimite(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                className="w-28 rounded border border-indigo-400 bg-white px-2 py-0.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={guardarEdicion}
                                disabled={isUpdating}
                                className="rounded bg-indigo-600 p-1 text-white hover:bg-indigo-700 disabled:opacity-50"
                                title="Guardar"
                            >
                                <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={cancelarEdicion}
                                className="rounded bg-gray-200 p-1 text-gray-700 hover:bg-gray-300"
                                title="Cancelar"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <span className={`text-sm font-semibold ${estado.textCls}`}>
                        {porcentaje.toFixed(0)}%
                    </span>
                    {!editando && !confirmarEliminar && (
                        <>
                            <button
                                type="button"
                                onClick={iniciarEdicion}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                title="Editar límite"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={handleEliminar}
                                disabled={isDeleting}
                                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                title="Eliminar presupuesto"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </>
                    )}
                    {confirmarEliminar && (
                        <>
                            <button
                                type="button"
                                onClick={handleEliminar}
                                disabled={isDeleting}
                                className="rounded border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                                Sí, eliminar
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmarEliminar(false)}
                                className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                        </>
                    )}
                </div>
            </div>

            {errorApi && (
                <p className="mt-1 text-xs text-red-600">{errorApi}</p>
            )}
        </div>
    );
}
