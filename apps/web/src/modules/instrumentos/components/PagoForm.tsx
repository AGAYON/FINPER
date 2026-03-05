import { useState, useCallback } from 'react';
import { useCuentas } from '../../cuentas/hooks/useCuentas';
import { TIPO_CUENTA_META } from '../../cuentas/cuentas.types';
import { formatCurrency } from '../../../shared/utils/currency';
import type { InstrumentoListado, PagoInput } from '../instrumentos.types';

interface PagoFormProps {
    instrumento: InstrumentoListado;
    onSubmit: (data: PagoInput) => Promise<void>;
    onCancelar: () => void;
    isLoading: boolean;
}

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

export function PagoForm({ instrumento, onSubmit, onCancelar, isLoading }: PagoFormProps) {
    const { cuentas } = useCuentas();
    const proximo = instrumento.proximoPago;

    const totalTeorico = proximo
        ? proximo.montoCapital + proximo.montoInteres
        : 0;

    const [fecha, setFecha] = useState(todayISO());
    const [montoTotal, setMontoTotal] = useState(
        totalTeorico > 0 ? String(totalTeorico) : '',
    );
    const [cuentaOrigenId, setCuentaOrigenId] = useState('');
    const [montoInteresAjuste, setMontoInteresAjuste] = useState('0');
    const [notas, setNotas] = useState('');

    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
    const [errorApi, setErrorApi] = useState<string | null>(null);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setErrorValidacion(null);
            setErrorApi(null);

            const montoNum = Number(montoTotal);
            if (!Number.isFinite(montoNum) || montoNum <= 0) {
                setErrorValidacion('El monto total debe ser mayor a 0.');
                return;
            }
            if (!cuentaOrigenId) {
                setErrorValidacion('Elige la cuenta de origen.');
                return;
            }
            const ajusteNum = Number(montoInteresAjuste);
            if (!Number.isFinite(ajusteNum)) {
                setErrorValidacion('El ajuste de interés debe ser un número.');
                return;
            }

            try {
                await onSubmit({
                    fecha,
                    montoTotal: montoNum,
                    cuentaOrigenId,
                    montoInteresAjuste: ajusteNum,
                    notas: notas.trim() || null,
                });
            } catch (err) {
                setErrorApi(err instanceof Error ? err.message : 'Error al registrar');
            }
        },
        [fecha, montoTotal, cuentaOrigenId, montoInteresAjuste, notas, onSubmit],
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

            {proximo && (
                <div className="rounded-md bg-gray-50 p-3 text-sm">
                    <p className="font-medium text-gray-700 mb-2">Próximo pago (teórico)</p>
                    <div className="grid grid-cols-2 gap-1 text-gray-600">
                        <span>Capital</span>
                        <span className="text-right">{formatCurrency(proximo.montoCapital)}</span>
                        <span>Interés</span>
                        <span className="text-right">{formatCurrency(proximo.montoInteres)}</span>
                        <span className="font-medium text-gray-900">Total</span>
                        <span className="text-right font-medium text-gray-900">
                            {formatCurrency(proximo.montoTotal)}
                        </span>
                    </div>
                </div>
            )}

            <div>
                <label htmlFor="pago-fecha" className="block text-sm font-medium text-gray-700">
                    Fecha
                </label>
                <input
                    id="pago-fecha"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            <div>
                <label htmlFor="pago-monto" className="block text-sm font-medium text-gray-700">
                    Monto total
                </label>
                <input
                    id="pago-monto"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={montoTotal}
                    onChange={(e) => setMontoTotal(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            <div>
                <label htmlFor="pago-cuenta" className="block text-sm font-medium text-gray-700">
                    Cuenta origen (de donde sale el dinero)
                </label>
                <select
                    id="pago-cuenta"
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

            <div>
                <label htmlFor="pago-ajuste" className="block text-sm font-medium text-gray-700">
                    Diferencia vs estado de cuenta
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                    + si el banco cobró más, − si cobró menos
                </p>
                <input
                    id="pago-ajuste"
                    type="number"
                    step="0.01"
                    value={montoInteresAjuste}
                    onChange={(e) => setMontoInteresAjuste(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            <div>
                <label htmlFor="pago-notas" className="block text-sm font-medium text-gray-700">
                    Notas (opcional)
                </label>
                <input
                    id="pago-notas"
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
                    disabled={isLoading}
                    className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                    {isLoading ? 'Registrando…' : 'Registrar pago'}
                </button>
            </div>
        </form>
    );
}
