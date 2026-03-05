import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../../shared/api/client';
import type { Recurrente, RecurrenteCreateInput, RecurrenteUpdateInput } from '../recurrentes.types';
import type { Transaccion } from '../../transacciones/transacciones.types';

const API_BASE = '/api/recurrentes';
const QUERY_KEY = ['recurrentes'] as const;

export function useRecurrentes() {
    const queryClient = useQueryClient();

    const {
        data: recurrentes = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => client.get<Recurrente[]>(API_BASE),
    });

    const crearMutation = useMutation({
        mutationFn: (data: RecurrenteCreateInput) =>
            client.post<Recurrente>(API_BASE, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });

    const actualizarMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: RecurrenteUpdateInput }) =>
            client.put<Recurrente>(`${API_BASE}/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });

    const ejecutarMutation = useMutation({
        mutationFn: (id: string) =>
            client.post<Transaccion>(`${API_BASE}/${id}/ejecutar`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['transacciones'] });
            queryClient.invalidateQueries({ queryKey: ['cuentas'] });
        },
    });

    return {
        recurrentes,
        isLoading,
        isError,
        crearRecurrente: crearMutation.mutateAsync,
        actualizarRecurrente: actualizarMutation.mutateAsync,
        ejecutarRecurrente: ejecutarMutation.mutateAsync,
        isCreating: crearMutation.isPending,
        isUpdating: actualizarMutation.isPending,
        isEjecutando: ejecutarMutation.isPending,
        ejecutandoId: ejecutarMutation.variables,
    };
}
