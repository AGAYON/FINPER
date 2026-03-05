import { useState, useCallback, useEffect } from 'react';
import { useCategorias } from '../../categorias/hooks/useCategorias';
import { useCuentas } from '../../cuentas/hooks/useCuentas';
import type { Recurrente, RecurrenteCreateInput, RecurrenteUpdateInput, TipoRecurrente } from '../recurrentes.types';

interface RecurrenteFormProps {
    recurrente?: Recurrente;
    onSubmit: (data: RecurrenteCreateInput | RecurrenteUpdateInput) => Promise<void>;
    onCancelar: () => void;
    isLoading: boolean;
}

export function RecurrenteForm({ recurrente, onSubmit, onCancelar, isLoading }: RecurrenteFormProps) {
    const esEdicion = !!recurrente;

    const { categorias } = useCategorias();
    const { cuentas } = useCuentas();

    const [nombre, setNombre] = useState(recurrente?.nombre ?? '');
    const [monto, setMonto] = useState(recurrente ? String(Number(recurrente.monto)) : '');
    const [tipo, setTipo] = useState<TipoRecurrente>(recurrente?.tipo ?? 'gasto');
    const [categoriaId, setCategoriaId] = useState(recurrente?.categoriaId ?? '');
    const [cuentaId, setCuentaId] = useState(recurrente?.cuentaId ?? '');
    const [diaDelMes, setDiaDelMes] = useState(recurrente?.diaDelMes ?? 1);

    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
    const [errorApi, setErrorApi] = useState<string | null>(null);

    // Resetear categoría cuando cambia el tipo
    useEffect(() => {
        if (!recurrente) {
            setCategoriaId('');
        }
    }, [tipo, recurrente]);

    const categoriasDelTipo = categorias[tipo] ?? [];
    const cuentasActivas = cuentas.filter((c) => c.activa);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setErrorValidacion(null);
            setErrorApi(null);

            if (!nombre.trim()) {
                setErrorValidacion('El nombre es obligatorio.');
                return;
            }
            const montoNum = parseFloat(monto);
            if (isNaN(montoNum) || montoNum <= 0) {
                setErrorValidacion('El monto debe ser mayor a 0.');
                return;
            }
            if (!categoriaId) {
                setErrorValidacion('Selecciona una categoría.');
                return;
            }
            if (!cuentaId) {
                setErrorValidacion('Selecciona una cuenta.');
                return;
            }
            const dia = Number(diaDelMes);
            if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
                setErrorValidacion('El día del mes debe estar entre 1 y 31.');
                return;
            }

            const payload: RecurrenteCreateInput = {
                nombre: nombre.trim(),
                monto: montoNum,
                tipo,
                categoriaId,
                cuentaId,
                diaDelMes: dia,
            };

            try {
                await onSubmit(payload);
            } catch (err) {
                setErrorApi(err instanceof Error ? err.message : 'Error al guardar');
            }
        },
        [nombre, monto, tipo, categoriaId, cuentaId, diaDelMes, onSubmit],
    );

    const inputCls =
        'mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {(errorValidacion || errorApi) && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
                    {errorValidacion ?? errorApi}
                </div>
            )}

            {/* Nombre */}
            <div>
                <label htmlFor="rec-nombre" className="block text-sm font-medium text-gray-700">
                    Nombre
                </label>
                <input
                    id="rec-nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Netflix, Renta, Sueldo"
                    className={inputCls}
                />
            </div>

            {/* Tipo */}
            <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">Tipo</span>
                <div className="flex gap-2">
                    {(['gasto', 'ingreso'] as TipoRecurrente[]).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTipo(t)}
                            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                                tipo === t
                                    ? t === 'gasto'
                                        ? 'border-red-400 bg-red-50 text-red-700'
                                        : 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {t === 'gasto' ? 'Gasto' : 'Ingreso'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Monto */}
            <div>
                <label htmlFor="rec-monto" className="block text-sm font-medium text-gray-700">
                    Monto
                </label>
                <input
                    id="rec-monto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    className={inputCls}
                />
            </div>

            {/* Categoría */}
            <div>
                <label htmlFor="rec-categoria" className="block text-sm font-medium text-gray-700">
                    Categoría
                </label>
                <select
                    id="rec-categoria"
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    className={inputCls}
                >
                    <option value="">Seleccionar categoría</option>
                    {categoriasDelTipo.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.nombre}
                        </option>
                    ))}
                </select>
            </div>

            {/* Cuenta */}
            <div>
                <label htmlFor="rec-cuenta" className="block text-sm font-medium text-gray-700">
                    Cuenta
                </label>
                <select
                    id="rec-cuenta"
                    value={cuentaId}
                    onChange={(e) => setCuentaId(e.target.value)}
                    className={inputCls}
                >
                    <option value="">Seleccionar cuenta</option>
                    {cuentasActivas.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.nombre}
                        </option>
                    ))}
                </select>
            </div>

            {/* Día del mes */}
            <div>
                <label htmlFor="rec-dia" className="block text-sm font-medium text-gray-700">
                    Día del mes
                </label>
                <input
                    id="rec-dia"
                    type="number"
                    min="1"
                    max="31"
                    value={diaDelMes}
                    onChange={(e) => setDiaDelMes(Number(e.target.value))}
                    className={inputCls}
                />
                <p className="mt-1 text-xs text-gray-400">Entre 1 y 31 (días mayores al fin de mes se ejecutan el último día)</p>
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
                    {isLoading ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear recurrente'}
                </button>
            </div>
        </form>
    );
}
