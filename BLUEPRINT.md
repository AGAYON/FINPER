# Blueprint: Sistema de Finanzas Personales
> Documento de diseño completo — usar como referencia de arquitectura y como prompt de contexto para Claude

---

## Resumen ejecutivo

App web personal para control financiero completo. Entrada de datos 100% manual. Desplegada en servidor propio. Funciona offline y sincroniza cuando el servidor vuelve.

**Stack:** React + Vite (PWA) · Node.js + Express · PostgreSQL · Prisma · Docker Compose

---

## El modelo mental del sistema

Un sistema financiero personal responde tres preguntas:

- **¿Dónde estoy?** → Saldos, deudas, patrimonio neto
- **¿A dónde va mi dinero?** → Flujos: ingresos, gastos, transferencias
- **¿A dónde quiero llegar?** → Metas, presupuestos, proyecciones

Todo feature del sistema sirve a una de estas tres preguntas. Si no responde ninguna, no pertenece al sistema.

---

## Módulos del sistema

| Módulo | Propósito |
|--------|-----------|
| Cuentas | Contenedores de dinero (banco, efectivo, inversión, deuda) |
| Transacciones | Registro de cada movimiento de dinero |
| Categorías | Clasificación de ingresos y gastos |
| Presupuestos | Límites de gasto por categoría y mes |
| Metas de ahorro | Destinos financieros con proyección de llegada |
| Recurrentes | Plantillas de transacciones periódicas |
| Instrumentos | Créditos e inversiones con estructura financiera, asociados a cuentas existentes |
| Net Worth | Patrimonio neto calculado automáticamente |
| Dashboard | Vista de síntesis del estado financiero completo |

---

## Arquitectura del sistema

```
FRONTEND (PWA)                      BACKEND (API)               BASE DE DATOS
──────────────────                  ──────────────              ─────────────
React + Vite                        Node.js + Express           PostgreSQL
Zustand (estado)    ←─ HTTPS/REST ─→ Rutas por módulo
Dexie.js (IndexedDB)                Lógica de negocio
Service Worker                      Prisma ORM
(modo offline)
```

**Flujo offline:** transacción capturada sin conexión → guardada en IndexedDB (cola offline) → sincronizada con servidor al reconectar. Estrategia de conflictos: last-write-wins por timestamp.

---

## Modelo de datos

### Principios globales
- Primary keys: **UUID** (el cliente genera el ID antes de llegar al servidor, necesario para offline)
- Dinero: **NUMERIC(15,2)** — nunca FLOAT
- Saldos de cuentas: **nunca se guardan**, siempre se calculan desde transacciones
- Cuentas y categorías: **soft delete** (campo `activa`) — nunca borrar físicamente
- Transacciones: sí se pueden borrar — la eliminación tiene significado financiero
- `updated_at` en todas las tablas — base de la sincronización offline

---

### Entidad: Categorías

```sql
CREATE TABLE categorias (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     VARCHAR(60) NOT NULL,
  tipo       VARCHAR(10) NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  color      VARCHAR(7)  NOT NULL DEFAULT '#6B7280',
  icono      VARCHAR(40) NOT NULL DEFAULT 'circle',
  activa     BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Regla de negocio:** categorías de tipo `gasto` solo se asignan a transacciones de tipo `gasto`. Ídem para `ingreso`. Enforceado en backend y UI.

---

### Entidad: Cuentas

```sql
CREATE TYPE tipo_cuenta AS ENUM
  ('banco', 'efectivo', 'ahorro', 'inversion', 'credito', 'prestamo');

CREATE TABLE cuentas (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           VARCHAR(80)   NOT NULL,
  tipo             tipo_cuenta   NOT NULL,
  saldo_inicial    NUMERIC(15,2) NOT NULL DEFAULT 0,
  fecha_inicio     DATE          NOT NULL DEFAULT CURRENT_DATE,
  moneda           VARCHAR(3)    NOT NULL DEFAULT 'MXN',
  color            VARCHAR(7)    NOT NULL DEFAULT '#6B7280',
  icono            VARCHAR(40)   NOT NULL DEFAULT 'bank',
  incluir_en_total BOOLEAN       NOT NULL DEFAULT true,
  activa           BOOLEAN       NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

**Notas clave:**
- `saldo_inicial`: lo que tenía la cuenta antes de empezar a usar el sistema
- `incluir_en_total`: si `false`, la cuenta no suma al patrimonio neto (ej: caja chica ajena)
- `tipo credito/prestamo` son pasivos — restan al patrimonio neto
- Nunca hacer DELETE de una cuenta con transacciones — solo `activa = false`

**Cálculo de saldo:**
```sql
saldo_actual = saldo_inicial
  + SUM(ingreso donde cuenta_destino = esta)
  - SUM(gasto donde cuenta_origen = esta)
  + SUM(transferencia donde cuenta_destino = esta)
  - SUM(transferencia donde cuenta_origen = esta)
```

---

### Entidad: Recurrentes

```sql
CREATE TABLE recurrentes (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           VARCHAR(80)   NOT NULL,
  monto            NUMERIC(15,2) NOT NULL CHECK (monto > 0),
  tipo             VARCHAR(10)   NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  categoria_id     UUID          NOT NULL REFERENCES categorias(id),
  cuenta_id        UUID          NOT NULL REFERENCES cuentas(id),
  dia_del_mes      SMALLINT      NOT NULL CHECK (dia_del_mes BETWEEN 1 AND 31),
  activo           BOOLEAN       NOT NULL DEFAULT true,
  ultima_ejecucion DATE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

---

### Entidad: Transacciones

```sql
CREATE TYPE tipo_transaccion AS ENUM
  ('ingreso', 'gasto', 'transferencia', 'ajuste');

CREATE TABLE transacciones (
  id                UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha             DATE             NOT NULL,
  monto             NUMERIC(15,2)    NOT NULL CHECK (monto > 0),
  descripcion       VARCHAR(120)     NOT NULL,
  tipo              tipo_transaccion NOT NULL,
  cuenta_origen_id  UUID             NOT NULL REFERENCES cuentas(id),
  cuenta_destino_id UUID             REFERENCES cuentas(id),
  categoria_id      UUID             REFERENCES categorias(id),
  notas             TEXT,
  recurrente_id     UUID             REFERENCES recurrentes(id),
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT transferencia_requiere_destino CHECK (
    (tipo = 'transferencia' AND cuenta_destino_id IS NOT NULL)
    OR tipo != 'transferencia'
  ),
  CONSTRAINT no_transferencia_requiere_categoria CHECK (
    (tipo NOT IN ('transferencia', 'ajuste') AND categoria_id IS NOT NULL)
    OR tipo IN ('transferencia', 'ajuste')
  ),
  CONSTRAINT cuentas_distintas CHECK (
    cuenta_origen_id != cuenta_destino_id
  )
);
```

**Los tres tipos de transacción:**

| Tipo | Flujo | Ejemplo |
|------|-------|---------|
| Ingreso | Mundo exterior → Tu cuenta | Cobrar sueldo |
| Gasto | Tu cuenta → Mundo exterior | Pagar supermercado |
| Transferencia | Tu cuenta A → Tu cuenta B | Pagar tarjeta de crédito |

> ⚠️ Pagar una tarjeta de crédito es una **transferencia**, no un gasto. El gasto ocurrió al comprar. Contarlo dos veces inflaría el gasto real.

**Validaciones de negocio (enforceadas en el backend):**
- `monto > 0` siempre
- Cuenta origen debe existir y estar activa
- Si transferencia: cuenta destino debe existir, activa, y ser distinta a origen
- Si no es transferencia ni ajuste: `categoria_id` obligatorio
- Categoría debe coincidir en tipo con la transacción (ingreso↔ingreso, gasto↔gasto)

---

### Entidad: Presupuestos

```sql
CREATE TABLE presupuestos (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id  UUID          NOT NULL REFERENCES categorias(id),
  mes           VARCHAR(7),   -- formato "2025-03" | NULL = presupuesto default
  monto_limite  NUMERIC(15,2) NOT NULL CHECK (monto_limite > 0),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  UNIQUE (categoria_id, mes)
);
```

**Lógica de resolución:** para mostrar el presupuesto de una categoría en un mes dado, primero busca registro específico para ese mes; si no existe, usa el default (`mes IS NULL`). Esto evita tener que crear presupuestos cada mes.

**Cálculo de progreso (dinámico, nunca guardado):**
```
gasto_real  = SUM(transacciones tipo gasto, categoria = X, mes = Y)
porcentaje  = gasto_real / monto_limite * 100
estado      = ok (<80%) | advertencia (80-100%) | excedido (>100%)
```

---

### Entidad: Metas

```sql
CREATE TABLE metas (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          VARCHAR(80)   NOT NULL,
  descripcion     TEXT,
  monto_objetivo  NUMERIC(15,2) NOT NULL CHECK (monto_objetivo > 0),
  monto_actual    NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (monto_actual >= 0),
  fecha_limite    DATE,
  cuenta_id       UUID          REFERENCES cuentas(id),
  color           VARCHAR(7)    NOT NULL DEFAULT '#6B7280',
  completada      BOOLEAN       NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE aportaciones_meta (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id        UUID          NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
  monto          NUMERIC(15,2) NOT NULL CHECK (monto > 0),
  fecha          DATE          NOT NULL DEFAULT CURRENT_DATE,
  nota           TEXT,
  transaccion_id UUID          REFERENCES transacciones(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

**Proyección automática:**
```
monto_faltante   = monto_objetivo - monto_actual
ritmo_actual     = promedio de aportaciones de los últimos 3 meses
ritmo_necesario  = monto_faltante / meses_hasta_fecha_limite
fecha_proyectada = hoy + (monto_faltante / ritmo_actual)
en_camino        = ritmo_actual >= ritmo_necesario
```

---

### Entidad: Snapshots Net Worth

```sql
CREATE TABLE snapshots_net_worth (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha      DATE          NOT NULL UNIQUE,
  total      NUMERIC(15,2) NOT NULL,
  detalle    JSONB         NOT NULL,  -- { "cuenta_uuid": saldo_en_ese_momento }
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

**Cuándo guardar:** una vez por día, al cargar el dashboard, si no existe snapshot del día actual. Con el tiempo construye la gráfica de evolución del patrimonio.

**Cálculo de net worth:**
```
net_worth = SUM(saldo_actual de cuentas activo donde incluir_en_total = true)
          - SUM(saldo_actual de cuentas pasivo donde incluir_en_total = true)
```
Cuentas pasivo = tipo `credito` o `prestamo`.

---

### Índices

```sql
CREATE INDEX idx_transacciones_fecha       ON transacciones(fecha DESC);
CREATE INDEX idx_transacciones_cuenta_orig ON transacciones(cuenta_origen_id);
CREATE INDEX idx_transacciones_cuenta_dest ON transacciones(cuenta_destino_id);
CREATE INDEX idx_transacciones_categoria   ON transacciones(categoria_id);
CREATE INDEX idx_transacciones_updated_at  ON transacciones(updated_at);  -- sync offline
CREATE INDEX idx_presupuestos_mes          ON presupuestos(mes);
CREATE INDEX idx_aportaciones_meta         ON aportaciones_meta(meta_id);
CREATE INDEX idx_snapshots_fecha           ON snapshots_net_worth(fecha DESC);
CREATE INDEX idx_movimientos_instrumento_id    ON movimientos_instrumento(instrumento_id);
CREATE INDEX idx_movimientos_instrumento_fecha ON movimientos_instrumento(fecha DESC);
```

---

## API — Endpoints

### Cuentas
```
GET    /api/cuentas              Lista todas con saldo calculado
POST   /api/cuentas              Crear cuenta
PUT    /api/cuentas/:id          Editar (nombre, color, ícono, etc.)
PATCH  /api/cuentas/:id/archivar Soft delete — nunca DELETE
```

### Transacciones
```
GET    /api/transacciones        Lista con filtros: ?desde=&hasta=&cuenta=&categoria=&tipo=
GET    /api/transacciones/:id    Detalle
POST   /api/transacciones        Crear (ingreso | gasto | transferencia | ajuste)
PUT    /api/transacciones/:id    Editar
DELETE /api/transacciones/:id    Eliminar
```

### Categorías
```
GET  /api/categorias             Todas, agrupadas por tipo
POST /api/categorias             Crear
PUT  /api/categorias/:id         Editar
```

### Presupuestos
```
GET  /api/presupuestos?mes=2025-03   Presupuestos del mes con progreso calculado
POST /api/presupuestos               Crear (mes=NULL para default)
PUT  /api/presupuestos/:id           Editar monto
```

### Metas
```
GET    /api/metas                Lista con proyección calculada
POST   /api/metas                Crear
PUT    /api/metas/:id            Editar
POST   /api/metas/:id/aportacion Registrar aportación
```

### Recurrentes
```
GET   /api/recurrentes           Lista con próxima fecha calculada
POST  /api/recurrentes           Crear
PUT   /api/recurrentes/:id       Editar
POST  /api/recurrentes/:id/ejecutar  Genera transacción y actualiza ultima_ejecucion
```

### Dashboard
```
GET /api/dashboard    Responde todo en una sola llamada:
  {
    net_worth: { total, activos, pasivos },
    mes_actual: { ingresos, gastos, balance },
    presupuestos: [{ categoria, limite, gastado, porcentaje, estado }],
    recurrentes_pendientes: [...],
    metas: [{ nombre, progreso, proyeccion, en_camino }],
    snapshots_net_worth: [{ fecha, total }],   // últimos 12 meses
    instrumentos: {
      creditos: [
        { nombre, saldo_insoluto, proximo_pago, porcentaje_pagado }
      ],
      inversiones: [
        { nombre, saldo_actual, rendimiento_acumulado }
      ]
    }
  }
```

### Sincronización offline
```
POST /api/sync    Recibe array de operaciones offline y las aplica en orden por created_at
  Body: { operaciones: [{ tipo, entidad, datos, created_at }] }
```

---

## Estructura de carpetas

```
finanzas-app/
│
├── apps/
│   ├── api/                              # Backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── cuentas/
│   │   │   │   │   ├── cuentas.router.ts
│   │   │   │   │   ├── cuentas.service.ts
│   │   │   │   │   ├── cuentas.queries.ts
│   │   │   │   │   └── cuentas.types.ts
│   │   │   │   ├── transacciones/
│   │   │   │   │   ├── transacciones.router.ts
│   │   │   │   │   ├── transacciones.service.ts
│   │   │   │   │   ├── transacciones.queries.ts
│   │   │   │   │   └── transacciones.types.ts
│   │   │   │   ├── categorias/
│   │   │   │   ├── presupuestos/
│   │   │   │   ├── metas/
│   │   │   │   ├── recurrentes/
│   │   │   │   ├── instrumentos/
│   │   │   │   │   ├── instrumentos.router.ts
│   │   │   │   │   ├── instrumentos.service.ts
│   │   │   │   │   └── instrumentos.types.ts
│   │   │   │   └── dashboard/
│   │   │   │       └── dashboard.service.ts
│   │   │   ├── shared/
│   │   │   │   ├── db.ts                 # instancia Prisma Client
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── error.handler.ts
│   │   │   │   └── validators.ts         # schemas Zod compartidos
│   │   │   └── app.ts                    # setup Express + middlewares
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                              # Frontend PWA
│       ├── src/
│       │   ├── modules/
│       │   │   ├── cuentas/
│       │   │   │   ├── components/
│       │   │   │   │   ├── CuentaCard.tsx
│       │   │   │   │   └── CuentaForm.tsx
│       │   │   │   ├── hooks/
│       │   │   │   │   └── useCuentas.ts
│       │   │   │   ├── pages/
│       │   │   │   │   └── CuentasPage.tsx
│       │   │   │   └── cuentas.types.ts
│       │   │   ├── transacciones/
│       │   │   │   ├── components/
│       │   │   │   │   ├── TransaccionForm.tsx
│       │   │   │   │   ├── TransaccionItem.tsx
│       │   │   │   │   └── FiltroBarra.tsx
│       │   │   │   ├── hooks/
│       │   │   │   └── pages/
│       │   │   ├── presupuestos/
│       │   │   ├── metas/
│       │   │   ├── recurrentes/
│       │   │   └── dashboard/
│       │   │       ├── components/
│       │   │       │   ├── NetWorthCard.tsx
│       │   │       │   ├── ResumenMes.tsx
│       │   │       │   ├── PresupuestoBarra.tsx
│       │   │       │   └── RecurrentesPendientes.tsx
│       │   │       └── pages/
│       │   │           └── DashboardPage.tsx
│       │   ├── shared/
│       │   │   ├── components/
│       │   │   │   ├── Button.tsx
│       │   │   │   ├── Input.tsx
│       │   │   │   ├── Modal.tsx
│       │   │   │   └── CurrencyDisplay.tsx
│       │   │   ├── hooks/
│       │   │   │   ├── useOfflineSync.ts
│       │   │   │   └── useNetworkStatus.ts
│       │   │   ├── store/
│       │   │   │   └── offlineQueue.ts   # Zustand — cola offline
│       │   │   ├── db/
│       │   │   │   └── localDb.ts        # Dexie.js — IndexedDB
│       │   │   ├── api/
│       │   │   │   └── client.ts         # fetch wrapper con auth
│       │   │   └── utils/
│       │   │       ├── currency.ts
│       │   │       └── dates.ts
│       │   ├── router.tsx
│       │   └── main.tsx
│       ├── public/
│       │   ├── manifest.json             # PWA instalable
│       │   └── sw.js                     # Service Worker
│       ├── vite.config.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docker-compose.yml                    # desarrollo local
├── docker-compose.prod.yml               # servidor propio
└── README.md
```

---

## Stack tecnológico completo

| Capa | Tecnología | Versión recomendada |
|------|-----------|---------------------|
| UI framework | React | 18+ |
| Build tool | Vite | 5+ |
| Estado global | Zustand | 4+ |
| Queries/cache | TanStack Query | 5+ |
| Offline storage | Dexie.js (IndexedDB) | 3+ |
| Estilos | Tailwind CSS | 3+ |
| Gráficas | Recharts | 2+ |
| Iconos | Lucide React | latest |
| Runtime backend | Node.js | 20+ LTS |
| Framework API | Express | 4+ |
| ORM | Prisma | 5+ |
| Validación | Zod | 3+ |
| Base de datos | PostgreSQL | 15+ |
| Autenticación | JWT (usuario único) | — |
| Contenedores | Docker + Compose | — |
| Lenguaje | TypeScript | 5+ (ambos lados) |

---

## Decisiones de diseño importantes

### ¿Por qué saldos calculados y no guardados?
Si editas o eliminas una transacción, el saldo se corrige automáticamente en todo el sistema. No hay riesgo de inconsistencia entre el saldo guardado y las transacciones reales.

### ¿Por qué UUID y no integer autoincremental?
El cliente necesita generar el ID antes de llegar al servidor (modo offline). Con UUID cada dispositivo genera IDs únicos sin coordinación central.

### ¿Por qué presupuestos con default (mes=NULL)?
Evita tener que crear presupuestos cada mes. El sistema usa el default si no hay uno específico para el mes actual. Solo creas excepciones cuando algo cambia.

### ¿Por qué recurrentes semi-automáticos (con confirmación)?
Si el monto cambia (renta sube, Netflix cambia precio) y el sistema los crea solo, tienes datos incorrectos. La confirmación manual toma un clic pero garantiza precisión.

### ¿Por qué pagar tarjeta = transferencia?
El gasto ocurrió al comprar con la tarjeta. El pago de la tarjeta es un movimiento entre cuentas tuyas (banco → deuda de tarjeta). Contarlo como gasto duplicaría tus gastos reales.

---

## Flujos críticos de UX

### Registrar gasto rápido (objetivo: < 15 segundos)
```
1. Tap en botón flotante "+"
2. Escribir monto (teclado numérico)
3. Seleccionar categoría (grid visual con iconos)
4. Seleccionar cuenta (lista corta)
5. Descripción opcional
6. Guardar
```

### Dashboard — vista de síntesis
```
Sección 1: Net Worth (total, activos, pasivos)
Sección 2: Este mes (ingresos, gastos, balance)
           Barras de presupuestos con semáforo
Sección 3: Alertas (recurrentes pendientes, presupuestos >80%, metas en riesgo)
Sección 4: Gráfica de evolución del patrimonio (12 meses)
```

---

## Instrucciones de uso como prompt

Para continuar el desarrollo de cualquier módulo en una nueva sesión con Claude, incluye este archivo completo como contexto y especifica:

```
Contexto: ver blueprint adjunto (finanzas-app-blueprint.md)
Tarea: implementar el módulo de [NOMBRE]
Empezar por: [backend/frontend/base de datos]
Estado actual del proyecto: [lo que ya existe]
```

Los módulos recomendados para implementar en orden:
1. Setup inicial (Docker, estructura de carpetas, Prisma schema)
2. Módulo Cuentas (CRUD completo, cálculo de saldo)
3. Módulo Categorías
4. Módulo Transacciones (el más importante)
5. Módulo Presupuestos
6. Módulo Metas
7. Módulo Recurrentes
8. Dashboard
9. PWA + offline sync