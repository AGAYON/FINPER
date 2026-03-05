import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useMetas } from '../hooks/useMetas';
import { useCuentas } from '../../cuentas/hooks/useCuentas';
import { MetaCard } from '../components/MetaCard';
import { MetaForm } from '../components/MetaForm';
import { AportacionForm } from '../components/AportacionForm';
import type { Meta, MetaCreateInput, MetaUpdateInput, AportacionInput } from '../metas.types';

type ModalEstado =
    | { tipo: 'ninguno' }
    | { tipo: 'crear' }
    | { tipo: 'editar'; meta: Meta }
    | { tipo: 'aportar'; meta: Meta };

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

    const modalTitle =
        modal.tipo === 'crear'
            ? 'Nueva meta'
            : modal.tipo === 'editar'
            ? 'Editar meta'
            : modal.tipo === 'aportar'
            ? 'Registrar aportación'
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
                    </div>
                </div>
            )}
        </div>
    );
}
