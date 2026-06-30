#!/usr/bin/env python3
"""核对 ConclusionSection 中的硬编码论断与 visualization_data.json。"""

import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIZ = ROOT / "大数据可视化网页" / "app" / "public" / "data" / "visualization_data.json"


def main() -> None:
    viz = json.loads(VIZ.read_text(encoding="utf-8"))

    print("=== MW 收录率分层（按语种）===")
    tiers = {"70%+": [], "40-69%": [], "<40%": []}
    for lang, st in viz["langStats"].items():
        r = st["mw_rate"]
        if r >= 70:
            tiers["70%+"].append((lang, r, st["total"]))
        elif r >= 40:
            tiers["40-69%"].append((lang, r, st["total"]))
        else:
            tiers["<40%"].append((lang, r, st["total"]))
    for tier, items in tiers.items():
        print(tier, items)

    print("\n=== 按类别 MW 收录率 ===")
    cat_mw: dict[str, dict[str, int]] = defaultdict(lambda: {"total": 0, "mw": 0})
    for st in viz["langStats"].values():
        for w in st["words"]:
            cat = w.get("category", "未知")
            cat_mw[cat]["total"] += 1
            if w.get("mw_included"):
                cat_mw[cat]["mw"] += 1

    institution_like = {"制度", "餐饮制度", "其他", "烹饪法"}
    food_like = {
        "饮品", "调味品", "水果", "甜品", "食材", "蔬菜", "主食",
        "菜品", "肉类", "海鲜", "烘焙", "面食", "汤", "小吃",
        "坚果", "乳制品", "香料", "油炸", "豆制品",
    }
    inst_t, inst_m = 0, 0
    food_t, food_m = 0, 0
    for cat, c in cat_mw.items():
        if cat in institution_like:
            inst_t += c["total"]
            inst_m += c["mw"]
        if cat in food_like or cat in cat_mw:
            if cat in food_like:
                food_t += c["total"]
                food_m += c["mw"]
    print(f"制度类(近似) MW率: {inst_m}/{inst_t} = {100*inst_m/inst_t:.1f}%")
    print(f"食物类(近似) MW率: {food_m}/{food_t} = {100*food_m/food_t:.1f}%")

    print("\n=== semanticLayers 树 ===")
    sl = viz.get("semanticLayers", {})

    def print_tree(node, depth=0):
        name = node.get("name", "")
        val = node.get("value", 0)
        print("  " * depth + f"{name}: {val}")
        for ch in node.get("children", []):
            print_tree(ch, depth + 1)

    if sl:
        print_tree(sl)

    print("\n=== latency 字段（是否为潜伏期需对照生成逻辑）===")
    for item in sorted(viz["latency"], key=lambda x: x["medianYear"]):
        spread = item["thirdQuartile"] - item["firstQuartile"]
        print(
            f"{item['lang']}: medianYear={item['medianYear']}, "
            f"Q1={item['firstQuartile']}, Q3={item['thirdQuartile']}, "
            f"spread={spread}, mwRate={item['mwRate']}%"
        )

    print("\n=== 法语 vs 西班牙语 按 categoryDist ===")
    cd = viz.get("categoryDist", {})
    fr = cd.get("法语", {})
    es = cd.get("西班牙语", {})
    print("法语 categories:", dict(sorted(fr.items(), key=lambda x: -x[1])[:10]))
    print("西班牙语 categories:", dict(sorted(es.items(), key=lambda x: -x[1])[:10]))

    print("\n=== bubble 词频对比 ===")
    bubble = {b["word"].lower(): b for b in viz["bubbleData"]}
    for w in ["salsa", "cuisine", "taco", "restaurant", "pizza"]:
        b = bubble.get(w)
        if b:
            print(w, "recentFreq=", b.get("recentFreq"), "totalFreq=", b.get("totalFreq"))

    print("\n=== 为何 bubble 350 / wordcloud 682 ===")
    all_rows = sum(s["total"] for s in viz["langStats"].values())
    unique = set()
    for st in viz["langStats"].values():
        for w in st["words"]:
            unique.add(w["word"].lower())
    wc_words = {w["name"].lower() for w in viz["wordcloud"]}
    bub_words = set(bubble.keys())
    print("rows", all_rows, "unique", len(unique))
    print("wordcloud unique names", len(wc_words))
    print("bubble unique", len(bub_words))
    print("unique not in bubble", len(unique - bub_words))
    print("rows not in bubble (approx)", all_rows - len(bub_words))


if __name__ == "__main__":
    main()
