const LANG_COLORS = {
  Arabic: "#c45c26",
  Chinese: "#e74c3c",
  Dutch: "#f39c12",
  English: "#95a5a6",
  French: "#3498db",
  German: "#9b59b6",
  Greek: "#1abc9c",
  Hindi: "#e67e22",
  Hungarian: "#d35400",
  Italian: "#2ecc71",
  Japanese: "#ff6b9d",
  Korean: "#c0392b",
  Persian: "#8e44ad",
  Polish: "#7f8c8d",
  Russian: "#34495e",
  Spanish: "#f1c40f",
  Thai: "#16a085",
  Turkish: "#d4a017",
  Vietnamese: "#27ae60",
  Nahuatl: "#e84393",
  Other: "#bdc3c7"
};

const DECADE_START = 1550;
const DECADE_END = 2000;
const DECADE_STEP = 10;
const GLOBAL_YEAR_MIN = 1550;
const GLOBAL_YEAR_MAX = 2000;

let wordsData = [];
let globalYearMin = GLOBAL_YEAR_MIN;
let globalYearMax = GLOBAL_YEAR_MAX;

let streamChart = null;
let bubbleChart = null;
let barChart = null;
let treemapChart = null;
let sankeyChart = null;
let forceChart = null;
let timelineListeners = [];

async function loadWords() {
  if (typeof WORDS_DATA !== "undefined" && Array.isArray(WORDS_DATA)) {
    return WORDS_DATA;
  }
  try {
    const response = await fetch("data/words.json");
    if (response.ok) return response.json();
  } catch (_) {
    /* file:// 下 fetch 可能失败，依赖 words.js */
  }
  throw new Error("词汇数据未加载：请确认 data/words.js 存在且无语法错误");
}

function showBootError(message) {
  let el = document.getElementById("boot-error");
  if (!el) {
    el = document.createElement("div");
    el.id = "boot-error";
    el.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:9999;padding:12px 20px;background:#8b2635;color:#fff;font-size:14px;text-align:center;";
    document.body.prepend(el);
  }
  el.textContent = "⚠ " + message;
}

function getActiveWords() {
  return wordsData.filter(
    (w) => w.first_year >= globalYearMin && w.first_year <= globalYearMax
  );
}

function getLangColor(lang) {
  return LANG_COLORS[lang] || "#aaaaaa";
}

function getSortedLanguages(words = getActiveWords()) {
  const counts = {};
  words.forEach((item) => {
    counts[item.source_lang] = (counts[item.source_lang] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);
}

function buildDecades() {
  const decades = [];
  for (let year = DECADE_START; year <= DECADE_END; year += DECADE_STEP) {
    decades.push(year);
  }
  return decades;
}

function buildStreamSeries(words) {
  const decades = buildDecades();
  const languages = getSortedLanguages(words);

  return languages.map((lang, index) => {
    const series = {
      name: lang,
      type: "line",
      stack: "total",
      smooth: 0.35,
      areaStyle: { opacity: 0.85 },
      emphasis: { focus: "series" },
      lineStyle: { width: 0 },
      itemStyle: { color: getLangColor(lang) },
      data: decades.map((decade) =>
        words.filter(
          (w) =>
            w.source_lang === lang &&
            w.first_year >= decade &&
            w.first_year < decade + DECADE_STEP
        ).length
      )
    };

    if (index === 0) {
      series.markArea = {
        silent: true,
        itemStyle: {
          color: "rgba(232, 168, 56, 0.12)",
          borderColor: "rgba(232,168,56,0.4)",
          borderWidth: 1
        },
        data: [[
          { xAxis: Math.floor(globalYearMin / 10) * 10 },
          { xAxis: Math.ceil(globalYearMax / 10) * 10 }
        ]]
      };
    }

    return series;
  });
}

function getEraLabel(year) {
  if (year < 1700) return "近代早期(≤1699)";
  if (year < 1850) return "开埠扩张期(1700-1849)";
  if (year < 1950) return "现代餐饮期(1850-1949)";
  return "全球化浪潮(≥1950)";
}

function renderStats() {
  const words = getActiveWords();
  const langs = new Set(words.map((w) => w.source_lang));
  const avgYear = words.length
    ? Math.round(words.reduce((sum, w) => sum + w.first_year, 0) / words.length)
    : "—";
  const topWord = words.length
    ? [...words].sort((a, b) => b.popularity - a.popularity)[0].word
    : "—";

  document.getElementById("stat-words").textContent = words.length;
  document.getElementById("stat-langs").textContent = langs.size || "—";
  document.getElementById("stat-avg-year").textContent = avgYear;
  document.getElementById("stat-top").textContent = topWord;
}

function renderStreamChart() {
  const el = document.getElementById("stream-chart");
  if (!streamChart) streamChart = echarts.init(el, null, { renderer: "canvas" });
  window._streamChart = streamChart;

  const words = getActiveWords();
  const decades = buildDecades();

  streamChart.setOption(
    {
      backgroundColor: "transparent",
      animationDuration: 600,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line" },
        formatter(params) {
          if (!params.length) return "";
          const decade = params[0].axisValue;
          let html = `<strong>${decade}–${decade + DECADE_STEP - 1}</strong><br/>`;
          [...params]
            .sort((a, b) => b.value - a.value)
            .forEach((p) => {
              if (p.value > 0) {
                html += `<span style="color:${p.color}">●</span> ${p.seriesName}: ${p.value} 词<br/>`;
              }
            });
          return html;
        }
      },
      legend: {
        type: "scroll",
        bottom: 0,
        textStyle: { color: "#8b98a8", fontSize: 11 },
        pageTextStyle: { color: "#8b98a8" }
      },
      grid: { left: 48, right: 24, top: 24, bottom: 72 },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: decades,
        name: "年代",
        nameTextStyle: { color: "#8b98a8" },
        axisLine: { lineStyle: { color: "#333" } },
        axisLabel: { color: "#8b98a8", formatter: (v) => `${v}s` }
      },
      yAxis: {
        type: "value",
        name: "新借入词数量",
        nameTextStyle: { color: "#8b98a8" },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
        axisLabel: { color: "#8b98a8" }
      },
      series: buildStreamSeries(words)
    },
    true
  );
}

function getBubbleFilteredWords() {
  const langFilter = document.getElementById("lang-filter").value;
  return getActiveWords().filter((w) => langFilter === "all" || w.source_lang === langFilter);
}

function renderBubbleChart() {
  const el = document.getElementById("bubble-chart");
  if (!bubbleChart) bubbleChart = echarts.init(el, null, { renderer: "canvas" });
  window._bubbleChart = bubbleChart;

  const filtered = getBubbleFilteredWords();
  const languages = getSortedLanguages(filtered);

  const series = languages
    .map((lang) => {
      const items = filtered.filter((w) => w.source_lang === lang);
      if (!items.length) return null;
      return {
        name: lang,
        type: "scatter",
        symbolSize(value) {
          return Math.max(8, value[2] / 3.5);
        },
        itemStyle: {
          color: getLangColor(lang),
          opacity: 0.78,
          shadowBlur: 8,
          shadowColor: "rgba(0,0,0,0.3)"
        },
        emphasis: { scale: 1.3, itemStyle: { opacity: 1 } },
        data: items.map((w) => [w.first_year, w.popularity, w.popularity, w.word, w.category])
      };
    })
    .filter(Boolean);

  bubbleChart.setOption(
    {
      backgroundColor: "transparent",
      animationDuration: 600,
      tooltip: {
        trigger: "item",
        formatter(params) {
          const [year, pop, , word, cat] = params.data;
          return `<strong>${word}</strong><br/>
            源语言：${params.seriesName}<br/>
            进入英语：${year} 年<br/>
            流行度：${pop}<br/>
            类别：${cat}`;
        }
      },
      legend: {
        type: "scroll",
        bottom: 0,
        textStyle: { color: "#8b98a8", fontSize: 11 }
      },
      grid: { left: 56, right: 24, top: 24, bottom: 72 },
      xAxis: {
        type: "value",
        name: "首次进入英语年份",
        min: GLOBAL_YEAR_MIN,
        max: GLOBAL_YEAR_MAX,
        nameTextStyle: { color: "#8b98a8" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
        axisLabel: { color: "#8b98a8" }
      },
      yAxis: {
        type: "value",
        name: "流行度指数",
        min: 20,
        max: 100,
        nameTextStyle: { color: "#8b98a8" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
        axisLabel: { color: "#8b98a8" }
      },
      series
    },
    true
  );

  bubbleChart.off("click");
  bubbleChart.on("click", (params) => {
    if (params.componentType !== "series") return;
    const [year, pop, , word, cat] = params.data;
    const panel = document.getElementById("word-detail");
    panel.classList.remove("empty");
    panel.innerHTML = `
      <strong>${word}</strong>（${params.seriesName}）—
      约 ${year} 年进入英语 · 流行度 ${pop} · ${cat}。
      点击气泡已打开词源翻转卡片 ↗
    `;
    if (typeof showWordFlipCard === "function") {
      showWordFlipCard(word, params.seriesName, year, pop, cat);
    }
  });
}

function renderBarChart() {
  const el = document.getElementById("bar-chart");
  if (!barChart) barChart = echarts.init(el, null, { renderer: "canvas" });
  window._barChart = barChart;

  const words = getActiveWords();
  const langStats = {};
  words.forEach((w) => {
    if (!langStats[w.source_lang]) langStats[w.source_lang] = { count: 0, totalPop: 0 };
    langStats[w.source_lang].count += 1;
    langStats[w.source_lang].totalPop += w.popularity;
  });

  const sorted = Object.entries(langStats)
    .map(([lang, s]) => ({
      lang,
      count: s.count,
      avgPop: Math.round(s.totalPop / s.count)
    }))
    .sort((a, b) => b.count - a.count);

  barChart.setOption(
    {
      backgroundColor: "transparent",
      animationDuration: 600,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter(params) {
          const item = sorted[params[0].dataIndex];
          return `<strong>${item.lang}</strong><br/>词汇量：${item.count}<br/>平均流行度：${item.avgPop}`;
        }
      },
      grid: { left: 100, right: 24, top: 16, bottom: 32 },
      xAxis: {
        type: "value",
        name: "词汇数量",
        nameTextStyle: { color: "#8b98a8" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
        axisLabel: { color: "#8b98a8" }
      },
      yAxis: {
        type: "category",
        data: sorted.map((s) => s.lang),
        axisLabel: { color: "#8b98a8" },
        axisLine: { lineStyle: { color: "#333" } }
      },
      series: [
        {
          type: "bar",
          data: sorted.map((s) => ({
            value: s.count,
            itemStyle: { color: getLangColor(s.lang) }
          })),
          barWidth: 14,
          label: { show: true, position: "right", color: "#8b98a8", fontSize: 11 }
        }
      ]
    },
    true
  );
}

function buildTreemapData(words) {
  const byLang = {};
  words.forEach((w) => {
    if (!byLang[w.source_lang]) byLang[w.source_lang] = {};
    if (!byLang[w.source_lang][w.category]) byLang[w.source_lang][w.category] = [];
    byLang[w.source_lang][w.category].push(w);
  });

  return Object.entries(byLang)
    .map(([lang, categories]) => ({
      lang,
      categories,
      total: Object.values(categories).flat().length
    }))
    .sort((a, b) => b.total - a.total)
    .map(({ lang, categories }) => ({
      name: lang,
      itemStyle: { color: getLangColor(lang), borderColor: "#0f1419", borderWidth: 2 },
      children: Object.entries(categories)
        .sort((a, b) => b[1].length - a[1].length)
        .map(([cat, items]) => ({
          name: cat,
          itemStyle: { borderColor: "#0f1419", borderWidth: 1, gapWidth: 1 },
          children: items
            .sort((a, b) => b.popularity - a.popularity)
            .map((w) => ({
              name: w.word,
              value: w.popularity,
              itemStyle: { color: getLangColor(lang), opacity: 0.85 }
            }))
        }))
    }));
}

function renderTreemapChart() {
  const el = document.getElementById("treemap-chart");
  if (!treemapChart) treemapChart = echarts.init(el, null, { renderer: "canvas" });
  window._treemapChart = treemapChart;

  treemapChart.setOption(
    {
      backgroundColor: "transparent",
      animationDuration: 600,
      tooltip: {
        formatter(info) {
          const path = info.treePathInfo.map((n) => n.name).filter(Boolean).join(" → ");
          return `<strong>${path}</strong><br/>流行度：${info.value ?? "—"}`;
        }
      },
      series: [
        {
          type: "treemap",
          roam: false,
          nodeClick: "zoomToNode",
          breadcrumb: {
            itemStyle: { color: "#8b98a8", borderColor: "#333" },
            textStyle: { color: "#e8edf4" }
          },
          upperLabel: { show: true, height: 22, color: "#fff", fontSize: 11 },
          label: { show: true, formatter: "{b}", fontSize: 10, color: "#fff" },
          itemStyle: { borderColor: "#0f1419", gapWidth: 2 },
          levels: [
            { itemStyle: { borderWidth: 3, gapWidth: 3 } },
            { colorSaturation: [0.35, 0.65], itemStyle: { gapWidth: 2 } },
            { colorSaturation: [0.25, 0.5], label: { fontSize: 9 } }
          ],
          data: buildTreemapData(getActiveWords())
        }
      ]
    },
    true
  );
}

function buildSankeyData(words) {
  const eraLang = {};
  const langCat = {};

  words.forEach((w) => {
    const era = getEraLabel(w.first_year);
    eraLang[`${era}|${w.source_lang}`] = (eraLang[`${era}|${w.source_lang}`] || 0) + 1;
    langCat[`${w.source_lang}|${w.category}`] = (langCat[`${w.source_lang}|${w.category}`] || 0) + 1;
  });

  const links = [];
  Object.entries(eraLang).forEach(([key, value]) => {
    const [era, lang] = key.split("|");
    links.push({ source: era, target: lang, value });
  });
  Object.entries(langCat).forEach(([key, value]) => {
    const [lang, cat] = key.split("|");
    links.push({ source: lang, target: cat, value });
  });

  const nodeSet = new Set();
  links.forEach((l) => {
    nodeSet.add(l.source);
    nodeSet.add(l.target);
  });

  const nodes = [...nodeSet].map((name) => {
    const isEra = name.includes("期") || name.includes("浪潮") || name.includes("早期");
    const isLang = getSortedLanguages(words).includes(name);
    let itemStyle = { color: "#555" };
    if (isEra) itemStyle = { color: "#e8a838" };
    else if (isLang) itemStyle = { color: getLangColor(name) };
    else itemStyle = { color: "#3498db" };
    return { name, itemStyle };
  });

  return { nodes, links };
}

function renderSankeyChart() {
  const el = document.getElementById("sankey-chart");
  if (!sankeyChart) sankeyChart = echarts.init(el, null, { renderer: "canvas" });
  window._sankeyChart = sankeyChart;
  const { nodes, links } = buildSankeyData(getActiveWords());

  sankeyChart.setOption(
    {
      backgroundColor: "transparent",
      animationDuration: 600,
      tooltip: {
        trigger: "item",
        triggerOn: "mousemove",
        formatter(params) {
          if (params.dataType === "edge") {
            return `${params.data.source} → ${params.data.target}<br/>借词数：${params.data.value}`;
          }
          return params.name;
        }
      },
      series: [
        {
          type: "sankey",
          layout: "none",
          emphasis: { focus: "adjacency" },
          nodeAlign: "justify",
          nodeGap: 12,
          draggable: true,
          lineStyle: { color: "gradient", curveness: 0.5, opacity: 0.35 },
          label: { color: "#e8edf4", fontSize: 10 },
          data: nodes,
          links
        }
      ]
    },
    true
  );
}

function buildForceGraphData(words) {
  const langNodes = getSortedLanguages(words).map((lang) => ({
    id: lang,
    name: lang,
    category: 0,
    symbolSize: Math.max(28, words.filter((w) => w.source_lang === lang).length * 4),
    itemStyle: { color: getLangColor(lang) },
    label: { show: true, fontSize: 11, color: "#fff" }
  }));

  const categories = [...new Set(words.map((w) => w.category))].sort();
  const catNodes = categories.map((cat) => {
    const count = words.filter((w) => w.category === cat).length;
    return {
      id: cat,
      name: cat,
      category: 1,
      symbolSize: Math.max(18, count * 3),
      itemStyle: { color: "#3498db", borderColor: "#1abc9c", borderWidth: 1 },
      label: { show: true, fontSize: 9, color: "#e8edf4" }
    };
  });

  const pairCount = {};
  words.forEach((w) => {
    const key = `${w.source_lang}→${w.category}`;
    pairCount[key] = (pairCount[key] || 0) + 1;
  });

  const links = Object.entries(pairCount).map(([key, value]) => {
    const [source, target] = key.split("→");
    return {
      source,
      target,
      value,
      lineStyle: { width: Math.max(1, value * 0.8), opacity: 0.55, curveness: 0.15 }
    };
  });

  return {
    nodes: [...langNodes, ...catNodes],
    links,
    categories: [{ name: "源语言" }, { name: "饮食类别" }]
  };
}

function renderForceChart() {
  const el = document.getElementById("force-chart");
  if (!forceChart) forceChart = echarts.init(el, null, { renderer: "canvas" });
  window._forceChart = forceChart;
  const graph = buildForceGraphData(getActiveWords());

  forceChart.setOption(
    {
      backgroundColor: "transparent",
      animationDuration: 600,
      tooltip: {
        formatter(params) {
          if (params.dataType === "edge") {
            return `${params.data.source} ↔ ${params.data.target}<br/>共现词数：${params.data.value}`;
          }
          return `<strong>${params.data.name}</strong><br/>类型：${graph.categories[params.data.category].name}`;
        }
      },
      legend: {
        data: graph.categories.map((c) => c.name),
        bottom: 0,
        textStyle: { color: "#8b98a8" }
      },
      series: [
        {
          type: "graph",
          layout: "force",
          roam: true,
          draggable: true,
          categories: graph.categories,
          data: graph.nodes,
          links: graph.links,
          force: { repulsion: 220, edgeLength: [60, 140], gravity: 0.08, friction: 0.6 },
          emphasis: { focus: "adjacency", lineStyle: { width: 4, opacity: 0.9 } },
          lineStyle: { color: "source", curveness: 0.2 },
          edgeLabel: {
            show: true,
            formatter(params) {
              return params.data.value > 2 ? params.data.value : "";
            },
            fontSize: 9,
            color: "#8b98a8"
          }
        }
      ]
    },
    true
  );
}

function updateAllCharts() {
  renderStats();
  renderStreamChart();
  renderBubbleChart();
  renderBarChart();
  renderTreemapChart();
  renderSankeyChart();
  renderForceChart();
  updateTimelineUI();
  timelineListeners.forEach((fn) => fn());
}

function updateTimelineUI() {
  const minEl = document.getElementById("global-year-min");
  const maxEl = document.getElementById("global-year-max");
  const label = document.getElementById("timeline-label");
  const count = document.getElementById("timeline-count");
  const era = document.getElementById("timeline-era");

  if (minEl) minEl.value = globalYearMin;
  if (maxEl) maxEl.value = globalYearMax;
  if (label) label.textContent = `${globalYearMin} — ${globalYearMax}`;
  if (count) count.textContent = getActiveWords().length;
  if (era) {
    const mid = Math.round((globalYearMin + globalYearMax) / 2);
    era.textContent = getEraLabel(mid);
  }

  const fill = document.getElementById("timeline-fill");
  if (fill) {
    const range = GLOBAL_YEAR_MAX - GLOBAL_YEAR_MIN;
    const left = ((globalYearMin - GLOBAL_YEAR_MIN) / range) * 100;
    const width = ((globalYearMax - globalYearMin) / range) * 100;
    fill.style.left = `${left}%`;
    fill.style.width = `${width}%`;
  }
}

function applyTimeline(min, max) {
  globalYearMin = Math.max(GLOBAL_YEAR_MIN, Math.min(min, max - 10));
  globalYearMax = Math.min(GLOBAL_YEAR_MAX, Math.max(max, min + 10));
  updateAllCharts();
}

function initTimelineBar() {
  const minEl = document.getElementById("global-year-min");
  const maxEl = document.getElementById("global-year-max");
  const resetBtn = document.getElementById("timeline-reset");

  minEl.addEventListener("input", () => {
    let min = Number(minEl.value);
    let max = Number(maxEl.value);
    if (min >= max - 10) min = max - 10;
    applyTimeline(min, max);
  });

  maxEl.addEventListener("input", () => {
    let min = Number(minEl.value);
    let max = Number(maxEl.value);
    if (max <= min + 10) max = min + 10;
    applyTimeline(min, max);
  });

  resetBtn.addEventListener("click", () => {
    applyTimeline(GLOBAL_YEAR_MIN, GLOBAL_YEAR_MAX);
  });

  updateTimelineUI();
}

function bindFilters() {
  const langSelect = document.getElementById("lang-filter");
  getSortedLanguages(wordsData).forEach((lang) => {
    const opt = document.createElement("option");
    opt.value = lang;
    opt.textContent = lang;
    langSelect.appendChild(opt);
  });

  langSelect.addEventListener("change", renderBubbleChart);

    window.addEventListener("resize", () => {
    streamChart?.resize();
    bubbleChart?.resize();
    barChart?.resize();
    treemapChart?.resize();
    sankeyChart?.resize();
    forceChart?.resize();
    if (typeof resizeMlCharts === "function") resizeMlCharts();
  });
}

async function init() {
  try {
    if (typeof echarts === "undefined") {
      throw new Error("ECharts 未加载，请确认 js/vendor/echarts.min.js 存在");
    }

    wordsData = await loadWords();
    bindFilters();
    updateAllCharts();
    initTimelineBar();
    initScrollNarrative((min, max) => applyTimeline(min, max));

    observeChartSections({
      stream: () => { streamChart?.resize(); renderStreamChart(); },
      bubble: () => { bubbleChart?.resize(); renderBubbleChart(); },
      compare: () => { if (typeof renderCompareCharts === "function") renderCompareCharts(); },
      "world-map": () => { if (typeof renderWorldMap === "function") renderWorldMap(); },
      "bar-race": () => { if (typeof renderBarRace === "function") renderBarRace(window._barRaceYear || 1550); },
      languages: () => { barChart?.resize(); renderBarChart(); },
      advanced: () => {
        treemapChart?.resize();
        sankeyChart?.resize();
        forceChart?.resize();
        renderTreemapChart();
        renderSankeyChart();
        renderForceChart();
      },
      ml: () => {
        if (typeof renderAllMlCharts === "function") renderAllMlCharts();
        if (typeof resizeMlCharts === "function") resizeMlCharts();
      }
    });

    window.AppControl = {
      applyTimeline,
      shiftTimeline(delta) {
        applyTimeline(globalYearMin + delta, globalYearMax + delta);
      },
      widenTimeline(years = 20) {
        const mid = (globalYearMin + globalYearMax) / 2;
        const half = (globalYearMax - globalYearMin) / 2 + years / 2;
        applyTimeline(mid - half, mid + half);
      },
      narrowTimeline(years = 20) {
        const mid = (globalYearMin + globalYearMax) / 2;
        const half = Math.max(20, (globalYearMax - globalYearMin) / 2 - years / 2);
        applyTimeline(mid - half, mid + half);
      },
      resetTimeline() {
        applyTimeline(GLOBAL_YEAR_MIN, GLOBAL_YEAR_MAX);
      },
      getTimeline() {
        return { min: globalYearMin, max: globalYearMax };
      },
      navigateStorySection,
      getActiveStoryIndex,
      onTimelineChange(fn) {
        timelineListeners.push(fn);
      },
      getWordsData: () => wordsData,
      getLangColor
    };

    if (typeof initGestures === "function") {
      initGestures(window.AppControl);
    }

    if (typeof initFeatures === "function") {
      initFeatures(window.AppControl, wordsData, getLangColor);
    }

    setTimeout(() => {
      updateAllCharts();
      if (typeof renderCompareCharts === "function") renderCompareCharts();
      if (typeof renderWorldMap === "function") renderWorldMap();
      if (typeof renderBarRace === "function") renderBarRace(1550);
      if (typeof initMlSection === "function") initMlSection();
      if (typeof resizeAllProjectCharts === "function") resizeAllProjectCharts();
    }, 400);
  } catch (err) {
    console.error(err);
    showBootError(err.message || String(err));
  }
}

document.addEventListener("DOMContentLoaded", init);
