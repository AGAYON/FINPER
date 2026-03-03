import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type TipoOperacion = 'CREATE' | 'UPDATE' | 'DELETE';
export type EntidadOffline =
    | 'cuentas'
    | 'transacciones'
    | 'categorias'
    | 'presupuestos'
    | 'metas'
    | 'recurrentes'
    | 'aportaciones_meta';

export interface OperacionOffline {
    id: string;
    tipo: TipoOperacion;
    entidad: EntidadOffline;
    datos: Record<string, unknown>;
    createdAt: string;
}

interface OfflineQueueState {
    cola: OperacionOffline[];
    agregarOperacion: (
        tipo: TipoOperacion,
        entidad: EntidadOffline,
        datos: Record<string, unknown>,
    ) => void;
    limpiarCola: () => void;
    eliminarOperacion: (id: string) => void;
}

export const useOfflineQueue = create<OfflineQueueState>()(
    persist(
        (set) => ({
            cola: [],
            agregarOperacion: (tipo, entidad, datos) =>
                set((state) => ({
                    cola: [
                        ...state.cola,
                        { id: uuidv4(), tipo, entidad, datos, createdAt: new Date().toISOString() },
                    ],
                })),
            limpiarCola: () => set({ cola: [] }),
            eliminarOperacion: (id) =>
                set((state) => ({ cola: state.cola.filter((op) => op.id !== id) })),
        }),
        { name: 'finper-offline-queue' },
    ),
);
