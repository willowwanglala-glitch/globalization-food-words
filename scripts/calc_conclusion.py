#!/usr/bin/env python3
"""计算结论区关键数字，输出到 conclusion_stats.txt"""
import json
import statistics as stats
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts" / "conclusion_stats.txt"
VIZ = ROOT / "大数据可视化网页" / "app" / "public" / "data" / "visualization_data.json"


def main() -> None:
    viz = json.loads(VIZ.read_text(encoding="utf-8"))
    lines: list[str] = []

    def log(s: str = "") -> None:
        lines.append(s)
        print(s)

    # --- MW tiers ---
    log("=== MW 收录率分层 ===")
    for tier_name, lo, hi in [("70%+", 70, 100), ("40-69%", 40, 69.9), ("<40%", 0, 39.9)]:
        items = [
            (lang, st["mw_rate"], st["total"])
            for lang, st in viz["langStats"].items()
            if lo <= st["mw_rate"] <= hi
        ]
        log(f"{tier_name}: {', '.join(f'{l}({r}%)' for l, r, _ in sorted(items, key=lambda x: -x[1]))}")

    # --- MW by semantic layer category ---
    institution_cats = {"制度", "餐饮制度", "职业", "场所", "烹饪法"}
    food_cats = {
        "饮品", "调味品", "水果", "甜品", "食材", "蔬菜", "主食",
        "菜品", "肉类", "海鲜", "烘焙", "面食", "汤", "小吃",
        "坚果", "乳制品", "香料", "油炸", "豆制品", "小菜",
    }
    cat_mw: dict[str, dict[str, int]] = defaultdict(lambda: {"t": 0, "m": 0})
    for st in viz["langStats"].values():
        for w in st["words"]:
            cat = w.get("category", "未知")
            cat_mw[cat]["t"] += 1
            if w.get("mw_included"):
                cat_mw[cat]["m"] += 1

    inst_t, inst_m = 0, 0
    food_t, food_m = 0, 0
    for cat, c in cat_mw.items():
        if cat in institution_cats:
            inst_t += c["t"]
            inst_m += c["m"]
        elif cat in food_cats or cat not in institution_cats:
            food_t += c["t"]
            food_m += c["m"]

    log("\n=== MW 按语义场（近似）===")
    log(f"制度/场所/职业类: {inst_m}/{inst_t} = {100 * inst_m / inst_t:.1f}%")
    log(f"食物相关类: {food_m}/{food_t} = {100 * food_m / food_t:.1f}%")

    # --- Sankey 135:1 ---
    sankey = viz.get("sankey", {})
    nodes = {n["name"]: n for n in sankey.get("nodes", [])}
    links = sankey.get("links", [])

    # count flow by lang to layer
    layer_langs: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    for link in links:
        src = link.get("source")
        tgt = link.get("target")
        val = link.get("value", 0)
        # nodes may be index or name
        if isinstance(src, int):
            src_name = sankey["nodes"][src]["name"]
            tgt_name = sankey["nodes"][tgt]["name"]
        else:
            src_name = src
            tgt_name = tgt
        if tgt_name in ("制度层", "文化资本层", "身份层", "技术层", "食物层"):
            layer_langs[tgt_name][src_name] += val

    log("\n=== Sankey 各层语种流量 ===")
    for layer in ["制度层", "文化资本层", "身份层", "技术层", "食物层"]:
        langs = layer_langs.get(layer, {})
        if langs:
            sorted_langs = sorted(langs.items(), key=lambda x: -x[1])
            log(f"{layer}: {dict(sorted_langs)}")
            fr = langs.get("法语", 0)
            es = langs.get("西班牙语", 0)
            if fr and es:
                log(f"  法语:西班牙语 = {fr}:{es} = {fr/es:.1f}:1")

    # institution layer fr vs es specifically
    inst = layer_langs.get("制度层", {})
    fr_inst = inst.get("法语", 0)
    es_inst = inst.get("西班牙语", 0)
    if fr_inst and es_inst:
        log(f"\n制度层 法语:西班牙语 = {fr_inst}:{es_inst} = {fr_inst/es_inst:.0f}:1")
    food = layer_langs.get("食物层", {})
    fr_food = food.get("法语", 0)
    es_food = food.get("西班牙语", 0)
    if fr_food and es_food:
        log(f"食物层 法语:西班牙语 = {fr_food}:{es_food} = 1:{es_food/fr_food:.0f}")

    # --- Latency: medianYear is NOT latency ---
    log("\n=== latency 字段实为「中位数首次年份」===")
    for item in sorted(viz["latency"], key=lambda x: x["medianYear"]):
        log(f"{item['lang']}: medianYear={item['medianYear']}")

    # Compute real latency from caseStudies timeSeries if possible
    log("\n=== 从 caseStudies 估算「起飞潜伏期」(首年→频率达峰值10%之年) ===")
    for word, cs in viz.get("caseStudies", {}).items():
        ts = cs.get("timeSeries", [])
        if not ts:
            continue
        fy = cs.get("firstUse")
        freqs = [p["freq"] for p in ts]
        peak = max(freqs)
        if peak <= 0 or not fy:
            continue
        threshold = peak * 0.1
        takeoff = None
        for p in ts:
            if p["year"] >= fy and p["freq"] >= threshold:
                takeoff = p["year"]
                break
        if takeoff:
            log(f"{word}: first={fy} takeoff={takeoff} latency={takeoff - fy}y")

    # --- Bubble freq comparison ---
    bubble = {b["word"].lower(): b for b in viz["bubbleData"]}
    log("\n=== 近期频率对比 (ppm) ===")
    pairs = [
        ("salsa", "cuisine"),
        ("taco", "restaurant"),
        ("pizza", "cuisine"),
    ]
    for a, b in pairs:
        ba, bb = bubble.get(a), bubble.get(b)
        if ba and bb:
            log(
                f"{a} recent={ba.get('recentFreq'):.2f} total={ba.get('totalFreq'):.2f} | "
                f"{b} recent={bb.get('recentFreq'):.2f} total={bb.get('totalFreq'):.2f} | "
                f"recent ratio {a}/{b}={ba.get('recentFreq')/bb.get('recentFreq'):.2f}"
            )

    # --- Coverage ---
    all_rows = sum(s["total"] for s in viz["langStats"].values())
    unique = set()
    for st in viz["langStats"].values():
        for w in st["words"]:
            unique.add(w["word"].lower())
    bub_words = {b["word"].lower() for b in viz["bubbleData"]}
    wc_words = {w["name"].lower() for w in viz["wordcloud"]}
    log("\n=== 数据覆盖 ===")
    log(f"清单记录 {all_rows} | 去重词 {len(unique)}")
    log(f"bubble {len(viz['bubbleData'])} 条 / 去重 {len(bub_words)}")
    log(f"wordcloud {len(viz['wordcloud'])} 条 / 去重 {len(wc_words)}")
    log(f"有 ngram 未进 bubble 的去重词: {len(unique - bub_words)}")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    log(f"\n已写入 {OUT}")


if __name__ == "__main__":
    main()
