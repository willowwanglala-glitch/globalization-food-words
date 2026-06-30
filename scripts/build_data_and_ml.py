#!/usr/bin/env python3
"""合并借词清单 + Google Ngram 数据，训练 ML 模型并导出 demo 用 JSON/JS。"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, confusion_matrix, r2_score, silhouette_score
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "外来饮食借词清单_with_first_use.xlsx"
OUT_DIR = ROOT / "output"
DEMO_DATA = ROOT / "demo" / "data"
REACT_DATA = ROOT / "大数据可视化网页" / "app" / "public" / "data"

LANG_MAP = {
    "土耳其语": "Turkish",
    "韩语": "Korean",
    "纳瓦特尔语": "Nahuatl",
    "阿拉伯语": "Arabic",
    "印地语/乌尔都语": "Hindi",
    "西班牙语": "Spanish",
    "意大利语": "Italian",
    "法语": "French",
    "波斯语": "Persian",
    "日语": "Japanese",
    "德语": "German",
    "汉语": "Chinese",
    "荷兰语": "Dutch",
}

CAT_MAP = {
    "饮品": "beverage",
    "调味品": "condiment",
    "水果": "fruit",
    "甜品": "sweet",
    "食材": "ingredient",
    "蔬菜": "vegetable",
    "主食": "staple",
    "菜品": "dish",
    "肉类": "meat",
    "海鲜": "seafood",
    "烘焙": "bakery",
    "面食": "noodle",
    "汤": "soup",
    "烹饪法": "cooking",
    "小吃": "snack",
    "坚果": "nut",
    "乳制品": "dairy",
    "香料": "spice",
    "其他": "other",
}

CLUSTER_NAMES = {
    0: ("经典高频型", "进入英语较早、语料频率高且长期稳定"),
    1: ("后期爆发型", "20 世纪后快速上升，与餐饮全球化同步"),
    2: ("低频长尾型", "已进入词典但日常语料中出现极少"),
    3: ("稳步渗透型", "频率中等、逐年缓慢增长"),
}

CLUSTER_COLORS = ["#3498db", "#e74c3c", "#95a5a6", "#2ecc71"]


def find_output_files() -> tuple[Path, Path]:
    long_files = sorted(OUT_DIR.glob("ngrams_long_*.csv"))
    summary_files = sorted(OUT_DIR.glob("ngrams_summary_*.csv"))
    if not long_files or not summary_files:
        raise FileNotFoundError("请在 output/ 下放置 ngrams_long 与 ngrams_summary CSV")
    return long_files[-1], summary_files[-1]


def popularity_from_freq(freq: float, ref: pd.Series) -> int:
    log_all = np.log10(ref.clip(lower=1e-12))
    lo, hi = log_all.min(), log_all.max()
    if hi <= lo:
        return 50
    log_v = np.log10(max(freq, 1e-12))
    return int(round((log_v - lo) / (hi - lo) * 99 + 1))


def build_words_df(xlsx_df: pd.DataFrame, summary_df: pd.DataFrame) -> pd.DataFrame:
    words = xlsx_df.copy()
    # 清洗后 xlsx 可能含「来源列表」等附加列，仅取核心 8 列
    if len(words.columns) > 8:
        words = words.iloc[:, :8]
    words.columns = [
        "id",
        "source_cn",
        "word",
        "first_year",
        "first_year_raw",
        "mw_recorded",
        "mw_note",
        "category_cn",
    ]
    words["first_year"] = pd.to_numeric(words["first_year"], errors="coerce")
    words["word_key"] = words["word"].str.strip().str.lower()
    summary = summary_df.copy()
    summary["word_key"] = summary["word"].str.strip().str.lower()

    merged = words.merge(summary, on="word_key", how="left", suffixes=("", "_ngram"))
    merged["source_lang"] = merged["source_cn"].map(LANG_MAP).fillna("Other")
    merged["category"] = merged["category_cn"].map(CAT_MAP).fillna("other")
    merged["display_word"] = merged["word"]

    ref_freq = merged["max_freq"].dropna()
    merged["popularity"] = merged["max_freq"].apply(
        lambda f: popularity_from_freq(f, ref_freq) if pd.notna(f) else 8
    )

    out = merged[
        merged["first_year"].notna() & merged["word"].notna()
    ].copy()
    out = out.sort_values("id")
    out = out.drop_duplicates(subset="word_key", keep="first")
    out["first_year"] = out["first_year"].astype(int)
    return out


def words_records(df: pd.DataFrame) -> list[dict]:
    records = []
    for _, r in df.iterrows():
        records.append(
            {
                "word": r["display_word"],
                "first_year": int(r["first_year"]),
                "source_lang": r["source_lang"],
                "popularity": int(r["popularity"]),
                "category": r["category"],
            }
        )
    return records


def label_clusters(
    labels: np.ndarray,
    available: list[str],
    pivot: pd.DataFrame,
    k: int,
) -> dict[int, tuple[str, str]]:
    """根据轨迹形态为每个簇生成中文名称。"""
    stats = []
    for c in range(k):
        keys = [available[i] for i, lab in enumerate(labels) if lab == c]
        curves = pivot.loc[keys]
        mean_curve = curves.mean(axis=0).values
        early = float(np.mean(mean_curve[:25]))
        late = float(np.mean(mean_curve[-25:]))
        growth = late / max(early, 1e-15)
        peak = float(np.max(mean_curve))
        stats.append({"id": c, "peak": peak, "growth": growth, "size": len(keys)})

    by_peak = sorted(stats, key=lambda x: -x["peak"])
    by_growth = sorted(stats, key=lambda x: -x["growth"])

    names: dict[int, tuple[str, str]] = {}
    top_peak = by_peak[0]["id"]
    names[top_peak] = ("经典高频型", "语料频率高、长期稳定出现在英语书面语中")

    low_peak_ids = {s["id"] for s in by_peak[-2:]}
    for s in stats:
        cid = s["id"]
        if cid in names:
            continue
        if s["id"] == by_growth[0]["id"] and s["growth"] > 5:
            names[cid] = ("后期爆发型", "20 世纪后频率陡升，与餐饮全球化浪潮同步")
        elif cid in low_peak_ids:
            names[cid] = ("低频长尾型", "已进入英语但语料出现频率极低")
        else:
            names[cid] = ("稳步渗透型", "频率中等、随时间缓慢爬升")

    for cid in range(k):
        if cid not in names:
            names[cid] = ("稳步渗透型", "频率中等、随时间缓慢爬升")
    return names


def run_clustering(long_df: pd.DataFrame, words_df: pd.DataFrame) -> dict:
    pivot = long_df.pivot_table(index="word", columns="year", values="frequency", aggfunc="mean")
    pivot.index = pivot.index.str.strip().str.lower()
    keys = words_df["word_key"].unique()
    available = [k for k in keys if k in pivot.index]
    X = pivot.loc[available].values
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    k = 4
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = km.fit_predict(X_scaled)
    sil = float(silhouette_score(X_scaled, labels))

    pca = PCA(n_components=2, random_state=42)
    coords = pca.fit_transform(X_scaled)

    meta = words_df.drop_duplicates("word_key").set_index("word_key")
    points = []
    for i, key in enumerate(available):
        row = meta.loc[key]
        if isinstance(row, pd.DataFrame):
            row = row.iloc[0]
        points.append(
            {
                "word": row["display_word"],
                "word_key": key,
                "cluster": int(labels[i]),
                "pca1": round(float(coords[i, 0]), 4),
                "pca2": round(float(coords[i, 1]), 4),
                "source_lang": row["source_lang"],
                "category": row["category"],
                "first_year": int(row["first_year"]),
                "popularity": int(row["popularity"]),
            }
        )

    names_map = label_clusters(labels, available, pivot.loc[available], k)

    years = list(pivot.columns)
    centroid_curves = []
    for c in range(k):
        mask = labels == c
        mean_curve = pivot.loc[available][mask].mean(axis=0).values
        centroid_curves.append(
            {
                "cluster": c,
                "name": names_map[c][0],
                "years": [int(y) for y in years],
                "values": [float(v) for v in mean_curve],
            }
        )

    clusters_meta = []
    for c in range(k):
        name, desc = names_map[c]
        cnt = int((labels == c).sum())
        examples = [
            p["word"]
            for p in sorted(
                [p for p in points if p["cluster"] == c],
                key=lambda x: -x["popularity"],
            )[:8]
        ]
        clusters_meta.append(
            {
                "id": c,
                "name": name,
                "description": desc,
                "color": CLUSTER_COLORS[c],
                "count": cnt,
                "examples": examples,
            }
        )

    return {
        "method": "KMeans",
        "k": k,
        "silhouette": round(sil, 4),
        "pca_explained_variance": [
            round(float(v), 4) for v in pca.explained_variance_ratio_
        ],
        "clusters": clusters_meta,
        "points": points,
        "centroid_curves": centroid_curves,
    }


def run_regression(words_df: pd.DataFrame) -> dict:
    df = words_df.dropna(subset=["max_freq", "mean_freq", "non_zero_years"]).copy()
    if len(df) < 50:
        return {"skipped": True, "reason": "样本不足"}

    df["word_len"] = df["word"].str.len()
    le_lang = LabelEncoder()
    df["lang_code"] = le_lang.fit_transform(df["source_lang"])
    y = np.log10(df["max_freq"].clip(lower=1e-15)).values

    feature_names = [
        "first_year",
        "mean_freq",
        "non_zero_years",
        "word_len",
        "lang_code",
    ]
    X = df[feature_names].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42
    )
    reg = RandomForestRegressor(n_estimators=200, random_state=42, max_depth=12)
    reg.fit(X_train, y_train)
    pred = reg.predict(X_test)
    r2 = float(r2_score(y_test, pred))
    cv = cross_val_score(reg, X, y, cv=5, scoring="r2")

    importance = sorted(
        zip(feature_names, reg.feature_importances_),
        key=lambda x: -x[1],
    )

    scatter = []
    for i in range(len(y_test)):
        scatter.append(
            {
                "actual": round(float(y_test[i]), 4),
                "predicted": round(float(pred[i]), 4),
            }
        )

    return {
        "target": "log10(max_freq)",
        "model": "RandomForestRegressor",
        "n_samples": len(df),
        "r2": round(r2, 4),
        "cv_r2_mean": round(float(cv.mean()), 4),
        "cv_r2_std": round(float(cv.std()), 4),
        "features": feature_names,
        "feature_importance": [
            {"feature": f, "importance": round(float(v), 4)} for f, v in importance
        ],
        "scatter": scatter,
    }


def run_classification(words_df: pd.DataFrame) -> dict:
    df = words_df.dropna(subset=["max_freq", "mean_freq", "non_zero_years"]).copy()
    if len(df) < 50:
        return {"skipped": True, "reason": "样本不足"}

    df["word_len"] = df["word"].str.len()
    le_lang = LabelEncoder()
    le_cat = LabelEncoder()
    df["lang_code"] = le_lang.fit_transform(df["source_lang"])
    y = le_cat.fit_transform(df["category"])

    feature_names = [
        "first_year",
        "max_freq",
        "mean_freq",
        "non_zero_years",
        "word_len",
        "lang_code",
    ]
    X = df[feature_names].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )
    clf = RandomForestClassifier(n_estimators=200, random_state=42, max_depth=12)
    clf.fit(X_train, y_train)
    pred = clf.predict(X_test)
    acc = float(accuracy_score(y_test, pred))
    cv = cross_val_score(clf, X, y, cv=5, scoring="accuracy")
    cm = confusion_matrix(y_test, pred)
    labels = list(le_cat.classes_)

    importance = sorted(
        zip(feature_names, clf.feature_importances_),
        key=lambda x: -x[1],
    )

    return {
        "target": "category",
        "model": "RandomForestClassifier",
        "n_samples": len(df),
        "accuracy": round(acc, 4),
        "cv_accuracy_mean": round(float(cv.mean()), 4),
        "cv_accuracy_std": round(float(cv.std()), 4),
        "features": feature_names,
        "feature_importance": [
            {"feature": f, "importance": round(float(v), 4)} for f, v in importance
        ],
        "labels": labels,
        "confusion_matrix": cm.tolist(),
    }


def write_js(path: Path, var_name: str, data: object) -> None:
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    path.write_text(f"const {var_name} = {payload};\n", encoding="utf-8")


def main() -> None:
    long_path, summary_path = find_output_files()
    print(f"使用 long: {long_path.name}")
    print(f"使用 summary: {summary_path.name}")

    xlsx_df = pd.read_excel(XLSX)
    summary_df = pd.read_csv(summary_path)
    long_df = pd.read_csv(long_path)

    words_df = build_words_df(xlsx_df, summary_df)
    records = words_records(words_df)

    clustering = run_clustering(long_df, words_df)
    regression = run_regression(words_df)
    classification = run_classification(words_df)

    ml_results = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "sources": {
            "word_list": XLSX.name,
            "ngrams_long": long_path.name,
            "ngrams_summary": summary_path.name,
        },
        "stats": {
            "word_list_rows": len(xlsx_df),
            "words_with_ngrams": int(words_df["max_freq"].notna().sum()),
            "words_exported": len(records),
            "year_range_ngrams": [
                int(long_df["year"].min()),
                int(long_df["year"].max()),
            ],
        },
        "clustering": clustering,
        "regression": regression,
        "classification": classification,
        "narrative": [
            "K-Means 将 1800–2020 年语料频率轨迹聚为 4 类，揭示借词「进入英语后的生命历程」差异。",
            "随机森林回归用首次年份、语料统计与源语言预测 log(峰值频率)，量化借词流行潜力。",
        ],
    }

    DEMO_DATA.mkdir(parents=True, exist_ok=True)
    write_js(DEMO_DATA / "words.js", "WORDS_DATA", records)
    write_js(DEMO_DATA / "ml_results.js", "ML_DATA", ml_results)
    (DEMO_DATA / "words.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (DEMO_DATA / "ml_results.json").write_text(
        json.dumps(ml_results, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    REACT_DATA.mkdir(parents=True, exist_ok=True)
    (REACT_DATA / "ml_results.json").write_text(
        json.dumps(ml_results, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"导出 {len(records)} 条词汇 -> demo/data/words.js")
    print(f"ML 结果 -> 大数据可视化网页/app/public/data/ml_results.json")
    print(f"聚类 silhouette={clustering['silhouette']}")
    if not classification.get("skipped"):
        print(
            f"分类准确率={classification['accuracy']}, "
            f"CV={classification['cv_accuracy_mean']}"
        )
    if not regression.get("skipped"):
        print(f"回归 R2={regression['r2']}, CV R2={regression['cv_r2_mean']}")


if __name__ == "__main__":
    main()
