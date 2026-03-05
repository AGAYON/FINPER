import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePresupuestos } from '../hooks/usePresupuestos';
import { useCategorias } from '../../categorias/hooks/useCategorias';
import { PresupuestoBarra } from '../components/PresupuestoBarra';
import { PresupuestoForm } from '../components/PresupuestoForm';
import type { Presupuesto, PresupuestoUpdateInput } from '../presupuestos.types';

function mesActualStr(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function mesAnterior(mes: string): string {
    const [y, m] = mes.split('-').map(Number);
    if (m === 1) return `${y - 1}-12`;
    return `${y}-${String(m - 1).padStart(2, '0')}`;
}

function mesSiguiente(mes: string): string {
    const [y, m] = mes.split('-').map(Number);
    if (m === 12) return `${y + 1}-01`;
    return `${y}-${String(m + 1).padStart(2, '0')}`;
}

function formatMesLabel(mes: string): string {
    const [y, m] = mes.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('es-MX', {
        month: 'long',
        year: 'numeric',
    });
}

export function PresupuestosPage() {
    const [mes, setMes] = useState(mesActualStr);
    const [modalAbierto, setModalAbierto] = useState(false);

    const {
        presupuestos,
        isLoading,
        isError,
        crearPresupuesto,
        actualizarPresupuesto,
        eliminarPresupuesto,
        isCreating,
        isUpdating,
        isDeleting,
    } = usePresupuestos(mes);

    const { categorias } = useCategorias();

    const categoriasConPresupuesto = new Set<string>(presupuestos.map((p: Presupuesto) => p.categoriaId));

    const handleActualizar = (id: string, data: PresupuestoUpdateInput) =>
        actualizarPresupuesto({ id, data });

    const handleEliminar = (id: string) => eliminarPresupuesto(id);

    const handleCrear = async (data: Parameters<typeof crearPresupuesto>[0]) => {
        await crearPresupuesto(data);
        setModalAbierto(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24 sm:p-6">
            {/* Header */}
            <header className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Presupuestos</h1>
                <p className="mt-0.5 text-sm text-gray-500">
                    {presupuestos.length} presupuesto{presupuestos.length !== 1 ? 's' : ''}
                </p>
            </header>

            {/* Navegación de mes */}
            <div className="mb-5 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
                <button
                    type="button"
                    onClick={() => setMes((m: string) => mesAnterior(m))}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    aria-label="Mes anterior"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-semibold capitalize text-gray-900">
                    {formatMesLabel(mes)}
                </span>
                <button
                    type="button"
                    onClick={() => setMes((m: string) => mesSiguiente(m))}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    aria-label="Mes siguiente"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            {/* Estado de carga */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <p className="text-gray-500">Cargando presupuestos…</p>
                </div>
            )}

            {isError && (
                <div className="rounded-md bg-red-50 p-4 text-red-700">
                    No se pudieron cargar los presupuestos. Vuelve a intentar.
                </div>
            )}

            {/* Lista vacía */}
            {!isLoading && !isError && presupuestos.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
                    <p className="text-gray-500">
                        Sin presupuestos para este mes. Usa el botón "+" para crear uno.
                    </p>
                </div>
            )}

            {/* Lista */}
            {!isLoading && !isError && presupuestos.length > 0 && (
                <div className="space-y-3">
                    {presupuestos.map((p: Presupuesto) => (
                        <PresupuestoBarra
                            key={p.id}
                            presupuesto={p}
                            onActualizar={handleActualizar}
                            onEliminar={handleEliminar}
                            isUpdating={isUpdating}
                            isDeleting={isDeleting}
                        />
                    ))}
                </div>
            )}

            {/* FAB */}
            <button
                type="button"
                onClick={() => setModalAbierto(true)}
                className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700"
                aria-label="Nuevo presupuesto"
            >
                <Plus className="h-6 w-6" />
            </button>

            {/* Modal crear */}
            {modalAbierto && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="pres-modal-title"
                >
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                        <h2 id="pres-modal-title" className="mb-4 text-lg font-semibold text-gray-900">
                            Nuevo presupuesto
                        </h2>
                        <PresupuestoForm
                            categorias={categorias.gasto}
                            categoriasConPresupuesto={categoriasConPresupuesto}
                            mesActual={mes}
                            onSubmit={handleCrear}
                            onCancelar={() => setModalAbierto(false)}
                            isLoading={isCreating}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
