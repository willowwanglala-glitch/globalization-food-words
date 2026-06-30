import { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { ClipboardCheck } from 'lucide-react';
import { type SpssMwCategoryResults } from '../hooks/useSpssData';

interface Props {
  data: SpssMwCategoryResults;
}

const tooltipBase = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  borderColor: 'rgba(255,255,255,0.1)',
  textStyle: { color: '#cbd5e1' },
};

type ViewMode = 'merged' | 'detailed';

function barColor(rate: number, overall: number): string {
  if (rate < overall - 10) return '#f43f5e';
  if (rate < overall) return '#fb923c';
  if (rate >= overall + 10) return '#34d399';
  return '#60a5fa';
}

export function SpssSection({ data }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ViewMode>('merged');

  const active = view === 'merged' ? data.merged : data.detailed;
  const chartRows = useMemo(() => {
    const rows = [...active.categories];
    if (view === 'detailed') {
      rows.sort((a, b) => a.mw_rate - b.mw_rate);
    } else {
      rows.sort((a, b) => b.total - a.total);
    }
    return rows;
  }, [active.categories, view]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    const overall = data.overall_mw_rate;

    chart.setOption({
      tooltip: {
        ...tooltipBase,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: Array<{ name: string; value: number; dataIndex: number }>) => {
          const row = chartRows[params[0].dataIndex];
          return `<b>${row.category}</b><br/>
            MW 收录率：<b>${row.mw_rate}%</b><br/>
            收录 ${row.mw_included} / 未收录 ${row.not_included}<br/>
            合计 ${row.total} 词`;
        },
      },
      grid: { left: 88, right: 48, top: 24, bottom: 32 },
      xAxis: {
        type: 'value',
        max: 100,
        name: 'MW 收录率 (%)',
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { color: '#94a3b8', formatter: '{value}%' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
      yAxis: {
        type: 'category',
        data: chartRows.map((r) => r.category),
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      },
      series: [
        {
          type: 'bar',
          data: chartRows.map((r) => ({
            value: r.mw_rate,
            itemStyle: { color: barColor(r.mw_rate, overall), borderRadius: [0, 4, 4, 0] },
          })),
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            color: '#94a3b8',
            fontSize: 11,
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { type: 'dashed', color: '#fbbf24' },
            label: {
              formatter: `总体 ${overall}%`,
              color: '#fbbf24',
              fontSize: 11,
            },
            data: [{ xAxis: overall }],
          },
        },
      ],
      animationDuration: 900,
    });

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      chart.dispose();
      window.removeEventListener('resize', onResize);
    };
  }, [chartRows, data.overall_mw_rate]);

  useEffect(() => {
    if (!stackRef.current) return;
    const chart = echarts.init(stackRef.current);

    chart.setOption({
      tooltip: {
        ...tooltipBase,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        top: 4,
        textStyle: { color: '#94a3b8', fontSize: 11 },
        data: ['MW 收录', '未收录'],
      },
      grid: { left: 88, right: 24, top: 40, bottom: 32 },
      xAxis: {
        type: 'value',
        name: '词数',
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
      yAxis: {
        type: 'category',
        data: chartRows.map((r) => r.category),
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
      series: [
        {
          name: 'MW 收录',
          type: 'bar',
          stack: 'total',
          data: chartRows.map((r) => r.mw_included),
          itemStyle: { color: '#34d399' },
        },
        {
          name: '未收录',
          type: 'bar',
          stack: 'total',
          data: chartRows.map((r) => r.not_included),
          itemStyle: { color: 'rgba(148,163,184,0.35)' },
        },
      ],
    });

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      chart.dispose();
      window.removeEventListener('resize', onResize);
    };
  }, [chartRows]);

  const chi = active.chi_square;
  const lowDrink = chartRows.find((r) => r.category === '饮品' || r.category.includes('饮品'));
  const lowSnack = chartRows.find((r) => r.category === '小吃');

  return (
    <section
      id="spss"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-900/40"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardCheck className="w-6 h-6 text-emerald-400" />
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">
            SPSS Validation
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">SPSS 检验：词典收录 × 语义类别</h2>
        <p className="text-slate-500 max-w-3xl mb-2">
          对 662 个去重借词进行 Pearson 卡方检验（{data.description}）。
          结果支持「词典扩展存在语义场选择性」，与双轨不对称叙事一致。
        </p>
        <p className="text-xs text-slate-500 max-w-3xl mb-6">
          数据来源：<code className="text-slate-400">spss_dataset_clean.csv</code>（662 词，主来源，0 缺失）。
          默认展示合并后的五类语义场；细分类视图供探索参考。
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setView('merged')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              view === 'merged'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 text-slate-500 border border-white/10 hover:text-slate-300'
            }`}
          >
            五类语义场（推荐）
          </button>
          <button
            type="button"
            onClick={() => setView('detailed')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              view === 'detailed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 text-slate-500 border border-white/10 hover:text-slate-300'
            }`}
          >
            细分类（样本≥8）
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{chi.n_valid}</div>
            <div className="text-xs text-slate-500 mt-1">有效个案</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{chi.chi2}</div>
            <div className="text-xs text-slate-500 mt-1">Pearson χ²</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{chi.df}</div>
            <div className="text-xs text-slate-500 mt-1">自由度 df</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{chi.p_display}</div>
            <div className="text-xs text-slate-500 mt-1">显著性 p</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">各类别 MW 收录率</h3>
            <div
              ref={chartRef}
              className="w-full"
              style={{ height: Math.max(280, chartRows.length * 36 + 48) }}
            />
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">收录 / 未收录 词数构成</h3>
            <div
              ref={stackRef}
              className="w-full"
              style={{ height: Math.max(280, chartRows.length * 36 + 48) }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
            <h4 className="text-rose-400 font-semibold mb-1">饮品收录偏低</h4>
            <p className="text-sm text-slate-500">
              {lowDrink
                ? `「${lowDrink.category}」类 MW 收录率仅 ${lowDrink.mw_rate}%，明显低于总体 ${data.overall_mw_rate}%。`
                : '饮品类收录率显著低于总体水平。'}
            </p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <h4 className="text-emerald-400 font-semibold mb-1">显著相关</h4>
            <p className="text-sm text-slate-500">
              χ² = {chi.chi2}，df = {chi.df}，p {chi.p_display}：MW 收录与语义类别并非独立分布。
            </p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <h4 className="text-amber-400 font-semibold mb-1">方法说明</h4>
            <p className="text-sm text-slate-500">
              {view === 'merged'
                ? `合并五类后，${chi.cells_expected_lt5_pct}% 单元格期望频数 < 5，检验条件可接受。`
                : active.spss_note ?? `细分类视图：${chi.cells_expected_lt5_pct}% 单元格期望频数 < 5，仅作描述参考。`}
              {lowSnack && view === 'detailed' ? ` 小吃类仅 ${lowSnack.mw_rate}%。` : ''}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
