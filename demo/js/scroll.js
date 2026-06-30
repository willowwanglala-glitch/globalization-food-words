const STORY_SECTIONS = [
  {
    id: "story-intro",
    eraMin: 1550,
    eraMax: 2000,
    insight: "饮食借词是文化接触的缩影——从香料之路到全球化菜单，每一词都携带一段历史。"
  },
  {
    id: "menu",
    eraMin: 1600,
    eraMax: 2000,
    insight: "历史菜单：拖动时间轴，新菜名逐道解锁——借词如菜品，随时代端上英语的餐桌。"
  },
  {
    id: "stream",
    eraMin: 1550,
    eraMax: 1850,
    insight: "近代早期至开埠扩张期：阿拉伯、法语、西班牙语词汇率先进入英语，奠定饮食借词基础。"
  },
  {
    id: "bubble",
    eraMin: 1800,
    eraMax: 2000,
    insight: "19 世纪以降：意式、日式、中式词汇密集出现，点击气泡可翻转查看词源原文。"
  },
  {
    id: "compare",
    eraMin: 1550,
    eraMax: 2000,
    insight: "时代对比：1850 与 2000 两个截面，借词版图从欧洲中心扩展至全球多元。"
  },
  {
    id: "world-map",
    eraMin: 1550,
    eraMax: 2000,
    insight: "世界地图：各源语言地理原点亮起，借词如移民般汇流至 English 核心。"
  },
  {
    id: "bar-race",
    eraMin: 1550,
    eraMax: 2000,
    insight: "Bar Chart Race：各语言借词数量随年代赛跑，直观呈现浪潮此消彼长。"
  },
  {
    id: "languages",
    eraMin: 1550,
    eraMax: 2000,
    insight: "法语与西班牙语贡献量领先，但日语、中文在 20 世纪后期的增速更为显著。"
  },
  {
    id: "advanced",
    eraMin: 1550,
    eraMax: 2000,
    insight: "高级图表揭示：借词沿「时代→语言→类别」路径流动，网络中心性随全球化阶段而迁移。"
  },
  {
    id: "ml",
    eraMin: 1550,
    eraMax: 2000,
    insight: "机器学习：K-Means 聚类发现语料采纳模式，随机森林回归预测借词流行度（R²≈0.93）。"
  }
];

function initScrollNarrative(onSectionChange) {
  const rail = document.getElementById("story-rail");
  const insightEl = document.getElementById("story-insight");
  const sections = STORY_SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);

  STORY_SECTIONS.forEach((story, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "story-rail-btn";
    btn.dataset.target = story.id;
    btn.title = story.insight;
    btn.innerHTML = `<span class="story-rail-num">${String(index + 1).padStart(2, "0")}</span>`;
    btn.addEventListener("click", () => {
      document.getElementById(story.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    rail.appendChild(btn);
  });

  let activeId = null;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visible.length) return;

      const id = visible[0].target.id;
      if (id === activeId) return;

      activeId = id;
      const story = STORY_SECTIONS.find((s) => s.id === id);
      if (!story) return;

      document.querySelectorAll(".story-rail-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.target === id);
      });

      document.querySelectorAll(".story-section").forEach((sec) => {
        sec.classList.toggle("is-active", sec.id === id);
      });

      if (insightEl) {
        insightEl.textContent = story.insight;
        insightEl.classList.add("visible");
      }

      onSectionChange(story.eraMin, story.eraMax);
    },
    { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5] }
  );

  sections.forEach((sec) => observer.observe(sec));
}

function getActiveStoryIndex() {
  const active = document.querySelector(".story-rail-btn.active");
  if (!active) return 0;
  const idx = STORY_SECTIONS.findIndex((s) => s.id === active.dataset.target);
  return idx >= 0 ? idx : 0;
}

function navigateStorySection(delta) {
  const next = Math.max(0, Math.min(STORY_SECTIONS.length - 1, getActiveStoryIndex() + delta));
  document.getElementById(STORY_SECTIONS[next].id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
