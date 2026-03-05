import { db } from '../../shared/db';
import { AppError } from '../../shared/error.handler';
import type {
    AmortizacionPeriodo,
    InstrumentoListado,
    ProyeccionPrepago,
} from './instrumentos.types';

export class InstrumentosService {
    private toListadoBase(row: any): InstrumentoListado {
        return {
            id: row.id,
            nombre: row.nombre,
            tipo: row.tipo,
            subtipo: row.subtipo,
            cuentaId: row.cuentaId,
            activo: row.activo,
            notas: row.notas ?? null,
            tasaAnual: row.tasaAnual != null ? Number(row.tasaAnual) : null,
            capitalInicial: row.capitalInicial != null ? Number(row.capitalInicial) : null,
            plazoMeses: row.plazoMeses != null ? Number(row.plazoMeses) : null,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
        };
    }

    private ensureTasaFijaCampos(row: any) {
        if (
            row.capitalInicial == null ||
            row.tasaAnual == null ||
            row.plazoMeses == null ||
            row.fechaInicio == null ||
            row.periodicidadDias == null
        ) {
            throw new AppError(
                'Instrumento de tasa fija sin configuración completa (capital, tasa, plazo, fecha_inicio, periodicidad_dias)',
                400,
            );
        }
    }

    private calcularTablaAmortizacion(row: any): AmortizacionPeriodo[] {
        this.ensureTasaFijaCampos(row);

        const capitalInicial = Number(row.capitalInicial);
        const tasaAnual = Number(row.tasaAnual);
        const plazoMeses = Number(row.plazoMeses);
        const periodicidadDias = Number(row.periodicidadDias);
        const fechaInicio: Date = row.fechaInicio instanceof Date ? row.fechaInicio : new Date(row.fechaInicio);

        const n = Math.round((plazoMeses * 30) / periodicidadDias);
        if (n <= 0) {
            throw new AppError('Configuración de plazo inválida para la tabla de amortización', 400);
        }

        const tasaPeriodo = tasaAnual / (365 / periodicidadDias);
        const cuota =
            tasaPeriodo === 0
                ? capitalInicial / n
                : capitalInicial *
                  ((tasaPeriodo * Math.pow(1 + tasaPeriodo, n)) /
                      (Math.pow(1 + tasaPeriodo, n) - 1));

        const tabla: AmortizacionPeriodo[] = [];
        let saldo = capitalInicial;

        for (let i = 1; i <= n; i++) {
            const interes = saldo * tasaPeriodo;
            let capital = cuota - interes;
            if (capital > saldo) {
                capital = saldo;
            }
            saldo = saldo - capital;

            const fechaCuota = new Date(
                fechaInicio.getTime() + periodicidadDias * i * 24 * 60 * 60 * 1000,
            );

            tabla.push({
                periodo: i,
                fecha: fechaCuota.toISOString().slice(0, 10),
                cuota: Number(cuota.toFixed(2)),
                interes: Number(interes.toFixed(2)),
                capital: Number(capital.toFixed(2)),
                saldo: Number(saldo.toFixed(2)),
            });
        }

        return tabla;
    }

    private async calcularSaldoTasaFija(instrumentoId: string, capitalInicial: number) {
        const [pagos, ajustes] = await Promise.all([
            db.movimientoInstrumento.findMany({
                where: { instrumentoId, tipo: 'pago' },
                orderBy: { fecha: 'asc' },
            }),
            db.movimientoInstrumento.findMany({
                where: { instrumentoId, tipo: 'ajuste' },
            }),
        ]);

        const totalCapitalPagado = pagos.reduce(
            (sum, p) => sum + Number(p.montoCapital ?? 0),
            0,
        );
        const totalAjustes = ajustes.reduce(
            (sum, a) => sum + Number(a.montoTotal ?? 0),
            0,
        );

        const saldoInsoluto = Math.max(0, capitalInicial - totalCapitalPagado + totalAjustes);

        return { saldoInsoluto, pagos };
    }

    private async calcularSaldoVariable(instrumento: any) {
        const movimientos = await db.movimientoInstrumento.findMany({
            where: { instrumentoId: instrumento.id },
        });

        const capitalInicial = Number(instrumento.capitalInicial ?? 0);
        const aportaciones = movimientos
            .filter((m) => m.tipo === 'aportacion')
            .reduce((sum, m) => sum + Number(m.montoTotal), 0);
        const rescates = movimientos
            .filter((m) => m.tipo === 'rescate')
            .reduce((sum, m) => sum + Number(m.montoTotal), 0);
        const ajustes = movimientos
            .filter((m) => m.tipo === 'ajuste')
            .reduce((sum, m) => sum + Number(m.montoTotal), 0);

        const saldoActual = capitalInicial + aportaciones - rescates + ajustes;
        const rendimientoAcumulado = ajustes;

        return { saldoActual, rendimientoAcumulado };
    }

    async listarInstrumentos(): Promise<InstrumentoListado[]> {
        const instrumentos = await db.instrumento.findMany({
            where: { activo: true },
            orderBy: { createdAt: 'asc' },
        });

        const resultados: InstrumentoListado[] = [];

        for (const inst of instrumentos) {
            const base = this.toListadoBase(inst);

            if (inst.subtipo === 'tasa_fija') {
                this.ensureTasaFijaCampos(inst);
                const capitalInicial = Number(inst.capitalInicial);
                const tabla = this.calcularTablaAmortizacion(inst);
                const { saldoInsoluto, pagos } = await this.calcularSaldoTasaFija(
                    inst.id,
                    capitalInicial,
                );

                const periodoActual = pagos.length;
                const proximo =
                    periodoActual < tabla.length ? tabla[periodoActual] : null;
                const porcentajePagado =
                    capitalInicial > 0
                        ? (pagos.reduce(
                              (sum, p) => sum + Number(p.montoCapital ?? 0),
                              0,
                          ) /
                              capitalInicial) *
                          100
                        : null;

                resultados.push({
                    ...base,
                    saldoInsoluto: Number(saldoInsoluto.toFixed(2)),
                    proximoPago: proximo
                        ? {
                              fecha: proximo.fecha,
                              montoTotal: proximo.cuota,
                              montoCapital: proximo.capital,
                              montoInteres: proximo.interes,
                          }
                        : null,
                    porcentajePagado:
                        porcentajePagado != null
                            ? Number(porcentajePagado.toFixed(1))
                            : null,
                    periodosRestantes: Math.max(
                        0,
                        tabla.length - pagos.length,
                    ),
                });
            } else {
                const { saldoActual, rendimientoAcumulado } =
                    await this.calcularSaldoVariable(inst);
                resultados.push({
                    ...base,
                    saldoActual: Number(saldoActual.toFixed(2)),
                    rendimientoAcumulado: Number(
                        rendimientoAcumulado.toFixed(2),
                    ),
                });
            }
        }

        return resultados;
    }

    async crearInstrumento(data: {
        nombre: string;
        tipo: 'credito' | 'inversion';
        subtipo: 'tasa_fija' | 'tasa_variable';
        cuentaId: string;
        capitalInicial?: number;
        tasaAnual?: number;
        plazoMeses?: number;
        fechaInicio?: string;
        periodicidadDias?: number;
        notas?: string | null;
    }) {
        const cuenta = await db.cuenta.findFirst({
            where: { id: data.cuentaId, activa: true },
        });
        if (!cuenta) {
            throw new AppError('La cuenta asociada no existe o no está activa', 400);
        }

        const instrumento = await db.instrumento.create({
            data: {
                nombre: data.nombre,
                tipo: data.tipo,
                subtipo: data.subtipo,
                cuentaId: data.cuentaId,
                capitalInicial: data.capitalInicial,
                tasaAnual: data.tasaAnual,
                plazoMeses: data.plazoMeses,
                fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
                periodicidadDias: data.periodicidadDias,
                notas: data.notas ?? null,
            },
        });

        // Si es inversión con capital inicial > 0, crear transacción ingreso en la cuenta
        // para que el saldo contable refleje el capital desde el primer momento (net worth).
        if (data.tipo === 'inversion' && data.capitalInicial && data.capitalInicial > 0) {
            const categoria = await this.obtenerOCrearCategoriaCapitalInicial();
            const fechaTransaccion = data.fechaInicio ? new Date(data.fechaInicio) : new Date();
            await db.transaccion.create({
                data: {
                    fecha: fechaTransaccion,
                    monto: data.capitalInicial,
                    descripcion: `Capital inicial ${data.nombre}`,
                    tipo: 'ingreso',
                    cuentaOrigenId: data.cuentaId,
                    categoriaId: categoria.id,
                },
            });
        }

        return instrumento;
    }

    async actualizarInstrumento(
        id: string,
        data: { nombre?: string; notas?: string | null; tasaAnual?: number; capitalInicial?: number; plazoMeses?: number },
    ) {
        const instrumento = await db.instrumento.findUnique({ where: { id } });
        if (!instrumento) {
            throw new AppError('Instrumento no encontrado', 404);
        }

        const actualizado = await db.instrumento.update({
            where: { id },
            data: {
                nombre: data.nombre,
                notas: data.notas,
                tasaAnual: data.tasaAnual,
                capitalInicial: data.capitalInicial,
                plazoMeses: data.plazoMeses,
            },
        });

        return actualizado;
    }

    async registrarPagosHistoricos(
        id: string,
        data: { numeroPagos: number; cuentaOrigenId: string; fechaPrimerPago?: string },
    ) {
        const instrumento = await db.instrumento.findUnique({ where: { id } });
        if (!instrumento) {
            throw new AppError('Instrumento no encontrado', 404);
        }
        if (instrumento.tipo !== 'credito' || instrumento.subtipo !== 'tasa_fija') {
            throw new AppError(
                'Los pagos históricos solo aplican a créditos de tasa fija',
                400,
            );
        }

        this.ensureTasaFijaCampos(instrumento);

        const movimientosExistentes = await db.movimientoInstrumento.count({
            where: { instrumentoId: id },
        });
        if (movimientosExistentes > 0) {
            throw new AppError(
                'Este instrumento ya tiene pagos registrados. Usa "Registrar pago" para agregar pagos individuales.',
                400,
            );
        }

        const tabla = this.calcularTablaAmortizacion(instrumento);
        if (data.numeroPagos > tabla.length) {
            throw new AppError(
                `El instrumento solo tiene ${tabla.length} periodos. numeroPagos no puede exceder ese valor.`,
                400,
            );
        }

        const cuentaOrigen = await db.cuenta.findFirst({
            where: { id: data.cuentaOrigenId, activa: true },
        });
        if (!cuentaOrigen) {
            throw new AppError('La cuenta de origen no existe o no está activa', 400);
        }

        const cuentaCredito = await db.cuenta.findFirst({
            where: { id: instrumento.cuentaId, activa: true },
        });
        if (!cuentaCredito) {
            throw new AppError('La cuenta asociada al crédito no existe o no está activa', 400);
        }

        const categoriaCosto = await this.obtenerOCrearCategoriaCostoFinanciero();

        const operations: any[] = [];
        let capitalAmortizado = 0;
        let interesesPagados = 0;

        for (let i = 0; i < data.numeroPagos; i++) {
            const periodo = tabla[i];
            const fechaPago = new Date(periodo.fecha);

            capitalAmortizado += periodo.capital;
            interesesPagados += periodo.interes;

            operations.push(
                db.movimientoInstrumento.create({
                    data: {
                        instrumentoId: id,
                        tipo: 'pago',
                        fecha: fechaPago,
                        montoTotal: periodo.cuota,
                        montoCapital: periodo.capital,
                        montoInteres: periodo.interes,
                        montoInteresAjuste: 0,
                        notas: `Pago histórico periodo ${periodo.periodo}`,
                    },
                }),
                db.transaccion.create({
                    data: {
                        fecha: fechaPago,
                        monto: periodo.capital,
                        descripcion: `Pago capital histórico ${instrumento.nombre} (periodo ${periodo.periodo})`,
                        tipo: 'transferencia',
                        cuentaOrigenId: data.cuentaOrigenId,
                        cuentaDestinoId: instrumento.cuentaId,
                    },
                }),
            );

            if (periodo.interes > 0) {
                operations.push(
                    db.transaccion.create({
                        data: {
                            fecha: fechaPago,
                            monto: periodo.interes,
                            descripcion: `Intereses históricos ${instrumento.nombre} (periodo ${periodo.periodo})`,
                            tipo: 'gasto',
                            cuentaOrigenId: data.cuentaOrigenId,
                            categoriaId: categoriaCosto.id,
                        },
                    }),
                );
            }
        }

        await db.$transaction(operations);

        const saldoInsolutoActual = tabla[data.numeroPagos - 1]?.saldo ?? 0;

        return {
            pagosRegistrados: data.numeroPagos,
            capitalAmortizado: Number(capitalAmortizado.toFixed(2)),
            interesesPagados: Number(interesesPagados.toFixed(2)),
            saldoInsolutoActual: Number(saldoInsolutoActual.toFixed(2)),
        };
    }

    async archivarInstrumento(id: string) {
        await db.instrumento.update({
            where: { id },
            data: { activo: false },
        });
    }

    async obtenerTabla(id: string, desdePeriodo?: number): Promise<AmortizacionPeriodo[]> {
        const instrumento = await db.instrumento.findUnique({ where: { id } });
        if (!instrumento) {
            throw new AppError('Instrumento no encontrado', 404);
        }
        if (instrumento.subtipo !== 'tasa_fija') {
            throw new AppError(
                'Solo los instrumentos de tasa fija tienen tabla de amortización',
                400,
            );
        }

        const tabla = this.calcularTablaAmortizacion(instrumento);
        if (desdePeriodo && desdePeriodo > 1) {
            return tabla.filter((p) => p.periodo >= desdePeriodo);
        }
        return tabla;
    }

    async proyeccionPrepago(id: string, abonoExtra: number): Promise<ProyeccionPrepago> {
        const instrumento = await db.instrumento.findUnique({ where: { id } });
        if (!instrumento) {
            throw new AppError('Instrumento no encontrado', 404);
        }
        if (instrumento.subtipo !== 'tasa_fija') {
            throw new AppError(
                'La proyección de prepago solo aplica a instrumentos de tasa fija',
                400,
            );
        }

        this.ensureTasaFijaCampos(instrumento);
        const capitalInicial = Number(instrumento.capitalInicial);
        const tablaOriginal = this.calcularTablaAmortizacion(instrumento);
        const { saldoInsoluto, pagos } = await this.calcularSaldoTasaFija(
            instrumento.id,
            capitalInicial,
        );

        const periodoActual = pagos.length;
        const interesesRestantesOriginal = tablaOriginal
            .slice(periodoActual)
            .reduce((sum, p) => sum + p.interes, 0);

        const periodicidadDias = Number(instrumento.periodicidadDias);
        const tasaAnual = Number(instrumento.tasaAnual);
        const tasaPeriodo = tasaAnual / (365 / periodicidadDias);
        const cuota = tablaOriginal[0]?.cuota ?? 0;

        let saldo = Math.max(0, saldoInsoluto - abonoExtra);
        const hoy = new Date();
        const fechaBase =
            instrumento.fechaInicio instanceof Date
                ? instrumento.fechaInicio
                : new Date(instrumento.fechaInicio ?? hoy);

        const tablaNueva: AmortizacionPeriodo[] = [];
        let i = 1;
        while (saldo > 0.01) {
            const interes = saldo * tasaPeriodo;
            let capital = cuota - interes;
            if (capital <= 0) {
                throw new AppError(
                    'La cuota es insuficiente para amortizar el capital con la tasa actual',
                    400,
                );
            }
            if (capital > saldo) {
                capital = saldo;
            }
            saldo = saldo - capital;

            const fechaCuota = new Date(
                fechaBase.getTime() +
                    (periodoActual + i) * periodicidadDias * 24 * 60 * 60 * 1000,
            );

            tablaNueva.push({
                periodo: periodoActual + i,
                fecha: fechaCuota.toISOString().slice(0, 10),
                cuota: Number(cuota.toFixed(2)),
                interes: Number(interes.toFixed(2)),
                capital: Number(capital.toFixed(2)),
                saldo: Number(saldo.toFixed(2)),
            });
            i++;
            if (i > 600) break;
        }

        const interesesRestantesConPrepago = tablaNueva.reduce(
            (sum, p) => sum + p.interes,
            0,
        );

        const fechaLiquidacionOriginal =
            tablaOriginal[tablaOriginal.length - 1]?.fecha ?? null;
        const fechaLiquidacionConPrepago =
            tablaNueva[tablaNueva.length - 1]?.fecha ??
            fechaLiquidacionOriginal ??
            new Date().toISOString().slice(0, 10);

        return {
            fechaLiquidacionOriginal,
            fechaLiquidacionConPrepago,
            interesesRestantesOriginal: Number(
                interesesRestantesOriginal.toFixed(2),
            ),
            interesesRestantesConPrepago: Number(
                interesesRestantesConPrepago.toFixed(2),
            ),
            interesesAhorrados: Number(
                (interesesRestantesOriginal - interesesRestantesConPrepago).toFixed(2),
            ),
        };
    }

    async registrarPagoCredito(
        id: string,
        data: {
            fecha: string;
            montoTotal: number;
            cuentaOrigenId: string;
            montoInteresAjuste?: number;
            notas?: string | null;
        },
    ) {
        const instrumento = await db.instrumento.findUnique({ where: { id } });
        if (!instrumento) {
            throw new AppError('Instrumento no encontrado', 404);
        }
        if (instrumento.tipo !== 'credito' || instrumento.subtipo !== 'tasa_fija') {
            throw new AppError(
                'El registro de pago solo está soportado para créditos de tasa fija',
                400,
            );
        }

        this.ensureTasaFijaCampos(instrumento);

        const cuentaOrigen = await db.cuenta.findFirst({
            where: { id: data.cuentaOrigenId, activa: true },
        });
        if (!cuentaOrigen) {
            throw new AppError('La cuenta de origen no existe o no está activa', 400);
        }

        const cuentaCredito = await db.cuenta.findFirst({
            where: { id: instrumento.cuentaId, activa: true },
        });
        if (!cuentaCredito) {
            throw new AppError(
                'La cuenta asociada al crédito no existe o no está activa',
                400,
            );
        }

        const capitalInicial = Number(instrumento.capitalInicial);
        const tabla = this.calcularTablaAmortizacion(instrumento);
        const { pagos } = await this.calcularSaldoTasaFija(instrumento.id, capitalInicial);

        const periodoActual = pagos.length;
        if (periodoActual >= tabla.length) {
            throw new AppError('El crédito ya está completamente pagado', 400);
        }

        const cuotaPeriodo = tabla[periodoActual];
        const montoCapital = cuotaPeriodo.capital;
        const montoInteres = cuotaPeriodo.interes;
        const montoInteresAjuste = data.montoInteresAjuste ?? 0;

        const fechaPago = new Date(data.fecha);

        const categoriaCosto = await this.obtenerOCrearCategoriaCostoFinanciero();

        const [movimiento, transCapital, transInteres] = await db.$transaction([
            db.movimientoInstrumento.create({
                data: {
                    instrumentoId: instrumento.id,
                    tipo: 'pago',
                    fecha: fechaPago,
                    montoTotal: data.montoTotal,
                    montoCapital,
                    montoInteres,
                    montoInteresAjuste,
                    notas: data.notas ?? null,
                },
            }),
            db.transaccion.create({
                data: {
                    fecha: fechaPago,
                    monto: montoCapital,
                    descripcion: `Pago capital ${instrumento.nombre}`,
                    tipo: 'transferencia',
                    cuentaOrigenId: data.cuentaOrigenId,
                    cuentaDestinoId: instrumento.cuentaId,
                },
            }),
            db.transaccion.create({
                data: {
                    fecha: fechaPago,
                    monto: montoInteres + montoInteresAjuste,
                    descripcion: `Intereses ${instrumento.nombre}`,
                    tipo: 'gasto',
                    cuentaOrigenId: data.cuentaOrigenId,
                    categoriaId: categoriaCosto.id,
                },
            }),
        ]);

        // Vincular el movimiento con la transacción de capital
        const movimientoConTransaccion = await db.movimientoInstrumento.update({
            where: { id: movimiento.id },
            data: { transaccionId: transCapital.id },
        });

        return {
            movimiento: movimientoConTransaccion,
            transacciones: {
                capital: transCapital,
                interes: transInteres,
            },
        };
    }

    async registrarAjusteVariable(
        id: string,
        data: { montoReal: number; fecha?: string; notas?: string | null },
    ) {
        const instrumento = await db.instrumento.findUnique({ where: { id } });
        if (!instrumento) {
            throw new AppError('Instrumento no encontrado', 404);
        }
        if (instrumento.tipo !== 'inversion' || instrumento.subtipo !== 'tasa_variable') {
            throw new AppError(
                'El ajuste solo está soportado para inversiones de tasa variable',
                400,
            );
        }

        const { saldoActual } = await this.calcularSaldoVariable(instrumento);
        const diferencia = data.montoReal - saldoActual;
        const fecha = data.fecha ? new Date(data.fecha) : new Date();

        if (Math.abs(diferencia) < 0.01) {
            return {
                diferencia: 0,
                saldoSistema: Number(saldoActual.toFixed(2)),
                movimiento: null,
                transaccion: null,
            };
        }

        const tipoMovimiento = diferencia > 0 ? 'ajuste' : 'rescate';
        const montoAjuste = Math.abs(diferencia);

        const [movimiento] = await db.$transaction([
            db.movimientoInstrumento.create({
                data: {
                    instrumentoId: instrumento.id,
                    tipo: tipoMovimiento,
                    fecha,
                    montoTotal: montoAjuste,
                    notas: data.notas ?? `Rendimientos capitalizados ${fecha.toISOString().slice(0, 10)}`,
                },
            }),
        ]);

        // Nota: por ahora no generamos transacción en la tabla `transacciones` para no
        // interferir con la lógica de saldos de cuentas existente.

        return {
            diferencia: Number(diferencia.toFixed(2)),
            saldoSistema: Number(saldoActual.toFixed(2)),
            movimiento,
            transaccion: null,
        };
    }

    private async obtenerOCrearCategoriaCapitalInicial() {
        const existente = await db.categoria.findFirst({
            where: { nombre: 'Capital inicial', tipo: 'ingreso' },
        });
        if (existente) return existente;

        return db.categoria.create({
            data: {
                nombre: 'Capital inicial',
                tipo: 'ingreso',
                color: '#059669',
                icono: 'trending-up',
            },
        });
    }

    private async obtenerOCrearCategoriaCostoFinanciero() {
        const existente = await db.categoria.findFirst({
            where: { nombre: 'Costo financiero', tipo: 'gasto' },
        });
        if (existente) return existente;

        const creada = await db.categoria.create({
            data: {
                nombre: 'Costo financiero',
                tipo: 'gasto',
                color: '#4B5563',
                icono: 'percent',
            },
        });
        return creada;
    }
}

