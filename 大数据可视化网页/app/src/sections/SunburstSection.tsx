import { useEffect, useRef, useState } from 'react';
import { type VisualizationData } from '../hooks/useData';
import { Sun } from 'lucide-react';
import * as echarts from 'echarts';
import { applySunburstLangColors, LANG_COLORS, LANG_ORDER } from './langColors';

interface Props {
  data: VisualizationData;
}


export function SunburstSection({ data }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeLang, setActiveLang] = useState<string>('');

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);

    const children = activeLang
      ? data.sunburst.children.filter((c: { name: string }) => c.name === activeLang)
      : data.sunburst.children;
    const coloredChildren = applySunburstLangColors(children) as echarts.SunburstSeriesOption['data'];

    const option: echarts.EChartsOption = {
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#334155' },
        formatter: (params: any) => {
          const d = params.data;
          return `<b style="color:${params.color}">${d.name}</b><br/>
            <span style="color:#475569">层级: ${params.treePathInfo.map((t: any) => t.name).join(' > ')}</span>`;
        },
      },
      series: [
        {
          type: 'sunburst' as const,
          data: coloredChildren,
          radius: [15, '90%'],
          itemStyle: {
            borderRadius: 4,
            borderWidth: 2,
            borderColor: '#0f172a',
          },
          label: {
            rotate: 'radial',
            color: '#475569',
            fontSize: 10,
            formatter: (p: any) => p.name.length > 8 ? p.name.slice(0, 6) + '..' : p.name,
          },
          levels: [
            {},
            {
              r0: '15%',
              r: '40%',
              itemStyle: { borderWidth: 2 },
              label: { rotate: 'tangential', fontSize: 11, fontWeight: 'bold' },
            },
            {
              r0: '40%',
              r: '70%',
              label: { align: 'right', fontSize: 9 },
            },
            {
              r0: '70%',
              r: '90%',
              label: { position: 'outside', padding: 3, silent: false, fontSize: 8 },
              itemStyle: { borderWidth: 1 },
            },
          ],
          emphasis: {
            focus: 'ancestor' as const,
            itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.5)' },
          },
        },
      ],
      animationDuration: 1500,
    };

    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => { chart.dispose(); window.removeEventListener('resize', handleResize); };
  }, [data, activeLang]);

  return (
    <section id="sunburst" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Sun className="w-6 h-6 text-yellow-400" />
          <span className="text-yellow-400 text-sm font-semibold uppercase tracking-wider">Sunburst Chart</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">语义层级旭日图</h2>
        <p className="text-slate-500 max-w-2xl mb-6">
          旭日图（Sunburst）以同心圆层级结构展示词汇的归属关系：内圈为来源语种，中圈为语义类别，外圈为具体词汇。
          直观展示各语种饮食词在不同类别上的分布特征。
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveLang('')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeLang === '' ? 'bg-white text-slate-900 shadow-lg' : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            全部
          </button>
          {LANG_ORDER.map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveLang(activeLang === lang ? '' : lang)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeLang === lang ? 'text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'
              }`}
              style={activeLang === lang ? { backgroundColor: LANG_COLORS[lang], boxShadow: `0 4px 15px ${LANG_COLORS[lang]}40` } : {}}
            >
              {lang}
            </button>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6">
          <div ref={chartRef} className="w-full h-[600px]" />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
            <h4 className="text-yellow-400 font-semibold mb-1">层级结构</h4>
            <p className="text-sm text-slate-500">三层同心圆从内到外依次为：来源语种 → 语义类别（如面食、饮品） → 具体词汇。</p>
          </div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <h4 className="text-red-400 font-semibold mb-1">法语多样性</h4>
            <p className="text-sm text-slate-500">法语词汇覆盖制度、文化资本、身份、技术和食物等多个语义层，体现了制度嵌入的全面性。</p>
          </div>
          <div className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-4">
            <h4 className="text-pink-400 font-semibold mb-1">日语聚焦</h4>
            <p className="text-sm text-slate-500">日语词汇高度集中在食材和饮品类，反映了日本饮食文化以原料为核心的特征。</p>
          </div>
        </div>
      </div>
    </section>
  );
}
