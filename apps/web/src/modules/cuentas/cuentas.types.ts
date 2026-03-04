/** Valores del enum TipoCuenta (alineado al backend) */
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

/** Payload para actualizar una cuenta */
export type CuentaUpdateInput = Partial<CuentaCreateInput>;

/** Metadatos por tipo de cuenta para la UI */
export const TIPO_CUENTA_META: Record<
    TipoCuenta,
    { label: string; icono: string; esActivo: boolean }
> = {
    banco: { label: 'Banco', icono: 'Landmark', esActivo: true },
    efectivo: { label: 'Efectivo', icono: 'Wallet', esActivo: true },
    ahorro: { label: 'Ahorro', icono: 'PiggyBank', esActivo: true },
    inversion: { label: 'Inversión', icono: 'TrendingUp', esActivo: true },
    credito: { label: 'Crédito', icono: 'CreditCard', esActivo: false },
    prestamo: { label: 'Préstamo', icono: 'FileText', esActivo: false },
};

/** Colores predefinidos para elegir en el formulario */
export const COLORES_PREDEFINIDOS: string[] = [
    '#6B7280', // gray
    '#EF4444', // red
    '#F97316', // orange
    '#EAB308', // yellow
    '#22C55E', // green
    '#14B8A6', // teal
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#0EA5E9', // sky
];
