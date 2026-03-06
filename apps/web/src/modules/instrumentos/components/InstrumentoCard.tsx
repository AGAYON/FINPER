import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, TrendingUp, DollarSign, Pencil, MoreHorizontal, Archive, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/currency';
import type { InstrumentoListado, InstrumentoUpdateInput, PagoInput, AjusteVariableInput } from '../instrumentos.types';
import { PagoForm } from './PagoForm';
import { AjusteVariableForm } from './AjusteVariableForm';
import { InstrumentoEditForm } from './InstrumentoEditForm';
import { useRegistrarPago, useRegistrarAjuste, useInstrumentos, useArchivarInstrumento, useEliminarInstrumento } from '../hooks/useInstrumentos';

interface InstrumentoCardProps {
    instrumento: InstrumentoListado;
    onRegistrarPago?: (instrumento: InstrumentoListado) => void;
    onRegistrarAjuste?: (instrumento: InstrumentoListado) => void;
}

function barraColorCredito(porcentajePagado: number): string {
    if (porcentajePagado < 50) return 'bg-green-500';
    if (porcentajePagado < 80) return 'bg-amber-500';
    return 'bg-blue-500';
}

export function InstrumentoCard({
    instrumento,
    onRegistrarPago,
    onRegistrarAjuste,
}: InstrumentoCardProps) {
    const navigate = useNavigate();
    const [modalPago, setModalPago] = useState(false);
    const [modalAjuste, setModalAjuste] = useState(false);
    const [modalEditar, setModalEditar] = useState(false);
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [modalArchivar, setModalArchivar] = useState(false);
    const [modalEliminar, setModalEliminar] = useState(false);

    const registrarPago = useRegistrarPago(instrumento.id);
    const registrarAjuste = useRegistrarAjuste(instrumento.id);
    const { editarInstrumento, isEditing } = useInstrumentos();
    const archivarMutation = useArchivarInstrumento();
    const eliminarMutation = useEliminarInstrumento();

    const esCredito = instrumento.tipo === 'credito' && instrumento.subtipo === 'tasa_fija';

    const handleClickCard = () => {
        navigate(`/instrumentos/${instrumento.id}`);
    };

    const handleRegistrarPago = async (data: PagoInput) => {
        await registrarPago.mutateAsync(data);
        setModalPago(false);
        onRegistrarPago?.(instrumento);
    };

    const handleRegistrarAjuste = async (data: AjusteVariableInput) => {
        await registrarAjuste.mutateAsync(data);
        setModalAjuste(false);
        onRegistrarAjuste?.(instrumento);
    };

    const handleEditar = async (data: InstrumentoUpdateInput) => {
        await editarInstrumento({ id: instrumento.id, data });
        setModalEditar(false);
    };

    const handleArchivar = async () => {
        await archivarMutation.mutateAsync(instrumento.id);
        setModalArchivar(false);
    };

    const handleEliminar = async () => {
        await eliminarMutation.mutateAsync(instrumento.id);
        setModalEliminar(false);
    };

    return (
        <>
            <div
                className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={handleClickCard}
            >
                <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            {esCredito ? (
                                <CreditCard className="h-5 w-5 shrink-0 text-gray-500" />
                            ) : (
                                <TrendingUp className="h-5 w-5 shrink-0 text-gray-500" />
                            )}
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                    {instrumento.nombre}
                                </p>
                            </div>
                        </div>
                        {/* Menu de acciones */}
                        <div
                            className="relative shrink-0"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setMenuAbierto(!menuAbierto);
                                }}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                title="Acciones"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {menuAbierto && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setMenuAbierto(false)}
                                    />
                                    <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                                        <button
                                            type="button"
                                            onClick={() => { setMenuAbierto(false); setModalEditar(true); }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <Pencil className="h-4 w-4" /> Editar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setMenuAbierto(false); setModalArchivar(true); }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <Archive className="h-4 w-4" /> Archivar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setMenuAbierto(false); setModalEliminar(true); }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" /> Eliminar
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {esCredito && (
                        <>
                            <div className="mt-3">
                                <p className="text-sm text-gray-500">Saldo insoluto</p>
                                <p className="text-lg font-semibold text-red-600">
                                    {formatCurrency(instrumento.saldoInsoluto ?? 0)}
                                </p>
                            </div>
                            {instrumento.porcentajePagado != null && (
                                <div className="mt-3">
                                    <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${barraColorCredito(instrumento.porcentajePagado)}`}
                                            style={{
                                                width: `${Math.min(instrumento.porcentajePagado, 100)}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {instrumento.porcentajePagado.toFixed(1)}% pagado
                                        {instrumento.periodosRestantes != null &&
                                            ` · ${instrumento.periodosRestantes} periodos restantes`}
                                    </p>
                                </div>
                            )}
                            {instrumento.proximoPago && (
                                <div className="mt-2 text-sm text-gray-600">
                                    Próximo pago: {instrumento.proximoPago.fecha} —{' '}
                                    {formatCurrency(instrumento.proximoPago.montoTotal)}
                                </div>
                            )}
                            <div className="mt-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setModalPago(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                >
                                    <DollarSign className="h-4 w-4" />
                                    Registrar pago
                                </button>
                            </div>
                        </>
                    )}

                    {!esCredito && (
                        <>
                            <div className="mt-3">
                                <p className="text-sm text-gray-500">Saldo actual</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {formatCurrency(instrumento.saldoActual ?? 0)}
                                </p>
                            </div>
                            {instrumento.rendimientoAcumulado != null && (
                                <p className="mt-1 text-sm text-green-600 font-medium">
                                    + {formatCurrency(instrumento.rendimientoAcumulado)} rendimiento
                                </p>
                            )}
                            <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setModalAjuste(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                >
                                    Registrar ajuste
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {modalPago && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-pago-title"
                >
                    <div
                        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
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

            {modalAjuste && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-ajuste-title"
                >
                    <div
                        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
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

            {modalEditar && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-editar-title"
                >
                    <div
                        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
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
                            ¿Archivar {instrumento.nombre}? Dejará de aparecer en el listado pero sus datos se conservan.
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
                                Archivar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalEliminar && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                        <h2 className="text-base font-semibold text-gray-900 mb-2">
                            Eliminar instrumento
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Esta acción es permanente. El instrumento y sus movimientos serán eliminados. Las transacciones contables generadas se conservarán en tu historial.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => setModalEliminar(false)}
                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleEliminar}
                                disabled={eliminarMutation.isPending}
                                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
