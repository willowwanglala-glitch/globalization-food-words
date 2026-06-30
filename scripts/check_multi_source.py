# -*- coding: utf-8 -*-
import pandas as pd
from collections import defaultdict
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "外来饮食借词清单_with_first_use.xlsx"
df = pd.read_excel(p)
src_col, word_col = df.columns[1], df.columns[2]
df["word_key"] = df[word_col].astype(str).str.strip().str.lower()

word_sources = defaultdict(set)
for _, r in df.iterrows():
    w = r["word_key"]
    if w and w != "nan":
        word_sources[w].add(str(r[src_col]).strip())

multi = {w: sorted(s) for w, s in word_sources.items() if len(s) > 1}
out = Path(__file__).resolve().parent / "multi_source_words.txt"

lines = [
    f"总行数: {len(df)}",
    f"去重英文词: {len(word_sources)}",
    f"多来源词: {len(multi)}",
    f"因多来源多出的行: {sum(len(word_sources[w]) for w in multi) - len(multi)}",
    "",
    "各来源语种行数:",
]
for lang, n in df[src_col].value_counts().sort_index().items():
    lines.append(f"  {lang}: {n}")

lines.append("\n=== 4个来源 ===")
for w, langs in sorted(multi.items(), key=lambda x: -len(x[1])):
    if len(langs) >= 4:
        lines.append(f"{w}: {langs}")

lines.append("\n=== 日韩汉重叠词 ===")
east = {"日语", "汉语", "韩语"}
for w, langs in sorted(multi.items()):
    if east.issubset(set(langs)):
        lines.append(f"{w}: {langs}")

lines.append("\n=== 土耳其语+日韩汉 任二重叠 (示例) ===")
for w, langs in sorted(multi.items()):
    ls = set(langs)
    if "土耳其语" in ls and (ls & east):
        lines.append(f"{w}: {langs}")

lines.append("\n=== 最常见语种对共现 ===")
pair_cnt = defaultdict(int)
for w, langs in multi.items():
    ls = sorted(langs)
    for i in range(len(ls)):
        for j in range(i + 1, len(ls)):
            pair_cnt[(ls[i], ls[j])] += 1
for pair, n in sorted(pair_cnt.items(), key=lambda x: -x[1])[:20]:
    lines.append(f"  {pair[0]} + {pair[1]}: {n}")

out.write_text("\n".join(lines), encoding="utf-8")
print(out)
