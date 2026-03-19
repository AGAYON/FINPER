import { useState } from 'react';
import { formatCurrency } from '../../../shared/utils/currency';
import type { Cuenta } from '../cuentas.types';

interface AjusteSaldoFormProps {
    cuenta: Cuenta;
    onSubmit: (saldoReal: number, nota: string) => Promise<void>;
    onCancelar: () => void;
    isLoading?: boolean;
}

export function AjusteSaldoForm({ cuenta, onSubmit, onCancelar, isLoading }: AjusteSaldoFormProps) {
    const [saldoReal, setSaldoReal] = useState('');
    const [nota, setNota] = useState('');
    const [error, setError] = useState<string | null>(null);

    const saldoRealNum = saldoReal === '' ? null : Number(saldoReal);
    const diferencia = saldoRealNum !== null && !isNaN(saldoRealNum)
        ? saldoRealNum - cuenta.saldoActual
        : null;

    const sinDiferencia = diferencia !== null && Math.abs(diferencia) < 0.01;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (saldoRealNum === null || isNaN(saldoRealNum)) {
            setError('Ingresa el saldo real.');
            return;
        }
        if (sinDiferencia) {
            setError('El saldo real coincide con el saldo calculado. No hay diferencia.');
            return;
        }

        try {
            await onSubmit(saldoRealNum, nota.trim());
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al aplicar el ajuste.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Saldo actual */}
            <div className="rounded-md bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Saldo actual en la app
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-0.5">
                    {formatCurrency(cuenta.saldoActual, cuenta.moneda)}
                </p>
            </div>

            {/* Campo saldo real */}
            <div>
                <label htmlFor="saldoReal" className="block text-sm font-medium text-gray-700 mb-1">
                    Saldo real (lo que muestra tu banco)
                </label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                        {cuenta.moneda}
                    </span>
                    <input
                        id="saldoReal"
                        type="number"
                        step="0.01"
                        value={saldoReal}
                        onChange={(e) => setSaldoReal(e.target.value)}
                        className="block w-full rounded-md border border-gray-300 pl-12 pr-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="0.00"
                        autoFocus
                    />
                </div>
            </div>

            {/* Diferencia calculada */}
            {diferencia !== null && !isNaN(diferencia) && (
                <div
                    className={`rounded-md px-4 py-3 ${
                        sinDiferencia
                            ? 'bg-green-50'
                            : diferencia > 0
                            ? 'bg-blue-50'
                            : 'bg-amber-50'
                    }`}
                >
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Diferencia a registrar
                    </p>
                    <p
                        className={`text-base font-semibold mt-0.5 ${
                            sinDiferencia
                                ? 'text-green-700'
                                : diferencia > 0
                                ? 'text-blue-700'
                                : 'text-amber-700'
                        }`}
                    >
                        {sinDiferencia
                            ? 'Sin diferencia'
                            : `${diferencia > 0 ? '+' : ''}${formatCurrency(diferencia, cuenta.moneda)}`}
                    </p>
                    {!sinDiferencia && (
                        <p className="text-xs text-gray-500 mt-0.5">
                            {diferencia > 0
                                ? 'Se registrará un ajuste que aumenta el saldo.'
                                : 'Se registrará un ajuste que reduce el saldo.'}
                        </p>
                    )}
                </div>
            )}

            {/* Nota opcional */}
            <div>
                <label htmlFor="nota" className="block text-sm font-medium text-gray-700 mb-1">
                    Nota <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                    id="nota"
                    type="text"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    maxLength={255}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Ej. Conciliación mensual"
                />
            </div>

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
                <button
                    type="submit"
                    disabled={isLoading || sinDiferencia || saldoRealNum === null}
                    className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Aplicando…' : 'Aplicar ajuste'}
                </button>
                <button
                    type="button"
                    onClick={onCancelar}
                    disabled={isLoading}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}
