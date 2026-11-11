# Paleta de Analíticos PrevenIMSS

Inventario de la revisión de `v2` (commit `25a9636`), anterior al rediseño. Se unificaron los alias equivalentes, como `white`, `#fff` y `#ffffff`.

| Origen | Colores existentes |
| --- | --- |
| CSS institucional y controles | `#2C3E50`, `#34495E`, `#18BC9C`, `#007BFF`, `#0056B3`, `#DC3545`, `#C82333`, `#F1C40F`, `#F39C12` |
| CSS, neutros y superficies | `#2B2B2B`, `#333333`, `#343A40`, `#4F657D`, `#555555`, `#666666`, `#6C757D`, `#75828F`, `#7A8A9A`, `#7F8C8D`, `#BDC3C7`, `#CCCCCC`, `#CED4DA`, `#D5DBDB`, `#DCDCDC`, `#DEE2E6`, `#E0E0E0`, `#E0E4E8`, `#E9ECEF`, `#ECF0F1`, `#EEEEEE`, `#F0F2F5`, `#F8F9FA`, `#F9F9F9`, `#FDFDFD`, `#FFFFFF` |
| CSS, transparencias | `#2C3E50EE`, `transparent` y negro con opacidades .05, .06, .075, .08, .10, .12, .15, .20 y .25 |
| Coberturas, auxiliares D3 | `#333333`, `#444444`, `#777777`, `#CCCCCC`, `#CDCDCD`, `#E0E0E0`, blanco y etiquetas derivadas con `darker(0.85)` |
| Indicadores, auxiliares D3 | `#007BFF` para la serie, `#2C3E50`, `#333333`, `#555555`, `#7F8C8D`, `#CCCCCC`, `#ECF0F1`, blanco, `rgba(44,62,80,.95)` y negro con opacidades .10 y .20 |
| Canales, auxiliares D3 y exportación | `#2C3E50`, `#34495E`, `#7A8A9A`, `#BDC3C7`, `#F9E79F` y blanco |
| HTML y SVG | La leyenda anterior de canales usaba `rgba(40,167,69,.4)`, `rgba(255,193,7,.5)`, `rgba(253,126,20,.5)`, `rgba(220,53,69,.4)`, `#1E88E5` y `#9B59B6`. El icono de inicio en HTML usaba blanco y el SVG contiene `#0F0F0F`. |

## Colores de datos

| Elemento | Correspondencia |
| --- | --- |
| Coberturas | Niño `#2ECC71`, Adolescente `#3498DB`, Mujer `#E74C3C`, Hombre `#5D6D7E`, Adulto Mayor `#F39C12`, Toda la Unidad `#9B59B6`, Todos los grupos `#7F8C8D` |
| Indicadores | Verde `#34A853`, amarillo `#FBBC05` y rojo `#EA4335`, asignados por la configuración del MMIM aplicable. Umbral superior `#FF6384` e inferior `#000000`, con `#E74C3C` y `#F39C12` como colores de respaldo. |
| Zonas epidemiológicas | Éxito `#43A047`, seguridad `#FDD835`, alarma `#F39C12`, epidemia `#E53935` |
| Series epidemiológicas | Casos e incidencia `#1E88E5`, mediana histórica `rgba(155,89,182,.5)`, barras anuales `#64B5F6` y media móvil `#E53935` |

Los estilos de interfaz comparten variables en `css/mystyle.css`. Los colores de datos se conservan en sus módulos y catálogos. Las muestras de la leyenda epidemiológica usan los mismos colores que las series y zonas del SVG.

## Contraste

| Par de la versión auditada | Relación | Aplicación en `v2.1` |
| --- | ---: | --- |
| Blanco y turquesa en pestañas activas y promedios | 2.41:1 | Los estados usan texto blanco sobre la barra oscura y subrayado. Los promedios usan texto oscuro. |
| Turquesa sobre fondo del selector y de la navegación anterior | 2.15:1 y 3.85:1 | Los selectores usan texto oscuro y la navegación reserva el turquesa al subrayado activo. |
| Etiqueta MMIM, texto de promedio y etiquetas de ejes o tarjetas | 3.03:1, 3.93:1 y 3.54:1 | Los textos usan los tonos oscuros de la paleta. |
| Gris de la escala radial sobre blanco | 4.48:1 | La escala usa texto oscuro. |
| Umbral superior rosa y semáforo amarillo sobre blanco | 2.85:1 y 1.71:1 | Se conservan los colores de datos. Los umbrales tienen etiquetas numéricas y las categorías tienen símbolos, texto y contorno en las barras. |
| Verde, amarillo, naranja y rojo de riesgo sobre blanco | 3.30:1, 1.40:1, 2.19:1 y 4.23:1 | El nombre de la zona aparece en texto oscuro junto a la muestra. |
| Trazos de Niño y Adulto Mayor, barra anual azul y mediana sobre blanco | 2.10:1, 2.19:1, 2.21:1 y 2.00:1 | Los tonos se conservan. Las cifras se consultan en las tablas. La mediana usa trazo discontinuo y las barras anuales tienen contorno. |

En canales endémicos, el círculo en la línea base representa un cero observado. La ausencia aparece como hueco en el canal, como cruz en la incidencia graficada y como «Sin información» en la tabla.
