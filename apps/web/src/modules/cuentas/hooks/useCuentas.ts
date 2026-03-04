import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../../shared/api/client';
import type { Cuenta, CuentaCreateInput, CuentaUpdateInput } from '../cuentas.types';

const API_BASE = '/api/cuentas';
const QUERY_KEY = ['cuentas'] as const;

function fetchCuentas(): Promise<Cuenta[]> {
    return client.get<Cuenta[]>(API_BASE);
}

/** Activos: incluirEnTotal=true y tipo NO es credito ni prestamo */
function esActivo(c: Cuenta): boolean {
    return c.incluirEnTotal && c.tipo !== 'credito' && c.tipo !== 'prestamo';
}

/** Pasivos: incluirEnTotal=true y tipo es credito o prestamo */
function esPasivo(c: Cuenta): boolean {
    return c.incluirEnTotal && (c.tipo === 'credito' || c.tipo === 'prestamo');
}

export function useCuentas() {
    const queryClient = useQueryClient();

    const {
        data: cuentas = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: fetchCuentas,
    });

    const totalActivos = cuentas.filter(esActivo).reduce((sum, c) => sum + c.saldoActual, 0);
    const totalPasivos = cuentas.filter(esPasivo).reduce((sum, c) => sum + Math.abs(c.saldoActual), 0);
    const netWorth = totalActivos - totalPasivos;

    const crearMutation = useMutation({
        mutationFn: (data: CuentaCreateInput) =>
            client.post<Cuenta>(API_BASE, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });

    const actualizarMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: CuentaUpdateInput }) =>
            client.put<Cuenta>(`${API_BASE}/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });

    const archivarMutation = useMutation({
        mutationFn: (id: string) =>
            client.patch<void>(`${API_BASE}/${id}/archivar`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });

    return {
        cuentas,
        totalActivos,
        totalPasivos,
        netWorth,
        isLoading,
        isError,
        crearCuenta: crearMutation.mutateAsync,
        actualizarCuenta: actualizarMutation.mutateAsync,
        archivarCuenta: archivarMutation.mutateAsync,
        isCreating: crearMutation.isPending,
        isUpdating: actualizarMutation.isPending,
        isArchiving: archivarMutation.isPending,
    };
}
