# FINPER — Estado del proyecto

> Última actualización: 2026-03-04
> Fase actual: Backend completo · Frontend solo módulo Cuentas

---

## Módulos

| Módulo | Backend | Frontend | Notas |
|---|---|---|---|
| **Cuentas** | ✅ completo | ✅ completo | CRUD, saldo calculado, resumen activos/pasivos/net worth, modal crear/editar, archivar |
| **Transacciones** | ✅ completo | ❌ placeholder | GET paginado con filtros, GET detalle, POST, PUT, DELETE |
| **Categorías** | ✅ completo | ✅ completo | GET agrupadas por tipo, POST, PUT, PATCH archivar. UI: lista por sección ingreso/gasto, grid de iconos, paleta de color, modal crear/editar |
| **Presupuestos** | ✅ completo | ❌ placeholder | GET con progreso calculado, resolución default/mes específico, POST, PUT |
| **Metas** | ✅ completo | ❌ placeholder | GET con proyección automática, POST, PUT, POST aportación (transacción DB) |
| **Recurrentes** | ✅ completo | ❌ placeholder | GET con próxima fecha calculada, POST, PUT, POST ejecutar (transacción DB) |
| **Dashboard** | ✅ completo | ❌ placeholder | Consolida net worth, mes actual, presupuestos, recurrentes pendientes, metas, snapshots. Genera snapshot diario. |
| **Sync offline** | ⚠️ parcial | — | Endpoint existe y valida body. TODO: la lógica de aplicar operaciones no está implementada — solo retorna `ok: true` sin ejecutar nada. |

---

## Decisiones tomadas

- **Sin autenticación activa**: `auth.middleware.ts` existe con JWT pero no está aplicado en ningún router. La API es completamente pública.
- **Rutas relativas en el frontend**: `client.ts` usa `BASE_URL = ''` para que el browser llame a `/api/...` relativo al servidor Vite, que lo proxea a `http://api:3001` dentro de Docker. Esto permite acceso correcto desde cualquier IP externa.
- **Proxy Vite**: `vite.config.ts` lee `process.env.VITE_API_URL` (no `import.meta.env`) para el target del proxy. El `.env` tiene `VITE_API_URL=http://api:3001` (nombre del servicio Docker).
- **`postcss.config.js` en CJS**: creado con `module.exports` para compatibilidad con el `package.json` sin `"type": "module"`.
- **Saldo calculado dinámicamente**: Nunca se guarda. Se calculan 5 queries de agregación por cuenta por request. Correcto según blueprint, pero no escalará bien con muchas transacciones.
- **Categorías archivar vía PATCH /:id/archivar**: Se añadió este endpoint al router (mismo patrón que Cuentas). El schema de PUT no incluye `activa`, así que no era posible archivar por esa vía sin extender el schema.
- **Icono de categoría almacenado como string**: El campo `icono` guarda el nombre del componente Lucide (ej. `"ShoppingCart"`). Se resuelve a componente en runtime con un mapa `Record<IconoCategoria, React.ComponentType>` definido en cada componente que lo necesita.
- **Botones "Crear ingreso / Crear gasto" separados**: En lugar de un botón genérico, la página tiene dos botones de acción para preseleccionar el tipo en el form, mejorando el flujo.

---

## Deuda técnica

1. **Auth no conectada**: `JWT_SECRET` en `.env` y middleware escrito, pero ningún router lo usa. Toda la API es abierta.
2. **Sync no funcional**: `POST /api/sync` valida el body pero aplica un `TODO` y no ejecuta las operaciones offline. El endpoint responde `ok: true` para todo.
3. **Saldo ineficiente**: N cuentas × 5 queries de agregación por request de listado. Sin caché ni índice específico.
4. **Iconos PWA ausentes**: `vite.config.ts` referencia `/icons/icon-192.png` y `/icons/icon-512.png` que no existen en `public/`. La PWA no es instalable correctamente.
5. **`cuentas.queries.ts` no existe**: El blueprint lo define como archivo separado, pero las queries están directamente en `cuentas.service.ts`.
6. **CORS de la API limitado**: Sin `CORS_ORIGIN` configurado en `.env` del API, CORS solo permite `http://localhost:5173`. Llamadas directas al puerto 3001 desde un browser externo serán rechazadas.

---

## Configuración del entorno

| Recurso | URL / valor |
|---|---|
| Frontend | `http://192.168.1.101:5173` |
| API | `http://192.168.1.101:3001` |
| Health check | `http://192.168.1.101:3001/health` |
| PostgreSQL | `postgresql://finper:finper_secret@localhost:5432/finper_dev` |

**Variables de entorno relevantes:**

- `apps/api/.env`: `DATABASE_URL`, `JWT_SECRET`, `PORT=3001`, `CORS_ORIGIN` (no seteada = `localhost:5173`)
- `apps/web/.env`: `VITE_API_URL=http://api:3001` (solo para el proxy Vite, no para el cliente)

**Comandos útiles:**

```bash
docker compose up -d                          # levantar todo
docker compose restart web                    # reiniciar solo frontend (hot)
docker compose up -d --build web              # rebuild completo del frontend
docker compose exec api npm run db:migrate    # aplicar migraciones Prisma
docker compose exec api npm run db:studio     # abrir Prisma Studio
docker compose logs web --tail=50             # logs del frontend
docker compose logs api --tail=50             # logs del API
curl localhost:3001/health                    # verificar API
curl localhost:5173/api/cuentas               # verificar proxy Vite → API
```

---

## Próximo paso

**Implementar frontend del módulo Transacciones** (el módulo central del sistema):

Archivos a crear:
- `transacciones.types.ts` — TipoTransaccion, Transaccion, TransaccionCreateInput, filtros
- `hooks/useTransacciones.ts` — useQuery con filtros, mutations POST/PUT/DELETE
- `components/TransaccionForm.tsx` — form complejo: monto, tipo, cuenta, categoría, fecha, descripción
- `components/TransaccionItem.tsx` — fila de lista con tipo/monto/cuenta/categoría
- `components/FiltroBarra.tsx` — filtros por fecha, tipo, cuenta, categoría
- `pages/TransaccionesPage.tsx` — lista paginada + filtros + modal

Notas clave para Transacciones:
- El form necesita cuentas (`useCuentas`) y categorías (`useCategorias`) para sus selects
- Categorías filtradas por tipo de transacción (solo gastos para gastos, solo ingresos para ingresos)
- Transferencias no tienen categoría; necesitan cuenta origen Y destino
- ID generado por el cliente (UUID) para soporte offline futuro
