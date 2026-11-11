# Referencias MMIM en el rediseño

Fuente metodológica: Manual Metodológico de Indicadores Médicos, IMSS, 2025. Las fichas de diabetes están en las páginas 24–27, hipertensión en 40–42, mama en 50–51, cérvico uterino en 60–61, primer nivel en 106–108 y enfermería en 120–121.

El índice usa los grupos y el orden del catálogo local. Identifica los procesos, las coordinaciones normativas y los extras del OOAD. El selector histórico conserva el índice original de cada manual.

| Aspecto | Regla de presentación |
| --- | --- |
| Umbrales | Las bandas, símbolos y brechas usan `resolveConfig` y la clasificación del tablero. El Semáforo muestra el límite operativo y, cuando está disponible, la meta oficial por separado. La metodología está pendiente de la actualización de los datos y del MMIM. |
| Cambio de manual | Se marca septiembre de 2025 y se separan los segmentos. Las comparaciones se omiten entre manuales. Para DM 03 y EH 02, el tramo con otra definición se marca como no comparable. |
| Acumulados | Enero se marca como reinicio para DM 01, EH 01, CAMA 01 y CACU 01 en MMIM 2025. CUPN 01 tiene una ventana de 12 meses en la ficha y EH 02 admite corte mensual y acumulado. Ambos quedan sin marcador automático de reinicio. |
| Intervalo esperado | La brecha operativa muestra la distancia al límite más cercano cuando el valor queda fuera. Dentro del intervalo la distancia es cero. La flecha compara el valor con la referencia. El estado conserva la regla del catálogo, incluidos sus límites. |
| Datos | La tabla, el copiado TSV y los archivos CSV y XLSX comparten las filas de la selección. Los archivos y el copiado dejan ausencias en blanco y mantienen los ceros numéricos. |

Los valores del tablero correspondientes a septiembre de 2025 siguen pendientes de cotejo con la fuente original. El importador de canales sigue esperando una declaración con `export let JSONende`, mientras que la fuente declara `export const JSONende`.
