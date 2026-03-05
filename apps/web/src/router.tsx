import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './shared/components/Layout';
import { DashboardPage } from './modules/dashboard/pages/DashboardPage';
import { CuentasPage } from './modules/cuentas/pages/CuentasPage';
import { TransaccionesPage } from './modules/transacciones/pages/TransaccionesPage';
import { CategoriasPage } from './modules/categorias/pages/CategoriasPage';
import { PresupuestosPage } from './modules/presupuestos/pages/PresupuestosPage';
import { MetasPage } from './modules/metas/pages/MetasPage';
import { RecurrentesPage } from './modules/recurrentes/pages/RecurrentesPage';

export const router = createBrowserRouter([
    {
        element: <Layout />,
        children: [
            { path: '/', element: <DashboardPage /> },
            { path: '/cuentas', element: <CuentasPage /> },
            { path: '/transacciones', element: <TransaccionesPage /> },
            { path: '/categorias', element: <CategoriasPage /> },
            { path: '/presupuestos', element: <PresupuestosPage /> },
            { path: '/metas', element: <MetasPage /> },
            { path: '/recurrentes', element: <RecurrentesPage /> },
        ],
    },
]);
