import { useState, useCallback } from 'react';
import { useCuentas } from '../../cuentas/hooks/useCuentas';
import { TIPO_CUENTA_META } from '../../cuentas/cuentas.types';
import type { InstrumentoCreateInput, TipoInstrumento, SubtipoInstrumento } from '../instrumentos.types';

interface InstrumentoFormProps {
    onSubmit: (data: InstrumentoCreateInput) => Promise<void>;
    onCancelar: () => void;
    isLoading: boolean;
}

const TIPOS: TipoInstrumento[] = ['credito', 'inversion'];
const SUBTIPOS: SubtipoInstrumento[] = ['tasa_fija', 'tasa_variable'];

export function InstrumentoForm({ onSubmit, onCancelar, isLoading }: InstrumentoFormProps) {
    const { cuentas } = useCuentas();

    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState<TipoInstrumento>('credito');
    const [subtipo, setSubtipo] = useState<SubtipoInstrumento>('tasa_fija');
    const [cuentaId, setCuentaId] = useState('');
    const [capitalInicial, setCapitalInicial] = useState('');
    const [tasaAnualPct, setTasaAnualPct] = useState('');
    const [plazoMeses, setPlazoMeses] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [periodicidadDias, setPeriodicidadDias] = useState<15 | 30>(30);
    const [notas, setNotas] = useState('');

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
            if (!cuentaId) {
                setErrorValidacion('Debes elegir una cuenta asociada.');
                return;
            }

            if (subtipo === 'tasa_fija') {
                const cap = Number(capitalInicial);
                const tasa = Number(tasaAnualPct);
                const plazo = Number(plazoMeses);
                if (!Number.isFinite(cap) || cap <= 0) {
                    setErrorValidacion('Capital inicial debe ser un número positivo.');
                    return;
                }
                if (!Number.isFinite(tasa) || tasa <= 0 || tasa > 999.9999) {
                    setErrorValidacion('Tasa anual debe ser un número entre 0 y 999.9999%.');
                    return;
                }
                if (!Number.isInteger(plazo) || plazo <= 0) {
                    setErrorValidacion('Plazo en meses debe ser un entero positivo.');
                    return;
                }
                if (!fechaInicio || !/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio)) {
                    setErrorValidacion('Fecha de inicio debe ser YYYY-MM-DD.');
                    return;
                }
            }

            try {
                const payload: InstrumentoCreateInput = {
                    nombre: nombreTrim,
                    tipo,
                    subtipo,
                    cuentaId,
                    notas: notas.trim() || null,
                };
                if (subtipo === 'tasa_fija') {
                    payload.capitalInicial = Number(capitalInicial);
                    payload.tasaAnual = Number(tasaAnualPct) / 100;
                    payload.plazoMeses = Number(plazoMeses);
                    payload.fechaInicio = fechaInicio;
                    payload.periodicidadDias = periodicidadDias;
                }
                await onSubmit(payload);
            } catch (err) {
                setErrorApi(err instanceof Error ? err.message : 'Error al guardar');
            }
        },
        [
            nombre,
            tipo,
            subtipo,
            cuentaId,
            capitalInicial,
            tasaAnualPct,
            plazoMeses,
            fechaInicio,
            periodicidadDias,
            notas,
            onSubmit,
        ],
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
                <label htmlFor="inst-nombre" className="block text-sm font-medium text-gray-700">
                    Nombre
                </label>
                <input
                    id="inst-nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Ej. Crédito nómina HSBC"
                    maxLength={80}
                />
            </div>

            <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Tipo</span>
                <div className="flex gap-2">
                    {TIPOS.map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTipo(t)}
                            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                                tipo === t
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {t === 'credito' ? 'Crédito' : 'Inversión'}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Subtipo</span>
                <div className="flex gap-2">
                    {SUBTIPOS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setSubtipo(s)}
                            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                                subtipo === s
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {s === 'tasa_fija' ? 'Tasa fija' : 'Tasa variable'}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label htmlFor="inst-cuenta" className="block text-sm font-medium text-gray-700">
                    Cuenta asociada
                </label>
                <select
                    id="inst-cuenta"
                    value={cuentaId}
                    onChange={(e) => setCuentaId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                    <option value="">Selecciona una cuenta</option>
                    {cuentas.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.nombre} — {TIPO_CUENTA_META[c.tipo].label}
                        </option>
                    ))}
                </select>
            </div>

            {subtipo === 'tasa_fija' && (
                <>
                    <div>
                        <label
                            htmlFor="inst-capital"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Capital inicial
                        </label>
                        <input
                            id="inst-capital"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={capitalInicial}
                            onChange={(e) => setCapitalInicial(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="inst-tasa"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Tasa anual (%)
                        </label>
                        <input
                            id="inst-tasa"
                            type="number"
                            step="0.01"
                            min="0"
                            max="999.9999"
                            value={tasaAnualPct}
                            onChange={(e) => setTasaAnualPct(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="24.5"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="inst-plazo"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Plazo (meses)
                        </label>
                        <input
                            id="inst-plazo"
                            type="number"
                            min="1"
                            step="1"
                            value={plazoMeses}
                            onChange={(e) => setPlazoMeses(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="inst-fecha"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Fecha de inicio
                        </label>
                        <input
                            id="inst-fecha"
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-2">
                            Periodicidad
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPeriodicidadDias(15)}
                                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                                    periodicidadDias === 15
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Quincenal (15 días)
                            </button>
                            <button
                                type="button"
                                onClick={() => setPeriodicidadDias(30)}
                                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                                    periodicidadDias === 30
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Mensual (30 días)
                            </button>
                        </div>
                    </div>
                </>
            )}

            <div>
                <label htmlFor="inst-notas" className="block text-sm font-medium text-gray-700">
                    Notas (opcional)
                </label>
                <textarea
                    id="inst-notas"
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
                    {isLoading ? 'Guardando…' : 'Crear instrumento'}
                </button>
            </div>
        </form>
    );
}
