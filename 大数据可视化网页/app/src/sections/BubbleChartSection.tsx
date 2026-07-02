import { useEffect, useRef, useState } from 'react';
import { type VisualizationData } from '../hooks/useData';
import { CircleDot } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { sectionEmoji } from '../theme/foodDecor';
import * as echarts from 'echarts';
import { LANG_COLORS } from './langColors';

interface Props {
  data: VisualizationData;
}


export function BubbleChartSection({ data }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeLang, setActiveLang] = useState<string>('全部');
  const totalWords = Object.values(data.langStats).reduce((sum, s) => sum + s.total, 0);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const filtered = activeLang === '全部'
      ? data.bubbleData
      : data.bubbleData.filter((d) => d.lang === activeLang);

    const series = Object.keys(LANG_COLORS).map((lang) => {
      const langData = filtered
        .filter((d) => d.lang === lang)
        .map((d) => ({
          name: d.word,
          value: [d.year, d.recentFreq, Math.sqrt(d.totalFreq) * 2, d.category],
          itemStyle: { color: LANG_COLORS[lang] },
        }));

      return {
        name: lang,
        type: 'scatter' as const,
        data: langData,
        symbolSize: (val: number[]) => Math.max(8, Math.min(val[2], 50)),
        emphasis: {
          focus: 'series' as const,
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' },
        },
      };
    });

    const option: echarts.EChartsOption = {
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: 'rgba(148, 163, 184, 0.45)',
        textStyle: { color: '#334155' },
        formatter: (params: any) => {
          const d = params.data;
          return `<div style="font-weight:bold;color:${params.color}">${d.name}</div>
            <div style="color:#475569;font-size:12px">
              首次出现: ${d.value[0]}年<br/>
              近期频率: ${d.value[1].toFixed(2)} ppm<br/>
              类别: ${d.value[3]}
            </div>`;
        },
      },
      legend: {
        data: Object.keys(LANG_COLORS),
        textStyle: { color: '#475569' },
        top: 10,
      },
      grid: { left: '8%', right: '8%', bottom: '10%', top: '15%' },
      xAxis: {
        type: 'value',
        name: '首次出现年份',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { color: '#475569' },
        min: 1550,
        max: 2020,
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.55)' } },
        axisLabel: { color: '#475569' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } },
      },
      yAxis: {
        type: 'value',
        name: '近期平均频率 (ppm)',
        nameLocation: 'middle',
        nameGap: 45,
        nameTextStyle: { color: '#475569' },
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.55)' } },
        axisLabel: { color: '#475569' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } },
      },
      series: activeLang === '全部' ? series : series.filter((s) => s.name === activeLang),
      animationDuration: 1500,
      animationEasing: 'elasticOut',
    };

    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      chart.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, [data, activeLang]);

  const langs = ['全部', ...Object.keys(LANG_COLORS)];

  return (
    <section id="bubble" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-100/90">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          emoji={sectionEmoji.bubble}
          icon={CircleDot}
          kicker="Bubble Chart"
          title="词汇时空分布气泡图"
          accent="pink"
          description="每个气泡代表一个饮食外来词，横轴为首次出现年份，纵轴为近期使用频率，气泡大小反映历史累计频率。通过气泡分布可以观察不同语种的词汇进入英语的时间模式。"
          note={`本图展示 ${data.bubbleData.length} 条在 Google Ngrams 中有语料数据的词（去重约 ${new Set(data.bubbleData.map((d) => d.word.toLowerCase())).size} 个），未覆盖全部 ${totalWords} 个清单词。`}
        />

        <div className="flex flex-wrap gap-2 mb-6">
          {langs.map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveLang(lang)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeLang === lang
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6">
          <div ref={chartRef} className="w-full h-[550px]" />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-4">
            <h4 className="text-pink-400 font-semibold mb-1">早期进入者</h4>
            <p className="text-sm text-slate-500">
              tomato (1604)、potato (1565) 等西班牙语词汇通过哥伦布大交换最早进入英语，体现了殖民扩张对语言的影响。
            </p>
          </div>
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
            <h4 className="text-green-400 font-semibold mb-1">现代热潮</h4>
            <p className="text-sm text-slate-500">
              sushi (1879)、ramen (1962)、kimchi 等词汇在20世纪后期频率激增，反映了全球饮食文化的大融合。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
