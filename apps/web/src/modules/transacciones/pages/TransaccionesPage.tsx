import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/currency';
import { useTransacciones } from '../hooks/useTransacciones';
import { useCuentas } from '../../cuentas/hooks/useCuentas';
import { useCategorias } from '../../categorias/hooks/useCategorias';
import { TransaccionItem } from '../components/TransaccionItem';
import { TransaccionForm } from '../components/TransaccionForm';
import { FiltroBarra } from '../components/FiltroBarra';
import {
    FILTROS_DEFAULT,
    TIPO_TRANSACCION_META,
} from '../transacciones.types';
import type {
    Transaccion,
    TransaccionCreateInput,
    TransaccionUpdateInput,
    TransaccionFiltros,
    TipoTransaccion,
} from '../transacciones.types';

type ModalEstado =
    | null
    | { tipo: 'crear'; tipoInicial: TipoTransaccion }
    | { tipo: 'editar'; transaccion: Transaccion };

export function TransaccionesPage() {
    const [filtros, setFiltros] = useState<TransaccionFiltros>(FILTROS_DEFAULT);
    const [modal, setModal] = useState<ModalEstado>(null);

    const {
        transacciones,
        total,
        page,
        totalPaginas,
        isLoading,
        isError,
        crearTransaccion,
        actualizarTransaccion,
        eliminarTransaccion,
        isCreating,
        isUpdating,
        isDeleting,
    } = useTransacciones(filtros);

    const { cuentas } = useCuentas();
    const { categorias } = useCategorias();

    const handleCrear = async (data: TransaccionCreateInput | TransaccionUpdateInput) => {
        await crearTransaccion(data as TransaccionCreateInput);
        setModal(null);
    };

    const handleActualizar = async (data: TransaccionCreateInput | TransaccionUpdateInput) => {
        if (modal?.tipo !== 'editar') return;
        await actualizarTransaccion({ id: modal.transaccion.id, data });
        setModal(null);
    };

    const handleEliminar = async (t: Transaccion) => {
        await eliminarTransaccion(t.id);
    };

    const handleFiltros = (nuevos: TransaccionFiltros) => {
        setFiltros(nuevos);
    };

    const irPagina = (p: number) => {
        setFiltros((f) => ({ ...f, page: p }));
    };

    const formLoading = isCreating || isUpdating;

    // Resumen rápido del resultado actual
    const ingresosMostrados = transacciones
        .filter((t) => t.tipo === 'ingreso')
        .reduce((s, t) => s + Number(t.monto), 0);
    const gastosMostrados = transacciones
        .filter((t) => t.tipo === 'gasto')
        .reduce((s, t) => s + Number(t.monto), 0);

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24 sm:p-6">
            {/* Header */}
            <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Transacciones</h1>
                    <p className="mt-0.5 text-sm text-gray-500">
                        {total} resultado{total !== 1 ? 's' : ''}
                        {total > 0 && (
                            <>
                                {' · '}
                                <span className="text-green-600">+{formatCurrency(ingresosMostrados)}</span>
                                {' · '}
                                <span className="text-red-600">-{formatCurrency(gastosMostrados)}</span>
                            </>
                        )}
                    </p>
                </div>
            </header>

            {/* Filtros */}
            <div className="mb-4">
                <FiltroBarra
                    filtros={filtros}
                    onChange={handleFiltros}
                    cuentas={cuentas}
                    categorias={categorias}
                />
            </div>

            {/* Lista */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <p className="text-gray-500">Cargando transacciones…</p>
                </div>
            )}

            {isError && (
                <div className="rounded-md bg-red-50 p-4 text-red-700">
                    No se pudieron cargar las transacciones. Vuelve a intentar.
                </div>
            )}

            {!isLoading && !isError && transacciones.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
                    <p className="text-gray-500">
                        {total === 0 && !filtros.desde && !filtros.hasta && !filtros.tipo && !filtros.cuenta && !filtros.categoria
                            ? 'Aún no hay transacciones. Usa el botón "+" para registrar la primera.'
                            : 'Sin resultados para los filtros actuales.'}
                    </p>
                </div>
            )}

            {!isLoading && !isError && transacciones.length > 0 && (
                <div className="space-y-2">
                    {transacciones.map((t) => (
                        <TransaccionItem
                            key={t.id}
                            transaccion={t}
                            onEditar={(tx) => setModal({ tipo: 'editar', transaccion: tx })}
                            onEliminar={handleEliminar}
                            isDeleting={isDeleting}
                        />
                    ))}
                </div>
            )}

            {/* Paginación */}
            {totalPaginas > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => irPagina(page - 1)}
                        disabled={page <= 1}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                        Página {page} de {totalPaginas}
                    </span>
                    <button
                        type="button"
                        onClick={() => irPagina(page + 1)}
                        disabled={page >= totalPaginas}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40"
                    >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* FAB — botón flotante "+" con menú de tipo */}
            <div className="fixed bottom-6 right-6 z-40 flex flex-col-reverse items-end gap-2">
                {[
                    { tipo: 'ingreso' as TipoTransaccion, label: 'Ingreso', cls: 'bg-green-600 hover:bg-green-700' },
                    { tipo: 'gasto' as TipoTransaccion, label: 'Gasto', cls: 'bg-red-600 hover:bg-red-700' },
                    { tipo: 'transferencia' as TipoTransaccion, label: 'Transferencia', cls: 'bg-indigo-600 hover:bg-indigo-700' },
                ].map(({ tipo, label, cls }) => (
                    <button
                        key={tipo}
                        type="button"
                        onClick={() => setModal({ tipo: 'crear', tipoInicial: tipo })}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg ${cls}`}
                    >
                        <Plus className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Modal crear / editar */}
            {modal && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="tx-modal-title"
                >
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 id="tx-modal-title" className="text-lg font-semibold text-gray-900">
                                {modal.tipo === 'crear' ? (
                                    <>
                                        Nueva {TIPO_TRANSACCION_META[modal.tipoInicial].label.toLowerCase()}
                                    </>
                                ) : (
                                    'Editar transacción'
                                )}
                            </h2>
                            {modal.tipo === 'editar' && (
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_TRANSACCION_META[modal.transaccion.tipo].badgeCls}`}>
                                    {TIPO_TRANSACCION_META[modal.transaccion.tipo].label}
                                </span>
                            )}
                        </div>
                        <TransaccionForm
                            transaccionInicial={
                                modal.tipo === 'editar' ? modal.transaccion : undefined
                            }
                            tipoInicial={
                                modal.tipo === 'crear' ? modal.tipoInicial : undefined
                            }
                            onSubmit={modal.tipo === 'crear' ? handleCrear : handleActualizar}
                            onCancelar={() => setModal(null)}
                            isLoading={formLoading}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
