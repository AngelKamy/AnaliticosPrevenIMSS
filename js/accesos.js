const storageKey = 'prevenimss.accesos.v1';
const filters = {
    'coberturas.html': { id: 'ageGroupTabsCobertura', param: 'grupo', label: 'Coberturas' },
    'canales_endemicos.html': { id: 'diseaseTabs', param: 'padecimiento', label: 'Canales' }
};

function readUsage() {
    try {
        return JSON.parse(localStorage.getItem(storageKey)) ?? {};
    } catch {
        return {};
    }
}

function updateUsage(module, changes) {
    const usage = readUsage();
    try {
        localStorage.setItem(storageKey, JSON.stringify({ ...usage, [module]: { ...usage[module], ...changes(usage[module]) } }));
    } catch {
        // Los enlaces originales siguen disponibles si el navegador bloquea el almacenamiento.
    }
}

const shortcuts = document.querySelector('.quick-links');
if (shortcuts) {
    const links = [...shortcuts.querySelectorAll('a')].map(link => {
        const defaultURL = new URL(link.href);
        return { link, defaultURL, module: defaultURL.pathname.split('/').at(-1) };
    });

    function refreshShortcuts() {
        const usage = readUsage();
        const ranked = links.toSorted((a, b) =>
            (usage[b.module]?.visits ?? 0) - (usage[a.module]?.visits ?? 0) ||
            (usage[b.module]?.lastVisit ?? 0) - (usage[a.module]?.lastVisit ?? 0));
        const focused = document.activeElement;
        ranked.forEach(({ link, defaultURL, module }, index) => {
            const filter = filters[module];
            if (filter) {
                const url = new URL(defaultURL);
                const params = new URLSearchParams(url.hash.slice(1));
                const remembered = usage[module]?.selection;
                const selection = typeof remembered === 'string' && remembered ? remembered : params.get(filter.param);
                params.set(filter.param, selection);
                url.hash = params.toString();
                link.href = url;
                link.querySelector('span').textContent = `${filter.label} · ${selection}`;
            }
            if (shortcuts.children[index] !== link) shortcuts.insertBefore(link, shortcuts.children[index]);
        });
        if (shortcuts.contains(focused) && document.activeElement !== focused) focused.focus({ preventScroll: true });
    }

    refreshShortcuts();
    window.addEventListener('pageshow', event => {
        if (event.persisted) refreshShortcuts();
    });
} else {
    const module = location.pathname.split('/').at(-1);
    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation || navigation.type === 'navigate') {
        updateUsage(module, previous => ({ visits: (previous?.visits ?? 0) + 1, lastVisit: Date.now() }));
    }
    const select = document.getElementById(filters[module]?.id ?? '');
    select?.addEventListener('change', () => {
        // «Todos los grupos» solo está disponible en la vista por unidad.
        if (select.value && select.value !== 'Todos los grupos') updateUsage(module, () => ({ selection: select.value }));
    });
}
