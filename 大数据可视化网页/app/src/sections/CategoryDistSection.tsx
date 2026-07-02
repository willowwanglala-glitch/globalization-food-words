import { useEffect, useRef, useState } from 'react';
import { type VisualizationData } from '../hooks/useData';
import { PieChart } from 'lucide-react';
import * as echarts from 'echarts';
import { LANG_COLORS } from './langColors';

interface Props {
  data: VisualizationData;
}


export function CategoryDistSection({ data }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [selectedLang, setSelectedLang] = useState<string>('法语');

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);

    const catData = data.categoryDist[selectedLang] || {};
    const sorted = Object.entries(catData).sort((a, b) => b[1] - a[1]);

    let option: echarts.EChartsOption;

    if (chartType === 'pie') {
      option = {
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          borderColor: 'rgba(148, 163, 184, 0.45)',
          textStyle: { color: '#334155' },
          formatter: (params: any) => `<b>${params.name}</b>: ${params.value} 词 (${params.percent}%)`,
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          textStyle: { color: '#475569', fontSize: 11 },
          type: 'scroll',
        },
        series: [
          {
            type: 'pie' as const,
            radius: ['40%', '70%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 6,
              borderColor: '#0f172a',
              borderWidth: 2,
            },
            label: {
              show: true,
              color: '#475569',
              formatter: '{b}: {c}',
              fontSize: 11,
            },
            emphasis: {
              label: { show: true, fontSize: 14, fontWeight: 'bold' },
              itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.15)' },
            },
            data: sorted.map(([name, value], i) => ({
              name,
              value,
              itemStyle: { color: `hsl(${(i * 360) / sorted.length}, 70%, 55%)` },
            })),
          },
        ],
        animationDuration: 1000,
      };
    } else {
      // Stacked bar comparing all languages
      const allCategories = new Set<string>();
      Object.values(data.categoryDist).forEach((cats) => {
        Object.keys(cats).forEach((c) => allCategories.add(c));
      });
      const categories = Array.from(allCategories).slice(0, 12);
      const langs = Object.keys(LANG_COLORS).filter((l) => data.categoryDist[l]);

      option = {
        tooltip: {
          trigger: 'axis' as const,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          borderColor: 'rgba(148, 163, 184, 0.45)',
          textStyle: { color: '#334155' },
          axisPointer: { type: 'shadow' as const },
        },
        legend: {
          data: langs,
          textStyle: { color: '#475569', fontSize: 10 },
          top: 5,
          type: 'scroll',
        },
        grid: { left: '15%', right: '5%', bottom: '15%', top: '15%' },
        xAxis: {
          type: 'category' as const,
          data: categories,
          axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.55)' } },
          axisLabel: { color: '#475569', fontSize: 10, rotate: 30 },
        },
        yAxis: {
          type: 'value' as const,
          name: '词汇数量',
          nameTextStyle: { color: '#475569' },
          axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.55)' } },
          axisLabel: { color: '#475569' },
          splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } },
        },
        series: langs.map((lang) => ({
          name: lang,
          type: 'bar' as const,
          stack: 'total',
          data: categories.map((cat) => data.categoryDist[lang]?.[cat] || 0),
          itemStyle: { color: LANG_COLORS[lang] || '#95a5a6' },
        })),
        animationDuration: 1000,
      };
    }

    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => { chart.dispose(); window.removeEventListener('resize', handleResize); };
  }, [data, chartType, selectedLang]);

  const langsWithData = Object.keys(data.categoryDist).filter((l) => Object.keys(LANG_COLORS).includes(l));

  return (
    <section id="category" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-100/90">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <PieChart className="w-6 h-6 text-rose-400" />
          <span className="text-rose-400 text-sm font-semibold uppercase tracking-wider">Category Distribution</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">语义类别分布图</h2>
        <p className="text-slate-500 max-w-2xl mb-6">
          环形图展示单一语种的词汇在各语义类别（如面食、饮品、调味品等）上的分布。
          堆叠柱状图则可跨语种对比各类别的覆盖情况。
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setChartType('pie')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              chartType === 'pie' ? 'bg-white text-slate-900 shadow-lg' : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            环形图
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              chartType === 'bar' ? 'bg-white text-slate-900 shadow-lg' : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            堆叠对比
          </button>
        </div>

        {chartType === 'pie' && (
          <div className="flex flex-wrap gap-2 mb-6">
            {langsWithData.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedLang === lang ? 'text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'
                }`}
                style={selectedLang === lang ? { backgroundColor: LANG_COLORS[lang], boxShadow: `0 4px 15px ${LANG_COLORS[lang]}40` } : {}}
              >
                {lang}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6">
          <div ref={chartRef} className="w-full h-[500px]" />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
            <h4 className="text-rose-400 font-semibold mb-1">类别偏见</h4>
            <p className="text-sm text-slate-500">法语词汇在"烹饪法"和"制度"类别上占比极高，而西班牙语词汇集中于"主食"和"蔬菜"——再次印证殖民金字塔。</p>
          </div>
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
            <h4 className="text-orange-400 font-semibold mb-1">饮品文化</h4>
            <p className="text-sm text-slate-500">意大利语和法语在"饮品"类别上均有显著份额，反映了欧洲葡萄酒和咖啡文化的深远影响。</p>
          </div>
          <div className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-4">
            <h4 className="text-pink-400 font-semibold mb-1">街头食物</h4>
            <p className="text-sm text-slate-500">"街头小吃"类别几乎被西班牙语垄断（taco, burrito, nachos），体现了移民草根通道的特征。</p>
          </div>
        </div>
      </div>
    </section>
  );
}
