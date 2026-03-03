# FINPER — Sistema de Finanzas Personales

App web personal para control financiero completo. Desplegada en servidor propio con soporte offline.

**Stack:** React + Vite (PWA) · Node.js + Express · PostgreSQL · Prisma · Docker Compose

## Inicio rápido (desarrollo)

```bash
# 1. Copiar variables de entorno del backend
cp apps/api/.env.example apps/api/.env

# 2. Levantar todos los servicios
docker compose up -d

# 3. Correr migraciones de base de datos
docker compose exec api npm run db:migrate

# 4. Acceder a la app
#    Frontend: http://localhost:5173
#    API:      http://localhost:3001
#    Health:   http://localhost:3001/health
```

## Estructura

```
apps/
  api/   → Backend Node.js + Express + Prisma
  web/   → Frontend React + Vite + Tailwind (PWA)
```

## Módulos

| Módulo | Ruta API | Descripción |
|--------|----------|-------------|
| Cuentas | `/api/cuentas` | Contenedores de dinero |
| Transacciones | `/api/transacciones` | Registro de movimientos |
| Categorías | `/api/categorias` | Clasificación de ingresos/gastos |
| Presupuestos | `/api/presupuestos` | Límites de gasto por mes |
| Metas | `/api/metas` | Ahorro con proyección automática |
| Recurrentes | `/api/recurrentes` | Plantillas periódicas |
| Dashboard | `/api/dashboard` | Vista de síntesis completa |
| Sync | `/api/sync` | Sincronización offline |

## Prisma

```bash
# Ver studio de base de datos
docker compose exec api npm run db:studio

# Crear nueva migración
docker compose exec api npm run db:migrate
```

Ver [BLUEPRINT.md](./BLUEPRINT.md) para la arquitectura completa del sistema.
