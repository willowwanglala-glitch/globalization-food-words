import { useEffect, useRef, useMemo } from 'react';
import { type VisualizationData } from '../hooks/useData';
import { GitBranch } from 'lucide-react';
import * as echarts from 'echarts';
import {
  sankeyLangLayerCount,
  sankeyLayerLeaders,
  sankeyLayerTotal,
} from '../utils/vizStats';
import { getLangColor, LAYER_COLORS } from './langColors';

interface Props {
  data: VisualizationData;
}

export function SankeySection({ data }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const nodes = data.sankey.nodes.map((n) => ({
      name: n.name,
      itemStyle: {
        color: LAYER_COLORS[n.name] ?? getLangColor(n.name),
      },
    }));

    const links = data.sankey.links.map((l) => ({
      source: l.source,
      target: l.target,
      value: l.value,
      lineStyle: { color: 'source', opacity: 0.4 },
    }));

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#334155' },
        formatter: (params: any) => {
          if (params.dataType === 'edge') {
            return `${params.data.source} → ${params.data.target}: <b>${params.data.value}</b> 词`;
          }
          return `<b>${params.name}</b>`;
        },
      },
      series: [
        {
          type: 'sankey' as const,
          emphasis: { focus: 'adjacency' as const },
          nodeAlign: 'left' as const,
          data: nodes,
          links,
          lineStyle: { curveness: 0.5 },
          label: {
            color: '#475569',
            fontSize: 12,
            fontWeight: 'bold',
          },
          left: '5%',
          right: '5%',
          top: '5%',
          bottom: '5%',
        },
      ],
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
  }, [data]);

  const instFr = sankeyLangLayerCount(data, '法语', '制度层');
  const instEs = sankeyLangLayerCount(data, '西班牙语', '制度层');
  const foodLeaders = useMemo(() => sankeyLayerLeaders(data, '食物层', 3), [data]);
  const instTotal = sankeyLayerTotal(data, '制度层');

  return (
    <section id="sankey" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <GitBranch className="w-6 h-6 text-purple-400" />
          <span className="text-purple-400 text-sm font-semibold uppercase tracking-wider">Sankey Diagram</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">语义分层桑基图：多中心全球 Pantry</h2>
        <p className="text-slate-500 max-w-3xl mb-6">
          借词经由制度、文化资本、身份、技术与食物等语义通道进入英语。
          {instTotal > 0
            ? `制度层词条较少（共 ${instTotal} 个），法语 ${instFr} 个、西班牙语 ${instEs} 个；`
            : '制度层词条极少；'}
          食物层由{foodLeaders.map((x) => x.lang).join('、')}等多源汇入——呈现多中心 pantry 结构。
        </p>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6">
          <div ref={chartRef} className="w-full h-[600px]" />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <h4 className="text-red-400 font-semibold mb-1">制度层 (Institutional)</h4>
            <p className="text-sm text-slate-500">
              restaurant、menu 等法语词定义「怎么吃」的秩序。当前清单中制度层共 {instTotal} 词
              （法语 {instFr}、西班牙语 {instEs}）——制度相关借词占比小，不宜过度放大殖民分层。
            </p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <h4 className="text-amber-400 font-semibold mb-1">文化资本层 (Cultural Capital)</h4>
            <p className="text-sm text-slate-500">
              champagne, café, cuisine 等词汇携带了"高雅文化"的标签，成为社会地位的象征。
            </p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <h4 className="text-emerald-400 font-semibold mb-1">食物层 (Food)</h4>
            <p className="text-sm text-slate-500">
              {foodLeaders.length > 0
                ? `${foodLeaders.map((x) => `${x.lang}（${x.value} 词）`).join('、')} 流量最高——食物层由多语种共同填充，无单一殖民主导。`
                : '食物层借词来自多个语种，呈多中心分布。'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
