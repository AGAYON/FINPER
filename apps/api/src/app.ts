import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './shared/error.handler';

// Routers
import { cuentasRouter } from './modules/cuentas/cuentas.router';
import { transaccionesRouter } from './modules/transacciones/transacciones.router';
import { categoriasRouter } from './modules/categorias/categorias.router';
import { presupuestosRouter } from './modules/presupuestos/presupuestos.router';
import { metasRouter } from './modules/metas/metas.router';
import { recurrentesRouter } from './modules/recurrentes/recurrentes.router';
import { dashboardRouter } from './modules/dashboard/dashboard.router';
import { syncRouter } from './modules/sync/sync.router';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rutas por módulo ──────────────────────────────────────────────────────────
app.use('/api/cuentas', cuentasRouter);
app.use('/api/transacciones', transaccionesRouter);
app.use('/api/categorias', categoriasRouter);
app.use('/api/presupuestos', presupuestosRouter);
app.use('/api/metas', metasRouter);
app.use('/api/recurrentes', recurrentesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/sync', syncRouter);

// ── Error handler global (debe ir al final) ───────────────────────────────────
app.use(errorHandler);

// ── Arrancar servidor ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 FINPER API corriendo en http://localhost:${PORT}`);
});

export default app;
