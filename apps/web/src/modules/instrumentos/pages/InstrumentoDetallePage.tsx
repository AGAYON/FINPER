import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, TrendingUp, Archive, Pencil, History, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/currency';
import {
    useInstrumentos,
    useInstrumentoTabla,
    useArchivarInstrumento,
    useEliminarInstrumento,
    useRegistrarPago,
    useRegistrarAjuste,
    useRegistrarPagosHistoricos,
} from '../hooks/useInstrumentos';
import { useCuentas } from '../../cuentas/hooks/useCuentas';
import { PagoForm } from '../components/PagoForm';
import { AjusteVariableForm } from '../components/AjusteVariableForm';
import { InstrumentoEditForm } from '../components/InstrumentoEditForm';
import { PagosHistoricosForm } from '../components/PagosHistoricosForm';
import type { PagoInput, AjusteVariableInput, InstrumentoUpdateInput, PagosHistoricosInput } from '../instrumentos.types';

export function InstrumentoDetallePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { instrumentos, isLoading: loadingList, isError: errorList, editarInstrumento, isEditing } = useInstrumentos();
    const { data: tabla = [], isLoading: loadingTabla } = useInstrumentoTabla(id ?? null);
    const archivarMutation = useArchivarInstrumento();
    const eliminarMutation = useEliminarInstrumento();
    const registrarPago = useRegistrarPago(id ?? '');
    const registrarAjuste = useRegistrarAjuste(id ?? '');
    const { cuentas } = useCuentas();

    const registrarPagosHistoricos = useRegistrarPagosHistoricos(id ?? '');

    const [modalPago, setModalPago] = useState(false);
    const [modalAjuste, setModalAjuste] = useState(false);
    const [modalEditar, setModalEditar] = useState(false);
    const [modalHistorico, setModalHistorico] = useState(false);
    const [modalArchivar, setModalArchivar] = useState(false);
    const [modalEliminar, setModalEliminar] = useState(false);
    const [eliminarPaso2, setEliminarPaso2] = useState(false);

    const instrumento = id ? instrumentos.find((i) => i.id === id) : null;
    const esCreditoTasaFija =
        instrumento?.tipo === 'credito' && instrumento?.subtipo === 'tasa_fija';
    const esInversionTasaFija =
        instrumento?.tipo === 'inversion' && instrumento?.subtipo === 'tasa_fija';
    const periodoPagadoCount = esCreditoTasaFija && instrumento?.periodosRestantes != null
        ? Math.max(0, tabla.length - instrumento.periodosRestantes)
        : 0;
    const sinPagos = esCreditoTasaFija && (instrumento?.porcentajePagado ?? 0) === 0;
    const cuentaNombre = instrumento
        ? cuentas.find((c) => c.id === instrumento.cuentaId)?.nombre ?? instrumento.cuentaId
        : '';

    const tieneMovimientos = instrumento
        ? (instrumento.porcentajePagado ?? 0) > 0 ||
          (instrumento.rendimientoAcumulado != null && instrumento.rendimientoAcumulado !== 0)
        : false;

    const handleRegistrarPago = async (data: PagoInput) => {
        if (!id) return;
        await registrarPago.mutateAsync(data);
        setModalPago(false);
    };

    const handleRegistrarAjuste = async (data: AjusteVariableInput) => {
        if (!id) return;
        await registrarAjuste.mutateAsync(data);
        setModalAjuste(false);
    };

    const handleEditar = async (data: InstrumentoUpdateInput) => {
        if (!id) return;
        await editarInstrumento({ id, data });
        setModalEditar(false);
    };

    const handlePagosHistoricos = async (data: PagosHistoricosInput) => {
        if (!id) return;
        await registrarPagosHistoricos.mutateAsync(data);
        setModalHistorico(false);
    };

    const handleArchivar = async () => {
        if (!id) return;
        await archivarMutation.mutateAsync(id);
        navigate('/instrumentos');
    };

    const handleEliminarPaso1 = () => {
        if (tieneMovimientos) {
            setEliminarPaso2(true);
        } else {
            handleEliminarConfirmar();
        }
    };

    const handleEliminarConfirmar = async () => {
        if (!id) return;
        await eliminarMutation.mutateAsync(id);
        navigate('/instrumentos');
    };

    const cerrarModalEliminar = () => {
        setModalEliminar(false);
        setEliminarPaso2(false);
    };

    if (loadingList || !id) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
                <div className="flex justify-center py-12">
                    <p className="text-gray-500">
                        {!id ? 'ID no válido' : 'Cargando…'}
                    </p>
                </div>
            </div>
        );
    }

    if (errorList || !instrumento) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
                <div className="rounded-md bg-red-50 p-4 text-red-700">
                    {!instrumento
                        ? 'Instrumento no encontrado.'
                        : 'No se pudo cargar el instrumento.'}
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/instrumentos')}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a instrumentos
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <button
                type="button"
                onClick={() => navigate('/instrumentos')}
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver
            </button>

            <header className="mb-6">
                <div className="flex items-start gap-3">
                    {esCreditoTasaFija ? (
                        <CreditCard className="h-8 w-8 shrink-0 text-gray-500" />
                    ) : (
                        <TrendingUp className="h-8 w-8 shrink-0 text-gray-500" />
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {instrumento.nombre}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {instrumento.tipo === 'credito' ? 'Crédito' : 'Inversión'} ·{' '}
                            {instrumento.subtipo === 'tasa_fija' ? 'Tasa fija' : 'Tasa variable'}
                        </p>
                    </div>
                </div>

                {esCreditoTasaFija && (
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Saldo insoluto</p>
                            <p className="text-xl font-semibold text-red-600">
                                {formatCurrency(instrumento.saldoInsoluto ?? 0)}
                            </p>
                        </div>
                        {instrumento.porcentajePagado != null && (
                            <div>
                                <p className="text-sm text-gray-500">Pagado</p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {instrumento.porcentajePagado.toFixed(1)}%
                                </p>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setModalPago(true)}
                                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                            >
                                Registrar pago
                            </button>
                            {sinPagos && (
                                <button
                                    type="button"
                                    onClick={() => setModalHistorico(true)}
                                    className="inline-flex items-center gap-2 rounded-md border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-100"
                                >
                                    <History className="h-4 w-4" />
                                    Registrar pagos históricos
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setModalEditar(true)}
                                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                <Pencil className="h-4 w-4" />
                                Editar
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalArchivar(true)}
                                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                <Archive className="h-4 w-4" />
                                Archivar instrumento
                            </button>
                            <button
                                type="button"
                                onClick={() => { setEliminarPaso2(false); setModalEliminar(true); }}
                                className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                Eliminar instrumento
                            </button>
                        </div>
                    </div>
                )}

                {!esCreditoTasaFija && (
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Saldo actual</p>
                            <p className="text-xl font-semibold text-gray-900">
                                {formatCurrency(instrumento.saldoActual ?? 0)}
                            </p>
                        </div>
                        {instrumento.rendimientoAcumulado != null && instrumento.rendimientoAcumulado !== 0 && (
                            <div>
                                <p className="text-sm text-gray-500">Rendimiento acumulado</p>
                                <p className="text-xl font-semibold text-green-600">
                                    + {formatCurrency(instrumento.rendimientoAcumulado)}
                                </p>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {instrumento.subtipo === 'tasa_variable' && (
                                <button
                                    type="button"
                                    onClick={() => setModalAjuste(true)}
                                    className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                                >
                                    Registrar ajuste
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setModalEditar(true)}
                                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                <Pencil className="h-4 w-4" />
                                Editar
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalArchivar(true)}
                                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                <Archive className="h-4 w-4" />
                                Archivar instrumento
                            </button>
                            <button
                                type="button"
                                onClick={() => { setEliminarPaso2(false); setModalEliminar(true); }}
                                className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                Eliminar instrumento
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {esCreditoTasaFija && (
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                        Tabla de amortización
                    </h2>
                    {loadingTabla ? (
                        <p className="text-gray-500">Cargando tabla…</p>
                    ) : tabla.length === 0 ? (
                        <p className="text-sm text-gray-500">Sin datos de amortización.</p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                                            Periodo
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                                            Fecha
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-700">
                                            Cuota
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-700">
                                            Capital
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-700">
                                            Interés
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-700">
                                            Saldo
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {tabla.map((fila) => {
                                        const esPagado = fila.periodo <= periodoPagadoCount;
                                        const esActual =
                                            fila.periodo === periodoPagadoCount + 1;
                                        const rowCls = esPagado
                                            ? 'bg-gray-100 text-gray-500'
                                            : esActual
                                              ? 'bg-indigo-50 font-medium text-gray-900'
                                              : 'text-gray-900';
                                        return (
                                            <tr key={fila.periodo} className={rowCls}>
                                                <td className="px-3 py-2">
                                                    {fila.periodo}
                                                    {esPagado && ' ✓'}
                                                </td>
                                                <td className="px-3 py-2">{fila.fecha}</td>
                                                <td className="px-3 py-2 text-right">
                                                    {formatCurrency(fila.cuota)}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {formatCurrency(fila.capital)}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {formatCurrency(fila.interes)}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {formatCurrency(fila.saldo)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {/* Tabla de capitalización para inversiones tasa fija */}
            {esInversionTasaFija && (
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                        Tabla de capitalización proyectada
                    </h2>
                    {loadingTabla ? (
                        <p className="text-gray-500">Cargando tabla…</p>
                    ) : tabla.length === 0 ? (
                        <p className="text-sm text-gray-500">Sin datos de capitalización.</p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                                            Periodo
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                                            Fecha
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-700">
                                            Interés
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-700">
                                            Saldo proyectado
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {tabla.map((fila) => (
                                        <tr key={fila.periodo} className="text-gray-900">
                                            <td className="px-3 py-2">{fila.periodo}</td>
                                            <td className="px-3 py-2">{fila.fecha}</td>
                                            <td className="px-3 py-2 text-right text-green-700">
                                                + {formatCurrency(fila.interes)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-medium">
                                                {formatCurrency(fila.saldo)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {/* Datos básicos para inversiones tasa variable */}
            {!esCreditoTasaFija && !esInversionTasaFija && (
                <section className="rounded-lg border border-gray-200 bg-white p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                        Datos del instrumento
                    </h2>
                    <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                        <dt className="text-gray-500">Cuenta asociada</dt>
                        <dd className="font-medium text-gray-900">{cuentaNombre}</dd>
                        {instrumento.notas && (
                            <>
                                <dt className="text-gray-500">Notas</dt>
                                <dd className="text-gray-900">{instrumento.notas}</dd>
                            </>
                        )}
                    </dl>
                </section>
            )}

            {modalPago && instrumento && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-pago-title"
                >
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 id="modal-pago-title" className="text-lg font-semibold text-gray-900 mb-4">
                            Registrar pago — {instrumento.nombre}
                        </h2>
                        <PagoForm
                            instrumento={instrumento}
                            onSubmit={handleRegistrarPago}
                            onCancelar={() => setModalPago(false)}
                            isLoading={registrarPago.isPending}
                        />
                    </div>
                </div>
            )}

            {modalAjuste && instrumento && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-ajuste-title"
                >
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 id="modal-ajuste-title" className="text-lg font-semibold text-gray-900 mb-4">
                            Registrar ajuste — {instrumento.nombre}
                        </h2>
                        <AjusteVariableForm
                            instrumento={instrumento}
                            onSubmit={handleRegistrarAjuste}
                            onCancelar={() => setModalAjuste(false)}
                            isLoading={registrarAjuste.isPending}
                        />
                    </div>
                </div>
            )}

            {modalEditar && instrumento && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-editar-title"
                >
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 id="modal-editar-title" className="text-lg font-semibold text-gray-900 mb-4">
                            Editar — {instrumento.nombre}
                        </h2>
                        <InstrumentoEditForm
                            instrumento={instrumento}
                            onSubmit={handleEditar}
                            onCancelar={() => setModalEditar(false)}
                            isLoading={isEditing}
                        />
                    </div>
                </div>
            )}

            {modalHistorico && instrumento && esCreditoTasaFija && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-historico-title"
                >
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 id="modal-historico-title" className="text-lg font-semibold text-gray-900 mb-4">
                            Registrar pagos históricos — {instrumento.nombre}
                        </h2>
                        <PagosHistoricosForm
                            instrumento={instrumento}
                            tabla={tabla}
                            onSubmit={handlePagosHistoricos}
                            onCancelar={() => setModalHistorico(false)}
                            isLoading={registrarPagosHistoricos.isPending}
                        />
                    </div>
                </div>
            )}

            {/* Modal Archivar */}
            {modalArchivar && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                        <h2 className="text-base font-semibold text-gray-900 mb-2">
                            Archivar instrumento
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            ¿Archivar este instrumento? Dejará de aparecer en el listado pero sus datos se conservan.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => setModalArchivar(false)}
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleArchivar}
                                disabled={archivarMutation.isPending}
                                className="rounded-md bg-gray-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                            >
                                Sí, archivar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Eliminar — 2 pasos */}
            {modalEliminar && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                        {!eliminarPaso2 ? (
                            <>
                                <h2 className="text-base font-semibold text-gray-900 mb-2">
                                    Eliminar instrumento
                                </h2>
                                <p className="text-sm text-gray-600 mb-4">
                                    ¿Estás seguro? Esta acción es permanente. El instrumento y todos sus movimientos serán eliminados.
                                </p>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={cerrarModalEliminar}
                                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleEliminarPaso1}
                                        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                                    >
                                        Continuar
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-base font-semibold text-gray-900 mb-2">
                                    Confirmar eliminación
                                </h2>
                                <div className="rounded-md bg-amber-50 border border-amber-200 p-3 mb-4">
                                    <p className="text-sm text-amber-800">
                                        Las transacciones contables generadas por este instrumento se conservarán en tu historial financiero, pero ya no estarán vinculadas a ningún instrumento.
                                    </p>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={cerrarModalEliminar}
                                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleEliminarConfirmar}
                                        disabled={eliminarMutation.isPending}
                                        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Confirmar eliminación
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
