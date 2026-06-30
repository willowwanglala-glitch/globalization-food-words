import { useEffect, useRef, useState, useMemo } from 'react';
import { type VisualizationData } from '../hooks/useData';
import { Waves } from 'lucide-react';
import * as echarts from 'echarts';
import { LANG_COLORS } from './langColors';
import { streamSurgeStats } from '../utils/vizStats';

interface Props {
  data: VisualizationData;
}


export function StreamgraphSection({ data }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['法语', '西班牙语', '日语', '意大利语', '汉语']);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const decades = data.decades;
    const series = selectedLangs.map((lang) => ({
      name: lang,
      type: 'line' as const,
      stack: 'Total',
      smooth: true,
      lineStyle: { width: 0 },
      showSymbol: false,
      areaStyle: {
        opacity: 0.8,
        color: LANG_COLORS[lang] || '#95a5a6',
      },
      emphasis: { focus: 'series' as const },
      data: data.streamgraph[lang] || [],
    }));

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#334155' },
        formatter: (params: any) => {
          let result = `<div style="font-weight:bold;margin-bottom:5px">${params[0].axisValue}年代</div>`;
          params.forEach((p: any) => {
            result += `<div style="display:flex;align-items:center;gap:6px">
              <span style="width:10px;height:10px;border-radius:50%;background:${p.color}"></span>
              <span>${p.seriesName}: ${p.value.toFixed(1)} ppm</span>
            </div>`;
          });
          return result;
        },
      },
      legend: {
        data: selectedLangs,
        textStyle: { color: '#475569' },
        top: 10,
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: decades.map(String),
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        axisLabel: { color: '#475569' },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        axisLabel: { color: '#475569', formatter: '{value} ppm' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      },
      series,
      animationDuration: 2000,
      animationEasing: 'cubicInOut',
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      chart.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, [data, selectedLangs]);

  const toggleLang = (lang: string) => {
    setSelectedLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const surgeStats = useMemo(() => streamSurgeStats(data), [data]);

  const topSurge = surgeStats[0];
  const otherSurges = surgeStats.slice(1, 5);

  return (
    <section id="streamgraph" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Waves className="w-6 h-6 text-amber-400" />
          <span className="text-amber-400 text-sm font-semibold uppercase tracking-wider">Streamgraph</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">外来词汇涌入浪潮</h2>
        <p className="text-slate-500 max-w-3xl mb-6">
          堆叠面积图展示 1800–2020 年各语种饮食词在英语书籍中的聚合频率。老词与新词叠加抬升——
          {topSurge ? (
            <>
              1980–2000 年代{topSurge.lang}增幅最大（{topSurge.v80.toFixed(0)}→{topSurge.v2000.toFixed(0)} ppm，
              +{topSurge.delta.toFixed(0)}），汉语、波斯语、西班牙语、日语同步攀升。
            </>
          ) : (
            <>1980–2000 年代多语种聚合频率同步攀升。</>
          )}
        </p>

        {/* Language filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.keys(LANG_COLORS).map((lang) => (
            <button
              key={lang}
              onClick={() => toggleLang(lang)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedLangs.includes(lang)
                  ? 'text-white shadow-lg'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'
              }`}
              style={
                selectedLangs.includes(lang)
                  ? { backgroundColor: LANG_COLORS[lang], boxShadow: `0 4px 15px ${LANG_COLORS[lang]}40` }
                  : {}
              }
            >
              {lang}
            </button>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6">
          <div ref={chartRef} className="w-full h-[500px]" />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <h4 className="text-amber-400 font-semibold mb-1">层累而非替代</h4>
            <p className="text-sm text-slate-500">
              首次年 &lt;1800 的词在近期语料中位 0.47 ppm，仍远高于 1950 年后新词——早期交换词与新潮词共同构成浪潮。
            </p>
          </div>
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
            <h4 className="text-orange-400 font-semibold mb-1">语种聚合抬升</h4>
            <p className="text-sm text-slate-500">
              {topSurge
                ? `${topSurge.lang}从 1980 年代 ${topSurge.v80.toFixed(0)} ppm 增至 2000 年代 ${topSurge.v2000.toFixed(0)} ppm（+${topSurge.delta.toFixed(0)}），在语种聚合频率中增幅居首。`
                : '1980–2000 年代各语种聚合频率整体抬升。'}
            </p>
          </div>
          <div className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-4">
            <h4 className="text-pink-400 font-semibold mb-1">多语共振</h4>
            <p className="text-sm text-slate-500">
              {otherSurges.length > 0
                ? `同期${otherSurges.map((r) => `${r.lang} +${r.delta.toFixed(0)}`).join('、')} ppm——全球化浪潮并非单一语种独享。`
                : '多语种在同一时段同步抬升，呈现共振式全球化。'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
