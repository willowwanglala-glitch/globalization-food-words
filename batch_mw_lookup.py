#!/usr/bin/env python3
"""
批量查询 Merriam-Webster Collegiate Dictionary API，获取每个词的首次出现时间。
使用说明：
    1. 在 https://www.dictionaryapi.com/register/index 注册并获取 API Key
    2. 将 API Key 填入本脚本第 20 行的 MW_API_KEY 变量
    3. 运行：python3 batch_mw_lookup.py
    4. 结果会输出到同目录下的 外来饮食借词清单_with_first_use.xlsx
"""

import pandas as pd
import requests
import time
import re
import os
from datetime import datetime

# ===================== 用户配置 =====================
MW_API_KEY = "326fcb6f-0363-4245-bb13-c6f455566e1f"   # <-- 请替换为你的 Merriam-Webster API Key
INPUT_FILE = r"E:\广工\学生\26春\17大数据及其可视化\外来饮食借词清单.xlsx"
OUTPUT_FILE = r"E:\广工\学生\26春\17大数据及其可视化\外来饮食借词清单_with_first_use.xlsx"
BASE_URL = "https://www.dictionaryapi.com/api/v3/references/collegiate/json/"
DELAY_SECONDS = 0.6   # 每次请求间隔，避免触发限流
# ===================================================


def extract_year_from_date(date_str):
    """
    从 Merriam-Webster 的 date 字段中提取年份或世纪。
    常见格式：
        "1611{ds||3||}"  -> 1611
        "15c"            -> 15th century
        "before 12c"     -> before 12th century
        "circa 1900"     -> circa 1900
    """
    if not date_str or not isinstance(date_str, str):
        return None, None

    # 去掉 MW 的标记 {ds||x||}
    cleaned = re.sub(r"\{[^}]*\}", "", date_str).strip()

    # 尝试提取四位数年份
    year_match = re.search(r"\b(\d{4})\b", cleaned)
    if year_match:
        year = int(year_match.group(1))
        return year, cleaned

    # 尝试提取世纪格式，如 "12c" 或 "12th century"
    century_match = re.search(r"(\d{1,2})(?:th|rd|nd|st)?\s*c(?:entury)?", cleaned, re.IGNORECASE)
    if century_match:
        century = int(century_match.group(1))
        return f"{century}世纪", cleaned

    # 其他格式原样返回
    return None, cleaned


def query_merriam_webster(word):
    """
    查询 Merriam-Webster API，返回首次出现时间和原始 date 字符串。
    """
    url = f"{BASE_URL}{word}?key={MW_API_KEY}"
    try:
        response = requests.get(url, timeout=15)
        if response.status_code == 200:
            data = response.json()

            # MW API 有时返回建议列表而非词条详情
            if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                # 取第一个匹配的词条
                entry = data[0]
                raw_date = entry.get("date")
                year, display = extract_year_from_date(raw_date)
                return {
                    "mw_found": True,
                    "first_use_year": year,
                    "first_use_raw": display,
                    "etymology": entry.get("et", ""),
                }
            else:
                return {
                    "mw_found": False,
                    "first_use_year": None,
                    "first_use_raw": None,
                    "etymology": None,
                    "note": "MW 未收录或返回建议列表",
                }
        else:
            return {
                "mw_found": False,
                "first_use_year": None,
                "first_use_raw": None,
                "etymology": None,
                "note": f"HTTP {response.status_code}",
            }
    except Exception as e:
        return {
            "mw_found": False,
            "first_use_year": None,
            "first_use_raw": None,
            "etymology": None,
            "note": f"异常: {str(e)}",
        }


def main():
    if MW_API_KEY == "YOUR_API_KEY_HERE":
        print("❌ 错误：请先在脚本中填入你的 Merriam-Webster API Key！")
        print("   获取地址: https://www.dictionaryapi.com/register/index")
        return

    if not os.path.exists(INPUT_FILE):
        print(f"❌ 找不到输入文件: {INPUT_FILE}")
        return

    # 读取原始数据
    df = pd.read_excel(INPUT_FILE)
    print(f"✅ 已读取输入文件，共 {len(df)} 条记录")
    print(f"   列名: {list(df.columns)}")

    # 确保存在 '英文' 列
    if "英文" not in df.columns:
        print("❌ 输入文件中找不到 '英文' 列，请检查列名")
        return

    # 准备结果列
    results = {
        "first_use_year": [],
        "first_use_display": [],
        "mw_found": [],
        "mw_note": [],
    }

    words = df["英文"].astype(str).tolist()
    total = len(words)

    print(f"\n🚀 开始批量查询 Merriam-Webster API（间隔 {DELAY_SECONDS}s）...")
    print("-" * 50)

    for idx, word in enumerate(words, 1):
        # 跳过空值或 nan
        if word.lower() in ("nan", "none", ""):
            results["first_use_year"].append(None)
            results["first_use_display"].append(None)
            results["mw_found"].append(False)
            results["mw_note"].append("空值跳过")
            continue

        result = query_merriam_webster(word)
        results["first_use_year"].append(result["first_use_year"])
        results["first_use_display"].append(result.get("first_use_raw") or result.get("first_use_display"))
        results["mw_found"].append(result["mw_found"])
        results["mw_note"].append(result.get("note", ""))

        # 打印进度
        if idx % 10 == 0 or idx == total:
            found_mark = "✓" if result["mw_found"] else "✗"
            print(f"   [{idx}/{total}] {found_mark} {word}: {result.get('first_use_year') or result.get('note', '')}")

        # 请求间隔，避免限流
        if idx < total:
            time.sleep(DELAY_SECONDS)

    # 合并结果到 DataFrame
    df["首次出现年份"] = results["first_use_year"]
    df["首次出现时间(原始)"] = results["first_use_display"]
    df["MW是否收录"] = results["mw_found"]
    df["MW备注"] = results["mw_note"]

    # 重新排列列顺序：把新列放在英文后面
    cols = list(df.columns)
    if "英文" in cols:
        eng_idx = cols.index("英文")
        # 移除新列（如果已存在）
        for c in ["首次出现年份", "首次出现时间(原始)", "MW是否收录", "MW备注"]:
            if c in cols:
                cols.remove(c)
        # 插入到英文列之后
        insert_cols = ["首次出现年份", "首次出现时间(原始)", "MW是否收录", "MW备注"]
        for i, c in enumerate(insert_cols):
            cols.insert(eng_idx + 1 + i, c)
        df = df[cols]

    # 保存
    df.to_excel(OUTPUT_FILE, index=False)
    print("-" * 50)
    print(f"✅ 完成！结果已保存到: {OUTPUT_FILE}")

    # 统计
    found_count = sum(results["mw_found"])
    print(f"\n📊 统计:")
    print(f"   总词数: {total}")
    print(f"   MW 成功收录: {found_count} ({found_count/total*100:.1f}%)")
    print(f"   未收录/失败: {total - found_count}")


if __name__ == "__main__":
    main()
