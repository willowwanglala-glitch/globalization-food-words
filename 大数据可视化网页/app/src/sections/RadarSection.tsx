import { useEffect, useRef, useState } from 'react';
import { type VisualizationData } from '../hooks/useData';
import { Target } from 'lucide-react';
import * as echarts from 'echarts';
import { LANG_COLORS } from './langColors';

interface Props {
  data: VisualizationData;
}


export function RadarSection({ data }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['法语', '西班牙语', '日语', '意大利语']);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);

    const indicators = [
      { name: 'MW收录率', max: 100 },
      { name: '词汇丰富度', max: 100 },
      { name: '现代性', max: 100 },
      { name: '类别多样性', max: 100 },
      { name: '历史深度', max: 100 },
    ];

    const series = selectedLangs.map((lang) => {
      const d = data.radar.find((r) => r.lang === lang);
      return {
        name: lang,
        type: 'radar' as const,
        data: [
          {
            value: d ? [d.mwRate, d.wordCount, d.modernity, d.diversity, d.historicalDepth] : [0, 0, 0, 0, 0],
            name: lang,
            lineStyle: { color: LANG_COLORS[lang] || '#95a5a6', width: 2 },
            areaStyle: { color: LANG_COLORS[lang] + '20' },
            itemStyle: { color: LANG_COLORS[lang] },
            symbol: 'circle',
            symbolSize: 6,
          },
        ],
      };
    });

    const option: echarts.EChartsOption = {
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: 'rgba(148, 163, 184, 0.45)',
        textStyle: { color: '#334155' },
      },
      legend: {
        data: selectedLangs,
        textStyle: { color: '#475569' },
        top: 10,
      },
      radar: {
        indicator: indicators,
        shape: 'polygon',
        splitNumber: 4,
        axisName: { color: '#475569', fontSize: 12 },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
        splitArea: { areaStyle: { color: ['rgba(148, 163, 184, 0.06)', 'rgba(148, 163, 184, 0.12)'] } },
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.55)' } },
      },
      series,
      animationDuration: 1500,
    };

    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => { chart.dispose(); window.removeEventListener('resize', handleResize); };
  }, [data, selectedLangs]);

  const toggleLang = (lang: string) => {
    setSelectedLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  return (
    <section id="radar" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-6 h-6 text-violet-400" />
          <span className="text-violet-400 text-sm font-semibold uppercase tracking-wider">Radar Chart</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">多维度语种特征雷达图</h2>
        <p className="text-slate-500 max-w-2xl mb-6">
          雷达图从五个维度对比各来源语种的特征：MW收录率（制度化认可）、词汇丰富度、现代性（进入时间）、
          类别多样性（覆盖的语义领域）、历史深度（首次出现的久远程度）。
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {Object.keys(LANG_COLORS).map((lang) => (
            <button
              key={lang}
              onClick={() => toggleLang(lang)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedLangs.includes(lang) ? 'text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'
              }`}
              style={selectedLangs.includes(lang) ? { backgroundColor: LANG_COLORS[lang], boxShadow: `0 4px 15px ${LANG_COLORS[lang]}40` } : {}}
            >
              {lang}
            </button>
          ))}
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6">
          <div ref={chartRef} className="w-full h-[500px]" />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
            <h4 className="text-violet-400 font-semibold mb-1">意大利语全面领先</h4>
            <p className="text-sm text-slate-500">意大利语在收录率和类别多样性上均表现优异，反映了其在全球饮食文化中的广泛认可。</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <h4 className="text-amber-400 font-semibold mb-1">西班牙语历史深度</h4>
            <p className="text-sm text-slate-500">西班牙语词汇凭借哥伦布大交换遗产，在历史深度维度上得分最高。</p>
          </div>
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
            <h4 className="text-cyan-400 font-semibold mb-1">韩语现代性突出</h4>
            <p className="text-sm text-slate-500">韩语词汇虽然历史较短，但在"现代性"维度上得分最高，代表了21世纪全球饮食潮流。</p>
          </div>
        </div>
      </div>
    </section>
  );
}
