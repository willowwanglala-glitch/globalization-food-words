/* 机器学习分析可视化：聚类散点 · 典型轨迹 · 特征重要性 · 回归拟合 */

let mlClusterChart = null;
let mlCurveChart = null;
let mlImportanceChart = null;
let mlRegressionChart = null;
let mlClusterFilter = "all";

function getMlData() {
  if (typeof ML_DATA !== "undefined") return ML_DATA;
  return null;
}

function initMlSection() {
  const data = getMlData();
  if (!data) return;

  const statsEl = document.getElementById("ml-stats");
  if (statsEl) {
    const s = data.stats || {};
    const reg = data.regression || {};
    statsEl.innerHTML = `
      <span>语料词条 <strong>${s.words_with_ngrams || "—"}</strong></span>
      <span>聚类轮廓系数 <strong>${data.clustering?.silhouette ?? "—"}</strong></span>
      <span>回归 R² <strong>${reg.r2 ?? "—"}</strong></span>
      <span>5折 CV R² <strong>${reg.cv_r2_mean ?? "—"}</strong></span>
    `;
  }

  const filterEl = document.getElementById("ml-cluster-filter");
  if (filterEl && data.clustering?.clusters) {
    filterEl.innerHTML = '<option value="all">全部聚类</option>';
    data.clustering.clusters.forEach((cl) => {
      const opt = document.createElement("option");
      opt.value = String(cl.id);
      opt.textContent = `${cl.name} (${cl.count})`;
      filterEl.appendChild(opt);
    });
    filterEl.addEventListener("change", () => {
      mlClusterFilter = filterEl.value;
      renderMlClusterChart();
    });
  }

  renderMlClusterChart();
  renderMlCurveChart();
  renderMlImportanceChart();
  renderMlRegressionChart();
}

function renderMlClusterChart() {
  const data = getMlData();
  const dom = document.getElementById("ml-cluster-chart");
  if (!data?.clustering || !dom) return;

  if (!mlClusterChart) {
    mlClusterChart = safeEchartsInit(dom);
  }
  if (!mlClusterChart) return;

  const clusters = data.clustering.clusters || [];
  const points = data.clustering.points || [];
  const filtered =
    mlClusterFilter === "all"
      ? points
      : points.filter((p) => p.cluster === Number(mlClusterFilter));

  const series = clusters.map((cl) => {
    const pts = filtered.filter((p) => p.cluster === cl.id);
    return {
      name: cl.name,
      type: "scatter",
      data: pts.map((p) => ({
        value: [p.pca1, p.pca2, p.popularity],
        word: p.word,
        meta: p,
      })),
      symbolSize(val) {
        return Math.max(8, Math.min(28, val[2] / 4));
      },
      itemStyle: { color: cl.color, opacity: 0.75 },
      emphasis: { scale: 1.4 },
    };
  });

  mlClusterChart.setOption(
    {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        formatter(params) {
          const m = params.data.meta;
          return `<strong>${m.word}</strong><br/>
            聚类：${clusters[m.cluster]?.name || m.cluster}<br/>
            源语言：${m.source_lang} · ${m.first_year}<br/>
            类别：${m.category}`;
        },
      },
      legend: { top: 8, textStyle: { color: "#8b98a8" } },
      grid: { left: 48, right: 24, top: 48, bottom: 40 },
      xAxis: {
        name: "PCA-1",
        nameTextStyle: { color: "#8b98a8" },
        axisLine: { lineStyle: { color: "#3d4f5f" } },
        splitLine: { lineStyle: { color: "#2a3544" } },
        axisLabel: { color: "#8b98a8" },
      },
      yAxis: {
        name: "PCA-2",
        nameTextStyle: { color: "#8b98a8" },
        axisLine: { lineStyle: { color: "#3d4f5f" } },
        splitLine: { lineStyle: { color: "#2a3544" } },
        axisLabel: { color: "#8b98a8" },
      },
      series: mlClusterFilter === "all" ? series : series.filter((s) => s.data.length),
    },
    true
  );
}

function renderMlCurveChart() {
  const data = getMlData();
  const dom = document.getElementById("ml-curve-chart");
  if (!data?.clustering?.centroid_curves || !dom) return;

  if (!mlCurveChart) mlCurveChart = safeEchartsInit(dom);
  if (!mlCurveChart) return;

  const curves = data.clustering.centroid_curves;
  const clusters = data.clustering.clusters || [];
  const sampledYears = curves[0].years.filter((y) => y % 20 === 0);

  mlCurveChart.setOption(
    {
      backgroundColor: "transparent",
      tooltip: { trigger: "axis" },
      legend: { top: 8, textStyle: { color: "#8b98a8" } },
      grid: { left: 56, right: 24, top: 48, bottom: 40 },
      xAxis: {
        type: "category",
        data: sampledYears.map(String),
        axisLabel: { color: "#8b98a8" },
        axisLine: { lineStyle: { color: "#3d4f5f" } },
      },
      yAxis: {
        type: "value",
        name: "语料频率（均值）",
        nameTextStyle: { color: "#8b98a8" },
        axisLabel: {
          color: "#8b98a8",
          formatter(v) {
            return v < 0.001 ? v.toExponential(1) : v.toFixed(4);
          },
        },
        splitLine: { lineStyle: { color: "#2a3544" } },
      },
      series: curves.map((c) => {
        const cl = clusters.find((x) => x.id === c.cluster);
        const idxMap = new Map(c.years.map((y, i) => [y, i]));
        return {
          name: cl?.name || `Cluster ${c.cluster}`,
          type: "line",
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: cl?.color },
          itemStyle: { color: cl?.color },
          data: sampledYears.map((y) => c.values[idxMap.get(y)]),
        };
      }),
    },
    true
  );
}

function renderMlImportanceChart() {
  const data = getMlData();
  const dom = document.getElementById("ml-importance-chart");
  const reg = data?.regression;
  if (!reg?.feature_importance || reg.skipped || !dom) return;

  if (!mlImportanceChart) mlImportanceChart = safeEchartsInit(dom);
  if (!mlImportanceChart) return;

  const items = reg.feature_importance.slice().reverse();
  mlImportanceChart.setOption(
    {
      backgroundColor: "transparent",
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: 120, right: 32, top: 24, bottom: 32 },
      xAxis: {
        type: "value",
        max: 1,
        axisLabel: { color: "#8b98a8" },
        splitLine: { lineStyle: { color: "#2a3544" } },
      },
      yAxis: {
        type: "category",
        data: items.map((x) => x.feature),
        axisLabel: { color: "#c5d0dc" },
        axisLine: { lineStyle: { color: "#3d4f5f" } },
      },
      series: [
        {
          type: "bar",
          data: items.map((x) => x.importance),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: "#8b2635" },
              { offset: 1, color: "#d4a017" },
            ]),
          },
          label: {
            show: true,
            position: "right",
            color: "#8b98a8",
            formatter: "{c}",
          },
        },
      ],
    },
    true
  );
}

function renderMlRegressionChart() {
  const data = getMlData();
  const dom = document.getElementById("ml-regression-chart");
  const reg = data?.regression;
  if (!reg?.scatter || reg.skipped || !dom) return;

  if (!mlRegressionChart) mlRegressionChart = safeEchartsInit(dom);
  if (!mlRegressionChart) return;

  const pts = reg.scatter.map((p) => [p.actual, p.predicted]);
  const minV = Math.min(...pts.flat());
  const maxV = Math.max(...pts.flat());

  mlRegressionChart.setOption(
    {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        formatter(p) {
          return `实际：${p.data[0]}<br/>预测：${p.data[1]}`;
        },
      },
      grid: { left: 48, right: 24, top: 24, bottom: 40 },
      xAxis: {
        name: "实际 log(峰值频率)",
        min: minV - 0.1,
        max: maxV + 0.1,
        nameTextStyle: { color: "#8b98a8" },
        axisLabel: { color: "#8b98a8" },
        splitLine: { lineStyle: { color: "#2a3544" } },
      },
      yAxis: {
        name: "预测值",
        min: minV - 0.1,
        max: maxV + 0.1,
        nameTextStyle: { color: "#8b98a8" },
        axisLabel: { color: "#8b98a8" },
        splitLine: { lineStyle: { color: "#2a3544" } },
      },
      series: [
        {
          type: "line",
          data: [[minV, minV], [maxV, maxV]],
          showSymbol: false,
          lineStyle: { type: "dashed", color: "#d4a017", width: 1 },
          tooltip: { show: false },
        },
        {
          type: "scatter",
          data: pts,
          symbolSize: 8,
          itemStyle: { color: "#8b2635", opacity: 0.7 },
        },
      ],
    },
    true
  );
}

function resizeMlCharts() {
  mlClusterChart?.resize();
  mlCurveChart?.resize();
  mlImportanceChart?.resize();
  mlRegressionChart?.resize();
}

function renderAllMlCharts() {
  renderMlClusterChart();
  renderMlCurveChart();
  renderMlImportanceChart();
  renderMlRegressionChart();
}

document.addEventListener("DOMContentLoaded", () => {
  const ids = [
    "ml-cluster-chart",
    "ml-curve-chart",
    "ml-importance-chart",
    "ml-regression-chart",
  ];
  if (typeof runWhenChartReady === "function") {
    runWhenChartReady(ids, () => initMlSection());
  } else {
    initMlSection();
  }
});
