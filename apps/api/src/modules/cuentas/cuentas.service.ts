import { db } from '../../shared/db';
import { AppError } from '../../shared/error.handler';
import { Prisma } from '@prisma/client';

export class CuentasService {
    /** Lista todas las cuentas activas con su saldo calculado */
    async listarCuentas() {
        const cuentas = await db.cuenta.findMany({
            where: { activa: true },
            orderBy: { createdAt: 'asc' },
        });

        return Promise.all(cuentas.map(async (cuenta) => ({
            ...cuenta,
            saldoActual: await this.calcularSaldo(cuenta.id),
        })));
    }

    /** Calcula el saldo de una cuenta desde sus transacciones */
    async calcularSaldo(cuentaId: string): Promise<number> {
        const [entradas, salidas] = await Promise.all([
            // Ingresos y transferencias hacia esta cuenta
            db.transaccion.aggregate({
                where: { cuentaDestinoId: cuentaId },
                _sum: { monto: true },
            }),
            // Gastos, ajustes y transferencias desde esta cuenta
            db.transaccion.aggregate({
                where: { cuentaOrigenId: cuentaId },
                _sum: { monto: true },
            }),
        ]);

        const cuenta = await db.cuenta.findUniqueOrThrow({ where: { id: cuentaId } });
        const saldoInicial = Number(cuenta.saldoInicial);
        const sumaEntradas = Number(entradas._sum.monto ?? 0);
        const sumaSalidas = Number(salidas._sum.monto ?? 0);

        return saldoInicial + sumaEntradas - sumaSalidas;
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
}
