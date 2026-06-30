# 全球化下的饮食词汇借用 — 大数据可视化期末项目

交互式研究报告：基于 **662 个去重饮食借词**，结合 Google Books Ngrams（1800–2020）、Merriam-Webster 首次记录与收录数据，以及 SPSS 卡方检验与机器学习分析。

---

## 快速启动

### 环境要求

- Node.js 18+
- Python 3.10+（数据处理脚本）
- 依赖：`pandas`、`openpyxl`、`numpy`、`scipy`、`scikit-learn`

### 运行网页（推荐）

```bash
cd 大数据可视化网页/app
npm install
npm run dev
```

浏览器打开终端提示的地址（通常 `http://localhost:5173`）。

### 生产构建

```bash
cd 大数据可视化网页/app
npm run build
npm run preview
```

构建产物在 `app/dist/`，可静态部署。

---

## 建议阅读顺序（评阅 / 5 分钟答辩）

| 顺序 | 导航模块 | 看什么 |
|------|----------|--------|
| 1 | 首页 | 662 词口径、多来源说明、研究框架 |
| 2 | 双轨不对称 | 语料频率 vs MW 收录率的分化 |
| 3 | 词汇浪潮 | 1800–2020 各语种聚合频率层累抬升 |
| 4 | 桑基图 | 语义分层与多中心 pantry |
| 5 | SPSS检验 | MW 收录 × 语义类别卡方（检验 1） |
| 6 | 机器学习 | K-Means 轨迹聚类 + 随机森林 |
| 7 | 核心结论 | 六条发现汇总 |

**扩展模块**（全球地图、气泡图、词云、网络图、旭日图、雷达图、箱线图、类别分布、时序分布、个案深描）供深入探索，答辩不必全部讲完。

---

## 数据口径

| 指标 | 数值 | 说明 |
|------|------|------|
| 去重借词 | **662** | 一词一行，主来源用于统计 |
| 一词多来源 | **107** | 保留在 xlsx「来源列表」列 |
| 有 Ngram 语料 | **~637** | 25 词在 Books 语料中无记录 |
| ML 完整轨迹 | **~343** | 有首次年 + Ngram 的建模子集 |
| 时间跨度 | **1800–2020** | Google Books 英语语料 |

---

## 项目结构

```
├── 外来饮食借词清单_with_first_use.xlsx   # 清洗后主清单（662 词）
├── 外来饮食借词清单_with_first_use_backup.xlsx  # 去重前备份（828 行）
├── spss_dataset_clean.csv                 # SPSS 用导出（662 词）
├── output/                                # Ngrams 抓取结果
├── scripts/
│   ├── clean_and_rebuild.py               # 清洗 + 重建 visualization_data.json
│   ├── build_data_and_ml.py               # ML 模型 + ml_results.json
│   ├── export_spss_dataset.py             # 导出 SPSS CSV + 网页 JSON
│   └── export_spss_web_json.py            # SPSS 检验 1 网页数据
├── 大数据可视化网页/app/                   # React 主站（Vite + ECharts）
│   └── public/data/
│       ├── visualization_data.json
│       ├── ml_results.json
│       └── spss_mw_category.json
└── demo/                                  # 独立 HTML 演示（可选）
```

---

## 数据重建流程

在**项目根目录**执行：

```bash
# 1. 从 828 行备份重新清洗（仅在清单损坏时）
#    正常情况下 xlsx 已是 662 词，可跳过 export_xlsx 步骤，只跑 update_viz

# 2. 清洗并重建全部可视化 JSON（含 network / radar / boxplot / sunburst）
py scripts/clean_and_rebuild.py

# 3. 重建机器学习结果
py scripts/build_data_and_ml.py

# 4. 导出 SPSS 数据并同步网页 SPSS 模块
py scripts/export_spss_dataset.py
```

> **注意**：`clean_and_rebuild.py` 会读取当前 xlsx。若需从 828 行原始清单重新去重，请先将 `*_backup.xlsx` 复制为输入，或修改脚本中的 `XLSX` 路径。

---

## 理论与方法

- **框架**：层累型全球 Pantry + 语料—词典双轨不对称
- **可视化**：ECharts 多种图表 + 交互筛选
- **统计**：SPSS Pearson 卡方（MW 收录 × 语义类别，五类合并）
- **机器学习**：K-Means（频率轨迹聚类）、随机森林（峰值频率回归）

---

## 已知局限（可在书面报告引用）

1. Google Books Ngrams 偏书面语，不代表口语使用
2. 662 词中 25 个无 Ngram 频率，相关/回归分析自动剔除
3. MW 首次记录年份 ≠ 语料中首次出现年份
4. 清单来源含 Wikipedia 并集，多来源词已标注但未展开网络边

---

## 提交建议

- **交互报告**：提交 `app/dist/` 或部署链接 + 本 README
- **书面报告（若要求）**：5–8 页 Word，含 SPSS 表截图 + 阅读顺序说明
- **答辩**：按「建议阅读顺序」7 屏讲解，扩展图表一句带过

## 语种配色（全站统一）

各图表中同一语种始终使用 `app/src/sections/langColors.ts` 中的颜色，例如：法语 `#EF476F`、西班牙语 `#FF9F1C`、日语 `#F72585`、汉语 `#118AB2`、韩语 `#00B4D8` 等共 13 色。语义层（桑基图）使用独立的 `LAYER_COLORS`。

---

广东工业大学 · 大数据及其可视化 · 2026 春
