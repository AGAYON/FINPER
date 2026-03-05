import { useState } from 'react';
import { Target, CalendarClock, TrendingUp, TrendingDown, Pencil, PlusCircle, CheckCircle2, XCircle } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/currency';
import { ESTADO_META_UI } from '../metas.types';
import type { Meta } from '../metas.types';

interface MetaCardProps {
    meta: Meta;
    onAportar: (meta: Meta) => void;
    onEditar: (meta: Meta) => void;
}

function formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function MetaCard({ meta, onAportar, onEditar }: MetaCardProps) {
    const [expandida, setExpandida] = useState(false);

    const objetivo = Number(meta.monto_objetivo);
    const actual = Number(meta.monto_actual);
    const porcentaje = meta.porcentaje;
    const barraAncho = Math.min(porcentaje, 100);
    const estado = ESTADO_META_UI[meta.estado];
    const activa = meta.estado === 'en_progreso';

    const proyeccion = (() => {
        if (!activa) return null;
        if (meta.fecha_proyectada) {
            if (meta.en_camino) {
                return { tipo: 'ok' as const, texto: `Llegarás el ${formatFecha(meta.fecha_proyectada)}` };
            }
            return { tipo: 'riesgo' as const, texto: `En riesgo — proyección: ${formatFecha(meta.fecha_proyectada)}` };
        }
        return null;
    })();

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
                        {activa && (
                            <button
                                type="button"
                                onClick={() => onEditar(meta)}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                title="Editar meta"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
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
                    {meta.fecha_limite && meta.dias_restantes != null && activa && (
                        <span className="flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {meta.dias_restantes > 0
                                ? `${meta.dias_restantes} días restantes`
                                : 'Fecha límite hoy'}
                        </span>
                    )}
                    {meta.fecha_limite && meta.estado === 'en_progreso' && meta.dias_restantes != null && meta.dias_restantes <= 0 && (
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
