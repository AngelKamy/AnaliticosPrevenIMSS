/**
 * manual_resolver.js
 * ------------------
 * Punto único de decisión para saber qué versión del Manual Metodológico
 * de Indicadores Médicos (MMIM) aplica a cada periodo, y cómo resolver
 * los umbrales/configuración visual de un indicador en un mes dado.
 *
 * Regla vigente (acordada Nov 2025):
 *   - Hasta Agosto 2025 inclusive  -> MMIM 2022
 *   - Desde Septiembre 2025         -> MMIM 2025
 *
 * Si en el futuro sale un MMIM 2027, basta con:
 *   1) Agregar import del nuevo catálogo
 *   2) Agregar un caso en pickManual()
 *   3) Registrarlo en CATALOGS
 */

import { CATALOG_2022 } from "./catalog_2022.js";
import { CATALOG_2025 } from "./catalog_2025.js";

const MONTH_ORDER = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const CATALOGS = {
  "2022": CATALOG_2022,
  "2025": CATALOG_2025
};

/**
 * Decide qué versión del MMIM aplica para un (año, mes) dado.
 * @param {string|number} year  - "2024", "2025", etc.
 * @param {string} month        - "Enero" ... "Diciembre"
 * @returns {"2022"|"2025"}
 */
export function pickManual(year, month) {
  const y = parseInt(year, 10);
  const m = MONTH_ORDER.indexOf(month); // 0..11

  if (Number.isNaN(y) || m < 0) {
    // Fallback seguro: si no se puede determinar, usar el manual antiguo.
    return "2022";
  }

  // Corte: Septiembre 2025 (m === 8) en adelante => MMIM 2025
  if (y > 2025) return "2025";
  if (y === 2025 && m >= 8) return "2025";
  return "2022";
}

/**
 * Devuelve el catálogo completo correspondiente a un (año, mes).
 */
export function getCatalog(year, month) {
  return CATALOGS[pickManual(year, month)];
}

/**
 * Devuelve solo los indicadores ACTIVOS del catálogo aplicable a un periodo.
 * Esta es la lista que debe alimentar el sidebar de selección.
 * Devuelve cada indicador con su `idx` original dentro del catálogo, para que
 * el código de gráficas pueda leer JSONprod.indicador[idx] directamente.
 */
export function getActiveIndicators(year, month) {
  const cat = getCatalog(year, month);
  return cat.indicadores
    .map((ind, idx) => ({ ...ind, idx }))
    .filter(ind => ind.activo === true);
}

/**
 * Encuentra un indicador por clave (ej. "DM 01") dentro del catálogo de un periodo.
 * Útil para mantener la selección estable cuando el usuario cambia entre meses
 * que pertenecen a distintos manuales.
 *
 * Devuelve el { ...indicador, idx } o null si no existe en ese catálogo.
 */
export function findIndicatorByClave(year, month, clave) {
  const cat = getCatalog(year, month);
  const idx = cat.indicadores.findIndex(i => i.clave === clave);
  return idx >= 0 ? { ...cat.indicadores[idx], idx } : null;
}

/**
 * Resuelve la configuración visual (umbrales, colores, decimales) de UN indicador
 * en UN periodo específico. Devuelve el mismo "shape" que esperaba el código
 * original de indicadores.js para no romper la lógica de dibujo D3:
 *
 *   {
 *     umbralSuperior, umbralInferior,
 *     colorSuperior, colorInferior,
 *     backgroundColors: [colorAlto, colorMedio, colorBajo],
 *     valorMinimoRojo?,        // solo si el indicador lo define
 *     decimales,
 *     // Metadatos extra (no rompen el dibujo si los ignora):
 *     tipoEvaluacion: "mayor_es_mejor" | "menor_es_mejor" | "intervalo_optimo",
 *     etiquetaAlto, etiquetaMedio, etiquetaBajo
 *   }
 *
 * @param {string|number} year
 * @param {string} month
 * @param {number} idx - índice del indicador dentro del catálogo aplicable
 * @returns {object|null}
 */
export function resolveConfig(year, month, idx) {
  const cat = getCatalog(year, month);
  const indicador = cat.indicadores[idx];
  if (!indicador) return null;

  // Estrategia: primero busca rangos del MES exacto. Si no, usa "default".
  const rangos = indicador.rangos || {};
  const porPeriodo = rangos.porPeriodo || {};
  const r = porPeriodo[month] || rangos.default || null;
  if (!r) return null;

  // Paleta estándar IMSS:
  //  - mayor_es_mejor: [VERDE alto, AMARILLO medio, ROJO bajo]
  //  - menor_es_mejor: [ROJO alto, AMARILLO medio, VERDE bajo]
  //  - intervalo_optimo: [ROJO alto, VERDE medio, ROJO bajo]
const VERDE    = "rgba(52, 168, 83, 1)";
const AMARILLO = "rgba(251, 188, 5, 1)";
const ROJO     = "rgba(234, 67, 53, 1)";

  const tipo = rangos.tipo || "mayor_es_mejor";
  let backgroundColors, etiquetaAlto, etiquetaMedio, etiquetaBajo;

  if (tipo === "mayor_es_mejor") {
    backgroundColors = [VERDE, AMARILLO, ROJO];
    etiquetaAlto  = "Esperado";
    etiquetaMedio = "Medio";
    etiquetaBajo  = "Bajo";
  } else if (tipo === "menor_es_mejor") {
    backgroundColors = [ROJO, AMARILLO, VERDE];
    etiquetaAlto  = "Alto";
    etiquetaMedio = "Medio";
    etiquetaBajo  = "Esperado";
  } else { // intervalo_optimo
    backgroundColors = [ROJO, VERDE, ROJO];
    etiquetaAlto  = "Por encima";
    etiquetaMedio = "Esperado";
    etiquetaBajo  = "Por debajo";
  }

  return {
    umbralSuperior: r.umbralSuperior,
    umbralInferior: r.umbralInferior,
    colorSuperior:  "rgb(255, 99, 132)",
    colorInferior:  "black",
    backgroundColors,
    valorMinimoRojo: r.valorMinimoRojo,
    decimales:       indicador.decimales ?? 1,
    tipoEvaluacion:  tipo,
    etiquetaAlto, etiquetaMedio, etiquetaBajo
  };
}

/**
 * Helper para construir el label visible de un indicador.
 * Formato: "CLAVE - Nombre".
 */
export function labelDe(indicador) {
  if (!indicador) return "";
  return `${indicador.clave} - ${indicador.nombre}`;
}

export { MONTH_ORDER };
