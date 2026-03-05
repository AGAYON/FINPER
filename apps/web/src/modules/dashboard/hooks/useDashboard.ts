import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../../shared/api/client';
import type { DashboardData } from '../dashboard.types';

const QUERY_KEY = ['dashboard'] as const;

export function useDashboard() {
    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => client.get<DashboardData>('/api/dashboard'),
    });

    const ejecutarMutation = useMutation({
        mutationFn: (id: string) =>
            client.post<unknown>(`/api/recurrentes/${id}/ejecutar`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['transacciones'] });
            queryClient.invalidateQueries({ queryKey: ['cuentas'] });
        },
    });

    return {
        data,
        isLoading,
        isError,
        ejecutarRecurrente: ejecutarMutation.mutateAsync,
        isEjecutando: ejecutarMutation.isPending,
        ejecutandoId: ejecutarMutation.variables,
    };
}
