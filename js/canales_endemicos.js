/**
 * @file canales_endemicos.js
 * @description Lógica para visualización de canales endémicos usando D3.js con Ejes Etiquetados, Descarga 16:9 inferior derecha y animaciones.
 */

import { JSONende, mapeosSemanasPorAno } from './JSONende.js';
import { cargarSelector, posicionarTooltip, leerHash, guardarHash } from "./ui.js";
import { crearVistaDatos, descargarArchivo, redondearDato } from "./datos-vista.js";
import { decorarExportacion } from "./iconos-exportacion.js";

document.addEventListener('DOMContentLoaded', function () {
    if (!window.d3) {
        document.querySelector('#graficoCanalesEndemicos [role="status"]').textContent = 'No se pudieron cargar las gráficas. Recarga la página para volver a intentar.';
        return;
    }
    // --- ELEMENTOS DEL DOM ---
    const diseaseTabsContainer = document.getElementById('diseaseTabs');
    const unitTabsContainer = document.getElementById('unitTabsCanales');
    const yearTabsContainer = document.getElementById('yearTabsEndemicos');
    const chartType = document.getElementById('chartType');
    let dataSnapshot = { title: 'Canales endémicos', columns: [], rows: [] };
    const vistaDatos = crearVistaDatos(document.getElementById('channelDataView'), () => dataSnapshot, drawChart);
    const downloadButton = document.getElementById('btnDescargarGrafica');
    decorarExportacion(downloadButton, 'png', 'Descargar imagen PNG (16:9)', 'Descargar imagen PNG');
    const exportStatus = document.getElementById('channelExportStatus');
    let plotSnapshot = null;
    const legend = d3.select('#channelLegend');
    const yearTabsNav = document.getElementById('yearTabsNav');
    const chartTitleElement = document.getElementById('chartTitleEndemicos');
    const chartSubtitleElement = document.getElementById('chartSubtitleEndemicos');
    const chartContainer = d3.select("#graficoCanalesEndemicos");
    const tooltipElement = d3.select("#tooltipCanales");
    const statsContainer = document.getElementById('statsCanales');

    // --- ESTADO Y CONFIGURACIÓN ---
    let selectedDiseaseKey = null;
    let selectedUnitKey = null;
    let selectedYearForChannel = null;
    let selectedChartType = 'canalSemanal';
    const monthAbbreviations = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    // Colores originales
    const COLORS = {
        ZONA_EPIDEMIA: "#E53935",
        ZONA_ALARMA: "#f39c12",
        ZONA_ALERTA: "#FDD835",
        ZONA_EXITO: "#43A047",
        MEDIANA_HISTORICA: "rgba(155, 89, 182, 0.5)",
        CASOS_ACTUALES: "#1E88E5",
        BARRAS_INCIDENCIA: "#1E88E5",
        BARRAS_TENDENCIA: "#64B5F6",
        LINEA_TENDENCIA: "#E53935"
    };

    const ZONAS = {
        exito:    { label: 'Éxito', color: COLORS.ZONA_EXITO },
        alerta:   { label: 'Seguridad', color: COLORS.ZONA_ALERTA },
        alarma:   { label: 'Alarma', color: COLORS.ZONA_ALARMA },
        epidemia: { label: 'Epidemia', color: COLORS.ZONA_EPIDEMIA }
    };

    const margin = { top: 24, right: 18, bottom: 52, left: 52 };
    let svgWidth;

    const chartDescriptions = {
        canalSemanal: "Compara los casos semanales del año seleccionado contra los cuartiles históricos (Q1, Mediana y Q3), calculados con hasta 7 años previos disponibles.",
        canalMensual: "Canal histórico con datos agregados por mes, calculado con hasta 7 años previos disponibles. Permite observar tendencias a mediano plazo.",
        incidenciaSemanal: "Presenta el número de casos reportados cada semana para el año seleccionado. Incluye una línea de tendencia de media móvil de 4 períodos.",
        incidenciaMensual: "Muestra el total de casos reportados cada mes para el año seleccionado. Incluye una línea de tendencia de media móvil de 4 períodos.",
        tendenciaAnual: "Gráfico de barras que compara el total de casos anuales para la enfermedad seleccionada. Incluye una línea de tendencia de media móvil de 4 períodos."
    };

    function init() {
        chartType.disabled = false;
        chartType.addEventListener('change', () => {
            selectedChartType = chartType.value;
            yearTabsNav.hidden = selectedChartType === 'tendenciaAnual';
            populateYearTabs();
        });
        diseaseTabsContainer.addEventListener('change', () => {
            selectedDiseaseKey = diseaseTabsContainer.value;
            selectedUnitKey = null;
            selectedYearForChannel = null;
            populateUnitTabs();
        });
        unitTabsContainer.addEventListener('change', () => {
            selectedUnitKey = unitTabsContainer.value;
            populateYearTabs();
        });
        yearTabsContainer.addEventListener('change', () => {
            selectedYearForChannel = yearTabsContainer.value;
            drawChart();
        });
        window.addEventListener('hashchange', () => {
            if (location.hash !== '#contenido') restaurarHash();
        });
        restaurarHash();

        window.addEventListener('resize', () => {
            if (chartContainer.node().clientWidth !== svgWidth && !downloadButton.disabled) drawChart();
        });
        downloadButton.addEventListener('click', descargarGrafica16x9);
    }

    function restaurarHash() {
        const diseases = Object.keys(JSONende);
        const params = leerHash();
        const disease = params.get('padecimiento');
        selectedDiseaseKey = diseases.includes(disease) ? disease : diseases[0] ?? null;
        const type = params.get('tipo');
        selectedChartType = [...chartType.options].some(option => option.value === type) ? type : 'canalSemanal';
        chartType.value = selectedChartType;
        yearTabsNav.hidden = selectedChartType === 'tendenciaAnual';
        selectedUnitKey = params.get('unidad');
        selectedYearForChannel = params.get('anio');
        cargarSelector(diseaseTabsContainer, diseases.map(key => ({ value: key, label: JSONende[key].nombreDisplay || key })), selectedDiseaseKey);
        populateUnitTabs();
    }

    function showEmpty(message) {
        chartContainer.html('').append('p').attr('class', 'no-data-message').attr('role', 'status').text(message);
        plotSnapshot = null;
        chartTitleElement.textContent = 'Vigilancia epidemiológica';
        chartSubtitleElement.textContent = '';
        limpiarStats();
        legend.html('');
        dataSnapshot = { title: 'Canales endémicos', columns: [], rows: [] };
        vistaDatos.actualizar();
        downloadButton.disabled = true;
        tooltipElement.attr('hidden', '');
    }

    function populateUnitTabs() {
        const units = Object.keys(JSONende[selectedDiseaseKey]?.unidades || {}).sort((a, b) => {
            if (a === 'Delegacional') return -1;
            if (b === 'Delegacional') return 1;
            return a.localeCompare(b);
        });
        if (!units.includes(selectedUnitKey)) selectedUnitKey = units[0] ?? null;
        cargarSelector(unitTabsContainer, units, selectedUnitKey);
        populateYearTabs();
    }

    function populateYearTabs() {
        const allWeeklyData = JSONende[selectedDiseaseKey]?.unidades?.[selectedUnitKey]?.datosSemanales;
        if (!allWeeklyData) {
            cargarSelector(yearTabsContainer, []);
            showEmpty('No hay datos disponibles para la unidad seleccionada.');
            return;
        }

        let years = Object.keys(allWeeklyData).map(y => parseInt(y)).sort((a, b) => b - a);
        if (selectedChartType === 'canalSemanal' || selectedChartType === 'canalMensual') {
            years = years.filter(year => {
                const anteriores = Array.from({ length: 7 }, (_, i) => year - i - 1)
                    .filter(anio => allWeeklyData[anio]?.some(v => Number.isFinite(v)));
                return anteriores.length === 7 || (year >= 2023 && anteriores.length > 0);
            });
        }

        if (!years.includes(parseInt(selectedYearForChannel))) {
            selectedYearForChannel = years[0]?.toString() ?? null;
        }
        cargarSelector(yearTabsContainer, years, selectedYearForChannel);

        if (years.length === 0) {
            showEmpty(`No existen años anteriores con información para calcular un canal en ${selectedUnitKey}. Puedes consultar incidencia o tendencia anual.`);
            return;
        }
        drawChart();
    }

    // --- FUNCIONES DE STATS CARDS ---
    function zonaActual(val, q1, median, q3) {
        if (!Number.isFinite(val) || !Number.isFinite(q1) || !Number.isFinite(median) || !Number.isFinite(q3)) return null;
        if (val <= q1)     return 'exito';
        if (val <= median) return 'alerta';
        if (val <= q3)     return 'alarma';
        return 'epidemia';
    }

    function resumenDelCorte(chart, isAnnual, isChannel, isWeekly) {
        const current = isAnnual ? chart.annualTotals.map(row => row.total) : chart.current;
        const valid = current.filter(Number.isFinite);
        const lastIndex = current.findLastIndex(Number.isFinite);
        const value = current[lastIndex];
        const zone = isChannel ? ZONAS[zonaActual(value, chart.q1[lastIndex], chart.median[lastIndex], chart.q3[lastIndex])] : null;
        const missing = 'Sin información';
        const notApplicable = 'No aplica';
        const period = isWeekly || isAnnual ? 'Semana actual' : 'Mes actual';
        const latest = isWeekly || isAnnual ? 'Casos en la última semana' : 'Casos en el último mes';
        return [
            ['Total de casos', valid.length ? valid.reduce((sum, count) => sum + count, 0) : missing],
            [period, isAnnual ? notApplicable : lastIndex < 0 ? missing : lastIndex + 1],
            [latest, isAnnual ? notApplicable : value ?? missing],
            ['Nivel de riesgo', isChannel ? zone?.label ?? missing : notApplicable, zone?.color]
        ];
    }

    function renderStats(stats) {
        statsContainer.hidden = false;
        const items = d3.select(statsContainer).html('').selectAll('div').data(stats).join('div');
        items.append('dt').text(d => d[0]);
        const values = items.append('dd');
        values.filter(d => d[2]).append('svg').attr('width', 15).attr('height', 15).attr('aria-hidden', 'true')
            .append('rect').attr('width', 15).attr('height', 15).attr('rx', 2).attr('fill', d => d[2]);
        values.append('span').text(d => d[1]);
    }

    function limpiarStats() {
        statsContainer.replaceChildren();
        statsContainer.hidden = true;
    }

    // --- PROCESAMIENTO DE DATOS ---
    function processDataForChart() {
        if (!selectedDiseaseKey || !selectedUnitKey || !JSONende[selectedDiseaseKey]?.unidades?.[selectedUnitKey]?.datosSemanales) return null;
        if (selectedChartType !== 'tendenciaAnual' && !selectedYearForChannel) return null;

        const disease = JSONende[selectedDiseaseKey];
        const unitData = disease.unidades[selectedUnitKey];
        const allWeeklyData = unitData.datosSemanales;
        const currentYear = parseInt(selectedYearForChannel);
        let dataPackage = { diseaseName: disease.nombreDisplay, unitName: selectedUnitKey, year: selectedYearForChannel, type: selectedChartType, current: [] };

        const isMonthly = selectedChartType.includes('Mensual');
        const isChannel = selectedChartType.includes('canal');

        if (selectedChartType !== 'tendenciaAnual') {
            const currentDataRaw = allWeeklyData[selectedYearForChannel] || [];
            if (isChannel) {
                const historicalYears = Array.from({ length: 7 }, (_, i) => (currentYear - (i + 1)).toString())
                    .filter(year => allWeeklyData[year]?.some(v => Number.isFinite(v)));
                dataPackage.historicalYears = historicalYears;
                let historicalPeriodData = historicalYears.map(year => {
                    const weeklyData = allWeeklyData[year];
                    return isMonthly ? aggregateWeeklyToMonthly(weeklyData, year) : weeklyData;
                }).filter(Boolean);

                const numPeriods = isMonthly ? 12 : Math.max(0, ...historicalPeriodData.map(d => d.length), currentDataRaw.length);
                if (numPeriods === 0) return null;
                dataPackage.numPeriods = numPeriods;

                const padArray = (arr, len) => arr && arr.length < len ? [...arr, ...Array(len - arr.length).fill(null)] : (arr ? arr.slice(0, len) : Array(len).fill(null));

                historicalPeriodData = historicalPeriodData.map(arr => padArray(arr, numPeriods));
                dataPackage.current = isMonthly ? aggregateWeeklyToMonthly(currentDataRaw, selectedYearForChannel) : padArray(currentDataRaw, numPeriods);

                dataPackage.q1 = [], dataPackage.median = [], dataPackage.q3 = [];
                for (let i = 0; i < numPeriods; i++) {
                    const periodValues = historicalPeriodData.map(yearData => yearData[i]).filter(v => v != null);
                    periodValues.sort((a, b) => a - b);
                    // Cuando no hay historia, conservar null en vez de fabricar límites cero.
                    dataPackage.q1.push(periodValues.length ? d3.quantile(periodValues, 0.25) : null);
                    dataPackage.median.push(periodValues.length ? d3.quantile(periodValues, 0.5) : null);
                    dataPackage.q3.push(periodValues.length ? d3.quantile(periodValues, 0.75) : null);
                }
            } else {
                dataPackage.current = isMonthly ? aggregateWeeklyToMonthly(currentDataRaw, selectedYearForChannel) : currentDataRaw;
                dataPackage.numPeriods = dataPackage.current?.length ?? 0;
            }
        } else {
            dataPackage.annualTotals = Object.keys(allWeeklyData).map(year => ({
                year: parseInt(year),
                total: allWeeklyData[year].reduce((sum, val) => sum + (val || 0), 0)
            })).sort((a, b) => a.year - b.year);
        }
        return dataPackage;
    }

    function aggregateWeeklyToMonthly(weeklyData, year) {
        const weekToMonthMap = mapeosSemanasPorAno[year];
        if (!weekToMonthMap || !weeklyData) return null;
        const monthlyCases = Array(12).fill(null);
        weeklyData.forEach((cases, index) => {
            if (cases !== null && !isNaN(cases)) {
                const month = weekToMonthMap[index + 1];
                if (month) {
                    const monthIndex = month - 1;
                    monthlyCases[monthIndex] = (monthlyCases[monthIndex] || 0) + cases;
                }
            }
        });
        return monthlyCases;
    }

    function calculateMovingAverage(data, period = 4) {
        if (!data || data.length < period) return [];
        const movingAverage = Array(period - 1).fill(null);
        for (let i = period - 1; i < data.length; i++) {
            const slice = data.slice(i - period + 1, i + 1).filter(d => d !== null);
            movingAverage.push(slice.length > 0 ? d3.sum(slice) / slice.length : null);
        }
        return movingAverage;
    }

    function drawChart() {
        guardarHash({ padecimiento: selectedDiseaseKey, unidad: selectedUnitKey, anio: selectedYearForChannel, tipo: selectedChartType });
        chartContainer.html('');
        tooltipElement.attr('hidden', '');
        const chartData = processDataForChart();
        const isAnnual = selectedChartType === 'tendenciaAnual';
        const isChannel = selectedChartType.startsWith('canal');
        const isWeekly = selectedChartType.endsWith('Semanal');

        if (!chartData || !(isAnnual ? chartData.annualTotals?.length : chartData.current?.length)) {
            showEmpty('No hay datos disponibles para la selección actual.');
            return;
        }

        svgWidth = chartContainer.node().clientWidth || chartContainer.node().closest('.report-panel').clientWidth;
        const svgHeight = svgWidth < 500 ? 300 : 420;

        const periodo = isAnnual ? 'Tendencia anual' : chartData.year;
        chartTitleElement.textContent = `${chartData.diseaseName} en ${chartData.unitName} (${periodo})`;
        const nHistoricos = chartData.historicalYears?.length ?? 0;
        const notaHistorica = isChannel && nHistoricos < 7
            ? ` Canal exploratorio con ${nHistoricos} año(s) previo(s) disponible(s). Un canal completo usa siete años.`
            : '';
        const notaPadecimiento = JSONende[selectedDiseaseKey]?.notaDatos || '';
        chartSubtitleElement.textContent = `${chartDescriptions[selectedChartType]}${notaHistorica} ${notaPadecimiento}`.trim();

        const stats = resumenDelCorte(chartData, isAnnual, isChannel, isWeekly);
        renderStats(stats);

        const periods = isAnnual ? chartData.annualTotals.map(d => d.year) :
            d3.range(1, Math.min(chartData.numPeriods, isWeekly ? 53 : 12) + 1);
        const values = isAnnual ? chartData.annualTotals.map(d => d.total) : chartData.current.slice(0, periods.length);
        const lastObserved = values.reduce((last, value, index) => Number.isFinite(value) ? index : last, -1);
        const plotCount = isWeekly && !isChannel ? Math.max(1, lastObserved + 1) : periods.length;
        const averages = isChannel ? [] : calculateMovingAverage(values.slice(0, plotCount), 4);
        const periodName = isWeekly ? 'Semana epidemiológica' : isAnnual ? 'Año' : 'Mes';
        const periodLabel = i => isWeekly || isAnnual ? periods[i] : monthAbbreviations[i];
        const rows = periods.map((period, i) => ({
            period,
            label: periodLabel(i),
            value: values[i],
            q1: chartData.q1?.[i],
            median: chartData.median?.[i],
            q3: chartData.q3?.[i],
            average: averages[i]
        }));
        const entries = legendEntries(isChannel, isAnnual);
        renderLegend(entries);
        renderDataTable(rows, periodName, isChannel);

        const scope = isAnnual ? `${periods[0]}–${periods.at(-1)}` : chartData.year;
        const unit = /^delegacional$/i.test(selectedUnitKey) ? 'OOAD Hidalgo' : selectedUnitKey;
        const title = `${selectedDiseaseKey} - ${unit} ${scope}`;
        plotSnapshot = { title, stats, entries, plotted: rows.slice(0, plotCount), isChannel, isAnnual, isWeekly, periodName, year: chartData.year };
        const svg = chartContainer.append('svg').attr('width', svgWidth).attr('height', svgHeight)
            .attr('role', 'img').attr('aria-labelledby', 'chartTitleEndemicos')
            .attr('aria-describedby', 'chartSubtitleEndemicos');
        renderPlot(svg, plotSnapshot, svgWidth, svgHeight, true);
        downloadButton.disabled = false;
    }

    function renderPlot(root, { plotted, isChannel, isAnnual, isWeekly, periodName, year }, outerWidth, outerHeight, interactive) {
        const width = outerWidth - margin.left - margin.right;
        const height = outerHeight - margin.top - margin.bottom;
        const svg = root.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
        const xDomain = plotted.map(d => d.period);
        const xScale = isChannel
            ? d3.scaleLinear().domain([1, plotted.length]).range([0, width])
            : d3.scaleBand().domain(xDomain).range([0, width]).padding(isAnnual ? 0.3 : 0.2);
        const x = d => xScale(d.period) + (isChannel ? 0 : xScale.bandwidth() / 2);
        const max = isChannel
            ? Math.max(d3.max(plotted, d => d.q3) || 0, d3.max(plotted, d => d.value) || 0, 10)
            : d3.max(plotted, d => d.value) || 10;
        const y = d3.scaleLinear().domain([0, max * 1.1]).range([height, 0]).nice();

        const tickStep = Math.max(1, Math.ceil(plotted.length / Math.max(1, Math.floor(width / (isWeekly ? 25 : 40)))));
        const ticks = xDomain.filter((_, i) => i % tickStep === 0);
        const formatTick = d => isWeekly || isAnnual ? String(d) : monthAbbreviations[d - 1];
        svg.append('g').attr('class', 'eje-x').attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickValues(ticks).tickFormat(formatTick).tickSizeOuter(0));
        svg.append('g').attr('class', 'eje-y').call(d3.axisLeft(y).ticks(6).tickFormat(d3.format('d')));
        svg.append('text').attr('class', 'eje-label').attr('x', 0).attr('y', -9).text('Casos');
        svg.append('text').attr('class', 'eje-label').attr('text-anchor', 'middle')
            .attr('x', width / 2).attr('y', height + 39).text(periodName);

        if (isChannel) drawChannel(svg, plotted, x, y, max);
        else drawIncidence(svg, plotted, xScale, x, y, isAnnual, height);
        if (interactive) addChartTooltip(svg, plotted, x, y, periodName, isChannel, year, width, height);
    }

    function drawChannel(svg, rows, x, y, max) {
        const areas = [
            [() => 0, d => d.q1, COLORS.ZONA_EXITO],
            [d => d.q1, d => d.median, COLORS.ZONA_ALERTA],
            [d => d.median, d => d.q3, COLORS.ZONA_ALARMA],
            [d => d.q3, () => max * 1.1, COLORS.ZONA_EPIDEMIA]
        ];
        for (const [lower, upper, fill] of areas) {
            const area = d3.area().x(x).y0(d => y(lower(d))).y1(d => y(upper(d)))
                .defined(d => lower(d) != null && upper(d) != null);
            svg.append('path').datum(rows).attr('fill', fill).attr('d', area);
        }
        drawLine(svg, rows, x, y, 'median', COLORS.MEDIANA_HISTORICA, 2, '4 4');
        drawLine(svg, rows, x, y, 'value', COLORS.CASOS_ACTUALES, 3);
        svg.selectAll('.current-case-point').data(rows.filter(d => Number.isFinite(d.value))).join('circle')
            .attr('class', 'current-case-point').attr('cx', x).attr('cy', d => y(d.value))
            .attr('r', d => d.value === 0 ? 3.5 : 3)
            .attr('fill', d => d.value === 0 ? 'white' : COLORS.CASOS_ACTUALES)
            .attr('stroke', d => d.value === 0 ? COLORS.CASOS_ACTUALES : 'white')
            .attr('stroke-width', d => d.value === 0 ? 2 : 1);
    }

    function drawIncidence(svg, rows, xScale, x, y, isAnnual, height) {
        const color = isAnnual ? COLORS.BARRAS_TENDENCIA : COLORS.BARRAS_INCIDENCIA;
        const observations = rows.filter(d => Number.isFinite(d.value));
        svg.selectAll('.channel-bar').data(observations.filter(d => d.value > 0)).join('rect')
            .attr('class', 'channel-bar').attr('x', d => xScale(d.period)).attr('width', xScale.bandwidth())
            .attr('y', d => y(d.value)).attr('height', d => height - y(d.value)).attr('fill', color)
            .attr('stroke', '#2C3E50').attr('stroke-width', 0.5);
        svg.selectAll('.channel-zero').data(observations.filter(d => d.value === 0)).join('circle')
            .attr('class', 'channel-zero').attr('cx', x).attr('cy', height).attr('r', 3)
            .attr('fill', 'white').attr('stroke', color).attr('stroke-width', 2);
        const crossSize = Math.min(3, xScale.step() / 3);
        svg.selectAll('.channel-missing').data(rows.filter(d => !Number.isFinite(d.value))).join('path')
            .attr('class', 'channel-missing')
            .attr('transform', d => `translate(${x(d)},${height - crossSize})`)
            .attr('d', `M${-crossSize},${-crossSize}L${crossSize},${crossSize}M${-crossSize},${crossSize}L${crossSize},${-crossSize}`)
            .attr('stroke', '#2C3E50').attr('stroke-width', 1.2).attr('fill', 'none');
        if (xScale.step() >= 26) {
            svg.selectAll('.channel-value').data(observations.filter(d => d.value > 0)).join('text')
                .attr('class', 'channel-value').attr('x', x).attr('y', d => y(d.value) - 5)
                .attr('text-anchor', 'middle').attr('fill', '#34495E').text(d => d.value);
        }
        drawLine(svg, rows, x, y, 'average', COLORS.LINEA_TENDENCIA, 2, '6 4');
    }

    function drawLine(svg, rows, x, y, key, color, strokeWidth, dash = null) {
        const line = d3.line().x(x).y(d => y(d[key])).defined(d => Number.isFinite(d[key]));
        svg.append('path').datum(rows).attr('fill', 'none').attr('stroke', color)
            .attr('stroke-width', strokeWidth).attr('stroke-dasharray', dash).attr('d', line);
    }

    function legendEntries(isChannel, isAnnual) {
        const entries = isChannel
            ? [...Object.values(ZONAS).map(zone => ({ text: `Zona de ${zone.label.toLowerCase()}`, color: zone.color })),
                { text: 'Casos observados', color: COLORS.CASOS_ACTUALES, line: true },
                { text: 'Mediana histórica', color: COLORS.MEDIANA_HISTORICA, line: true, dash: '4 4' }]
            : [{ text: 'Casos observados', color: isAnnual ? COLORS.BARRAS_TENDENCIA : COLORS.BARRAS_INCIDENCIA },
                { text: 'Media móvil de 4 periodos', color: COLORS.LINEA_TENDENCIA, line: true, dash: '6 4' }];
        entries.push({ text: '0 casos', kind: 'zero', color: isAnnual ? COLORS.BARRAS_TENDENCIA : COLORS.CASOS_ACTUALES },
            { text: isChannel ? 'Hueco · Sin información' : 'Sin información', kind: isChannel ? 'gap' : 'cross' });
        return entries;
    }

    function drawSwatch(svg, entry) {
        if (entry.kind === 'zero') {
            svg.append('circle').attr('cx', 8).attr('cy', 7.5).attr('r', 4)
                .attr('fill', 'white').attr('stroke', entry.color).attr('stroke-width', 2);
        } else if (entry.kind === 'gap' || entry.kind === 'cross') {
            svg.append('path').attr('d', entry.kind === 'gap' ? 'M0,7.5H5M11,7.5H16' : 'M4,3.5L12,11.5M4,11.5L12,3.5')
                .attr('stroke', '#2C3E50').attr('stroke-width', 2);
        } else if (entry.line) {
            svg.append('path').attr('d', 'M0,7.5H16').attr('stroke-width', 3)
                .attr('stroke', entry.color).attr('stroke-dasharray', entry.dash ?? null);
        } else {
            svg.append('rect').attr('width', 16).attr('height', 15).attr('fill', entry.color);
        }
    }

    function renderLegend(entries) {
        const items = legend.html('').selectAll('li').data(entries).join('li');
        items.append('svg').attr('width', 16).attr('height', 15).attr('aria-hidden', 'true')
            .each(function (entry) { drawSwatch(d3.select(this), entry); });
        items.append('span').text(d => d.text);
    }

    const formatValue = (value, digits = 0) => Number.isFinite(value) ? value.toFixed(digits) : 'Sin información';

    function renderDataTable(rows, periodName, isChannel) {
        dataSnapshot = {
            title: chartTitleElement.textContent + ' · ' + chartType.selectedOptions[0].textContent,
            columns: [periodName, 'Casos', ...(isChannel ? ['Q1', 'Mediana', 'Q3', 'Zona'] : ['Media móvil'])],
            rows: rows.map(d => [d.label, redondearDato(d.value), ...(isChannel
                ? [redondearDato(d.q1, 1), redondearDato(d.median, 1), redondearDato(d.q3, 1),
                    ZONAS[zonaActual(d.value, d.q1, d.median, d.q3)]?.label ?? null]
                : [redondearDato(d.average, 1)])])
        };
        vistaDatos.actualizar();
    }

    function addChartTooltip(svg, rows, x, y, periodName, isChannel, year, width, height) {
        const focus = svg.append('circle').attr('class', 'channel-focus').attr('r', 5).attr('fill', 'white')
            .attr('stroke', COLORS.CASOS_ACTUALES).attr('stroke-width', 2).attr('display', 'none');
        const nearest = d3.bisector(x).center;
        svg.append('rect').attr('class', 'channel-hit-area').attr('width', width).attr('height', height)
            .attr('fill', 'transparent')
            .on('pointerleave', () => {
                focus.attr('display', 'none');
                tooltipElement.attr('hidden', '');
            })
            .on('pointermove click', function (event) {
                const row = rows[nearest(rows, d3.pointer(event, this)[0])];
                if (!row) return;
                focus.attr('cx', x(row)).attr('cy', y(row.value ?? 0))
                    .attr('display', Number.isFinite(row.value) ? null : 'none');
                tooltipElement.html('').attr('hidden', null);
                tooltipElement.append('strong').text(`${periodName} ${row.label}${periodName !== 'Año' ? ' · ' + year : ''}`);
                tooltipElement.append('div').text(`Casos · ${formatValue(row.value)}`);
                if (isChannel) {
                    tooltipElement.append('div').text(`Q1 ${formatValue(row.q1, 1)} · Mediana ${formatValue(row.median, 1)} · Q3 ${formatValue(row.q3, 1)}`);
                    const zone = ZONAS[zonaActual(row.value, row.q1, row.median, row.q3)];
                    if (zone) tooltipElement.append('div').text(`Zona de ${zone.label.toLowerCase()}`);
                } else {
                    tooltipElement.append('div').text(`Media móvil · ${formatValue(row.average, 1)}`);
                }
                posicionarTooltip(tooltipElement.node(), event);
            });
    }

    async function descargarGrafica16x9() {
        const model = plotSnapshot;
        if (!model) return;
        const width = 1280;
        const height = 720;
        const svg = d3.create('svg').attr('width', width).attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);
        svg.append('style').text(`
            text { font-family: Arial, sans-serif; fill: #2C3E50; stroke: white; stroke-width: 2px; paint-order: stroke fill; stroke-linejoin: round; }
            .eje-label { font-size: 14px; font-weight: 700; }
            .tick text, .channel-value { font-size: 12px; }
            .tick line, .domain { stroke: #2C3E50; }
        `);
        svg.append('text').attr('x', 54).attr('y', 47).attr('font-weight', 700)
            .attr('font-size', Math.min(32, Math.max(21, Math.floor(1950 / model.title.length)))).text(model.title);
        model.stats.forEach(([label, value, color], i) => {
            const x = 54 + i * 301;
            svg.append('text').attr('x', x).attr('y', 84).attr('font-size', 16).text(label);
            if (color) svg.append('rect').attr('x', x).attr('y', 97).attr('width', 19).attr('height', 19)
                .attr('fill', color).attr('stroke', '#2C3E50');
            svg.append('text').attr('x', x + (color ? 27 : 0)).attr('y', 115).attr('font-size', 25)
                .attr('font-weight', 700).text(value);
        });
        model.entries.forEach((entry, i) => {
            const x = 54 + (i % 4) * 301;
            const y = 145 + Math.floor(i / 4) * 27;
            const mark = svg.append('g').attr('transform', `translate(${x},${y - 13})`);
            mark.append('rect').attr('width', 16).attr('height', 15).attr('fill', 'white').attr('stroke', '#2C3E50');
            drawSwatch(mark, entry);
            svg.append('text').attr('x', x + 24).attr('y', y).attr('font-size', 16).text(entry.text);
        });
        renderPlot(svg.append('g').attr('transform', 'translate(2,190)'), model, 1248, 516, false);
        const source = new XMLSerializer().serializeToString(svg.node());
        const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
        exportStatus.textContent = 'Preparando gráfica…';
        try {
            const image = new Image();
            image.src = url;
            await image.decode();
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(image, 0, 0);
            const png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!png) throw Error('No se pudo convertir la gráfica a PNG');
            descargarArchivo(png, model.title + '.png');
            exportStatus.textContent = 'PNG preparado.';
        } catch {
            exportStatus.textContent = 'No se pudo preparar el PNG.';
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    init();
});