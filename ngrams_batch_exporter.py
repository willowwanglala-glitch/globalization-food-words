#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Google Ngrams 批量查询导出工具 v2
功能：读取外来饮食借词清单，分批查询 Google Ngrams JSON API，导出为 CSV/Excel
日期：2026-06-26

使用方法：
    1. 确保已安装依赖: py -m pip install pandas openpyxl
    2. 将本脚本与 Excel 文件放在同一目录
    3. 运行: py ngrams_batch_exporter.py "外来饮食借词清单.xlsx"
    4. 结果将保存在 output/ 目录下
"""

import os
import sys
import time
import json
import urllib.parse
import urllib.request
import winreg  # Windows 注册表，用于读取系统代理
from pathlib import Path
from datetime import datetime

import pandas as pd

# ==================== 配置区域 ====================
INPUT_FILE = "外来饮食借词清单.xlsx"   # 输入文件名
OUTPUT_DIR = "output"                 # 输出目录
BATCH_SIZE = 8                        # 每批查询的词数（建议 5-10，避免 URL 过长）
YEAR_START = 1800                    # 起始年份
YEAR_END = 2020                       # 结束年份
CORPUS = 26                           # 语料库: 26=英语, 18=中文(简体)
SMOOTHING = 3                         # 平滑度 (0-50)
REQUEST_DELAY = 2.0                   # 每批请求间隔(秒)，防止被封
MAX_RETRIES = 3                       # 失败重试次数
TIMEOUT = 30                          # 请求超时(秒)
# =================================================


def detect_windows_proxy():
    """
    从 Windows 注册表读取系统代理设置（IE/系统代理）。
    返回形如 "http://127.0.0.1:7890" 的字符串，或 None。
    """
    try:
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Internet Settings"
        )
        proxy_enable = winreg.QueryValueEx(key, "ProxyEnable")[0]
        if proxy_enable == 1:
            proxy_server = winreg.QueryValueEx(key, "ProxyServer")[0]
            # 可能是 "127.0.0.1:7890" 或 "http=127.0.0.1:7890;https=127.0.0.1:7890"
            if ";" in proxy_server:
                # 多协议格式，取 https 或 http
                for part in proxy_server.split(";"):
                    if part.startswith("https="):
                        addr = part.split("=", 1)[1]
                        return f"http://{addr}"
                    elif part.startswith("http="):
                        addr = part.split("=", 1)[1]
                        return f"http://{addr}"
            # 简单格式 "127.0.0.1:7890"
            if ":" in proxy_server and not proxy_server.startswith("http"):
                return f"http://{proxy_server}"
            return proxy_server
        winreg.CloseKey(key)
    except Exception:
        pass
    return None


def setup_proxy():
    """
    自动检测代理并配置 urllib。
    优先级：环境变量 > Windows 系统代理
    """
    # 1. 检查环境变量
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("HTTP_PROXY")
    if proxy:
        print(f"[代理] 使用环境变量代理: {proxy}")
        proxy_handler = urllib.request.ProxyHandler({
            "http": proxy,
            "https": proxy,
        })
        opener = urllib.request.build_opener(proxy_handler)
        urllib.request.install_opener(opener)
        return True

    # 2. 检查 Windows 系统代理
    proxy = detect_windows_proxy()
    if proxy:
        print(f"[代理] 检测到系统代理: {proxy}")
        proxy_handler = urllib.request.ProxyHandler({
            "http": proxy,
            "https": proxy,
        })
        opener = urllib.request.build_opener(proxy_handler)
        urllib.request.install_opener(opener)
        return True

    print("[代理] 未检测到代理设置，将直连 Google。")
    print("       如果无法访问 Google，请在 Clash 中开启'系统代理'后重试。")
    return False


def test_connection():
    """测试是否能连通 Google"""
    print("[测试] 正在测试 Google 连接...")
    try:
        req = urllib.request.Request(
            "https://www.google.com",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            if resp.status == 200:
                print("[测试] ✓ Google 连接成功！")
                return True
    except Exception as e:
        print(f"[测试] ✗ Google 连接失败: {e}")
        print("       请确认 Clash 已开启且'系统代理'选项已打开。")
        return False


def ensure_dir(path: str):
    """确保目录存在"""
    Path(path).mkdir(parents=True, exist_ok=True)


def fetch_ngrams_json(words: list, start_year=YEAR_START, end_year=YEAR_END,
                       corpus=CORPUS, smoothing=SMOOTHING) -> list:
    """
    向 Google Ngrams JSON API 发送请求并返回解析后的数据。
    """
    content = ",".join(words)
    encoded = urllib.parse.quote(content, safe=',')
    url = (
        f"https://books.google.com/ngrams/json"
        f"?content={encoded}"
        f"&year_start={start_year}"
        f"&year_end={end_year}"
        f"&corpus={corpus}"
        f"&smoothing={smoothing}"
    )

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
    }

    req = urllib.request.Request(url, headers=headers)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if not data:
                    return []
                results = []
                for item in data:
                    results.append({
                        "ngram": item.get("ngram", "").strip(),
                        "timeseries": item.get("timeseries", []),
                        "parent": item.get("parent", ""),
                        "type": item.get("type", "NGRAM"),
                    })
                return results
        except urllib.error.HTTPError as e:
            print(f"    [HTTP {e.code}] 第 {attempt} 次重试...")
            time.sleep(REQUEST_DELAY * attempt)
        except Exception as e:
            print(f"    [Error] {e} 第 {attempt} 次重试...")
            time.sleep(REQUEST_DELAY * attempt)

    return []


def export_ngrams(input_path: str, output_dir: str):
    """主流程：读取词汇 -> 分批查询 -> 合并导出"""

    # 1. 读取输入文件
    print(f"[1/5] 正在读取输入文件: {input_path}")
    if input_path.lower().endswith(".csv"):
        df = pd.read_csv(input_path)
    else:
        df = pd.read_excel(input_path)

    # 获取英文词汇列（兼容不同列名）
    col_candidates = [c for c in df.columns if "英文" in c or "english" in c.lower() or "word" in c.lower()]
    if not col_candidates:
        print("错误：未找到英文词汇列。请确保列名包含'英文'、'english'或'word'。")
        sys.exit(1)

    word_col = col_candidates[0]
    words = df[word_col].dropna().astype(str).str.strip().tolist()
    words = [w for w in words if w]  # 过滤空值

    total = len(words)
    print(f"       共读取到 {total} 个词汇。")

    # 2. 准备输出目录
    ensure_dir(output_dir)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # 3. 分批查询
    print(f"[2/5] 开始分批查询 Google Ngrams (每批 {BATCH_SIZE} 个词, 间隔 {REQUEST_DELAY}s)...")
    all_results = []
    failed_batches = []

    total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE

    for i in range(0, total, BATCH_SIZE):
        batch = words[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        batch_str = ", ".join(batch[:3])
        if len(batch) > 3:
            batch_str += f" 等 {len(batch)} 个词"

        print(f"  [{batch_num}/{total_batches}] 查询: {batch_str}")

        data = fetch_ngrams_json(batch)

        if not data:
            print(f"    [!] 本批次返回空数据，已记录。")
            failed_batches.append(batch)
        else:
            for item in data:
                ngram = item["ngram"]
                series = item["timeseries"]
                for idx, freq in enumerate(series):
                    year = YEAR_START + idx
                    if year > YEAR_END:
                        break
                    all_results.append({
                        "word": ngram,
                        "year": year,
                        "frequency": freq,
                    })
            print(f"    [OK] 成功获取 {len(data)} 个词的频率数据。")

        # 延时，避免请求过快
        if i + BATCH_SIZE < total:
            time.sleep(REQUEST_DELAY)

    # 4. 处理失败批次（逐词重试）
    if failed_batches:
        print(f"[3/5] 有 {len(failed_batches)} 批次失败，尝试逐词重试...")
        retry_words = [w for batch in failed_batches for w in batch]
        for w in retry_words:
            print(f"  重试: {w}")
            data = fetch_ngrams_json([w])
            if data:
                for item in data:
                    series = item["timeseries"]
                    for idx, freq in enumerate(series):
                        year = YEAR_START + idx
                        if year > YEAR_END:
                            break
                        all_results.append({
                            "word": item["ngram"],
                            "year": year,
                            "frequency": freq,
                        })
                print(f"    [OK]")
            else:
                print(f"    [FAIL] 仍失败")
            time.sleep(REQUEST_DELAY)
    else:
        print(f"[3/5] 所有批次均成功，无需重试。")

    # 5. 导出数据
    print(f"[4/5] 正在整理数据并导出...")

    if not all_results:
        print("错误：未获取到任何数据，请检查网络连接或词汇拼写。")
        sys.exit(1)

    result_df = pd.DataFrame(all_results)

    # 5.1 长格式 CSV
    long_csv = os.path.join(output_dir, f"ngrams_long_{timestamp}.csv")
    result_df.to_csv(long_csv, index=False, encoding="utf-8-sig")
    print(f"       长格式 CSV: {long_csv}  ({len(result_df)} 行)")

    # 5.2 宽格式 CSV/Excel（先去重，防止批次+重试导致重复）
    result_df = result_df.drop_duplicates(subset=["word", "year"], keep="last")
    pivot_df = result_df.pivot(index="year", columns="word", values="frequency")
    pivot_df.index.name = "year"

    wide_csv = os.path.join(output_dir, f"ngrams_wide_{timestamp}.csv")
    pivot_df.to_csv(wide_csv, encoding="utf-8-sig")
    print(f"       宽格式 CSV: {wide_csv}  ({pivot_df.shape[0]} 年 x {pivot_df.shape[1]} 词)")

    wide_excel = os.path.join(output_dir, f"ngrams_wide_{timestamp}.xlsx")
    pivot_df.to_excel(wide_excel)
    print(f"       宽格式 Excel: {wide_excel}")

    # 5.3 汇总统计
    summary = []
    for word in words:
        if word in pivot_df.columns:
            col = pivot_df[word].dropna()
            summary.append({
                "word": word,
                "first_year": col.index.min() if not col.empty else None,
                "last_year": col.index.max() if not col.empty else None,
                "max_freq": col.max() if not col.empty else None,
                "max_year": col.idxmax() if not col.empty else None,
                "mean_freq": col.mean() if not col.empty else None,
                "non_zero_years": (col > 0).sum() if not col.empty else 0,
            })

    if summary:
        summary_df = pd.DataFrame(summary)
        summary_csv = os.path.join(output_dir, f"ngrams_summary_{timestamp}.csv")
        summary_df.to_csv(summary_csv, index=False, encoding="utf-8-sig")
        print(f"       汇总统计 CSV: {summary_csv}")

    print(f"[5/5] 全部完成！所有文件已保存到: {os.path.abspath(output_dir)}\\")


if __name__ == "__main__":
    print("=" * 50)
    print("  Google Ngrams 批量导出工具 v2")
    print("=" * 50)
    print()

    # 0. 配置代理
    setup_proxy()
    print()

    # 测试连接
    if not test_connection():
        print()
        print("无法连接 Google，脚本退出。")
        print("解决方法：")
        print("  1. 确认 Clash 正在运行")
        print("  2. 在 Clash 中开启 '系统代理' (System Proxy) 开关")
        print("  3. 重新运行本脚本")
        sys.exit(1)

    print()

    # 允许通过命令行参数指定输入文件
    input_file = sys.argv[1] if len(sys.argv) > 1 else INPUT_FILE

    if not os.path.exists(input_file):
        print(f"错误：找不到输入文件 '{input_file}'")
        print(f"请将 Excel/CSV 文件放置于脚本同目录，或传入完整路径。")
        sys.exit(1)

    export_ngrams(input_file, OUTPUT_DIR)
