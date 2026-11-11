import { CATALOG_2025 } from './catalogs/catalog_2025.js';
import { datosProductividad } from './JSONprod.js';
import { MONTH_ORDER } from './catalogs/manual_resolver.js';
import { configurarBusqueda, normalizarBusqueda } from './ui.js';

const search = document.getElementById('indexSearch');
const root = document.getElementById('indicatorIndex');
const searchStatus = document.getElementById('indexSearchStatus');
const total = CATALOG_2025.indicadores.filter(item => item.activo).length;
const year = Object.keys(datosProductividad).sort().at(-1);
const month = MONTH_ORDER.filter(value => datosProductividad[year]?.[value]).at(-1);
document.getElementById('indexPeriod').textContent = `${month} ${year}`;

const groups = Map.groupBy(CATALOG_2025.indicadores.filter(item => item.activo), item => item.grupo);
const officialFamilies = {
    'Calidad Primer Nivel': 'Coordinación normativa',
    'Coordinación Enfermería': 'Coordinación normativa',
    'Atención Preventiva': 'Extras OOAD Hidalgo'
};

const categoryIcons = {
    'Diabetes Mellitus': 'drop',
    'Enfermedades Hipertensivas': 'pulse',
    'Cáncer de Mama': 'ribbon',
    'Cáncer Cérvico-Uterino': 'shield-plus',
    'Calidad Primer Nivel': 'clipboard',
    'Coordinación Enfermería': 'stethoscope',
    'Atención Preventiva': 'shield'
};

function render() {
    root.replaceChildren();
    const query = normalizarBusqueda(search.value);
    let countResults = 0;
    for (const [group, items] of groups) {
        const matches = items.filter(item => normalizarBusqueda(`${item.clave} ${item.nombre} ${group}`).includes(query));
        if (!matches.length) continue;
        countResults += matches.length;
        const panel = document.createElement('article');
        panel.className = 'index-card';
        const rail = document.createElement('div');
        rail.className = 'index-card-rail';
        rail.setAttribute('aria-hidden', 'true');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('focusable', 'false');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', './assets/ui-icons.svg#' + (categoryIcons[group] || 'shield'));
        svg.append(use);
        rail.append(svg);
        const content = document.createElement('div');
        content.className = 'index-card-content';
        const family = document.createElement('p');
        family.className = 'index-card-family';
        family.textContent = officialFamilies[group] ?? 'Proceso salud–enfermedad';
        const heading = document.createElement('h3');
        const category = document.createElement('a');
        category.href = './html/indicadores.html#' + new URLSearchParams({ anio: year, mes: month, categoria: group });
        category.textContent = group;
        heading.append(category);
        const list = document.createElement('ul');
        for (const item of matches) {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = './html/indicadores.html#' + new URLSearchParams({ anio: year, mes: month, indicador: item.clave });
            const key = document.createElement('strong');
            key.textContent = item.clave;
            link.append(key, document.createTextNode(' · ' + item.nombre));
            li.append(link);
            if (item.extra) {
                const tag = document.createElement('small');
                tag.textContent = 'OOAD Hidalgo';
                li.append(tag);
            }
            list.append(li);
        }
        const count = document.createElement('p');
        count.className = 'index-card-count';
        count.textContent = matches.length === 1 ? '1 indicador' : `${matches.length} indicadores`;
        content.append(family, heading, count, list);
        panel.append(rail, content);
        root.append(panel);
    }
    if (!countResults) root.textContent = 'Sin resultados para «' + search.value.trim() + '».';
    searchStatus.textContent = query ? (countResults ? countResults + ' de ' + total + ' indicadores' : root.textContent) : '';
}

configurarBusqueda(search, render);
render();
