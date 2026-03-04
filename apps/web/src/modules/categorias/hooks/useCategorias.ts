import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../../shared/api/client';
import type {
    Categoria,
    CategoriaCreateInput,
    CategoriaUpdateInput,
    CategoriasAgrupadas,
} from '../categorias.types';

const API_BASE = '/api/categorias';
const QUERY_KEY = ['categorias'] as const;

function fetchCategorias(): Promise<CategoriasAgrupadas> {
    return client.get<CategoriasAgrupadas>(API_BASE);
}

export function useCategorias() {
    const queryClient = useQueryClient();

    const {
        data,
        isLoading,
        isError,
    } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: fetchCategorias,
    });

    const categorias: CategoriasAgrupadas = data ?? { ingreso: [], gasto: [] };

    const crearMutation = useMutation({
        mutationFn: (payload: CategoriaCreateInput) =>
            client.post<Categoria>(API_BASE, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });

    const actualizarMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: CategoriaUpdateInput }) =>
            client.put<Categoria>(`${API_BASE}/${id}`, data),
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
        categorias,
        isLoading,
        isError,
        crearCategoria: crearMutation.mutateAsync,
        actualizarCategoria: actualizarMutation.mutateAsync,
        archivarCategoria: archivarMutation.mutateAsync,
        isCreating: crearMutation.isPending,
        isUpdating: actualizarMutation.isPending,
        isArchiving: archivarMutation.isPending,
    };
}
