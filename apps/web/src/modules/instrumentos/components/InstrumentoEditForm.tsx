import { useState, useCallback } from 'react';
import type { InstrumentoListado, InstrumentoUpdateInput } from '../instrumentos.types';

interface InstrumentoEditFormProps {
    instrumento: InstrumentoListado;
    onSubmit: (data: InstrumentoUpdateInput) => Promise<void>;
    onCancelar: () => void;
    isLoading: boolean;
}

export function InstrumentoEditForm({
    instrumento,
    onSubmit,
    onCancelar,
    isLoading,
}: InstrumentoEditFormProps) {
    const [nombre, setNombre] = useState(instrumento.nombre);
    const [notas, setNotas] = useState(instrumento.notas ?? '');
    const [tasaAnualPct, setTasaAnualPct] = useState(
        instrumento.tasaAnual != null ? String(Number(instrumento.tasaAnual) * 100) : '',
    );
    const [capitalInicial, setCapitalInicial] = useState(
        instrumento.capitalInicial != null ? String(instrumento.capitalInicial) : '',
    );
    const [plazoMeses, setPlazoMeses] = useState(
        instrumento.plazoMeses != null ? String(instrumento.plazoMeses) : '',
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

            const payload: InstrumentoUpdateInput = {
                nombre: nombreTrim,
                notas: notas.trim() || null,
            };

            if (tasaAnualPct.trim()) {
                const tasa = Number(tasaAnualPct);
                if (!Number.isFinite(tasa) || tasa <= 0 || tasa > 999.9999) {
                    setErrorValidacion('Tasa anual debe ser un número entre 0 y 999.9999%.');
                    return;
                }
                payload.tasaAnual = tasa / 100;
            }

            if (capitalInicial.trim()) {
                const cap = Number(capitalInicial);
                if (!Number.isFinite(cap) || cap <= 0) {
                    setErrorValidacion('Capital inicial debe ser mayor a 0.');
                    return;
                }
                payload.capitalInicial = cap;
            }

            if (instrumento.subtipo === 'tasa_fija' && plazoMeses.trim()) {
                const plazo = Number(plazoMeses);
                if (!Number.isInteger(plazo) || plazo <= 0) {
                    setErrorValidacion('Plazo en meses debe ser un entero mayor a 0.');
                    return;
                }
                payload.plazoMeses = plazo;
            }

            try {
                await onSubmit(payload);
            } catch (err) {
                setErrorApi(err instanceof Error ? err.message : 'Error al guardar');
            }
        },
        [nombre, notas, tasaAnualPct, capitalInicial, plazoMeses, instrumento.subtipo, onSubmit],
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {(errorValidacion || errorApi) && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
                    {errorValidacion ?? errorApi}
                </div>
            )}

            <div>
                <label htmlFor="edit-nombre" className="block text-sm font-medium text-gray-700">
                    Nombre
                </label>
                <input
                    id="edit-nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    maxLength={80}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            <div>
                <label htmlFor="edit-tasa" className="block text-sm font-medium text-gray-700">
                    Tasa anual (%)
                </label>
                <input
                    id="edit-tasa"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="999.9999"
                    value={tasaAnualPct}
                    onChange={(e) => setTasaAnualPct(e.target.value)}
                    placeholder="Ej. 8.5"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            <div>
                <label htmlFor="edit-capital" className="block text-sm font-medium text-gray-700">
                    Capital inicial
                </label>
                <input
                    id="edit-capital"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={capitalInicial}
                    onChange={(e) => setCapitalInicial(e.target.value)}
                    placeholder="Ej. 100000"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            {instrumento.subtipo === 'tasa_fija' && (
                <div>
                    <label htmlFor="edit-plazo" className="block text-sm font-medium text-gray-700">
                        Plazo (meses)
                    </label>
                    <input
                        id="edit-plazo"
                        type="number"
                        step="1"
                        min="1"
                        value={plazoMeses}
                        onChange={(e) => setPlazoMeses(e.target.value)}
                        placeholder="Ej. 240"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Cambiar el plazo recalculará la tabla de amortización.
                    </p>
                </div>
            )}

            <div>
                <label htmlFor="edit-notas" className="block text-sm font-medium text-gray-700">
                    Notas (opcional)
                </label>
                <textarea
                    id="edit-notas"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={2}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

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
                    {isLoading ? 'Guardando…' : 'Guardar cambios'}
                </button>
            </div>
        </form>
    );
}
