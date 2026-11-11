export function cargarSelector(select, options, selected) {
    select.replaceChildren(...options.map(option => {
        const { value, label } = typeof option === 'object' ? option : { value: option, label: option };
        return new Option(label, value);
    }));
    select.disabled = options.length === 0;
    if (selected != null) select.value = selected;
}

export function posicionarTooltip(tooltip, event) {
    const anchor = event.currentTarget.getBoundingClientRect();
    const x = event.clientX ?? anchor.left + anchor.width / 2;
    const y = event.clientY ?? anchor.top;
    const gap = 12;
    tooltip.style.left = Math.max(gap, Math.min(x + gap, innerWidth - tooltip.offsetWidth - gap)) + 'px';
    tooltip.style.top = Math.max(gap, Math.min(y + gap, innerHeight - tooltip.offsetHeight - gap)) + 'px';
}

export function normalizarBusqueda(text) {
    return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

export function configurarBusqueda(input, onChange) {
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'search-clear';
    clear.setAttribute('aria-label', 'Limpiar búsqueda');
    clear.textContent = '×';
    input.after(clear);
    function sync() {
        clear.hidden = !input.value || input.disabled;
    }
    function reset() {
        input.value = '';
        sync();
    }
    input.addEventListener('input', () => {
        sync();
        onChange();
    });
    input.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || event.isComposing || !input.value) return;
        event.preventDefault();
        reset();
        onChange();
    });
    clear.addEventListener('click', () => {
        reset();
        input.focus();
        onChange();
    });
    sync();
    return { reset, sync };
}

export function leerHash() {
    return new URLSearchParams(location.hash.slice(1));
}

export function guardarHash(values) {
    const params = location.hash.includes('=') ? leerHash() : new URLSearchParams();
    for (const [key, value] of Object.entries(values)) {
        if (value == null || value === '') params.delete(key);
        else params.set(key, value);
    }
    const hash = params.toString();
    if (hash && location.hash !== '#' + hash) history.replaceState(null, '', '#' + hash);
}

export function periodosDisponibles(data, months) {
    return Object.keys(data).sort().flatMap(year =>
        months.filter(month => Object.hasOwn(data[year], month)).map(month => ({ year, month }))
    );
}

export function controlSecuencia(container, options, current, choose) {
    const buttons = [...container.querySelectorAll('[data-step]')];
    const move = step => {
        const index = options().findIndex(value => value === current());
        const target = options()[index + step];
        if (index >= 0 && target != null) choose(target);
    };
    buttons.forEach(button => button.addEventListener('click', () => move(Number(button.dataset.step))));
    container.addEventListener('keydown', event => {
        if (!event.altKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        move(event.key === 'ArrowLeft' ? -1 : 1);
    });
    return () => {
        const sequence = options();
        const index = sequence.findIndex(value => value === current());
        buttons.forEach(button => {
            button.disabled = index < 0 || sequence[index + Number(button.dataset.step)] == null;
        });
    };
}
