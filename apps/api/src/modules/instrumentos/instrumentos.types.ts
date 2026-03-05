export type TipoInstrumento = 'credito' | 'inversion';

export type SubtipoInstrumento = 'tasa_fija' | 'tasa_variable';

export interface ProximoPago {
    fecha: string;
    montoTotal: number;
    montoCapital: number;
    montoInteres: number;
}

export interface InstrumentoListado {
    id: string;
    nombre: string;
    tipo: TipoInstrumento;
    subtipo: SubtipoInstrumento;
    cuentaId: string;
    activo: boolean;
    notas: string | null;
    tasaAnual?: number | null;
    capitalInicial?: number | null;
    plazoMeses?: number | null;
    createdAt: string;
    updatedAt: string;

    // Para créditos tasa fija
    saldoInsoluto?: number;
    proximoPago?: ProximoPago | null;
    porcentajePagado?: number | null;
    periodosRestantes?: number | null;

    // Para inversiones tasa variable
    saldoActual?: number;
    rendimientoAcumulado?: number;
}

export interface AmortizacionPeriodo {
    periodo: number;
    fecha: string;
    cuota: number;
    interes: number;
    capital: number;
    saldo: number;
}

export interface ProyeccionPrepago {
    fechaLiquidacionOriginal: string | null;
    fechaLiquidacionConPrepago: string;
    interesesRestantesOriginal: number;
    interesesRestantesConPrepago: number;
    interesesAhorrados: number;
}

