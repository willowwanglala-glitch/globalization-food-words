#!/usr/bin/env python3
"""从实际数据挖掘可答辩的分析观点。"""
import json
import statistics as stats
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIZ = ROOT / "大数据可视化网页" / "app" / "public" / "data" / "visualization_data.json"
ML = ROOT / "大数据可视化网页" / "app" / "public" / "data" / "ml_results.json"
OUT = ROOT / "scripts" / "data_insights.txt"


def main() -> None:
    viz = json.loads(VIZ.read_text(encoding="utf-8"))
    ml = json.loads(ML.read_text(encoding="utf-8"))
    lines: list[str] = []

    def log(s: str = "") -> None:
        lines.append(s)
        print(s)

    # --- 1. MW vs 语料：「词典收录 ≠ 使用强度」---
    log("=" * 60)
    log("1. MW 收录 vs 语料频率（usage-institution gap）")
    mw_yes_freq, mw_no_freq = [], []
    mw_yes_recent, mw_no_recent = [], []
    bubble = {b["word"].lower(): b for b in viz["bubbleData"]}
    for st in viz["langStats"].values():
        for w in st["words"]:
            b = bubble.get(w["word"].lower())
            if not b:
                continue
            if w.get("mw_included"):
                mw_yes_freq.append(b["totalFreq"])
                mw_yes_recent.append(b["recentFreq"])
            else:
                mw_no_freq.append(b["totalFreq"])
                mw_no_recent.append(b["recentFreq"])
    if mw_yes_freq and mw_no_freq:
        log(f"  MW已收录 totalFreq 中位数: {stats.median(mw_yes_freq):.2f} ppm")
        log(f"  MW未收录 totalFreq 中位数: {stats.median(mw_no_freq):.2f} ppm")
        log(f"  MW已收录 recentFreq 中位数: {stats.median(mw_yes_recent):.4f} ppm")
        log(f"  MW未收录 recentFreq 中位数: {stats.median(mw_no_recent):.4f} ppm")

    # High freq but not in MW
    outliers_no_mw = []
    outliers_mw_low = []
    for st in viz["langStats"].values():
        lang = st.get("words") and st  # noqa
        for w in st["words"]:
            b = bubble.get(w["word"].lower())
            if not b:
                continue
            if not w.get("mw_included") and b["recentFreq"] > 0.5:
                outliers_no_mw.append((w["word"], b["recentFreq"], w.get("category")))
            if w.get("mw_included") and b["recentFreq"] < 0.01:
                outliers_mw_low.append((w["word"], b["recentFreq"], w.get("category")))
    log(f"  高频未收录(近期>0.5ppm): {sorted(outliers_no_mw, key=lambda x: -x[1])[:12]}")
    log(f"  已收录但极低频(近期<0.01): {sorted(outliers_mw_low, key=lambda x: x[1])[:12]}")

    # --- 2. 按语种：MW率 vs 语料强度 ---
    log("\n" + "=" * 60)
    log("2. 各语种 MW 收录率 vs 语料总频率（语种层面）")
    lang_corpus = defaultdict(lambda: {"freq": 0.0, "n": 0, "mw_rate": 0})
    for lang, st in viz["langStats"].items():
        lang_corpus[lang]["mw_rate"] = st["mw_rate"]
        for w in st["words"]:
            b = bubble.get(w["word"].lower())
            if b:
                lang_corpus[lang]["freq"] += b["totalFreq"]
                lang_corpus[lang]["n"] += 1
    ranked = sorted(
        lang_corpus.items(),
        key=lambda x: x[1]["freq"] / max(x[1]["n"], 1),
        reverse=True,
    )
    for lang, c in ranked:
        avg = c["freq"] / max(c["n"], 1)
        log(f"  {lang}: MW率{c['mw_rate']}% | 有语料词{c['n']}个 | 平均totalFreq {avg:.1f}")

    # --- 3. 土耳其语为何在桑基图最大 ---
    log("\n" + "=" * 60)
    log("3. 土耳其语 / 韩语等在桑基图中的类别构成")
    cd = viz.get("categoryDist", {})
    for lang in ["土耳其语", "韩语", "西班牙语", "法语", "日语", "印地语/乌尔都语"]:
        cats = cd.get(lang, {})
        if cats:
            top = sorted(cats.items(), key=lambda x: -x[1])[:6]
            log(f"  {lang}: {top}")

    # --- 4. 首次年份 vs 流行度（ML 回归）---
    log("\n" + "=" * 60)
    log("4. ML 回归特征重要性")
    reg = ml.get("regression", {})
    for fi in reg.get("feature_importance", []):
        log(f"  {fi['feature']}: {fi['importance']:.4f}")
    log(f"  R2={reg.get('r2')}, CV R2={reg.get('cv_r2_mean')}")

    # --- 5. 聚类模式 ---
    log("\n" + "=" * 60)
    log("5. K-Means 聚类语种构成（各簇源语言 Top5）")
    points = ml["clustering"]["points"]
    by_cl: dict[int, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for p in points:
        by_cl[p["cluster"]][p["source_lang"]] += 1
    for cl in ml["clustering"]["clusters"]:
        langs = sorted(by_cl[cl["id"]].items(), key=lambda x: -x[1])[:5]
        log(f"  簇{cl['id']} {cl['name']} (n={cl['count']}): {langs}")

    # --- 6. 20世纪后新词 vs 老词频率 ---
    log("\n" + "=" * 60)
    log("6. 首次年份分段 vs 语料表现")
    buckets = {"<1800": [], "1800-1899": [], "1900-1949": [], "1950+": []}
    for b in viz["bubbleData"]:
        y = b["year"]
        if y < 1800:
            buckets["<1800"].append(b)
        elif y < 1900:
            buckets["1800-1899"].append(b)
        elif y < 1950:
            buckets["1900-1949"].append(b)
        else:
            buckets["1950+"].append(b)
    for k, items in buckets.items():
        if items:
            med_r = stats.median([x["recentFreq"] for x in items])
            med_t = stats.median([x["totalFreq"] for x in items])
            log(f"  {k}: n={len(items)} | recent中位 {med_r:.3f} | total中位 {med_t:.1f}")

    # --- 7. Streamgraph 增长：哪些语种 1980-2000 抬升 ---
    log("\n" + "=" * 60)
    log("7. Streamgraph 语种频率变化（1980 vs 2000 年代）")
    decades = viz.get("decades", [])
    sg = viz.get("streamgraph", {})
    if decades and sg:
        i80 = next((i for i, d in enumerate(decades) if d >= 1980), None)
        i00 = next((i for i, d in enumerate(decades) if d >= 2000), None)
        if i80 is not None and i00 is not None:
            changes = []
            for lang, series in sg.items():
                if len(series) > i00:
                    delta = series[i00] - series[i80]
                    changes.append((lang, series[i80], series[i00], delta))
            for lang, v80, v00, d in sorted(changes, key=lambda x: -x[3])[:8]:
                log(f"  {lang}: {v80:.2f} -> {v00:.2f} ppm (Δ{d:+.2f})")

    # --- 8. 同词多来源 ---
    log("\n" + "=" * 60)
    log("8. 同词多来源（全球化多层溯源）")
    word_sources: dict[str, set[str]] = defaultdict(set)
    for lang, st in viz["langStats"].items():
        for w in st["words"]:
            word_sources[w["word"].lower()].add(lang)
    multi = [(w, list(s)) for w, s in word_sources.items() if len(s) > 1]
    log(f"  多来源词数: {len(multi)} / {len(word_sources)} 去重词")
    for w, s in sorted(multi, key=lambda x: -len(x[1]))[:10]:
        log(f"    {w}: {s}")

    # --- 9. 类别全局 MW 率 ---
    log("\n" + "=" * 60)
    log("9. 按清单类别的 MW 收录率")
    cat_mw: dict[str, dict[str, int]] = defaultdict(lambda: {"t": 0, "m": 0})
    for st in viz["langStats"].values():
        for w in st["words"]:
            cat = w.get("category", "未知")
            cat_mw[cat]["t"] += 1
            if w.get("mw_included"):
                cat_mw[cat]["m"] += 1
    for cat, c in sorted(cat_mw.items(), key=lambda x: -x[1]["t"]):
        if c["t"] >= 5:
            log(f"  {cat}: {100*c['m']/c['t']:.1f}% ({c['m']}/{c['t']})")

    # --- 10. case study 增长形态 ---
    log("\n" + "=" * 60)
    log("10. 典型案例轨迹形态（峰值年、近年/峰值比）")
    for word, cs in viz.get("caseStudies", {}).items():
        ts = cs.get("timeSeries", [])
        if len(ts) < 10:
            continue
        freqs = [p["freq"] for p in ts]
        peak = max(freqs)
        peak_year = ts[freqs.index(peak)]["year"]
        recent = freqs[-1]
        ratio = recent / peak if peak > 0 else 0
        log(f"  {word}: peak@{peak_year}={peak:.3f} recent={recent:.3f} recent/peak={ratio:.2f}")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    log(f"\n写入 {OUT}")


if __name__ == "__main__":
    main()
