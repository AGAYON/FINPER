import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCategorias } from '../hooks/useCategorias';
import { CategoriaItem } from '../components/CategoriaItem';
import { CategoriaForm } from '../components/CategoriaForm';
import type { Categoria, CategoriaCreateInput, CategoriaUpdateInput, TipoCategoria } from '../categorias.types';

type ModalEstado =
    | null
    | { tipo: 'crear'; tipoCategoria: TipoCategoria }
    | { tipo: 'editar'; categoria: Categoria };

export function CategoriasPage() {
    const {
        categorias,
        isLoading,
        isError,
        crearCategoria,
        actualizarCategoria,
        archivarCategoria,
        isCreating,
        isUpdating,
        isArchiving,
    } = useCategorias();

    const [modal, setModal] = useState<ModalEstado>(null);

    const handleCrear = async (data: CategoriaCreateInput | CategoriaUpdateInput) => {
        await crearCategoria(data as CategoriaCreateInput);
        setModal(null);
    };

    const handleActualizar = async (data: CategoriaCreateInput | CategoriaUpdateInput) => {
        if (modal?.tipo !== 'editar') return;
        await actualizarCategoria({ id: modal.categoria.id, data });
        setModal(null);
    };

    const handleArchivar = async (categoria: Categoria) => {
        await archivarCategoria(categoria.id);
    };

    const formLoading = isCreating || isUpdating;
    const totalCategorias = categorias.ingreso.length + categorias.gasto.length;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
                    <p className="mt-0.5 text-sm text-gray-500">
                        {totalCategorias} categoría{totalCategorias !== 1 ? 's' : ''} activa
                        {totalCategorias !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setModal({ tipo: 'crear', tipoCategoria: 'ingreso' })}
                        className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
                    >
                        <Plus className="h-4 w-4" />
                        Ingreso
                    </button>
                    <button
                        type="button"
                        onClick={() => setModal({ tipo: 'crear', tipoCategoria: 'gasto' })}
                        className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
                    >
                        <Plus className="h-4 w-4" />
                        Gasto
                    </button>
                </div>
            </header>

            {isLoading && (
                <div className="flex justify-center py-12">
                    <p className="text-gray-500">Cargando categorías…</p>
                </div>
            )}

            {isError && (
                <div className="rounded-md bg-red-50 p-4 text-red-700">
                    No se pudieron cargar las categorías. Vuelve a intentar.
                </div>
            )}

            {!isLoading && !isError && (
                <div className="space-y-8">
                    {/* Sección Ingresos */}
                    <section>
                        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-green-700">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            Ingresos
                            <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                {categorias.ingreso.length}
                            </span>
                        </h2>

                        {categorias.ingreso.length === 0 ? (
                            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center">
                                <p className="mb-3 text-gray-500">Sin categorías de ingreso.</p>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setModal({ tipo: 'crear', tipoCategoria: 'ingreso' })
                                    }
                                    className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                                >
                                    <Plus className="h-4 w-4" />
                                    Crear primera
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {categorias.ingreso.map((cat) => (
                                    <CategoriaItem
                                        key={cat.id}
                                        categoria={cat}
                                        onEditar={(c) =>
                                            setModal({ tipo: 'editar', categoria: c })
                                        }
                                        onArchivar={handleArchivar}
                                        isArchiving={isArchiving}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Sección Gastos */}
                    <section>
                        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-red-700">
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                            Gastos
                            <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                {categorias.gasto.length}
                            </span>
                        </h2>

                        {categorias.gasto.length === 0 ? (
                            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center">
                                <p className="mb-3 text-gray-500">Sin categorías de gasto.</p>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setModal({ tipo: 'crear', tipoCategoria: 'gasto' })
                                    }
                                    className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                                >
                                    <Plus className="h-4 w-4" />
                                    Crear primera
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {categorias.gasto.map((cat) => (
                                    <CategoriaItem
                                        key={cat.id}
                                        categoria={cat}
                                        onEditar={(c) =>
                                            setModal({ tipo: 'editar', categoria: c })
                                        }
                                        onArchivar={handleArchivar}
                                        isArchiving={isArchiving}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}

            {/* Modal crear / editar */}
            {modal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cat-modal-title"
                >
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <h2
                            id="cat-modal-title"
                            className="mb-4 text-lg font-semibold text-gray-900"
                        >
                            {modal.tipo === 'crear' ? 'Nueva categoría' : 'Editar categoría'}
                        </h2>
                        <CategoriaForm
                            categoriaInicial={
                                modal.tipo === 'editar' ? modal.categoria : undefined
                            }
                            tipoFijo={
                                modal.tipo === 'crear' ? modal.tipoCategoria : undefined
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
