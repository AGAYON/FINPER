/** Formatea un número como moneda MXN */
export function formatCurrency(amount: number, currency = 'MXN'): string {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/** Formatea un número como moneda compacta (ej. $12.5K) */
export function formatCurrencyCompact(amount: number): string {
    if (Math.abs(amount) >= 1_000_000)
        return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (Math.abs(amount) >= 1_000)
        return `$${(amount / 1_000).toFixed(1)}K`;
    return formatCurrency(amount);
}
