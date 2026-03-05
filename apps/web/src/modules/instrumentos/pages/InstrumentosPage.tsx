import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useInstrumentos } from '../hooks/useInstrumentos';
import { InstrumentoCard } from '../components/InstrumentoCard';
import { InstrumentoForm } from '../components/InstrumentoForm';
import type { InstrumentoCreateInput } from '../instrumentos.types';

export function InstrumentosPage() {
    const {
        instrumentos,
        isLoading,
        isError,
        crearInstrumento,
        isCreating,
    } = useInstrumentos();

    const [modalCrear, setModalCrear] = useState(false);

    const creditos = instrumentos.filter(
        (i) => i.tipo === 'credito' && i.subtipo === 'tasa_fija',
    );
    const inversiones = instrumentos.filter((i) => i.tipo === 'inversion');

    const handleCrear = async (data: InstrumentoCreateInput) => {
        await crearInstrumento(data);
        setModalCrear(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Instrumentos financieros
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Créditos e inversiones con estructura de amortización
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setModalCrear(true)}
                    className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                    <Plus className="h-5 w-5" />
                    Nuevo instrumento
                </button>
            </header>

            {isLoading && (
                <div className="flex justify-center py-12">
                    <p className="text-gray-500">Cargando instrumentos…</p>
                </div>
            )}

            {isError && (
                <div className="rounded-md bg-red-50 p-4 text-red-700">
                    No se pudieron cargar los instrumentos. Vuelve a intentar.
                </div>
            )}

            {!isLoading && !isError && (
                <div className="space-y-10">
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">
                            Créditos
                        </h2>
                        {creditos.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4">
                                No hay créditos registrados.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {creditos.map((inst) => (
                                    <InstrumentoCard
                                        key={inst.id}
                                        instrumento={inst}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">
                            Inversiones
                        </h2>
                        {inversiones.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4">
                                No hay inversiones registradas.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {inversiones.map((inst) => (
                                    <InstrumentoCard
                                        key={inst.id}
                                        instrumento={inst}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}

            {modalCrear && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-crear-title"
                >
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2
                            id="modal-crear-title"
                            className="text-lg font-semibold text-gray-900 mb-4"
                        >
                            Nuevo instrumento
                        </h2>
                        <InstrumentoForm
                            onSubmit={handleCrear}
                            onCancelar={() => setModalCrear(false)}
                            isLoading={isCreating}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
