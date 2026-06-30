#!/usr/bin/env python3
"""
清洗借词清单：
1. 每个英文词保留一行（去掉重复词语）
2. 保留真实的一词多来源（写入「来源列表」列）
3. 剔除误标的土耳其语来源（东亚词仅因维基并集重复收录）
4. 重建 visualization_data.json 中与语种计数相关的字段
5. 备份原 xlsx 并写入清洗后清单
"""

from __future__ import annotations

import json
import shutil
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "外来饮食借词清单_with_first_use.xlsx"
XLSX_BACKUP = ROOT / "外来饮食借词清单_with_first_use_backup.xlsx"
VIZ_PATH = ROOT / "大数据可视化网页" / "app" / "public" / "data" / "visualization_data.json"
OUT_DIR = ROOT / "output"
REPORT = ROOT / "scripts" / "clean_report.txt"

SOURCE_PRIORITY = [
    "汉语",
    "日语",
    "韩语",
    "纳瓦特尔语",
    "西班牙语",
    "法语",
    "意大利语",
    "波斯语",
    "阿拉伯语",
    "印地语/乌尔都语",
    "土耳其语",
    "德语",
    "荷兰语",
]

EAST_ASIAN = {"日语", "汉语", "韩语"}
TRADE_ROUTE = {"波斯语", "阿拉伯语", "印地语/乌尔都语", "西班牙语", "纳瓦特尔语"}

LANG_COLORS = {
    "法语": "#EF476F",
    "西班牙语": "#FF9F1C",
    "日语": "#F72585",
    "意大利语": "#06D6A0",
    "汉语": "#118AB2",
    "德语": "#8338EC",
    "韩语": "#00B4D8",
    "阿拉伯语": "#E85D04",
    "波斯语": "#40916C",
    "荷兰语": "#4361EE",
    "纳瓦特尔语": "#CAD035",
    "土耳其语": "#A47148",
    "印地语/乌尔都语": "#FFD60A",
}


def refine_sources(sources: set[str]) -> list[str]:
    """去掉东亚食材上误标的土耳其语（无波斯/阿拉伯/西语等贸易链来源时）。"""
    s = set(sources)
    if "土耳其语" in s and (s & EAST_ASIAN) and not (s & TRADE_ROUTE):
        s.discard("土耳其语")
    return sorted(s, key=lambda x: SOURCE_PRIORITY.index(x) if x in SOURCE_PRIORITY else 99)


def pick_primary(sources: list[str]) -> str:
    for lang in SOURCE_PRIORITY:
        if lang in sources:
            return lang
    return sources[0]


def category_to_layer(cat: str) -> str:
    if cat in ("场所", "制度", "餐饮制度"):
        return "制度层"
    if cat == "职业":
        return "身份层"
    if cat in ("烹饪法", "吃法"):
        return "技术层"
    if cat in ("饮品", "甜品", "烘焙"):
        return "文化资本层"
    return "食物层"


def load_xlsx() -> pd.DataFrame:
    df = pd.read_excel(XLSX)
    if len(df.columns) >= 11:
        df = df.iloc[:, :11]
        df.columns = [
            "id",
            "source_cn",
            "word",
            "first_year",
            "first_year_raw",
            "mw_recorded",
            "mw_note",
            "category_cn",
            "sources_all",
            "source_count",
            "is_multi_source",
        ]
    else:
        df.columns = [
            "id",
            "source_cn",
            "word",
            "first_year",
            "first_year_raw",
            "mw_recorded",
            "mw_note",
            "category_cn",
        ]
    df["word_key"] = df["word"].astype(str).str.strip().str.lower()
    return df


def build_cleaned_df(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    logs: list[str] = []
    rows = []

    for word_key, grp in df.groupby("word_key", sort=False):
        if not word_key or word_key == "nan":
            continue
        if "sources_all" in grp.columns and len(grp) == 1:
            raw = grp.iloc[0]["sources_all"]
            if pd.notna(raw) and str(raw).strip():
                raw_sources = {s.strip() for s in str(raw).split("、") if s.strip()}
            else:
                raw_sources = set(grp["source_cn"].astype(str).str.strip())
        else:
            raw_sources = set(grp["source_cn"].astype(str).str.strip())
        sources = refine_sources(raw_sources)
        if len(sources) < len(raw_sources):
            removed = raw_sources - set(sources)
            logs.append(f"  {grp['word'].iloc[0]}: 移除来源 {sorted(removed)}")

        primary = pick_primary(sources)
        base = grp.iloc[0].copy()
        base["source_cn"] = primary
        base["sources_all"] = "、".join(sources)
        base["source_count"] = len(sources)
        base["is_multi_source"] = len(sources) > 1
        rows.append(base)

    cleaned = pd.DataFrame(rows).reset_index(drop=True)
    cleaned["id"] = range(1, len(cleaned) + 1)
    return cleaned, logs


def export_xlsx(cleaned: pd.DataFrame) -> None:
    out = cleaned[
        [
            "id",
            "source_cn",
            "word",
            "first_year",
            "first_year_raw",
            "mw_recorded",
            "mw_note",
            "category_cn",
            "sources_all",
            "source_count",
            "is_multi_source",
        ]
    ].copy()
    out.columns = [
        "编号",
        "来源",
        "英语",
        "首次出现年份",
        "首次出现时间(原始)",
        "MW是否收录",
        "MW备注",
        "类别",
        "来源列表",
        "来源数量",
        "是否多来源",
    ]
    if not XLSX_BACKUP.exists():
        shutil.copy2(XLSX, XLSX_BACKUP)
    out.to_excel(XLSX, index=False)


def build_lang_stats(cleaned: pd.DataFrame) -> dict:
    lang_stats = {}
    for lang in SOURCE_PRIORITY:
        sub = cleaned[cleaned["source_cn"] == lang]
        if sub.empty:
            continue
        words = []
        for _, r in sub.iterrows():
            fy = r["first_year"]
            year_val = int(fy) if pd.notna(fy) and str(fy).replace(".", "").isdigit() else None
            if pd.notna(fy):
                try:
                    year_val = int(float(fy))
                except (ValueError, TypeError):
                    year_val = None
            all_src = [s.strip() for s in str(r["sources_all"]).split("、") if s.strip()]
            words.append(
                {
                    "word": r["word"],
                    "year": year_val,
                    "category": r["category_cn"],
                    "mw_included": bool(r["mw_recorded"]) if pd.notna(r["mw_recorded"]) else False,
                    "sources_all": all_src,
                    "is_multi_source": bool(r["is_multi_source"]),
                }
            )
        mw = sum(1 for w in words if w["mw_included"])
        years = [w["year"] for w in words if w["year"]]
        lang_stats[lang] = {
            "total": len(words),
            "mw_included": mw,
            "mw_rate": round(100 * mw / len(words), 1) if words else 0,
            "median_year": int(np.median(years)) if years else None,
            "words": words,
        }
    return lang_stats


def build_category_dist(cleaned: pd.DataFrame) -> dict:
    dist: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for _, r in cleaned.iterrows():
        dist[r["source_cn"]][r["category_cn"]] += 1
    return {lang: dict(cats) for lang, cats in dist.items()}


def build_sankey(cleaned: pd.DataFrame) -> dict:
    layers = ["制度层", "文化资本层", "身份层", "技术层", "食物层"]
    langs = sorted(cleaned["source_cn"].unique(), key=lambda x: SOURCE_PRIORITY.index(x) if x in SOURCE_PRIORITY else 99)
    nodes = [{"name": lang} for lang in langs] + [{"name": ly} for ly in layers] + [{"name": "英语词汇"}]
    link_counts: dict[tuple[str, str], int] = defaultdict(int)
    layer_totals: dict[str, int] = defaultdict(int)

    for _, r in cleaned.iterrows():
        lang = r["source_cn"]
        layer = category_to_layer(str(r["category_cn"]))
        link_counts[(lang, layer)] += 1
        layer_totals[layer] += 1

    links = [{"source": s, "target": t, "value": v} for (s, t), v in sorted(link_counts.items())]
    for layer in layers:
        if layer_totals[layer]:
            links.append({"source": layer, "target": "英语词汇", "value": layer_totals[layer]})

    return {"nodes": nodes, "links": links}


def build_latency(lang_stats: dict) -> list[dict]:
    items = []
    for lang, st in lang_stats.items():
        years = [w["year"] for w in st["words"] if w["year"]]
        if not years:
            continue
        items.append(
            {
                "lang": lang,
                "medianYear": int(np.median(years)),
                "firstQuartile": int(np.percentile(years, 25)),
                "thirdQuartile": int(np.percentile(years, 75)),
                "wordCount": st["total"],
                "mwRate": st["mw_rate"],
            }
        )
    return items


def build_treemap(lang_stats: dict) -> list[dict]:
    treemap = []
    for lang, st in lang_stats.items():
        treemap.append(
            {
                "name": lang,
                "value": st["total"],
                "mwRate": st["mw_rate"],
                "medianYear": st["median_year"],
            }
        )
    return treemap


def rebuild_bubble_wordcloud(viz: dict, cleaned: pd.DataFrame) -> None:
    primary_map = dict(zip(cleaned["word_key"], cleaned["source_cn"]))
    seen_bubble: set[str] = set()
    new_bubble = []
    for b in viz.get("bubbleData", []):
        wk = b["word"].lower()
        if wk in seen_bubble:
            continue
        seen_bubble.add(wk)
        if wk in primary_map:
            b = dict(b)
            b["lang"] = primary_map[wk]
        new_bubble.append(b)
    viz["bubbleData"] = new_bubble

    seen_wc: set[str] = set()
    new_wc = []
    for w in viz.get("wordcloud", []):
        wk = w["name"].lower()
        if wk in seen_wc:
            continue
        seen_wc.add(wk)
        if wk in primary_map:
            w = dict(w)
            w["lang"] = primary_map[wk]
        new_wc.append(w)
    viz["wordcloud"] = new_wc


def rebuild_streamgraph(viz: dict, cleaned: pd.DataFrame) -> None:
    long_files = sorted(OUT_DIR.glob("ngrams_long_*.csv"))
    if not long_files:
        return
    long_df = pd.read_csv(long_files[-1])
    long_df["word_key"] = long_df["word"].astype(str).str.strip().str.lower()
    lang_map = dict(zip(cleaned["word_key"], cleaned["source_cn"]))
    long_df = long_df[long_df["word_key"].isin(lang_map)]
    long_df["lang"] = long_df["word_key"].map(lang_map)
    long_df["ppm"] = long_df["frequency"] * 1e6

    decades = viz.get("decades", list(range(1800, 2001, 10)))
    streamgraph: dict[str, list[float]] = {lang: [] for lang in SOURCE_PRIORITY}

    for decade in decades:
        y0, y1 = decade, decade + 9
        chunk = long_df[(long_df["year"] >= y0) & (long_df["year"] <= y1)]
        if chunk.empty:
            for lang in streamgraph:
                streamgraph[lang].append(0.0)
            continue
        sums = chunk.groupby("lang")["ppm"].sum()
        for lang in streamgraph:
            streamgraph[lang].append(round(float(sums.get(lang, 0.0)), 2))

    viz["streamgraph"] = {k: v for k, v in streamgraph.items() if any(x > 0 for x in v)}


def popularity_from_ppm(freq: float, ref: list[float]) -> int:
    """将 bubble totalFreq (ppm) 映射为 1–100，供网络图节点大小使用。"""
    arr = np.log10(np.clip(ref, 1e-12, None))
    lo, hi = float(arr.min()), float(arr.max())
    if hi <= lo:
        return 50
    log_v = float(np.log10(max(freq, 1e-12)))
    return int(round((log_v - lo) / (hi - lo) * 99 + 1))


def build_network(cleaned: pd.DataFrame, bubble_data: list[dict], max_words: int = 40) -> dict:
    freq_map = {
        str(b["word"]).strip().lower(): float(b.get("totalFreq") or 0)
        for b in bubble_data
    }
    ref_freqs = [f for f in freq_map.values() if f > 0]
    lang_nodes = []
    for lang in SOURCE_PRIORITY:
        n = int((cleaned["source_cn"] == lang).sum())
        if n:
            lang_nodes.append(lang)

    per_lang = max(2, max_words // max(len(lang_nodes), 1))
    candidates: list[tuple[float, str, str, str]] = []

    for lang in lang_nodes:
        sub = cleaned[cleaned["source_cn"] == lang]
        rows: list[tuple[float, str, str, str]] = []
        for _, r in sub.iterrows():
            word = str(r["word"])
            wk = word.strip().lower()
            rows.append((freq_map.get(wk, 0.0), word, str(r["category_cn"]), lang))
        rows.sort(key=lambda x: -x[0])
        candidates.extend(rows[:per_lang])

    candidates.sort(key=lambda x: -x[0])
    candidates = candidates[:max_words]

    nodes = []
    links = []
    for lang in lang_nodes:
        n = int((cleaned["source_cn"] == lang).sum())
        nodes.append(
            {
                "id": lang,
                "name": lang,
                "category": "language",
                "value": n,
                "color": LANG_COLORS.get(lang, "#64748b"),
            }
        )

    used_ids: set[str] = set()
    for idx, (freq, word, cat, lang) in enumerate(candidates):
        base_id = f"{word}_{idx}".replace(" ", "_").replace("'", "")
        node_id = base_id
        suffix = 0
        while node_id in used_ids:
            suffix += 1
            node_id = f"{base_id}_{suffix}"
        used_ids.add(node_id)
        pop = popularity_from_ppm(freq, ref_freqs) if ref_freqs else 8
        nodes.append(
            {
                "id": node_id,
                "name": word,
                "category": cat,
                "value": pop,
                "color": LANG_COLORS.get(lang, "#64748b"),
            }
        )
        links.append({"source": lang, "target": node_id, "value": max(1, pop // 10)})

    return {"nodes": nodes, "links": links}


def build_sunburst(cleaned: pd.DataFrame) -> dict:
    children = []
    for lang in SOURCE_PRIORITY:
        sub = cleaned[cleaned["source_cn"] == lang]
        if sub.empty:
            continue
        cat_children = []
        for cat, grp in sub.groupby("category_cn", sort=False):
            cat_children.append(
                {
                    "name": cat,
                    "children": [{"name": str(r["word"]), "value": 1} for _, r in grp.iterrows()],
                }
            )
        children.append({"name": lang, "children": cat_children})
    return {"name": "饮食外来词", "children": children}


def build_radar(lang_stats: dict) -> list[dict]:
    if not lang_stats:
        return []
    max_total = max(st["total"] for st in lang_stats.values())
    max_cats = max(len({w["category"] for w in st["words"]}) for st in lang_stats.values())
    year_min, year_max = 1500, 2020
    items = []
    for lang in SOURCE_PRIORITY:
        if lang not in lang_stats:
            continue
        st = lang_stats[lang]
        years = [w["year"] for w in st["words"] if w["year"]]
        median = int(np.median(years)) if years else 1880
        cats = {w["category"] for w in st["words"]}
        modernity = round((median - year_min) / (year_max - year_min) * 100, 1)
        modernity = float(min(100, max(0, modernity)))
        items.append(
            {
                "lang": lang,
                "mwRate": st["mw_rate"],
                "wordCount": round(st["total"] / max_total * 100, 1),
                "modernity": modernity,
                "diversity": round(len(cats) / max_cats * 100, 1),
                "historicalDepth": round(100 - modernity, 1),
            }
        )
    return items


def build_boxplot(cleaned: pd.DataFrame) -> dict:
    result: dict = {}
    for lang in SOURCE_PRIORITY:
        sub = cleaned[(cleaned["source_cn"] == lang) & cleaned["first_year"].notna()]
        years: list[int] = []
        for y in sub["first_year"]:
            try:
                years.append(int(float(y)))
            except (ValueError, TypeError):
                continue
        if len(years) < 4:
            continue
        years.sort()
        q1, med, q3 = np.percentile(years, [25, 50, 75])
        iqr = q3 - q1
        lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        inliers = [y for y in years if lo <= y <= hi]
        outliers = [y for y in years if y < lo or y > hi]
        result[lang] = {
            "min": int(min(inliers) if inliers else min(years)),
            "q1": int(q1),
            "median": int(med),
            "q3": int(q3),
            "max": int(max(inliers) if inliers else max(years)),
            "outliers": outliers,
        }
    return result


def update_viz(cleaned: pd.DataFrame) -> None:
    viz = json.loads(VIZ_PATH.read_text(encoding="utf-8"))
    lang_stats = build_lang_stats(cleaned)
    viz["langStats"] = lang_stats
    viz["categoryDist"] = build_category_dist(cleaned)
    viz["sankey"] = build_sankey(cleaned)
    viz["latency"] = build_latency(lang_stats)
    viz["treemap"] = build_treemap(lang_stats)
    rebuild_bubble_wordcloud(viz, cleaned)
    rebuild_streamgraph(viz, cleaned)
    viz["network"] = build_network(cleaned, viz.get("bubbleData", []))
    viz["sunburst"] = build_sunburst(cleaned)
    viz["radar"] = build_radar(lang_stats)
    viz["boxplot"] = build_boxplot(cleaned)
    VIZ_PATH.write_text(json.dumps(viz, ensure_ascii=False, indent=2), encoding="utf-8")
    dist_viz = ROOT / "大数据可视化网页" / "app" / "dist" / "data" / "visualization_data.json"
    if dist_viz.parent.exists():
        dist_viz.write_text(json.dumps(viz, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    df = load_xlsx()
    cleaned, refine_logs = build_cleaned_df(df)
    export_xlsx(cleaned)
    update_viz(cleaned)

    multi_n = int(cleaned["is_multi_source"].sum())
    lines = [
        f"原始行数: {len(df)}",
        f"清洗后行数: {len(cleaned)}",
        f"去掉重复行: {len(df) - len(cleaned)}",
        f"多来源词（保留在「来源列表」）: {multi_n}",
        "",
        "剔除误标土耳其语:",
        *refine_logs[:50],
        f"... 共 {len(refine_logs)} 条" if len(refine_logs) > 50 else "",
        "",
        "各语种词数（主来源）:",
    ]
    for lang in SOURCE_PRIORITY:
        n = (cleaned["source_cn"] == lang).sum()
        if n:
            lines.append(f"  {lang}: {n}")

    REPORT.write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))
    print(f"\n已备份: {XLSX_BACKUP}")
    print(f"已更新: {XLSX}")
    print(f"已更新: {VIZ_PATH}")
    print(f"报告: {REPORT}")


if __name__ == "__main__":
    main()
