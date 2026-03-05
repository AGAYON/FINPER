import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../../shared/api/client';
import type {
    InstrumentoListado,
    InstrumentoCreateInput,
    InstrumentoUpdateInput,
    PeriodoAmortizacion,
    PagoInput,
    AjusteVariableInput,
    PagosHistoricosInput,
    PagosHistoricosSummary,
} from '../instrumentos.types';

const API_BASE = '/api/instrumentos';
const QUERY_KEY = ['instrumentos'] as const;

function fetchInstrumentos(): Promise<InstrumentoListado[]> {
    return client.get<InstrumentoListado[]>(API_BASE);
}

function fetchInstrumentoTabla(id: string, desdePeriodo?: number): Promise<PeriodoAmortizacion[]> {
    const params =
        desdePeriodo != null ? { desde_periodo: desdePeriodo } : undefined;
    return client.get<PeriodoAmortizacion[]>(`${API_BASE}/${id}/tabla`, params);
}

export function useInstrumentos() {
    const queryClient = useQueryClient();

    const {
        data: instrumentos = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: fetchInstrumentos,
    });

    const crearMutation = useMutation({
        mutationFn: (data: InstrumentoCreateInput) =>
            client.post<InstrumentoListado>(API_BASE, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });

    const editarMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: InstrumentoUpdateInput }) =>
            client.put<InstrumentoListado>(`${API_BASE}/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });

    return {
        instrumentos,
        isLoading,
        isError,
        crearInstrumento: crearMutation.mutateAsync,
        isCreating: crearMutation.isPending,
        editarInstrumento: editarMutation.mutateAsync,
        isEditing: editarMutation.isPending,
    };
}

export function useInstrumentoTabla(id: string | null, desdePeriodo?: number) {
    return useQuery({
        queryKey: [...QUERY_KEY, id ?? '', 'tabla', desdePeriodo],
        queryFn: () => fetchInstrumentoTabla(id!, desdePeriodo),
        enabled: Boolean(id),
    });
}

export function useRegistrarPago(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: PagoInput) =>
            client.post<unknown>(`${API_BASE}/${id}/pago`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });
}

export function useRegistrarAjuste(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: AjusteVariableInput) =>
            client.post<unknown>(`${API_BASE}/${id}/ajuste`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });
}

export function useArchivarInstrumento() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => client.patch<void>(`${API_BASE}/${id}/archivar`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });
}

export function useRegistrarPagosHistoricos(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: PagosHistoricosInput) =>
            client.post<PagosHistoricosSummary>(`${API_BASE}/${id}/pagos-historicos`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });
}
