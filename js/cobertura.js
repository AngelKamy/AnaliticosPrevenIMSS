import { datos, detalles } from './JSONdatos.js';

document.addEventListener('DOMContentLoaded', function () {
    const yearTabsContainerElement = document.getElementById('yearTabsCobertura');
    const monthTabsContainerElement = document.getElementById('monthTabsCobertura');
    const unitTabsContainerElement = document.getElementById('unitTabsCobertura');
    const ageGroupTabsContainerElement = document.getElementById('ageGroupTabsCobertura');

    const unitTabsFilterContainer = document.getElementById('unitTabsFilterContainer');
    const coberturasVizTitleElement = document.getElementById('coberturasVisualizationTitle');
    const cardsGrid = document.getElementById('cardsGrid');
    // const delegacionalChartContainer = document.getElementById('delegacionalChartContainer'); // Ya no se usa
    const tarjetaDetalleInfo = document.getElementById('detalleInfo');
    const textoDetalle = document.getElementById('textoDetalle');
    const radarLegendContainer = document.getElementById('radarLegendContainer');

    const visualizationModeToggle = document.getElementById('visualizationModeToggle');
    const modeLabelUnidad = document.getElementById('modeLabelUnidad');
    const modeLabelGrupo = document.getElementById('modeLabelGrupo');

    let selectedYear, selectedMonth, selectedUnit, selectedAgeGroup;
    let currentVisualizationMode = 'porUnidad'; 

    const coloresPorGrupoEdad = {
        'Niño': '#2ECC71', 'Adolescente': '#3498DB', 'Mujer': '#E74C3C',
        'Hombre': '#5D6D7E', 'Adulto Mayor': '#F39C12', 'Toda la Unidad': '#9B59B6',
        'Todos los grupos': '#7F8C8D'
    };
    const monthOrder = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    visualizationModeToggle.addEventListener('change', function() {
        currentVisualizationMode = this.checked ? 'porGrupo' : 'porUnidad';
        if (this.checked) {
            modeLabelUnidad.classList.remove('active-mode-label');
            modeLabelGrupo.classList.add('active-mode-label');
        } else {
            modeLabelUnidad.classList.add('active-mode-label');
            modeLabelGrupo.classList.remove('active-mode-label');
        }
        actualizarVisibilidadFiltros();
        selectedYear = null; selectedMonth = null; selectedUnit = null; selectedAgeGroup = null;
        cargarAnosTabs();
    });

    function actualizarVisibilidadFiltros() {
        unitTabsFilterContainer.classList.toggle('hidden-filter', currentVisualizationMode === 'porGrupo');
    }

    function limpiarVisualizacionesYTabsInferiores(nivelActivador) {
        limpiarVisualizaciones();
        if (nivelActivador === 'ano') {
            monthTabsContainerElement.innerHTML = '';
            unitTabsContainerElement.innerHTML = '';
            ageGroupTabsContainerElement.innerHTML = '';
        } else if (nivelActivador === 'mes') {
            if (currentVisualizationMode === 'porUnidad') unitTabsContainerElement.innerHTML = '';
            ageGroupTabsContainerElement.innerHTML = '';
        } else if (nivelActivador === 'unidad' && currentVisualizationMode === 'porUnidad') {
            ageGroupTabsContainerElement.innerHTML = '';
        }
    }
    
    function limpiarVisualizaciones() {
        cardsGrid.innerHTML = '';
        // delegacionalChartContainer.innerHTML = ''; // Ya no es un contenedor separado
        if (radarLegendContainer) radarLegendContainer.innerHTML = ''; radarLegendContainer.style.display = 'none';
        if (tarjetaDetalleInfo) tarjetaDetalleInfo.style.display = 'none';
    }

    function cargarAnosTabs() {
        yearTabsContainerElement.innerHTML = '';
        limpiarVisualizacionesYTabsInferiores('ano');
        const anos = Object.keys(datos).sort((a, b) => parseInt(b) - parseInt(a));
        if (anos.length > 0) {
            const prevSelectedYear = selectedYear;
            selectedYear = prevSelectedYear && anos.includes(prevSelectedYear) ? prevSelectedYear : anos[0];
            anos.forEach(ano => {
                const li = document.createElement('li');
                li.textContent = ano; li.dataset.year = ano;
                if (ano === selectedYear) li.classList.add('active');
                li.addEventListener('click', function () {
                    yearTabsContainerElement.querySelector('.active')?.classList.remove('active'); this.classList.add('active');
                    selectedYear = this.dataset.year; selectedMonth = null; selectedUnit = null; selectedAgeGroup = null;
                    cargarMesesTabs();
                });
                yearTabsContainerElement.appendChild(li);
            });
            cargarMesesTabs();
        } else { actualizarGraficos(); }
    }
    
    function cargarMesesTabs() {
        monthTabsContainerElement.innerHTML = '';
        limpiarVisualizacionesYTabsInferiores('mes');
        if (!selectedYear || !datos[selectedYear]) { actualizarGraficos(); return; }
        const meses = Object.keys(datos[selectedYear]).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
        if (meses.length > 0) {
            const prevSelectedMonth = selectedMonth;
            selectedMonth = prevSelectedMonth && meses.includes(prevSelectedMonth) ? prevSelectedMonth : meses[meses.length - 1];
            meses.forEach(mes => {
                const li = document.createElement('li');
                li.textContent = mes; li.dataset.month = mes;
                if (mes === selectedMonth) li.classList.add('active');
                li.addEventListener('click', function () {
                    monthTabsContainerElement.querySelector('.active')?.classList.remove('active'); this.classList.add('active');
                    selectedMonth = this.dataset.month; selectedUnit = null; selectedAgeGroup = null;
                    if (currentVisualizationMode === 'porUnidad') cargarUnidadesTabs();
                    else cargarGruposEdadTabs(); 
                });
                monthTabsContainerElement.appendChild(li);
            });
            if (currentVisualizationMode === 'porUnidad') cargarUnidadesTabs();
            else cargarGruposEdadTabs();
        } else { actualizarGraficos(); }
    }
    
    function cargarUnidadesTabs() {
        unitTabsContainerElement.innerHTML = '';
        limpiarVisualizacionesYTabsInferiores('unidad');
        if (!selectedYear || !selectedMonth || !datos[selectedYear]?.[selectedMonth]) { actualizarGraficos(); return; }
        const unidades = datos[selectedYear][selectedMonth].map(u => u.nombre).sort((a, b) => {
            if (a.toLowerCase() === "delegacional") return -1; if (b.toLowerCase() === "delegacional") return 1;
            return a.localeCompare(b); 
        });
        if (unidades.length > 0) {
            const prevSelectedUnit = selectedUnit;
            selectedUnit = prevSelectedUnit && unidades.includes(prevSelectedUnit) ? prevSelectedUnit : unidades[0];
            unidades.forEach(unidadNombre => {
                const li = document.createElement('li');
                li.textContent = unidadNombre; li.dataset.unit = unidadNombre;
                if (unidadNombre === selectedUnit) li.classList.add('active');
                li.addEventListener('click', function () {
                    unitTabsContainerElement.querySelector('.active')?.classList.remove('active'); this.classList.add('active');
                    selectedUnit = this.dataset.unit; selectedAgeGroup = null;
                    cargarGruposEdadTabs();
                });
                unitTabsContainerElement.appendChild(li);
            });
            cargarGruposEdadTabs();
        } else { actualizarGraficos(); }
    }
    
    function cargarGruposEdadTabs() {
        ageGroupTabsContainerElement.innerHTML = '';
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
    
        opcionesPestanas.forEach(grupoNombre => {
            if (currentVisualizationMode === 'porGrupo' && grupoNombre === 'Todos los grupos') return; 
            const li = document.createElement('li');
            li.textContent = grupoNombre.replace(/([A-Z])/g, ' $1').replace(/^Todos /, 'Todos ').trim();
            li.dataset.agegroup = grupoNombre;
            if (grupoNombre === selectedAgeGroup) li.classList.add('active');
            li.addEventListener('click', function () {
                ageGroupTabsContainerElement.querySelector('.active')?.classList.remove('active'); this.classList.add('active');
                selectedAgeGroup = this.dataset.agegroup;
                actualizarGraficos();
            });
            ageGroupTabsContainerElement.appendChild(li);
        });
        actualizarGraficos();
    }
    
    function actualizarTituloPrincipal() {
        let titleText = 'Coberturas PREVENIMSS';
         if (selectedYear && selectedMonth) {
            if (currentVisualizationMode === 'porUnidad') {
                if (selectedUnit) {
                    titleText = `Coberturas PREVENIMSS para ${selectedUnit}`;
                    if (selectedAgeGroup) {
                        const displayAgeGroup = selectedAgeGroup.replace(/([A-Z](?=[a-z]))/g, ' $1').trim();
                        titleText += (selectedAgeGroup === 'Todos los grupos') ? " - Resumen General por Grupos" : ` - ${displayAgeGroup}`;
                    }
                     titleText += ` (${selectedMonth} ${selectedYear})`;
                }
            } else { 
                if (selectedAgeGroup && selectedAgeGroup !== 'Todos los grupos') {
                    const displayAgeGroup = selectedAgeGroup.replace(/([A-Z](?=[a-z]))/g, ' $1').trim();
                    titleText = `Coberturas PREVENIMSS para el Grupo: ${displayAgeGroup.replace(/^Toda la Unidad$/, 'Toda la Unidad (Promedios)')} (${selectedMonth} ${selectedYear})`;
                } else {
                     titleText = `Coberturas PREVENIMSS por Grupo Demográfico (${selectedMonth} ${selectedYear})`;
                }
            }
        }
        coberturasVizTitleElement.textContent = titleText;
    }

    function actualizarLeyendaRadar() {
        radarLegendContainer.innerHTML = '';
        radarLegendContainer.style.display = 'none'; 

        if (currentVisualizationMode === 'porGrupo' && selectedAgeGroup && selectedAgeGroup !== 'Todos los grupos' && detalles[selectedAgeGroup]) {
            const legendTitle = document.createElement('h4');
            const displayAgeGroup = selectedAgeGroup.replace(/([A-Z])/g, ' $1').replace(/^Toda la Unidad$/, 'Toda la Unidad (Promedios)').trim();
            legendTitle.textContent = `Acciones: ${displayAgeGroup}`;
            legendTitle.style.color = coloresPorGrupoEdad[selectedAgeGroup] || '#333';
            radarLegendContainer.appendChild(legendTitle);

            const ul = document.createElement('ul');
            const unidadDeReferenciaParaLabels = datos[selectedYear]?.[selectedMonth]?.find(u => u.gruposEdad[selectedAgeGroup]);
            const labelsDeReferencia = unidadDeReferenciaParaLabels?.gruposEdad[selectedAgeGroup]?.labels || [];

            detalles[selectedAgeGroup].forEach((detalle, index) => {
                const li = document.createElement('li');
                const labelNumero = labelsDeReferencia[index] || (index + 1); 
                const descripcionSinNumero = detalle.substring(detalle.indexOf(' ') + 1);
                li.textContent = `${labelNumero}. ${descripcionSinNumero}`;
                ul.appendChild(li);
            });
            radarLegendContainer.appendChild(ul);
            radarLegendContainer.style.display = 'block';
        }
    }
    
    function actualizarGraficos() {
        limpiarVisualizaciones();
        actualizarTituloPrincipal();
        actualizarLeyendaRadar();

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
        const isPorGrupoMode = currentVisualizationMode === 'porGrupo';
        // Tamaños base para tarjetas normales
        let width = 260, height = 260, cardHeightPadding = 110, radiusPadding = 40, 
            valueLabelOffset = 10, valueLabelFontSize = "8px", 
            axisLabelFontSize = "7.5px", axisLabelOffsetFactor = 1.22,
            cardPadding = 10; // Padding interno de la tarjeta

        if (esDelegacional && isPorGrupoMode) { // Delegacional en modo "Por Grupo Demográfico" es más grande
            width = 340; height = 340; cardHeightPadding = 130; radiusPadding = 55;
            valueLabelOffset = 14; valueLabelFontSize = "10px"; axisLabelFontSize = "9px";
            axisLabelOffsetFactor = 1.18;
            cardPadding = 15;
        }
    
        const cardWidth = width + (cardPadding * 2);
        const cardHeight = height + cardHeightPadding;
        const radius = Math.min(width, height) / 2 - radiusPadding;
    
        const card = d3.select(contenedor)
            .append('div')
            .attr('class', 'card' + (esDelegacional && isPorGrupoMode ? ' delegacional-card' : ''))
            .style('width', `${cardWidth}px`)
            .style('height', `${cardHeight}px`)
            .on('mouseenter', (event) => mostrarDetalles(event, grupoEdad, datosGrupo, unidadMedica, mes, ano))
            .on('mouseleave', () => tarjetaDetalleInfo.style.display = 'none');
    
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
            .attr("class", "card-title")
            .style("color", coloresPorGrupoEdad[grupoEdad] || '#333')
            .html(`<h3>${cardTitleText}</h3><small>${cardSubText}</small>`);
    
        const svg = card.append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
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
            svg.append("text").attr("x", 3).attr("y", -escala(nivelValor) - 2)
                .text(nivelValor + "%").style("font-size", "7px").style("fill", "#777").attr("text-anchor", "start");
        }
    
        const valoresDesdeCentro = new Array(datosGrupo.valores.length).fill(0);
        const path = svg.append("path").datum(valoresDesdeCentro).attr("d", line)
            .attr("fill", coloresPorGrupoEdad[grupoEdad] || '#3498db').attr("fill-opacity", 0)
            .attr("stroke", coloresPorGrupoEdad[grupoEdad] || '#3498db').attr("stroke-width", 2.5);
    
        path.transition().duration(1000).ease(d3.easeCubicOut)
            .attrTween("d", function () { return t => line(d3.interpolate(valoresDesdeCentro, datosGrupo.valores)(t)); })
            .style("fill-opacity", 0.35);
    
        svg.selectAll(".punto-dato").data(datosGrupo.valores).enter().append("circle")
            .attr("class", "punto-dato")
            .attr("cx", (d, i) => Math.sin(anguloSlice * i) * escala(d))
            .attr("cy", (d, i) => -Math.cos(anguloSlice * i) * escala(d))
            .attr("r", 3).attr("fill", "white")
            .attr("stroke", coloresPorGrupoEdad[grupoEdad] || '#3498db').attr("stroke-width", 1.5)
            .style("opacity", 0).transition().delay(800).style("opacity", 1);
    
        svg.selectAll(".valor-punto-etiqueta").data(datosGrupo.valores).enter().append("text")
            .attr("class", "valor-punto-etiqueta")
            .attr("x", (d, i) => Math.sin(anguloSlice * i) * (escala(d) + valueLabelOffset))
            .attr("y", (d, i) => -Math.cos(anguloSlice * i) * (escala(d) + valueLabelOffset) + 3)
            .text(d => d.toFixed(1)).style("font-size", valueLabelFontSize).style("font-family", "Montserrat, sans-serif")
            .style("fill", d3.color(coloresPorGrupoEdad[grupoEdad] || '#333').darker(0.85))
            .style("text-anchor", "middle").style("dominant-baseline", "middle")
            .style("pointer-events", "none").style("opacity", 0).transition().delay(900).style("opacity", 1);
    
        svg.selectAll(".label-eje").data(datosGrupo.labels).enter().append("text")
            .attr("class", "label-eje")
            .attr("x", (_, i) => Math.sin(anguloSlice * i) * (radius * axisLabelOffsetFactor))
            .attr("y", (_, i) => -Math.cos(anguloSlice * i) * (radius * axisLabelOffsetFactor))
            .text(d => d).style("font-size", axisLabelFontSize).style("font-weight", "500").style("fill", "#444")
            .attr("text-anchor", (_,i) => { const angleDeg=(anguloSlice*i*180/Math.PI+360)%360; if(Math.abs(angleDeg-0)<1e-6||Math.abs(angleDeg-180)<1e-6)return"middle";if(angleDeg>0&&angleDeg<180)return"start";return"end";})
            .attr("dy", (_,i) => { const angleDeg=(anguloSlice*i*180/Math.PI+360)%360; if(Math.abs(angleDeg-90)<1e-6)return"-0.4em";if(Math.abs(angleDeg-270)<1e-6)return"0.8em";return"0.3em";})
            .style("opacity", 0).transition().delay(800).style("opacity", 1);
    
        card.append("div").attr("class", "promedio").html(`<span class="promedio-label">Cobertura</span><strong>${prom}%</strong>`);
    }

    function mostrarDetalles(event, grupoEdad, datosGrupo, unidadMedica, mes, ano) {
        const detallesGrupo = detalles[grupoEdad] || [];
        let html = "";
        if (grupoEdad === 'Toda la Unidad') {
            html = datosGrupo.valores.map((valor, i) => {
                const descripcionItem = detalles[grupoEdad] ? (detalles[grupoEdad][i] || `Dato ${i + 1}`) : `Dato ${i + 1}`;
                let nombreGrupoParaColor = '';
                const partesDescripcion = descripcionItem.split('. ');
                if (partesDescripcion.length > 1) {
                    nombreGrupoParaColor = partesDescripcion[1].trim();
                    if (nombreGrupoParaColor.toLowerCase().includes('adulto mayor')) nombreGrupoParaColor = 'Adulto Mayor';
                }
                const valorFormateado = valor?.toFixed(1) || 'N/A';
                return `<li><span class="bullet" style="color:${coloresPorGrupoEdad[nombreGrupoParaColor] || '#7f8c8d'}">●</span><strong>${descripcionItem}:</strong> <span class="valor_detalle">${valorFormateado}%</span></li>`;
            }).join('');
        } else {
            html = datosGrupo.labels.map((labelAccion, i) => {
                const descripcionAccion = detallesGrupo[i] || `Acción ${labelAccion}`;
                return `<li><span class="bullet" style="color:${coloresPorGrupoEdad[grupoEdad] || '#7f8c8d'}">●</span><strong>${descripcionAccion.substring(descripcionAccion.indexOf(' ') + 1)}:</strong> <span class="valor_detalle">${datosGrupo.valores[i]?.toFixed(1) || 'N/A'}%</span></li>`;
            }).join('');
        }

        const tituloDetalleH1 = document.getElementById('tituloDetalle');
        if (tituloDetalleH1) {
            let tituloTooltip = '';
            if (currentVisualizationMode === 'porUnidad') {
                tituloTooltip = `${unidadMedica} - ${grupoEdad.replace(/([A-Z](?=[a-z]))/g, ' $1').replace(/^Toda la Unidad$/, 'Toda la UMF (Promedios)').trim()}`;
            } else {
                tituloTooltip = `${unidadMedica} (${grupoEdad.replace(/([A-Z](?=[a-z]))/g, ' $1').replace(/^Toda la Unidad$/, 'Toda la UMF (Promedios)').trim()})`;
            }
            tituloDetalleH1.innerHTML = `${tituloTooltip}<br><small style="font-size: 0.8em; color: #ccc;">(${mes} ${ano})</small>`;
        }

        textoDetalle.innerHTML = `<ul>${html}</ul>`;
        tarjetaDetalleInfo.style.display = 'block';
        
        const currentCard = event.currentTarget;
        const cardRect = currentCard.getBoundingClientRect();
        const tooltipWidth = tarjetaDetalleInfo.offsetWidth;
        const tooltipHeight = tarjetaDetalleInfo.offsetHeight;
        const spacing = 15; let left, top;

        if (cardRect.right + tooltipWidth + spacing < window.innerWidth) { left = cardRect.right + spacing; top = cardRect.top + window.scrollY; } 
        else if (cardRect.left - tooltipWidth - spacing > 0) { left = cardRect.left - tooltipWidth - spacing; top = cardRect.top + window.scrollY; } 
        else if (cardRect.bottom + tooltipHeight + spacing < window.innerHeight + window.scrollY) { left = cardRect.left + (cardRect.width / 2) - (tooltipWidth / 2); top = cardRect.bottom + spacing + window.scrollY; } 
        else { left = cardRect.left + (cardRect.width / 2) - (tooltipWidth / 2); top = cardRect.top - tooltipHeight - spacing + window.scrollY; }
        
        top = Math.max(window.scrollY + spacing, Math.min(top, window.innerHeight + window.scrollY - tooltipHeight - spacing));
        left = Math.max(spacing, Math.min(left, window.innerWidth - tooltipWidth - spacing));
    
        tarjetaDetalleInfo.style.position = 'absolute';
        tarjetaDetalleInfo.style.left = `${left}px`;
        tarjetaDetalleInfo.style.top = `${top}px`;
    }

    modeLabelUnidad.classList.add('active-mode-label');
    modeLabelGrupo.classList.remove('active-mode-label');
    actualizarVisibilidadFiltros();
    cargarAnosTabs();
});