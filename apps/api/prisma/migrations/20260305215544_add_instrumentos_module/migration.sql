-- CreateEnum
CREATE TYPE "TipoInstrumento" AS ENUM ('credito', 'inversion');

-- CreateEnum
CREATE TYPE "SubtipoInstrumento" AS ENUM ('tasa_fija', 'tasa_variable');

-- CreateEnum
CREATE TYPE "TipoMovimientoInstrumento" AS ENUM ('pago', 'aportacion', 'rescate', 'ajuste');

-- CreateTable
CREATE TABLE "instrumentos" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "tipo" "TipoInstrumento" NOT NULL,
    "subtipo" "SubtipoInstrumento" NOT NULL,
    "cuenta_id" UUID NOT NULL,
    "capital_inicial" DECIMAL(15,2),
    "tasa_anual" DECIMAL(8,6),
    "plazo_meses" SMALLINT,
    "fecha_inicio" DATE,
    "periodicidad_dias" SMALLINT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instrumentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_instrumento" (
    "id" UUID NOT NULL,
    "instrumento_id" UUID NOT NULL,
    "tipo" "TipoMovimientoInstrumento" NOT NULL,
    "fecha" DATE NOT NULL,
    "monto_total" DECIMAL(15,2) NOT NULL,
    "monto_capital" DECIMAL(15,2),
    "monto_interes" DECIMAL(15,2),
    "monto_interes_ajuste" DECIMAL(15,2) DEFAULT 0,
    "transaccion_id" UUID,
    "notas" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_instrumento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movimientos_instrumento_instrumento_id_idx" ON "movimientos_instrumento"("instrumento_id");

-- CreateIndex
CREATE INDEX "movimientos_instrumento_fecha_idx" ON "movimientos_instrumento"("fecha" DESC);

-- AddForeignKey
ALTER TABLE "instrumentos" ADD CONSTRAINT "instrumentos_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_instrumento" ADD CONSTRAINT "movimientos_instrumento_instrumento_id_fkey" FOREIGN KEY ("instrumento_id") REFERENCES "instrumentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_instrumento" ADD CONSTRAINT "movimientos_instrumento_transaccion_id_fkey" FOREIGN KEY ("transaccion_id") REFERENCES "transacciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
