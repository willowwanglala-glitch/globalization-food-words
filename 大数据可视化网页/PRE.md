# 答辩精简版（PRE）

面向课堂答辩的 **10 屏精简路线**，完整探索版仍保留在默认首页。

---

## 访问地址

| 版本 | 本地开发 | GitHub Pages |
|------|----------|--------------|
| **完整版**（原网页，18 模块） | `http://localhost:3000/#/` | `https://willowwanglala-glitch.github.io/globalization-food-words/#/` |
| **答辩精简版**（PRE，10 屏） | `http://localhost:3000/#/pre` | `https://willowwanglala-glitch.github.io/globalization-food-words/#/pre` |

导航栏右侧可点击 **「答辩版」/「完整版」** 切换。

---

## PRE 阅读顺序（10 屏）

| # | 模块 | 页面锚点 | 说明 |
|---|------|----------|------|
| 1 | 开头 | `#hero` | 662 词口径、研究框架 |
| 2 | 全球饮食词汇流向图 | `#globalmap` | 来源国 → 英语国家流向 |
| 3 | 外来词汇涌入浪潮 | `#streamgraph` | 1800–2020 各语种层累抬升 |
| 4 | 词汇时空分布气泡图 | `#bubble` | 首次年 × 近期频率 |
| 5 | 语义分层桑基图 | `#sankey` | 多中心全球 Pantry |
| 6 | 语料权力 vs 词典权力 | `#asymmetry` | 双轨不对称四象限 |
| 7 | SPSS 检验 | `#spss` | MW 收录 × 语义类别 |
| 8 | 语料轨迹聚类与流行度预测 | `#ml` | K-Means + 随机森林 |
| 9 | 个案深描 | `#cases` | 词汇生命周期 |
| 10 | 核心发现与理论贡献 | `#conclusion` | 六条发现汇总 |

---

## 完整版保留但 PRE 未包含的模块

词云、旭日图、网络图、树图、雷达图、箱线图、类别分布、时序分布——供评阅深入探索，答辩不必全部讲完。

---

## 代码位置

| 文件 | 作用 |
|------|------|
| `src/pages/FullReport.tsx` | 完整版页面（原 App 全部 section） |
| `src/pages/PreReport.tsx` | 答辩精简版（10 section） |
| `src/navConfig.ts` | 两套导航配置 `FULL_NAV` / `PRE_NAV` |
| `src/App.tsx` | 路由：`/` → 完整版，`/pre` → 精简版 |

---

广东工业大学 · 大数据及其可视化 · 2026 春
