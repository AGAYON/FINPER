import { useState, useCallback, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useCuentas } from '../../cuentas/hooks/useCuentas';
import { useCategorias } from '../../categorias/hooks/useCategorias';
import type {
    Transaccion,
    TransaccionCreateInput,
    TransaccionUpdateInput,
    TipoTransaccion,
} from '../transacciones.types';

interface TransaccionFormProps {
    transaccionInicial?: Transaccion;
    tipoInicial?: TipoTransaccion;
    onSubmit: (data: TransaccionCreateInput | TransaccionUpdateInput) => Promise<void>;
    onCancelar: () => void;
    isLoading: boolean;
}

const hoy = () => new Date().toISOString().slice(0, 10);

const TIPOS_SELECCIONABLES: TipoTransaccion[] = ['ingreso', 'gasto', 'transferencia'];

const LABEL_TIPO: Record<TipoTransaccion, string> = {
    ingreso: 'Ingreso',
    gasto: 'Gasto',
    transferencia: 'Transferencia',
    ajuste: 'Ajuste',
};

const COLOR_TIPO: Record<string, string> = {
    ingreso: 'border-green-500 bg-green-50 text-green-700',
    gasto: 'border-red-400 bg-red-50 text-red-700',
    transferencia: 'border-indigo-500 bg-indigo-50 text-indigo-700',
};

export function TransaccionForm({
    transaccionInicial,
    tipoInicial = 'gasto',
    onSubmit,
    onCancelar,
    isLoading,
}: TransaccionFormProps) {
    const esEdicion = Boolean(transaccionInicial);
    const { cuentas } = useCuentas();
    const { categorias } = useCategorias();

    const [tipo, setTipo] = useState<TipoTransaccion>(
        transaccionInicial?.tipo ?? tipoInicial,
    );
    const [monto, setMonto] = useState(
        transaccionInicial ? String(Number(transaccionInicial.monto)) : '',
    );
    const [fecha, setFecha] = useState(
        transaccionInicial ? transaccionInicial.fecha.slice(0, 10) : hoy(),
    );
    const [descripcion, setDescripcion] = useState(transaccionInicial?.descripcion ?? '');
    const [cuentaOrigenId, setCuentaOrigenId] = useState(
        transaccionInicial?.cuentaOrigenId ?? '',
    );
    const [cuentaDestinoId, setCuentaDestinoId] = useState(
        transaccionInicial?.cuentaDestinoId ?? '',
    );
    const [categoriaId, setCategoriaId] = useState(
        transaccionInicial?.categoriaId ?? '',
    );
    const [notas, setNotas] = useState(transaccionInicial?.notas ?? '');

    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
    const [errorApi, setErrorApi] = useState<string | null>(null);

    // Cuando cambia el tipo, limpiar campos incompatibles
    useEffect(() => {
        if (tipo === 'transferencia') {
            setCategoriaId('');
        } else {
            setCuentaDestinoId('');
        }
    }, [tipo]);

    // Pre-seleccionar la primera cuenta si solo hay una y no hay valor
    useEffect(() => {
        if (cuentas.length === 1 && !cuentaOrigenId) {
            setCuentaOrigenId(cuentas[0].id);
        }
    }, [cuentas, cuentaOrigenId]);

    const categoriasParaTipo =
        tipo === 'ingreso' ? categorias.ingreso : categorias.gasto;

    const handleTipoChange = (nuevoTipo: TipoTransaccion) => {
        setTipo(nuevoTipo);
        setErrorValidacion(null);
    };

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setErrorValidacion(null);
            setErrorApi(null);

            // Validaciones
            const montoNum = Number(monto);
            if (!monto || isNaN(montoNum) || montoNum <= 0) {
                setErrorValidacion('El monto debe ser mayor a 0.');
                return;
            }
            if (!descripcion.trim()) {
                setErrorValidacion('La descripción es obligatoria.');
                return;
            }
            if (!cuentaOrigenId) {
                setErrorValidacion('Selecciona una cuenta.');
                return;
            }
            if (tipo === 'transferencia') {
                if (!cuentaDestinoId) {
                    setErrorValidacion('Selecciona la cuenta destino.');
                    return;
                }
                if (cuentaOrigenId === cuentaDestinoId) {
                    setErrorValidacion('La cuenta origen y destino deben ser distintas.');
                    return;
                }
            }
            if ((tipo === 'ingreso' || tipo === 'gasto') && !categoriaId) {
                setErrorValidacion('Selecciona una categoría.');
                return;
            }

            const payload: TransaccionCreateInput = {
                fecha,
                monto: montoNum,
                descripcion: descripcion.trim(),
                tipo,
                cuentaOrigenId,
                cuentaDestinoId: tipo === 'transferencia' ? cuentaDestinoId : null,
                categoriaId: tipo === 'transferencia' ? null : categoriaId || null,
                notas: notas.trim() || null,
            };

            try {
                await onSubmit(payload);
            } catch (err) {
                setErrorApi(err instanceof Error ? err.message : 'Error al guardar');
            }
        },
        [
            monto, descripcion, fecha, tipo,
            cuentaOrigenId, cuentaDestinoId, categoriaId, notas,
            onSubmit,
        ],
    );

    const inputCls =
        'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400';
    const labelCls = 'block text-sm font-medium text-gray-700';

    const cuentasOrigen = cuentas.filter((c) =>
        tipo === 'transferencia' ? c.id !== cuentaDestinoId : true,
    );
    const cuentasDestino = cuentas.filter((c) => c.id !== cuentaOrigenId);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {(errorValidacion || errorApi) && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
                    {errorValidacion ?? errorApi}
                </div>
            )}

            {/* Tipo */}
            {!esEdicion && (
                <div>
                    <span className={labelCls + ' mb-2'}>Tipo</span>
                    <div className="flex gap-2 mt-1">
                        {TIPOS_SELECCIONABLES.map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => handleTipoChange(t)}
                                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                    tipo === t
                                        ? COLOR_TIPO[t]
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {LABEL_TIPO[t]}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Monto */}
            <div>
                <label htmlFor="tx-monto" className={labelCls}>
                    Monto
                </label>
                <input
                    id="tx-monto"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className={inputCls}
                    placeholder="0.00"
                    autoFocus={!esEdicion}
                />
            </div>

            {/* Fecha */}
            <div>
                <label htmlFor="tx-fecha" className={labelCls}>
                    Fecha
                </label>
                <input
                    id="tx-fecha"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className={inputCls}
                />
            </div>

            {/* Descripción */}
            <div>
                <label htmlFor="tx-descripcion" className={labelCls}>
                    Descripción
                </label>
                <input
                    id="tx-descripcion"
                    type="text"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className={inputCls}
                    placeholder="Ej. Supermercado Walmart"
                    maxLength={120}
                />
            </div>

            {/* Cuenta(s) */}
            {tipo !== 'transferencia' ? (
                <div>
                    <label htmlFor="tx-cuenta" className={labelCls}>
                        Cuenta
                    </label>
                    <select
                        id="tx-cuenta"
                        value={cuentaOrigenId}
                        onChange={(e) => setCuentaOrigenId(e.target.value)}
                        className={inputCls}
                    >
                        <option value="">— Selecciona una cuenta —</option>
                        {cuentas.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nombre}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <label htmlFor="tx-cuenta-origen" className={labelCls}>
                            Cuenta origen
                        </label>
                        <select
                            id="tx-cuenta-origen"
                            value={cuentaOrigenId}
                            onChange={(e) => setCuentaOrigenId(e.target.value)}
                            className={inputCls}
                        >
                            <option value="">— Origen —</option>
                            {cuentasOrigen.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    <ArrowRight className="mt-5 h-5 w-5 shrink-0 text-gray-400" />
                    <div className="flex-1">
                        <label htmlFor="tx-cuenta-destino" className={labelCls}>
                            Cuenta destino
                        </label>
                        <select
                            id="tx-cuenta-destino"
                            value={cuentaDestinoId}
                            onChange={(e) => setCuentaDestinoId(e.target.value)}
                            className={inputCls}
                        >
                            <option value="">— Destino —</option>
                            {cuentasDestino.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Categoría (solo ingreso/gasto) */}
            {tipo !== 'transferencia' && (
                <div>
                    <label htmlFor="tx-categoria" className={labelCls}>
                        Categoría
                    </label>
                    {categoriasParaTipo.length === 0 ? (
                        <p className="mt-1 text-sm text-amber-600 bg-amber-50 rounded-md p-2">
                            No hay categorías de {tipo === 'ingreso' ? 'ingreso' : 'gasto'}.
                            Crea una en{' '}
                            <a href="/categorias" className="underline">
                                Categorías
                            </a>
                            .
                        </p>
                    ) : (
                        <select
                            id="tx-categoria"
                            value={categoriaId}
                            onChange={(e) => setCategoriaId(e.target.value)}
                            className={inputCls}
                        >
                            <option value="">— Selecciona una categoría —</option>
                            {categoriasParaTipo.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.nombre}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            )}

            {/* Notas */}
            <div>
                <label htmlFor="tx-notas" className={labelCls}>
                    Notas{' '}
                    <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <textarea
                    id="tx-notas"
                    rows={2}
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className={inputCls + ' resize-none'}
                    placeholder="Cualquier detalle adicional…"
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
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                    {isLoading
                        ? 'Guardando…'
                        : esEdicion
                          ? 'Guardar cambios'
                          : 'Registrar'}
                </button>
            </div>
        </form>
    );
}
