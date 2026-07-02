import { useEffect, useRef, useState } from 'react';
import { type VisualizationData } from '../hooks/useData';
import { LayoutGrid } from 'lucide-react';
import * as echarts from 'echarts';
import { getLangColor } from './langColors';

interface Props {
  data: VisualizationData;
}

export function TreemapSection({ data }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [metric, setMetric] = useState<'value' | 'mwRate'>('value');

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // Group by MW rate tiers
    const tierData = [
      {
        name: '第一层 (70%+ 收录率)',
        children: data.treemap
          .filter((d) => d.mwRate >= 70)
          .map((d) => ({
            name: d.name,
            value: metric === 'value' ? d.value : d.mwRate,
            mwRate: d.mwRate,
            medianYear: d.medianYear,
            wordCount: d.value,
            itemStyle: { color: getLangColor(d.name), borderColor: '#0f172a' },
          })),
      },
      {
        name: '第二层 (40-69% 收录率)',
        children: data.treemap
          .filter((d) => d.mwRate >= 40 && d.mwRate < 70)
          .map((d) => ({
            name: d.name,
            value: metric === 'value' ? d.value : d.mwRate,
            mwRate: d.mwRate,
            medianYear: d.medianYear,
            wordCount: d.value,
            itemStyle: { color: getLangColor(d.name), borderColor: '#0f172a' },
          })),
      },
      {
        name: '第三层 (<40% 收录率)',
        children: data.treemap
          .filter((d) => d.mwRate < 40)
          .map((d) => ({
            name: d.name,
            value: metric === 'value' ? d.value : d.mwRate,
            mwRate: d.mwRate,
            medianYear: d.medianYear,
            wordCount: d.value,
            itemStyle: { color: getLangColor(d.name), borderColor: '#0f172a' },
          })),
      },
    ];

    const option: echarts.EChartsOption = {
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: 'rgba(148, 163, 184, 0.45)',
        textStyle: { color: '#334155' },
        formatter: (params: any) => {
          const d = params.data;
          return `<b>${d.name}</b><br/>
            词汇总数: <b>${d.wordCount}</b><br/>
            MW收录率: <b>${d.mwRate}%</b><br/>
            中位数首次年份: <b>${d.medianYear || 'N/A'}</b>`;
        },
      },
      series: [
        {
          type: 'treemap',
          data: tierData,
          width: '95%',
          height: '90%',
          top: '5%',
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          label: {
            show: true,
            formatter: (params: any) => {
              const d = params.data;
              if (d.wordCount !== undefined) {
                return `${d.name}\n${d.wordCount}词 | ${d.mwRate}%`;
              }
              return d.name;
            },
            fontSize: 12,
            color: '#fff',
          },
          itemStyle: {
            borderColor: 'rgba(148, 163, 184, 0.45)',
            borderWidth: 2,
            gapWidth: 2,
          },
          levels: [
            {
              itemStyle: {
                borderColor: '#1e293b',
                borderWidth: 0,
                gapWidth: 4,
              },
            },
            {
              colorSaturation: [0.85, 1],
              itemStyle: {
                borderColorSaturation: 0.7,
                gapWidth: 2,
              },
            },
          ],
          emphasis: {
            label: { fontSize: 16, fontWeight: 'bold' },
            itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.5)' },
          },
        },
      ],
      animationDuration: 1500,
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      chart.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, [data, metric]);

  return (
    <section id="treemap" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <LayoutGrid className="w-6 h-6 text-emerald-400" />
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">Treemap</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">词典收录率树图</h2>
        <p className="text-slate-500 max-w-2xl mb-6">
          树图（Treemap）以嵌套矩形展示各来源语种的词汇数量和MW词典收录率。矩形面积反映词汇总数，
          颜色深浅反映收录率高低。按收录率分为三层，揭示了词典编纂中的文化偏见。
        </p>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMetric('value')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              metric === 'value'
                ? 'bg-white text-slate-900 shadow-lg'
                : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            词汇数量
          </button>
          <button
            onClick={() => setMetric('mwRate')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              metric === 'mwRate'
                ? 'bg-white text-slate-900 shadow-lg'
                : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            MW收录率
          </button>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6">
          <div ref={chartRef} className="w-full h-[500px]" />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <h4 className="text-emerald-400 font-semibold mb-1">第一层: 高收录率</h4>
            <p className="text-sm text-slate-500">
              纳瓦特尔语 (80.3%)、意大利语 (89.6%)、西班牙语 (84.3%) 享有高收录率，反映了历史深度连接或人口流动驱动。
            </p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <h4 className="text-amber-400 font-semibold mb-1">第二层: 中等收录率</h4>
            <p className="text-sm text-slate-500">
              法语 (72.3%)、日语 (62.2%)、汉语 (65.7%) 处于中等水平——"高雅文化"标签反而可能限制了收录。
            </p>
          </div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <h4 className="text-red-400 font-semibold mb-1">第三层: 低收录率</h4>
            <p className="text-sm text-slate-500">
              韩语 (28.2%)、印地语/乌尔都语 (29.0%) 的极低收录率揭示了全球文化中的"真他者"现象——制度认可严重滞后。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
