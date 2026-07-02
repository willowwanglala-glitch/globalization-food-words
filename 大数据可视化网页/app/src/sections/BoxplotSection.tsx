import { useEffect, useRef, useState } from 'react';
import { type VisualizationData } from '../hooks/useData';
import { BarChart3 } from 'lucide-react';
import * as echarts from 'echarts';
import { getLangColor } from './langColors';

interface Props {
  data: VisualizationData;
}



export function BoxplotSection({ data }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [showOutliers, setShowOutliers] = useState(true);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);

    const langs = Object.keys(data.boxplot);
    const boxData = langs.map((l) => {
      const b = data.boxplot[l];
      const c = getLangColor(l);
      return {
        value: [b.min, b.q1, b.median, b.q3, b.max],
        itemStyle: { color: c + '55', borderColor: c, borderWidth: 2 },
      };
    });

    const scatterData: any[] = [];
    if (showOutliers) {
      langs.forEach((lang, idx) => {
        const outliers = data.boxplot[lang].outliers;
        outliers.forEach((y: number) => {
          scatterData.push({
            value: [idx, y],
            itemStyle: { color: getLangColor(lang), opacity: 0.75 },
          });
        });
      });
    }

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: 'rgba(148, 163, 184, 0.45)',
        textStyle: { color: '#334155' },
        formatter: (params: any) => {
          if (params.seriesType === 'boxplot') {
            const b = data.boxplot[langs[params.dataIndex]];
            return `<b>${langs[params.dataIndex]}</b><br/>
              最小值: ${b.min}<br/>
              下四分位: ${b.q1}<br/>
              中位数: ${b.median}<br/>
              上四分位: ${b.q3}<br/>
              最大值: ${b.max}`;
          }
          return `年份: ${params.value[1]}`;
        },
      },
      grid: { left: '12%', right: '5%', bottom: '10%', top: '8%' },
      xAxis: {
        type: 'category',
        data: langs,
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.55)' } },
        axisLabel: { color: '#475569', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: '首次出现年份',
        nameTextStyle: { color: '#475569' },
        min: 1500,
        max: 2020,
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.55)' } },
        axisLabel: { color: '#475569' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } },
      },
      series: [
        {
          name: 'boxplot',
          type: 'boxplot' as const,
          data: boxData,
          emphasis: {
            itemStyle: { borderWidth: 3 },
          },
        },
        ...(showOutliers ? [{
          name: 'outlier',
          type: 'scatter' as const,
          data: scatterData,
          symbolSize: 6,
        }] : []),
      ],
      animationDuration: 1500,
    };

    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => { chart.dispose(); window.removeEventListener('resize', handleResize); };
  }, [data, showOutliers]);

  return (
    <section id="boxplot" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-100/90">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-6 h-6 text-teal-400" />
          <span className="text-teal-400 text-sm font-semibold uppercase tracking-wider">Box Plot</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">词汇出现年份箱线图</h2>
        <p className="text-slate-500 max-w-2xl mb-6">
          箱线图展示各来源语种饮食词汇首次出现年份的统计分布。箱体代表中间50%数据（IQR），
          中线为中位数，须线延伸至1.5倍IQR范围内的极值，散点为异常值。
        </p>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowOutliers(!showOutliers)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              showOutliers ? 'bg-white text-slate-900 shadow-lg' : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {showOutliers ? '隐藏异常值' : '显示异常值'}
          </button>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6">
          <div ref={chartRef} className="w-full h-[500px]" />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-4">
            <h4 className="text-teal-400 font-semibold mb-1">最早进入者</h4>
            <p className="text-sm text-slate-500">西班牙语和阿拉伯语词汇的箱线图整体偏下，说明这些词汇最早通过古代贸易和殖民扩张进入英语。</p>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <h4 className="text-blue-400 font-semibold mb-1">中位数对比</h4>
            <p className="text-sm text-slate-500">法语词汇的中位数年份（1829年）早于日语（1900年），反映了欧洲饮食文化对英语的更早渗透。</p>
          </div>
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
            <h4 className="text-indigo-400 font-semibold mb-1">异常值解读</h4>
            <p className="text-sm text-slate-500">散点异常值代表了极早或极晚进入英语的词汇，如salsa（1962年）作为后殖民时代的典型代表。</p>
          </div>
        </div>
      </div>
    </section>
  );
}
