import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { client } from '../../../shared/api/client';
import type {
    Transaccion,
    TransaccionCreateInput,
    TransaccionUpdateInput,
    TransaccionesResponse,
    TransaccionFiltros,
} from '../transacciones.types';
import { FILTROS_DEFAULT } from '../transacciones.types';

const API_BASE = '/api/transacciones';

function fetchTransacciones(filtros: TransaccionFiltros): Promise<TransaccionesResponse> {
    const params: Record<string, string | number | undefined> = {
        page: filtros.page,
        pageSize: filtros.pageSize,
        desde: filtros.desde,
        hasta: filtros.hasta,
        cuenta: filtros.cuenta,
        categoria: filtros.categoria,
        tipo: filtros.tipo,
    };
    return client.get<TransaccionesResponse>(API_BASE, params);
}

export function useTransacciones(filtros: TransaccionFiltros = FILTROS_DEFAULT) {
    const queryClient = useQueryClient();

    const QUERY_KEY = ['transacciones', filtros] as const;

    const {
        data,
        isLoading,
        isError,
    } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => fetchTransacciones(filtros),
    });

    const response: TransaccionesResponse = data ?? {
        total: 0,
        page: filtros.page,
        pageSize: filtros.pageSize,
        items: [],
    };

    const invalidar = () => {
        // Invalida todas las variantes de la query para reflejar cambios en saldos
        queryClient.invalidateQueries({ queryKey: ['transacciones'] });
        queryClient.invalidateQueries({ queryKey: ['cuentas'] });
    };

    const crearMutation = useMutation({
        mutationFn: (data: TransaccionCreateInput) =>
            client.post<Transaccion>(API_BASE, { id: uuidv4(), ...data }),
        onSuccess: invalidar,
    });

    const actualizarMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: TransaccionUpdateInput }) =>
            client.put<Transaccion>(`${API_BASE}/${id}`, data),
        onSuccess: invalidar,
    });

    const eliminarMutation = useMutation({
        mutationFn: (id: string) =>
            client.delete<void>(`${API_BASE}/${id}`),
        onSuccess: invalidar,
    });

    return {
        transacciones: response.items,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPaginas: Math.ceil(response.total / response.pageSize),
        isLoading,
        isError,
        crearTransaccion: crearMutation.mutateAsync,
        actualizarTransaccion: actualizarMutation.mutateAsync,
        eliminarTransaccion: eliminarMutation.mutateAsync,
        isCreating: crearMutation.isPending,
        isUpdating: actualizarMutation.isPending,
        isDeleting: eliminarMutation.isPending,
    };
}
