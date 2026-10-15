// Dataset extendido de socios de prueba para la pantalla "Deudores & Cuotas".
// Se usa como fallback cuando el backend no está disponible (modo mock/demo)
// y como padrón completo para que la búsqueda y los filtros muestren a TODOS
// los socios de prueba, no solo a los que tienen deuda activa.
//
// Casos cubiertos:
//   1. Socio Deudor Crítico  -> 6 cuotas adeudadas + 25% de mora
//   2. Socio Jubilado        -> 3 cuotas adeudadas, 50% de exención, mora sobre el subtotal
//   3. Socio Reciente        -> 1 cuota del mes actual, sin mora
//   4. Socio Staff/Profesor  -> 100% exención, no genera deuda
//   5. Socio al Día          -> sin deudas pendientes

/**
 * Monto base de la cuota social usado para calcular los importes del mock.
 * Coincide con el valor por defecto del módulo de configuración de cuotas.
 */
export const MOCK_BASE_FEE_AMOUNT = 15000;

/** Porcentaje de mora aplicado al socio deudor crítico. */
export const MOCK_CRITICAL_LATE_FEE_PERCENTAGE = 25;

/** Porcentaje de exención del socio jubilado. */
export const MOCK_RETIRED_DISCOUNT_PERCENTAGE = 50;

/**
 * Calcula el monto adeudado de un socio aplicando la exención correspondiente
 * y, opcionalmente, la mora sobre el subtotal ya bonificado.
 *
 * @param cuotas          Cantidad de cuotas adeudadas.
 * @param discountPct     Porcentaje de exención (0-100).
 * @param lateFeePct      Porcentaje de mora (0-100). Se aplica sobre el subtotal.
 */
export const calcularMontoAdeudado = (
  cuotas: number,
  discountPct = 0,
  lateFeePct = 0,
): number => {
  if (cuotas <= 0) return 0;
  const subtotal = cuotas * MOCK_BASE_FEE_AMOUNT;
  const conExencion = subtotal * (1 - discountPct / 100);
  const conMora = conExencion * (1 + lateFeePct / 100);
  return Math.round(conMora);
};

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Períodos ("Mes Año") de los últimos `cantidad` meses, ordenados del más
 * antiguo al más reciente. Se usa para simular cuotas vencidas y que la
 * pantalla calcule los días de atraso reales con `calcularDiasMora`.
 */
const periodosUltimosMeses = (cantidad: number): string[] => {
  const hoy = new Date();
  const periodos: string[] = [];
  for (let i = cantidad; i >= 1; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    periodos.push(`${MESES[d.getMonth()]} ${d.getFullYear()}`);
  }
  return periodos;
};

/** Mes actual en formato "Mes Año" (ej. "Septiembre 2026"). */
const mesActual = (): string => {
  const hoy = new Date();
  return `${MESES[hoy.getMonth()]} ${hoy.getFullYear()}`;
};

/**
 * Socio del padrón de prueba usado por el dataset mock.
 * Mantiene la forma de `CuotaVencida` más los campos de exención/mora.
 */
export interface DebtorUser {
  socioId: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
  /** Cuotas adeudadas del socio (0 = sin deuda / exento / al día). */
  cuotasAdeudadas: string[];
  cantidadCuotasImpagas: number;
  periodosVencidos: string[];
  montoTotalAdeudado: number;
  diasDeAtraso: number;
  paymentIds: number[];
  esAutoBloqueado: boolean;
  esBloqueadoManual: boolean;
  estaBloqueado: boolean;
  /** Porcentaje de exención aplicado al socio (0-100). 100 = no genera deuda. */
  exencionPorcentaje: number;
  /** Porcentaje de mora aplicado sobre el subtotal bonificado (0-100). */
  moraPorcentaje: number;
  /** Situación consolidada del socio para filtros y badges. */
  estadoCuota: 'EN_MORA' | 'PENDIENTE' | 'AL_DIA' | 'EXENTO';
  /** Motivo de la exención (ej. "Jubilado", "Staff"). */
  motivoExencion?: string;
}

/**
 * Padrón extendido de socios de prueba para la pantalla "Deudores & Cuotas".
 *
 * Los socios sin deuda (Staff 100% exento y Al Día) se incluyen con
 * `cuotasAdeudadas: []`, `cantidadCuotasImpagas: 0` y `montoTotalAdeudado: 0`
 * para que puedan encontrarse desde el buscador y verse con el filtro "Todos".
 */
export const MOCK_DEBTORS: DebtorUser[] = [
  // 1) Socio Deudor Crítico — 6 cuotas adeudadas + mora del 25%
  {
    socioId: 1001,
    nombre: 'Roberto',
    apellido: 'Gómez',
    email: 'roberto.gomez@club.com',
    telefono: '+54 9 11 4011-2233',
    dni: '28456789',
    cuotasAdeudadas: periodosUltimosMeses(6),
    cantidadCuotasImpagas: 6,
    periodosVencidos: periodosUltimosMeses(6),
    montoTotalAdeudado: calcularMontoAdeudado(6, 0, MOCK_CRITICAL_LATE_FEE_PERCENTAGE),
    diasDeAtraso: 0,
    paymentIds: [91001, 91002, 91003, 91004, 91005, 91006],
    esAutoBloqueado: true,
    esBloqueadoManual: false,
    estaBloqueado: true,
    exencionPorcentaje: 0,
    moraPorcentaje: MOCK_CRITICAL_LATE_FEE_PERCENTAGE,
    estadoCuota: 'EN_MORA',
  },

  // 2) Socio Jubilado — 50% de exención + 3 cuotas con mora sobre el subtotal
  {
    socioId: 1002,
    nombre: 'Beatriz',
    apellido: 'Fernández',
    email: 'beatriz.fernandez@club.com',
    telefono: '+54 9 11 4022-4455',
    dni: '14234567',
    cuotasAdeudadas: periodosUltimosMeses(3),
    cantidadCuotasImpagas: 3,
    periodosVencidos: periodosUltimosMeses(3),
    montoTotalAdeudado: calcularMontoAdeudado(3, MOCK_RETIRED_DISCOUNT_PERCENTAGE, 10),
    diasDeAtraso: 0,
    paymentIds: [92001, 92002, 92003],
    esAutoBloqueado: false,
    esBloqueadoManual: false,
    estaBloqueado: false,
    exencionPorcentaje: MOCK_RETIRED_DISCOUNT_PERCENTAGE,
    moraPorcentaje: 10,
    estadoCuota: 'EN_MORA',
    motivoExencion: 'Jubilado',
  },

  // 3) Socio Reciente — 1 cuota del mes actual, sin mora
  {
    socioId: 1003,
    nombre: 'Lucas',
    apellido: 'Martínez',
    email: 'lucas.martinez@club.com',
    telefono: '+54 9 11 4033-6677',
    dni: '38990112',
    cuotasAdeudadas: [mesActual()],
    cantidadCuotasImpagas: 1,
    periodosVencidos: [mesActual()],
    montoTotalAdeudado: calcularMontoAdeudado(1, 0, 0),
    diasDeAtraso: 0,
    paymentIds: [93001],
    esAutoBloqueado: false,
    esBloqueadoManual: false,
    estaBloqueado: false,
    exencionPorcentaje: 0,
    moraPorcentaje: 0,
    estadoCuota: 'PENDIENTE',
  },

  // 4) Socio Staff / Profesor — 100% exención, no genera deuda
  {
    socioId: 1004,
    nombre: 'Mariana',
    apellido: 'López',
    email: 'mariana.lopez@club.com',
    telefono: '+54 9 11 4044-8899',
    dni: '33444555',
    cuotasAdeudadas: [],
    cantidadCuotasImpagas: 0,
    periodosVencidos: [],
    montoTotalAdeudado: 0,
    diasDeAtraso: 0,
    paymentIds: [],
    esAutoBloqueado: false,
    esBloqueadoManual: false,
    estaBloqueado: false,
    exencionPorcentaje: 100,
    moraPorcentaje: 0,
    estadoCuota: 'EXENTO',
    motivoExencion: 'Staff',
  },

  // 5) Socio al Día — sin deudas pendientes
  {
    socioId: 1005,
    nombre: 'Gonzalo',
    apellido: 'Pérez',
    email: 'gonzalo.perez@club.com',
    telefono: '+54 9 11 4055-0011',
    dni: '35111222',
    cuotasAdeudadas: [],
    cantidadCuotasImpagas: 0,
    periodosVencidos: [],
    montoTotalAdeudado: 0,
    diasDeAtraso: 0,
    paymentIds: [],
    esAutoBloqueado: false,
    esBloqueadoManual: false,
    estaBloqueado: false,
    exencionPorcentaje: 0,
    moraPorcentaje: 0,
    estadoCuota: 'AL_DIA',
  },
];

/** Solo los socios que efectivamente tienen deuda activa. */
export const MOCK_DEBTORS_WITH_DEBT: DebtorUser[] = MOCK_DEBTORS.filter(
  (d: DebtorUser) => d.cuotasAdeudadas.length > 0,
);

