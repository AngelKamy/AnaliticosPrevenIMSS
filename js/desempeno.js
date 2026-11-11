export const estados = {
    esperado: 'Esperado',
    medio: 'Medio',
    bajo: 'Bajo',
    sinDato: 'Sin dato'
};

const posiciones = {
    encima: ['▲', 'Por encima de la referencia'],
    debajo: ['▼', 'Por debajo de la referencia'],
    igual: ['=', 'Igual a la referencia'],
    dentro: ['●', 'Dentro del intervalo']
};

function tieneUmbrales(config) {
    return Number.isFinite(config?.umbralInferior) && Number.isFinite(config?.umbralSuperior);
}

function categorias(config) {
    if (config.tipoEvaluacion === 'menor_es_mejor') return ['bajo', 'medio', 'esperado'];
    if (config.tipoEvaluacion === 'intervalo_optimo') return ['bajo', 'esperado', 'bajo'];
    return ['esperado', 'medio', 'bajo'];
}

export function estadoVisual(valor, config) {
    if (!Number.isFinite(valor)) return { key: 'sinDato', label: estados.sinDato };
    if (!tieneUmbrales(config)) return { label: 'Sin clasificación' };
    const { umbralInferior: low, umbralSuperior: high, valorMinimoRojo: minimum, tipoEvaluacion: type } = config;
    // Conserva los límites inclusivos del tramo central y el mínimo especial de enfermería.
    const band = valor > high || (minimum != null && valor <= minimum) ? 0 : valor >= low ? 1 : 2;
    const key = categorias(config)[band];
    const interval = type === 'intervalo_optimo';
    const target = type === 'menor_es_mejor' ? low : high;
    const position = interval ? (valor < low ? 'debajo' : valor > high ? 'encima' : 'dentro') :
        valor > target ? 'encima' : valor < target ? 'debajo' : 'igual';
    const [symbol, direction] = posiciones[position];
    return { key, label: estados[key], symbol, direction };
}

export function referenciaVisible(config) {
    if (!tieneUmbrales(config)) return '–';
    const { umbralInferior: low, umbralSuperior: high, tipoEvaluacion: type } = config;
    const format = value => value.toFixed(config.decimales ?? 1);
    if (type === 'intervalo_optimo') return format(low) + ' a ' + format(high);
    return type === 'menor_es_mejor' ? '< ' + format(low) : '> ' + format(high);
}

export function bandasDesempeno(config, min, max) {
    if (!tieneUmbrales(config)) return [];
    const { umbralInferior: low, umbralSuperior: high, valorMinimoRojo: minimum } = config;
    const [upper, middle, lower] = categorias(config);
    return minimum == null ? [[min, low, lower], [low, high, middle], [high, max, upper]] :
        [[min, minimum, upper], [minimum, low, lower], [low, high, middle], [high, max, upper]];
}

export function leyendaUmbrales(config) {
    if (!tieneUmbrales(config)) return [];
    const { umbralInferior: low, umbralSuperior: high, valorMinimoRojo: minimum } = config;
    const limits = minimum == null ? ['> ' + high, low + ' a ' + high, '< ' + low] :
        ['≤ ' + minimum + ' o > ' + high, low + ' a ' + high, '> ' + minimum + ' y < ' + low];
    return categorias(config).map((key, index) => ({ key, label: estados[key], limits: limits[index] }));
}
