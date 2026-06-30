import { useEffect, useRef, useState } from 'react';
import { type VisualizationData } from '../hooks/useData';
import { BookOpen } from 'lucide-react';
import * as echarts from 'echarts';
import { getLangColor } from './langColors';

interface Props {
  data: VisualizationData;
}

const caseInfo: { [key: string]: { title: string; subtitle: string; desc: string } } = {
  restaurant: {
    title: 'Restaurant',
    subtitle: '制度的闪电战（潜伏期23年）',
    desc: 'MW首次记录：1806年 | Ngrams起飞：1829年。Restaurant的快速嵌入不是因为"高雅"，而是因为制度功能性——19世纪工业革命创造了城市公共就餐需求。',
  },
  croissant: {
    title: 'Croissant',
    subtitle: '高雅的百年长征（潜伏期106年）',
    desc: 'MW首次记录：1875年 | Ngrams起飞：1981年。Croissant的长潜伏期揭示了"高雅"的社会建构需要两代人的文化记忆传递（106年）。',
  },
  taco: {
    title: 'Taco',
    subtitle: '移民的游击战（潜伏期71年）',
    desc: 'MW首次记录：1901年 | Ngrams起飞：1972年。Taco的传播是双引擎模式：墨西哥移民社区日常使用 + 1960年代快餐工业（Taco Bell）的制度化跳板。',
  },
  salsa: {
    title: 'Salsa',
    subtitle: '后殖民时代的闪电战（潜伏期25年）',
    desc: 'MW首次记录：1962年 | Ngrams起飞：1987年。受益于1965年移民改革、1980年代多元文化主义和1994年NAFTA的三重历史机遇叠加。',
  },
  sushi: {
    title: 'Sushi',
    subtitle: '文化输出的典范（潜伏期77年）',
    desc: 'MW首次记录：1879年 | Ngrams起飞：1956年。Sushi在二战后随着日本文化输出而普及，是"软实力"词汇传播的经典案例。',
  },
  pizza: {
    title: 'Pizza',
    subtitle: '文化资本积累（潜伏期96年）',
    desc: 'MW首次记录：1825年 | Ngrams起飞：1921年。Pizza通过意大利移民社区的坚持和美国快餐文化的改造，完成了从边缘到主流的逆袭。',
  },
  champagne: {
    title: 'Champagne',
    subtitle: '品牌即文化资本',
    desc: 'MW首次记录：1664年。Champagne作为法国香槟产区的地理标志，成为奢侈和庆祝的代名词，体现了法语词汇的文化资本层优势。',
  },
  burrito: {
    title: 'Burrito',
    subtitle: '快餐工业的双引擎',
    desc: 'MW首次记录：1934年。Burrito与Taco一起构成了墨西哥饮食在美国的主流化路径，反映了移民文化通过商业渠道的制度化嵌入。',
  },
};

export function CaseStudySection({ data }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const [selectedCase, setSelectedCase] = useState<string>('restaurant');

  // Initialize or update chart when selectedCase changes
  useEffect(() => {
    if (!chartRef.current) return;

    const caseData = data.caseStudies[selectedCase];
    if (!caseData) return;

    // Dispose previous chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
    }

    const chart = echarts.init(chartRef.current);
    chartInstanceRef.current = chart;

    const info = caseInfo[selectedCase] || { title: selectedCase, subtitle: '', desc: '' };
    const accent = getLangColor(caseData.lang);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#334155' },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          return `<b>${info.title}</b><br/>年份: ${p.axisValue}<br/>频率: ${Number(p.value).toFixed(4)} ppm`;
        },
      },
      grid: { left: '12%', right: '5%', bottom: '15%', top: '10%' },
      xAxis: {
        type: 'category',
        data: caseData.timeSeries.map((t) => String(t.year)),
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        axisLabel: {
          color: '#475569',
          interval: 39,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        axisLabel: { color: '#475569', formatter: '{value}' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      },
      series: [
        {
          type: 'line',
          data: caseData.timeSeries.map((t) => t.freq),
          smooth: true,
          lineStyle: { color: accent, width: 2 },
          areaStyle: {
            color: accent + '20',
          },
          symbol: 'none',
          markLine: caseData.firstUse
            ? {
                data: [
                  {
                    xAxis: String(caseData.firstUse),
                    label: {
                      formatter: `MW首次记录: ${caseData.firstUse}`,
                      color: '#fff',
                      backgroundColor: accent + '80',
                    },
                    lineStyle: { color: accent, type: 'dashed' },
                  },
                ],
              }
            : undefined,
        },
      ],
      animationDuration: 1000,
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, selectedCase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  const caseKeys = Object.keys(caseInfo);
  const selectedColor = getLangColor(data.caseStudies[selectedCase]?.lang ?? '');

  return (
    <section id="cases" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-6 h-6 text-blue-400" />
          <span className="text-blue-400 text-sm font-semibold uppercase tracking-wider">Case Studies</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">个案深描：词汇的生命周期</h2>
        <p className="text-slate-500 max-w-2xl mb-6">
          每个饮食外来词都有自己的"生命故事"。通过深入分析代表性词汇的Ngrams频率轨迹，
          可以揭示词汇传播的深层机制——从制度需求到文化积累，从移民游击战到后殖民闪电战。
        </p>

        {/* Case selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {caseKeys.map((key) => {
            const info = caseInfo[key];
            const lang = data.caseStudies[key]?.lang ?? '';
            const c = getLangColor(lang);
            return (
              <button
                key={key}
                onClick={() => setSelectedCase(key)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                  selectedCase === key
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-white/5 text-slate-500 border-white/10 hover:text-slate-300'
                }`}
                style={
                  selectedCase === key
                    ? {
                        backgroundColor: c + '30',
                        borderColor: c,
                        boxShadow: `0 4px 20px ${c}30`,
                      }
                    : {}
                }
              >
                <div className="font-bold text-sm">{info.title}</div>
                <div className="opacity-70 text-[10px]">{info.subtitle}</div>
              </button>
            );
          })}
        </div>

        {/* Selected case detail - always render the chart container */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
          <div className="mb-4">
            <h3
              className="text-2xl font-bold"
              style={{ color: selectedColor }}
            >
              {caseInfo[selectedCase]?.title}
            </h3>
            <p className="text-sm text-slate-500 mt-1">{caseInfo[selectedCase]?.subtitle}</p>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              {caseInfo[selectedCase]?.desc}
            </p>
          </div>

          <div ref={chartRef} className="w-full h-[350px]" />
        </div>

        {/* Summary insights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">23年</div>
            <div className="text-xs text-slate-500 mt-1">Restaurant 最短潜伏期</div>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">106年</div>
            <div className="text-xs text-slate-500 mt-1">Croissant 最长潜伏期</div>
          </div>
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">25年</div>
            <div className="text-xs text-slate-500 mt-1">Salsa 后殖民加速</div>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">71年</div>
            <div className="text-xs text-slate-500 mt-1">Taco 移民游击战</div>
          </div>
        </div>
      </div>
    </section>
  );
}
