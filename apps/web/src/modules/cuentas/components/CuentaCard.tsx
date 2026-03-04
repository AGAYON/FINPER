import { useState } from 'react';
import {
    Landmark,
    Wallet,
    PiggyBank,
    TrendingUp,
    CreditCard,
    FileText,
    Pencil,
    Archive,
    X,
} from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/currency';
import { TIPO_CUENTA_META } from '../cuentas.types';
import type { Cuenta, TipoCuenta } from '../cuentas.types';

const ICONOS: Record<TipoCuenta, React.ComponentType<{ className?: string }>> = {
    banco: Landmark,
    efectivo: Wallet,
    ahorro: PiggyBank,
    inversion: TrendingUp,
    credito: CreditCard,
    prestamo: FileText,
};

interface CuentaCardProps {
    cuenta: Cuenta;
    onEditar: (cuenta: Cuenta) => void;
    onArchivar: (cuenta: Cuenta) => void;
    isArchiving?: boolean;
}

export function CuentaCard({ cuenta, onEditar, onArchivar, isArchiving }: CuentaCardProps) {
    const [confirmarArchivar, setConfirmarArchivar] = useState(false);

    const meta = TIPO_CUENTA_META[cuenta.tipo];
    const Icono = ICONOS[cuenta.tipo];
    const esPasiva = cuenta.tipo === 'credito' || cuenta.tipo === 'prestamo';

    const handleArchivar = () => {
        if (!confirmarArchivar) {
            setConfirmarArchivar(true);
            return;
        }
        onArchivar(cuenta);
        setConfirmarArchivar(false);
    };

    const handleCancelarArchivar = () => {
        setConfirmarArchivar(false);
    };

    return (
        <div
            className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
            style={{ borderLeftWidth: '4px', borderLeftColor: cuenta.color }}
        >
            <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {Icono && <Icono className="h-5 w-5 shrink-0 text-gray-500" />}
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-500">{meta.label}</p>
                            <p className="font-semibold text-gray-900 truncate">{cuenta.nombre}</p>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-sm text-gray-500">{cuenta.moneda}</p>
                        <p
                            className={
                                esPasiva
                                    ? 'font-semibold text-red-600'
                                    : 'font-semibold text-gray-900'
                            }
                        >
                            {formatCurrency(cuenta.saldoActual, cuenta.moneda)}
                        </p>
                    </div>
                </div>

                {!cuenta.incluirEnTotal && (
                    <p className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
                        No incluida en patrimonio neto
                    </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onEditar(cuenta)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        <Pencil className="h-4 w-4" />
                        Editar
                    </button>
                    {!confirmarArchivar ? (
                        <button
                            type="button"
                            onClick={handleArchivar}
                            disabled={isArchiving}
                            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                            <Archive className="h-4 w-4" />
                            Archivar
                        </button>
                    ) : (
                        <>
                            <span className="text-sm text-gray-600 self-center">¿Confirmar?</span>
                            <button
                                type="button"
                                onClick={handleArchivar}
                                disabled={isArchiving}
                                className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                                Sí, archivar
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelarArchivar}
                                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <X className="h-4 w-4" />
                                Cancelar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
