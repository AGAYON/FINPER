/** Formatea una fecha Date o string a formato legible en español */
export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...opts,
    }).format(d);
}

/** Retorna "2025-03" para el mes actual */
export function getMesActual(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

/** Convierte "2025-03" a un Date del primer día del mes */
export function mesAFecha(mes: string): Date {
    const [year, month] = mes.split('-').map(Number);
    return new Date(year, month - 1, 1);
}
