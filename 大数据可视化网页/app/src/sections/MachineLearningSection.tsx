import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { Brain, Sparkles } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { sectionEmoji } from '../theme/foodDecor';
import { type MlResults } from '../hooks/useMlData';

interface Props {
  data: MlResults;
}

const tooltipBase = {
  backgroundColor: 'rgba(255, 255, 255, 0.98)',
  borderColor: 'rgba(148, 163, 184, 0.45)',
  textStyle: { color: '#334155' },
};

export function MachineLearningSection({ data }: Props) {
  const clusterRef = useRef<HTMLDivElement>(null);
  const curveRef = useRef<HTMLDivElement>(null);
  const importanceRef = useRef<HTMLDivElement>(null);
  const regressionRef = useRef<HTMLDivElement>(null);
  const [clusterFilter, setClusterFilter] = useState<string>('all');

  const clustering = data.clustering;
  const regression = data.regression;

  useEffect(() => {
    if (!clusterRef.current) return;
    const chart = echarts.init(clusterRef.current);
    const clusters = clustering.clusters;
    const points =
      clusterFilter === 'all'
        ? clustering.points
        : clustering.points.filter((p) => p.cluster === Number(clusterFilter));

    const series = clusters.map((cl) => ({
      name: cl.name,
      type: 'scatter' as const,
      data: points
        .filter((p) => p.cluster === cl.id)
        .map((p) => ({
          name: p.word,
          value: [p.pca1, p.pca2, p.popularity],
          meta: p,
        })),
      symbolSize: (val: number[]) => Math.max(8, Math.min(28, val[2] / 4)),
      itemStyle: { color: cl.color, opacity: 0.8 },
      emphasis: { scale: 1.3 },
    }));

    chart.setOption({
      tooltip: {
        ...tooltipBase,
        trigger: 'item',
        formatter: (params: { data: { name: string; meta: MlResults['clustering']['points'][0] } }) => {
          const m = params.data.meta;
          const cl = clusters.find((c) => c.id === m.cluster);
          return `<b>${m.word}</b><br/>聚类：${cl?.name ?? m.cluster}<br/>源语言：${m.source_lang}<br/>首次：${m.first_year}<br/>类别：${m.category}`;
        },
      },
      legend: { top: 8, textStyle: { color: '#94a3b8' } },
      grid: { left: 48, right: 24, top: 48, bottom: 40 },
      xAxis: {
        name: 'PCA-1',
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } },
      },
      yAxis: {
        name: 'PCA-2',
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } },
      },
      series: clusterFilter === 'all' ? series : series.filter((s) => s.data.length),
    });

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      chart.dispose();
      window.removeEventListener('resize', onResize);
    };
  }, [clustering, clusterFilter]);

  useEffect(() => {
    if (!curveRef.current) return;
    const chart = echarts.init(curveRef.current);
    const curves = clustering.centroid_curves;
    const sampledYears = curves[0].years.filter((y) => y % 20 === 0);

    chart.setOption({
      tooltip: { ...tooltipBase, trigger: 'axis' },
      legend: { top: 8, textStyle: { color: '#94a3b8' } },
      grid: { left: 56, right: 24, top: 48, bottom: 40 },
      xAxis: {
        type: 'category',
        data: sampledYears.map(String),
        axisLabel: { color: '#94a3b8' },
      },
      yAxis: {
        type: 'value',
        name: '语料频率（均值）',
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: {
          color: '#94a3b8',
          formatter: (v: number) => (v < 0.001 ? v.toExponential(1) : v.toFixed(4)),
        },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } },
      },
      series: curves.map((c) => {
        const cl = clustering.clusters.find((x) => x.id === c.cluster);
        const idxMap = new Map(c.years.map((y, i) => [y, i]));
        return {
          name: cl?.name ?? `Cluster ${c.cluster}`,
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: cl?.color },
          itemStyle: { color: cl?.color },
          data: sampledYears.map((y) => c.values[idxMap.get(y)!]),
        };
      }),
    });

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      chart.dispose();
      window.removeEventListener('resize', onResize);
    };
  }, [clustering]);

  useEffect(() => {
    if (!importanceRef.current || regression.skipped) return;
    const chart = echarts.init(importanceRef.current);
    const items = [...regression.feature_importance].reverse();

    chart.setOption({
      tooltip: { ...tooltipBase, trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 110, right: 32, top: 24, bottom: 32 },
      xAxis: {
        type: 'value',
        max: 1,
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } },
      },
      yAxis: {
        type: 'category',
        data: items.map((x) => x.feature),
        axisLabel: { color: '#475569' },
      },
      series: [
        {
          type: 'bar',
          data: items.map((x) => x.importance),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#f59e0b' },
              { offset: 1, color: '#ec4899' },
            ]),
          },
          label: { show: true, position: 'right', color: '#94a3b8' },
        },
      ],
    });

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      chart.dispose();
      window.removeEventListener('resize', onResize);
    };
  }, [regression]);

  useEffect(() => {
    if (!regressionRef.current || regression.skipped || !regression.scatter?.length) return;
    const chart = echarts.init(regressionRef.current);
    const pts = regression.scatter.map((p) => [p.actual, p.predicted]);
    const minV = Math.min(...pts.flat());
    const maxV = Math.max(...pts.flat());

    chart.setOption({
      tooltip: {
        ...tooltipBase,
        trigger: 'item',
        formatter: (params: { data: number[] }) =>
          `实际：${params.data[0]}<br/>预测：${params.data[1]}`,
      },
      grid: { left: 48, right: 24, top: 24, bottom: 40 },
      xAxis: {
        name: '实际 log(峰值频率)',
        min: minV - 0.1,
        max: maxV + 0.1,
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } },
      },
      yAxis: {
        name: '预测值',
        min: minV - 0.1,
        max: maxV + 0.1,
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } },
      },
      series: [
        {
          type: 'line',
          data: [
            [minV, minV],
            [maxV, maxV],
          ],
          showSymbol: false,
          lineStyle: { type: 'dashed', color: '#f59e0b', width: 1 },
          tooltip: { show: false },
        },
        {
          type: 'scatter',
          data: pts,
          symbolSize: 8,
          itemStyle: { color: '#ec4899', opacity: 0.75 },
        },
      ],
    });

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      chart.dispose();
      window.removeEventListener('resize', onResize);
    };
  }, [regression]);

  return (
    <section
      id="ml"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-100/90 to-transparent"
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          emoji={sectionEmoji.ml}
          icon={Brain}
          kicker="Machine Learning"
          title="语料轨迹聚类与流行度预测"
          accent="violet"
          description="基于 Google Books Ngram 1800–2020 年频率序列，用 K-Means 发现借词「采纳模式」；用随机森林回归从首次年份、语料统计与源语言预测 log(峰值频率)，量化借词在书面语中的流行潜力。"
        />

        <div className="flex flex-wrap gap-4 mb-4 text-sm text-slate-400">
          <span>
            语料词条 <strong className="text-amber-400">{data.stats.words_with_ngrams}</strong>
          </span>
          <span>
            轮廓系数 <strong className="text-amber-400">{clustering.silhouette}</strong>
          </span>
          <span>
            回归 R² <strong className="text-amber-400">{regression.r2}</strong>
          </span>
          <span>
            5折 CV R² <strong className="text-amber-400">{regression.cv_r2_mean}</strong>
          </span>
        </div>

        <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 mb-8 text-sm text-slate-400 leading-relaxed">
          <p>
            <strong className="text-violet-300">数据范围</strong>：机器学习使用{' '}
            {data.stats.words_with_ngrams} 个在 Ngrams 中有完整 1800–2020 轨迹的去重词（清单共 {data.stats.word_list_rows} 个去重词）。
          </p>
          <p className="mt-2">
            <strong className="text-violet-300">聚类说明</strong>：轮廓系数较高，但各簇样本极不均衡（最大簇占绝大多数），簇名与代表词仅供模式示意，不宜过度解读类别含义。
          </p>
          <p className="mt-2">
            <strong className="text-violet-300">回归说明</strong>：高 R² 主要来自语料统计特征（如历史平均频率）对峰值的解释，不宜解读为「首次年份决定流行度」或因果效应。
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setClusterFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              clusterFilter === 'all'
                ? 'bg-white text-slate-900 shadow-lg'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            全部聚类
          </button>
          {clustering.clusters.map((cl) => (
            <button
              key={cl.id}
              onClick={() => setClusterFilter(String(cl.id))}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                clusterFilter === String(cl.id)
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cl.name} ({cl.count})
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6">
            <h3 className="text-slate-900 font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              PCA 散点图 · 语料轨迹聚类
            </h3>
            <div ref={clusterRef} className="w-full h-[420px]" />
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6">
            <h3 className="text-slate-900 font-semibold mb-4">典型轨迹 · 各聚类平均语料频率</h3>
            <div ref={curveRef} className="w-full h-[380px]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6">
              <h3 className="text-slate-900 font-semibold mb-4">随机森林 · 特征重要性</h3>
              <div ref={importanceRef} className="w-full h-[320px]" />
            </div>
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6">
              <h3 className="text-slate-900 font-semibold mb-4">回归拟合 · 实际 vs 预测</h3>
              <div ref={regressionRef} className="w-full h-[320px]" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {clustering.clusters.map((cl) => (
              <div
                key={cl.id}
                className="bg-white border border-slate-200 shadow-sm rounded-xl p-4"
                style={{ borderColor: `${cl.color}40` }}
              >
                <h4 className="font-semibold text-slate-900 mb-1" style={{ color: cl.color }}>
                  {cl.name}
                </h4>
                <p className="text-xs text-slate-500 mb-2">{cl.description}</p>
                <p className="text-xs text-slate-400">
                  代表词：{cl.examples.slice(0, 5).join('、')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
