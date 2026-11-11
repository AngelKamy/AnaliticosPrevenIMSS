const actions = {
    pdf: 'Descargar PDF',
    csv: 'Descargar CSV',
    xlsx: 'Descargar Excel',
    clipboard: 'Copiar al portapapeles',
    png: 'Descargar imagen PNG'
};
const sprite = new URL('../assets/ui-icons.svg', import.meta.url);
const svgNamespace = 'http://www.w3.org/2000/svg';

export function iconoExportacion(type) {
    const icon = document.createElementNS(svgNamespace, 'svg');
    icon.setAttribute('class', 'export-icon');
    icon.setAttribute('data-export-icon', type);
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    const use = document.createElementNS(svgNamespace, 'use');
    use.setAttribute('href', sprite.href + '#export-' + type);
    icon.append(use);
    return icon;
}

export function decorarExportacion(action, type, name = actions[type], tooltipName = name) {
    const wrapper = document.createElement('span');
    wrapper.className = 'export-control';
    const label = document.createElement('span');
    label.className = 'export-label';
    label.textContent = name;
    const tooltip = document.createElement('span');
    tooltip.className = 'export-tooltip';
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.textContent = tooltipName;
    action.classList.add('export-action');
    action.replaceChildren(iconoExportacion(type), label);
    action.replaceWith(wrapper);
    wrapper.append(action, tooltip);
    wrapper.addEventListener('keydown', event => {
        if (event.key === 'Escape') wrapper.setAttribute('data-tooltip-dismissed', '');
    });
    wrapper.addEventListener('focusout', () => wrapper.removeAttribute('data-tooltip-dismissed'));
    wrapper.addEventListener('pointerleave', () => wrapper.removeAttribute('data-tooltip-dismissed'));
    return { wrapper, label };
}
