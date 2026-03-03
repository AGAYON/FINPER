const BASE_URL = import.meta.env.VITE_API_URL ?? '';

interface RequestOptions extends RequestInit {
    params?: Record<string, string | number | undefined>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...init } = options;

    // Construir URL con query params
    const url = new URL(BASE_URL + path, window.location.origin);
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined) url.searchParams.set(k, String(v));
        }
    }

    const token = localStorage.getItem('finper_token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
    };

    const res = await fetch(url.toString(), { ...init, headers });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(error.error ?? 'Error de red');
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

export const client = {
    get: <T>(path: string, params?: Record<string, string | number | undefined>) =>
        request<T>(path, { method: 'GET', params }),
    post: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
    patch: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: <T>(path: string) =>
        request<T>(path, { method: 'DELETE' }),
};
