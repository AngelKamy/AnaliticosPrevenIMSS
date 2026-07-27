/**
 * catalog_2022.js
 * ---------------
 * Catálogo de indicadores del Manual Metodológico de Indicadores Médicos (MMIM) 2022.
 *
 * IMPORTANTE: El orden de `indicadores[]` debe coincidir EXACTAMENTE con el orden
 * de los valores en `datosProductividad[año][mes][i].indicador[]` de JSONprod.js
 * para los periodos que aplican MMIM 2022 (hasta Agosto 2025 inclusive).
 *
 * Estructura de cada indicador:
 *   {
 *     clave: string,            // ej. "DM 01"
 *     nombre: string,           // texto largo del indicador
 *     activo: boolean,          // si se muestra hoy en el dashboard
 *     decimales: number,        // dígitos decimales a mostrar
 *     rangos: {
 *       tipo: "mayor_es_mejor" | "menor_es_mejor" | "intervalo_optimo",
 *       porPeriodo?: { "Enero": {umbralSuperior, umbralInferior, valorMinimoRojo?}, ... },
 *       default?:    { umbralSuperior, umbralInferior, valorMinimoRojo? }
 *     }
 *   }
 *
 * Los umbrales se conservaron tal cual venían en configuracionIndicadores de JSONprod.js
 * (que ya estaban afinados a la operación de Hidalgo). En general no se replican aquí
 * los 12 meses si los umbrales son iguales; basta con `rangos.default`.
 */

// Atajo: muchos indicadores manejan los mismos umbrales todo el año.
// Definirlos una vez evita repetir 12 veces lo mismo.
const r = (umbralSuperior, umbralInferior, extras = {}) => ({
  umbralSuperior, umbralInferior, ...extras
});

export const CATALOG_2022 = {
  version: "2022",
  vigenciaDesde: "2022-01",
  vigenciaHasta: "2025-08",
  fuente: "Manual Metodológico de Indicadores Médicos 2022",

  indicadores: [
    // idx 0
    {
      clave: "CTE 01",
      nombre: "Productividad de Chequeo PrevenIMSS por personal de Enfermería",
      activo: true,
      decimales: 1,
      rangos: {
        tipo: "intervalo_optimo",
        default: r(20, 14, { valorMinimoRojo: 10 })
      }
    },
    // idx 1
    {
      clave: "API %",
      nombre: "Porcentaje API",
      activo: true,
      decimales: 1,
      rangos: { tipo: "mayor_es_mejor", default: r(95, 90) }
    },
    // idx 2
    {
      clave: "API/AC",
      nombre: "Índice de API / Atención Curativa",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(10, 3.5) }
    },
    // idx 3
    {
      clave: "CUPN 01",
      nombre: "Cobertura de Chequeo PrevenIMSS",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(5.9, 5.4) }
    },
    // idx 4
    {
      clave: "CACU 01",
      nombre: "Cobertura de tamizaje de primera vez de Cáncer Cérvico Uterino en mujeres entre 25 y 64 años",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(2.50, 1.91) }
    },
    // idx 5
    {
      clave: "CACU 05",
      nombre: "Tasa de incidencia de displasia cervical leve o moderada, en mujeres de 25 años y más",
      activo: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(80, 50) }
    },
    // idx 6
    {
      clave: "CACU 06",
      nombre: "Tasa de incidencia de displasia cervical severa y CaCu in situ, en derechohabientes de +25 años",
      activo: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(8, 5) }
    },
    // idx 7
    {
      clave: "CAMAma 01",
      nombre: "Cobertura de mastografía de tamizaje de primera vez en mujeres entre 40 y 49 años",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(1.5, 1.0) }
    },
    // idx 8
    {
      clave: "CAMAma 02",
      nombre: "Cobertura de mastografía de tamizaje de primera vez en mujeres entre 50 y 69 años",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(2.5, 2.0) }
    },
    // idx 9
    {
      clave: "CACU 04",
      nombre: "Tasa de incidencia de Cáncer Cérvico Uterino en mujeres de 25 años y más",
      activo: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(15, 10) }
    },
    // idx 10
    {
      clave: "CAMAma 06",
      nombre: "Tasa de incidencia de cáncer de Mama en mujeres derechohabientes de 25 años y más",
      activo: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(50, 30) }
    },
    // idx 11
    {
      clave: "Mort. CaCu",
      nombre: "Tasa de mortalidad por cáncer cervicouterino ♀ 20 años y más",
      activo: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(15, 10) }
    },
    // idx 12
    {
      clave: "CAMAma 09",
      nombre: "Tasa de mortalidad por Cáncer de Mama en mujeres derechohabientes de 25 años y más",
      activo: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(20, 14) }
    },
    // idx 13
    {
      clave: "DM 01",
      nombre: "Cobertura de detección de primera de Diabetes Mellitus en población derechohabiente 20+",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(15, 12) }
    },
    // idx 14
    {
      clave: "DM 02",
      nombre: "Índice de confirmación de Diabetes Mellitus en casos sospechosos, derechohabientes de +20 años",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(20, 15) }
    },
    // idx 15
    {
      clave: "DM 04",
      nombre: "Porcentaje de pacientes con Diabetes Mellitus de +20 años, en control adecuado",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(45, 35) }
    },
    // idx 16
    {
      clave: "DM 03",
      nombre: "Tasa de incidencia de Diabetes Mellitus en derechohabientes de +20 años",
      activo: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(450, 300) }
    },
    // idx 17
    {
      clave: "EH 01",
      nombre: "Cobertura de detección de Hipertensión Arterial en derechohabientes de +20 años",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(15, 12) }
    },
    // idx 18
    {
      clave: "EH 02",
      nombre: "Índice de confirmación de Hipertensión Arterial en casos sospechosos derechohabientes de +20 años",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(20, 15) }
    },
    // idx 19
    {
      clave: "EH 04",
      nombre: "Porcentaje de pacientes de +20 años en control de Hipertensión Arterial en medicina familiar",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(45, 35) }
    },
    // idx 20
    {
      clave: "EH 03",
      nombre: "Tasa de incidencia de Enfermedades Hipertensivas en derechohabientes de +20 años",
      activo: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(450, 300) }
    },
    // idx 21
    {
      clave: "Mort. DM",
      nombre: "Tasa de mortalidad por diabetes mellitus DH 20 años y más",
      activo: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(80, 60) }
    },
    // idx 22
    {
      clave: "Mort. HTA",
      nombre: "Tasa de mortalidad por enfermedades hipertensivas DH 20 años y más",
      activo: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(35, 25) }
    },
    // idx 23
    {
      clave: "CUPN 03",
      nombre: "Cobertura con esquemas completos de vacunación en niños de un año de edad",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(95, 90) }
    },
    // idx 24
    {
      clave: "Tamiz Neonatal",
      nombre: "Cobertura de detección de Tamiz Neonatal (SIAIS)",
      activo: false, // reserva: ya no se requiere reportar (acuerdo OOAD Hidalgo Nov 2025)
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(95, 90) }
    },
    // idx 25
    {
      clave: "CTE 02",
      nombre: "Productividad de Atención Integral por personal de Enfermería Especialista en Medicina de Familia",
      activo: true,
      decimales: 1,
      rangos: {
        tipo: "intervalo_optimo",
        default: r(20, 14, { valorMinimoRojo: 10 })
      }
    }
  ]
};
