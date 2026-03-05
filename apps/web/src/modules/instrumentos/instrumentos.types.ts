/** Valores alineados al backend */
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
    /** Crédito tasa fija */
    saldoInsoluto?: number;
    proximoPago?: ProximoPago | null;
    porcentajePagado?: number | null;
    periodosRestantes?: number | null;
    /** Inversión */
    saldoActual?: number;
    rendimientoAcumulado?: number;
}

export interface PeriodoAmortizacion {
    periodo: number;
    fecha: string;
    cuota: number;
    capital: number;
    interes: number;
    saldo: number;
}

export interface ProyeccionPrepago {
    fechaLiquidacionOriginal: string | null;
    fechaLiquidacionConPrepago: string;
    interesesRestantesOriginal: number;
    interesesRestantesConPrepago: number;
    interesesAhorrados: number;
}

/** Payload crear instrumento */
export interface InstrumentoCreateInput {
    nombre: string;
    tipo: TipoInstrumento;
    subtipo: SubtipoInstrumento;
    cuentaId: string;
    capitalInicial?: number;
    tasaAnual?: number;
    plazoMeses?: number;
    fechaInicio?: string;
    periodicidadDias?: number;
    notas?: string | null;
}

/** Payload editar instrumento */
export interface InstrumentoUpdateInput {
    nombre?: string;
    notas?: string | null;
    tasaAnual?: number;
    capitalInicial?: number;
    plazoMeses?: number;
}

/** Payload registrar pagos históricos */
export interface PagosHistoricosInput {
    numeroPagos: number;
    cuentaOrigenId: string;
    fechaPrimerPago?: string;
}

export interface PagosHistoricosSummary {
    pagosRegistrados: number;
    capitalAmortizado: number;
    interesesPagados: number;
    saldoInsolutoActual: number;
}

/** Payload registrar pago (crédito) */
export interface PagoInput {
    fecha: string;
    montoTotal: number;
    cuentaOrigenId: string;
    montoInteresAjuste?: number;
    notas?: string | null;
}

/** Payload ajuste inversión tasa variable */
export interface AjusteVariableInput {
    montoReal: number;
    fecha?: string;
    notas?: string | null;
}
