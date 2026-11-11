import { guardarHash, leerHash } from './ui.js';
import { decorarExportacion } from './iconos-exportacion.js';

const textoSeguro = value => {
    if (value == null) return '';
    if (typeof value === 'number') return String(value);
    const text = String(value);
    return /^[\s\uFEFF]*[=+\-@]/.test(text) ? "'" + text : text;
};

export function descargarArchivo(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-');
    document.body.append(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

const csvField = value => {
    const text = textoSeguro(value);
    return /[",\r\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
};

async function copiar(text, focus) {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const area = document.createElement('textarea');
        area.className = 'clipboard-source';
        area.value = text;
        document.body.append(area);
        area.select();
        try {
            if (!document.execCommand('copy')) throw Error('Permiso de portapapeles');
        } finally {
            area.remove();
            focus.focus();
        }
    }
}

export function crearVistaDatos(root, getData, onGraph = () => {}) {
    const main = root.closest('main');
    root.innerHTML = `
        <div class="view-switch" role="group" aria-label="Formato de consulta">
            <button class="button" type="button" data-format="grafica" aria-pressed="true">Gráfica</button>
            <button class="button" type="button" data-format="datos" aria-pressed="false">Datos</button>
        </div>
        <section class="panel report-panel data-panel" aria-labelledby="selectedDataTitle" hidden>
            <h2 id="selectedDataTitle" class="section-heading"></h2>
            <div class="data-toolbar">
                <button class="button" type="button" data-export="xlsx">Descargar Excel</button>
                <button class="button" type="button" data-export="csv">Descargar CSV</button>
                <button class="button" type="button" data-export="copy">Copiar al portapapeles</button>
                <p role="status" aria-live="polite"></p>
            </div>
            <div class="table-scroll" tabindex="0" role="region" aria-labelledby="selectedDataTitle">
                <table class="data-table"></table>
            </div>
            <p class="no-data-message" hidden>Sin datos para esta selección.</p>
        </section>`;
    const panel = root.querySelector('section');
    const table = panel.querySelector('table');
    const title = panel.querySelector('h2');
    const status = panel.querySelector('[role="status"]');
    const actions = [...panel.querySelectorAll('button')];
    const copyButton = actions.find(button => button.dataset.export === 'copy');
    const copyLabel = decorarExportacion(copyButton, 'clipboard').label;
    for (const button of actions.filter(button => button !== copyButton)) decorarExportacion(button, button.dataset.export);
    let copyTimeout;
    const formats = [...root.querySelectorAll('[data-format]')];

    function clearCopy() {
        clearTimeout(copyTimeout);
        copyLabel.textContent = 'Copiar al portapapeles';
    }

    function actualizar() {
        if (panel.hidden) return;
        const { title: name, columns, rows } = getData();
        title.textContent = name;
        status.textContent = '';
        status.classList.remove('visually-hidden');
        clearCopy();
        actions.forEach(button => { button.disabled = !rows.length; });
        panel.querySelector('.no-data-message').hidden = rows.length > 0;
        const head = table.createTHead();
        head.replaceChildren();
        const heading = head.insertRow();
        for (const column of columns) {
            const th = document.createElement('th');
            th.scope = 'col';
            th.textContent = column;
            heading.append(th);
        }
        const body = table.tBodies[0] || table.createTBody();
        body.replaceChildren();
        for (const row of rows) {
            const tr = body.insertRow();
            row.forEach((value, index) => {
                const cell = document.createElement(index === 0 ? 'th' : 'td');
                if (index === 0) cell.scope = 'row';
                if (typeof value === 'number') cell.className = 'numeric';
                cell.textContent = value ?? 'Sin información';
                tr.append(cell);
            });
        }
    }

    function mostrar(format, refreshGraph) {
        const showData = format === 'datos';
        main.dataset.dataView = String(showData);
        panel.hidden = !showData;
        formats.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.format === format)));
        if (showData) actualizar();
        else if (refreshGraph) onGraph();
    }
    for (const button of formats) button.addEventListener('click', () => {
        guardarHash({ formato: button.dataset.format });
        mostrar(button.dataset.format, true);
    });
    for (const button of actions) button.addEventListener('click', async () => {
        const { title: name, columns, rows } = getData();
        if (!rows.length) return;
        const kind = button.dataset.export;
        status.classList.remove('visually-hidden');
        try {
            if (kind === 'copy') {
                const tsv = [columns, ...rows].map(row => row.map(value => textoSeguro(value).replace(/[\r\n\t]+/g, ' ')).join('\t')).join('\r\n');
                await copiar(tsv, button);
                clearCopy();
                copyLabel.textContent = 'Copiado';
                status.classList.add('visually-hidden');
                status.textContent = 'Copiado';
                copyTimeout = setTimeout(() => {
                    clearCopy();
                    if (status.textContent === 'Copiado') {
                        status.textContent = '';
                        status.classList.remove('visually-hidden');
                    }
                }, 2000);
            } else if (kind === 'csv') {
                const csv = [columns, ...rows].map(row => row.map(csvField).join(',')).join('\r\n');
                descargarArchivo(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }), name + '.csv');
                status.textContent = 'CSV preparado.';
            } else {
                const { crearLibro } = await import('./xlsx.js');
                descargarArchivo(crearLibro(columns, rows), name + '.xlsx');
                status.textContent = 'XLSX preparado.';
            }
        } catch {
            status.textContent = kind === 'copy' ? 'No se pudo acceder al portapapeles. Puedes descargar el archivo.' : 'No se pudo preparar el archivo.';
        }
    });
    const fromHash = () => mostrar(leerHash().get('formato') === 'datos' ? 'datos' : 'grafica', false);
    window.addEventListener('hashchange', () => {
        if (location.hash !== '#contenido') fromHash();
    });
    fromHash();
    return { actualizar };
}

export function redondearDato(value, digits = 0) {
    return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}
