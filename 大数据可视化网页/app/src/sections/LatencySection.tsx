import { useEffect, useRef, useState } from 'react';
import { type VisualizationData } from '../hooks/useData';
import { Clock, BarChart3 } from 'lucide-react';
import * as echarts from 'echarts';
import { getLangColor } from './langColors';

interface Props {
  data: VisualizationData;
}

export function LatencySection({ data }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState<'bar' | 'heatmap'>('bar');

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const sorted = [...data.latency].sort((a, b) => a.medianYear - b.medianYear);

    let option: echarts.EChartsOption;

    if (chartType === 'bar') {
      option = {
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          textStyle: { color: '#334155' },
          formatter: (params: any) => {
            const d = sorted[params[0].dataIndex];
            return `<b>${d.lang}</b><br/>
              中位数首次年份: <b>${d.medianYear}</b><br/>
              词汇总数: <b>${d.wordCount}</b><br/>
              MW收录率: <b>${d.mwRate}%</b><br/>
              年份范围: ${d.firstQuartile} - ${d.thirdQuartile}`;
          },
        },
        grid: { left: '15%', right: '8%', bottom: '12%', top: '8%' },
        xAxis: {
          type: 'value',
          name: '中位数首次出现年份',
          nameLocation: 'middle',
          nameGap: 30,
          nameTextStyle: { color: '#475569' },
          min: 1500,
          max: 2020,
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
          axisLabel: { color: '#475569' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        },
        yAxis: {
          type: 'category',
          data: sorted.map((d) => d.lang),
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
          axisLabel: { color: '#475569', fontSize: 12 },
        },
        series: [
          {
            type: 'bar',
            data: sorted.map((d) => ({
              value: d.medianYear,
              itemStyle: {
                color: getLangColor(d.lang),
                borderRadius: [0, 6, 6, 0],
              },
            })),
            barWidth: '60%',
            label: {
              show: true,
              position: 'right',
              color: '#475569',
              formatter: '{c}年',
            },
            // Error bars for quartiles
            markPoint: {
              data: sorted.map((d, i) => ({
                name: 'range',
                coord: [d.medianYear, i],
                value: `${d.firstQuartile}-${d.thirdQuartile}`,
                itemStyle: { color: 'transparent' },
                label: {
                  show: false,
                },
              })),
            },
          },
        ],
        animationDuration: 1500,
      };
    } else {
      // Heatmap showing lang x decade matrix
      const decades = [1550, 1600, 1650, 1700, 1750, 1800, 1850, 1900, 1950];
      const heatmapData: [number, number, number][] = [];

      sorted.forEach((d, langIdx) => {
        decades.forEach((decade, decIdx) => {
          // Calculate how many words from this lang fall in this decade
          const words = data.langStats[d.lang]?.words || [];
          const count = words.filter((w) => {
            if (!w.year) return false;
            return w.year >= decade && w.year < decade + 50;
          }).length;
          heatmapData.push([decIdx, langIdx, count]);
        });
      });

      option = {
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          textStyle: { color: '#334155' },
          formatter: (params: any) => {
            return `<b>${sorted[params.value[1]].lang}</b><br/>
              ${decades[params.value[0]]}-${decades[params.value[0]] + 49}年代<br/>
              词汇数量: <b>${params.value[2]}</b>`;
          },
        },
        grid: { left: '15%', right: '8%', bottom: '12%', top: '5%' },
        xAxis: {
          type: 'category',
          data: decades.map((d) => `${d}s`),
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
          axisLabel: { color: '#475569' },
        },
        yAxis: {
          type: 'category',
          data: sorted.map((d) => d.lang),
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
          axisLabel: { color: '#475569' },
        },
        visualMap: {
          min: 0,
          max: 20,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '0%',
          inRange: {
            color: ['#1e293b', '#0e7490', '#06b6d4', '#22d3ee', '#67e8f9'],
          },
          textStyle: { color: '#475569' },
        },
        series: [
          {
            type: 'heatmap',
            data: heatmapData,
            label: {
              show: true,
              color: '#475569',
              formatter: (p: any) => (p.value[2] > 0 ? p.value[2] : ''),
            },
            emphasis: {
              itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' },
            },
          },
        ],
        animationDuration: 1000,
      };
    }

    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      chart.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, [data, chartType]);

  return (
    <section id="latency" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="w-6 h-6 text-orange-400" />
          <span className="text-orange-400 text-sm font-semibold uppercase tracking-wider">Latency Analysis</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">深度不对称：首次出现年份分布</h2>
        <p className="text-slate-500 max-w-2xl mb-6">
          下图展示各来源语种饮食借词在 MW 记录中<strong className="text-slate-400">首次出现年份</strong>的中位数及四分位范围
          （非「潜伏期」）。波斯语借词中位首次年最早（1609），意大利语最晚（1893）；法语（1829）与韩语（1885）在时序上相差约 56 年。
        </p>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              chartType === 'bar'
                ? 'bg-white text-slate-900 shadow-lg'
                : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            柱状图
          </button>
          <button
            onClick={() => setChartType('heatmap')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              chartType === 'heatmap'
                ? 'bg-white text-slate-900 shadow-lg'
                : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            热力图
          </button>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6">
          <div ref={chartRef} className="w-full h-[500px]" />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
            <h4 className="text-orange-400 font-semibold mb-1">制度认可 vs 语料时序</h4>
            <p className="text-sm text-slate-500">
              法语 MW 收录率 72.3%，韩语仅 28.2%——「深度不对称」更体现在词典制度化认可上，而非首次出现年份的早晚。
            </p>
          </div>
          <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-4">
            <h4 className="text-teal-400 font-semibold mb-1">早期 vs 晚期进入</h4>
            <p className="text-sm text-slate-500">
              波斯语、纳瓦特尔语借词的中位首次年较早（1609、1709），反映殖民与物种交流早期的词汇输入；日语、意大利语偏晚（1900、1893），与近代餐饮全球化浪潮相关。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
