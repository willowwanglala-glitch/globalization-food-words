#!/usr/bin/env python3
"""导出 SPSS 检验 1（MW × Category）供网页展示。"""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
from scipy.stats import chi2_contingency

ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "spss_dataset_clean.csv"
OUT = ROOT / "大数据可视化网页" / "app" / "public" / "data" / "spss_mw_category.json"
DEMO_OUT = ROOT / "demo" / "data" / "spss_mw_category.json"

CAT5_MAP = {
    "饮品": "饮品",
    "茶": "饮品",
    "咖啡": "饮品",
    "菜品": "食物",
    "小吃": "食物",
    "主食": "食物",
    "面食": "食物",
    "汤": "食物",
    "火锅": "食物",
    "肉类": "食物",
    "海鲜": "食物",
    "食材": "食物",
    "蔬菜": "食物",
    "水果": "食物",
    "坚果": "食物",
    "发酵鱼": "食物",
    "生食": "食物",
    "乳制品": "食物",
    "植物": "食物",
    "药草/食材": "食物",
    "烘焙": "食物",
    "甜品": "食物",
    "糖果": "食物",
    "冰淇淋": "食物",
    "食品/餐": "食物",
    "街头小吃": "食物",
    "开胃菜": "食物",
    "三明治": "食物",
    "调味品": "技法/调味",
    "香料": "技法/调味",
    "酱料": "技法/调味",
    "蘸酱": "技法/调味",
    "调味酱": "技法/调味",
    "烹饪法": "技法/调味",
    "油炸": "技法/调味",
    "深炸料理": "技法/调味",
    "吃法": "技法/调味",
    "场所": "制度/身份",
    "制度": "制度/身份",
    "餐饮制度": "制度/身份",
    "职业": "制度/身份",
}


def chi_stats(tab: pd.DataFrame) -> dict:
    chi2, p, dof, exp = chi2_contingency(tab)
    low = int((exp < 5).sum())
    total = exp.size
    return {
        "chi2": round(float(chi2), 3),
        "df": int(dof),
        "p": float(p),
        "p_display": "< .001" if p < 0.001 else round(float(p), 4),
        "n_valid": int(tab.values.sum()),
        "cells_expected_lt5_pct": round(100 * low / total, 1),
        "min_expected": round(float(exp.min()), 2),
    }


def category_rows(df: pd.DataFrame, col: str, min_n: int = 1) -> list[dict]:
    rows = []
    for cat, g in df.groupby(col):
        if len(g) < min_n:
            continue
        mw = int((g["MW_Included"] == 1).sum())
        n = len(g)
        rows.append(
            {
                "category": cat,
                "mw_included": mw,
                "not_included": n - mw,
                "total": n,
                "mw_rate": round(100 * mw / n, 1),
            }
        )
    rows.sort(key=lambda x: -x["total"])
    return rows


def main() -> None:
    df = pd.read_csv(CSV)
    df["Cat5"] = df["Category"].map(lambda x: CAT5_MAP.get(x, "其他"))

    tab5 = pd.crosstab(df["Cat5"], df["MW_Included"])
    tab_raw = pd.crosstab(df["Category"], df["MW_Included"])

    payload = {
        "test": "MW_Included x Category",
        "description": "Pearson 卡方检验：Merriam-Webster 收录与否与语义类别的关联",
        "overall_mw_rate": round(100 * (df["MW_Included"] == 1).mean(), 1),
        "merged": {
            "label": "五类语义场",
            "categories": category_rows(df, "Cat5"),
            "chi_square": chi_stats(tab5),
        },
        "detailed": {
            "label": "细分类（样本≥8）",
            "categories": category_rows(df, "Category", min_n=8),
            "chi_square": chi_stats(tab_raw),
            "spss_note": "SPSS 全细分类输出：χ²=141.285，df=65，p<.001，78.8% 单元格期望频数<5",
        },
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=False, indent=2)
    OUT.write_text(text, encoding="utf-8")
    DEMO_OUT.parent.mkdir(parents=True, exist_ok=True)
    DEMO_OUT.write_text(text, encoding="utf-8")
    print(f"已导出 -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
