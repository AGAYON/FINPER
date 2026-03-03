-- CreateEnum
CREATE TYPE "TipoCuenta" AS ENUM ('banco', 'efectivo', 'ahorro', 'inversion', 'credito', 'prestamo');

-- CreateEnum
CREATE TYPE "TipoTransaccion" AS ENUM ('ingreso', 'gasto', 'transferencia', 'ajuste');

-- CreateTable
CREATE TABLE "categorias" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "tipo" VARCHAR(10) NOT NULL,
    "color" VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    "icono" VARCHAR(40) NOT NULL DEFAULT 'circle',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "tipo" "TipoCuenta" NOT NULL,
    "saldo_inicial" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fecha_inicio" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'MXN',
    "color" VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    "icono" VARCHAR(40) NOT NULL DEFAULT 'bank',
    "incluir_en_total" BOOLEAN NOT NULL DEFAULT true,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurrentes" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "tipo" VARCHAR(10) NOT NULL,
    "categoria_id" UUID NOT NULL,
    "cuenta_id" UUID NOT NULL,
    "dia_del_mes" SMALLINT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultima_ejecucion" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurrentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacciones" (
    "id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "descripcion" VARCHAR(120) NOT NULL,
    "tipo" "TipoTransaccion" NOT NULL,
    "cuenta_origen_id" UUID NOT NULL,
    "cuenta_destino_id" UUID,
    "categoria_id" UUID,
    "notas" TEXT,
    "recurrente_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transacciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presupuestos" (
    "id" UUID NOT NULL,
    "categoria_id" UUID NOT NULL,
    "mes" VARCHAR(7),
    "monto_limite" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presupuestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metas" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "descripcion" TEXT,
    "monto_objetivo" DECIMAL(15,2) NOT NULL,
    "monto_actual" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fecha_limite" DATE,
    "cuenta_id" UUID,
    "color" VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aportaciones_meta" (
    "id" UUID NOT NULL,
    "meta_id" UUID NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nota" TEXT,
    "transaccion_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aportaciones_meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshots_net_worth" (
    "id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "detalle" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshots_net_worth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transacciones_fecha_idx" ON "transacciones"("fecha" DESC);

-- CreateIndex
CREATE INDEX "transacciones_cuenta_origen_id_idx" ON "transacciones"("cuenta_origen_id");

-- CreateIndex
CREATE INDEX "transacciones_cuenta_destino_id_idx" ON "transacciones"("cuenta_destino_id");

-- CreateIndex
CREATE INDEX "transacciones_categoria_id_idx" ON "transacciones"("categoria_id");

-- CreateIndex
CREATE INDEX "transacciones_updated_at_idx" ON "transacciones"("updated_at");

-- CreateIndex
CREATE INDEX "presupuestos_mes_idx" ON "presupuestos"("mes");

-- CreateIndex
CREATE UNIQUE INDEX "presupuestos_categoria_id_mes_key" ON "presupuestos"("categoria_id", "mes");

-- CreateIndex
CREATE INDEX "aportaciones_meta_meta_id_idx" ON "aportaciones_meta"("meta_id");

-- CreateIndex
CREATE UNIQUE INDEX "snapshots_net_worth_fecha_key" ON "snapshots_net_worth"("fecha");

-- CreateIndex
CREATE INDEX "snapshots_net_worth_fecha_idx" ON "snapshots_net_worth"("fecha" DESC);

-- AddForeignKey
ALTER TABLE "recurrentes" ADD CONSTRAINT "recurrentes_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrentes" ADD CONSTRAINT "recurrentes_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_cuenta_origen_id_fkey" FOREIGN KEY ("cuenta_origen_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_cuenta_destino_id_fkey" FOREIGN KEY ("cuenta_destino_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_recurrente_id_fkey" FOREIGN KEY ("recurrente_id") REFERENCES "recurrentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presupuestos" ADD CONSTRAINT "presupuestos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metas" ADD CONSTRAINT "metas_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aportaciones_meta" ADD CONSTRAINT "aportaciones_meta_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "metas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aportaciones_meta" ADD CONSTRAINT "aportaciones_meta_transaccion_id_fkey" FOREIGN KEY ("transaccion_id") REFERENCES "transacciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
