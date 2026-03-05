import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Wallet,
    ArrowLeftRight,
    Tag,
    PiggyBank,
    Target,
    Repeat,
    CreditCard,
    X,
} from 'lucide-react';

const NAV_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
    { label: 'Cuentas', icon: Wallet, to: '/cuentas' },
    { label: 'Transacciones', icon: ArrowLeftRight, to: '/transacciones' },
    { label: 'Categorías', icon: Tag, to: '/categorias' },
    { label: 'Presupuestos', icon: PiggyBank, to: '/presupuestos' },
    { label: 'Metas', icon: Target, to: '/metas' },
    { label: 'Recurrentes', icon: Repeat, to: '/recurrentes' },
    { label: 'Instrumentos', icon: CreditCard, to: '/instrumentos' },
];

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 z-20 bg-black/40 transition-opacity duration-300 ${
                    open ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white shadow-xl transition-transform duration-300 ${
                    open ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
                    <span className="text-lg font-bold text-indigo-600">FINPER</span>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Cerrar menú"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto p-3">
                    <ul className="space-y-1">
                        {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
                            <li key={to}>
                                <NavLink
                                    to={to}
                                    end={to === '/'}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'bg-indigo-50 text-indigo-700'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`
                                    }
                                >
                                    <Icon size={18} />
                                    {label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
        </>
    );
}
