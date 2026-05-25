/**
 * catalog_2025.js
 * ---------------
 * Catálogo de indicadores del Manual Metodológico de Indicadores Médicos (MMIM) 2025.
 *
 * Contiene los 73 indicadores oficiales del MMIM 2025. Cada uno tiene una bandera
 * `activo: true | false`:
 *   - `activo: true`  -> se muestra en el sidebar y se espera que JSONprod.js tenga su valor.
 *   - `activo: false` -> entra como referencia. Para activarlo a futuro basta con:
 *        1) Cambiar `activo: false` -> `activo: true`
 *        2) Empezar a poblar su valor en `JSONprod.js` (la posición ya está reservada)
 *
 * El ORDEN de `indicadores[]` es el contrato con `JSONprod.js`:
 *   datosProductividad["2025"]["Septiembre"][i].indicador[idx]  ===  CATALOG_2025.indicadores[idx]
 *
 * Si en el futuro reordenan el catálogo, hay que reordenar también los arrays de datos
 * (o usar un mapeo explícito). NO insertar nada en medio sin ajustar JSONprod.js.
 *
 * Vigencia: desde Septiembre 2025 (decisión interna OOAD Hidalgo).
 *
 * NOTA: Los rangos de los indicadores INACTIVOS aún no se han transcrito del MMIM 2025
 * (se rellenarán cuando se activen). Los rangos de los ACTIVOS sí están cargados con
 * los valores que vienen en el manual; valídalos con tu equipo antes de pasar a prod.
 */

// Atajo para no repetir 12 veces los mismos umbrales mensuales
const r = (umbralSuperior, umbralInferior, extras = {}) => ({
  umbralSuperior, umbralInferior, ...extras
});

export const CATALOG_2025 = {
  version: "2025",
  vigenciaDesde: "2025-09",
  vigenciaHasta: null, // vigente
  fuente: "Manual Metodológico de Indicadores Médicos 2025",

  indicadores: [
    // ============================================================
    // DIABETES MELLITUS (DM 01 - DM 06)
    // ============================================================
    {
      // idx 0
      clave: "DM 01",
      nombre: "Cobertura de detección de diabetes en población derechohabiente de 20 años y más",
      grupo: "Diabetes Mellitus",
      activo: true,
      decimales: 2,
      // Rangos mensuales acumulados del MMIM 2025 (Esperado: ≥5.3 Ene, ≥10.5 Feb, etc.)
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
      nombre: "Índice de confirmación de diabetes en casos sospechosos",
      grupo: "Diabetes Mellitus",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(25, 20) }
    },
    {
      // idx 2
      clave: "DM 03",
      nombre: "Pacientes con diabetes en control glucémico (HbA1c ≤ 7%)",
      grupo: "Diabetes Mellitus",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(40, 30) }
    },
    {
      // idx 3
      clave: "DM 04",
      nombre: "Tasa de hospitalizaciones evitables por diabetes (20-74 años)",
      grupo: "Diabetes Mellitus",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(200, 150) }
    },
    {
      // idx 4
      clave: "DM 05",
      nombre: "Índice de amputación por complicación de diabetes",
      grupo: "Diabetes Mellitus",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(50, 30) }
    },
    {
      // idx 5
      clave: "DM 06",
      nombre: "Tasa de incidencia de invalidez por diabetes",
      grupo: "Diabetes Mellitus",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(15, 10) }
    },

    // ============================================================
    // ENFERMEDADES HIPERTENSIVAS (EH 01 - EH 04)
    // ============================================================
    {
      // idx 6
      clave: "EH 01",
      nombre: "Cobertura de detección de hipertensión arterial (DH ≥20 años)",
      grupo: "Enfermedades Hipertensivas",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(15, 12) }
    },
    {
      // idx 7
      clave: "EH 02",
      nombre: "Pacientes de 20 años o más en control de hipertensión en medicina familiar",
      grupo: "Enfermedades Hipertensivas",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(45, 35) }
    },
    {
      // idx 8
      clave: "EH 03",
      nombre: "Tasa de hospitalizaciones evitables por HTA (20-74 años)",
      grupo: "Enfermedades Hipertensivas",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(150, 100) }
    },
    {
      // idx 9
      clave: "EH 04",
      nombre: "Tasa de incidencia de invalidez por enfermedades hipertensivas",
      grupo: "Enfermedades Hipertensivas",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(15, 10) }
    },

    // ============================================================
    // CÁNCER DE MAMA (CAMA 01 - CAMA 04)
    // ============================================================
    {
      // idx 10
      clave: "CAMA 01",
      nombre: "Cobertura de detección de cáncer de mama por mastografía (40-69 años)",
      grupo: "Cáncer de Mama",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(4.0, 3.0) }
    },
    {
      // idx 11
      clave: "CAMA 02",
      nombre: "Tiempo promedio para diagnóstico de cáncer de mama",
      grupo: "Cáncer de Mama",
      activo: false,
      decimales: 1,
      rangos: { tipo: "menor_es_mejor", default: r(45, 30) }
    },
    {
      // idx 12
      clave: "CAMA 03",
      nombre: "Tiempo promedio para inicio de tratamiento de cáncer de mama",
      grupo: "Cáncer de Mama",
      activo: false,
      decimales: 1,
      rangos: { tipo: "menor_es_mejor", default: r(45, 30) }
    },
    {
      // idx 13
      clave: "CAMA 04",
      nombre: "Tasa de incidencia de invalidez por cáncer de mama",
      grupo: "Cáncer de Mama",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(50, 30) }
    },

    // ============================================================
    // CÁNCER CÉRVICO-UTERINO (CACU 01 - CACU 04)
    // ============================================================
    {
      // idx 14
      clave: "CACU 01",
      nombre: "Cobertura de tamizaje de primera vez de CaCu (25-64 años)",
      grupo: "Cáncer Cérvico-Uterino",
      activo: true,
      decimales: 2,
      // MMIM 2025: ≥27.0 esperado, 20.5–27.0 medio, ≤20.5 bajo (anual acumulado)
      rangos: { tipo: "mayor_es_mejor", default: r(27.0, 20.5) }
    },
    {
      // idx 15
      clave: "CACU 02",
      nombre: "Tiempo promedio para diagnóstico de CaCu",
      grupo: "Cáncer Cérvico-Uterino",
      activo: false,
      decimales: 1,
      rangos: { tipo: "menor_es_mejor", default: r(45, 30) }
    },
    {
      // idx 16
      clave: "CACU 03",
      nombre: "Tiempo promedio para inicio de tratamiento de CaCu",
      grupo: "Cáncer Cérvico-Uterino",
      activo: false,
      decimales: 1,
      rangos: { tipo: "menor_es_mejor", default: r(45, 30) }
    },
    {
      // idx 17
      clave: "CACU 04",
      nombre: "Tasa de incidencia de invalidez por cáncer cérvico-uterino",
      grupo: "Cáncer Cérvico-Uterino",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(15, 10) }
    },

    // ============================================================
    // SALUD MATERNA (Materna 01 - Materna 05)
    // ============================================================
    {
      // idx 18
      clave: "Materna 01",
      nombre: "Proporción de adolescentes embarazadas",
      grupo: "Salud Materna",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(15, 10) }
    },
    {
      // idx 19
      clave: "Materna 02",
      nombre: "Oportunidad de inicio de vigilancia prenatal",
      grupo: "Salud Materna",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(80, 70) }
    },
    {
      // idx 20
      clave: "Materna 03",
      nombre: "Porcentaje de preeclampsia-eclampsia",
      grupo: "Salud Materna",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(10, 7) }
    },
    {
      // idx 21
      clave: "Materna 04",
      nombre: "Cobertura de protección anticonceptiva posevento obstétrico",
      grupo: "Salud Materna",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(75, 65) }
    },
    {
      // idx 22
      clave: "Materna 05",
      nombre: "Porcentaje de prematurez (26 a 36.6 SDG)",
      grupo: "Salud Materna",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(12, 8) }
    },

    // ============================================================
    // SALUD NEONATAL (Neonatal 01 - Neonatal 06)
    // ============================================================
    {
      // idx 23
      clave: "Neonatal 01",
      nombre: "Seguimiento epidemiológico de errores en metabolismo congénito (EMC)",
      grupo: "Salud Neonatal",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(90, 80) }
    },
    {
      // idx 24
      clave: "Neonatal 02",
      nombre: "Lactancia materna exclusiva al egreso (≥37 SDG)",
      grupo: "Salud Neonatal",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(70, 60) }
    },
    {
      // idx 25
      clave: "Neonatal 03",
      nombre: "Proporción de prematuros con peso ≤ 1000 g",
      grupo: "Salud Neonatal",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(5, 3) }
    },
    {
      // idx 26
      clave: "Neonatal 04",
      nombre: "Sobrevida en prematuros con peso ≤ 1200 g",
      grupo: "Salud Neonatal",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(70, 60) }
    },
    {
      // idx 27
      clave: "Neonatal 05",
      nombre: "Letalidad por infecciones asociadas a la atención en salud en RN",
      grupo: "Salud Neonatal",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(15, 10) }
    },
    {
      // idx 28
      clave: "Neonatal 06",
      nombre: "Mortalidad por síndrome de dificultad respiratoria del RN",
      grupo: "Salud Neonatal",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(20, 15) }
    },

    // ============================================================
    // SOBREPESO Y OBESIDAD (S_Ob 01 - S_Ob 04)
    // ============================================================
    {
      // idx 29
      clave: "S_Ob 01",
      nombre: "Cobertura de medición de peso y talla (DH primer nivel)",
      grupo: "Sobrepeso y Obesidad",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(80, 70) }
    },
    {
      // idx 30
      clave: "S_Ob 02",
      nombre: "Proporción de obesidad en DH ≥20 años",
      grupo: "Sobrepeso y Obesidad",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(30, 25) }
    },
    {
      // idx 31
      clave: "S_Ob 03",
      nombre: "Proporción de obesidad grado III (IMC ≥ 40)",
      grupo: "Sobrepeso y Obesidad",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(5, 3) }
    },
    {
      // idx 32
      clave: "S_Ob 04",
      nombre: "Índice de confirmación diagnóstica de obesidad en medicina familiar",
      grupo: "Sobrepeso y Obesidad",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(60, 50) }
    },

    // ============================================================
    // CALIDAD UMF / CALIDAD PRIMER NIVEL (CUPN 01 - CUPN 07)
    // ============================================================
    {
      // idx 33
      clave: "CUPN 01",
      nombre: "Cobertura de acciones preventivas PrevenIMSS",
      grupo: "Calidad Primer Nivel",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(5.9, 5.4) }
    },
    {
      // idx 34
      clave: "CUPN 02",
      nombre: "Cobertura con esquemas completos de vacunación en niños de un año de edad",
      grupo: "Calidad Primer Nivel",
      activo: true,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(95, 90) }
    },
    {
      // idx 35
      clave: "CUPN 03",
      nombre: "Logro de aceptantes de primera vez de métodos anticonceptivos",
      grupo: "Calidad Primer Nivel",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(80, 70) }
    },
    {
      // idx 36
      clave: "CUPN 04",
      nombre: "Porcentaje de derechohabientes referidos al 2° nivel por medicina familiar",
      grupo: "Calidad Primer Nivel",
      activo: false,
      decimales: 2,
      rangos: { tipo: "intervalo_optimo", default: r(12, 8) }
    },
    {
      // idx 37
      clave: "CUPN 05",
      nombre: "Promedio de consultas de medicina familiar por hora/médico",
      grupo: "Calidad Primer Nivel",
      activo: false,
      decimales: 2,
      rangos: { tipo: "intervalo_optimo", default: r(4.5, 4.0) }
    },
    {
      // idx 38
      clave: "CUPN 06",
      nombre: "Porcentaje de niños de 6 meses con lactancia materna exclusiva",
      grupo: "Calidad Primer Nivel",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(50, 40) }
    },
    {
      // idx 39
      clave: "CUPN 07",
      nombre: "Promedio de consultas de estomatología por hora/estomatólogo",
      grupo: "Calidad Primer Nivel",
      activo: false,
      decimales: 2,
      rangos: { tipo: "intervalo_optimo", default: r(3.5, 3.0) }
    },

    // ============================================================
    // CALIDAD UMAE / SEGUNDO-TERCER NIVEL (CUSN 01 - CUSN 02)
    // ============================================================
    {
      // idx 40
      clave: "CUSN 01",
      nombre: "Razón de muerte materna hospitalaria",
      grupo: "Calidad Segundo Nivel",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(35, 25) }
    },
    {
      // idx 41
      clave: "CUSN 02",
      nombre: "Tasa de mortalidad perinatal por 1,000 nacimientos",
      grupo: "Calidad Segundo Nivel",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(15, 10) }
    },

    // ============================================================
    // COORDINACIÓN ENFERMERÍA (CE 01 - CE 02)
    // ============================================================
    {
      // idx 42
      clave: "CE 01",
      nombre: "Productividad de atenciones preventivas por personal de Enfermería",
      grupo: "Coordinación Enfermería",
      activo: true,
      decimales: 1,
      rangos: {
        tipo: "intervalo_optimo",
        default: r(20, 14, { valorMinimoRojo: 10 })
      }
    },
    {
      // idx 43
      clave: "CE 02",
      nombre: "Productividad de atenciones integrales por personal de Enfermería Esp. Med. Fam.",
      grupo: "Coordinación Enfermería",
      activo: true,
      decimales: 1,
      rangos: {
        tipo: "intervalo_optimo",
        default: r(20, 14, { valorMinimoRojo: 10 })
      }
    },

    // ============================================================
    // COORDINACIÓN VIGILANCIA EPIDEMIOLÓGICA (CVE 01 - CVE 03)
    // ============================================================
    {
      // idx 44
      clave: "CVE 01",
      nombre: "Índice de notificación inmediata de casos nuevos",
      grupo: "Vigilancia Epidemiológica",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(95, 85) }
    },
    {
      // idx 45
      clave: "CVE 02",
      nombre: "Oportunidad de registro mensual OOAD",
      grupo: "Vigilancia Epidemiológica",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(95, 85) }
    },
    {
      // idx 46
      clave: "CVE 03",
      nombre: "Oportunidad de registro mensual UMAE",
      grupo: "Vigilancia Epidemiológica",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(95, 85) }
    },

    // ============================================================
    // COORDINACIÓN EDUCACIÓN EN SALUD (CES 01 - CES 04)
    // ============================================================
    {
      // idx 47
      clave: "CES 01",
      nombre: "Cumplimiento de estándares en ambientes académicos",
      grupo: "Educación en Salud",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(90, 80) }
    },
    {
      // idx 48
      clave: "CES 02",
      nombre: "Eficiencia terminal de residencias médicas",
      grupo: "Educación en Salud",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(90, 80) }
    },
    {
      // idx 49
      clave: "CES 03",
      nombre: "Capacitación en educación en salud",
      grupo: "Educación en Salud",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(90, 80) }
    },
    {
      // idx 50
      clave: "CES 04",
      nombre: "Cobertura de capacitación a personal de salud",
      grupo: "Educación en Salud",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(80, 70) }
    },

    // ============================================================
    // COORDINACIÓN INVESTIGACIÓN EN SALUD (CIS 01 - CIS 07)
    // ============================================================
    {
      // idx 51
      clave: "CIS 01",
      nombre: "Publicaciones científicas generadas",
      grupo: "Investigación en Salud",
      activo: false,
      decimales: 0,
      rangos: { tipo: "mayor_es_mejor", default: r(10, 5) }
    },
    {
      // idx 52
      clave: "CIS 02",
      nombre: "% de publicaciones con factor de impacto Q1-Q2",
      grupo: "Investigación en Salud",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(50, 35) }
    },
    {
      // idx 53
      clave: "CIS 03",
      nombre: "Personal IMSS formado en maestrías y doctorados",
      grupo: "Investigación en Salud",
      activo: false,
      decimales: 0,
      rangos: { tipo: "mayor_es_mejor", default: r(5, 2) }
    },
    {
      // idx 54
      clave: "CIS 04",
      nombre: "Investigadores IMSS en SNII",
      grupo: "Investigación en Salud",
      activo: false,
      decimales: 0,
      rangos: { tipo: "mayor_es_mejor", default: r(5, 2) }
    },
    {
      // idx 55
      clave: "CIS 05",
      nombre: "Protocolos en temas prioritarios IMSS",
      grupo: "Investigación en Salud",
      activo: false,
      decimales: 0,
      rangos: { tipo: "mayor_es_mejor", default: r(10, 5) }
    },
    {
      // idx 56
      clave: "CIS 06",
      nombre: "Protocolos con dictamen CLIS en ≤30 días",
      grupo: "Investigación en Salud",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(90, 80) }
    },
    {
      // idx 57
      clave: "CIS 07",
      nombre: "Residentes con protocolo terminado",
      grupo: "Investigación en Salud",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(90, 80) }
    },

    // ============================================================
    // DONACIÓN, TRASPLANTES Y CIRUGÍA (CDTOTC 01 - CDTOTC 02)
    // ============================================================
    {
      // idx 58
      clave: "CDTOTC 01",
      nombre: "Pacientes con trasplante renal donador vivo (1 año éxito)",
      grupo: "Donación y Trasplantes",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(95, 85) }
    },
    {
      // idx 59
      clave: "CDTOTC 02",
      nombre: "Tasa anualizada de donación cadavérica",
      grupo: "Donación y Trasplantes",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(5, 3) }
    },

    // ============================================================
    // UMAE (CUMAE 01)
    // ============================================================
    {
      // idx 60
      clave: "CUMAE 01",
      nombre: "Tasa de mortalidad de recién nacidos en UMAE",
      grupo: "UMAE",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(20, 15) }
    },

    // ============================================================
    // INFECCIONES ASOCIADAS A LA ATENCIÓN EN SALUD (IAAS 01 - IAAS 02)
    // ============================================================
    {
      // idx 61
      clave: "IAAS 01",
      nombre: "Tasa de IAAS por 1,000 días estancia",
      grupo: "IAAS",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(10, 7) }
    },
    {
      // idx 62
      clave: "IAAS 02",
      nombre: "Tasa de neumonía asociada a ventilación mecánica",
      grupo: "IAAS",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(15, 10) }
    },

    // ============================================================
    // HOSPITALARIOS (HOSP 01 - HOSP 10)
    // ============================================================
    {
      // idx 63
      clave: "HOSP 01",
      nombre: "% de ocupación del área de observación de urgencias",
      grupo: "Hospitalario",
      activo: false,
      decimales: 2,
      rangos: { tipo: "intervalo_optimo", default: r(95, 80) }
    },
    {
      // idx 64
      clave: "HOSP 02",
      nombre: "% de pacientes con estancia prolongada en observación",
      grupo: "Hospitalario",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(15, 10) }
    },
    {
      // idx 65
      clave: "HOSP 03",
      nombre: "% de consultas de especialidad programadas ≤20 días",
      grupo: "Hospitalario",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(85, 75) }
    },
    {
      // idx 66
      clave: "HOSP 04",
      nombre: "Promedio de consultas diarias por consultorio de especialidad",
      grupo: "Hospitalario",
      activo: false,
      decimales: 2,
      rangos: { tipo: "intervalo_optimo", default: r(18, 14) }
    },
    {
      // idx 67
      clave: "HOSP 05",
      nombre: "% de ocupación hospitalaria",
      grupo: "Hospitalario",
      activo: false,
      decimales: 2,
      rangos: { tipo: "intervalo_optimo", default: r(90, 75) }
    },
    {
      // idx 68
      clave: "HOSP 06",
      nombre: "Promedio de días estancia",
      grupo: "Hospitalario",
      activo: false,
      decimales: 2,
      rangos: { tipo: "intervalo_optimo", default: r(5.5, 3.5) }
    },
    {
      // idx 69
      clave: "HOSP 07",
      nombre: "Tasa de mortalidad hospitalaria",
      grupo: "Hospitalario",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(4.5, 3.0) }
    },
    {
      // idx 70
      clave: "HOSP 08",
      nombre: "% de cirugía electiva no concertada ≤20 días",
      grupo: "Hospitalario",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(85, 75) }
    },
    {
      // idx 71
      clave: "HOSP 09",
      nombre: "% de ocupación de salas de quirófano en días hábiles",
      grupo: "Hospitalario",
      activo: false,
      decimales: 2,
      rangos: { tipo: "mayor_es_mejor", default: r(85, 75) }
    },
    {
      // idx 72
      clave: "HOSP 10",
      nombre: "% de suspensión de cirugías electivas programadas",
      grupo: "Hospitalario",
      activo: false,
      decimales: 2,
      rangos: { tipo: "menor_es_mejor", default: r(8, 5) }
    }
  ]
};
