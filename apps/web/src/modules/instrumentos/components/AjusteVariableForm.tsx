import { useState, useCallback, useMemo } from 'react';
import { formatCurrency } from '../../../shared/utils/currency';
import type { InstrumentoListado, AjusteVariableInput } from '../instrumentos.types';

interface AjusteVariableFormProps {
    instrumento: InstrumentoListado;
    onSubmit: (data: AjusteVariableInput) => Promise<void>;
    onCancelar: () => void;
    isLoading: boolean;
}

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

export function AjusteVariableForm({
    instrumento,
    onSubmit,
    onCancelar,
    isLoading,
}: AjusteVariableFormProps) {
    const saldoSistema = instrumento.saldoActual ?? 0;

    const [montoReal, setMontoReal] = useState('');
    const [fecha, setFecha] = useState(todayISO());
    const [notas, setNotas] = useState('');

    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
    const [errorApi, setErrorApi] = useState<string | null>(null);

    const montoRealNum = useMemo(() => {
        const n = Number(montoReal);
        return Number.isFinite(n) ? n : 0;
    }, [montoReal]);
    const diferencia = montoRealNum - saldoSistema;

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setErrorValidacion(null);
            setErrorApi(null);

            if (!Number.isFinite(Number(montoReal)) || Number(montoReal) < 0) {
                setErrorValidacion('El monto real debe ser un número ≥ 0.');
                return;
            }

            try {
                await onSubmit({
                    montoReal: montoRealNum,
                    fecha,
                    notas: notas.trim() || null,
                });
            } catch (err) {
                setErrorApi(err instanceof Error ? err.message : 'Error al registrar');
            }
        },
        [montoReal, montoRealNum, fecha, notas, onSubmit],
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {(errorValidacion || errorApi) && (
                <div
                    className="rounded-md bg-red-50 p-3 text-sm text-red-700"
                    role="alert"
                >
                    {errorValidacion ?? errorApi}
                </div>
            )}

            <div>
                <label htmlFor="ajuste-monto" className="block text-sm font-medium text-gray-700">
                    Monto real actual
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                    Lo que muestra la app del banco
                </p>
                <input
                    id="ajuste-monto"
                    type="number"
                    step="0.01"
                    min="0"
                    value={montoReal}
                    onChange={(e) => setMontoReal(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            <div className="rounded-md bg-gray-50 p-3 text-sm">
                <p className="text-gray-600">Saldo en sistema: {formatCurrency(saldoSistema)}</p>
                <p className="text-gray-900 font-medium mt-1">
                    Diferencia: {formatCurrency(diferencia)}
                </p>
                {Math.abs(diferencia) < 0.01 && (
                    <p className="text-amber-700 mt-2">
                        No hay diferencia, no se registrará ningún ajuste.
                    </p>
                )}
            </div>

            <div>
                <label htmlFor="ajuste-fecha" className="block text-sm font-medium text-gray-700">
                    Fecha
                </label>
                <input
                    id="ajuste-fecha"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            <div>
                <label htmlFor="ajuste-notas" className="block text-sm font-medium text-gray-700">
                    Notas (opcional)
                </label>
                <input
                    id="ajuste-notas"
                    type="text"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
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
                    disabled={isLoading || Math.abs(diferencia) < 0.01}
                    className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Registrando…' : 'Registrar ajuste'}
                </button>
            </div>
        </form>
    );
}
