import { findIndicatorByClave, MONTH_ORDER, pickManual, resolveConfig } from './catalogs/manual_resolver.js';
import { bandasDesempeno, estadoVisual } from './desempeno.js';

export const fichasMMIM2025 = {
    'DM 01': { meta: '≥28.5 %', periodicidad: 'Mensual acumulado', reinicia: true },
    'DM 02': { meta: '≥32.6 %', periodicidad: 'Mensual anualizado' },
    'DM 03': { meta: '≥53.0 %', periodicidad: 'Mensual trimestralizado' },
    'EH 01': { meta: '≥69.0 %', periodicidad: 'Mensual acumulado', reinicia: true },
    'EH 02': { meta: '≥85.2 %', periodicidad: 'Mensual y mensual acumulado' },
    'CAMA 01': { meta: '≥15.0 %', periodicidad: 'Mensual acumulado', reinicia: true },
    'CACU 01': { meta: '≥27.0 %', periodicidad: 'Mensual acumulado', reinicia: true },
    'CUPN 01': { meta: '≥63.0 %', periodicidad: 'Mensual acumulado · últimos 12 meses' },
    'CUPN 02': { meta: '≥95.0 %', periodicidad: 'Trimestral anualizado' },
    'CE 01': { meta: '≥16 atenciones', periodicidad: 'Mensual' },
    'CE 02': { meta: '≥16 atenciones', periodicidad: 'Mensual' }
};

const cambiosDeDefinicion = new Set(['DM 03', 'EH 02']);
export const clavePeriodo = ({ year, month }) => year + '/' + month;
const mesAbsoluto = ({ year, month }) => Number(year) * 12 + MONTH_ORDER.indexOf(month);

export function seriePorUnidad(data, periods, unit, clave, manualActivo) {
    return periods.map(period => {
        const { year, month } = period;
        const manual = pickManual(year, month);
        const indicator = findIndicatorByClave(year, month, clave);
        const otraDefinicion = manual !== manualActivo && cambiosDeDefinicion.has(clave) && Boolean(indicator);
        const original = data[year]?.[month]?.find(row => row.unidad === unit)?.indicador?.[indicator?.idx];
        const value = indicator?.activo && !otraDefinicion && Number.isFinite(original) ? original : null;
        return {
            ...period, key: clavePeriodo(period), label: month.slice(0, 3) + ' ' + year.slice(-2),
            manual, otraDefinicion, value,
            reinicio: manual === '2025' && fichasMMIM2025[clave]?.reinicia === true && month === 'Enero',
            config: indicator?.activo && !otraDefinicion ? resolveConfig(year, month, indicator.idx) : null
        };
    });
}

export function referenciaOperativa(config) {
    const low = config?.umbralInferior;
    const high = config?.umbralSuperior;
    if (!Number.isFinite(low) || !Number.isFinite(high)) return [];
    if (config.tipoEvaluacion === 'intervalo_optimo' || config.valorMinimoRojo != null) return [low, high];
    return config.tipoEvaluacion === 'menor_es_mejor' ? [low] : [high];
}

export function brecha(point) {
    if (!Number.isFinite(point.value)) return null;
    const [first, last] = referenciaOperativa(point.config);
    if (first == null) return null;
    if (last != null) return Math.min(0, point.value - first, last - point.value);
    return point.config.tipoEvaluacion === 'menor_es_mejor' ? first - point.value : point.value - first;
}

export function variacion(point, points, months) {
    const previous = points.find(row => mesAbsoluto(row) === mesAbsoluto(point) - months);
    if (previous?.manual !== point.manual || !Number.isFinite(previous.value) || !Number.isFinite(point.value)) return null;
    if (months === 1 && point.reinicio) return null;
    return point.value - previous.value;
}

export function dibujarHistorial(container, points, selected) {
    container.replaceChildren();
    if (!points.length) return;
    const width = Math.max(container.clientWidth, points.length * 42 + 75, 400);
    const height = 426;
    const left = 62;
    const right = width - 20;
    const top = 35;
    const plotBottom = 236;
    const gapTop = 279;
    const gapBottom = 374;
    const x = d3.scaleBand().domain(points.map(point => point.key)).range([left, right]);
    const center = point => x(point.key) + x.bandwidth() / 2;
    const bounds = points.flatMap(point => [point.value, ...referenciaOperativa(point.config), point.config?.umbralInferior, point.config?.umbralSuperior])
        .filter(Number.isFinite);
    const y = d3.scaleLinear().domain([Math.min(0, ...bounds), Math.max(1, ...bounds)]).nice().range([plotBottom, top]);
    const maxGap = Math.max(1, ...points.map(point => Math.abs(brecha(point) ?? 0)));
    const gapY = d3.scaleLinear().domain([-maxGap, maxGap]).nice().range([gapBottom, gapTop]);
    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`).attr('role', 'img')
        .attr('aria-label', 'Serie mensual con umbrales y gráfica alineada de brecha operativa. Los valores se consultan en Datos.');
    for (const [index, point] of points.entries()) {
        const bandX = x(point.key);
        for (const [low, high, state] of bandasDesempeno(point.config, ...y.domain())) {
            svg.append('rect').attr('x', bandX).attr('y', y(high)).attr('width', x.bandwidth())
                .attr('height', Math.max(0, y(low) - y(high))).attr('class', 'performance-band').attr('data-performance', state);
        }
        for (const limit of referenciaOperativa(point.config)) {
            svg.append('line').attr('class', 'history-target').attr('x1', bandX).attr('x2', bandX + x.bandwidth())
                .attr('y1', y(limit)).attr('y2', y(limit));
        }
        const difference = brecha(point);
        if (difference != null) {
            svg.append('rect').datum(point).attr('class', 'history-gap')
                .attr('x', bandX + x.bandwidth() * .2).attr('width', x.bandwidth() * .6)
                .attr('y', gapY(Math.max(0, difference))).attr('height', Math.max(1, Math.abs(gapY(difference) - gapY(0))))
                .classed('performance-fill', true).attr('data-performance', difference < 0 ? 'bajo' : 'esperado')
                .append('title').text(`${point.label} · Brecha ${difference.toFixed(point.config?.decimales ?? 1)}`);
        }
        if (point.key === selected?.key) {
            svg.append('rect').attr('class', 'history-cursor').attr('x', bandX + 1).attr('y', top)
                .attr('width', Math.max(0, x.bandwidth() - 2)).attr('height', gapBottom - top);
        }
        const changedManual = index > 0 && point.manual !== points[index - 1].manual;
        if (changedManual || point.reinicio) {
            svg.append('line').attr('class', 'history-boundary').attr('x1', bandX).attr('x2', bandX)
                .attr('y1', top).attr('y2', gapBottom);
            svg.append('text').attr('class', 'history-annotation').attr('x', bandX + 3).attr('y', changedManual ? 23 : 34)
                .text(changedManual ? 'MMIM ' + point.manual : 'Reinicio anual');
        }
    }
    svg.append('text').attr('class', 'history-annotation').attr('x', left).attr('y', 20).text('MMIM ' + points[0].manual);
    svg.append('text').attr('class', 'history-annotation').attr('x', left).attr('y', 267).text('Brecha operativa');
    svg.append('line').attr('class', 'history-target').attr('x1', left).attr('x2', right)
        .attr('y1', gapY(0)).attr('y2', gapY(0));
    svg.append('g').attr('transform', `translate(${left},0)`).call(d3.axisLeft(y).ticks(5));
    svg.append('g').attr('transform', `translate(${left},0)`).call(d3.axisLeft(gapY).ticks(3));
    const labels = new Map(points.map(point => [point.key, point.label]));
    svg.append('g').attr('transform', `translate(0,${gapBottom})`).call(d3.axisBottom(x).tickFormat(key => labels.get(key)))
        .selectAll('text').attr('text-anchor', 'end').attr('dx', '-.35em').attr('dy', '.65em').attr('transform', 'rotate(-35)');

    // El segmento se omite al faltar un mes, cambiar de manual o reiniciar un acumulado.
    svg.selectAll('.history-segment').data(points.slice(1).map((point, i) => [points[i], point])
        .filter(([a, b]) => a.value != null && b.value != null && a.manual === b.manual &&
            !b.reinicio && mesAbsoluto(b) - mesAbsoluto(a) === 1)).join('line')
        .attr('class', 'history-segment').attr('x1', ([a]) => center(a)).attr('x2', ([, b]) => center(b))
        .attr('y1', ([a]) => y(a.value)).attr('y2', ([, b]) => y(b.value));
    svg.selectAll('.hist-data-point').data(points.filter(point => point.value != null)).join('circle')
        .attr('class', 'hist-data-point').attr('cx', center).attr('cy', point => y(point.value))
        .attr('r', point => point.key === selected?.key ? 6 : 4)
        .classed('performance-fill', true).attr('data-performance', point => estadoVisual(point.value, point.config).key ?? null)
        .append('title').text(point => `${point.label} · ${point.value} · ${estadoVisual(point.value, point.config || {})?.label || 'Sin clasificación'}`);
}
