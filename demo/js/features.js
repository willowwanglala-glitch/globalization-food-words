/* 主题扩展：历史菜单 · 移民动画 · 对比分屏 · 世界地图 · Bar Race · 词源翻转卡片 */

const LANG_COORDS = {
  Arabic: { x: 0.52, y: 0.42, label: "中东" },
  Chinese: { x: 0.78, y: 0.38, label: "东亚" },
  Dutch: { x: 0.48, y: 0.28, label: "西欧" },
  English: { x: 0.46, y: 0.30, label: "英伦" },
  French: { x: 0.47, y: 0.32, label: "法国" },
  German: { x: 0.50, y: 0.28, label: "中欧" },
  Greek: { x: 0.54, y: 0.36, label: "地中海" },
  Hindi: { x: 0.68, y: 0.42, label: "南亚" },
  Hungarian: { x: 0.53, y: 0.30, label: "东欧" },
  Italian: { x: 0.51, y: 0.34, label: "意大利" },
  Japanese: { x: 0.84, y: 0.36, label: "日本" },
  Korean: { x: 0.81, y: 0.35, label: "韩国" },
  Persian: { x: 0.58, y: 0.38, label: "波斯" },
  Polish: { x: 0.53, y: 0.27, label: "波兰" },
  Russian: { x: 0.62, y: 0.22, label: "俄国" },
  Spanish: { x: 0.44, y: 0.38, label: "伊比利亚" },
  Thai: { x: 0.74, y: 0.48, label: "东南亚" },
  Turkish: { x: 0.55, y: 0.35, label: "安纳托利亚" },
  Vietnamese: { x: 0.76, y: 0.45, label: "越南" },
  Nahuatl: { x: 0.32, y: 0.42, label: "中美洲" }
};

const ENGLISH_TARGET = { x: 0.28, y: 0.35 };

const NATIVE_SCRIPT = {
  sushi: "寿司 / Sushi",
  tofu: "豆腐",
  ramen: "ラーメン",
  tempura: "天ぷら",
  miso: "味噌",
  kimchi: "김치",
  pho: "Phở",
  croissant: "Croissant",
  baguette: "Baguette",
  pizza: "Pizza",
  pasta: "Pasta",
  espresso: "Espresso",
  taco: "Taco",
  guacamole: "Guacamole",
  salsa: "Salsa",
  curry: "करी / Curry",
  naan: "नान",
  falafel: "فلافel",
  hummus: "حمص",
  shawarma: "شاورما",
  tzatziki: "Τζατζίκι",
  gyro: "Γύρος",
  pierogi: "Pierogi",
  borscht: "Борщ",
  tea: "茶",
  chow mein: "炒面",
  dim sum: "點心",
  bok choy: "白菜",
  matcha: "抹茶",
  bubble tea: "珍珠奶茶",
  bao: "包",
  champagne: "Champagne",
  restaurant: "Restaurant",
  menu: "Menu",
  chef: "Chef",
  chocolate: "Chocolate",
  tomato: "Tomate",
  potato: "Patata",
  coffee: "قهوة → Coffee",
  sugar: "سكر → Sugar"
};

const MENU_CATEGORIES = {
  beverage: "饮品 Beverages",
  bakery: "烘焙 Bakery",
  meat: "主菜 Mains",
  seafood: "海鲜 Seafood",
  noodle: "面食 Noodles",
  condiment: "调味 Condiments",
  dessert: "甜点 Desserts",
  vegetable: "蔬菜 Greens",
  fruit: "水果 Fruits",
  spice: "香料 Spices",
  soup: "汤品 Soups",
  "street food": "街头 Street Food",
  snack: "小食 Snacks",
  dairy: "乳品 Dairy",
  "plant-based": "素食 Plant-based",
  dumpling: "点心 Dim Sum",
  fermented: "发酵 Fermented",
  rice: "米饭 Rice",
  stew: "炖菜 Stews",
  sweet: "甜品 Sweets",
  ingredient: "原料 Ingredients",
  meal: "餐食 Meals",
  nut: "坚果 Nuts",
  grain: "谷物 Grains",
  other: "其他 Others"
};

let featureApp = null;
let featureWords = [];
let getLangColorFn = () => "#aaa";
let compareChartA = null;
let compareChartB = null;
let worldMapChart = null;
let barRaceChart = null;
let barRaceTimer = null;
let barRaceYear = 1550;
let particles = [];
let particleCanvas = null;
let particleCtx = null;
let particleAnimId = null;

function getNativeLabel(word) {
  return NATIVE_SCRIPT[word] || word;
}

function isWordUnlocked(word, yearMax) {
  return word.first_year <= yearMax;
}

function showWordFlipCard(word, lang, year, pop, cat) {
  const overlay = document.getElementById("flip-overlay");
  const card = document.getElementById("flip-card");
  if (!overlay || !card) return;

  document.getElementById("flip-front-word").textContent = word;
  document.getElementById("flip-front-meta").textContent =
    `${lang} · ${year} · ${cat} · 流行度 ${pop}`;
  document.getElementById("flip-back-native").textContent = getNativeLabel(word);
  document.getElementById("flip-back-desc").textContent =
    `约 ${year} 年进入英语，源自 ${lang}。${MENU_CATEGORIES[cat] || cat}类借词，反映该时期跨文化饮食接触。`;

  card.classList.remove("flipped");
  overlay.classList.add("open");
}

function hideWordFlipCard() {
  document.getElementById("flip-overlay")?.classList.remove("open");
  document.getElementById("flip-card")?.classList.remove("flipped");
}

function renderHistoricalMenu() {
  const grid = document.getElementById("menu-grid");
  const eraLabel = document.getElementById("menu-era-label");
  if (!grid || !featureApp) return;

  const { max } = featureApp.getTimeline();
  eraLabel.textContent = `菜单截至 ${max} 年 · 已解锁 ${featureWords.filter((w) => isWordUnlocked(w, max)).length} / ${featureWords.length} 道`;

  const byCat = {};
  featureWords.forEach((w) => {
    if (!byCat[w.category]) byCat[w.category] = [];
    byCat[w.category].push(w);
  });

  grid.innerHTML = "";

  Object.entries(byCat)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([cat, items]) => {
      const section = document.createElement("div");
      section.className = "menu-category";
      section.innerHTML = `<h3 class="menu-category-title">${MENU_CATEGORIES[cat] || cat}</h3>`;

      const list = document.createElement("div");
      list.className = "menu-items";

      items
        .sort((a, b) => a.first_year - b.first_year)
        .forEach((w) => {
          const unlocked = isWordUnlocked(w, max);
          const item = document.createElement("button");
          item.type = "button";
          item.className = `menu-item${unlocked ? " unlocked" : " locked"}`;
          item.innerHTML = unlocked
            ? `<span class="menu-item-name">${w.word}</span>
               <span class="menu-item-year">${w.first_year}</span>
               <span class="menu-item-lang" style="color:${getLangColorFn(w.source_lang)}">${w.source_lang}</span>`
            : `<span class="menu-item-name">???</span>
               <span class="menu-item-year">未解锁</span>`;
          if (unlocked) {
            item.addEventListener("click", () =>
              showWordFlipCard(w.word, w.source_lang, w.first_year, w.popularity, w.category)
            );
          }
          list.appendChild(item);
        });

      section.appendChild(list);
      grid.appendChild(section);
    });
}

function spawnParticle(word) {
  const coord = LANG_COORDS[word.source_lang] || { x: 0.5, y: 0.4 };
  particles.push({
    word: word.word,
    color: getLangColorFn(word.source_lang),
    x: coord.x,
    y: coord.y,
    tx: ENGLISH_TARGET.x,
    ty: ENGLISH_TARGET.y,
    t: 0,
    speed: 0.008 + Math.random() * 0.006
  });
}

function initParticleCanvas() {
  particleCanvas = document.getElementById("particle-canvas");
  if (!particleCanvas) return;
  particleCtx = particleCanvas.getContext("2d");
  resizeParticleCanvas();
  window.addEventListener("resize", resizeParticleCanvas);

  let spawnIdx = 0;
  setInterval(() => {
    if (!featureApp || particles.length > 40) return;
    const { min, max } = featureApp.getTimeline();
    const pool = featureWords.filter((w) => w.first_year >= min && w.first_year <= max);
    if (!pool.length) return;
    spawnParticle(pool[spawnIdx % pool.length]);
    spawnIdx += 1;
  }, 900);

  animateParticles();
}

function resizeParticleCanvas() {
  if (!particleCanvas) return;
  const stage = particleCanvas.parentElement;
  if (!stage) return;
  const rect = stage.getBoundingClientRect();
  particleCanvas.width = Math.max(320, rect.width);
  particleCanvas.height = Math.max(320, rect.height);
}

function animateParticles() {
  if (!particleCtx || !particleCanvas) return;

  particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

  particleCtx.strokeStyle = "rgba(232,168,56,0.15)";
  particleCtx.lineWidth = 1;
  particleCtx.beginPath();
  particleCtx.arc(ENGLISH_TARGET.x * particleCanvas.width, ENGLISH_TARGET.y * particleCanvas.height, 28, 0, Math.PI * 2);
  particleCtx.stroke();
  particleCtx.fillStyle = "rgba(232,168,56,0.25)";
  particleCtx.fill();

  particles = particles.filter((p) => p.t < 1);
  particles.forEach((p) => {
    p.t += p.speed;
    const ease = p.t * p.t * (3 - 2 * p.t);
    const x = (p.x + (p.tx - p.x) * ease) * particleCanvas.width;
    const y = (p.y + (p.ty - p.y) * ease) * particleCanvas.height;

    particleCtx.fillStyle = p.color;
    particleCtx.globalAlpha = 1 - p.t * 0.5;
    particleCtx.beginPath();
    particleCtx.arc(x, y, 4, 0, Math.PI * 2);
    particleCtx.fill();

    if (p.t < 0.95) {
      particleCtx.font = "10px sans-serif";
      particleCtx.fillStyle = "#e8edf4";
      particleCtx.globalAlpha = 0.85;
      particleCtx.fillText(p.word, x + 6, y - 4);
    }
    particleCtx.globalAlpha = 1;
  });

  particleAnimId = requestAnimationFrame(animateParticles);
}

function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  btn?.addEventListener("click", () => {
    document.body.classList.toggle("theme-menu");
    const isMenu = document.body.classList.contains("theme-menu");
    btn.textContent = isMenu ? "切换：学术主题" : "切换：菜单主题";
    btn.dataset.mode = isMenu ? "menu" : "academic";
  });
}

function getCumulativeByLang(words, upToYear) {
  const counts = {};
  words
    .filter((w) => w.first_year <= upToYear)
    .forEach((w) => {
      counts[w.source_lang] = (counts[w.source_lang] || 0) + 1;
    });
  return Object.entries(counts)
    .map(([lang, count]) => ({ lang, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function renderCompareCharts() {
  const elA = document.getElementById("compare-chart-a");
  const elB = document.getElementById("compare-chart-b");
  if (!elA || !elB || typeof echarts === "undefined") return;

  if (!compareChartA || compareChartA.isDisposed?.()) {
    compareChartA = echarts.init(elA, null, { renderer: "canvas" });
  }
  if (!compareChartB || compareChartB.isDisposed?.()) {
    compareChartB = echarts.init(elB, null, { renderer: "canvas" });
  }
  window._compareChartA = compareChartA;
  window._compareChartB = compareChartB;

  const dataA = getCumulativeByLang(featureWords, 1850);
  const dataB = getCumulativeByLang(featureWords, 2000);

  const makeOption = (data, title) => ({
    backgroundColor: "transparent",
    title: { text: title, left: "center", top: 4, textStyle: { color: "#8b98a8", fontSize: 13 } },
    grid: { left: 96, right: 24, top: 40, bottom: 20, containLabel: true },
    xAxis: {
      type: "value",
      min: 0,
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
      axisLabel: { color: "#8b98a8" }
    },
    yAxis: {
      type: "category",
      data: data.map((d) => d.lang),
      axisLabel: { color: "#e8edf4", fontSize: 11 },
      axisLine: { lineStyle: { color: "#444" } }
    },
    series: [{
      type: "bar",
      data: data.map((d) => ({
        value: d.count,
        itemStyle: { color: getLangColorFn(d.lang) }
      })),
      barWidth: 16,
      label: { show: true, position: "right", color: "#e8edf4", fontSize: 11 }
    }],
    graphic: data.length ? [] : [{
      type: "text",
      left: "center",
      top: "middle",
      style: { text: "暂无数据", fill: "#8b98a8", fontSize: 14 }
    }]
  });

  compareChartA.setOption(makeOption(dataA, "截至 1850 年累计借词"), true);
  compareChartB.setOption(makeOption(dataB, "截至 2000 年累计借词"), true);
  compareChartA.resize();
  compareChartB.resize();
}

function renderWorldMap() {
  const el = document.getElementById("world-map-chart");
  if (!el || typeof echarts === "undefined") return;

  if (!worldMapChart || worldMapChart.isDisposed?.()) {
    worldMapChart = echarts.init(el, null, { renderer: "canvas" });
  }
  window._worldMapChart = worldMapChart;

  const { min, max } = featureApp?.getTimeline() || { min: 1550, max: 2000 };
  const active = featureWords.filter((w) => w.first_year >= min && w.first_year <= max);

  const langAgg = {};
  active.forEach((w) => {
    if (!langAgg[w.source_lang]) langAgg[w.source_lang] = { count: 0 };
    langAgg[w.source_lang].count += 1;
  });

  const scatterData = Object.entries(langAgg).map(([lang, s]) => {
    const c = LANG_COORDS[lang] || { x: 0.5, y: 0.4, label: lang };
    return {
      name: lang,
      value: [c.x * 100, c.y * 100, s.count],
      label: c.label
    };
  });

  scatterData.push({
    name: "English",
    value: [ENGLISH_TARGET.x * 100, ENGLISH_TARGET.y * 100, 3],
    isTarget: true
  });

  worldMapChart.setOption(
    {
      backgroundColor: "transparent",
      tooltip: {
        formatter(p) {
          if (p.data.isTarget) return "<strong>English</strong><br/>借词汇流目标";
          return `<strong>${p.data.name}</strong>（${p.data.label}）<br/>借词数：${p.data.value[2]}`;
        }
      },
      grid: { left: 24, right: 24, top: 24, bottom: 36 },
      xAxis: {
        show: true,
        min: 0,
        max: 100,
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.05)" } },
        axisLabel: { show: false }
      },
      yAxis: {
        show: true,
        min: 0,
        max: 100,
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.05)" } },
        axisLabel: { show: false }
      },
      series: [
        {
          type: "scatter",
          symbolSize(val) {
            return Math.max(18, val[2] * 6);
          },
          data: scatterData.map((d) => ({
            ...d,
            itemStyle: {
              color: d.isTarget ? "#e8a838" : getLangColorFn(d.name),
              opacity: d.isTarget ? 1 : 0.9,
              shadowBlur: d.isTarget ? 16 : 8,
              shadowColor: d.isTarget ? "rgba(232,168,56,0.6)" : "rgba(0,0,0,0.4)"
            }
          })),
          label: {
            show: true,
            formatter: "{b}",
            position: "top",
            color: "#e8edf4",
            fontSize: 11
          }
        },
        {
          type: "lines",
          coordinateSystem: "cartesian2d",
          effect: {
            show: true,
            period: 4,
            trailLength: 0.4,
            symbol: "arrow",
            symbolSize: 6,
            color: "#e8a838"
          },
          lineStyle: { color: "rgba(232,168,56,0.35)", width: 1, curveness: 0.25 },
          data: scatterData
            .filter((d) => !d.isTarget)
            .map((d) => ({
              coords: [
                [d.value[0], d.value[1]],
                [ENGLISH_TARGET.x * 100, ENGLISH_TARGET.y * 100]
              ]
            }))
        }
      ],
      graphic: [{
        type: "text",
        left: "center",
        bottom: 6,
        style: { text: "光点 = 源语言地理原点 · 箭头 = 借词流向 English", fill: "#8b98a8", fontSize: 11 }
      }]
    },
    true
  );
  worldMapChart.resize();
}

function buildBarRaceFrame(year) {
  const counts = {};
  featureWords
    .filter((w) => w.first_year <= year)
    .forEach((w) => {
      counts[w.source_lang] = (counts[w.source_lang] || 0) + 1;
    });

  return Object.entries(counts)
    .map(([lang, count]) => ({ lang, count }))
    .sort((a, b) => a.count - b.count);
}

function renderBarRace(year) {
  const el = document.getElementById("bar-race-chart");
  const yearEl = document.getElementById("bar-race-year");
  if (!el || typeof echarts === "undefined") return;

  if (!barRaceChart || barRaceChart.isDisposed?.()) {
    barRaceChart = echarts.init(el, null, { renderer: "canvas" });
  }
  window._barRaceChart = barRaceChart;
  window._barRaceYear = year;

  const data = buildBarRaceFrame(year);
  if (yearEl) yearEl.textContent = year;

  const maxVal = Math.max(8, ...data.map((d) => d.count));

  barRaceChart.setOption(
    {
      backgroundColor: "transparent",
      animationDuration: 600,
      animationDurationUpdate: 600,
      grid: { left: 108, right: 56, top: 28, bottom: 28, containLabel: true },
      title: {
        text: `${year} 年累计借词排行`,
        left: "center",
        top: 0,
        textStyle: { color: "#8b98a8", fontSize: 13 }
      },
      xAxis: {
        type: "value",
        max: maxVal + 2,
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        axisLabel: { color: "#8b98a8" }
      },
      yAxis: {
        type: "category",
        data: data.map((d) => d.lang),
        axisLabel: { color: "#e8edf4", fontSize: 12 },
        axisLine: { lineStyle: { color: "#444" } }
      },
      series: [{
        type: "bar",
        data: data.map((d) => ({
          value: d.count,
          itemStyle: { color: getLangColorFn(d.lang) }
        })),
        barWidth: 18,
        label: {
          show: true,
          position: "right",
          color: "#e8edf4",
          formatter: "{c}"
        }
      }]
    },
    true
  );
  barRaceChart.resize();
}

function startBarRace() {
  stopBarRace();
  barRaceYear = 1550;
  barRaceTimer = setInterval(() => {
    barRaceYear += 10;
    if (barRaceYear > 2000) barRaceYear = 1550;
    renderBarRace(barRaceYear);
  }, 1200);
  renderBarRace(barRaceYear);
}

function stopBarRace() {
  if (barRaceTimer) {
    clearInterval(barRaceTimer);
    barRaceTimer = null;
  }
}

function initFeatures(app, words, getLangColor) {
  featureApp = app;
  featureWords = words;
  getLangColorFn = getLangColor;

  window.showWordFlipCard = showWordFlipCard;
  window.resizeParticleCanvas = resizeParticleCanvas;

  renderHistoricalMenu();
  initParticleCanvas();
  initThemeToggle();

  setTimeout(renderCompareCharts, 100);
  setTimeout(renderWorldMap, 150);
  setTimeout(() => startBarRace(), 200);

  observeChartSections({
    menu: () => {
      resizeParticleCanvas();
      renderHistoricalMenu();
    },
    compare: () => runWhenChartReady(["compare-chart-a", "compare-chart-b"], renderCompareCharts),
    "world-map": () => runWhenChartReady(["world-map-chart"], renderWorldMap),
    "bar-race": () => runWhenChartReady(["bar-race-chart"], () => renderBarRace(barRaceYear || 1550)),
    advanced: () => {
      if (typeof resizeAllProjectCharts === "function") resizeAllProjectCharts();
    }
  });

  document.getElementById("flip-overlay")?.addEventListener("click", (e) => {
    if (e.target.id === "flip-overlay") hideWordFlipCard();
  });
  document.getElementById("flip-close")?.addEventListener("click", (e) => {
    e.stopPropagation();
    hideWordFlipCard();
  });
  document.getElementById("flip-inner")?.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("flip-card")?.classList.toggle("flipped");
  });

  document.getElementById("bar-race-play")?.addEventListener("click", startBarRace);
  document.getElementById("bar-race-pause")?.addEventListener("click", stopBarRace);

  app.onTimelineChange(() => {
    renderHistoricalMenu();
    runWhenChartReady(["world-map-chart"], renderWorldMap);
  });
}
