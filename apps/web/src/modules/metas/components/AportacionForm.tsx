import { useState, useCallback } from 'react';
import type { AportacionInput } from '../metas.types';

interface AportacionFormProps {
    nombreMeta: string;
    onSubmit: (data: AportacionInput) => Promise<void>;
    onCancelar: () => void;
    isLoading: boolean;
}

function fechaHoy(): string {
    return new Date().toISOString().slice(0, 10);
}

export function AportacionForm({ nombreMeta, onSubmit, onCancelar, isLoading }: AportacionFormProps) {
    const [monto, setMonto] = useState('');
    const [nota, setNota] = useState('');
    const [fecha, setFecha] = useState(fechaHoy);

    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
    const [errorApi, setErrorApi] = useState<string | null>(null);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setErrorValidacion(null);
            setErrorApi(null);

            const valor = parseFloat(monto);
            if (isNaN(valor) || valor <= 0) {
                setErrorValidacion('Ingresa un monto válido mayor a 0.');
                return;
            }
            if (!fecha) {
                setErrorValidacion('La fecha es obligatoria.');
                return;
            }

            try {
                await onSubmit({
                    monto: valor,
                    nota: nota.trim() || null,
                    fecha,
                });
            } catch (err) {
                setErrorApi(err instanceof Error ? err.message : 'Error al registrar aportación');
            }
        },
        [monto, nota, fecha, onSubmit],
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
                Registra una aportación para <span className="font-medium text-gray-900">{nombreMeta}</span>.
            </p>

            {(errorValidacion || errorApi) && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
                    {errorValidacion ?? errorApi}
                </div>
            )}

            {/* Monto */}
            <div>
                <label htmlFor="aport-monto" className="block text-sm font-medium text-gray-700">
                    Monto
                </label>
                <input
                    id="aport-monto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            {/* Fecha */}
            <div>
                <label htmlFor="aport-fecha" className="block text-sm font-medium text-gray-700">
                    Fecha
                </label>
                <input
                    id="aport-fecha"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            {/* Nota */}
            <div>
                <label htmlFor="aport-nota" className="block text-sm font-medium text-gray-700">
                    Nota <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                    id="aport-nota"
                    type="text"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder="Ej. Depósito mensual"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
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
                    {isLoading ? 'Registrando…' : 'Registrar aportación'}
                </button>
            </div>
        </form>
    );
}
