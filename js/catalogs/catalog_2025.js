/**
 * catalog_2025.js
 * ---------------
 * Catálogo de indicadores del Manual Metodológico de Indicadores Médicos (MMIM) 2025,
 * más extras del OOAD Hidalgo (indicadores que se siguen calculando aunque no
 * estén en el manual oficial 2025).
 *
 * ESTRUCTURA REORGANIZADA (acordado con OOAD Hidalgo):
 *   - Agrupado por proceso salud-enfermedad
 *   - Dentro de cada bloque: primero los indicadores oficiales MMIM 2025,
 *     luego los "extras Hidalgo" (incidencias, mortalidades, etc.)
 *   - Total: 24 activos + 2 reservas (inactivos pero pre-listados)
 *
 * Cada indicador trae:
 *   - clave:       identificador corto (ej. "DM 01", "DM-Mort")
 *   - nombre:      texto completo
 *   - grupo:       categoría temática
 *   - activo:      true = aparece en sidebar; false = reservado para activar después
 *   - extra:       true = no es indicador oficial MMIM 2025 (es extra Hidalgo)
 *   - decimales:   dígitos decimales a mostrar
 *   - rangos:      tipo de evaluación + umbrales
 *
 * IMPORTANTE: El ORDEN de este array es el contrato con JSONprod.js para
 * periodos a partir de Septiembre 2025. La posición i en el array de datos
 * corresponde a la posición i en este catálogo.
 */

// Atajo para no repetir 12 veces los mismos umbrales mensuales
const r = (umbralSuperior, umbralInferior, extras = {}) => ({
  umbralSuperior, umbralInferior, ...extras
});

export const CATALOG_2025 = {
  version: "2025",
  vigenciaDesde: "2025-09",
  vigenciaHasta: null,
  fuente: "Manual Metodológico de Indicadores Médicos 2025 + extras OOAD Hidalgo",

  indicadores: [
    // ============================================================
    // BLOQUE 1: DIABETES MELLITUS
    // ============================================================
    {
      // idx 0
      clave: "DM 01",
      nombre: "Cobertura de detección de primera vez de DM en DH 20 años y más",
      grupo: "Diabetes Mellitus",
      activo: true,
      extra: false,
      decimales: 2,
      // Rangos mensuales acumulados del MMIM 2025
      rangos: {
        tipo: "mayor_es_mejor",
        porPeriodo: {
          "Enero":      r(5.3, 4.8),
          "Febrero":    r(10.5, 9.7),
          "Marzo":      r(15.8, 14.5),
          "Abril":      r(21.0, 19.3),
          "Mayo":       r(26.3, 24.1),
          "Junio":      r(31.5, 28.9),
          "Julio":      r(36.8, 33.8),
          "Agosto":     r(42.0, 38.6),
          "Septiembre": r(47.3, 43.4),
          "Octubre":    r(52.5, 48.2),
          "Noviembre":  r(57.8, 53.0),
          "Diciembre":  r(63.0, 57.9)
        }
      }
    },
    {
      // idx 1
      clave: "DM 02",
      nombre: "Índice de confirmación de DM en casos sospechosos (DH 20 años y más)",
      grupo: "Diabetes Mellitus",
      activo: true,
      extra: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(25, 20) }
    },
    {
      // idx 2
      clave: "DM 03",
      nombre: "Porcentaje de pacientes en control de Diabetes Mellitus",
      grupo: "Diabetes Mellitus",
      activo: true,
      extra: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(45, 35) }
    },
    {
      // idx 3
      clave: "DM-Inc",
      nombre: "Tasa de incidencia de DM en DH 20 años y más",
      grupo: "Diabetes Mellitus",
      activo: true,
      extra: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(450, 300) }
    },
    {
      // idx 4
      clave: "DM-Mort",
      nombre: "Tasa de mortalidad por diabetes mellitus DH 20 años y más",
      grupo: "Diabetes Mellitus",
      activo: true,
      extra: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(80, 60) }
    },

    // ============================================================
    // BLOQUE 2: ENFERMEDADES HIPERTENSIVAS
    // ============================================================
    {
      // idx 5
      clave: "EH 01",
      nombre: "Cobertura de detección de primera vez de HTA en DH 20 años y más",
      grupo: "Enfermedades Hipertensivas",
      activo: true,
      extra: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(15, 12) }
    },
    {
      // idx 6
      clave: "EH 02",
      nombre: "Porcentaje de pacientes en control de enfermedad hipertensiva",
      grupo: "Enfermedades Hipertensivas",
      activo: true,
      extra: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(45, 35) }
    },
    {
      // idx 7
      clave: "HTA-Conf",
      nombre: "Índice de confirmación de casos sospechosos de HTA (DH 20 años y más)",
      grupo: "Enfermedades Hipertensivas",
      activo: true,
      extra: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(20, 15) }
    },
    {
      // idx 8
      clave: "HTA-Inc",
      nombre: "Tasa de incidencia de enfermedades hipertensivas en DH 20 años y más",
      grupo: "Enfermedades Hipertensivas",
      activo: true,
      extra: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(450, 300) }
    },
    {
      // idx 9
      clave: "HTA-Mort",
      nombre: "Tasa de mortalidad por enfermedades hipertensivas DH 20 años y más",
      grupo: "Enfermedades Hipertensivas",
      activo: true,
      extra: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(35, 25) }
    },

    // ============================================================
    // BLOQUE 3: CÁNCER DE MAMA
    // ============================================================
    {
      // idx 10
      clave: "CAMA 01",
      nombre: "Cobertura de detección de CaMa por mastografía ♀ 40-69 años",
      grupo: "Cáncer de Mama",
      activo: true,
      extra: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(4.0, 3.0) }
    },
    {
      // idx 11
      clave: "CaMa-Inc",
      nombre: "Tasa de incidencia por cáncer de mama ♀ 25 años y más",
      grupo: "Cáncer de Mama",
      activo: true,
      extra: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(50, 30) }
    },
    {
      // idx 12
      clave: "CaMa-Mort",
      nombre: "Tasa de mortalidad por cáncer de mama ♀ 20 años y más",
      grupo: "Cáncer de Mama",
      activo: true,
      extra: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(20, 14) }
    },

    // ============================================================
    // BLOQUE 4: CÁNCER CÉRVICO-UTERINO
    // ============================================================
    {
      // idx 13
      clave: "CACU 01",
      nombre: "Cobertura de tamizaje de primera vez de CaCu ♀ 25-64 años",
      grupo: "Cáncer Cérvico-Uterino",
      activo: true,
      extra: false,
      decimales: 2,
      // MMIM 2025: ≥27.0 esperado, 20.5–27.0 medio, ≤20.5 bajo (anual acumulado)
      rangos: { tipo: "mayor_es_mejor", default: r(27.0, 20.5) }
    },
    {
      // idx 14
      clave: "CaCu-DispLM",
      nombre: "Tasa de incidencia de displasia leve/moderada ♀ 25 años y más",
      grupo: "Cáncer Cérvico-Uterino",
      activo: true,
      extra: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(80, 50) }
    },
    {
      // idx 15
      clave: "CaCu-DispSev",
      nombre: "Tasa de incidencia de displasia severa y CaCu in situ ♀ 25 años y más",
      grupo: "Cáncer Cérvico-Uterino",
      activo: true,
      extra: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(8, 5) }
    },
    {
      // idx 16
      clave: "CaCu-Inc",
      nombre: "Tasa de incidencia por cáncer cervicouterino ♀ 25 años y más",
      grupo: "Cáncer Cérvico-Uterino",
      activo: true,
      extra: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(15, 10) }
    },
    {
      // idx 17
      clave: "CaCu-Mort",
      nombre: "Tasa de mortalidad por cáncer cervicouterino ♀ 20 años y más",
      grupo: "Cáncer Cérvico-Uterino",
      activo: true,
      extra: true,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(15, 10) }
    },

    // ============================================================
    // BLOQUE 5: CALIDAD PRIMER NIVEL
    // ============================================================
    {
      // idx 18
      clave: "CUPN 01",
      nombre: "Cobertura de acciones preventivas PrevenIMSS",
      grupo: "Calidad Primer Nivel",
      activo: true,
      extra: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(5.9, 5.4) }
    },
    {
      // idx 19
      clave: "CUPN 02",
      nombre: "Esquemas completos de vacunación en niños de 1 año (DH)",
      grupo: "Calidad Primer Nivel",
      activo: true,
      extra: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(95, 90) }
    },

    // ============================================================
    // BLOQUE 6: COORDINACIÓN ENFERMERÍA
    // ============================================================
    {
      // idx 20
      clave: "CE 01",
      nombre: "Productividad de chequeo PrevenIMSS por personal de Enfermería",
      grupo: "Coordinación Enfermería",
      activo: true,
      extra: false,
      decimales: 1,
      rangos: {
        tipo: "intervalo_optimo",
        default: r(20, 14, { valorMinimoRojo: 10 })
      }
    },
    {
      // idx 21
      clave: "CE 02",
      nombre: "Evaluación Integral de Enfermería Especialista en Medicina Familiar",
      grupo: "Coordinación Enfermería",
      activo: true,
      extra: false,
      decimales: 1,
      rangos: {
        tipo: "intervalo_optimo",
        default: r(20, 14, { valorMinimoRojo: 10 })
      }
    },

    // ============================================================
    // BLOQUE 7: ATENCIÓN PREVENTIVA (extras Hidalgo)
    // ============================================================
    {
      // idx 22
      clave: "API%",
      nombre: "Porcentaje de Atención Preventiva Integrada (API)",
      grupo: "Atención Preventiva",
      activo: true,
      extra: true,
      decimales: 1,
      rangos: { tipo: "mayor_es_mejor", default: r(95, 90) }
    },
    {
      // idx 23
      clave: "API/AC",
      nombre: "Índice de Atención Preventiva Integrada / Atención Curativa",
      grupo: "Atención Preventiva",
      activo: true,
      extra: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(10, 3.5) }
    },

    // ============================================================
    // BLOQUE 8: RESERVAS (inactivos, listos para activar)
    // ============================================================
    {
      // idx 24
      clave: "CE 02b",
      nombre: "Evaluación Integral de Enfermería General Clínica",
      grupo: "Reservas",
      activo: false, // reserva: cambiar a true cuando se empiece a calcular
      extra: true,
      decimales: 1,
      rangos: {
        tipo: "intervalo_optimo",
        default: r(20, 14, { valorMinimoRojo: 10 })
      }
    },
    {
      // idx 25
      clave: "TamizNeo",
      nombre: "Cobertura de detección de Tamiz Neonatal (SIAIS)",
      grupo: "Reservas",
      activo: false, // reserva: ya no se requiere en MMIM 2025
      extra: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(95, 90) }
    }
  ]
};
