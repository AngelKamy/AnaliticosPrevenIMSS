/**
 * @file canales_endemicos.js
 * @description Lógica final y robusta para la visualización de canales endémicos, incidencias y tendencias.
 * @version 8.0 (Estable y Depurada)
 * @requires d3.v7.min.js
 * @requires JSONende.js
 */

import { JSONende, mapeosSemanasPorAno } from './JSONende.js';

document.addEventListener('DOMContentLoaded', function () {
    // --- ELEMENTOS DEL DOM ---
    const diseaseTabsContainer = document.getElementById('diseaseTabs');
    const yearTabsContainer = document.getElementById('yearTabsEndemicos');
    const chartTypeSelectorVertical = document.getElementById('chartTypeSelectorVertical');
    const chartDescriptionArea = document.getElementById('chartDescriptionArea');
    const yearTabsNav = document.getElementById('yearTabsNav');
    const chartTitleElement = document.getElementById('chartTitleEndemicos');
    const chartSubtitleElement = document.getElementById('chartSubtitleEndemicos');
    const chartContainer = d3.select("#graficoCanalesEndemicos");
    const tooltipElement = d3.select("#tooltipCanales");

    // --- ESTADO Y CONFIGURACIÓN ---
    let selectedDiseaseKey = null;
    let selectedYearForChannel = null;
    let selectedChartType = 'canalSemanal';
    const monthAbbreviations = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    // --- PALETA DE COLORES (Según tu última especificación) ---
    const COLORS = {
        ZONA_EPIDEMIA: "#E53935",
        ZONA_ALERTA: "#FDD835",
        ZONA_EXITO: "#43A047",
        MEDIANA_HISTORICA: "#9EADC8",
        CASOS_ACTUALES: "#1E88E5",
        BARRAS_INCIDENCIA: "#1E88E5",
        BARRAS_TENDENCIA: "#64B5F6",
        LINEA_TENDENCIA: "#E53935"
    };
    
    const margin = { top: 40, right: 30, bottom: 70, left: 60 };
    let svgWidth, svgHeight, width, height;

    const chartDescriptions = {
        canalSemanal: "Muestra el comportamiento de los casos semanales del año seleccionado en comparación con el canal endémico histórico (Q1, Mediana, Q3) construido con los 7 años previos.",
        canalMensual: "Similar al canal semanal, pero con datos agregados y calculados mensualmente. Permite observar tendencias a mediano plazo.",
        incidenciaSemanal: "Presenta el número de casos reportados cada semana para el año seleccionado. Incluye una línea de tendencia de media móvil de 4 períodos.",
        incidenciaMensual: "Muestra el total de casos reportados cada mes para el año seleccionado. Incluye una línea de tendencia de media móvil de 4 períodos.",
        tendenciaAnual: "Gráfico de barras que compara el total de casos anuales para la enfermedad seleccionada. Incluye una línea de tendencia de media móvil de 4 períodos."
    };

    /**
     * Orquestador principal de la página.
     */
    function init() {
        if (!setChartDimensions()) return;
        populateDiseaseTabs();
        chartTypeSelectorVertical.querySelectorAll('ul li').forEach(item => {
            item.addEventListener('click', function() {
                chartTypeSelectorVertical.querySelector('.active')?.classList.remove('active');
                this.classList.add('active');
                selectedChartType = this.dataset.charttype;
                updateChartDescription();
                yearTabsNav.style.display = selectedChartType === 'tendenciaAnual' ? 'none' : 'flex';
                populateYearTabs();
            });
        });
        window.addEventListener('resize', () => { if (setChartDimensions()) drawChart(); });
        updateChartDescription();
    }

    /**
     * Calcula y establece las dimensiones del SVG.
     * @returns {boolean}
     */
    function setChartDimensions() {
        const containerNode = chartContainer.node();
        if (!containerNode) return false;
        svgWidth = containerNode.getBoundingClientRect().width;
        svgHeight = 450;
        width = svgWidth - margin.left - margin.right;
        height = svgHeight - margin.top - margin.bottom;
        return width > 100 && height > 100;
    }

    /**
     * Actualiza la descripción del gráfico.
     */
    function updateChartDescription() {
        chartDescriptionArea.textContent = chartDescriptions[selectedChartType] || "Seleccione un tipo de gráfica.";
    }

    /**
     * Crea las pestañas de enfermedades.
     */
    function populateDiseaseTabs() {
        const diseaseKeys = Object.keys(JSONende);
        if (diseaseKeys.length === 0) return;
        selectedDiseaseKey = diseaseKeys[0];

        diseaseTabsContainer.innerHTML = '';
        diseaseKeys.forEach(key => {
            const li = document.createElement('li');
            li.textContent = JSONende[key].nombreDisplay || key;
            li.dataset.disease = key;
            if (key === selectedDiseaseKey) li.classList.add('active');
            li.addEventListener('click', function() {
                diseaseTabsContainer.querySelector('.active')?.classList.remove('active');
                this.classList.add('active');
                selectedDiseaseKey = this.dataset.disease;
                populateYearTabs();
            });
            diseaseTabsContainer.appendChild(li);
        });
        populateYearTabs();
    }

    /**
     * Crea las pestañas de años, filtrando según corresponda.
     */
    function populateYearTabs() {
        yearTabsContainer.innerHTML = '';
        if (!selectedDiseaseKey || !JSONende[selectedDiseaseKey]?.datosSemanales) {
            chartContainer.html('<p class="no-data-message">Datos no disponibles.</p>');
            return;
        }

        const allYearsWithData = Object.keys(JSONende[selectedDiseaseKey].datosSemanales).map(y => parseInt(y));
        let yearsToDisplay = [...allYearsWithData].sort((a, b) => b - a);

        if (selectedChartType === 'canalSemanal' || selectedChartType === 'canalMensual') {
            yearsToDisplay = allYearsWithData.filter(year => {
                for (let i = 1; i <= 7; i++) {
                    if (!JSONende[selectedDiseaseKey].datosSemanales[(year - i).toString()]) return false;
                }
                return true;
            }).sort((a, b) => b - a);
        }

        if (yearsToDisplay.length === 0) {
            const msg = `No hay años con suficientes datos históricos (7 años previos) para generar canales para ${JSONende[selectedDiseaseKey].nombreDisplay}.`;
            chartContainer.html(`<p class="no-data-message">${msg}</p>`);
            selectedYearForChannel = null;
            return;
        }

        if (!selectedYearForChannel || !yearsToDisplay.includes(parseInt(selectedYearForChannel))) {
            selectedYearForChannel = yearsToDisplay[0].toString();
        }

        yearTabsContainer.innerHTML = '';
        yearsToDisplay.forEach(year => {
            const li = document.createElement('li');
            li.textContent = year;
            li.dataset.year = year.toString();
            if (year.toString() === selectedYearForChannel) li.classList.add('active');
            li.addEventListener('click', function() {
                yearTabsContainer.querySelector('.active')?.classList.remove('active');
                this.classList.add('active');
                selectedYearForChannel = this.dataset.year;
                drawChart();
            });
            yearTabsContainer.appendChild(li);
        });
        drawChart();
    }
    
    /**
     * Prepara el paquete de datos para la función de dibujo.
     * @returns {object|null}
     */
    function processDataForChart() {
        if (!selectedDiseaseKey || !JSONende[selectedDiseaseKey]?.datosSemanales) return null;
        if (selectedChartType !== 'tendenciaAnual' && !selectedYearForChannel) return null;

        const disease = JSONende[selectedDiseaseKey];
        const allWeeklyData = disease.datosSemanales;
        const currentYear = parseInt(selectedYearForChannel);
        let dataPackage = { diseaseName: disease.nombreDisplay, year: selectedYearForChannel, type: selectedChartType, current: [] };

        const isMonthly = selectedChartType.includes('Mensual');
        const isChannel = selectedChartType.includes('canal');

        if (selectedChartType !== 'tendenciaAnual') {
            const currentDataRaw = allWeeklyData[selectedYearForChannel] || [];
            if (isChannel) {
                const historicalYears = Array.from({ length: 7 }, (_, i) => (currentYear - (i + 1)).toString());
                let historicalPeriodData = historicalYears.map(year => {
                    const weeklyData = allWeeklyData[year];
                    return weeklyData ? (isMonthly ? aggregateWeeklyToMonthly(weeklyData, year) : weeklyData) : null;
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
                    dataPackage.q1.push(d3.quantile(periodValues, 0.25) || 0);
                    dataPackage.median.push(d3.quantile(periodValues, 0.5) || 0);
                    dataPackage.q3.push(d3.quantile(periodValues, 0.75) || 0);
                }
            } else {
                dataPackage.current = isMonthly ? aggregateWeeklyToMonthly(currentDataRaw, selectedYearForChannel) : currentDataRaw;
                dataPackage.numPeriods = dataPackage.current.length;
            }
        } else {
            dataPackage.annualTotals = Object.keys(allWeeklyData).map(year => ({
                year: parseInt(year),
                total: allWeeklyData[year].reduce((sum, val) => sum + (val || 0), 0)
            })).sort((a, b) => a.year - b.year);
        }
        return dataPackage;
    }
    
    /**
     * Orquestador principal que llama a la función de dibujo correcta.
     */
    function drawChart() {
        chartContainer.html('');
        if (!setChartDimensions()) return;
        const chartData = processDataForChart();

        if (!chartData || (chartData.type !== 'tendenciaAnual' && (!chartData.current || chartData.current.length === 0)) || (chartData.type === 'tendenciaAnual' && (!chartData.annualTotals || chartData.annualTotals.length === 0))) {
            chartContainer.html('<p class="no-data-message">No hay datos disponibles para la selección actual.</p>');
            return;
        }

        chartTitleElement.textContent = `${chartData.diseaseName} (${chartData.year || 'Tendencia'})`;
        chartSubtitleElement.textContent = chartDescriptions[selectedChartType];

        switch (selectedChartType) {
            case 'canalSemanal': drawCanalEndemicoBase(chartData, true); break;
            case 'canalMensual': drawCanalEndemicoBase(chartData, false); break;
            case 'incidenciaSemanal': drawIncidencia(chartData, true); break;
            case 'incidenciaMensual': drawIncidencia(chartData, false); break;
            case 'tendenciaAnual': drawTendenciaAnual(chartData); break;
        }
    }

    // --- FUNCIONES AUXILIARES Y DE DIBUJO ---

    function aggregateWeeklyToMonthly(weeklyData, year) {
        const weekToMonthMap = mapeosSemanasPorAno[year];
        if (!weekToMonthMap || !weeklyData) return null;
        const monthlyCases = Array(12).fill(0);
        weeklyData.forEach((cases, index) => {
            if (cases !== null && !isNaN(cases)) {
                const month = weekToMonthMap[index + 1];
                if (month) monthlyCases[month - 1] += cases;
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

    /**
     * Dibuja el gráfico de canal endémico con etiquetado de picos/valles.
     * @param {object} chartData
     * @param {boolean} isWeekly
     */
    function drawCanalEndemicoBase(chartData, isWeekly) {
        const svg = chartContainer.append("svg").attr("width", svgWidth).attr("height", svgHeight).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        const maxCases = Math.max(d3.max(chartData.q3) || 0, d3.max(chartData.current) || 0, 10);
        const xScale = d3.scaleLinear().domain([1, chartData.numPeriods]).range([0, width]);
        const yScale = d3.scaleLinear().domain([0, maxCases * 1.1 || 10]).range([height, 0]).nice();
        const periodLabel = isWeekly ? 'Semana' : 'Mes';
        
        let xAxis;
        if (isWeekly) {
            xAxis = d3.axisBottom(xScale).ticks(width / 50).tickFormat(d3.format("d"));
        } else {
            xAxis = d3.axisBottom(xScale).ticks(12).tickFormat(d => monthAbbreviations[d - 1]);
        }
        svg.append("g").attr("transform", `translate(0,${height})`).call(xAxis);
        svg.append("g").call(d3.axisLeft(yScale));
        
        const areaGenerator = (y0Field, y1Field) => d3.area().x((d, i) => xScale(i + 1)).y0(d => yScale(d[y0Field])).y1(d => yScale(d[y1Field])).defined(d => d[y0Field] != null && d[y1Field] != null);
        const dataForAreas = d3.range(chartData.numPeriods).map(i => ({ q1: chartData.q1[i], q3: chartData.q3[i], max: maxCases * 1.1, min: 0 }));

        svg.append("path").datum(dataForAreas).attr("fill", COLORS.ZONA_EXITO).attr("d", areaGenerator('min', 'q1'));
        svg.append("path").datum(dataForAreas).attr("fill", COLORS.ZONA_ALERTA).attr("d", areaGenerator('q1', 'q3'));
        svg.append("path").datum(dataForAreas).attr("fill", COLORS.ZONA_EPIDEMIA).attr("d", areaGenerator('q3', 'max'));

        const lineGenerator = d3.line().x((d, i) => xScale(i + 1)).y(d => yScale(d)).defined(d => d != null);
        svg.append("path").datum(chartData.median).attr("fill", "none").attr("stroke", COLORS.MEDIANA_HISTORICA).attr("stroke-width", 2).attr("stroke-dasharray", "4 4").attr("d", lineGenerator);
        svg.append("path").datum(chartData.current).attr("fill", "none").attr("stroke", COLORS.CASOS_ACTUALES).attr("stroke-width", 3).attr("d", lineGenerator);

        svg.selectAll(".current-case-point").data(chartData.current).enter().filter(d => d != null)
            .append("circle").attr("class", "current-case-point").attr("cx", (d, i) => xScale(i + 1)).attr("cy", d => yScale(d))
            .attr("r", 3.5).attr("fill", COLORS.CASOS_ACTUALES).attr("stroke", "white").attr("stroke-width", 1);
        
        const pointsToLabel = [];
        const lastValidIndex = chartData.current.findLastIndex(v => v !== null);
        chartData.current.forEach((d, i) => {
            if (d === null) return;
            const prev = chartData.current[i - 1];
            const next = chartData.current[i + 1];
            const isPeak = (prev === null || d > prev) && (next === null || d > next);
            const isValley = (d !== 0) && (prev === null || d < prev) && (next === null || d < next);
            if (i === 0 || i === lastValidIndex || isPeak || isValley) {
                pointsToLabel.push({ value: d, index: i });
            }
        });

        svg.selectAll(".current-case-label").data(pointsToLabel).enter()
            .append("text")
            .attr("class", "current-case-label")
            .attr("x", d => xScale(d.index + 1))
            .attr("y", d => yScale(d.value) < 20 ? yScale(d.value) + 16 : yScale(d.value) - 8)
            .attr("text-anchor", "middle").style("font-size", "9px").style("font-weight", "600").style("fill", "#34495e")
            .text(d => d.value.toFixed(0));

        const focus = svg.append("g").style("display", "none");
        focus.append("circle").attr("r", 5).attr("fill", COLORS.CASOS_ACTUALES).attr("stroke", "white");
        svg.append("rect").attr("width", width).attr("height", height).style("fill", "none").style("pointer-events", "all")
            .on("mouseover", () => { focus.style("display", null); tooltipElement.style("opacity", 0.95); })
            .on("mouseout", () => { focus.style("display", "none"); tooltipElement.style("opacity", 0); })
            .on("mousemove", function(event) {
                const x0 = xScale.invert(d3.pointer(event, this)[0]);
                const i = Math.round(x0) - 1;
                if (i < 0 || i >= chartData.numPeriods || chartData.current[i] == null) {
                    focus.style("display", "none"); tooltipElement.style("opacity", 0); return;
                }
                focus.style("display", null);
                const val = chartData.current[i];
                const displayPeriod = isWeekly ? i + 1 : monthAbbreviations[i];
                focus.attr("transform", `translate(${xScale(i + 1)},${yScale(val)})`);
                tooltipElement.html(`<strong>${periodLabel} ${displayPeriod} (${chartData.year})</strong><br/>Casos: ${val.toFixed(0)}<br/><span style="color:${COLORS.ZONA_EXITO};">Q1: ${chartData.q1[i]?.toFixed(1)||"N/A"}</span><br/><span style="color:${COLORS.MEDIANA_HISTORICA};">Med: ${chartData.median[i]?.toFixed(1)||"N/A"}</span><br/><span style="color:${COLORS.ZONA_EPIDEMIA};">Q3: ${chartData.q3[i]?.toFixed(1)||"N/A"}</span>`);
                tooltipElement.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
            });
    }

    /**
     * Dibuja gráficos de incidencia como barras.
     * @param {object} chartData
     * @param {boolean} isWeekly
     */
    function drawIncidencia(chartData, isWeekly) {
        const svg = chartContainer.append("svg").attr("width", svgWidth).attr("height", svgHeight).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        const maxCases = d3.max(chartData.current) || 10;
        const xDomain = d3.range(1, (chartData.numPeriods || 0) + 1);
        const xScale = d3.scaleBand().domain(xDomain).range([0, width]).padding(0.2);
        const yScale = d3.scaleLinear().domain([0, maxCases * 1.1]).range([height, 0]).nice();
        
        let xAxis;
        if (isWeekly) {
            xAxis = d3.axisBottom(xScale).tickValues(xScale.domain().filter(d => d % 4 === 1 || d === 1));
        } else {
            xAxis = d3.axisBottom(xScale).tickFormat(d => monthAbbreviations[d - 1]);
        }
        svg.append("g").attr("transform", `translate(0,${height})`).call(xAxis);
        svg.append("g").call(d3.axisLeft(yScale));
        
        const barData = chartData.current.map((val, idx) => ({ period: idx + 1, value: val || 0 }));
        svg.selectAll(".bar").data(barData).enter().append("rect")
            .attr("class", "bar").attr("x", d => xScale(d.period)).attr("y", d => yScale(d.value))
            .attr("width", xScale.bandwidth()).attr("height", d => height - yScale(d.value)).attr("fill", COLORS.BARRAS_INCIDENCIA);
        
        svg.selectAll(".bar-label").data(barData).enter()
            .filter(d => d.value > 0 && height - yScale(d.value) > 10)
            .append("text").attr("class", "bar-label").attr("x", d => xScale(d.period) + xScale.bandwidth() / 2)
            .attr("y", d => yScale(d.value) < 15 ? yScale(d.value) + 14 : yScale(d.value) - 5)
            .attr("text-anchor", "middle").style("font-size", "9px")
            .style("fill", d => yScale(d.value) < 15 ? "white" : "#34495e").text(d => d.value);
            
        const movingAverageData = calculateMovingAverage(chartData.current, 4);
        if(movingAverageData.length > 0) {
            const trendLine = d3.line()
                .x((d, i) => xScale(i + 1) + xScale.bandwidth() / 2)
                .y(d => yScale(d))
                .defined(d => d !== null);
            
            svg.append("path").datum(movingAverageData).attr("fill", "none")
               .attr("stroke", COLORS.LINEA_TENDENCIA).attr("stroke-width", 2).attr("stroke-dasharray", "6, 4").attr("d", trendLine);
        }
    }

    /**
     * Dibuja el gráfico de tendencia anual como barras.
     * @param {object} chartData
     */
    function drawTendenciaAnual(chartData) {
        const svg = chartContainer.append("svg").attr("width", svgWidth).attr("height", svgHeight).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        const maxTotal = d3.max(chartData.annualTotals, d => d.total) || 10;
        const xScale = d3.scaleBand().domain(chartData.annualTotals.map(d => d.year)).range([0, width]).padding(0.3);
        const yScale = d3.scaleLinear().domain([0, maxTotal * 1.1]).range([height, 0]).nice();
        
        svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale));
        svg.append("g").call(d3.axisLeft(yScale));
        
        svg.selectAll(".bar-anual").data(chartData.annualTotals)
            .enter().append("rect").attr("class", "bar-anual").attr("x", d => xScale(d.year))
            .attr("y", d => yScale(d.total)).attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(d.total)).attr("fill", COLORS.BARRAS_TENDENCIA);

        svg.selectAll(".bar-anual-label").data(chartData.annualTotals).enter().filter(d => d.total > 0)
            .append("text").attr("class", "bar-anual-label").attr("x", d => xScale(d.year) + xScale.bandwidth() / 2)
            .attr("y", d => yScale(d.total) < 20 ? yScale(d.total) + 15 : yScale(d.total) - 5)
            .attr("text-anchor", "middle").style("font-size", "10px")
            .style("fill", d => yScale(d.total) < 20 ? "white" : "#34495e").text(d => d.total);
            
        const annualTotals = chartData.annualTotals.map(d => d.total);
        const movingAverageData = calculateMovingAverage(annualTotals, 4);
        if(movingAverageData.length > 0) {
            const trendLine = d3.line()
                .x((d, i) => xScale(chartData.annualTotals[i].year) + xScale.bandwidth() / 2)
                .y(d => yScale(d))
                .defined(d => d !== null);

            svg.append("path").datum(movingAverageData).attr("fill", "none")
               .attr("stroke", COLORS.LINEA_TENDENCIA).attr("stroke-width", 2).attr("stroke-dasharray", "6, 4").attr("d", trendLine);
        }
    }

    // --- INICIAR LA APLICACIÓN ---
    init();
});