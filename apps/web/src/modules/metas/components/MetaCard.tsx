import { useState } from 'react';
import { Target, CalendarClock, TrendingUp, TrendingDown, PlusCircle, CheckCircle2, XCircle, MoreHorizontal, Pencil, Archive, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/currency';
import { ESTADO_META_UI } from '../metas.types';
import type { Meta } from '../metas.types';

interface MetaCardProps {
    meta: Meta;
    onAportar: (meta: Meta) => void;
    onEditar: (meta: Meta) => void;
    onArchivar?: (meta: Meta) => void;
    onEliminar?: (meta: Meta) => void;
}

function formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function MetaCard({ meta, onAportar, onEditar, onArchivar, onEliminar }: MetaCardProps) {
    const [expandida, setExpandida] = useState(false);
    const [menuAbierto, setMenuAbierto] = useState(false);

    const objetivo = Number(meta.montoObjetivo);
    const actual = Number(meta.montoActual);
    const porcentaje = meta.porcentaje;
    const barraAncho = Math.min(porcentaje, 100);
    const estado = ESTADO_META_UI[meta.estado];
    const activa = meta.estado === 'en_progreso';

    const proyeccion = (() => {
        if (!activa) return null;
        if (meta.fechaProyectada) {
            if (meta.enCamino) {
                return { tipo: 'ok' as const, texto: `Llegarás el ${formatFecha(meta.fechaProyectada)}` };
            }
            return { tipo: 'riesgo' as const, texto: `En riesgo — proyección: ${formatFecha(meta.fechaProyectada)}` };
        }
        return null;
    })();

    const mostrarMenu = !!(onEditar || onArchivar || onEliminar);

    return (
        <div
            className={`rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${estado.borderCls}`}
        >
            {/* Franja de color + cabecera */}
            <div
                className="h-1.5 w-full rounded-t-xl"
                style={{ backgroundColor: meta.color }}
            />

            <div className="p-4">
                {/* Fila superior: nombre + badges + acciones */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                        <div
                            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: meta.color + '25' }}
                        >
                            <Target className="h-4 w-4" style={{ color: meta.color }} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{meta.nombre}</h3>
                            {meta.descripcion && (
                                <p className="text-xs text-gray-500 truncate mt-0.5">{meta.descripcion}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estado.bgCls} ${estado.textCls}`}>
                            {estado.label}
                        </span>

                        {/* Menú de acciones */}
                        {mostrarMenu && (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setMenuAbierto((v) => !v)}
                                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                    title="Acciones"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </button>

                                {menuAbierto && (
                                    <>
                                        {/* Overlay para cerrar al hacer clic fuera */}
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setMenuAbierto(false)}
                                        />
                                        <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                                            <button
                                                type="button"
                                                onClick={() => { setMenuAbierto(false); onEditar(meta); }}
                                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Editar
                                            </button>
                                            {activa && onArchivar && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setMenuAbierto(false); onArchivar(meta); }}
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <Archive className="h-3.5 w-3.5" />
                                                    Archivar
                                                </button>
                                            )}
                                            {onEliminar && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setMenuAbierto(false); onEliminar(meta); }}
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Barra de progreso */}
                <div className="mt-3">
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${estado.barCls}`}
                            style={{ width: `${barraAncho}%` }}
                        />
                    </div>
                </div>

                {/* Montos y porcentaje */}
                <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                        <span className="font-medium text-gray-900">{formatCurrency(actual)}</span>
                        {' de '}
                        <span className="font-medium text-gray-900">{formatCurrency(objetivo)}</span>
                    </span>
                    <span className={`font-semibold ${estado.textCls}`}>
                        {porcentaje.toFixed(0)}%
                    </span>
                </div>

                {/* Info extra: días restantes + proyección */}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    {meta.fechaLimite && meta.diasRestantes != null && activa && (
                        <span className="flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {meta.diasRestantes > 0
                                ? `${meta.diasRestantes} días restantes`
                                : 'Fecha límite hoy'}
                        </span>
                    )}
                    {meta.fechaLimite && meta.estado === 'en_progreso' && meta.diasRestantes != null && meta.diasRestantes <= 0 && (
                        <span className="text-red-600 font-medium">Vencida</span>
                    )}
                    {proyeccion && (
                        <span className={`flex items-center gap-1 ${proyeccion.tipo === 'ok' ? 'text-green-600' : 'text-amber-600'}`}>
                            {proyeccion.tipo === 'ok'
                                ? <TrendingUp className="h-3.5 w-3.5" />
                                : <TrendingDown className="h-3.5 w-3.5" />
                            }
                            {proyeccion.texto}
                        </span>
                    )}
                    {meta.estado === 'completada' && (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Meta alcanzada
                        </span>
                    )}
                    {meta.estado === 'cancelada' && (
                        <span className="flex items-center gap-1 text-gray-500">
                            <XCircle className="h-3.5 w-3.5" />
                            Cancelada
                        </span>
                    )}
                </div>

                {/* Botón Aportar — solo metas activas */}
                {activa && (
                    <div className="mt-3 flex justify-end">
                        <button
                            type="button"
                            onClick={() => onAportar(meta)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                        >
                            <PlusCircle className="h-3.5 w-3.5" />
                            Aportar
                        </button>
                    </div>
                )}

                {/* Expandir descripción completa si fue truncada */}
                {meta.descripcion && meta.descripcion.length > 60 && (
                    <button
                        type="button"
                        onClick={() => setExpandida(!expandida)}
                        className="mt-1 text-xs text-indigo-600 hover:underline"
                    >
                        {expandida ? 'Ver menos' : 'Ver más'}
                    </button>
                )}
                {expandida && meta.descripcion && (
                    <p className="mt-1 text-xs text-gray-600">{meta.descripcion}</p>
                )}
            </div>
        </div>
    );
}
