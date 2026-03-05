import { useState, useCallback, useMemo } from 'react';
import { useCuentas } from '../../cuentas/hooks/useCuentas';
import { TIPO_CUENTA_META } from '../../cuentas/cuentas.types';
import { formatCurrency } from '../../../shared/utils/currency';
import type { InstrumentoListado, PagosHistoricosInput, PeriodoAmortizacion } from '../instrumentos.types';

interface PagosHistoricosFormProps {
    instrumento: InstrumentoListado;
    tabla: PeriodoAmortizacion[];
    onSubmit: (data: PagosHistoricosInput) => Promise<void>;
    onCancelar: () => void;
    isLoading: boolean;
}

export function PagosHistoricosForm({
    instrumento,
    tabla,
    onSubmit,
    onCancelar,
    isLoading,
}: PagosHistoricosFormProps) {
    const { cuentas } = useCuentas();
    const [numeroPagos, setNumeroPagos] = useState('');
    const [cuentaOrigenId, setCuentaOrigenId] = useState('');
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
    const [errorApi, setErrorApi] = useState<string | null>(null);

    const n = Number(numeroPagos);
    const nValido = Number.isInteger(n) && n > 0 && n <= tabla.length;

    const preview = useMemo(() => {
        if (!nValido) return null;
        let capital = 0;
        let interes = 0;
        for (let i = 0; i < n; i++) {
            capital += tabla[i].capital;
            interes += tabla[i].interes;
        }
        return {
            periodoActual: n + 1,
            totalPeriodos: tabla.length,
            capitalAmortizado: capital,
            interesesPagados: interes,
            saldoInsoluto: tabla[n - 1]?.saldo ?? 0,
        };
    }, [n, nValido, tabla]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setErrorValidacion(null);
            setErrorApi(null);

            if (!nValido) {
                setErrorValidacion(
                    `El número de pagos debe ser un entero entre 1 y ${tabla.length}.`,
                );
                return;
            }
            if (!cuentaOrigenId) {
                setErrorValidacion('Selecciona la cuenta de origen.');
                return;
            }

            try {
                await onSubmit({ numeroPagos: n, cuentaOrigenId });
            } catch (err) {
                setErrorApi(err instanceof Error ? err.message : 'Error al registrar');
            }
        },
        [n, nValido, cuentaOrigenId, tabla.length, onSubmit],
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {(errorValidacion || errorApi) && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
                    {errorValidacion ?? errorApi}
                </div>
            )}

            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                Usa esto para indicar cuántos pagos ya realizaste antes de empezar a usar el
                sistema. Se generarán las transacciones contables correspondientes con las fechas
                calculadas desde el inicio del crédito.
            </div>

            <div>
                <label
                    htmlFor="hist-numero"
                    className="block text-sm font-medium text-gray-700"
                >
                    Número de pagos ya realizados
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                    El crédito tiene {tabla.length} periodos en total.
                </p>
                <input
                    id="hist-numero"
                    type="number"
                    step="1"
                    min="1"
                    max={tabla.length}
                    value={numeroPagos}
                    onChange={(e) => setNumeroPagos(e.target.value)}
                    placeholder={`1 – ${tabla.length}`}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            {preview && (
                <div className="rounded-md bg-indigo-50 border border-indigo-100 p-3 text-sm space-y-1">
                    <p className="font-medium text-indigo-800 mb-2">Vista previa</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-700">
                        <span>Periodo actual resultante</span>
                        <span className="text-right font-medium">
                            {preview.periodoActual} de {preview.totalPeriodos}
                        </span>
                        <span>Capital amortizado</span>
                        <span className="text-right font-medium">
                            {formatCurrency(preview.capitalAmortizado)}
                        </span>
                        <span>Intereses pagados</span>
                        <span className="text-right font-medium">
                            {formatCurrency(preview.interesesPagados)}
                        </span>
                        <span className="text-gray-900 font-medium">Saldo insoluto</span>
                        <span className="text-right font-semibold text-red-600">
                            {formatCurrency(preview.saldoInsoluto)}
                        </span>
                    </div>
                    <p className="text-xs text-indigo-700 mt-2">
                        Se generarán {n * 2} transacciones contables
                        (capital + intereses por cada periodo).
                    </p>
                </div>
            )}

            <div>
                <label
                    htmlFor="hist-cuenta"
                    className="block text-sm font-medium text-gray-700"
                >
                    Cuenta origen (de donde salió el dinero históricamente)
                </label>
                <select
                    id="hist-cuenta"
                    value={cuentaOrigenId}
                    onChange={(e) => setCuentaOrigenId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                    <option value="">Selecciona cuenta</option>
                    {cuentas
                        .filter((c) => c.id !== instrumento.cuentaId)
                        .map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nombre} — {TIPO_CUENTA_META[c.tipo].label}
                            </option>
                        ))}
                </select>
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
                    disabled={isLoading || !nValido}
                    className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                    {isLoading ? 'Registrando…' : `Registrar ${nValido ? n : ''} pagos`}
                </button>
            </div>
        </form>
    );
}
