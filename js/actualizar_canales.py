"""
actualizar_canales.py
=====================
Extrae datos de canales endémicos desde el reporte XLS (MODBD/SIAIS)
y actualiza el archivo JSONende.js del dashboard.

Uso:
    python actualizar_canales.py <xls> <anio> [opciones]

Ejemplos:
    python actualizar_canales.py BA130153.xls 2025
    python actualizar_canales.py BA130153.xls 2025 --semana-corte 40
    python actualizar_canales.py BA130153.xls 2025 --jsonende ../js/JSONende.js

Lógica de extracción por padecimiento:
  - La mayoría usa col 8 (Ambos sexos) directamente.
  - IRA's <5años y EDA's <5años usan la SUMA de:
      col 11 (Menores de 1 Hombres) + col 12 (1 a 4 Hombres)
    + col 22 (Menores de 1 Mujeres) + col 23 (1 a 4 Mujeres)
  - DENGUE suma tres diagnósticos: 27 + 89 + 189
  - Delegacional = suma de todas las unidades
"""

import sys, os, re, json, argparse, xlrd
from collections import defaultdict

# ─────────────────────────────────────────────────────────────
# CONFIGURACIÓN
# ─────────────────────────────────────────────────────────────

# Claves diagnóstico del XLS -> clave en JSONende.js
# Valor especial "_sub5" indica que se usan columnas de <5 años en lugar de Ambos sexos
DIAGNOSTICOS = {
    "97":    "CaCu",          # Tumor maligno del cuello del útero
    "119":   "CaMa",          # Tumor maligno de la mama
    "47":    "HA",            # Hipertensión arterial
    "49":    "DM",            # Diabetes mellitus tipo 2
    "IM234": "COVID-19",      # COVID-19 confirmado
    "135":   "OBESIDAD",      # Obesidad
    "27":    "DENGUE",        # Dengue no grave       ┐
    "89":    "DENGUE",        # Dengue grave          ├ se suman
    "189":   "DENGUE",        # Dengue con signos de alarma ┘
    "16":    "IRAS",          # Infecciones respiratorias agudas (total)
    "16_s":  "IRAS_sub5",     # IRA's <5 años (subconjunto de clave 16)
    "08":    "EDAS",          # Infecciones intestinales (total)
    "08_s":  "EDAS_sub5",     # EDA's <5 años (subconjunto de clave 08)
}

# Claves JSONende que usan columnas de <5 años en vez de col 8
CLAVES_SUB5 = {"IRAS_sub5", "EDAS_sub5"}

# Columnas de edad <5 años (índices en la hoja)
COLS_SUB5 = [11, 12, 22, 23]  # Men.1 H, 1-4 H, Men.1 M, 1-4 M

# Claves diagnóstico que tienen versión <5 años (se procesan dos veces)
CLAVES_CON_SUB5 = {
    "16": "16_s",   # IRA's total -> también extrae IRA's <5
    "08": "08_s",   # EDA's total -> también extrae EDA's <5
}

# Mapeo clave JSONende interna -> nombre real en JSONende.js
NOMBRE_JSON = {
    "CaCu":      "CaCu",
    "CaMa":      "CaMa",
    "HA":        "HA",
    "DM":        "DM",
    "COVID-19":  "COVID-19",
    "OBESIDAD":  "OBESIDAD",
    "DENGUE":    "DENGUE",
    "IRAS":      "IRA'S",
    "IRAS_sub5": "IRA'S <5años",
    "EDAS":      "EDA's",
    "EDAS_sub5": "EDA's <5años",
}

# Mapeo nombre unidad XLS (sin espacios) -> clave en JSONende.js
UNIDADES = {
    "HGS33":"HGS33","HGZ2":"HGZ2","HGZ36":"HGZ36",
    "HGZMF1":"HGZMF1","HGZMF6":"HGZMF6","HGZMF8":"HGZMF8",
    "UMF15":"UMF15","UMF16":"UMF16","UMF18":"UMF18",
    "UMF25":"UMF25","UMF26":"UMF26","UMF27":"UMF27",
    "UMF29":"UMF29","UMF31":"UMF31","UMF32":"UMF32",
    "UMF34":"UMF34","UMF35":"UMF35","UMF37":"UMF37",
    "UMF4":"UMF4","UMF9":"UMF9","UMFH3":"UMFH3","UMFH7":"UMFH7",
}

TOTAL_SEMANAS = 53

# ─────────────────────────────────────────────────────────────
# PASO 1: Extraer datos del XLS
# ─────────────────────────────────────────────────────────────

def extraer_datos_xls(ruta):
    """
    Recorre Hoja3 fila por fila y acumula casos en:
      datos[clave_json][clave_unidad][semana] = total_casos

    Para diagnósticos con versión <5 años (IRA's, EDA's), procesa
    la misma fila dos veces: una con col 8 (total) y otra con
    la suma de columnas de edad menor a 5 años.
    """
    print(f"[1/4] Leyendo: {ruta}")
    try:
        wb = xlrd.open_workbook(ruta)
    except Exception as e:
        sys.exit(f"ERROR al abrir XLS: {e}")
    if "Hoja3" not in wb.sheet_names():
        sys.exit(f"ERROR: No hay 'Hoja3'. Hojas disponibles: {wb.sheet_names()}")

    hoja = wb.sheet_by_name("Hoja3")

    # datos[pad_json][unidad_json][semana] = casos acumulados
    datos = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))

    ok = skip = 0
    desconocidas = set()

    for i in range(13, hoja.nrows):
        clave_raw  = str(hoja.cell_value(i, 4)).strip()
        unidad_raw = str(hoja.cell_value(i, 2)).strip()
        semana_raw = hoja.cell_value(i, 3)

        # ¿Es un diagnóstico que nos interesa?
        if clave_raw not in DIAGNOSTICOS and clave_raw not in CLAVES_CON_SUB5:
            continue

        # Normalizar nombre de unidad
        unidad_norm = unidad_raw.replace(" ", "")
        if unidad_norm not in UNIDADES:
            desconocidas.add(unidad_raw)
            skip += 1
            continue

        # Parsear semana
        try:
            semana = int(float(semana_raw))
        except (ValueError, TypeError):
            skip += 1
            continue
        if not (1 <= semana <= TOTAL_SEMANAS):
            skip += 1
            continue

        unidad_json = UNIDADES[unidad_norm]

        def leer_col(col_idx):
            """Lee una celda numérica, devuelve 0 si está vacía o es inválida."""
            try:
                v = hoja.cell_value(i, col_idx)
                return int(float(v)) if v != "" else 0
            except (ValueError, TypeError):
                return 0

        # ── Procesar versión TOTAL (col 8 = Ambos sexos) ──
        if clave_raw in DIAGNOSTICOS:
            pad_json = DIAGNOSTICOS[clave_raw]
            casos_total = leer_col(8)
            datos[pad_json][unidad_json][semana] += casos_total
            ok += 1

        # ── Procesar versión <5 AÑOS (suma de 4 columnas de edad) ──
        if clave_raw in CLAVES_CON_SUB5:
            pad_sub5 = DIAGNOSTICOS[CLAVES_CON_SUB5[clave_raw]]
            casos_sub5 = sum(leer_col(c) for c in COLS_SUB5)
            datos[pad_sub5][unidad_json][semana] += casos_sub5
            ok += 1

    print(f"    Procesadas: {ok} | Ignoradas: {skip}")
    if desconocidas:
        print(f"    ⚠  Unidades no mapeadas (ignoradas): {sorted(desconocidas)}")

    # Resumen por padecimiento
    print("    Casos totales extraídos por padecimiento:")
    for pad, unidades in sorted(datos.items()):
        total = sum(sum(s.values()) for s in unidades.values())
        nombre_display = NOMBRE_JSON.get(pad, pad)
        print(f"      {nombre_display:<20}: {total:>6} casos")

    return datos


# ─────────────────────────────────────────────────────────────
# PASO 2: Helpers para construir arreglos
# ─────────────────────────────────────────────────────────────

def construir_array(casos_dict, corte):
    """
    Convierte {semana: casos} en lista de TOTAL_SEMANAS elementos.
      semana <= corte  -> número de casos (0 si no hay registro)
      semana >  corte  -> None (se muestra como null en JS / vacío en gráfica)
    """
    return [
        None if s > corte else casos_dict.get(s, 0)
        for s in range(1, TOTAL_SEMANAS + 1)
    ]


def calcular_delegacional(datos_pad):
    """Suma los casos de todas las unidades por semana."""
    total = defaultdict(int)
    for semanas in datos_pad.values():
        for s, c in semanas.items():
            total[s] += c
    return dict(total)


def detectar_corte(datos):
    """Devuelve la semana más alta que tiene al menos un caso registrado."""
    semanas = [s for pad in datos.values() for uni in pad.values() for s in uni]
    return max(semanas, default=TOTAL_SEMANAS)


# ─────────────────────────────────────────────────────────────
# PASO 3: Leer JSONende.js existente
# ─────────────────────────────────────────────────────────────

def js_a_json(txt):
    """
    Convierte sintaxis JS a JSON válido:
      1. Limpia comas dobles en arrays: [0,,null] -> [0,0,null]
      2. Añade comillas a claves de texto: CaCu: -> "CaCu":
      3. Añade comillas a claves numéricas: 2017: -> "2017":
      4. Elimina trailing commas antes de } o ]
    """
    txt = re.sub(r',(\s*),', ', 0,', txt)                          # comas dobles
    txt = re.sub(r'(?<=[{,])\s*([A-Za-z_]\w*)\s*:', r' "\1":', txt)  # claves texto
    txt = re.sub(r'(?<=[{,])\s*(\d+)\s*:', r' "\1":', txt)           # claves numéricas
    txt = re.sub(r',(\s*[}\]])', r'\1', txt)                       # trailing commas
    return txt


def leer_jsonende(ruta):
    """
    Lee JSONende.js y devuelve:
      - datos       : dict Python con toda la estructura
      - resto       : string con el contenido DESPUÉS del bloque JSONende
                      (ej: mapeosSemanasPorAno) para reincorporarlo al escribir
    """
    print(f"[2/4] Leyendo JSONende.js: {ruta}")
    with open(ruta, "r", encoding="utf-8") as f:
        contenido = f.read()

    # Localizar inicio del objeto JSONende
    m = re.search(r'export\s+let\s+JSONende\s*=\s*\{', contenido)
    if not m:
        sys.exit("ERROR: No se encontró 'export let JSONende = {' en el archivo.")

    inicio = m.end() - 1   # posición de la { de apertura

    # Encontrar la } de cierre por balanceo de llaves
    nivel, fin = 0, None
    for i in range(inicio, len(contenido)):
        if contenido[i] == '{':
            nivel += 1
        elif contenido[i] == '}':
            nivel -= 1
            if nivel == 0:
                fin = i + 1
                break
    if fin is None:
        sys.exit("ERROR: No se encontró el cierre del objeto JSONende.")

    js_obj = contenido[inicio:fin]
    resto  = contenido[fin:]          # mapeosSemanasPorAno + lo que sea

    try:
        datos = json.loads(js_a_json(js_obj))
    except json.JSONDecodeError as e:
        ctx = js_a_json(js_obj)[max(0, e.pos - 80):e.pos + 80]
        sys.exit(
            f"ERROR parseando JSONende.js en posición {e.pos}:\n"
            f"  {e.msg}\n"
            f"Contexto: ...{repr(ctx)}..."
        )

    print(f"    Padecimientos en el archivo: {list(datos.keys())}")
    return datos, resto


# ─────────────────────────────────────────────────────────────
# PASO 4: Inyectar año actualizado
# ─────────────────────────────────────────────────────────────

def actualizar_anio(datos, nuevos, anio, corte):
    """
    Sobreescribe SOLO datosSemanales[anio] en cada combinación
    padecimiento × unidad. Todos los demás años quedan intactos.
    """
    print(f"[3/4] Actualizando año {anio} (semana de corte: {corte})...")
    n = 0
    for pad_key, pad_data in datos.items():
        # Buscar los datos nuevos usando el nombre real del JSONende
        # (ej: "IRA'S" en el JSON, "IRAS" en nuestro dict interno)
        clave_interna = next(
            (k for k, v in NOMBRE_JSON.items() if v == pad_key),
            pad_key
        )
        nuevos_pad = nuevos.get(clave_interna, {})
        total_deleg = calcular_delegacional(nuevos_pad)

        for uni_key in pad_data["unidades"]:
            semanas = total_deleg if uni_key == "Delegacional" else nuevos_pad.get(uni_key, {})
            pad_data["unidades"][uni_key]["datosSemanales"][str(anio)] = construir_array(semanas, corte)
            n += 1

    print(f"    Combinaciones actualizadas: {n}")
    return datos


# ─────────────────────────────────────────────────────────────
# PASO 5: Serializar de vuelta a JS
# ─────────────────────────────────────────────────────────────

def serializar(datos, resto):
    """
    Reconstruye el archivo JS:
      - Claves simples sin comillas: CaCu, HGZMF1, DM
      - Claves con caracteres especiales con comillas: "IRA'S", "EDA's", "COVID-19"
      - Arrays de semanas en una sola línea
      - Preserva mapeosSemanasPorAno al final
    """
    _simple = re.compile(r'^[A-Za-z_][A-Za-z0-9_]*$')

    def fmt_clave(k):
        return k if _simple.match(k) else f'"{k}"'

    def fmt_array(arr):
        return "[" + ", ".join("null" if v is None else str(v) for v in arr) + "]"

    L = ["export let JSONende = {"]
    pads = list(datos.keys())

    for pi, pk in enumerate(pads):
        pd = datos[pk]
        coma_p = "," if pi < len(pads) - 1 else ""

        L.append(f"    {fmt_clave(pk)}: {{")
        L.append(f'        nombreDisplay: "{pd["nombreDisplay"]}",')
        L.append(f"        unidades: {{")

        unis = list(pd["unidades"].keys())
        for ui, uk in enumerate(unis):
            ud = pd["unidades"][uk]
            coma_u = "," if ui < len(unis) - 1 else ""

            L.append(f"            {fmt_clave(uk)}: {{")
            L.append(f"                datosSemanales: {{")

            años = sorted(ud["datosSemanales"].keys(), key=int)
            for ai, a in enumerate(años):
                coma_a = "," if ai < len(años) - 1 else ""
                L.append(f"                    {a}: {fmt_array(ud['datosSemanales'][a])}{coma_a}")

            L.append(f"                }},")
            L.append(f"            }}{coma_u}")

        L.append(f"        }},")
        L.append(f"    }}{coma_p}")

    L.append("};")

    resultado = "\n".join(L) + "\n"
    if resto.strip():
        resultado += "\n" + resto.lstrip("\n")
    return resultado


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(
        description="Actualiza JSONende.js desde reporte semanal XLS MODBD/SIAIS."
    )
    p.add_argument("xls",  help="Ruta al .xls del reporte (ej: BA130153.xls)")
    p.add_argument("anio", type=int, help="Año epidemiológico (ej: 2025)")
    p.add_argument("--output",
        default=None,
        help="Ruta de salida. Por defecto sobreescribe el JSONende.js original.")
    p.add_argument("--jsonende",
        default=None,
        help="Ruta al JSONende.js existente. Por defecto busca en ../js/JSONende.js")
    p.add_argument("--semana-corte",
        type=int, default=None,
        help="Última semana con datos reales. Las siguientes quedan como null en la gráfica. "
             "Si no se indica, se detecta automáticamente.")
    args = p.parse_args()

    # Resolver rutas
    script_dir  = os.path.dirname(os.path.abspath(__file__))
    ruta_json   = os.path.normpath(
        args.jsonende or os.path.join(script_dir, "..", "js", "JSONende.js")
    )
    ruta_output = args.output or ruta_json

    if not os.path.exists(args.xls):
        sys.exit(f"ERROR: No se encontró el XLS: {args.xls}")
    if not os.path.exists(ruta_json):
        sys.exit(
            f"ERROR: No se encontró JSONende.js en: {ruta_json}\n"
            f"Usa --jsonende <ruta> para especificar la ubicación."
        )

    # Pipeline
    datos_xls    = extraer_datos_xls(args.xls)
    corte        = args.semana_corte or detectar_corte(datos_xls)
    print(f"    Semana de corte : {corte}")

    datos, resto = leer_jsonende(ruta_json)
    datos        = actualizar_anio(datos, datos_xls, args.anio, corte)

    print(f"[4/4] Escribiendo: {ruta_output}")
    with open(ruta_output, "w", encoding="utf-8") as f:
        f.write(serializar(datos, resto))

    print(f"\n✅  JSONende.js actualizado correctamente.")
    print(f"    Año actualizado : {args.anio}")
    print(f"    Semana de corte : {corte}")
    print(f"    Archivo de salida: {ruta_output}")
    print(f"\nPróximo paso:")
    print(f"    Copia el archivo generado a tu carpeta js/ y recarga el dashboard.")

if __name__ == "__main__":
    main()