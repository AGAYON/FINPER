import { useState, useCallback } from 'react';
import {
    ShoppingCart, ShoppingBag, Utensils, Coffee, Car, Fuel,
    Home, Zap, Heart, Stethoscope, Dumbbell, Plane,
    Book, GraduationCap, Monitor, Music, Gift, Wrench,
    Briefcase, DollarSign, TrendingUp, PawPrint, Baby, Scissors, Circle,
} from 'lucide-react';
import { COLORES_PREDEFINIDOS, ICONOS_CATEGORIAS } from '../categorias.types';
import type {
    Categoria,
    CategoriaCreateInput,
    CategoriaUpdateInput,
    IconoCategoria,
    TipoCategoria,
} from '../categorias.types';

const ICONO_MAP: Record<IconoCategoria, React.ComponentType<{ className?: string }>> = {
    ShoppingCart, ShoppingBag, Utensils, Coffee, Car, Fuel,
    Home, Zap, Heart, Stethoscope, Dumbbell, Plane,
    Book, GraduationCap, Monitor, Music, Gift, Wrench,
    Briefcase, DollarSign, TrendingUp, PawPrint, Baby, Scissors, Circle,
};

interface CategoriaFormProps {
    categoriaInicial?: Categoria;
    tipoFijo?: TipoCategoria;
    onSubmit: (data: CategoriaCreateInput | CategoriaUpdateInput) => Promise<void>;
    onCancelar: () => void;
    isLoading: boolean;
}

export function CategoriaForm({
    categoriaInicial,
    tipoFijo,
    onSubmit,
    onCancelar,
    isLoading,
}: CategoriaFormProps) {
    const esEdicion = Boolean(categoriaInicial);

    const [nombre, setNombre] = useState(categoriaInicial?.nombre ?? '');
    const [tipo, setTipo] = useState<TipoCategoria>(
        categoriaInicial?.tipo ?? tipoFijo ?? 'gasto',
    );
    const [color, setColor] = useState(categoriaInicial?.color ?? COLORES_PREDEFINIDOS[0]);
    const [icono, setIcono] = useState<IconoCategoria>(
        (categoriaInicial?.icono as IconoCategoria) ?? 'Circle',
    );

    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
    const [errorApi, setErrorApi] = useState<string | null>(null);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setErrorValidacion(null);
            setErrorApi(null);

            const nombreTrim = nombre.trim();
            if (!nombreTrim) {
                setErrorValidacion('El nombre es obligatorio.');
                return;
            }

            try {
                await onSubmit({ nombre: nombreTrim, tipo, color, icono });
            } catch (err) {
                setErrorApi(err instanceof Error ? err.message : 'Error al guardar');
            }
        },
        [nombre, tipo, color, icono, onSubmit],
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {(errorValidacion || errorApi) && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
                    {errorValidacion ?? errorApi}
                </div>
            )}

            {/* Nombre */}
            <div>
                <label htmlFor="cat-nombre" className="block text-sm font-medium text-gray-700">
                    Nombre
                </label>
                <input
                    id="cat-nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Ej. Supermercado"
                    maxLength={60}
                />
            </div>

            {/* Tipo */}
            {!tipoFijo && (
                <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">Tipo</span>
                    <div className="flex gap-2">
                        {(['ingreso', 'gasto'] as TipoCategoria[]).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTipo(t)}
                                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                                    tipo === t
                                        ? t === 'ingreso'
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-red-400 bg-red-50 text-red-700'
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {t === 'ingreso' ? 'Ingreso' : 'Gasto'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Ícono */}
            <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Ícono</span>
                <div className="grid grid-cols-5 gap-1 max-h-44 overflow-y-auto rounded-md border border-gray-200 p-2">
                    {ICONOS_CATEGORIAS.map((nombre) => {
                        const Ic = ICONO_MAP[nombre];
                        const selected = icono === nombre;
                        return (
                            <button
                                key={nombre}
                                type="button"
                                onClick={() => setIcono(nombre)}
                                title={nombre}
                                className={`flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-colors ${
                                    selected
                                        ? 'border border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border border-transparent text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Ic className="h-5 w-5" />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Color */}
            <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Color</span>
                <div className="flex flex-wrap gap-2">
                    {COLORES_PREDEFINIDOS.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                                color === c
                                    ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400'
                                    : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: c }}
                            aria-label={`Color ${c}`}
                        />
                    ))}
                </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancelar}
                    disabled={isLoading}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                    {isLoading ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear categoría'}
                </button>
            </div>
        </form>
    );
}
