import { datos, detalles } from './JSONdatos.js';
import { cargarSelector, controlSecuencia, guardarHash, leerHash, periodosDisponibles } from './ui.js';
import { crearVistaDatos, redondearDato } from "./datos-vista.js";

document.addEventListener('DOMContentLoaded', function () {
    const yearTabsContainerElement = document.getElementById('yearTabsCobertura');
    const monthTabsContainerElement = document.getElementById('monthTabsCobertura');
    const unitTabsContainerElement = document.getElementById('unitTabsCobertura');
    const ageGroupTabsContainerElement = document.getElementById('ageGroupTabsCobertura');

    const unitTabsFilterContainer = document.getElementById('unitTabsFilterContainer');
    const coberturasVizTitleElement = document.getElementById('coberturasVisualizationTitle');
    const cardsGrid = document.getElementById('cardsGrid');


    const coverageMode = document.getElementById('coverageMode');
    const resetFilters = document.getElementById('resetCoverageFilters');
    if (!window.d3) {
        cardsGrid.querySelector('[role="status"]').textContent = 'No se pudieron cargar las gráficas. Recarga la página para volver a intentar.';
        return;
    }
    coverageMode.disabled = false;

    let selectedYear, selectedMonth, selectedUnit, selectedAgeGroup;
    let currentVisualizationMode = 'porUnidad';

    const coloresPorGrupoEdad = {
        'Niño': '#2ECC71', 'Adolescente': '#3498DB', 'Mujer': '#E74C3C',
        'Hombre': '#5D6D7E', 'Adulto Mayor': '#F39C12', 'Toda la Unidad': '#9B59B6',
        'Todos los grupos': '#7F8C8D'
    };
    const nombresCortos = {
        'Niño': ['Protocolos', 'Peso y talla <5', 'Peso y talla 5–9', 'Anemia', 'Flúor', 'Visión'],
        'Adolescente': ['Protocolos', 'Peso y talla', 'Tétanos y difteria', 'Hepatitis B', 'Sarampión/rubéola', 'Condones', 'Visión'],
        'Mujer': ['Protocolos', 'Peso y talla', 'CaCu', 'Exploración mamaria', 'Mastografía', 'Diabetes', 'Hipertensión', 'Tuberculosis'],
        'Hombre': ['Protocolos', 'Peso y talla', 'Diabetes', 'Hipertensión', 'Tuberculosis'],
        'Adulto Mayor': ['Protocolos', 'Peso y talla', 'Neumococo', 'Influenza', 'Diabetes', 'Hipertensión', 'Tuberculosis'],
        'Toda la Unidad': ['Niño', 'Adolescente', 'Mujer', 'Hombre', 'Adulto mayor']
    };
    const monthOrder = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const periods = periodosDisponibles(datos, monthOrder);
    const periodKeys = periods.map(({ year, month }) => year + '/' + month);
    const defaultPeriod = periods.at(-1);
    const orderedUnits = rows => rows.map(({ nombre }) => nombre).sort((a, b) =>
        Number(/^delegacional$/i.test(b)) - Number(/^delegacional$/i.test(a)) || a.localeCompare(b));
    const defaultUnit = orderedUnits(datos[defaultPeriod?.year]?.[defaultPeriod?.month] ?? [])[0];
    function elegirModo(mode) {
        coverageMode.querySelector('[value="' + mode + '"]').checked = true;
        currentVisualizationMode = mode;
        unitTabsFilterContainer.hidden = mode === 'porGrupo';
    }

    resetFilters.addEventListener('click', () => {
        elegirModo('porUnidad');
        selectedYear = selectedMonth = selectedUnit = selectedAgeGroup = null;
        cargarAnosTabs();
        coverageMode.querySelector(':checked').focus();
    });
    const actualizarSecuencia = controlSecuencia(document.getElementById('coveragePeriod'),
        () => periodKeys, () => selectedYear + '/' + selectedMonth, key => {
            [selectedYear, selectedMonth] = key.split('/');
            cargarAnosTabs();
        });

    coverageMode.addEventListener('change', event => {
        elegirModo(event.target.value);
        selectedYear = null; selectedMonth = null; selectedUnit = null; selectedAgeGroup = null;
        cargarAnosTabs();
    });

    yearTabsContainerElement.addEventListener('change', function () {
        selectedYear = this.value; selectedMonth = null; selectedUnit = null; selectedAgeGroup = null;
        cargarMesesTabs();
    });
    monthTabsContainerElement.addEventListener('change', function () {
        selectedMonth = this.value; selectedUnit = null; selectedAgeGroup = null;
        if (currentVisualizationMode === 'porUnidad') cargarUnidadesTabs();
        else cargarGruposEdadTabs();
    });
    unitTabsContainerElement.addEventListener('change', function () {
        selectedUnit = this.value; selectedAgeGroup = null;
        cargarGruposEdadTabs();
    });
    ageGroupTabsContainerElement.addEventListener('change', function () {
        selectedAgeGroup = this.value;
        actualizarGraficos();
    });

    function limpiarVisualizacionesYTabsInferiores(nivelActivador) {
        limpiarVisualizaciones();
        if (nivelActivador === 'ano') {
            cargarSelector(monthTabsContainerElement, []);
            cargarSelector(unitTabsContainerElement, []);
            cargarSelector(ageGroupTabsContainerElement, []);
        } else if (nivelActivador === 'mes') {
            if (currentVisualizationMode === 'porUnidad') cargarSelector(unitTabsContainerElement, []);
            cargarSelector(ageGroupTabsContainerElement, []);
        } else if (nivelActivador === 'unidad' && currentVisualizationMode === 'porUnidad') {
            cargarSelector(ageGroupTabsContainerElement, []);
        }
    }

    function limpiarVisualizaciones() {
        cardsGrid.innerHTML = '';
    }

    function cargarAnosTabs() {
        cargarSelector(yearTabsContainerElement, []);
        limpiarVisualizacionesYTabsInferiores('ano');
        const anos = Object.keys(datos).sort((a, b) => parseInt(b) - parseInt(a));
        if (anos.length > 0) {
            const prevSelectedYear = selectedYear;
            selectedYear = prevSelectedYear && anos.includes(prevSelectedYear) ? prevSelectedYear : anos[0];
            cargarSelector(yearTabsContainerElement, anos, selectedYear);
            cargarMesesTabs();
        } else { actualizarGraficos(); }
    }

    function cargarMesesTabs() {
        cargarSelector(monthTabsContainerElement, []);
        limpiarVisualizacionesYTabsInferiores('mes');
        if (!selectedYear || !datos[selectedYear]) { actualizarGraficos(); return; }
        const meses = Object.keys(datos[selectedYear]).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
        if (meses.length > 0) {
            const prevSelectedMonth = selectedMonth;
            selectedMonth = prevSelectedMonth && meses.includes(prevSelectedMonth) ? prevSelectedMonth : meses[meses.length - 1];
            cargarSelector(monthTabsContainerElement, meses, selectedMonth);
            if (currentVisualizationMode === 'porUnidad') cargarUnidadesTabs();
            else cargarGruposEdadTabs();
        } else { actualizarGraficos(); }
    }

    function cargarUnidadesTabs() {
        cargarSelector(unitTabsContainerElement, []);
        limpiarVisualizacionesYTabsInferiores('unidad');
        if (!selectedYear || !selectedMonth || !datos[selectedYear]?.[selectedMonth]) { actualizarGraficos(); return; }
        const unidades = orderedUnits(datos[selectedYear][selectedMonth]);
        if (unidades.length > 0) {
            const prevSelectedUnit = selectedUnit;
            selectedUnit = prevSelectedUnit && unidades.includes(prevSelectedUnit) ? prevSelectedUnit : unidades[0];
            cargarSelector(unitTabsContainerElement, unidades, selectedUnit);
            cargarGruposEdadTabs();
        } else { actualizarGraficos(); }
    }

    function cargarGruposEdadTabs() {
        cargarSelector(ageGroupTabsContainerElement, []);
        limpiarVisualizaciones();
        let unidadReferenciaParaGrupos = datos[selectedYear]?.[selectedMonth]?.[0];
        if (currentVisualizationMode === 'porUnidad') {
            if (!selectedUnit) { actualizarGraficos(); return; }
            unidadReferenciaParaGrupos = datos[selectedYear]?.[selectedMonth]?.find(u => u.nombre === selectedUnit) || unidadReferenciaParaGrupos;
        }
        if (!unidadReferenciaParaGrupos || !unidadReferenciaParaGrupos.gruposEdad) { actualizarGraficos(); return; }

        const ordenGruposDemograficos = ['Niño', 'Adolescente', 'Mujer', 'Hombre', 'Adulto Mayor'];
        let opcionesPestanas = [];
        if (currentVisualizationMode === 'porUnidad') opcionesPestanas.push('Todos los grupos');
        if (unidadReferenciaParaGrupos.gruposEdad['Toda la Unidad']) opcionesPestanas.push('Toda la Unidad');
        opcionesPestanas.push(...ordenGruposDemograficos.filter(g => unidadReferenciaParaGrupos.gruposEdad[g]));

        const prevSelectedAgeGroup = selectedAgeGroup;
        if (currentVisualizationMode === 'porUnidad') {
            selectedAgeGroup = prevSelectedAgeGroup && opcionesPestanas.includes(prevSelectedAgeGroup) ? prevSelectedAgeGroup : 'Todos los grupos';
        } else {
            const gruposValidosParaModoGrupo = opcionesPestanas.filter(g => g !== 'Todos los grupos');
            selectedAgeGroup = prevSelectedAgeGroup && gruposValidosParaModoGrupo.includes(prevSelectedAgeGroup) ? prevSelectedAgeGroup : (gruposValidosParaModoGrupo.length > 0 ? gruposValidosParaModoGrupo[0] : null);
        }

        cargarSelector(ageGroupTabsContainerElement, opcionesPestanas, selectedAgeGroup);
        actualizarGraficos();
    }

    function actualizarTituloPrincipal() {
        const period = selectedMonth && selectedYear ? `${selectedMonth} ${selectedYear}` : null;
        const unit = currentVisualizationMode === 'porUnidad' ? selectedUnit : null;
        const context = [unit, selectedAgeGroup, period].filter(Boolean);
        coberturasVizTitleElement.textContent = context.join(' · ') || 'Resultados de cobertura';
    }

    const vistaDatos = crearVistaDatos(document.getElementById('coverageDataView'), () => ({
        title: 'Coberturas · ' + coberturasVizTitleElement.textContent,
        columns: ['Unidad', 'Grupo', 'Acción', 'Cobertura (%)', 'Detalle'],
        rows: [...cardsGrid.querySelectorAll('.coverage-card')].flatMap(card => card.__data__ || [])
    }));

    function actualizarGraficos() {
        renderGraficos();
        vistaDatos.actualizar();
    }

    function renderGraficos() {
        limpiarVisualizaciones();
        actualizarTituloPrincipal();
        actualizarSecuencia();
        resetFilters.hidden = currentVisualizationMode === 'porUnidad' && selectedYear === defaultPeriod?.year &&
            selectedMonth === defaultPeriod?.month && selectedUnit === defaultUnit && selectedAgeGroup === 'Todos los grupos';
        guardarHash({ anio: selectedYear, mes: selectedMonth, modo: currentVisualizationMode, unidad: selectedUnit, grupo: selectedAgeGroup });
        cardsGrid.dataset.mode = currentVisualizationMode;

        if (currentVisualizationMode === 'porUnidad') {
            if (!selectedYear || !selectedMonth || !selectedUnit || !selectedAgeGroup) {
                cardsGrid.innerHTML = '<p class="no-data-message">Por favor, complete todas las selecciones de filtros.</p>'; return;
            }
            const unidadDatos = datos[selectedYear]?.[selectedMonth]?.find(u => u.nombre === selectedUnit);
            if (!unidadDatos || !unidadDatos.gruposEdad) {
                cardsGrid.innerHTML = `<p class="no-data-message">No hay datos para ${selectedUnit} en ${selectedMonth} ${selectedYear}.</p>`; return;
            }
            if (selectedAgeGroup === 'Todos los grupos') {
                const ordenGrupos = ['Niño', 'Adolescente', 'Mujer', 'Hombre', 'Adulto Mayor', 'Toda la Unidad'];
                ordenGrupos.forEach(grupo => { if (unidadDatos.gruposEdad[grupo]) crearRadarChart(grupo, unidadDatos.gruposEdad[grupo], selectedUnit, selectedMonth, selectedYear, cardsGrid); });
            } else {
                const datosGrupoSel = unidadDatos.gruposEdad[selectedAgeGroup];
                if (datosGrupoSel) crearRadarChart(selectedAgeGroup, datosGrupoSel, selectedUnit, selectedMonth, selectedYear, cardsGrid);
                else cardsGrid.innerHTML = `<p class="no-data-message">No hay datos para '${selectedAgeGroup.replace(/([A-Z])/g, ' $1').trim()}' en la selección actual.</p>`;
            }
        } else { // Modo 'porGrupo'
            if (!selectedYear || !selectedMonth || !selectedAgeGroup || selectedAgeGroup === 'Todos los grupos') {
                cardsGrid.innerHTML = '<p class="no-data-message">Por favor, seleccione Año, Mes y un Grupo Demográfico específico.</p>'; return;
            }
            const unidadesEnMes = datos[selectedYear]?.[selectedMonth];
            if (!unidadesEnMes || unidadesEnMes.length === 0) { cardsGrid.innerHTML = '<p class="no-data-message">No hay unidades con datos.</p>'; return; }

            const unidadesConDatos = unidadesEnMes.map(u => {
                const dG = u.gruposEdad[selectedAgeGroup];
                if (dG && dG.valores && dG.valores.length > 0) return { nombre: u.nombre, datosGrupo: dG, promedio: dG.valores.reduce((a,b)=>a+b,0)/dG.valores.length };
                return null;
            }).filter(u => u !== null);

            if (unidadesConDatos.length === 0) { cardsGrid.innerHTML = `<p class="no-data-message">No hay datos para '${selectedAgeGroup.replace(/([A-Z])/g, ' $1').trim()}' en ${selectedMonth} ${selectedYear}.</p>`; return; }

            let delegacionalData = null;
            const otrasUnidades = unidadesConDatos.filter(u => { if (u.nombre.toLowerCase() === 'delegacional') { delegacionalData = u; return false; } return true; });
            otrasUnidades.sort((a, b) => b.promedio - a.promedio);

            otrasUnidades.forEach(uData => crearRadarChart(selectedAgeGroup, uData.datosGrupo, uData.nombre, selectedMonth, selectedYear, cardsGrid, false));
            if (delegacionalData) crearRadarChart(selectedAgeGroup, delegacionalData.datosGrupo, delegacionalData.nombre, selectedMonth, selectedYear, cardsGrid, true); // Renderizar Delegacional al final en cardsGrid
        }
    }

    function crearRadarChart(grupoEdad, datosGrupo, unidadMedica, mes, ano, contenedor, esDelegacional = false) {
        const size = 300;
        const radius = 106;
        const groupColor = coloresPorGrupoEdad[grupoEdad] || '#3498DB';
        const card = d3.select(contenedor).append('article')
            .attr('class', 'coverage-card panel');

        let cardTitleText, cardSubText;
        const promedioActual = (valores) => {
            if (!valores || valores.length === 0) return "N/A";
            return (valores.reduce((a,b) => a+b, 0) / valores.length).toFixed(1);
        };
        const prom = promedioActual(datosGrupo.valores);

        if (currentVisualizationMode === 'porUnidad') {
            cardTitleText = grupoEdad.replace(/([A-Z](?=[a-z]))/g, ' $1').trim();
            cardSubText = `${unidadMedica} - ${mes} ${ano}`;
        } else {
            cardTitleText = unidadMedica;
            cardSubText = `${grupoEdad.replace(/([A-Z](?=[a-z]))/g, ' $1').replace(/^Toda la Unidad$/, 'Toda la UMF (Promedio)') .trim()} (${prom}%) - ${mes} ${ano}`;
             if (esDelegacional) cardTitleText = "Delegacional";
        }

        card.append("div")
            .attr("class", "coverage-card-title")
            .html(`<h3>${cardTitleText}</h3><small>${cardSubText}</small>`);

        card.append('p').attr('class', 'coverage-average').html(`Cobertura <strong>${prom}%</strong>`);
        const chart = card.append('svg')
            .attr('class', 'radar')
            .attr('viewBox', `0 0 ${size} ${size}`)
            .attr('role', 'img')
            .attr('aria-label', `Radar de cobertura para ${cardTitleText}. Cobertura ${prom} %. Valores en el detalle de acciones.`);
        const svg = chart.append('g').attr('transform', `translate(${size / 2}, ${size / 2})`);

        const maxValor = 100;
        const escala = d3.scaleLinear().domain([0, maxValor]).range([0, radius]);
        const anguloSlice = (Math.PI * 2) / datosGrupo.labels.length;

        const line = d3.lineRadial().angle((_, i) => anguloSlice * i).radius(d => escala(d)).curve(d3.curveLinearClosed);

        svg.selectAll(".axis").data(datosGrupo.labels).enter().append("line")
            .attr("x1", 0).attr("y1", 0)
            .attr("x2", (_, i) => Math.sin(anguloSlice * i) * radius)
            .attr("y2", (_, i) => -Math.cos(anguloSlice * i) * radius)
            .attr("stroke", "#CDCDCD").attr("stroke-width", 1).attr("stroke-dasharray", "3 3");

        const niveles = 4;
        for (let j = 0; j < niveles; j++) {
            const nivelValor = (maxValor / niveles) * (j + 1);
            svg.append("circle").attr("cx", 0).attr("cy", 0).attr("r", escala(nivelValor))
                .style("fill", "none").style("stroke", "#E0E0E0").style("stroke-dasharray", "2 2").style("stroke-width", 0.7);
        }

        svg.append("path").datum(datosGrupo.valores).attr("d", line)
            .attr("fill", groupColor).attr("fill-opacity", 0.35)
            .attr("stroke", groupColor).attr("stroke-width", 2.5);

        svg.selectAll(".punto-dato").data(datosGrupo.valores).enter().append("circle")
            .attr("class", "punto-dato")
            .attr("cx", (d, i) => Math.sin(anguloSlice * i) * escala(d))
            .attr("cy", (d, i) => -Math.cos(anguloSlice * i) * escala(d))
            .attr("r", 3).attr("fill", "white")
            .attr("stroke", groupColor).attr("stroke-width", 1.5)
;

        svg.selectAll(".label-eje").data(datosGrupo.labels).enter().append("text")
            .attr("class", "label-eje")
            .attr("x", (_, i) => Math.sin(anguloSlice * i) * (radius * 1.23))
            .attr("y", (_, i) => -Math.cos(anguloSlice * i) * (radius * 1.23))
            .text(d => d)
            .attr("text-anchor", (_,i) => { const angleDeg=(anguloSlice*i*180/Math.PI+360)%360; if(Math.abs(angleDeg-0)<1e-6||Math.abs(angleDeg-180)<1e-6)return"middle";if(angleDeg>0&&angleDeg<180)return"start";return"end";})
            .attr("dy", (_,i) => { const angleDeg=(anguloSlice*i*180/Math.PI+360)%360; if(Math.abs(angleDeg-90)<1e-6)return"-0.4em";if(Math.abs(angleDeg-270)<1e-6)return"0.8em";return"0.3em";})
;

        card.append('p').attr('class', 'radar-scale').text('Anillos desde el centro · 25 / 50 / 75 / 100 %');
        const actions = datosGrupo.labels.map((label, i) => ({
            label,
            shortName: nombresCortos[grupoEdad]?.[i] || 'Acción ' + label,
            name: detalles[grupoEdad]?.[i]?.replace(/^\d+\.\s*/, '') || 'Acción ' + label,
            value: datosGrupo.valores[i]
        }));
        const minimum = d3.min(actions, d => Number.isFinite(d.value) ? d.value : undefined);
        card.datum(actions.map(action => [unidadMedica, grupoEdad, action.label + '. ' + action.name,
            redondearDato(action.value, 1), action.value === minimum ? 'Menor cobertura' : null]));
        card.append('ul').attr('class', 'radar-axis-legend').attr('aria-label', 'Acciones de los ejes')
            .selectAll('li').data(actions).join('li').text(d => `${d.label} · ${d.shortName}`);
        const disclosure = card.append('details').attr('class', 'coverage-details');
        disclosure.append('summary').text(minimum == null ? 'Ver acciones y valores' : `Ver valores · mínimo ${minimum.toFixed(1)} %`);
        const table = disclosure.append('table').attr('class', 'data-table')
            .attr('aria-label', `Acciones de cobertura para ${cardTitleText}`);
        table.append('thead').append('tr').html('<th scope="col">Acción</th><th scope="col">Cobertura</th>');
        const rows = table.append('tbody').selectAll('tr').data(actions).join('tr')
            .classed('coverage-minimum', d => d.value === minimum);
        const names = rows.append('th').attr('scope', 'row');
        names.append('span').text(d => `${d.label}. ${d.name}`);
        names.filter(d => d.value === minimum).append('small').text('Menor cobertura');
        const values = rows.append('td').attr('class', 'numeric');
        values.append('span').text(d => Number.isFinite(d.value) ? `${d.value.toFixed(1)} %` : 'Sin información');
        values.filter(d => Number.isFinite(d.value)).append('svg').attr('class', 'coverage-data-bar')
            .attr('viewBox', '0 0 100 6').attr('aria-hidden', 'true')
            .append('rect').attr('width', d => d.value).attr('height', 6).attr('fill', groupColor);
    }

    function restaurarHash() {
        const params = leerHash();
        elegirModo(params.get('modo') === 'porGrupo' ? 'porGrupo' : 'porUnidad');
        selectedYear = params.get('anio');
        selectedMonth = params.get('mes');
        selectedUnit = currentVisualizationMode === 'porUnidad' ? params.get('unidad') : null;
        selectedAgeGroup = params.get('grupo');
        cargarAnosTabs();
    }

    window.addEventListener('hashchange', () => {
        if (location.hash !== '#contenido') restaurarHash();
    });
    restaurarHash();
});