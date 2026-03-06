import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useMetas, useArchivarMeta, useEliminarMeta } from '../hooks/useMetas';
import { useCuentas } from '../../cuentas/hooks/useCuentas';
import { MetaCard } from '../components/MetaCard';
import { MetaForm } from '../components/MetaForm';
import { AportacionForm } from '../components/AportacionForm';
import type { Meta, MetaCreateInput, MetaUpdateInput, AportacionInput } from '../metas.types';

type ModalEstado =
    | { tipo: 'ninguno' }
    | { tipo: 'crear' }
    | { tipo: 'editar'; meta: Meta }
    | { tipo: 'aportar'; meta: Meta }
    | { tipo: 'archivar'; meta: Meta }
    | { tipo: 'eliminar'; meta: Meta; paso: 1 | 2 };

export function MetasPage() {
    const [modal, setModal] = useState<ModalEstado>({ tipo: 'ninguno' });
    const [mostrarCompletadas, setMostrarCompletadas] = useState(false);

    const {
        metas,
        isLoading,
        isError,
        crearMeta,
        actualizarMeta,
        aportar,
        isCreating,
        isUpdating,
        isAportando,
    } = useMetas();

    const archivarMutation = useArchivarMeta();
    const eliminarMutation = useEliminarMeta();

    const { cuentas } = useCuentas();

    const metasActivas = metas.filter((m: Meta) => m.estado === 'en_progreso');
    const metasInactivas = metas.filter((m: Meta) => m.estado !== 'en_progreso');

    const handleCrear = async (data: MetaCreateInput | MetaUpdateInput) => {
        await crearMeta(data as MetaCreateInput);
        setModal({ tipo: 'ninguno' });
    };

    const handleEditar = async (data: MetaCreateInput | MetaUpdateInput) => {
        if (modal.tipo !== 'editar') return;
        await actualizarMeta({ id: modal.meta.id, data: data as MetaUpdateInput });
        setModal({ tipo: 'ninguno' });
    };

    const handleAportar = async (data: AportacionInput) => {
        if (modal.tipo !== 'aportar') return;
        await aportar({ id: modal.meta.id, data });
        setModal({ tipo: 'ninguno' });
    };

    const handleArchivar = async () => {
        if (modal.tipo !== 'archivar') return;
        await archivarMutation.mutateAsync(modal.meta.id);
        setModal({ tipo: 'ninguno' });
    };

    const handleEliminar = async () => {
        if (modal.tipo !== 'eliminar') return;
        await eliminarMutation.mutateAsync(modal.meta.id);
        setModal({ tipo: 'ninguno' });
    };

    const modalTitle =
        modal.tipo === 'crear'
            ? 'Nueva meta'
            : modal.tipo === 'editar'
            ? 'Editar meta'
            : modal.tipo === 'aportar'
            ? 'Registrar aportación'
            : modal.tipo === 'archivar'
            ? 'Archivar meta'
            : modal.tipo === 'eliminar'
            ? 'Eliminar meta'
            : '';

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24 sm:p-6">
            {/* Header */}
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Metas de ahorro</h1>
                <p className="mt-0.5 text-sm text-gray-500">
                    {metasActivas.length} meta{metasActivas.length !== 1 ? 's' : ''} en progreso
                </p>
            </header>

            {/* Estado de carga */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <p className="text-gray-500">Cargando metas…</p>
                </div>
            )}

            {isError && (
                <div className="rounded-md bg-red-50 p-4 text-red-700">
                    No se pudieron cargar las metas. Vuelve a intentar.
                </div>
            )}

            {/* Lista vacía */}
            {!isLoading && !isError && metas.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
                    <p className="text-gray-500">
                        Sin metas todavía. Usa el botón "+" para crear una.
                    </p>
                </div>
            )}

            {/* Metas activas */}
            {!isLoading && !isError && metasActivas.length > 0 && (
                <div className="space-y-4">
                    {metasActivas.map((m: Meta) => (
                        <MetaCard
                            key={m.id}
                            meta={m}
                            onAportar={(meta) => setModal({ tipo: 'aportar', meta })}
                            onEditar={(meta) => setModal({ tipo: 'editar', meta })}
                            onArchivar={(meta) => setModal({ tipo: 'archivar', meta })}
                            onEliminar={(meta) => setModal({ tipo: 'eliminar', meta, paso: 1 })}
                        />
                    ))}
                </div>
            )}

            {/* Sección metas completadas / canceladas */}
            {!isLoading && !isError && metasInactivas.length > 0 && (
                <div className="mt-8">
                    <button
                        type="button"
                        onClick={() => setMostrarCompletadas(!mostrarCompletadas)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                        {mostrarCompletadas
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />
                        }
                        Metas finalizadas ({metasInactivas.length})
                    </button>

                    {mostrarCompletadas && (
                        <div className="mt-3 space-y-4 opacity-70">
                            {metasInactivas.map((m: Meta) => (
                                <MetaCard
                                    key={m.id}
                                    meta={m}
                                    onAportar={() => {}}
                                    onEditar={() => {}}
                                    onEliminar={(meta) => setModal({ tipo: 'eliminar', meta, paso: 1 })}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* FAB */}
            <button
                type="button"
                onClick={() => setModal({ tipo: 'crear' })}
                className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700"
                aria-label="Nueva meta"
            >
                <Plus className="h-6 w-6" />
            </button>

            {/* Modal */}
            {modal.tipo !== 'ninguno' && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="meta-modal-title"
                >
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                        <h2 id="meta-modal-title" className="mb-4 text-lg font-semibold text-gray-900">
                            {modalTitle}
                        </h2>

                        {modal.tipo === 'crear' && (
                            <MetaForm
                                cuentas={cuentas}
                                onSubmit={handleCrear}
                                onCancelar={() => setModal({ tipo: 'ninguno' })}
                                isLoading={isCreating}
                            />
                        )}

                        {modal.tipo === 'editar' && (
                            <MetaForm
                                cuentas={cuentas}
                                meta={modal.meta}
                                onSubmit={handleEditar}
                                onCancelar={() => setModal({ tipo: 'ninguno' })}
                                isLoading={isUpdating}
                            />
                        )}

                        {modal.tipo === 'aportar' && (
                            <AportacionForm
                                nombreMeta={modal.meta.nombre}
                                onSubmit={handleAportar}
                                onCancelar={() => setModal({ tipo: 'ninguno' })}
                                isLoading={isAportando}
                            />
                        )}

                        {/* Modal Archivar */}
                        {modal.tipo === 'archivar' && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    ¿Archivar la meta <span className="font-medium text-gray-900">"{modal.meta.nombre}"</span>?
                                    Dejará de aparecer en el listado pero sus datos se conservan.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setModal({ tipo: 'ninguno' })}
                                        disabled={archivarMutation.isPending}
                                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleArchivar}
                                        disabled={archivarMutation.isPending}
                                        className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                                    >
                                        {archivarMutation.isPending ? 'Archivando…' : 'Archivar'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Modal Eliminar */}
                        {modal.tipo === 'eliminar' && (
                            <div className="space-y-4">
                                {modal.paso === 1 && (
                                    <>
                                        <div className="flex items-start gap-3 rounded-md bg-red-50 p-3">
                                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                                            <p className="text-sm text-red-700">
                                                ¿Estás seguro? Esta acción es <strong>permanente</strong> y no se puede deshacer.
                                            </p>
                                        </div>
                                        <div className="flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setModal({ tipo: 'ninguno' })}
                                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const tieneAportaciones = Number(modal.meta.montoActual) > 0;
                                                    if (tieneAportaciones) {
                                                        setModal({ tipo: 'eliminar', meta: modal.meta, paso: 2 });
                                                    } else {
                                                        handleEliminar();
                                                    }
                                                }}
                                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                                            >
                                                Continuar
                                            </button>
                                        </div>
                                    </>
                                )}

                                {modal.paso === 2 && (
                                    <>
                                        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                                            Las transacciones contables vinculadas a esta meta se conservarán en tu historial.
                                        </div>
                                        <div className="flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setModal({ tipo: 'ninguno' })}
                                                disabled={eliminarMutation.isPending}
                                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleEliminar}
                                                disabled={eliminarMutation.isPending}
                                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                            >
                                                {eliminarMutation.isPending ? 'Eliminando…' : 'Eliminar definitivamente'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
