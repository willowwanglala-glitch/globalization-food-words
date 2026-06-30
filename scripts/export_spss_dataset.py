#!/usr/bin/env python3
"""从去重后的借词清单（662 词）导出 SPSS 用 CSV。"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "外来饮食借词清单_with_first_use.xlsx"
OUT_DIR = ROOT / "output"
OUT_CSV = ROOT / "spss_dataset_clean.csv"
LEGACY_CSV = ROOT / "spss_dataset.csv"


def find_summary() -> Path:
    files = sorted(OUT_DIR.glob("ngrams_summary_*.csv"))
    if not files:
        raise FileNotFoundError("未找到 output/ngrams_summary_*.csv，请先运行 ngram 抓取与汇总。")
    return files[-1]


def load_words() -> pd.DataFrame:
    df = pd.read_excel(XLSX)
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
    df["word_key"] = df["word"].astype(str).str.strip().str.lower()
    return df


def mw_to_int(val) -> int:
    if pd.isna(val):
        return 0
    if isinstance(val, bool):
        return int(val)
    s = str(val).strip().lower()
    if s in ("true", "1", "是", "yes"):
        return 1
    return 0


def main() -> None:
    words = load_words()
    summary = pd.read_csv(find_summary())
    summary["word_key"] = summary["word"].astype(str).str.strip().str.lower()
    summary = summary.drop_duplicates(subset="word_key", keep="first")

    merged = words.merge(
        summary[["word_key", "max_freq", "mean_freq", "non_zero_years"]],
        on="word_key",
        how="left",
    )
    if len(merged) != len(words):
        raise RuntimeError(f"合并后行数 {len(merged)} ≠ 词表 {len(words)}，请检查 word_key 重复。")

    out = pd.DataFrame(
        {
            "Source_Language": merged["source_cn"],
            "Word": merged["word"],
            "First_Use_Year": merged["first_year"],
            "MW_Included": merged["mw_recorded"].map(mw_to_int),
            "Category": merged["category_cn"],
            "Max_Frequency": merged["max_freq"],
            "Mean_Frequency": merged["mean_freq"],
            "Non_Zero_Years": merged["non_zero_years"],
            "Is_Multi_Source": merged["is_multi_source"].apply(
                lambda x: 1
                if x is True
                or str(x).lower() in ("true", "1")
                or (isinstance(x, (int, float)) and x > 0)
                else 0
            ),
            "Source_Count": merged["source_count"],
        }
    )

    # 与旧版 spss_dataset.csv 一致：按语料均值频率升序排列
    out = out.sort_values(
        ["Mean_Frequency", "Max_Frequency"],
        ascending=True,
        na_position="first",
    ).reset_index(drop=True)

    out.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")

    n = len(out)
    n_ngram = int(out["Max_Frequency"].notna().sum())
    n_mw = int(out["MW_Included"].sum())
    n_multi = int(out["Is_Multi_Source"].sum())

    print(f"已导出 -> {OUT_CSV.name}")
    print(f"  词数: {n}")
    print(f"  有 Ngram 频率: {n_ngram}")
    print(f"  MW 收录 (MW_Included=1): {n_mw}")
    print(f"  多来源 (Is_Multi_Source=1): {n_multi}")
    if LEGACY_CSV.exists():
        legacy_n = len(pd.read_csv(LEGACY_CSV))
        print(f"  旧版 {LEGACY_CSV.name}: {legacy_n} 行（去重前，请勿混用）")

    # 同步网页用 JSON
    web_script = Path(__file__).resolve().parent / "export_spss_web_json.py"
    if web_script.exists():
        import subprocess
        import sys

        subprocess.run([sys.executable, str(web_script)], check=False)


if __name__ == "__main__":
    main()
