# FINPER — Estado del proyecto

> Última actualización: 2026-03-07 (rev 6)
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
| **Dashboard** | ✅ completo | ✅ completo | Consolida net worth, mes actual, presupuestos, recurrentes pendientes, metas, snapshots. Genera snapshot diario. Incluye resumen reportes (donut gastos + ratio 6 meses) y card "Ver reportes completos". |
| **Reportes** | ✅ completo | ✅ completo | GET /api/reportes?desde=&hasta= con totales_mensuales, gastos_por_categoria, ingresos_por_categoria. UI: DonutCategoria, RatioHistorico, ComparativoCategorias, TendenciaCategorias. Selector 3/6/12 meses. Ruta /reportes, link en Sidebar. |
| **Sync offline** | ⚠️ parcial | — | Endpoint existe y valida body. TODO: la lógica de aplicar operaciones no está implementada — solo retorna `ok: true` sin ejecutar nada. |
| **Instrumentos** | ✅ completo | ✅ completo | Créditos (tasa fija) e inversiones (tasa variable). Listado por tipo, InstrumentoCard con barra de progreso, detalle con tabla de amortización, PagoForm/AjusteVariableForm/InstrumentoEditForm en modal, archivar con confirmación. Botón editar en card y detalle. Integrado en dashboard. Pagos históricos: POST /:id/pagos-historicos registra N pagos retroactivos en bloque. |

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
- **Instrumentos frontend**: Sin componente CurrencyDisplay en shared; se usa `formatCurrency` de `shared/utils/currency` en todo el módulo (igual que Cuentas). Modales con overlay + div centrado (patrón de CuentasPage).
- **Reportes**: Backend con Prisma `$queryRaw` y `GROUP BY categoria_id, DATE_TRUNC('month', fecha)` sobre `transacciones`; solo cuentas origen activas. Respuesta única con totales_mensuales (ratio = ingresos/gastos), gastos_por_categoria e ingresos_por_categoria. Frontend queryKey `['reportes', { desde, hasta }]`. Donuts usan `categoria_color` (hex). Dashboard usa `useReportes(6)` para mini donut gastos y mini bar ratio; no bloquea si falla.

---

## Deuda técnica

1. **Auth no conectada**: `JWT_SECRET` en `.env` y middleware escrito, pero ningún router lo usa. Toda la API es abierta.
2. **Sync no funcional**: `POST /api/sync` valida el body pero aplica un `TODO` y no ejecuta las operaciones offline. El endpoint responde `ok: true` para todo.
3. **Saldo ineficiente**: N cuentas × 5 queries de agregación por request de listado. Sin caché ni índice específico.
4. **Iconos PWA ausentes**: `vite.config.ts` referencia `/icons/icon-192.png` y `/icons/icon-512.png` que no existen en `public/`. La PWA no es instalable correctamente.
5. **`cuentas.queries.ts` no existe**: El blueprint lo define como archivo separado, pero las queries están directamente en `cuentas.service.ts`.
6. **CORS de la API limitado**: Sin `CORS_ORIGIN` configurado en `.env` del API, CORS solo permite `http://localhost:5173`. Llamadas directas al puerto 3001 desde un browser externo serán rechazadas.
7. **Migración de instrumentos no generada por Prisma**: `schema.prisma` incluye enums/modelos `Instrumento` y `MovimientoInstrumento`, pero la carpeta de migraciones no pudo ser escrita desde el agente. Hay que ejecutar `npm run db:migrate` (o `prisma migrate dev`) para generar y aplicar la migración real.
8. **Ajustes positivos de inversiones no impactan cuentas**: El endpoint `POST /api/instrumentos/:id/ajuste` registra movimientos de instrumento para igualar el valor real, pero actualmente no crea transacciones en `transacciones` para no romper la lógica de saldos de cuentas. Los rendimientos capitalizados solo se reflejan en el módulo de instrumentos/dashboard, no en el saldo de la cuenta asociada.
9. **Página de detalle resuelve instrumento del listado en memoria**: `InstrumentoDetallePage` busca el instrumento por id en el array `instrumentos` del hook. Si el usuario recarga directamente `/instrumentos/:id`, funciona solo si la query ya tiene datos en caché. Solución futura: `GET /api/instrumentos/:id` en backend.

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

## Convenciones instrumentos ✅ (frontend completo)
- Tipos en `instrumentos.types.ts` alineados al backend (camelCase: cuentaId, saldoInsoluto, proximoPago, etc.).
- Hook `useInstrumentos()` con queryKey `['instrumentos']`; incluye `editarInstrumento` (PUT /:id). `useRegistrarPago(id)`, `useRegistrarAjuste(id)`, `useRegistrarPagosHistoricos(id)` invalidan `['instrumentos']` al completar.
- InstrumentoCard: crédito tasa fija → barra de progreso semáforo (verde <50%, amarillo 50–80%, azul >80%); inversión → saldo actual + rendimiento acumulado en verde. Click en card navega a `/instrumentos/:id`; botones secundarios abren PagoForm/AjusteVariableForm en modal sin navegar. Botón lápiz (Pencil) abre InstrumentoEditForm.
- InstrumentoDetallePage: instrumento obtenido del listado por id (no hay GET :id en backend). Tabla de amortización con filas pagadas en gris (text-gray-500), periodo actual en índigo (bg-indigo-50 text-gray-900), resto text-gray-900 explícito. Botón "Registrar pagos históricos" visible solo si porcentajePagado === 0.
- **Bug corregido (2026-03-05 rev3)**: Filas de tabla de amortización sin color explícito → texto blanco sobre fondo blanco. Fix: rowCls ahora incluye text-gray-900 para filas normales y actuales.
- Tasa anual en InstrumentoForm/InstrumentoEditForm: usuario ingresa % (ej. 24.5), se envía al backend como decimal (0.245).
- **Edición completa (2026-03-05 rev3)**: PUT /:id acepta nombre, notas, tasaAnual (para cualquier subtipo), capitalInicial, plazoMeses. Restricción tasaAnual solo para tasa_variable eliminada. InstrumentoEditForm.tsx muestra todos los campos; plazoMeses solo si tasa_fija.
- **Pagos históricos (2026-03-05 rev3)**: POST /:id/pagos-historicos registra N pagos en bloque. Valida: tipo credito+tasa_fija, sin movimientos previos, numeroPagos <= plazo total. Crea movimientoInstrumento + transacciones contables (transferencia capital + gasto intereses) en una $transaction. Frontend: PagosHistoricosForm.tsx con preview en tiempo real (periodo resultante, saldo insoluto, capital, intereses).
- `InstrumentoListado` incluye `tasaAnual`, `capitalInicial`, `plazoMeses` para pre-poblar forms de edición/históricos.
- **Bug crítico corregido (2026-03-05 rev4 — FLISING)**: `listarInstrumentos` ramificaba SOLO por subtipo, ignorando `tipo`. Fix: rama ahora es `tipo === 'credito' && subtipo === 'tasa_fija'` para amortización.
- **Tabla de capitalización (rev4)**: inversión tasa_fija → `calcularTablaCapitalizacion` (saldo crece). Crédito tasa_fija → `calcularTablaAmortizacion` (saldo baja). `obtenerTabla` despacha según `tipo`.
- **Fix UX (rev4)**: botón "Registrar ajuste" solo visible para `subtipo === 'tasa_variable'`.
- **Saldo inversión tasa_fija con interés compuesto (rev5)**: inversión tasa_fija mostraba capitalInicial como saldo porque usaba `calcularSaldoVariable` (suma movimientos, ignora tiempo). Fix: nuevo método `calcularSaldoTasaFijaInversion` con fórmula:
  - `periodosTranscurridos = floor((hoy - fechaInicio) / periodicidadDias)`
  - `saldoCompuesto = capitalInicial × (1 + tasaPeriodo)^periodosTranscurridos`
  - `saldoActual = saldoCompuesto + aportaciones - rescates + ajustesManuales`
  - `rendimientoAcumulado = saldoActual - capitalInicial`
  - Aplicado en `listarInstrumentos` (service) y en el bloque inversiones de `dashboard.router.ts`.
- **Bug corregido anterior**: `calcularSaldoVariable` usaba `cuenta.saldoInicial` en vez de `instrumento.capitalInicial`. Fix en `instrumentos.service.ts` y `dashboard.router.ts`.
- **Decisión de diseño**: al crear instrumento de inversión con capitalInicial > 0, se crea automáticamente una transacción de tipo `ingreso` en la cuenta asociada con la categoría "Capital inicial" (auto-creada).
- **Deuda técnica (rev4)**: si una inversión tasa_fija fue creada antes de que existiera el flujo correcto y no tiene transacción "Capital inicial" en la cuenta, el saldo de la cuenta no reflejará la inversión. Solución manual: INSERT en `transacciones` con tipo='ingreso', cuenta_origen_id=cuenta_del_instrumento, monto=capital_inicial, descripcion='Capital inicial {nombre}', categoria_id=(id de categoría 'Capital inicial').
