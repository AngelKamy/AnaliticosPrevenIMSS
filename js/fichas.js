import { fichas } from './fichas-indice.js';
import { MONTH_ORDER } from './catalogs/manual_resolver.js';
import { cargarSelector, guardarHash, leerHash } from './ui.js';
import { decorarExportacion, iconoExportacion } from './iconos-exportacion.js';

const year = document.getElementById('fichaYear');
const month = document.getElementById('fichaMonth');
const list = document.getElementById('fichasList');
const available = fichas.filter(ficha => Number.isInteger(ficha.anio) && Number.isInteger(ficha.mes) &&
    ficha.mes >= 1 && ficha.mes <= 12 && typeof ficha.titulo === 'string' && ficha.titulo.trim() &&
    typeof ficha.archivo === 'string' && /^[^/\\:?#]+\.pdf$/i.test(ficha.archivo));
const currentYear = new Date().getFullYear();
const publicationYears = available.map(ficha => ficha.anio);
const defaultYear = String(publicationYears.length ? Math.max(...publicationYears) : currentYear);
const years = [...new Set([currentYear, ...publicationYears])]
    .sort((a, b) => b - a).map(String);
const months = [{ value: '', label: 'Todos los meses' }, ...MONTH_ORDER.map((label, index) => ({ value: String(index + 1), label }))];

function link(ficha, isDownload) {
    const anchor = document.createElement('a');
    anchor.className = 'button';
    anchor.href = '../fichas-pdf/' + encodeURIComponent(ficha.archivo);
    const action = isDownload ? 'Descargar PDF' : 'Abrir PDF';
    anchor.setAttribute('aria-label', action + ' · ' + ficha.titulo);
    if (isDownload) anchor.download = ficha.archivo;
    else {
        anchor.target = '_blank';
        anchor.rel = 'noopener';
    }
    return decorarExportacion(anchor, 'pdf', action).wrapper;
}

function render() {
    guardarHash({ anio: year.value, mes: month.value });
    list.replaceChildren();
    const publications = available.filter(ficha => ficha.anio === Number(year.value));
    const grouped = month.value ? [Number(month.value)] : [...new Set(publications.map(ficha => ficha.mes))].sort((a, b) => b - a);
    if (!grouped.length) {
        const empty = document.createElement('p');
        empty.className = 'no-data-message';
        empty.textContent = 'Aún no se han publicado fichas para este año.';
        list.append(empty);
        return;
    }
    for (const number of grouped) {
        const period = document.createElement('section');
        const heading = document.createElement('h3');
        heading.textContent = MONTH_ORDER[number - 1] + ' ' + year.value;
        period.className = 'panel ficha-period';
        period.append(heading);
        const entries = publications.filter(ficha => ficha.mes === number);
        if (!entries.length) {
            const empty = document.createElement('p');
            empty.className = 'helper-text';
            empty.textContent = 'Aún no se ha publicado una ficha para este mes.';
            period.append(empty);
        }
        for (const ficha of entries) {
            const item = document.createElement('div');
            item.className = 'ficha-row';
            const title = document.createElement('p');
            title.className = 'ficha-title';
            const badge = document.createElement('span');
            badge.className = 'ficha-format';
            badge.append(iconoExportacion('pdf'), 'PDF');
            title.append(badge, ficha.titulo);
            const actions = document.createElement('div');
            actions.className = 'control-row';
            actions.append(link(ficha, false), link(ficha, true));
            item.append(title, actions);
            period.append(item);
        }
        list.append(period);
    }
}

function restore() {
    const params = leerHash();
    cargarSelector(year, years, years.includes(params.get('anio')) ? params.get('anio') : defaultYear);
    cargarSelector(month, months, months.some(option => option.value === params.get('mes')) ? params.get('mes') : '');
    render();
}
year.addEventListener('change', render);
month.addEventListener('change', render);
window.addEventListener('hashchange', () => {
    if (location.hash !== '#contenido') restore();
});
restore();
