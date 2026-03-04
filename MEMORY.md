# FINPER — Estado del proyecto

> Última actualización: 2026-03-04
> Fase actual: Backend completo · Frontend solo módulo Cuentas

---

## Módulos

| Módulo | Backend | Frontend | Notas |
|---|---|---|---|
| **Cuentas** | ✅ completo | ✅ completo | CRUD, saldo calculado, resumen activos/pasivos/net worth, modal crear/editar, archivar |
| **Transacciones** | ✅ completo | ❌ placeholder | GET paginado con filtros, GET detalle, POST, PUT, DELETE |
| **Categorías** | ✅ completo | ❌ placeholder | GET agrupadas por tipo, POST, PUT |
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

**Implementar frontend del módulo Categorías** (prerequisito para el form de Transacciones):
- `CategoriasPage.tsx`: lista agrupada ingreso/gasto, botón crear, editar inline
- Hook `useCategorias.ts` con TanStack Query (similar a `useCuentas.ts`)
- Sin componentes complejos: solo lista + form simple (nombre, tipo, color, icono)

Luego **Transacciones** (módulo central — sin él no hay datos reales que mostrar).
