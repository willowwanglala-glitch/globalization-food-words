/** 确保 ECharts 容器有尺寸后再 init / resize */
function safeEchartsInit(el, chartRef) {
  if (!el || typeof echarts === "undefined") return null;

  const w = el.clientWidth;
  const h = el.clientHeight;

  if (chartRef) {
    const dead = typeof chartRef.isDisposed === "function" ? chartRef.isDisposed() : false;
    if (!dead) {
      if (w > 0 && h > 0) {
        chartRef.resize();
        return chartRef;
      }
      chartRef.dispose();
    }
  }

  if (w <= 0 || h <= 0) return null;
  return echarts.init(el, null, { renderer: "canvas" });
}

function runWhenChartReady(elementIds, callback, maxTries = 20) {
  let tries = 0;

  const attempt = () => {
    tries += 1;
    const ready = elementIds.every((id) => {
      const el = document.getElementById(id);
      return el && el.clientWidth > 0 && el.clientHeight > 0;
    });

    if (ready) {
      callback();
      return;
    }
    if (tries < maxTries) {
      requestAnimationFrame(attempt);
    } else {
      callback();
    }
  };

  attempt();
}

function observeChartSections(map) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const fn = map[entry.target.id];
        if (fn) fn();
      });
    },
    { threshold: 0.12 }
  );

  Object.keys(map).forEach((id) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

function resizeAllProjectCharts() {
  [
    window._streamChart,
    window._bubbleChart,
    window._barChart,
    window._treemapChart,
    window._sankeyChart,
    window._forceChart,
    window._compareChartA,
    window._compareChartB,
    window._worldMapChart,
    window._barRaceChart
  ].forEach((c) => {
    if (c && !c.isDisposed?.()) c.resize();
  });

  if (typeof resizeParticleCanvas === "function") resizeParticleCanvas();
}

window.addEventListener("load", () => {
  setTimeout(resizeAllProjectCharts, 100);
  setTimeout(resizeAllProjectCharts, 500);
});

window.addEventListener("resize", () => {
  clearTimeout(window._chartResizeTimer);
  window._chartResizeTimer = setTimeout(resizeAllProjectCharts, 150);
});
