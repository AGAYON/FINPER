import { useState, useCallback } from 'react';
import type { Categoria } from '../../categorias/categorias.types';
import type { PresupuestoCreateInput } from '../presupuestos.types';

interface PresupuestoFormProps {
    categorias: Categoria[];
    categoriasConPresupuesto: Set<string>;
    mesActual: string; // "YYYY-MM"
    onSubmit: (data: PresupuestoCreateInput) => Promise<void>;
    onCancelar: () => void;
    isLoading: boolean;
}

export function PresupuestoForm({
    categorias,
    categoriasConPresupuesto,
    mesActual,
    onSubmit,
    onCancelar,
    isLoading,
}: PresupuestoFormProps) {
    const categoriasDisponibles = categorias.filter(
        (c) => c.tipo === 'gasto' && !categoriasConPresupuesto.has(c.id),
    );

    const [categoriaId, setCategoriaId] = useState(categoriasDisponibles[0]?.id ?? '');
    const [montoLimite, setMontoLimite] = useState('');
    const [esDefault, setEsDefault] = useState(false);
    const [mes, setMes] = useState(mesActual);

    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
    const [errorApi, setErrorApi] = useState<string | null>(null);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setErrorValidacion(null);
            setErrorApi(null);

            if (!categoriaId) {
                setErrorValidacion('Selecciona una categoría.');
                return;
            }
            const monto = parseFloat(montoLimite);
            if (isNaN(monto) || monto <= 0) {
                setErrorValidacion('Ingresa un monto límite válido mayor a 0.');
                return;
            }
            if (!esDefault && !mes) {
                setErrorValidacion('Ingresa el mes.');
                return;
            }

            try {
                await onSubmit({
                    categoriaId,
                    montoLimite: monto,
                    mes: esDefault ? null : mes,
                });
            } catch (err) {
                setErrorApi(err instanceof Error ? err.message : 'Error al guardar');
            }
        },
        [categoriaId, montoLimite, esDefault, mes, onSubmit],
    );

    if (categoriasDisponibles.length === 0) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-gray-600">
                    Todas las categorías de gasto ya tienen presupuesto este mes.
                </p>
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={onCancelar}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {(errorValidacion || errorApi) && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
                    {errorValidacion ?? errorApi}
                </div>
            )}

            {/* Categoría */}
            <div>
                <label htmlFor="pres-categoria" className="block text-sm font-medium text-gray-700">
                    Categoría
                </label>
                <select
                    id="pres-categoria"
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                    {categoriasDisponibles.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.nombre}
                        </option>
                    ))}
                </select>
            </div>

            {/* Monto límite */}
            <div>
                <label htmlFor="pres-monto" className="block text-sm font-medium text-gray-700">
                    Monto límite
                </label>
                <input
                    id="pres-monto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={montoLimite}
                    onChange={(e) => setMontoLimite(e.target.value)}
                    placeholder="0.00"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            {/* Alcance: mes o default */}
            <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Alcance</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setEsDefault(false)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            !esDefault
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Mes específico
                    </button>
                    <button
                        type="button"
                        onClick={() => setEsDefault(true)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            esDefault
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Default (todos los meses)
                    </button>
                </div>

                {!esDefault && (
                    <input
                        type="month"
                        value={mes}
                        onChange={(e) => setMes(e.target.value)}
                        className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                )}

                {esDefault && (
                    <p className="mt-2 text-xs text-gray-500">
                        Se aplicará automáticamente a cualquier mes que no tenga un presupuesto específico.
                    </p>
                )}
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
                    {isLoading ? 'Guardando…' : 'Crear presupuesto'}
                </button>
            </div>
        </form>
    );
}
