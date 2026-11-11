import { datosProductividad } from "./JSONprod.js";
import { estadoVisual, estados, leyendaUmbrales, referenciaVisible } from "./desempeno.js";
import { crearSelectorIndicador } from "./selector-indicador.js";
import { crearVistaDatos, redondearDato } from "./datos-vista.js";
import { brecha, clavePeriodo, dibujarHistorial, fichasMMIM2025, referenciaOperativa, seriePorUnidad, variacion } from "./historial.js";
import { cargarSelector, posicionarTooltip, controlSecuencia, guardarHash, leerHash, periodosDisponibles } from "./ui.js";
import {
  pickManual,
  getActiveIndicators,
  resolveConfig,
  labelDe,
  MONTH_ORDER
} from "./catalogs/manual_resolver.js";

document.addEventListener('DOMContentLoaded', function () {
  if (!window.d3) {
    document.querySelector('#productividadChart [role="status"]').textContent = 'No se pudieron cargar las gráficas. Recarga la página para volver a intentar.';
    return;
  }
  // ===== Selectores del DOM =====
  const yearTabs = document.getElementById('yearTabs');
  const monthTabs = document.getElementById('monthTabs');
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

  // ===== Geometría =====
  const margin = { top: 18, right: 100, bottom: 40, left: 160 };
  let width, height;

  // ===== Estado =====
  let svg, xScale, yScale, historicalTrigger;
  const tooltip = d3.select("#indicatorTooltip");
  const legend = d3.select("#indicatorLegend");
  let selectedYear, selectedMonth;
  let activeView = 'resumen';
  let overviewUnit = null;
  let activeCategory = '';
  const overview = document.getElementById('indicatorOverview');
  const unitFilter = document.getElementById('overviewUnitFilter');
  const unitSelect = document.getElementById('overviewUnit');
  const categorySelect = document.getElementById('overviewCategory');
  const indicatorSequence = document.getElementById('indicatorSequence');
  const resetFilters = document.getElementById('resetIndicatorFilters');
  const viewButtons = [...document.querySelectorAll('#indicatorViews [data-view]')];
  const periods = periodosDisponibles(datosProductividad, MONTH_ORDER);
  const periodKeys = periods.map(({ year, month }) => year + '/' + month);
  const defaultPeriod = periods.at(-1);
  const selector = crearSelectorIndicador(indicatorSequence, chooseIndicator, () => {
    syncIndicators();
    syncReset();
  });
  const syncPeriods = controlSecuencia(document.getElementById('indicatorPeriod'),
    () => periodKeys, () => selectedYear + '/' + selectedMonth, key => {
      [selectedYear, selectedMonth] = key.split('/');
      cerrarGraficoHistorico(false);
      selector.reset();
      cargarAnos();
    });
  const syncIndicators = controlSecuencia(indicatorSequence,
    selector.keys, () => selectedIndicatorClave, chooseIndicator);

  let selectedIndicatorClave = null;     // ← ahora rastreamos por CLAVE, no por idx
  let historyUnit = null;
  let historyPeriod = null;
  let returnView = 'indicador';
  const heatmapPanel = document.getElementById('heatmapPanel');
  let currentHistoricalData = [];

  // ===========================================================================
  // HELPERS DE CATÁLOGO
  // ===========================================================================

  const catalogoActivo = () => selectedYear && selectedMonth ? getActiveIndicators(selectedYear, selectedMonth) : [];
  const indicadoresDeCategoria = () => catalogoActivo().filter(ind => !activeCategory || ind.grupo === activeCategory);
  function getSelectedIndicator() {
    const options = indicadoresDeCategoria();
    const selected = options.find(ind => ind.clave === selectedIndicatorClave) ?? options[0] ?? null;
    selectedIndicatorClave = selected?.clave ?? null;
    return selected;
  }

  function syncReset() {
    const scope = datosProductividad[selectedYear]?.[selectedMonth] || [];
    const defaultUnit = scope.find(row => /delegacional/i.test(row.unidad))?.unidad ?? scope[0]?.unidad;
    const defaultIndicator = catalogoActivo()[0]?.clave;
    resetFilters.hidden = !(selectedYear !== defaultPeriod?.year || selectedMonth !== defaultPeriod?.month ||
      activeCategory || (activeView === 'resumen' && overviewUnit && overviewUnit !== defaultUnit) ||
      (activeView !== 'resumen' && selectedIndicatorClave !== defaultIndicator) || selector.hasQuery());
  }

  const mobileFilters = matchMedia('(max-width: 36rem)');
  const categoryFilter = document.getElementById('indicatorCategoryFilter');
  const filters = document.getElementById('indicatorFilters');
  function orderFilters() {
    const focused = document.activeElement;
    if (mobileFilters.matches && filters.firstElementChild !== indicatorSequence) categoryFilter.before(indicatorSequence);
    if (!mobileFilters.matches && filters.firstElementChild !== categoryFilter) indicatorSequence.before(categoryFilter);
    if (indicatorSequence.contains(focused) && document.activeElement !== focused) focused.focus({ preventScroll: true });
  }
  mobileFilters.addEventListener('change', orderFilters);
  orderFilters();

  // ===========================================================================
  // INIT
  // ===========================================================================

  const vistaDatos = crearVistaDatos(document.getElementById('indicatorDataView'), getData, actualizarGrafico);

  function getData() {
    const indicator = getSelectedIndicator();
    const scope = datosProductividad[selectedYear]?.[selectedMonth] || [];
    const manual = pickManual(selectedYear, selectedMonth);
    const label = indicator ? labelDe(indicator) : 'Indicadores';
    const status = (value, config) => Number.isFinite(value) ? estadoVisual(value, config || {})?.label ?? null : null;
    const valueFor = (value, config) => redondearDato(value, config?.decimales ?? 1);
    if (activeView === 'resumen') {
      const unit = scope.find(row => row.unidad === overviewUnit);
      return {
        title: `Indicadores · ${overviewUnit || 'Unidad'} · ${selectedMonth} ${selectedYear} · MMIM ${manual}`,
        columns: ['Clave', 'Indicador', 'Valor', 'Desempeño', 'Umbral inferior', 'Umbral superior'],
        rows: getActiveIndicators(selectedYear, selectedMonth).filter(ind => !activeCategory || ind.grupo === activeCategory)
          .map(ind => {
            const value = unit?.indicador?.[ind.idx];
            const config = resolveConfig(selectedYear, selectedMonth, ind.idx);
            return [ind.clave, ind.nombre, valueFor(value, config), status(value, config), config?.umbralInferior, config?.umbralSuperior];
          })
      };
    }
    if (activeView === 'historial' || activeView === 'mapa') {
      const units = activeView === 'historial' ? [historyUnit] :
        [...new Set(periods.flatMap(({ year, month }) => datosProductividad[year][month].map(row => row.unidad)))];
      return {
        title: label + ' · ' + (activeView === 'historial' ? 'Historial · ' + historyUnit : 'Mapa de calor'),
        columns: ['Unidad', 'Año', 'Mes', 'MMIM', 'Valor', 'Desempeño', 'Umbral inferior', 'Umbral superior', 'Brecha operativa'],
        rows: units.flatMap(unit => seriePorUnidad(datosProductividad, periods, unit, indicator?.clave, manual)
          .map(point => [unit, Number(point.year), point.month, point.manual, valueFor(point.value, point.config),
            point.otraDefinicion ? 'Otra definición' : status(point.value, point.config),
            point.config?.umbralInferior, point.config?.umbralSuperior, valueFor(brecha(point), point.config)]))
      };
    }
    const config = indicator ? resolveConfig(selectedYear, selectedMonth, indicator.idx) : null;
    return {
      title: `${label} · ${selectedMonth} ${selectedYear} · MMIM ${manual}`,
      columns: ['Unidad', 'Valor', 'Desempeño', 'Umbral inferior', 'Umbral superior'],
      rows: scope.map(row => ({ unit: row.unidad, value: row.indicador?.[indicator?.idx] }))
        .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity))
        .map(({ unit, value }) => [unit, valueFor(value, config), status(value, config), config?.umbralInferior, config?.umbralSuperior])
    };
  }

  function actualizarGrafico() {
    renderGrafico();
    vistaDatos.actualizar();
  }

  function renderGrafico() {
    chartContainer.html('');
    legend.html('');
    tooltip.attr("hidden", "");
    const indicador = getSelectedIndicator();
    indicatorSequence.hidden = activeView === 'resumen';
    unitFilter.hidden = activeView !== 'resumen';
    selector.update(indicadoresDeCategoria(), indicador);
    syncPeriods();
    syncIndicators();
    syncReset();
    guardarHash({ anio: selectedYear, mes: selectedMonth, indicador: activeView !== 'resumen' ? selectedIndicatorClave : null,
      categoria: activeCategory, unidad: overviewUnit, vista: activeView,
      unidadHist: activeView === 'historial' ? historyUnit : null, corteHist: activeView === 'historial' ? historyPeriod : null,
      desde: activeView === 'historial' ? returnView : null });
    for (const button of viewButtons) button.setAttribute('aria-pressed', button.dataset.view === (activeView === "historial" ? returnView : activeView));
    overview.hidden = activeView !== 'resumen';
    productividadChartContainer.property('hidden', activeView !== 'indicador');
    heatmapPanel.hidden = activeView !== 'mapa';
    historicalChartMainContainer.property('hidden', activeView !== 'historial');
    if (activeView === 'mapa') {
      renderHeatmap(indicador);
      return;
    }
    if (activeView === 'historial') {
      renderHistory(indicador);
      return;
    }
    if (activeView === 'resumen') {
      renderOverview();
      return;
    }
    d3.select("#tituloGrafica").text(indicador ? labelDe(indicador) : "Gráficas por indicador");
    if (!selectedYear || !selectedMonth || !indicador) {
      chartContainer.append("p").attr("class", "no-data-message").text("Seleccione año, mes e indicador para ver datos.");
      return;
    }

    const año = selectedYear;
    const mes = selectedMonth;
    const idx = indicador.idx;

    const datosOriginales = datosProductividad[año]?.[mes] || [];
    const datos = datosOriginales
      .map(d => ({
        unidad: d.unidad,
        valor: (d.indicador && d.indicador[idx] !== undefined && d.indicador[idx] !== null) ? d.indicador[idx] : 0
      }))
      .filter(d => d.valor > 0)
      .sort((a, b) => b.valor - a.valor);

    const config = resolveConfig(año, mes, idx) || {};
    dibujarLeyenda(config);
    if (datos.length === 0) {
      chartContainer.append("p").attr("class", "no-data-message").text("No hay datos disponibles para esta selección.");
      return;
    }

    const chartWidth = Math.max(330, chartContainer.node().clientWidth);
    margin.left = chartWidth < 470 ? 98 : chartWidth < 700 ? 126 : 160;
    margin.right = chartWidth < 470 ? 106 : 132;
    width = chartWidth - margin.left - margin.right;
    height = Math.max(150, datos.length * 25);
    svg = chartContainer.append("svg")
      .attr("width", chartWidth).attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${chartWidth} ${height + margin.top + margin.bottom}`)
      .attr("role", "group").attr("aria-labelledby", "tituloGrafica")
      .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    crearEscalas(datos);
    dibujarEjes();
    dibujarBarras(datos, config, indicador);
    dibujarUmbrales(config);
  }

  function dibujarBarras(datos, config, indicador) {
    const decimales = config.decimales ?? 1;
    const abrirHistorico = (event, d) => {
      ocultarTooltip();
      historicalTrigger = event.currentTarget;
      mostrarGraficoHistorico(d.unidad, selectedYear, selectedMonth);
    };
    const bars = svg.selectAll(".indicator-bar").data(datos).join("rect")
      .attr("class", "indicator-bar performance-fill")
      .attr("data-performance", d => estadoVisual(d.valor, config).key ?? null)
      .attr("x", 0).attr("y", d => yScale(d.unidad))
      .attr("height", yScale.bandwidth()).attr("width", d => xScale(Math.max(0, d.valor)))
      .attr("role", "button").attr("tabindex", 0)
      .attr("aria-label", d => {
        const status = estadoVisual(d.valor, config);
        return `Ver histórico de ${d.unidad}. Valor ${d.valor.toFixed(decimales)}. ${status?.label || ""}`;
      })
      .on("pointerenter focus", (event, d) => mostrarTooltip(event, d, indicador, config))
      .on("pointerleave blur", ocultarTooltip)
      .on("click", abrirHistorico)
      .on("keydown", (event, d) => {
        if (event.key === "Escape") ocultarTooltip();
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        abrirHistorico(event, d);
      });
    bars.append("title").text(d => d.unidad);
    svg.selectAll(".indicator-value").data(datos).join("text")
      .attr("class", "indicator-value")
      .attr("x", d => xScale(Math.max(0, d.valor)) + 6)
      .attr("y", d => yScale(d.unidad) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .text(d => {
        const status = estadoVisual(d.valor, config);
        return d.valor.toFixed(decimales) + (status.symbol ? " " + status.symbol : "") + " · " + status.label;
      });
  }

  function crearEscalas(datos) {
    const padding = datos.length > 30 ? 0.05 : datos.length > 20 ? 0.1 : datos.length > 10 ? 0.15 : 0.2;
    yScale = d3.scaleBand().domain(datos.map(d => d.unidad)).range([0, height]).padding(padding);
    xScale = d3.scaleLinear().domain([0, d3.max(datos, d => d.valor) * 1.1 || 10]).range([0, width]).nice();
  }

  function dibujarEjes() {
    svg.selectAll(".x-axis, .y-axis").remove();
    svg.append("g").attr("class", "x-axis axis").attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(Math.min(10, Math.floor(width / 80))).tickSizeOuter(0))
      .selectAll("text").attr("class", "unit-axis-label");
    svg.append("g").attr("class", "y-axis axis").call(d3.axisLeft(yScale).tickSize(0).tickPadding(10))
      .selectAll("text")
      .attr("class", "unit-axis-label")
      .call(truncarTexto, margin.left - 25);
  }

  function truncarTexto(selection, maxWidth) {
    selection.each(function () {
      const text = d3.select(this); let content = text.text();
      if (text.node().getComputedTextLength() <= maxWidth) return;
      text.text(content + '...');
      while (text.node().getComputedTextLength() > maxWidth && content.length > 1) {
        content = content.slice(0, -1); text.text(content + '...');
      }
      if (content.length <= 1 && text.node().getComputedTextLength() > maxWidth) {
        text.text(content[0] + '...');
      }
    });
  }

  function dibujarUmbrales(config) {
    const thresholds = [
      [config.umbralSuperior, config.colorSuperior || "#e74c3c", "4 3"],
      [config.umbralInferior, config.colorInferior || "#f39c12", "5 5"]
    ];
    for (const [value, color, dash] of thresholds) {
      if (value == null || value < 0 || value > xScale.domain()[1]) continue;
      svg.append("line").attr("class", "indicator-threshold")
        .attr("x1", xScale(value)).attr("x2", xScale(value))
        .attr("y1", 0).attr("y2", height)
        .attr("stroke", color).attr("stroke-width", 1.5).attr("stroke-dasharray", dash);
    }
  }

  function dibujarLeyenda(config) {
    for (const state of leyendaUmbrales(config)) {
      const item = legend.append("li");
      mostrarEstado(item, state);
      item.append("span").text("(" + state.limits + ")");
    }
    if (config.umbralInferior != null && config.umbralSuperior != null) {
      legend.append("li").attr("class", "threshold-summary")
        .text(`Umbral inferior ${config.umbralInferior} · Umbral superior ${config.umbralSuperior}`);
    }
  }

  function mostrarTooltip(event, d, indicador, config) {
    const status = estadoVisual(d.valor, config);
    tooltip.html('').attr("hidden", null);
    tooltip.append("strong").text(d.unidad);
    tooltip.append("div").text(labelDe(indicador));
    tooltip.append("div").text(`Valor ${d.valor.toFixed(config.decimales ?? 1)}${status ? " · " + status.label : ""}`);
    posicionarTooltip(tooltip.node(), event);
  }

  function ocultarTooltip() {
    tooltip.attr("hidden", "");
  }

  // ===== Filtros y catálogo =====
  yearTabs.addEventListener("change", () => {
    selectedYear = yearTabs.value;
    selectedMonth = null;
    cerrarGraficoHistorico(false);
    selector.reset();
    cargarMeses();
  });
  monthTabs.addEventListener("change", () => {
    selectedMonth = monthTabs.value;
    cerrarGraficoHistorico(false);
    selector.reset();
    cargarIndicadores();
  });
  function chooseIndicator(key, view = activeView === 'mapa' ? 'mapa' : activeView === 'historial' ? returnView : 'indicador') {
    selectedIndicatorClave = key;
    selector.reset();
    cerrarGraficoHistorico(false);
    activeView = view;
    actualizarGrafico();
  }

  unitSelect.addEventListener('change', () => {
    overviewUnit = unitSelect.value;
    actualizarGrafico();
  });
  categorySelect.addEventListener('change', () => {
    activeCategory = categorySelect.value;
    selector.reset();
    cerrarGraficoHistorico(false);
    actualizarGrafico();
  });
  for (const button of viewButtons) button.addEventListener('click', () => {
    cerrarGraficoHistorico(false);
    activeView = button.dataset.view;
    selector.reset();
    actualizarGrafico();
  });

  resetFilters.addEventListener('click', () => {
    selectedYear = defaultPeriod?.year;
    selectedMonth = defaultPeriod?.month;
    selectedIndicatorClave = null;
    overviewUnit = null;
    activeCategory = '';
    selector.reset();
    cerrarGraficoHistorico(false);
    cargarAnos();
    yearTabs.focus();
  });

  function renderOverview() {
    const indicators = getActiveIndicators(selectedYear, selectedMonth);
    const available = datosProductividad[selectedYear]?.[selectedMonth] || [];
    const units = available.map(row => row.unidad);
    if (!units.includes(overviewUnit)) {
      overviewUnit = units.find(unit => /delegacional/i.test(unit)) || units[0] || null;
    }
    cargarSelector(unitSelect, units, overviewUnit);
    guardarHash({ unidad: overviewUnit });
    syncReset();
    const unit = available.find(row => row.unidad === overviewUnit);
    const manual = pickManual(selectedYear, selectedMonth);
    document.getElementById('overviewPeriod').textContent = selectedMonth ? selectedMonth + ' ' + selectedYear : 'Sin periodo';
    const table = d3.select('#overviewTable').html('').append('table').attr('class', 'data-table overview-table');
    const headings = ['Indicador', 'Valor', 'Valor de referencia', 'Metodología', 'Desempeño'];
    table.append('thead').append('tr').selectAll('th').data(headings).join('th').attr('scope', 'col').text(d => d);
    const results = indicators.filter(ind => !activeCategory || ind.grupo === activeCategory).map(indicator => {
      const config = resolveConfig(selectedYear, selectedMonth, indicator.idx);
      const value = unit?.indicador?.[indicator.idx];
      return { indicator, config, value, state: estadoVisual(value, config) };
    });
    const rows = table.append('tbody').selectAll('tr').data(results).join('tr');
    rows.append('th').attr('scope', 'row').append('button').attr('type', 'button').attr('class', 'text-button')
      .text(d => labelDe(d.indicator)).on('click', (_, d) => {
        chooseIndicator(d.indicator.clave, 'indicador');
        document.getElementById('tituloGrafica').focus();
      });
    rows.append('td').attr('class', 'numeric').text(({ value, config }) =>
      Number.isFinite(value) ? value.toFixed(config?.decimales ?? 1) : '–');
    const references = rows.append('td').attr('class', 'overview-reference');
    references.append('span').text(({ config }) => referenciaVisible(config));
    references.filter(({ indicator }) => manual === '2025' && fichasMMIM2025[indicator.clave])
      .append('small').text(({ indicator }) => 'Meta MMIM ' + fichasMMIM2025[indicator.clave].meta);
    rows.append('td').attr('class', 'overview-pending').text('Pendiente');
    rows.append('td').attr('class', 'overview-performance').each(function ({ state }) {
      mostrarEstado(d3.select(this), state);
    });
  }

  function mostrarEstado(container, state) {
    const badge = container.append('span').attr('class', 'performance-badge').attr('data-performance', state.key ?? null);
    badge.append('span').attr('class', 'performance-mark').attr('aria-hidden', 'true');
    if (state.symbol) {
      badge.append('span').attr('aria-hidden', 'true').text(state.symbol);
      badge.append('span').attr('class', 'visually-hidden').text(state.direction + ' · ');
    }
    badge.append('span').text(state.label);
  }

  function cargarAnos() {
    const years = Object.keys(datosProductividad).sort((a, b) => parseInt(b) - parseInt(a));
    if (!years.includes(selectedYear) && years.length > 0) selectedYear = years[0];
    cargarSelector(yearTabs, years, selectedYear);
    cargarMeses();
  }

  function cargarMeses() {
    const months = Object.keys(datosProductividad[selectedYear] || {})
      .sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
    if (!selectedMonth || !months.includes(selectedMonth)) {
      selectedMonth = months[months.length - 1] ?? null;
    }
    cargarSelector(monthTabs, months, selectedMonth);
    cargarIndicadores();
  }

  function cargarIndicadores() {
    const activos = selectedYear && selectedMonth ? getActiveIndicators(selectedYear, selectedMonth) : [];
    const versionLabel = selectedMonth ? pickManual(selectedYear, selectedMonth) : null;
    d3.select("#manualLabel").text(versionLabel
      ? `MMIM ${versionLabel} · ${activos.length} indicador${activos.length !== 1 ? 'es' : ''}`
      : "");
    const groups = [...new Set(activos.map(ind => ind.grupo).filter(Boolean))];
    if (!groups.includes(activeCategory)) activeCategory = '';
    cargarSelector(categorySelect, [{ value: '', label: 'Todas las categorías' }, ...groups], activeCategory);
    categorySelect.disabled = !groups.length;
    document.getElementById('indicatorCategoryHelp').hidden = groups.length > 0;
    actualizarGrafico();
  }

  function renderHeatmap(indicator) {
    const tableRoot = d3.select('#heatmapTable').html('');
    if (!indicator) return;
    const manual = pickManual(selectedYear, selectedMonth);
    document.getElementById('heatmapCode').textContent = indicator.clave;
    document.getElementById('heatmapName').textContent = indicator.nombre;
    const legend = d3.select('#heatmapLegend').html('');
    for (const [key, label] of Object.entries(estados)) {
      mostrarEstado(legend.append('li'), { key, label: key === 'sinDato' ? label + ' (–)' : label });
    }
    legend.append('li').text('▲ Por encima de la referencia · ▼ Por debajo · = Igual · ● Dentro del intervalo');
    legend.append('li').text('N/C Otra definición');
    const units = [...new Set(periods.flatMap(({ year, month }) => datosProductividad[year][month].map(row => row.unidad)))];
    const table = tableRoot.append('table').attr('class', 'data-table heatmap');
    const head = table.append('thead').append('tr');
    head.append('th').attr('scope', 'col').text('Unidad');
    const columns = head.selectAll('.heatmap-month').data(periods).join('th').attr('scope', 'col').attr('class', 'heatmap-month');
    columns.text(d => d.month.slice(0, 3) + ' ' + d.year.slice(-2));
    columns.filter((d, i) => i === 0 || d.month === 'Enero' || pickManual(d.year, d.month) !== pickManual(periods[i - 1].year, periods[i - 1].month))
      .classed('manual-boundary', true).append('small').text(d => 'MMIM ' + pickManual(d.year, d.month));
    const rows = table.append('tbody').selectAll('tr').data(units).join('tr')
      .classed('heatmap-delegation', unit => /^delegaci[oó]n(?:al)?$/i.test(unit));
    const open = (event, unit, year, month) => {
      historicalTrigger = event.currentTarget;
      mostrarGraficoHistorico(unit, year, month);
    };
    rows.append('th').attr('scope', 'row').append('button').attr('type', 'button').attr('class', 'text-button heatmap-unit')
      .text(d => d).on('click', (event, unit) => open(event, unit, selectedYear, selectedMonth));
    rows.selectAll('td').data(unit => seriePorUnidad(datosProductividad, periods, unit, indicator.clave, manual)
      .map(point => ({ ...point, unit }))).join('td').each(function (point, index) {
      const cell = d3.select(this);
      if (index > 0 && point.manual !== pickManual(periods[index - 1].year, periods[index - 1].month)) cell.classed('manual-boundary', true);
      const periodLabel = point.unit + ', ' + point.month.toLocaleLowerCase('es-MX') + ' ' + point.year + ': ';
      if (point.value == null) {
        const reason = point.otraDefinicion ? 'Otra definición del indicador' : 'Sin dato';
        cell.attr('aria-label', periodLabel + reason).attr('data-performance', 'sinDato');
        cell.append('span').attr('class', 'heatmap-empty').attr('title', reason)
          .text(point.otraDefinicion ? 'N/C' : '–');
        return;
      }
      const state = estadoVisual(point.value, point.config);
      const value = point.value.toFixed(point.config?.decimales ?? 1);
      const description = [periodLabel + value, state.direction, state.label].filter(Boolean).join(', ');
      cell.attr('aria-label', description);
      const button = cell.append('button').attr('type', 'button').attr('class', 'heatmap-cell')
        .attr('data-performance', state.key ?? null)
        .attr('aria-label', description)
        .on('click', event => open(event, point.unit, point.year, point.month));
      button.append('span').attr('class', 'heatmap-cell-value').text([value, state.symbol].filter(Boolean).join(' '));
      button.append('small').text(state.label);
    });
  }

  function mostrarGraficoHistorico(unitName, year, month) {
    if (!getSelectedIndicator()) return;
    returnView = activeView === 'mapa' ? 'mapa' : 'indicador';
    historyUnit = unitName;
    historyPeriod = clavePeriodo({ year, month });
    activeView = 'historial';
    actualizarGrafico();
    historicalChartTitle.node().focus();
  }

  function renderHistory(indicator) {
    if (!indicator || !historyUnit) return;
    const manual = pickManual(selectedYear, selectedMonth);
    currentHistoricalData = seriePorUnidad(datosProductividad, periods, historyUnit, indicator.clave, manual);
    const index = currentHistoricalData.findIndex(point => point.key === historyPeriod);
    const slider = timeSlider.node();
    slider.max = Math.max(0, currentHistoricalData.length - 1);
    closeHistoricalChartButton.text(returnView === 'mapa' ? 'Volver al mapa de calor' : 'Volver a gráficas por indicador');
    historicalChartTitle.text(`${labelDe(indicator)} · ${historyUnit}`);
    actualizarPuntoDeslizanteYBotones(index < 0 ? currentHistoricalData.length - 1 : index);
  }

  function actualizarPuntoDeslizanteYBotones(index) {
    const point = currentHistoricalData[index];
    if (!point) return;
    timeSlider.node().value = index;
    prevButton.property('disabled', index === 0);
    nextButton.property('disabled', index >= currentHistoricalData.length - 1);
    historyPeriod = point.key;
    guardarHash({ corteHist: point.key });
    const digits = point.config?.decimales ?? 1;
    const state = point.value == null ? null : estadoVisual(point.value, point.config || {});
    const value = point.value?.toFixed(digits) ?? (point.otraDefinicion ? 'Otra definición' : 'Sin información');
    sliderValueLabel.text(`${point.label} · ${value}${state ? ' · ' + state.label : ''}`);
    const selected = getSelectedIndicator();
    const official = point.manual === '2025' && !point.otraDefinicion ? fichasMMIM2025[selected.clave] : null;
    const limits = referenciaOperativa(point.config);
    const operational = limits.length ? limits.join(' a ') : 'Sin referencia';
    d3.select('#historicalReference').text(`MMIM ${point.manual} · Referencia operativa ${operational}${official ? ' · Meta oficial ' + official.meta + ' · ' + official.periodicidad : ''}`);
    const signed = delta => delta == null ? 'No comparable' : (delta > 0 ? '+' : '') + delta.toFixed(digits);
    const difference = brecha(point);
    const chips = [
      ['Vs. mes anterior', signed(variacion(point, currentHistoricalData, 1))],
      ['Vs. mismo mes del año anterior', signed(variacion(point, currentHistoricalData, 12))],
      ['Brecha operativa', difference == null ? 'Sin referencia comparable' : signed(difference)]
    ];
    const items = d3.select('#historyChips').html('').selectAll('div').data(chips).join('div');
    items.append('dt').text(d => d[0]);
    items.append('dd').text(d => d[1]);
    dibujarHistorial(historicalChartDiv.node(), currentHistoricalData, point);
  }

  function cerrarGraficoHistorico(restoreFocus) {
    if (activeView !== 'historial') return;
    activeView = returnView;
    historyUnit = null;
    historyPeriod = null;
    if (restoreFocus) {
      const trigger = historicalTrigger?.__data__;
      actualizarGrafico();
      const candidates = activeView === 'mapa' ? document.querySelectorAll('#heatmapTable button') :
        document.querySelectorAll('#productividadChart .indicator-bar');
      const target = [...candidates].find(element => {
        const datum = element.__data__;
        if (trigger?.key) return datum?.unit === trigger.unit && datum?.key === trigger.key;
        return (datum?.unidad ?? datum) === (trigger?.unidad ?? trigger);
      });
      (target || (activeView === 'mapa' ? document.getElementById('heatmapTable') : chartContainer.node())).focus();
    }
  }

  timeSlider.on('input', function () { actualizarPuntoDeslizanteYBotones(+this.value); });
  closeHistoricalChartButton.on('click', () => cerrarGraficoHistorico(true));
  prevButton.on('click', () => actualizarPuntoDeslizanteYBotones(+timeSlider.node().value - 1));
  nextButton.on('click', () => actualizarPuntoDeslizanteYBotones(+timeSlider.node().value + 1));

  function restaurarHash() {
    const params = leerHash();
    selectedYear = params.get('anio');
    selectedMonth = params.get('mes');
    selectedIndicatorClave = params.get('indicador');
    overviewUnit = params.get('unidad');
    activeCategory = params.get('categoria') || '';
    const requested = params.get('vista');
    historyUnit = params.get('unidadHist');
    historyPeriod = params.get('corteHist');
    returnView = params.get('desde') === 'mapa' ? 'mapa' : 'indicador';
    selector.reset();
    activeView = requested === 'historial' && historyUnit ? 'historial' : requested === 'mapa' ? 'mapa' :
      requested === 'indicador' || selectedIndicatorClave ? 'indicador' : 'resumen';
    cargarAnos();
  }

  window.addEventListener('hashchange', () => {
    if (location.hash !== '#contenido') restaurarHash();
  });
  restaurarHash();
  let lastPageWidth = document.documentElement.clientWidth;
  window.addEventListener("resize", () => {
    const pageWidth = document.documentElement.clientWidth;
    if (pageWidth === lastPageWidth) return;
    lastPageWidth = pageWidth;
    if (activeView === 'historial') actualizarPuntoDeslizanteYBotones(+timeSlider.node().value);
    else if (activeView === 'indicador') actualizarGrafico();
  });
});
