import { useQuery } from '@tanstack/react-query';
import { client } from '../../../shared/api/client';
import type { ReportesData } from '../reportes.types';

function getRangoParams(meses: 3 | 6 | 12): { desde: string; hasta: string } {
    const hoy = new Date();
    const hasta = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    const desdeDate = new Date(hoy.getFullYear(), hoy.getMonth() - meses + 1, 1);
    const desde = `${desdeDate.getFullYear()}-${String(desdeDate.getMonth() + 1).padStart(2, '0')}`;
    return { desde, hasta };
}

export function useReportes(meses: 3 | 6 | 12) {
    const { desde, hasta } = getRangoParams(meses);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['reportes', { desde, hasta }],
        queryFn: () =>
            client.get<ReportesData>('/api/reportes', { desde, hasta }),
    });

    return {
        data,
        isLoading,
        isError,
        params: { desde, hasta },
        mesMasReciente: hasta,
    };
}
