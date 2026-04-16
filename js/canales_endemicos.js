/**
 * @file canales_endemicos.js
 * @description Lógica para visualización de canales endémicos usando D3.js con Ejes Etiquetados, Descarga 16:9 inferior derecha y animaciones.
 */

import { JSONende, mapeosSemanasPorAno } from './JSONende.js';

document.addEventListener('DOMContentLoaded', function () {
    // --- ELEMENTOS DEL DOM ---
    const diseaseTabsContainer = document.getElementById('diseaseTabs');
    const unitTabsContainer = document.getElementById('unitTabsCanales'); 
    const yearTabsContainer = document.getElementById('yearTabsEndemicos');
    const chartTypeSelectorVertical = document.getElementById('chartTypeSelectorVertical');
    const chartDescriptionArea = document.getElementById('chartDescriptionArea');
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
        exito:    { label: 'Éxito',      css: 'color:#43A047' },
        alerta:   { label: 'Seguridad',  css: 'color:#FDD835' },
        alarma:   { label: 'Alarma',     css: 'color:#f39c12' },
        epidemia: { label: 'Epidemia',   css: 'color:#E53935' },
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

    function init() {
        if (!setChartDimensions()) return;
        populateDiseaseTabs();
        chartTypeSelectorVertical.querySelectorAll('ul li').forEach(item => {
            item.addEventListener('click', function () {
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

    function setChartDimensions() {
        const containerNode = chartContainer.node();
        if (!containerNode) return false;
        svgWidth = containerNode.getBoundingClientRect().width;
        svgHeight = 450;
        width = svgWidth - margin.left - margin.right;
        height = svgHeight - margin.top - margin.bottom;
        return width > 100 && height > 100;
    }

    function updateChartDescription() {
        chartDescriptionArea.textContent = chartDescriptions[selectedChartType] || "Seleccione un tipo de gráfica.";
    }

    // --- LÓGICA DE TABS ---
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
            li.addEventListener('click', function () {
                diseaseTabsContainer.querySelector('.active')?.classList.remove('active');
                this.classList.add('active');
                selectedDiseaseKey = this.dataset.disease;
                populateUnitTabs();
            });
            diseaseTabsContainer.appendChild(li);
        });
        populateUnitTabs(); 
    }
    
    function populateUnitTabs() {
        unitTabsContainer.innerHTML = '';
        if (!selectedDiseaseKey || !JSONende[selectedDiseaseKey]?.unidades) {
            chartContainer.html('<p class="no-data-message">No hay unidades para esta enfermedad.</p>');
            limpiarStats();
            return;
        }

        const unitKeys = Object.keys(JSONende[selectedDiseaseKey].unidades).sort((a,b) => {
            if (a === 'Delegacional') return -1;
            if (b === 'Delegacional') return 1;
            return a.localeCompare(b);
        });
        
        if (unitKeys.length === 0) {
             chartContainer.html('<p class="no-data-message">No hay datos de unidades para esta enfermedad.</p>');
             limpiarStats();
             return;
        }

        if (!selectedUnitKey || !unitKeys.includes(selectedUnitKey)) {
            selectedUnitKey = unitKeys[0];
        }

        unitKeys.forEach(key => {
            const li = document.createElement('li');
            li.textContent = key;
            li.dataset.unit = key;
            if (key === selectedUnitKey) li.classList.add('active');
            li.addEventListener('click', function() {
                unitTabsContainer.querySelector('.active')?.classList.remove('active');
                this.classList.add('active');
                selectedUnitKey = this.dataset.unit;
                populateYearTabs();
            });
            unitTabsContainer.appendChild(li);
        });
        populateYearTabs();
    }

    function populateYearTabs() {
        yearTabsContainer.innerHTML = '';
        if (!selectedDiseaseKey || !selectedUnitKey || !JSONende[selectedDiseaseKey]?.unidades?.[selectedUnitKey]?.datosSemanales) {
            chartContainer.html('<p class="no-data-message">Datos no disponibles para la unidad seleccionada.</p>');
            limpiarStats();
            return;
        }

        const allYearsWithData = Object.keys(JSONende[selectedDiseaseKey].unidades[selectedUnitKey].datosSemanales).map(y => parseInt(y));
        let yearsToDisplay = [...allYearsWithData].sort((a, b) => b - a);

        if (selectedChartType === 'canalSemanal' || selectedChartType === 'canalMensual') {
            yearsToDisplay = allYearsWithData.filter(year => {
                for (let i = 1; i <= 7; i++) {
                    if (!JSONende[selectedDiseaseKey].unidades[selectedUnitKey].datosSemanales[(year - i).toString()]) return false;
                }
                return true;
            }).sort((a, b) => b - a);
        }

        if (yearsToDisplay.length === 0) {
            const msg = `No hay años con suficientes datos históricos (7 años previos) para generar canales en ${selectedUnitKey}.`;
            chartContainer.html(`<p class="no-data-message">${msg}</p>`);
            limpiarStats();
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
            li.addEventListener('click', function () {
                yearTabsContainer.querySelector('.active')?.classList.remove('active');
                this.classList.add('active');
                selectedYearForChannel = this.dataset.year;
                drawChart();
            });
            yearTabsContainer.appendChild(li);
        });
        drawChart();
    }
    
    // --- FUNCIONES DE STATS CARDS ---
    function zonaActual(val, q1, median, q3) {
        if (val === null || val === undefined) return null;
        if (val <= q1)     return 'exito';
        if (val <= median) return 'alerta';
        if (val <= q3)     return 'alarma';
        return 'epidemia';
    }

    function renderStats(current, q1arr, medianarr, q3arr, type) {
        if (!statsContainer) return;

        if (type !== 'canalSemanal' && type !== 'canalMensual') {
            limpiarStats();
            return;
        }

        const valid = current.filter(v => v !== null);
        const total = valid.reduce((s, v) => s + v, 0);
        const semActual = valid.length;
        const ultimoVal = valid.at(-1) ?? 0;
        
        const zona = zonaActual(ultimoVal, q1arr[semActual - 1], medianarr[semActual - 1], q3arr[semActual - 1]);
        const zonaInfo = ZONAS[zona] || { label: '—', css: '' };
        
        const etiquetaPeriodo = type === 'canalMensual' ? 'Mes actual' : 'Semana actual';
        const etiquetaCasos = type === 'canalMensual' ? 'Casos último mes' : 'Casos última semana';

        statsContainer.innerHTML = `
            <div class="stat-canal">
                <div class="stat-canal-label">Total de casos</div>
                <div class="stat-canal-value">${total}</div>
            </div>
            <div class="stat-canal">
                <div class="stat-canal-label">${etiquetaPeriodo}</div>
                <div class="stat-canal-value">${semActual}</div>
            </div>
            <div class="stat-canal">
                <div class="stat-canal-label">${etiquetaCasos}</div>
                <div class="stat-canal-value" style="${zonaInfo.css}">${ultimoVal}</div>
            </div>
            <div class="stat-canal">
                <div class="stat-canal-label">Nivel de Riesgo</div>
                <div class="stat-canal-value" style="${zonaInfo.css}">${zonaInfo.label}</div>
            </div>
        `;
    }

    function limpiarStats() {
        if (statsContainer) statsContainer.innerHTML = '';
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
        chartContainer.html('');
        if (!setChartDimensions()) return;
        const chartData = processDataForChart();

        if (!chartData || (chartData.type !== 'tendenciaAnual' && (!chartData.current || chartData.current.length === 0)) || (chartData.type === 'tendenciaAnual' && (!chartData.annualTotals || chartData.annualTotals.length === 0))) {
            chartContainer.html('<p class="no-data-message">No hay datos disponibles para la selección actual.</p>');
            limpiarStats();
            return;
        }
        
        chartTitleElement.textContent = `${chartData.diseaseName} en ${chartData.unitName} (${chartData.year || 'Tendencia'})`;
        chartSubtitleElement.textContent = chartDescriptions[selectedChartType];

        if (selectedChartType === 'canalSemanal' || selectedChartType === 'canalMensual') {
            renderStats(chartData.current, chartData.q1, chartData.median, chartData.q3, selectedChartType);
        } else {
            limpiarStats();
        }

        switch (selectedChartType) {
            case 'canalSemanal': drawCanalEndemicoBase(chartData, true); break;
            case 'canalMensual': drawCanalEndemicoBase(chartData, false); break;
            case 'incidenciaSemanal': drawIncidencia(chartData, true); break;
            case 'incidenciaMensual': drawIncidencia(chartData, false); break;
            case 'tendenciaAnual': drawTendenciaAnual(chartData); break;
        }
    }
    
    // --- DIBUJO CON ANIMACIONES, EJE RESPONSIVO Y ETIQUETAS ---
    function drawCanalEndemicoBase(chartData, isWeekly) {
        if (isWeekly) {
            const displayPeriods = 52;
            chartData.numPeriods = Math.min(chartData.numPeriods, displayPeriods);
            chartData.current = chartData.current.slice(0, displayPeriods);
            chartData.q1 = chartData.q1.slice(0, displayPeriods);
            chartData.median = chartData.median.slice(0, displayPeriods);
            chartData.q3 = chartData.q3.slice(0, displayPeriods);
        }

        const svg = chartContainer.append("svg").attr("width", svgWidth).attr("height", svgHeight).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        const maxCases = Math.max(d3.max(chartData.q3) || 0, d3.max(chartData.current.filter(d => d !== null)) || 0, 10);
        const xScale = d3.scaleLinear().domain([1, chartData.numPeriods]).range([0, width]);
        const yScale = d3.scaleLinear().domain([0, maxCases * 1.1]).range([height, 0]).nice();
        const periodLabel = isWeekly ? 'Semana' : 'Mes';

        let xAxis;
        if (isWeekly) {
            let step = 1;
            if (width < 480) step = 4;
            else if (width < 768) step = 2;

            xAxis = d3.axisBottom(xScale)
                      .tickValues(d3.range(1, chartData.numPeriods + 1, step))
                      .tickFormat(d3.format("d"));
        } else {
            xAxis = d3.axisBottom(xScale)
                      .tickValues(d3.range(1, 13))
                      .tickFormat(d => monthAbbreviations[d - 1]);
        }
        
        const xAxisGroup = svg.append("g")
            .attr("class", "eje-x")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);

        if (isWeekly && width >= 480) {
            xAxisGroup.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-45)");
        }

        svg.append("g").call(d3.axisLeft(yScale));

        // -- ETIQUETAS DE LOS EJES --
        svg.append("text")
            .attr("class", "eje-label")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + 50)
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("fill", "#7a8a9a")
            .text(isWeekly ? "Semana Epidemiológica" : "Meses");

        svg.append("text")
            .attr("class", "eje-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("x", -height / 2)
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("fill", "#7a8a9a")
            .text("Número de Casos");

        const areaGenerator = (y0Field, y1Field) => d3.area()
            .x((d, i) => xScale(i + 1))
            .y0(d => yScale(d[y0Field]))
            .y1(d => yScale(d[y1Field]))
            .defined(d => d[y0Field] != null && d[y1Field] != null);

        const dataForAreas = d3.range(chartData.numPeriods).map(i => ({
            q1: chartData.q1[i],
            median: chartData.median[i],
            q3: chartData.q3[i],
            max: maxCases * 1.1,
            min: 0
        }));

        const drawArea = (field0, field1, color) => {
            svg.append("path")
               .datum(dataForAreas)
               .attr("fill", color)
               .attr("d", areaGenerator(field0, field1))
               .style("opacity", 0)
               .transition()
               .duration(800)
               .ease(d3.easeCubicOut)
               .style("opacity", 1);
        };

        drawArea('min', 'q1', COLORS.ZONA_EXITO);
        drawArea('q1', 'median', COLORS.ZONA_ALERTA);
        drawArea('median', 'q3', COLORS.ZONA_ALARMA);
        drawArea('q3', 'max', COLORS.ZONA_EPIDEMIA);

        const lineGenerator = d3.line()
            .x((d, i) => xScale(i + 1))
            .y(d => yScale(d))
            .defined(d => d != null);

        const animateLine = (data, color, strokeWidth, dash = null) => {
            const path = svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", strokeWidth)
                .attr("d", lineGenerator);
                
            if (dash) path.attr("stroke-dasharray", dash);

            const totalLength = path.node().getTotalLength();
            path.attr("stroke-dasharray", totalLength + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                .duration(1200)
                .ease(d3.easeCubicOut)
                .attr("stroke-dashoffset", 0)
                .on("end", () => {
                    if(dash) path.attr("stroke-dasharray", dash);
                });
        };

        animateLine(chartData.median, COLORS.MEDIANA_HISTORICA, 2, "4 4");
        animateLine(chartData.current, COLORS.CASOS_ACTUALES, 3);

        svg.selectAll(".current-case-point").data(chartData.current).enter().filter(d => d != null)
            .append("circle").attr("class", "current-case-point").attr("cx", (d, i) => xScale(i + 1)).attr("cy", d => yScale(d))
            .attr("r", 3.5).attr("fill", COLORS.CASOS_ACTUALES).attr("stroke", "white").attr("stroke-width", 1)
            .style("opacity", 0)
            .transition()
            .delay((d, i) => i * (1000 / chartData.numPeriods)) 
            .duration(300)
            .style("opacity", 1);
        
        const focus = svg.append("g").style("display", "none");
        focus.append("circle").attr("r", 5).attr("fill", COLORS.CASOS_ACTUALES).attr("stroke", "white");
        svg.append("rect").attr("width", width).attr("height", height).style("fill", "none").style("pointer-events", "all")
            .on("mouseover", () => { focus.style("display", null); tooltipElement.style("opacity", 0.95); })
            .on("mouseout", () => { focus.style("display", "none"); tooltipElement.style("opacity", 0); })
            .on("mousemove", function (event) {
                const x0 = xScale.invert(d3.pointer(event, this)[0]);
                const i = Math.round(x0) - 1;
                if (i < 0 || i >= chartData.numPeriods || chartData.current[i] == null) {
                    focus.style("display", "none"); tooltipElement.style("opacity", 0); return;
                }
                focus.style("display", null);
                const val = chartData.current[i];
                const displayPeriod = isWeekly ? i + 1 : monthAbbreviations[i];
                focus.attr("transform", `translate(${xScale(i + 1)},${yScale(val)})`);
                tooltipElement.html(`<strong>${periodLabel} ${displayPeriod} (${chartData.year})</strong><br/>Casos: <span style="color: #F9E79F; font-weight: bold;">${val.toFixed(0)}</span><br/><span style="color: #FFFFFF;">Q1: ${chartData.q1[i]?.toFixed(1) || "N/A"}</span><br/><span style="color: #FFFFFF;">Med: ${chartData.median[i]?.toFixed(1) || "N/A"}</span><br/><span style="color: #FFFFFF;">Q3: ${chartData.q3[i]?.toFixed(1) || "N/A"}</span>`);
                tooltipElement.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
            });
    }

    function drawIncidencia(chartData, isWeekly) {
        if (isWeekly) {
            const displayPeriods = 52;
            chartData.numPeriods = Math.min(chartData.numPeriods, displayPeriods);
            chartData.current = chartData.current.slice(0, displayPeriods);
        }

        const svg = chartContainer.append("svg").attr("width", svgWidth).attr("height", svgHeight).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        const maxCases = d3.max(chartData.current) || 10;
        const xDomain = d3.range(1, (chartData.numPeriods || 0) + 1);
        const xScale = d3.scaleBand().domain(xDomain).range([0, width]).padding(0.2);
        const yScale = d3.scaleLinear().domain([0, maxCases * 1.1]).range([height, 0]).nice();

        let xAxis;
        if (isWeekly) {
            let step = 1;
            if (width < 480) step = 4;
            else if (width < 768) step = 2;

            let tickVals = xScale.domain();
            if (step > 1) {
                tickVals = tickVals.filter(d => d % step === 1 || d === 1);
            }
            xAxis = d3.axisBottom(xScale).tickValues(tickVals);
        } else {
            xAxis = d3.axisBottom(xScale).tickFormat(d => monthAbbreviations[d - 1]);
        }
        
        const xAxisGroup = svg.append("g")
            .attr("class", "eje-x")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);

        if (isWeekly && width >= 480) {
            xAxisGroup.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-45)");
        }

        svg.append("g").call(d3.axisLeft(yScale));

        // -- ETIQUETAS DE LOS EJES --
        svg.append("text")
            .attr("class", "eje-label")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + 50)
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("fill", "#7a8a9a")
            .text(isWeekly ? "Semana Epidemiológica" : "Meses");

        svg.append("text")
            .attr("class", "eje-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("x", -height / 2)
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("fill", "#7a8a9a")
            .text("Número de Casos");

        const barData = chartData.current.map((val, idx) => ({ period: idx + 1, value: val || 0 }));
        
        svg.selectAll(".bar").data(barData).enter().append("rect")
            .attr("class", "bar").attr("x", d => xScale(d.period)).attr("y", height) 
            .attr("width", xScale.bandwidth()).attr("height", 0) 
            .attr("fill", COLORS.BARRAS_INCIDENCIA)
            .transition()
            .duration(800)
            .ease(d3.easeCubicOut)
            .attr("y", d => yScale(d.value))
            .attr("height", d => height - yScale(d.value));

        svg.selectAll(".bar-label").data(barData).enter()
            .filter(d => d.value > 0 && height - yScale(d.value) > 10)
            .append("text").attr("class", "bar-label").attr("x", d => xScale(d.period) + xScale.bandwidth() / 2)
            .attr("y", height) 
            .attr("text-anchor", "middle").style("font-size", "9px")
            .style("fill", d => yScale(d.value) < 15 ? "white" : "#34495e").text(d => d.value)
            .transition()
            .duration(800)
            .ease(d3.easeCubicOut)
            .attr("y", d => yScale(d.value) < 15 ? yScale(d.value) + 14 : yScale(d.value) - 5);

        const movingAverageData = calculateMovingAverage(chartData.current, 4);
        if (movingAverageData.length > 0) {
            const trendLine = d3.line()
                .x((d, i) => xScale(i + 1) + xScale.bandwidth() / 2)
                .y(d => yScale(d))
                .defined(d => d !== null);
            
            const path = svg.append("path").datum(movingAverageData).attr("fill", "none")
                .attr("stroke", COLORS.LINEA_TENDENCIA).attr("stroke-width", 2).attr("stroke-dasharray", "6, 4").attr("d", trendLine);
            
            const totalLength = path.node().getTotalLength();
            path.attr("stroke-dasharray", totalLength + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                .duration(1200)
                .ease(d3.easeCubicOut)
                .attr("stroke-dashoffset", 0)
                .on("end", () => path.attr("stroke-dasharray", "6, 4"));
        }
    }
    
    function drawTendenciaAnual(chartData) {
        const svg = chartContainer.append("svg").attr("width", svgWidth).attr("height", svgHeight).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        const maxTotal = d3.max(chartData.annualTotals, d => d.total) || 10;
        const xScale = d3.scaleBand().domain(chartData.annualTotals.map(d => d.year)).range([0, width]).padding(0.3);
        const yScale = d3.scaleLinear().domain([0, maxTotal * 1.1]).range([height, 0]).nice();

        const xAxisGroup = svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale));
        
        if (chartData.annualTotals.length > 8) {
            xAxisGroup.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-45)");
        }

        svg.append("g").call(d3.axisLeft(yScale));

        // -- ETIQUETAS DE LOS EJES --
        svg.append("text")
            .attr("class", "eje-label")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + 50)
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("fill", "#7a8a9a")
            .text("Años");

        svg.append("text")
            .attr("class", "eje-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("x", -height / 2)
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("fill", "#7a8a9a")
            .text("Número de Casos Totales");

        svg.selectAll(".bar-anual").data(chartData.annualTotals)
            .enter().append("rect").attr("class", "bar-anual").attr("x", d => xScale(d.year))
            .attr("y", height).attr("width", xScale.bandwidth())
            .attr("height", 0).attr("fill", COLORS.BARRAS_TENDENCIA)
            .transition()
            .duration(800)
            .ease(d3.easeCubicOut)
            .attr("y", d => yScale(d.total))
            .attr("height", d => height - yScale(d.total));

        svg.selectAll(".bar-anual-label").data(chartData.annualTotals).enter().filter(d => d.total > 0)
            .append("text").attr("class", "bar-anual-label").attr("x", d => xScale(d.year) + xScale.bandwidth() / 2)
            .attr("y", height)
            .attr("text-anchor", "middle").style("font-size", "10px")
            .style("fill", d => yScale(d.total) < 20 ? "white" : "#34495e").text(d => d.total)
            .transition()
            .duration(800)
            .ease(d3.easeCubicOut)
            .attr("y", d => yScale(d.total) < 20 ? yScale(d.total) + 15 : yScale(d.total) - 5);

        const annualTotals = chartData.annualTotals.map(d => d.total);
        const movingAverageData = calculateMovingAverage(annualTotals, 4);
        if (movingAverageData.length > 0) {
            const trendLine = d3.line()
                .x((d, i) => xScale(chartData.annualTotals[i].year) + xScale.bandwidth() / 2)
                .y(d => yScale(d))
                .defined(d => d !== null);
            
            const path = svg.append("path").datum(movingAverageData).attr("fill", "none")
                .attr("stroke", COLORS.LINEA_TENDENCIA).attr("stroke-width", 2).attr("d", trendLine);
            
            const totalLength = path.node().getTotalLength();
            path.attr("stroke-dasharray", totalLength + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                .duration(1200)
                .ease(d3.easeCubicOut)
                .attr("stroke-dashoffset", 0)
                .on("end", () => path.attr("stroke-dasharray", "6, 4"));
        }
    }

    // --- FUNCIÓN PARA EXPORTAR A PNG 16:9 ---
    function descargarGrafica16x9() {
        const originalSvg = document.querySelector("#graficoCanalesEndemicos svg");
        if (!originalSvg) {
            alert("No hay gráfica renderizada para descargar.");
            return;
        }

        const exportWidth = 1280;
        const exportHeight = 720;
        const cornerRadius = 30; 

        const svgClone = originalSvg.cloneNode(true);
        svgClone.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
        svgClone.setAttribute("width", exportWidth);
        svgClone.setAttribute("height", exportHeight);
        svgClone.setAttribute("preserveAspectRatio", "xMidYMid meet");

        // Estilos integrados para asegurar que las etiquetas de ejes se exporten bien
        const style = document.createElement("style");
        style.textContent = `
            text { font-family: 'Montserrat', sans-serif; }
            .eje-x text, .tick text { font-size: 14px; fill: #2c3e50; }
            .eje-label { font-size: 14px; font-weight: 600; fill: #7a8a9a; }
            path.domain { stroke: #bdc3c7; }
        `;
        svgClone.insertBefore(style, svgClone.firstChild);

        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgClone);
        if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        const img = new Image();
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = exportWidth;
            canvas.height = exportHeight;
            const ctx = canvas.getContext("2d");

            ctx.beginPath();
            ctx.moveTo(cornerRadius, 0);
            ctx.lineTo(exportWidth - cornerRadius, 0);
            ctx.quadraticCurveTo(exportWidth, 0, exportWidth, cornerRadius);
            ctx.lineTo(exportWidth, exportHeight - cornerRadius);
            ctx.quadraticCurveTo(exportWidth, exportHeight, exportWidth - cornerRadius, exportHeight);
            ctx.lineTo(cornerRadius, exportHeight);
            ctx.quadraticCurveTo(0, exportHeight, 0, exportHeight - cornerRadius);
            ctx.lineTo(0, cornerRadius);
            ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
            ctx.closePath();
            
            ctx.clip(); 
            ctx.drawImage(img, 0, 0, exportWidth, exportHeight);
            URL.revokeObjectURL(url);

            const pngUrl = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            
            const name = selectedDiseaseKey || "Canal_Endemico";
            const unit = selectedUnitKey ? `_${selectedUnitKey.replace(/\s+/g, '')}` : "";
            downloadLink.download = `Grafica_${name}${unit}_16x9.png`;
            
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        };

        img.src = url;
    }

    const btnDescargar = document.getElementById('btnDescargarGrafica');
    if(btnDescargar) {
        btnDescargar.addEventListener('click', descargarGrafica16x9);
    }

    init();
});