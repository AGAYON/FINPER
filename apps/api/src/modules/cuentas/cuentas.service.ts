import { db } from '../../shared/db';
import { AppError } from '../../shared/error.handler';
import { Prisma } from '@prisma/client';
import type { Cuenta } from './cuentas.types';

export class CuentasService {
    private toCuentaConSaldo(
        row: Awaited<ReturnType<typeof db.cuenta.findMany>>[number],
        saldoActual: number,
    ): Cuenta {
        const fecha =
            row.fechaInicio instanceof Date
                ? row.fechaInicio.toISOString().slice(0, 10)
                : String(row.fechaInicio);
        return {
            id: row.id,
            nombre: row.nombre,
            tipo: row.tipo,
            saldoInicial: Number(row.saldoInicial),
            fechaInicio: fecha,
            moneda: row.moneda,
            color: row.color,
            icono: row.icono,
            incluirEnTotal: row.incluirEnTotal,
            activa: row.activa,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
            saldoActual,
        };
    }

    /** Lista todas las cuentas activas con su saldo calculado */
    async listarCuentas(): Promise<Cuenta[]> {
        const cuentas = await db.cuenta.findMany({
            where: { activa: true },
            orderBy: { createdAt: 'asc' },
        });

        return Promise.all(
            cuentas.map(async (cuenta) => {
                const saldoActual = await this.calcularSaldo(cuenta.id);
                return this.toCuentaConSaldo(cuenta, saldoActual);
            }),
        );
    }

    /** Calcula el saldo de una cuenta desde sus transacciones (lógica explícita por tipo) */
    async calcularSaldo(cuentaId: string): Promise<number> {
        const [entradasIngreso, entradasTransfer, entradasAjuste, salidasGasto, salidasTransfer, salidasAjuste] =
            await Promise.all([
                db.transaccion.aggregate({
                    where: { tipo: 'ingreso', cuentaOrigenId: cuentaId },
                    _sum: { monto: true },
                }),
                db.transaccion.aggregate({
                    where: { tipo: 'transferencia', cuentaDestinoId: cuentaId },
                    _sum: { monto: true },
                }),
                // Ajustes positivos: auto-referenciales (cuentaDestinoId = cuentaId)
                db.transaccion.aggregate({
                    where: { tipo: 'ajuste', cuentaDestinoId: cuentaId },
                    _sum: { monto: true },
                }),
                db.transaccion.aggregate({
                    where: { tipo: 'gasto', cuentaOrigenId: cuentaId },
                    _sum: { monto: true },
                }),
                db.transaccion.aggregate({
                    where: { tipo: 'transferencia', cuentaOrigenId: cuentaId },
                    _sum: { monto: true },
                }),
                // Ajustes negativos: cuentaDestinoId nulo (no auto-referenciales)
                // NOTA: usar cuentaDestinoId: null directamente porque NOT:{field:val}
                // en Prisma no captura NULLs (SQL: NOT NULL = uuid → NULL, no TRUE)
                db.transaccion.aggregate({
                    where: {
                        tipo: 'ajuste',
                        cuentaOrigenId: cuentaId,
                        cuentaDestinoId: null,
                    },
                    _sum: { monto: true },
                }),
            ]);

        const cuenta = await db.cuenta.findUniqueOrThrow({ where: { id: cuentaId } });
        const saldoInicial = Number(cuenta.saldoInicial);
        const entradas =
            Number(entradasIngreso._sum.monto ?? 0) +
            Number(entradasTransfer._sum.monto ?? 0) +
            Number(entradasAjuste._sum.monto ?? 0);
        const salidas =
            Number(salidasGasto._sum.monto ?? 0) +
            Number(salidasTransfer._sum.monto ?? 0) +
            Number(salidasAjuste._sum.monto ?? 0);

        // Cuentas pasivo: un gasto aumenta la deuda, un ingreso/abono la disminuye
        const esPasivo = cuenta.tipo === 'credito' || cuenta.tipo === 'prestamo';
        return esPasivo
            ? saldoInicial + salidas - entradas
            : saldoInicial + entradas - salidas;
    }

    /** Obtiene una cuenta por id con saldo actual calculado. Lanza AppError 404 si no existe. */
    async obtenerCuenta(id: string) {
        const cuenta = await db.cuenta.findUnique({ where: { id } });
        if (!cuenta) {
            throw new AppError('Cuenta no encontrada', 404);
        }
        const saldoActual = await this.calcularSaldo(id);
        return this.toCuentaConSaldo(cuenta, saldoActual);
    }

    async crearCuenta(data: Prisma.CuentaCreateInput) {
        return db.cuenta.create({ data });
    }

    async actualizarCuenta(id: string, data: Prisma.CuentaUpdateInput) {
        return db.cuenta.update({ where: { id }, data });
    }

    async archivarCuenta(id: string) {
        await db.cuenta.update({
            where: { id },
            data: { activa: false },
        });
    }

    /**
     * Ajusta el saldo de una cuenta creando una transacción de tipo 'ajuste'.
     * - diferencia > 0: ajuste auto-referencial (cuentaOrigenId = cuentaDestinoId = id) → suma al saldo
     * - diferencia < 0: ajuste normal (solo cuentaOrigenId = id) → resta al saldo
     */
    async ajustarSaldo(id: string, saldoReal: number, nota?: string) {
        const cuenta = await db.cuenta.findUnique({ where: { id } });
        if (!cuenta) throw new AppError('Cuenta no encontrada', 404);

        const saldoCalculado = await this.calcularSaldo(id);
        const esPasivo = cuenta.tipo === 'credito' || cuenta.tipo === 'prestamo';

        // Para cuentas pasivas el ajuste positivo (más deuda) usa cuentaOrigenId solo
        // Para cuentas activas el ajuste positivo (más dinero) usa auto-referencial
        const diferencia = saldoReal - saldoCalculado;

        if (Math.abs(diferencia) < 0.01) {
            return { transaccionCreada: false, diferencia: 0, transaccion: null };
        }

        const montoAbs = Math.abs(diferencia);
        // auto-referencial cuando necesitamos que SUME al saldo:
        // activo + dif>0 → suma  |  pasivo + dif<0 → suma (reducir deuda = entradasAjuste)
        const autoReferencial = (!esPasivo && diferencia > 0) || (esPasivo && diferencia < 0);

        const hoy = new Date();
        hoy.setUTCHours(0, 0, 0, 0);

        const transaccion = await db.transaccion.create({
            data: {
                fecha: hoy,
                monto: montoAbs,
                descripcion: 'Ajuste de saldo',
                tipo: 'ajuste',
                cuentaOrigenId: id,
                cuentaDestinoId: autoReferencial ? id : null,
                categoriaId: null,
                notas: nota ?? null,
            },
        });

        return {
            transaccionCreada: true,
            diferencia,
            transaccion,
        };
    }
}
