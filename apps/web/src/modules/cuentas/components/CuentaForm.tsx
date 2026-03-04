import { useState, useCallback } from 'react';
import {
    Landmark,
    Wallet,
    PiggyBank,
    TrendingUp,
    CreditCard,
    FileText,
} from 'lucide-react';
import { TIPO_CUENTA_META, COLORES_PREDEFINIDOS } from '../cuentas.types';
import type { Cuenta, CuentaCreateInput, CuentaUpdateInput, TipoCuenta } from '../cuentas.types';

const ICONOS: Record<TipoCuenta, React.ComponentType<{ className?: string }>> = {
    banco: Landmark,
    efectivo: Wallet,
    ahorro: PiggyBank,
    inversion: TrendingUp,
    credito: CreditCard,
    prestamo: FileText,
};

const TIPOS: TipoCuenta[] = [
    'banco',
    'efectivo',
    'ahorro',
    'inversion',
    'credito',
    'prestamo',
];

interface CuentaFormProps {
    cuentaInicial?: Cuenta;
    onSubmit: (data: CuentaCreateInput | CuentaUpdateInput) => Promise<void>;
    onCancelar: () => void;
    isLoading: boolean;
}

export function CuentaForm({
    cuentaInicial,
    onSubmit,
    onCancelar,
    isLoading,
}: CuentaFormProps) {
    const esEdicion = Boolean(cuentaInicial);

    const [nombre, setNombre] = useState(cuentaInicial?.nombre ?? '');
    const [tipo, setTipo] = useState<TipoCuenta>(cuentaInicial?.tipo ?? 'banco');
    const [saldoInicial, setSaldoInicial] = useState(
        cuentaInicial ? String(cuentaInicial.saldoInicial) : '0',
    );
    const [color, setColor] = useState(cuentaInicial?.color ?? COLORES_PREDEFINIDOS[0]);
    const [incluirEnTotal, setIncluirEnTotal] = useState(
        cuentaInicial?.incluirEnTotal ?? true,
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

            let saldoNum: number | undefined;
            if (!esEdicion) {
                saldoNum = Number(saldoInicial);
                if (Number.isNaN(saldoNum)) {
                    setErrorValidacion('El saldo inicial debe ser un número válido.');
                    return;
                }
            }

            try {
                if (esEdicion) {
                    await onSubmit({
                        nombre: nombreTrim,
                        tipo,
                        color,
                        incluirEnTotal,
                    });
                } else {
                    await onSubmit({
                        nombre: nombreTrim,
                        tipo,
                        saldoInicial: saldoNum,
                        color,
                        incluirEnTotal,
                    });
                }
            } catch (err) {
                setErrorApi(err instanceof Error ? err.message : 'Error al guardar');
            }
        },
        [nombre, tipo, saldoInicial, color, incluirEnTotal, esEdicion, onSubmit],
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
                <label htmlFor="cuenta-nombre" className="block text-sm font-medium text-gray-700">
                    Nombre
                </label>
                <input
                    id="cuenta-nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Ej. Cuenta principal"
                    maxLength={80}
                />
            </div>

            <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Tipo</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TIPOS.map((t) => {
                        const meta = TIPO_CUENTA_META[t];
                        const Icono = ICONOS[t];
                        const selected = tipo === t;
                        return (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTipo(t)}
                                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                    selected
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {Icono && <Icono className="h-4 w-4 shrink-0" />}
                                {meta.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {!esEdicion && (
                <div>
                    <label
                        htmlFor="cuenta-saldo-inicial"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Saldo inicial
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Lo que tenía la cuenta antes de usar el sistema.
                    </p>
                    <input
                        id="cuenta-saldo-inicial"
                        type="number"
                        step="0.01"
                        value={saldoInicial}
                        onChange={(e) => setSaldoInicial(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            )}

            <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Color</span>
                <div className="flex flex-wrap gap-2">
                    {COLORES_PREDEFINIDOS.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                                color === c ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: c }}
                            title={c}
                            aria-label={`Color ${c}`}
                        />
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    id="cuenta-incluir-total"
                    type="checkbox"
                    checked={incluirEnTotal}
                    onChange={(e) => setIncluirEnTotal(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="cuenta-incluir-total" className="text-sm text-gray-700">
                    Incluir en patrimonio neto
                </label>
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
                    {isLoading ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear cuenta'}
                </button>
            </div>
        </form>
    );
}
