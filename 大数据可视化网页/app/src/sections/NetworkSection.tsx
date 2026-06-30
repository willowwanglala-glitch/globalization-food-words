import { useEffect, useRef, useState } from 'react';
import { type VisualizationData } from '../hooks/useData';
import { Network } from 'lucide-react';
import * as echarts from 'echarts';

interface Props {
  data: VisualizationData;
}

export function NetworkSection({ data }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [focusLang, setFocusLang] = useState<string>('');

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // Filter nodes and links based on focus
    let nodes = data.network.nodes;
    let links = data.network.links;

    if (focusLang) {
      const connectedNodeIds = new Set<string>([focusLang]);
      links.forEach((l) => {
        if (l.source === focusLang) connectedNodeIds.add(l.target);
        if (l.target === focusLang) connectedNodeIds.add(l.source);
      });
      nodes = nodes.filter((n) => connectedNodeIds.has(n.id));
      links = links.filter((l) => l.source === focusLang || l.target === focusLang);
    }

    const langSize = (v: number) => Math.max(34, Math.min(72, 16 + Math.sqrt(v) * 5));
    const wordSize = (v: number) => Math.max(10, Math.min(26, 8 + v * 0.18));

    const option: echarts.EChartsOption = {
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#cbd5e1' },
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            const kind = params.data.category === 'language' ? '来源语种' : `类别: ${params.data.category}`;
            return `<b style="color:${params.color}">${params.name}</b><br/>${kind}<br/>权重: ${params.data.value}`;
          }
          return '';
        },
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          animation: true,
          roam: true,
          label: {
            show: true,
            position: 'right',
            formatter: '{b}',
            color: '#94a3b8',
            fontSize: 11,
          },
          force: {
            repulsion: 280,
            edgeLength: [80, 180],
            gravity: 0.08,
            friction: 0.6,
          },
          emphasis: {
            focus: 'adjacency',
            label: { show: true, fontSize: 13, fontWeight: 'bold', color: '#e2e8f0' },
          },
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: [0, 8],
          data: nodes.map((n) => ({
            id: n.id,
            name: n.name,
            value: n.value,
            category: n.category,
            symbolSize:
              n.category === 'language' ? langSize(n.value) : wordSize(n.value),
            itemStyle: { color: n.color },
            label: {
              show: n.category === 'language' || n.value >= 40,
              fontSize: n.category === 'language' ? 13 : 10,
              fontWeight: n.category === 'language' ? 'bold' : 'normal',
              color: n.category === 'language' ? '#e2e8f0' : '#94a3b8',
            },
            draggable: true,
          })),
          links: links.map((l) => ({
            source: l.source,
            target: l.target,
            value: l.value,
            lineStyle: {
              width: Math.max(1, Math.min(l.value, 4)),
              curveness: 0.15,
              opacity: 0.45,
            },
          })),
          lineStyle: { color: 'source', curveness: 0.15 },
        },
      ],
      animationDuration: 1200,
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      chart.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, [data, focusLang]);

  const langNodes = data.network.nodes.filter((n) => n.category === 'language');
  const topBySize = [...langNodes].sort((a, b) => b.value - a.value).slice(0, 3);

  return (
    <section id="network" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Network className="w-6 h-6 text-cyan-400" />
          <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider">Force-Directed Graph</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">词汇关系力导向网络图</h2>
        <p className="text-slate-500 max-w-2xl mb-6">
          力导向网络展示 13 个主来源语种（节点大小 = 该语种词数，662 词口径）与 40 个高语料代表词之间的归属关系。
          可拖拽节点、缩放画布，或按语种筛选子网络。
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFocusLang('')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              focusLang === ''
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-white/5 text-slate-500 border border-white/10 hover:text-slate-300'
            }`}
          >
            全部显示
          </button>
          {langNodes.map((n) => (
            <button
              key={n.id}
              onClick={() => setFocusLang(focusLang === n.id ? '' : n.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                focusLang === n.id
                  ? 'text-white shadow-lg border-transparent'
                  : 'bg-white/5 text-slate-500 border-white/10 hover:text-slate-300'
              }`}
              style={
                focusLang === n.id
                  ? { backgroundColor: n.color, boxShadow: `0 4px 15px ${n.color}40` }
                  : {}
              }
            >
              {n.name}
            </button>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6">
          <div ref={chartRef} className="w-full h-[600px]" />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
            <h4 className="text-cyan-400 font-semibold mb-1">网络中心性</h4>
            <p className="text-sm text-slate-500">
              {topBySize.length >= 2
                ? `${topBySize.map((n) => `${n.name}（${n.value} 词）`).join('、')} 为最大节点——食物层借词呈多中心分布，而非单一殖民语种垄断。`
                : '节点大小反映各语种在去重词表中的主来源词数。'}
            </p>
          </div>
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
            <h4 className="text-violet-400 font-semibold mb-1">词汇聚类</h4>
            <p className="text-sm text-slate-500">
              同一语种的词汇在力导向布局中自然聚集，反映了语义相似性和文化亲缘关系。拖拽可重新排列，探索词汇间的隐藏关联。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
