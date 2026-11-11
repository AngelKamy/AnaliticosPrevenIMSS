import { labelDe } from './catalogs/manual_resolver.js';
import { configurarBusqueda, normalizarBusqueda } from './ui.js';

export function crearSelectorIndicador(root, choose, onOptionsChange) {
    const input = root.querySelector('#indicatorSearch');
    const panel = root.querySelector('#indicatorOptionsPanel');
    const list = root.querySelector('#indicadorList');
    const status = root.querySelector('#indicatorSearchStatus');
    const selection = root.querySelector('#indicatorSelected');
    let options = [];
    let matches = [];
    let current;
    let active = -1;
    const search = configurarBusqueda(input, () => {
        open();
        onOptionsChange();
    });

    function highlight(index) {
        active = index;
        list.querySelector('[data-active]')?.removeAttribute('data-active');
        const option = list.querySelector('#indicator-option-' + index);
        if (option) {
            option.setAttribute('data-active', '');
            input.setAttribute('aria-activedescendant', option.id);
            option.scrollIntoView({ block: 'nearest' });
        } else {
            input.removeAttribute('aria-activedescendant');
        }
    }

    function render() {
        const query = normalizarBusqueda(input.value);
        matches = options.filter(ind => normalizarBusqueda(labelDe(ind) + ' ' + (ind.grupo || '')).includes(query));
        list.replaceChildren();
        highlight(-1);
        if (!panel.hidden) {
            const groups = new Map();
            matches.forEach((indicator, index) => {
                const group = indicator.grupo;
                if (group && !groups.has(group)) {
                    const groupItem = document.createElement('li');
                    const title = document.createElement('span');
                    const children = document.createElement('ul');
                    groupItem.setAttribute('role', 'group');
                    groupItem.setAttribute('aria-label', group);
                    title.className = 'combobox-group';
                    title.setAttribute('aria-hidden', 'true');
                    title.textContent = group;
                    children.setAttribute('role', 'presentation');
                    groupItem.append(title, children);
                    list.append(groupItem);
                    groups.set(group, children);
                }
                const item = document.createElement('li');
                item.id = 'indicator-option-' + index;
                item.setAttribute('role', 'option');
                item.setAttribute('aria-selected', String(current?.clave === indicator.clave));
                item.dataset.index = index;
                item.textContent = labelDe(indicator);
                (groups.get(group) || list).append(item);
            });
        }
        status.textContent = matches.length ? matches.length + ' de ' + options.length + ' indicadores' :
            (query ? 'Sin resultados para «' + input.value.trim() + '».' : 'Sin resultados');
    }

    function open() {
        if (input.disabled) return;
        panel.hidden = false;
        input.setAttribute('aria-expanded', 'true');
        render();
    }

    function close() {
        panel.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        highlight(-1);
    }

    function commit(index) {
        if (matches[index]) choose(matches[index].clave);
    }

    input.addEventListener('click', () => {
        if (panel.hidden) open();
    });
    input.addEventListener('keydown', event => {
        if (event.altKey || event.isComposing) return;
        if (event.key === 'Escape') {
            if (!panel.hidden) {
                event.preventDefault();
                close();
            }
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (panel.hidden) open();
            if (matches.length) {
                const index = event.key === 'ArrowDown' ? Math.min(active + 1, matches.length - 1) :
                    (active < 0 ? matches.length - 1 : Math.max(0, active - 1));
                highlight(index);
            }
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (panel.hidden) open();
            else commit(active < 0 && matches.length === 1 ? 0 : active);
        }
    });
    list.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse') event.preventDefault();
    });
    list.addEventListener('click', event => {
        const item = event.target.closest('[role="option"]');
        if (item) {
            commit(Number(item.dataset.index));
            input.focus({ preventScroll: true });
        }
    });
    root.addEventListener('focusout', event => {
        if (event.relatedTarget && !root.contains(event.relatedTarget)) close();
    });
    document.addEventListener('pointerdown', event => {
        if (!root.contains(event.target)) close();
    });

    return {
        update(indicators, selected) {
            options = indicators;
            current = selected;
            input.disabled = !options.length;
            selection.textContent = current ? labelDe(current) : 'Sin indicador disponible';
            search.sync();
            if (input.disabled || root.hidden) close();
            render();
        },
        reset() {
            search.reset();
            close();
            render();
        },
        keys: () => matches.map(ind => ind.clave),
        hasQuery: () => Boolean(input.value)
    };
}
