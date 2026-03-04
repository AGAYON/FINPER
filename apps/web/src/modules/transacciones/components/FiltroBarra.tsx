import { SlidersHorizontal, X } from 'lucide-react';
import type { Cuenta } from '../../cuentas/cuentas.types';
import type { CategoriasAgrupadas } from '../../categorias/categorias.types';
import type { TransaccionFiltros, TipoTransaccion } from '../transacciones.types';
import { FILTROS_DEFAULT } from '../transacciones.types';

interface FiltroBarraProps {
    filtros: TransaccionFiltros;
    onChange: (filtros: TransaccionFiltros) => void;
    cuentas: Cuenta[];
    categorias: CategoriasAgrupadas;
}

const TIPOS_OPCION: Array<{ valor: TipoTransaccion | ''; label: string }> = [
    { valor: '', label: 'Todos los tipos' },
    { valor: 'ingreso', label: 'Ingresos' },
    { valor: 'gasto', label: 'Gastos' },
    { valor: 'transferencia', label: 'Transferencias' },
];

const selectCls =
    'block rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

function hayFiltrosActivos(f: TransaccionFiltros): boolean {
    return Boolean(f.desde || f.hasta || f.cuenta || f.categoria || f.tipo);
}

export function FiltroBarra({ filtros, onChange, cuentas, categorias }: FiltroBarraProps) {
    const categoriasFlat = [...categorias.ingreso, ...categorias.gasto].sort((a, b) =>
        a.nombre.localeCompare(b.nombre),
    );

    const set = (partial: Partial<TransaccionFiltros>) =>
        onChange({ ...filtros, ...partial, page: 1 });

    const resetear = () => onChange(FILTROS_DEFAULT);

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtros
                </div>

                {/* Desde */}
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Desde</label>
                    <input
                        type="date"
                        value={filtros.desde ?? ''}
                        onChange={(e) => set({ desde: e.target.value || undefined })}
                        className={selectCls}
                    />
                </div>

                {/* Hasta */}
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                    <input
                        type="date"
                        value={filtros.hasta ?? ''}
                        onChange={(e) => set({ hasta: e.target.value || undefined })}
                        className={selectCls}
                    />
                </div>

                {/* Tipo */}
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                    <select
                        value={filtros.tipo ?? ''}
                        onChange={(e) =>
                            set({ tipo: (e.target.value as TipoTransaccion) || undefined })
                        }
                        className={selectCls}
                    >
                        {TIPOS_OPCION.map((o) => (
                            <option key={o.valor} value={o.valor}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Cuenta */}
                {cuentas.length > 0 && (
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Cuenta</label>
                        <select
                            value={filtros.cuenta ?? ''}
                            onChange={(e) =>
                                set({ cuenta: e.target.value || undefined })
                            }
                            className={selectCls}
                        >
                            <option value="">Todas las cuentas</option>
                            {cuentas.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Categoría */}
                {categoriasFlat.length > 0 && (
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Categoría</label>
                        <select
                            value={filtros.categoria ?? ''}
                            onChange={(e) =>
                                set({ categoria: e.target.value || undefined })
                            }
                            className={selectCls}
                        >
                            <option value="">Todas las categorías</option>
                            {categoriasFlat.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Resetear */}
                {hayFiltrosActivos(filtros) && (
                    <button
                        type="button"
                        onClick={resetear}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                        <X className="h-4 w-4" />
                        Limpiar
                    </button>
                )}
            </div>
        </div>
    );
}
