import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../../shared/api/client';
import type {
    Presupuesto,
    PresupuestoCreateInput,
    PresupuestoUpdateInput,
} from '../presupuestos.types';

const API_BASE = '/api/presupuestos';

function fetchPresupuestos(mes?: string): Promise<Presupuesto[]> {
    return client.get<Presupuesto[]>(API_BASE, mes ? { mes } : undefined);
}

export function usePresupuestos(mes?: string) {
    const queryClient = useQueryClient();

    const {
        data: presupuestos = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['presupuestos', mes ?? null],
        queryFn: () => fetchPresupuestos(mes),
    });

    const crearMutation = useMutation({
        mutationFn: (data: PresupuestoCreateInput) =>
            client.post<Presupuesto>(API_BASE, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['presupuestos'] });
        },
    });

    const actualizarMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: PresupuestoUpdateInput }) =>
            client.put<Presupuesto>(`${API_BASE}/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['presupuestos'] });
        },
    });

    const eliminarMutation = useMutation({
        mutationFn: (id: string) =>
            client.delete<void>(`${API_BASE}/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['presupuestos'] });
        },
    });

    return {
        presupuestos,
        isLoading,
        isError,
        crearPresupuesto: crearMutation.mutateAsync,
        actualizarPresupuesto: actualizarMutation.mutateAsync,
        eliminarPresupuesto: eliminarMutation.mutateAsync,
        isCreating: crearMutation.isPending,
        isUpdating: actualizarMutation.isPending,
        isDeleting: eliminarMutation.isPending,
    };
}
