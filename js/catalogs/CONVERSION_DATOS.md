# Conversión de datos: MMIM 2022 → MMIM 2025

Documento de referencia para convertir los datos de `JSONprod.js` de
**Septiembre 2025 en adelante** al nuevo orden del catálogo MMIM 2025.

> Los datos de **2024 y enero–agosto 2025** NO se tocan. Siguen con el orden viejo (MMIM 2022).

---

## Tabla maestra de conversión

Esta tabla te dice: si en el array viejo el valor estaba en la posición X, en el array nuevo va a la posición Y.

| idx VIEJO | Indicador (nombre corto) | → | idx NUEVO | Clave nueva |
|:-:|---|:-:|:-:|---|
| 0 | CTE 01 - Productividad chequeo PrevenIMSS | → | **20** | CE 01 |
| 1 | Porcentaje API | → | **22** | API% |
| 2 | Índice API / AC | → | **23** | API/AC |
| 3 | CUPN 01 - Cobertura chequeo PrevenIMSS | → | **18** | CUPN 01 |
| 4 | CACU 01 - Tamizaje CaCu 25-64 | → | **13** | CACU 01 |
| 5 | CACU 05 - Displasia leve/moderada | → | **14** | CaCu-DispLM |
| 6 | CACU 06 - Displasia severa | → | **15** | CaCu-DispSev |
| 7 | CAMAma 01 - Mastografía 40-49 | → | **10** ⚠️ | CAMA 01 (fusionar con idx viejo 8) |
| 8 | CAMAma 02 - Mastografía 50-69 | → | **10** ⚠️ | CAMA 01 (fusionar con idx viejo 7) |
| 9 | CACU 04 - Incidencia CaCu | → | **16** | CaCu-Inc |
| 10 | CAMAma 06 - Incidencia CaMa | → | **11** | CaMa-Inc |
| 11 | Mortalidad CaCu | → | **17** | CaCu-Mort |
| 12 | CAMAma 09 - Mortalidad CaMa | → | **12** | CaMa-Mort |
| 13 | DM 01 - Detección DM | → | **0** | DM 01 |
| 14 | DM 02 - Confirmación DM | → | **1** | DM 02 |
| 15 | DM 04 - Control DM | → | **2** | DM 03 |
| 16 | DM 03 - Incidencia DM | → | **3** | DM-Inc |
| 17 | EH 01 - Detección HTA | → | **5** | EH 01 |
| 18 | EH 02 - Confirmación HTA | → | **7** | HTA-Conf |
| 19 | EH 04 - Control HTA | → | **6** | EH 02 |
| 20 | EH 03 - Incidencia HTA | → | **8** | HTA-Inc |
| 21 | Mortalidad DM | → | **4** | DM-Mort |
| 22 | Mortalidad HTA | → | **9** | HTA-Mort |
| 23 | CUPN 03 - Vacunación niños 1 año | → | **19** | CUPN 02 |
| 24 | Tamiz Neonatal | → | ❌ | (descartado, no se reporta) |
| 25 | CTE 02 - Atención Integral Enf. Esp. MF | → | **21** | CE 02 |

⚠️ **Mastografía:** Antes tenías dos coberturas separadas (40-49 y 50-69) y ahora se fusionan en una sola CAMA 01 (40-69). Tienes dos opciones:
- **Si tienes los denominadores poblacionales**, recalcula CAMA 01 con la fórmula MMIM 2025
- **Si no los tienes a mano**, pon `null` en idx 10 por ahora y captúralo cuando esté disponible

---

## Snippet para convertir datos automáticamente

Pega esta función en cualquier archivo JS local (o ejecútala en la consola del navegador). Toma un array viejo de 26 valores y devuelve uno nuevo de 26 valores en el orden MMIM 2025:

```js
/**
 * Convierte un array indicador[] del orden MMIM 2022 al orden MMIM 2025.
 *
 * @param {Array} viejo - array de 26 valores en orden MMIM 2022
 * @returns {Array} array de 26 valores en orden MMIM 2025
 *
 * NOTAS:
 *  - El valor en idx 24 viejo (Tamiz Neonatal) se descarta.
 *  - Los valores en idx 7 y 8 viejos (mastografía 40-49 y 50-69) NO se pueden
 *    convertir automáticamente porque hay que recalcular con denominadores.
 *    Esta función pone `null` en idx 10 nuevo (CAMA 01). Captúralo a mano.
 *  - idx 24 y 25 nuevos son reservas inactivas: quedan en null.
 */
function convertirA2025(viejo) {
  const nuevo = Array(26).fill(null);

  // Mapeo directo: viejoIdx -> nuevoIdx
  const map = {
    0:  20,  // CTE 01 -> CE 01
    1:  22,  // API%
    2:  23,  // API/AC
    3:  18,  // CUPN 01
    4:  13,  // CACU 01
    5:  14,  // CACU 05 -> CaCu-DispLM
    6:  15,  // CACU 06 -> CaCu-DispSev
    // 7 y 8 (mastografías): NO mapear directo, hay que recalcular -> idx 10 nuevo
    9:  16,  // CACU 04 -> CaCu-Inc
    10: 11,  // CAMAma 06 -> CaMa-Inc
    11: 17,  // Mort CaCu
    12: 12,  // CAMAma 09 -> CaMa-Mort
    13: 0,   // DM 01
    14: 1,   // DM 02
    15: 2,   // DM 04 -> DM 03
    16: 3,   // DM 03 (incidencia) -> DM-Inc
    17: 5,   // EH 01
    18: 7,   // EH 02 (confirmación) -> HTA-Conf
    19: 6,   // EH 04 -> EH 02 (control)
    20: 8,   // EH 03 (incidencia) -> HTA-Inc
    21: 4,   // Mort DM -> DM-Mort
    22: 9,   // Mort HTA -> HTA-Mort
    23: 19,  // CUPN 03 -> CUPN 02
    // 24 (Tamiz Neonatal): descartar
    25: 21   // CTE 02 -> CE 02
  };

  // Aplicar mapeo directo
  for (const [v, n] of Object.entries(map)) {
    nuevo[n] = viejo[+v];
  }

  // CAMA 01 (idx 10 nuevo): requiere recálculo manual.
  // Por defecto se deja null. Si tu equipo aprueba un promedio simple, descomenta:
  // const m1 = viejo[7]; const m2 = viejo[8];
  // if (m1 != null && m2 != null) nuevo[10] = (m1 + m2) / 2;

  return nuevo;
}

// Helper para convertir todas las unidades de un mes completo de un golpe
function convertirMesCompleto(arrayDeUnidades) {
  return arrayDeUnidades.map(u => ({
    unidad: u.unidad,
    indicador: convertirA2025(u.indicador)
  }));
}
```

---

## Cómo usar el snippet en VS Code

1. Abre `JSONprod.js`
2. Busca con Ctrl+F el bloque `"Septiembre": [` dentro de `"2025"`
3. Copia todo el contenido de ese array
4. Abre la consola del navegador en tu dashboard (F12 → Console)
5. Pega la función `convertirA2025` y `convertirMesCompleto`
6. Pega los datos así:
   ```js
   const datosViejos = [/* aquí el array de Septiembre 2025 que copiaste */];
   const datosNuevos = convertirMesCompleto(datosViejos);
   console.log(JSON.stringify(datosNuevos, null, 2));
   ```
7. Copia el resultado y pégalo de vuelta en `JSONprod.js` reemplazando el array viejo
8. Repite para Octubre, Noviembre, Diciembre 2025

Para 2026: ya capturas directamente en orden MMIM 2025, no hay conversión.

---

## Validación visual rápida después de cada mes

Después de convertir un mes, recarga el dashboard y selecciona ese mes. Para una unidad conocida, verifica 2-3 indicadores que sepas de memoria:

- "CE 01" (idx 20 nuevo) debe mostrar el mismo valor que antes mostraba "CTE 01"
- "CUPN 01" (idx 18 nuevo) debe mostrar el mismo valor que antes mostraba CUPN 01
- "DM 01" (idx 0 nuevo) debe mostrar el mismo valor que antes mostraba DM 01

Si coinciden, la conversión está bien. Si un valor "se cambió de columna" (ej. CE 01 ahora muestra lo que era CUPN 01), hay un cruce de índices que hay que revisar.
