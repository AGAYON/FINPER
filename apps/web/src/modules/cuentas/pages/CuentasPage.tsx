import { useState } from 'react';
import { Plus } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/currency';
import { useCuentas } from '../hooks/useCuentas';
import { CuentaCard } from '../components/CuentaCard';
import { CuentaForm } from '../components/CuentaForm';
import type { Cuenta, CuentaCreateInput, CuentaUpdateInput } from '../cuentas.types';

type ModalEstado =
    | null
    | { tipo: 'crear' }
    | { tipo: 'editar'; cuenta: Cuenta };

export function CuentasPage() {
    const {
        cuentas,
        totalActivos,
        totalPasivos,
        netWorth,
        isLoading,
        isError,
        crearCuenta,
        actualizarCuenta,
        archivarCuenta,
        isCreating,
        isUpdating,
        isArchiving,
    } = useCuentas();

    const [modal, setModal] = useState<ModalEstado>(null);

    const handleCrear = async (data: CuentaCreateInput | CuentaUpdateInput) => {
        await crearCuenta(data as CuentaCreateInput);
        setModal(null);
    };

    const handleActualizar = async (data: CuentaCreateInput | CuentaUpdateInput) => {
        if (modal?.tipo !== 'editar') return;
        await actualizarCuenta({ id: modal.cuenta.id, data });
        setModal(null);
    };

    const handleArchivar = async (cuenta: Cuenta) => {
        await archivarCuenta(cuenta.id);
    };

    const formLoading = isCreating || isUpdating;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cuentas</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {cuentas.length} cuenta{cuentas.length !== 1 ? 's' : ''} activa
                        {cuentas.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setModal({ tipo: 'crear' })}
                    className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                    <Plus className="h-5 w-5" />
                    Nueva cuenta
                </button>
            </header>

            {/* Resumen */}
            <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Activos</p>
                    <p className="text-xl font-semibold text-gray-900">
                        {formatCurrency(totalActivos)}
                    </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Pasivos</p>
                    <p className="text-xl font-semibold text-red-600">
                        {formatCurrency(totalPasivos)}
                    </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Patrimonio neto</p>
                    <p className="text-xl font-semibold text-gray-900">
                        {formatCurrency(netWorth)}
                    </p>
                </div>
            </section>

            {/* Contenido */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <p className="text-gray-500">Cargando cuentas…</p>
                </div>
            )}

            {isError && (
                <div className="rounded-md bg-red-50 p-4 text-red-700">
                    No se pudieron cargar las cuentas. Vuelve a intentar.
                </div>
            )}

            {!isLoading && !isError && cuentas.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
                    <p className="text-gray-600 mb-4">
                        Aún no tienes cuentas. Crea una para empezar a registrar tu dinero.
                    </p>
                    <button
                        type="button"
                        onClick={() => setModal({ tipo: 'crear' })}
                        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                        <Plus className="h-5 w-5" />
                        Crear primera cuenta
                    </button>
                </div>
            )}

            {!isLoading && !isError && cuentas.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {cuentas.map((cuenta) => (
                        <CuentaCard
                            key={cuenta.id}
                            cuenta={cuenta}
                            onEditar={(c) => setModal({ tipo: 'editar', cuenta: c })}
                            onArchivar={handleArchivar}
                            isArchiving={isArchiving}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            {modal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <h2 id="modal-title" className="text-lg font-semibold text-gray-900 mb-4">
                            {modal.tipo === 'crear' ? 'Nueva cuenta' : 'Editar cuenta'}
                        </h2>
                        <CuentaForm
                            cuentaInicial={modal.tipo === 'editar' ? modal.cuenta : undefined}
                            onSubmit={
                                modal.tipo === 'crear' ? handleCrear : handleActualizar
                            }
                            onCancelar={() => setModal(null)}
                            isLoading={formLoading}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
