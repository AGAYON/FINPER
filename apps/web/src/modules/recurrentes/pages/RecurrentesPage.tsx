import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useRecurrentes } from '../hooks/useRecurrentes';
import { RecurrenteItem } from '../components/RecurrenteItem';
import { RecurrenteForm } from '../components/RecurrenteForm';
import type { Recurrente, RecurrenteCreateInput, RecurrenteUpdateInput } from '../recurrentes.types';

type ModalEstado =
    | { tipo: 'ninguno' }
    | { tipo: 'crear' }
    | { tipo: 'editar'; recurrente: Recurrente };

export function RecurrentesPage() {
    const [modal, setModal] = useState<ModalEstado>({ tipo: 'ninguno' });
    const [mostrarInactivos, setMostrarInactivos] = useState(false);

    const {
        recurrentes,
        isLoading,
        isError,
        crearRecurrente,
        actualizarRecurrente,
        ejecutarRecurrente,
        isCreating,
        isUpdating,
        isEjecutando,
        ejecutandoId,
    } = useRecurrentes();

    const activos = recurrentes.filter((r: Recurrente) => r.activo);
    const inactivos = recurrentes.filter((r: Recurrente) => !r.activo);

    const handleCrear = async (data: RecurrenteCreateInput | RecurrenteUpdateInput) => {
        await crearRecurrente(data as RecurrenteCreateInput);
        setModal({ tipo: 'ninguno' });
    };

    const handleEditar = async (data: RecurrenteCreateInput | RecurrenteUpdateInput) => {
        if (modal.tipo !== 'editar') return;
        await actualizarRecurrente({ id: modal.recurrente.id, data });
        setModal({ tipo: 'ninguno' });
    };

    const handleToggleActivo = async (r: Recurrente) => {
        await actualizarRecurrente({ id: r.id, data: { activo: !r.activo } });
    };

    const handleEjecutar = async (r: Recurrente) => {
        await ejecutarRecurrente(r.id);
    };

    const modalTitle =
        modal.tipo === 'crear' ? 'Nuevo recurrente' : modal.tipo === 'editar' ? 'Editar recurrente' : '';

    const pendientesCount = activos.filter((r) => r.pendiente).length;

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24 sm:p-6">
            {/* Header */}
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Transacciones recurrentes</h1>
                <p className="mt-0.5 text-sm text-gray-500">
                    {activos.length} activo{activos.length !== 1 ? 's' : ''}
                    {pendientesCount > 0 && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            {pendientesCount} pendiente{pendientesCount !== 1 ? 's' : ''} este mes
                        </span>
                    )}
                </p>
            </header>

            {/* Carga */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <p className="text-gray-500">Cargando recurrentes…</p>
                </div>
            )}

            {isError && (
                <div className="rounded-md bg-red-50 p-4 text-red-700">
                    No se pudieron cargar los recurrentes. Vuelve a intentar.
                </div>
            )}

            {/* Lista vacía */}
            {!isLoading && !isError && recurrentes.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
                    <p className="text-gray-500">
                        Sin recurrentes todavía. Usa el botón "+" para crear uno.
                    </p>
                </div>
            )}

            {/* Activos */}
            {!isLoading && !isError && activos.length > 0 && (
                <div className="space-y-3">
                    {activos.map((r: Recurrente) => (
                        <RecurrenteItem
                            key={r.id}
                            recurrente={r}
                            onEditar={(rec) => setModal({ tipo: 'editar', recurrente: rec })}
                            onToggleActivo={handleToggleActivo}
                            onEjecutar={handleEjecutar}
                            isEjecutando={isEjecutando}
                            ejecutandoId={ejecutandoId}
                        />
                    ))}
                </div>
            )}

            {/* Inactivos */}
            {!isLoading && !isError && inactivos.length > 0 && (
                <div className="mt-8">
                    <button
                        type="button"
                        onClick={() => setMostrarInactivos(!mostrarInactivos)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                        {mostrarInactivos ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                        Inactivos ({inactivos.length})
                    </button>

                    {mostrarInactivos && (
                        <div className="mt-3 space-y-3">
                            {inactivos.map((r: Recurrente) => (
                                <RecurrenteItem
                                    key={r.id}
                                    recurrente={r}
                                    onEditar={(rec) => setModal({ tipo: 'editar', recurrente: rec })}
                                    onToggleActivo={handleToggleActivo}
                                    onEjecutar={handleEjecutar}
                                    isEjecutando={isEjecutando}
                                    ejecutandoId={ejecutandoId}
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
                aria-label="Nuevo recurrente"
            >
                <Plus className="h-6 w-6" />
            </button>

            {/* Modal */}
            {modal.tipo !== 'ninguno' && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="rec-modal-title"
                >
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                        <h2 id="rec-modal-title" className="mb-4 text-lg font-semibold text-gray-900">
                            {modalTitle}
                        </h2>

                        {modal.tipo === 'crear' && (
                            <RecurrenteForm
                                onSubmit={handleCrear}
                                onCancelar={() => setModal({ tipo: 'ninguno' })}
                                isLoading={isCreating}
                            />
                        )}

                        {modal.tipo === 'editar' && (
                            <RecurrenteForm
                                recurrente={modal.recurrente}
                                onSubmit={handleEditar}
                                onCancelar={() => setModal({ tipo: 'ninguno' })}
                                isLoading={isUpdating}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
