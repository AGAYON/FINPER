# FINPER — Estado del proyecto

> Última actualización: 2026-03-05
> Fase actual: **Frontend completo** — todos los módulos implementados ✅

---

## Módulos

| Módulo | Backend | Frontend | Notas |
|---|---|---|---|
| **Cuentas** | ✅ completo | ✅ completo | CRUD, saldo calculado, resumen activos/pasivos/net worth, modal crear/editar, archivar |
| **Transacciones** | ✅ completo | ✅ completo | GET paginado con filtros, GET detalle, POST, PUT, DELETE. UI: lista paginada, FiltroBarra, TransaccionForm (3 tipos), FAB "+", editar/eliminar con confirmación |
| **Categorías** | ✅ completo | ✅ completo | GET agrupadas por tipo, POST, PUT, PATCH archivar. UI: lista por sección ingreso/gasto, grid de iconos, paleta de color, modal crear/editar |
| **Presupuestos** | ✅ completo | ✅ completo | GET con progreso calculado, resolución default/mes específico, POST, PUT, DELETE. UI: navegación por mes, PresupuestoBarra con semáforo, edición inline de límite, eliminar con confirmación, FAB + modal crear |
| **Metas** | ✅ completo | ✅ completo | GET con proyección automática, POST, PUT, POST aportación (transacción DB). UI: MetaCard con barra de progreso, proyección en_camino, botón Aportar, editar, separación activas/finalizadas colapsable |
| **Recurrentes** | ✅ completo | ✅ completo | GET con próxima fecha calculada, POST, PUT, POST ejecutar (transacción DB). UI: lista activos/inactivos colapsables, badge pendiente, botón Ejecutar con feedback de éxito, toggle activo/inactivo, modal crear/editar |
| **Dashboard** | ✅ completo | ✅ completo | Consolida net worth, mes actual, presupuestos, recurrentes pendientes, metas, snapshots. Genera snapshot diario. |
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
- **`monto` de Prisma llega como string**: El campo NUMERIC(15,2) de Prisma serializa a JSON como string `"350"`. El frontend usa `Number(t.monto)` al mostrar. Tipado como `number` para alinearse con la intención, con conversión en runtime.
- **UUID generado en el hook, no en el form**: `crearMutation` inyecta `{ id: uuidv4(), ...data }` antes de enviarlo. El form no conoce el UUID; esto facilita el soporte offline futuro.
- **`cuentaOrigenId` para ingresos = cuenta receptora**: El campo se llama "origen" en la DB pero para ingresos semanticamente es la cuenta que recibe el dinero. La UI lo etiqueta simplemente como "Cuenta" para evitar confusión.
- **Filtros invalidan la query completa de transacciones**: `filtros` es parte del queryKey (`['transacciones', filtros]`), por lo que cada cambio de filtro dispara un nuevo fetch. Los saldos de cuentas también se invalidan al mutar.
- **FAB con 3 botones separados**: Ingreso (verde), Gasto (rojo), Transferencia (índigo) — preseleccionan el tipo y ocultan el selector de tipo en el form cuando se crea.
- **Presupuestos usan hard delete**: `DELETE /api/presupuestos/:id` → 204, sin soft delete. A diferencia de Cuentas y Categorías que usan archivar vía `PATCH /:id/archivar`.
- **Edición de límite inline en PresupuestoBarra**: sin modal separado — input + botones Guardar/Cancelar aparecen en la misma tarjeta. Eliminar sigue el patrón de confirmación de dos clics de TransaccionItem.
- **Badge "Default" en presupuestos**: los presupuestos con `mes=null` muestran badge índigo "Default" para distinguirlos visualmente de los específicos del mes.

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

## Próximos pasos

Opciones en orden de prioridad:
1. **Conectar autenticación JWT** (deuda técnica #1): aplicar `auth.middleware.ts` en todos los routers y hacer que el frontend maneje login/logout con el token.
2. **Implementar sync offline** (deuda técnica #2): el endpoint `POST /api/sync` existe pero no aplica las operaciones — implementar la lógica en el backend y conectar el `offlineQueue` del frontend.

## Convenciones recurrentes ✅ (frontend completo)
- monto llega de Prisma como string → convertir con Number()
- Backend GET modificado: ya no filtra solo activos — retorna todos ordenados por [activo desc, diaDelMes asc]
- Inactivos no incluyen proximaFecha/pendiente — backend los setea a null/false
- Pendiente = true si no hay ultimaEjecucion o si se ejecutó en mes anterior
- Badge ámbar "Pendiente este mes" en items activos con pendiente=true
- Toggle activo/inactivo vía PUT /:id con { activo: bool } — invalida query recurrentes
- Ejecutar vía POST /:id/ejecutar — invalida recurrentes, transacciones Y cuentas (saldo cambia)
- Feedback de éxito inline en RecurrenteItem con auto-reset a 3s (no toast global)
- Categoría filtrada por tipo en el form — reset al cambiar tipo
- queryKey: ['recurrentes'] — invalida todo en mutaciones

## Convenciones metas ✅ (frontend completo)
- monto_objetivo y monto_actual llegan de Prisma como string → convertir con Number()
- Proyección calculada por el backend: campos `porcentaje`, `dias_restantes`, `fecha_proyectada`, `en_camino`
- fecha_limite es opcional — si no existe no mostrar días restantes
- metas activas (en_progreso) en la lista principal; finalizadas (completada/cancelada) en sección colapsable con opacidad reducida
- No se puede aportar a meta no activa (botón Aportar solo visible en en_progreso)
- Modal unificado: discriminado por tipo de estado (`crear` | `editar` | `aportar` | `ninguno`)
- AportacionForm: monto, nota (opcional), fecha (default hoy)
- MetaForm: nombre, descripcion, monto_objetivo, fecha_limite (opcional), cuenta_id (opcional), color (paleta COLORES_META)
- COLORES_META definido en metas.types.ts (10 colores)
- queryKey: `['metas']` — invalida todo en mutaciones
