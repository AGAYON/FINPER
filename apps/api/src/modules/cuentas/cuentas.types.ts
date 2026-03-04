/** Valores del enum TipoCuenta en Prisma */
export type TipoCuenta =
    | 'banco'
    | 'efectivo'
    | 'ahorro'
    | 'inversion'
    | 'credito'
    | 'prestamo';

/** Cuenta tal como la devuelve la API (con saldo actual calculado) */
export interface Cuenta {
    id: string;
    nombre: string;
    tipo: TipoCuenta;
    saldoInicial: number;
    fechaInicio: string;
    moneda: string;
    color: string;
    icono: string;
    incluirEnTotal: boolean;
    activa: boolean;
    createdAt: string;
    updatedAt: string;
    saldoActual: number;
}

/** Payload para crear una cuenta */
export interface CuentaCreateInput {
    nombre: string;
    tipo: TipoCuenta;
    saldoInicial?: number;
    fechaInicio?: string;
    moneda?: string;
    color?: string;
    icono?: string;
    incluirEnTotal?: boolean;
}

/** Payload para actualizar una cuenta (todos los campos opcionales) */
export type CuentaUpdateInput = Partial<CuentaCreateInput>;
