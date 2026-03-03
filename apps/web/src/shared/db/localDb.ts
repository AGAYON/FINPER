import Dexie, { type Table } from 'dexie';

// Tipos para IndexedDB — usados como caché local y cola offline
export interface TransaccionLocal {
    id: string;
    fecha: string;
    monto: number;
    descripcion: string;
    tipo: string;
    cuentaOrigenId: string;
    cuentaDestinoId?: string | null;
    categoriaId?: string | null;
    notas?: string | null;
    recurrenteId?: string | null;
    createdAt: string;
    updatedAt: string;
    _syncStatus?: 'pending' | 'synced' | 'error';
}

class FinperDatabase extends Dexie {
    transacciones!: Table<TransaccionLocal>;

    constructor() {
        super('finper-local');
        this.version(1).stores({
            transacciones: 'id, fecha, cuentaOrigenId, cuentaDestinoId, categoriaId, tipo, updatedAt, _syncStatus',
        });
    }
}

export const localDb = new FinperDatabase();
