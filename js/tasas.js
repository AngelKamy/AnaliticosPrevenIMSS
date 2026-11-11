import { cargarSelector } from './ui.js';

const form = document.getElementById('rateExampleFilters');
const result = document.getElementById('rateExampleResult');
const sample = [
    ['Unidad', 'Unidad de ejemplo'],
    ['Padecimiento', 'Padecimiento de ejemplo'],
    ['Grupo de edad', 'Grupo de edad de ejemplo'],
    ['Periodo', 'Periodo de ejemplo']
];

for (const [index, [label, value]] of sample.entries()) {
    const field = document.createElement('div');
    field.className = 'filter-field';
    const title = document.createElement('label');
    const control = document.createElement('div');
    control.className = 'filter-control';
    const select = document.createElement('select');
    select.id = 'rateExampleFilter' + (index + 1);
    title.htmlFor = select.id;
    title.textContent = label;
    cargarSelector(select, [{ value: '', label: 'Cualquier ' + label.toLowerCase() }, value], '');
    control.append(select);
    field.append(title, control);
    form.append(field);
}
function render() {
    const values = [...form.querySelectorAll('select')].map((select, index) => select.value || sample[index][1]);
    result.textContent = values.join(' · ') + ' · Tasa sin calcular.';
}
form.addEventListener('change', render);
render();
