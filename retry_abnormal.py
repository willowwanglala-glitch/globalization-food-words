#!/usr/bin/env python3
import pandas as pd
import requests
import time
import re

MW_API_KEY = "326fcb6f-0363-4245-bb13-c6f455566e1f"
INPUT_FILE = r"E:\广工\学生\26春\17大数据及其可视化\外来饮食借词清单_with_first_use.xlsx"
OUTPUT_FILE = r"E:\广工\学生\26春\17大数据及其可视化\外来饮食借词清单_with_first_use.xlsx"
BASE_URL = "https://www.dictionaryapi.com/api/v3/references/collegiate/json/"
DELAY_SECONDS = 2.0
REQUEST_TIMEOUT = 30
MAX_RETRIES = 3

def extract_year_from_date(date_str):
    if not date_str or not isinstance(date_str, str):
        return None, None
    cleaned = re.sub(r"\{[^}]*\}", "", date_str).strip()
    year_match = re.search(r"\b(\d{4})\b", cleaned)
    if year_match:
        return int(year_match.group(1)), cleaned
    century_match = re.search(r"(\d{1,2})(?:th|rd|nd|st)?\s*c(?:entury)?", cleaned, re.IGNORECASE)
    if century_match:
        return f"{int(century_match.group(1))}世纪", cleaned
    return None, cleaned

def query_merriam_webster(word, retries=0):
    url = f"{BASE_URL}{word}?key={MW_API_KEY}"
    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                entry = data[0]
                raw_date = entry.get("date")
                year, display = extract_year_from_date(raw_date)
                return {"mw_found": True, "first_use_year": year, "first_use_raw": display, "note": "", "success": True}
            else:
                return {"mw_found": False, "first_use_year": None, "first_use_raw": None, "note": "MW 未收录或返回建议列表", "success": True}
        else:
            return {"mw_found": False, "first_use_year": None, "first_use_raw": None, "note": f"HTTP {response.status_code}", "success": True}
    except requests.exceptions.Timeout:
        if retries < MAX_RETRIES:
            time.sleep(2)
            return query_merriam_webster(word, retries + 1)
        return {"mw_found": False, "first_use_year": None, "first_use_raw": None, "note": f"超时(重试{MAX_RETRIES}次)", "success": False}
    except requests.exceptions.SSLError:
        if retries < MAX_RETRIES:
            time.sleep(3)
            return query_merriam_webster(word, retries + 1)
        return {"mw_found": False, "first_use_year": None, "first_use_raw": None, "note": f"SSL错误(重试{MAX_RETRIES}次)", "success": False}
    except Exception as e:
        if retries < MAX_RETRIES:
            time.sleep(2)
            return query_merriam_webster(word, retries + 1)
        return {"mw_found": False, "first_use_year": None, "first_use_raw": None, "note": f"异常(重试{MAX_RETRIES}次): {str(e)[:80]}", "success": False}

def main():
    if MW_API_KEY == "YOUR_API_KEY_HERE":
        print("❌ 错误：请先在脚本中填入你的 Merriam-Webster API Key！")
        return

    df = pd.read_excel(INPUT_FILE)
    print(f"✅ 已读取结果文件，共 {len(df)} 条记录")

    abnormal_mask = df['MW备注'].fillna('').str.contains('异常|超时|SSL|HTTP', na=False)
    abnormal_df = df[abnormal_mask]
    total_abnormal = len(abnormal_df)

    if total_abnormal == 0:
        print("✅ 没有需要补查的异常记录，任务已完成！")
        return

    print(f"🔍 发现 {total_abnormal} 条异常记录，开始补查...")
    print(f"   请求间隔: {DELAY_SECONDS}s | 超时: {REQUEST_TIMEOUT}s | 最大重试: {MAX_RETRIES}次")
    print("-" * 55)

    success_count = 0
    still_failed = 0

    for i, (idx, row) in enumerate(abnormal_df.iterrows(), 1):
        word = str(row['英文'])
        result = query_merriam_webster(word)

        df.at[idx, "首次出现年份"] = result["first_use_year"]
        df.at[idx, "首次出现时间(原始)"] = result["first_use_raw"]
        df.at[idx, "MW是否收录"] = result["mw_found"]
        df.at[idx, "MW备注"] = result["note"]

        if result["success"] and result["mw_found"]:
            success_count += 1
            mark = "✓"
            display = result["first_use_year"]
        elif result["success"]:
            success_count += 1
            mark = "✗"
            display = "未收录"
        else:
            still_failed += 1
            mark = "✗"
            display = result["note"][:40]

        print(f"   [{i}/{total_abnormal}] {mark} {word}: {display}")

        if i < total_abnormal:
            time.sleep(DELAY_SECONDS)

    df.to_excel(OUTPUT_FILE, index=False)

    print("-" * 55)
    print(f"✅ 补查完成！结果已保存到: {OUTPUT_FILE}")
    print(f"\n📊 补查统计:")
    print(f"   补查词数: {total_abnormal}")
    print(f"   补查成功: {success_count}")
    print(f"   仍然失败: {still_failed}")

    final_found = df['MW是否收录'].sum()
    print(f"\n📊 整体统计:")
    print(f"   总词数: {len(df)}")
    print(f"   MW 成功收录: {final_found} ({final_found/len(df)*100:.1f}%)")
    print(f"   未收录/失败: {len(df) - final_found}")

if __name__ == "__main__":
    main()