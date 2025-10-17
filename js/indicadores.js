import { configuracionIndicadores, datosProductividad, etiquetasIndicadores } from "./JSONprod.js";

document.addEventListener('DOMContentLoaded', function () {
    // Selectores del DOM
    const yearTabs = document.getElementById('yearTabs');
    const monthTabs = document.getElementById('monthTabs');
    const indicadorList = document.getElementById('indicadorList');
    const productividadChartContainer = d3.select("#productividadChartContainer");
    const chartContainer = d3.select("#productividadChart");

    const historicalChartMainContainer = d3.select("#historicalChartContainer");
    const historicalChartDiv = d3.select("#historicalChart");
    const historicalChartTitle = d3.select("#historicalChartTitle");
    const timeSlider = d3.select("#timeSlider");
    const sliderValueLabel = d3.select("#sliderValueLabel");
    const closeHistoricalChartButton = d3.select("#closeHistoricalChart");

    const prevButton = d3.select("#prevButton");
    const nextButton = d3.select("#nextButton");

    // Configuración del gráfico
    const margin = { top: 80, right: 140, bottom: 50, left: 200 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    const hMargin = { top: 50, right: 50, bottom: 70, left: 70 };
    const hWidth = 800 - hMargin.left - hMargin.right;
    const hHeight = 400 - hMargin.top - hMargin.bottom;

    let svg, xScale, yScale, tooltip;
    let selectedYear, selectedMonth, selectedIndicator = 0;
    let historicalSvg, xHistoricalScale, yHistoricalScale, historicalLine, slidingDot;
    let currentHistoricalData = [];
    const monthOrder = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    function initSVG() {
        chartContainer.html('');
        const svgEl = chartContainer.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("background", "#fff")
            .style("border-radius", "10px")
            .style("box-shadow", "0 4px 8px rgba(0,0,0,0.1)");

        svgEl.append("text")
            .attr("id", "tituloGrafica")
            .attr("x", margin.left + width / 2).attr("y", 30).attr("text-anchor", "middle")
            .style("font-family", "Montserrat, sans-serif").style("font-size", "16px")
            .style("fill", "#2c3e50").style("font-weight", "700");

        svg = svgEl.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        tooltip = d3.select("body").append("div")
            .attr("class", "chart-tooltip")
            .style("position", "absolute").style("opacity", 0).style("pointer-events", "none")
            .style("background", "rgba(44,62,80,0.95)").style("color", "#fff")
            .style("padding", "10px 15px").style("border-radius", "6px")
            .style("font-family", "Montserrat, sans-serif").style("font-size", "13px")
            .style("z-index", 1070).style("box-shadow", "0 2px 5px rgba(0,0,0,0.2)");
    }

    // --- FUNCIÓN PRINCIPAL DE ACTUALIZACIÓN (CON AMBOS ERRORES CORREGIDOS) ---
    function actualizarGrafico() {
        // SOLUCIÓN #2 (Leyenda persistente): Limpia solo los elementos que no son barras.
        // Las barras se manejarán con el patrón Enter-Update-Exit.
        if (svg) {
            svg.selectAll(":not(.bar)").remove();
        }

        if (!selectedYear || !selectedMonth) {
            if(svg) {
                svg.selectAll("*").remove(); // Limpieza total si no hay selección
                svg.append("text").attr("x", width / 2).attr("y", height / 2).attr("text-anchor", "middle")
                   .style("font-family", "Montserrat, sans-serif").style("font-size", "16px")
                   .text("Seleccione año y mes para ver datos.");
            }
            return;
        }
        
        // SOLUCIÓN #1 (Animación atascada): Añade una cubierta invisible.
        const eventBlocker = productividadChartContainer.append("div")
            .style("position", "absolute").style("top", 0).style("left", 0)
            .style("width", "100%").style("height", "100%")
            .style("z-index", 10);

        const año = selectedYear;
        const mes = selectedMonth;
        const idx = selectedIndicator;

        d3.select("#tituloGrafica").text(etiquetasIndicadores[idx] || "Indicador de productividad");

        const datosOriginales = datosProductividad[año]?.[mes] || [];
        const datos = datosOriginales
            .map(d => ({ unidad: d.unidad, valor: (d.indicador && d.indicador[idx] !== undefined) ? d.indicador[idx] : 0 }))
            .filter(d => d.valor > 0)
            .sort((a, b) => b.valor - a.valor);

        if (datos.length === 0) {
            svg.selectAll("*").remove(); // Limpieza total para el mensaje
            svg.append("text").attr("x", width / 2).attr("y", height / 2).attr("text-anchor", "middle")
                .style("font-family", "Montserrat, sans-serif").style("font-size", "16px")
                .text("No hay datos disponibles para esta selección.");
            eventBlocker.remove();
            return;
        }

        const config = configuracionIndicadores[año]?.[mes]?.[idx] || {};

        crearEscalas(datos);
        dibujarEjes(datos);
        dibujarUmbrales(config);
        dibujarBarras(datos, config, idx);
        dibujarEtiquetas(datos, config);
        dibujarLeyenda(config);

        // Quita la cubierta después de que las animaciones hayan terminado.
        setTimeout(() => {
            eventBlocker.remove();
        }, 1050); 
    }

    // --- FUNCIÓN DE DIBUJO DE BARRAS (CON ANIMACIÓN "MORPHING") ---
    function dibujarBarras(datos, config, idx) {
        const t = svg.transition().duration(800);

        const bars = svg.selectAll(".bar")
            .data(datos, d => d.unidad);

        // EXIT: Barras que ya no están en los nuevos datos se encogen y desvanecen.
        bars.exit()
            .transition(t)
            .attr("width", 0)
            .style("opacity", 0)
            .remove();

        // ENTER: Nuevas barras aparecen desde la izquierda.
        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("fill", d => calcularColor(d.valor, config, idx))
            .attr("x", 0)
            .attr("height", yScale.bandwidth())
            .attr("y", d => yScale(d.unidad))
            .attr("width", 0)
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => mostrarTooltip(event, d, idx, config))
            .on("mouseout", ocultarTooltip)
            .on("click", (event, d) => mostrarGraficoHistorico(d.unidad, selectedYear, selectedMonth))
            .merge(bars) // MERGE: Une las barras nuevas con las existentes
            .transition(t) // Aplica la transición principal
                .attr("y", d => yScale(d.unidad))
                .attr("height", yScale.bandwidth())
                .attr("width", d => xScale(Math.max(0, d.valor)))
                .attr("fill", d => calcularColor(d.valor, config, idx));
    }

    // --- FUNCIÓN DE ETIQUETAS (CON ANIMACIÓN DE MOVIMIENTO) ---
    function dibujarEtiquetas(datos, config) {
        const numDecimales = config?.decimales ?? 1;
        const labels = svg.selectAll(".label").data(datos, d => d.unidad);

        labels.exit()
            .transition().duration(300)
            .attr("x", 0)
            .style("opacity", 0)
            .remove();

        labels.enter()
            .append("text")
            .attr("class", "label")
            .attr("y", d => yScale(d.unidad) + yScale.bandwidth() / 2)
            .attr("dy", "0.35em")
            .style("font-family", "Montserrat, sans-serif")
            .style("font-size", datos.length > 30 ? "9px" : "11px")
            .style("font-weight", "600").style("fill", "#333")
            .style("opacity", 0) // Empiezan invisibles
            .attr("x", 0) // Empiezan a la izquierda
          .merge(labels)
            .transition().duration(800).delay(200) // Se mueven junto a las barras
            .attr("x", d => xScale(Math.max(0, d.valor)) + 5)
            .attr("y", d => yScale(d.unidad) + yScale.bandwidth() / 2)
            .text(d => d.valor.toFixed(numDecimales))
            .style("opacity", 1);
    }
    
    // --- RESTO DEL CÓDIGO (SIN CAMBIOS) ---
    function crearEscalas(datos) {
        const padding = datos.length > 30 ? 0.05 : datos.length > 20 ? 0.1 : datos.length > 10 ? 0.15 : 0.2;
        yScale = d3.scaleBand().domain(datos.map(d => d.unidad)).range([0, height]).padding(padding);
        xScale = d3.scaleLinear().domain([0, d3.max(datos, d => d.valor) * 1.1 || 10]).range([0, width]).nice();
    }

    function dibujarEjes(datos) {
        svg.selectAll(".x-axis, .y-axis").remove();
        svg.append("g").attr("class", "x-axis axis").attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(Math.min(10, Math.floor(width / 80))).tickSizeOuter(0))
            .selectAll("text").style("font-family", "Montserrat, sans-serif").style("font-size", "11px");
        svg.append("g").attr("class", "y-axis axis").call(d3.axisLeft(yScale).tickSize(0).tickPadding(10))
            .selectAll("text").style("font-family", "Montserrat, sans-serif")
            .style("font-size", () => datos.length > 35 ? "8px" : datos.length > 25 ? "9px" : datos.length > 15 ? "10px" : "11px")
            .call(truncarTexto, margin.left - 25);
    }

    function truncarTexto(selection, maxWidth) {
        selection.each(function() {
            const text = d3.select(this); let content = text.text();
            if (text.node().getComputedTextLength() <= maxWidth) return;
            text.text(content + '...');
            while (text.node().getComputedTextLength() > maxWidth && content.length > 1) {
                content = content.slice(0, -1); text.text(content + '...');
            }
            if (content.length <=1 && text.node().getComputedTextLength() > maxWidth) {
                 text.text(content[0] + '...');
            }
        });
    }

    function calcularColor(valor, config, idx) {
        if (!config || !config.backgroundColors || config.umbralSuperior === undefined || config.umbralInferior === undefined) return "#007bff";
        if ((idx === 0 || idx === 25) && config.valorMinimoRojo !== undefined) {
            if (valor <= config.valorMinimoRojo || valor > config.umbralSuperior) return config.backgroundColors[0];
            if (valor > config.valorMinimoRojo && valor < config.umbralInferior) return config.backgroundColors[2];
            return config.backgroundColors[1];
        }
        if (valor > config.umbralSuperior) return config.backgroundColors[0];
        if (valor >= config.umbralInferior) return config.backgroundColors[1];
        return config.backgroundColors[2];
    }

    function dibujarUmbrales(config) {
        svg.selectAll(".umbral-superior, .umbral-inferior, .umbral-label").remove();
        if (!config) return;
        if (config.umbralSuperior != null && xScale(config.umbralSuperior) >= 0) {
            svg.append("line").attr("class", "umbral-superior").attr("x1", xScale(config.umbralSuperior)).attr("x2", xScale(config.umbralSuperior)).attr("y1", -10).attr("y2", height + 10).attr("stroke", config.colorSuperior || "#e74c3c").attr("stroke-width", 1.5).attr("stroke-dasharray", "4 3");
            svg.append("text").attr("class", "umbral-label").attr("x", xScale(config.umbralSuperior)).attr("y", -15).attr("text-anchor", "middle").style("font-family", "Montserrat, sans-serif").style("font-size", "10px").style("fill", config.colorSuperior || "#e74c3c").text(`Sup: ${config.umbralSuperior}`);
        }
        if (config.umbralInferior != null && xScale(config.umbralInferior) >= 0) {
            svg.append("line").attr("class", "umbral-inferior").attr("x1", xScale(config.umbralInferior)).attr("x2", xScale(config.umbralInferior)).attr("y1", -10).attr("y2", height + 10).attr("stroke", config.colorInferior || "#f39c12").attr("stroke-width", 1.5).attr("stroke-dasharray", "5 5");
            svg.append("text").attr("class", "umbral-label").attr("x", xScale(config.umbralInferior)).attr("y", -15).attr("text-anchor", "middle").style("font-family", "Montserrat, sans-serif").style("font-size", "10px").style("fill", config.colorInferior || "#f39c12").text(`Inf: ${config.umbralInferior}`);
        }
    }

    function dibujarLeyenda(config) {
        svg.selectAll(".leyenda-container").remove();
        if (!config || !config.backgroundColors || config.umbralSuperior === undefined || config.umbralInferior === undefined) return;
        const leyendaData = [{ color: config.backgroundColors[0], text: `> ${config.umbralSuperior}` },{ color: config.backgroundColors[1], text: `${config.umbralInferior} - ${config.umbralSuperior}` },{ color: config.backgroundColors[2], text: `< ${config.umbralInferior}` }];
        const legend = svg.append("g").attr("class", "leyenda-container").attr("transform", `translate(${width + 20}, 20)`);
        leyendaData.forEach((d, i) => {
            const item = legend.append("g").attr("transform", `translate(0, ${i * 25})`);
            item.append("rect").attr("width", 16).attr("height", 16).attr("fill", d.color).attr("rx", 3).attr("ry", 3).style("stroke", "#ccc").style("stroke-width", 0.5);
            item.append("text").attr("x", 22).attr("y", 12).style("font-family", "Montserrat, sans-serif").style("font-size", "11px").style("fill", "#2c3e50").text(d.text);
        });
    }

    function mostrarTooltip(event, d, idx, config) {
        d3.select(event.currentTarget).transition().duration(150).style("opacity", 0.7);
        const numDecimales = config?.decimales ?? 1;
        tooltip.html(`<div style="font-weight:bold; margin-bottom:5px; border-bottom: 1px solid #555; padding-bottom:5px;">${d.unidad}</div><div style="font-size:0.9em;">${etiquetasIndicadores[idx]}</div>Valor: <span style="font-weight:bold; font-size:1.1em;">${d.valor.toFixed(numDecimales)}</span>`)
        .style("left", `${event.pageX + 15}px`).style("top", `${event.pageY - 20}px`).transition().duration(150).style("opacity", 0.95);
    }

    function ocultarTooltip(event) {
        d3.select(event.currentTarget).transition().duration(150).style("opacity", 1);
        tooltip.transition().duration(150).style("opacity", 0);
    }

    function cargarAnos() {
        yearTabs.innerHTML = "";
        const years = Object.keys(datosProductividad).sort((a,b) => parseInt(b) - parseInt(a));
        if (years.length === 0) { console.error("No hay años en datosProductividad."); return; }
        years.forEach((año, i) => {
            const li = document.createElement("li");
            li.textContent = año; li.dataset.year = año;
            if (i === 0 && !selectedYear) { selectedYear = año; }
            if (año === selectedYear) { li.classList.add("active"); }
            li.addEventListener("click", () => {
                yearTabs.querySelectorAll("li").forEach(x => x.classList.remove("active"));
                li.classList.add("active");
                selectedYear = año; selectedMonth = null;
                cargarMeses();
            });
            yearTabs.appendChild(li);
        });
        if (!selectedYear && years.length > 0) selectedYear = years[0];
        cargarMeses();
    }

    function cargarMeses() {
        monthTabs.innerHTML = "";
        if (!selectedYear || !datosProductividad[selectedYear]) { selectedMonth = null; cargarIndicadores(); return; }
        const mesesObj = datosProductividad[selectedYear];
        const sortedMeses = Object.keys(mesesObj).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
        if (sortedMeses.length === 0) { selectedMonth = null; cargarIndicadores(); return; }
       if (!selectedMonth || !sortedMeses.includes(selectedMonth)) { selectedMonth = sortedMeses[sortedMeses.length - 1]; }
        sortedMeses.forEach((mes) => {
            const li = document.createElement("li");
            li.textContent = mes; li.dataset.mes = mes;
            if (mes === selectedMonth) { li.classList.add("active"); }
            li.addEventListener("click", () => {
                monthTabs.querySelectorAll("li").forEach(x => x.classList.remove("active"));
                li.classList.add("active");
                selectedMonth = mes;
                cargarIndicadores();
            });
            monthTabs.appendChild(li);
        });
        cargarIndicadores();
    }

    function cargarIndicadores() {
        indicadorList.innerHTML = "";
        if (!selectedYear || !selectedMonth) { actualizarGrafico(); return; }
        etiquetasIndicadores.forEach((texto, i) => {
            const li = document.createElement("li");
            li.textContent = texto; li.dataset.idx = i;
            if (i === selectedIndicator) { li.classList.add("active");}
            li.addEventListener("click", () => {
                indicadorList.querySelectorAll("li").forEach(x => x.classList.remove("active"));
                li.classList.add("active");
                selectedIndicator = i;
                actualizarGrafico();
                if (historicalChartMainContainer.style("display") !== "none") {
                    cerrarGraficoHistorico();
                }
            });
            indicadorList.appendChild(li);
        });
        actualizarGrafico();
    }

    function getHistoricalData(unitName, indicatorIndex, allProdData) {
        const historicalValues = [];
        const availableYears = Object.keys(allProdData).sort((a,b) => parseInt(a) - parseInt(b));
        availableYears.forEach(year => {
            const monthsInYearData = allProdData[year];
            if (monthsInYearData) {
                monthOrder.forEach(monthName => {
                    if (monthsInYearData[monthName]) {
                        const unitDataObject = monthsInYearData[monthName].find(u => u.unidad === unitName);
                        if (unitDataObject && unitDataObject.indicador && unitDataObject.indicador[indicatorIndex] !== undefined) {
                            historicalValues.push({
                                periodoDisplay: `${monthName.substring(0, 3)} ${year.slice(-2)}`,
                                valor: unitDataObject.indicador[indicatorIndex],
                                originalYear: year, originalMonth: monthName, originalIndex: historicalValues.length
                            });
                        }
                    }
                });
            }
        });
        return historicalValues;
    }

    function mostrarGraficoHistorico(unitName, yearOfContext, monthOfContext) {
        currentHistoricalData = getHistoricalData(unitName, selectedIndicator, datosProductividad);
        if (currentHistoricalData.length === 0) {
            alert(`No hay datos históricos para ${unitName} en "${etiquetasIndicadores[selectedIndicator]}".`);
            return;
        }
        productividadChartContainer.style("display", "none");
        historicalChartMainContainer.style("display", "block");
        historicalChartTitle.text(`Historial: ${etiquetasIndicadores[selectedIndicator]} - ${unitName}`);
        
        let initialIndex = currentHistoricalData.length - 1;
        const foundIndex = currentHistoricalData.findIndex(d => d.originalYear === yearOfContext && d.originalMonth === monthOfContext);
        if (foundIndex !== -1) { initialIndex = foundIndex; }
        else {
            const lastIndexOfYear = currentHistoricalData.map(d => d.originalYear).lastIndexOf(yearOfContext);
            if(lastIndexOfYear !== -1) {
                 let tempIndex = -1;
                 for(let i = currentHistoricalData.length -1; i >= 0; i--) {
                     if(currentHistoricalData[i].originalYear === yearOfContext) { tempIndex = i; break; }
                 }
                 if(tempIndex !== -1) initialIndex = tempIndex;
            }
        }

        if (timeSlider.node()){
            timeSlider.node().min = 0;
            timeSlider.node().max = currentHistoricalData.length > 0 ? currentHistoricalData.length - 1 : 0;
            timeSlider.node().value = initialIndex;
        }
        dibujarGraficoHistoricoD3(currentHistoricalData);
        actualizarPuntoDeslizanteYBotones(initialIndex);
    }

    function dibujarGraficoHistoricoD3(hData) {
        historicalChartDiv.html('');
        if (hData.length === 0) { historicalChartDiv.append("p").text("No hay datos para graficar.").style("text-align", "center").style("padding-top", "50px"); return; }
        historicalSvg = historicalChartDiv.append("svg")
            .attr("width", hWidth + hMargin.left + hMargin.right).attr("height", hHeight + hMargin.top + hMargin.bottom)
            .append("g").attr("transform", `translate(${hMargin.left},${hMargin.top})`);
        xHistoricalScale = d3.scalePoint().domain(hData.map(d => d.periodoDisplay)).range([0, hWidth]).padding(0.5);
        const yMin = d3.min(hData, d => d.valor); const yMax = d3.max(hData, d => d.valor);
        yHistoricalScale = d3.scaleLinear().domain([(yMin !== undefined ? yMin * 0.9 : 0), (yMax !== undefined ? yMax * 1.1 : 10)]).range([hHeight, 0]).nice();
        historicalSvg.append("g").attr("transform", `translate(0,${hHeight})`).call(d3.axisBottom(xHistoricalScale).tickSizeOuter(0))
            .selectAll("text").style("text-anchor", "end").attr("dx", "-.8em").attr("dy", ".15em").attr("transform", "rotate(-45)").style("font-size", hData.length > 15 ? "8px" : (hData.length > 10 ? "9px" : "10px"));
        historicalSvg.append("g").call(d3.axisLeft(yHistoricalScale));
        historicalLine = d3.line().x(d => xHistoricalScale(d.periodoDisplay)).y(d => yHistoricalScale(d.valor)).defined(d => d.valor != null && !isNaN(d.valor)).curve(d3.curveMonotoneX);
        historicalSvg.append("path").datum(hData.filter(d => d.valor != null && !isNaN(d.valor))).attr("fill", "none").attr("stroke", "#007bff").attr("stroke-width", 2.5).attr("d", historicalLine);
        historicalSvg.selectAll(".hist-data-point").data(hData.filter(d => d.valor != null && !isNaN(d.valor))).enter().append("circle").attr("class", "hist-data-point")
            .attr("cx", d => xHistoricalScale(d.periodoDisplay)).attr("cy", d => yHistoricalScale(d.valor)).attr("r", 3.5)
            .attr("fill", d => {
                const pointConfig = configuracionIndicadores[d.originalYear]?.[d.originalMonth]?.[selectedIndicator] || {};
                return calcularColor(d.valor, pointConfig, selectedIndicator);
            }).attr("stroke", "#fff").attr("stroke-width", 1);
        slidingDot = historicalSvg.append("circle").attr("class", "sliding-dot").attr("r", 7).attr("stroke", "#333").attr("stroke-width", 2).style("opacity", 0);
    }

    function actualizarPuntoDeslizanteYBotones(index) {
        if (!currentHistoricalData || currentHistoricalData.length === 0) {
            sliderValueLabel.text("N/A"); if(slidingDot) slidingDot.style("opacity", 0);
            prevButton.property("disabled", true); nextButton.property("disabled", true); return;
        }
        index = Math.max(0, Math.min(index, currentHistoricalData.length - 1));
        if (timeSlider.node()) timeSlider.node().value = index;
        const dataPoint = currentHistoricalData[index];
        if (!dataPoint) {
            if(slidingDot) slidingDot.style("opacity", 0); sliderValueLabel.text("Error: dato no encontrado");
            prevButton.property("disabled", true); nextButton.property("disabled", true); return;
        }
        const numDecimales = configuracionIndicadores[dataPoint.originalYear]?.[dataPoint.originalMonth]?.[selectedIndicator]?.decimales ?? 1;
        if (dataPoint.valor !== null && !isNaN(dataPoint.valor) && xHistoricalScale && yHistoricalScale && slidingDot) {
            const cx = xHistoricalScale(dataPoint.periodoDisplay); const cy = yHistoricalScale(dataPoint.valor);
            const pointConfig = configuracionIndicadores[dataPoint.originalYear]?.[d.originalMonth]?.[selectedIndicator] || {};
            const dotColor = calcularColor(dataPoint.valor, pointConfig, selectedIndicator);
            if (cx !== undefined && cy !== undefined && !isNaN(cx) && !isNaN(cy)) {
                slidingDot.attr("cx", cx).attr("cy", cy).attr("fill", dotColor).style("opacity", 1);
                sliderValueLabel.text(`${dataPoint.periodoDisplay}: ${dataPoint.valor.toFixed(numDecimales)}`);
            } else { slidingDot.style("opacity", 0); sliderValueLabel.text("Error pos."); }
        } else {
            if(slidingDot) slidingDot.style("opacity", 0);
            sliderValueLabel.text(dataPoint ? `${dataPoint.periodoDisplay}: N/D` : "N/A");
        }
        prevButton.property("disabled", index === 0);
        nextButton.property("disabled", index === (currentHistoricalData.length - 1));
    }

    function cerrarGraficoHistorico() {
        historicalChartMainContainer.style("display", "none");
        productividadChartContainer.style("display", "block");
        historicalChartDiv.html('');
        currentHistoricalData = [];
    }

    timeSlider.on("input", function() { actualizarPuntoDeslizanteYBotones(+this.value); });
    closeHistoricalChartButton.on("click", cerrarGraficoHistorico);
    prevButton.on("click", function() {
        let currentIndex = timeSlider.node() ? +timeSlider.node().value : 0;
        if (currentIndex > 0) { actualizarPuntoDeslizanteYBotones(currentIndex - 1); }
    });
    nextButton.on("click", function() {
        let currentIndex = timeSlider.node() ? +timeSlider.node().value : 0;
        let maxIndex = currentHistoricalData.length > 0 ? currentHistoricalData.length - 1 : 0;
        if (currentIndex < maxIndex) { actualizarPuntoDeslizanteYBotones(currentIndex + 1); }
    });

    initSVG();
    cargarAnos();
});