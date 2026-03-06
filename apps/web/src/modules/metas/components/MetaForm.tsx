import { useState, useCallback } from 'react';
import type { Cuenta } from '../../cuentas/cuentas.types';
import { COLORES_META } from '../metas.types';
import type { Meta, MetaCreateInput, MetaUpdateInput } from '../metas.types';

interface MetaFormProps {
    cuentas: Cuenta[];
    meta?: Meta; // si viene, es edición
    onSubmit: (data: MetaCreateInput | MetaUpdateInput) => Promise<void>;
    onCancelar: () => void;
    isLoading: boolean;
}

export function MetaForm({ cuentas, meta, onSubmit, onCancelar, isLoading }: MetaFormProps) {
    const [nombre, setNombre] = useState(meta?.nombre ?? '');
    const [descripcion, setDescripcion] = useState(meta?.descripcion ?? '');
    const [montoObjetivo, setMontoObjetivo] = useState(
        meta ? String(Number(meta.montoObjetivo)) : '',
    );
    const [fechaLimite, setFechaLimite] = useState(
        meta?.fechaLimite ? meta.fechaLimite.slice(0, 10) : '',
    );
    const [cuentaId, setCuentaId] = useState(meta?.cuentaId ?? '');
    const [color, setColor] = useState(meta?.color ?? COLORES_META[0]);

    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
    const [errorApi, setErrorApi] = useState<string | null>(null);

    const esEdicion = !!meta;

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setErrorValidacion(null);
            setErrorApi(null);

            if (!nombre.trim()) {
                setErrorValidacion('El nombre es obligatorio.');
                return;
            }
            const monto = parseFloat(montoObjetivo);
            if (isNaN(monto) || monto <= 0) {
                setErrorValidacion('Ingresa un monto objetivo válido mayor a 0.');
                return;
            }

            const payload: MetaCreateInput = {
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || null,
                montoObjetivo: monto,
                fechaLimite: fechaLimite || null,
                cuentaId: cuentaId || null,
                color,
            };

            try {
                await onSubmit(payload);
            } catch (err) {
                setErrorApi(err instanceof Error ? err.message : 'Error al guardar');
            }
        },
        [nombre, descripcion, montoObjetivo, fechaLimite, cuentaId, color, onSubmit],
    );

    const cuentasActivas = cuentas.filter((c) => c.activa);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {(errorValidacion || errorApi) && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
                    {errorValidacion ?? errorApi}
                </div>
            )}

            {/* Nombre */}
            <div>
                <label htmlFor="meta-nombre" className="block text-sm font-medium text-gray-700">
                    Nombre
                </label>
                <input
                    id="meta-nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Fondo de emergencia"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            {/* Descripción */}
            <div>
                <label htmlFor="meta-desc" className="block text-sm font-medium text-gray-700">
                    Descripción <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                    id="meta-desc"
                    rows={2}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="¿Para qué es esta meta?"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
            </div>

            {/* Monto objetivo */}
            <div>
                <label htmlFor="meta-monto" className="block text-sm font-medium text-gray-700">
                    Monto objetivo
                </label>
                <input
                    id="meta-monto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={montoObjetivo}
                    onChange={(e) => setMontoObjetivo(e.target.value)}
                    placeholder="0.00"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            {/* Fecha límite */}
            <div>
                <label htmlFor="meta-fecha" className="block text-sm font-medium text-gray-700">
                    Fecha límite <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                    id="meta-fecha"
                    type="date"
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            {/* Cuenta vinculada */}
            <div>
                <label htmlFor="meta-cuenta" className="block text-sm font-medium text-gray-700">
                    Cuenta vinculada <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <select
                    id="meta-cuenta"
                    value={cuentaId}
                    onChange={(e) => setCuentaId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                    <option value="">Sin cuenta específica</option>
                    {cuentasActivas.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.nombre}
                        </option>
                    ))}
                </select>
            </div>

            {/* Color */}
            <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Color</span>
                <div className="flex flex-wrap gap-2">
                    {COLORES_META.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                                color === c ? 'border-gray-900 scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c }}
                            title={c}
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
                    {isLoading ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear meta'}
                </button>
            </div>
        </form>
    );
}
