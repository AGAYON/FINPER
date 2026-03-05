import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
    '/': 'Dashboard',
    '/cuentas': 'Cuentas',
    '/transacciones': 'Transacciones',
    '/categorias': 'Categorías',
    '/presupuestos': 'Presupuestos',
    '/metas': 'Metas',
    '/recurrentes': 'Recurrentes',
};

interface TopBarProps {
    onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
    const { pathname } = useLocation();
    const title = PAGE_TITLES[pathname] ?? 'FINPER';

    return (
        <header className="fixed inset-x-0 top-0 z-10 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 shadow-sm">
            <button
                onClick={onMenuClick}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Abrir menú"
            >
                <Menu size={22} />
            </button>
            <span className="text-base font-semibold text-gray-900">{title}</span>
        </header>
    );
}
