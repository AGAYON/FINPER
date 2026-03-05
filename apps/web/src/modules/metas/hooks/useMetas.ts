import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../../shared/api/client';
import type { Meta, MetaCreateInput, MetaUpdateInput, AportacionInput } from '../metas.types';

const API_BASE = '/api/metas';
const QUERY_KEY = ['metas'] as const;

export function useMetas() {
    const queryClient = useQueryClient();

    const {
        data: metas = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => client.get<Meta[]>(API_BASE),
    });

    const crearMutation = useMutation({
        mutationFn: (data: MetaCreateInput) =>
            client.post<Meta>(API_BASE, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });

    const actualizarMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: MetaUpdateInput }) =>
            client.put<Meta>(`${API_BASE}/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });

    const aportarMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: AportacionInput }) =>
            client.post<Meta>(`${API_BASE}/${id}/aportacion`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });

    return {
        metas,
        isLoading,
        isError,
        crearMeta: crearMutation.mutateAsync,
        actualizarMeta: actualizarMutation.mutateAsync,
        aportar: aportarMutation.mutateAsync,
        isCreating: crearMutation.isPending,
        isUpdating: actualizarMutation.isPending,
        isAportando: aportarMutation.isPending,
    };
}
