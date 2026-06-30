import { useEffect, useMemo, useRef } from 'react';
import { type VisualizationData } from '../hooks/useData';
import { Scale } from 'lucide-react';
import * as echarts from 'echarts';
import { LANG_COLORS } from './langColors';

interface Props {
  data: VisualizationData;
}

interface LangPoint {
  lang: string;
  mwRate: number;
  avgCorpus: number;
  n: number;
  quadrant: string;
}

function buildLangPoints(data: VisualizationData): LangPoint[] {
  const bubbleMap = new Map(
    data.bubbleData.map((b) => [b.word.toLowerCase(), b])
  );
  const mwMedian = 60;
  const corpusValues: number[] = [];

  const raw = Object.entries(data.langStats).map(([lang, st]) => {
    let sum = 0;
    let n = 0;
    for (const w of st.words) {
      const b = bubbleMap.get(w.word.toLowerCase());
      if (b) {
        sum += b.totalFreq;
        n += 1;
      }
    }
    if (n === 0) return null;
    const avgCorpus = sum / n;
    corpusValues.push(avgCorpus);
    return { lang, mwRate: st.mw_rate, avgCorpus, n };
  });

  const corpusMedian = corpusValues.length
    ? corpusValues.sort((a, b) => a - b)[Math.floor(corpusValues.length / 2)]
    : 50;

  return raw
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map((p) => {
      const highMw = p.mwRate >= mwMedian;
      const highCorpus = p.avgCorpus >= corpusMedian;
      let quadrant = '中间地带';
      if (highMw && highCorpus) quadrant = '双高：制度化且常用';
      else if (highMw && !highCorpus) quadrant = '词典宠儿';
      else if (!highMw && highCorpus) quadrant = '语料主力';
      else quadrant = '双低：边缘借词';
      return { ...p, quadrant };
    });
}

export function AsymmetrySection({ data }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const points = useMemo(() => buildLangPoints(data), [data]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);

    const mwMedian = 60;
    const corpusMedian =
      points.length
        ? [...points].sort((a, b) => a.avgCorpus - b.avgCorpus)[Math.floor(points.length / 2)].avgCorpus
        : 50;

    chart.setOption({
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#cbd5e1' },
        formatter: (params: { data: LangPoint & { value: [number, number] } }) => {
          const d = params.data;
          return `<b>${d.lang}</b><br/>
            MW 收录率：<b>${d.mwRate}%</b><br/>
            平均语料频率：<b>${d.avgCorpus.toFixed(1)}</b> ppm<br/>
            有语料词数：${d.n}<br/>
            <span style="color:#94a3b8">${d.quadrant}</span>`;
        },
      },
      grid: { left: 56, right: 32, top: 40, bottom: 48 },
      xAxis: {
        name: 'MW 收录率 (%)',
        nameLocation: 'middle',
        nameGap: 28,
        min: 15,
        max: 95,
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
      yAxis: {
        name: '平均语料频率 (ppm)',
        nameLocation: 'middle',
        nameGap: 42,
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
      series: [
        {
          type: 'scatter',
          symbolSize: (val: number[]) => Math.max(14, Math.min(36, val[2] / 3)),
          data: points.map((p) => ({
            ...p,
            value: [p.mwRate, p.avgCorpus, p.n],
            itemStyle: { color: LANG_COLORS[p.lang] || '#64748b', opacity: 0.85 },
            label: {
              show: true,
              formatter: p.lang,
              position: 'top',
              color: '#94a3b8',
              fontSize: 10,
            },
          })),
          markLine: {
            silent: true,
            lineStyle: { type: 'dashed', color: 'rgba(148,163,184,0.35)' },
            data: [
              { xAxis: mwMedian },
              { yAxis: corpusMedian },
            ],
          },
        },
      ],
      animationDuration: 1200,
    });

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      chart.dispose();
      window.removeEventListener('resize', onResize);
    };
  }, [points]);

  const dictionaryFavorites = points.filter((p) => p.quadrant === '词典宠儿');
  const corpusGiants = points.filter((p) => p.quadrant === '语料主力');

  return (
    <section
      id="asymmetry"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900/50 to-transparent"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Scale className="w-6 h-6 text-indigo-400" />
          <span className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">
            Corpus vs Dictionary
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">语料权力 vs 词典权力：双轨不对称</h2>
        <p className="text-slate-500 max-w-3xl mb-2">
          横轴为 MW 收录率，纵轴为有 Ngrams 词条的平均累计语料频率。两轴并不总是一致——
          「在书里很响」和「在词典里站稳」可以是两条轨道。
        </p>
        <p className="text-xs text-slate-500 max-w-3xl mb-6">
          虚线划分参照：MW 收录率 60%、语料频率中位数。仅统计在气泡图中有语料的词条。
        </p>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6">
          <div ref={chartRef} className="w-full h-[480px]" />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
            <h4 className="text-indigo-400 font-semibold mb-1">语料主力</h4>
            <p className="text-sm text-slate-500">
              {corpusGiants.length > 0
                ? `${corpusGiants.map((p) => p.lang).join('、')}：书面语频率高，但 MW 收录率中等（如荷兰语 291 ppm / 66.7%）。`
                : '语料频率高于中位、收录率偏低的语种。'}
            </p>
          </div>
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
            <h4 className="text-rose-400 font-semibold mb-1">词典宠儿</h4>
            <p className="text-sm text-slate-500">
              {dictionaryFavorites.length > 0
                ? `${dictionaryFavorites.map((p) => p.lang).join('、')}：MW 收录率高，但平均语料频率偏低（如意大利语 89.6% / 20.3 ppm）。`
                : '收录率高、语料频率偏低的语种。'}
            </p>
          </div>
          <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-4">
            <h4 className="text-teal-400 font-semibold mb-1">制度化滞后</h4>
            <p className="text-sm text-slate-500">
              韩语 MW 仅 28.2%，但有语料词平均 30 ppm；tofu、ketchup 等高频词仍面临收录缺口——使用先行、词典滞后。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
