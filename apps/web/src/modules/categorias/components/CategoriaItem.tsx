import { useState } from 'react';
import {
    ShoppingCart, ShoppingBag, Utensils, Coffee, Car, Fuel,
    Home, Zap, Heart, Stethoscope, Dumbbell, Plane,
    Book, GraduationCap, Monitor, Music, Gift, Wrench,
    Briefcase, DollarSign, TrendingUp, PawPrint, Baby, Scissors, Circle,
    Pencil, Archive, X,
} from 'lucide-react';
import type { Categoria, IconoCategoria } from '../categorias.types';

const ICONO_MAP: Record<IconoCategoria, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    ShoppingCart, ShoppingBag, Utensils, Coffee, Car, Fuel,
    Home, Zap, Heart, Stethoscope, Dumbbell, Plane,
    Book, GraduationCap, Monitor, Music, Gift, Wrench,
    Briefcase, DollarSign, TrendingUp, PawPrint, Baby, Scissors, Circle,
};

interface CategoriaItemProps {
    categoria: Categoria;
    onEditar: (categoria: Categoria) => void;
    onArchivar: (categoria: Categoria) => void;
    isArchiving?: boolean;
}

export function CategoriaItem({ categoria, onEditar, onArchivar, isArchiving }: CategoriaItemProps) {
    const [confirmar, setConfirmar] = useState(false);

    const Icono = ICONO_MAP[categoria.icono as IconoCategoria] ?? Circle;

    const handleArchivar = () => {
        if (!confirmar) {
            setConfirmar(true);
            return;
        }
        onArchivar(categoria);
        setConfirmar(false);
    };

    return (
        <div
            className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
            style={{ borderLeftWidth: '4px', borderLeftColor: categoria.color }}
        >
            <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: categoria.color + '25' }}
                        >
                            <Icono
                                className="h-4 w-4"
                                style={{ color: categoria.color }}
                            />
                        </div>
                        <span className="font-medium text-gray-900 truncate">
                            {categoria.nombre}
                        </span>
                    </div>
                    <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                            categoria.tipo === 'ingreso'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                        }`}
                    >
                        {categoria.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                    </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onEditar(categoria)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        <Pencil className="h-4 w-4" />
                        Editar
                    </button>

                    {!confirmar ? (
                        <button
                            type="button"
                            onClick={handleArchivar}
                            disabled={isArchiving}
                            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                            <Archive className="h-4 w-4" />
                            Archivar
                        </button>
                    ) : (
                        <>
                            <span className="self-center text-sm text-gray-600">¿Confirmar?</span>
                            <button
                                type="button"
                                onClick={handleArchivar}
                                disabled={isArchiving}
                                className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                                Sí, archivar
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmar(false)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <X className="h-4 w-4" />
                                Cancelar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
