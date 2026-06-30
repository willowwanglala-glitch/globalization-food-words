import { useEffect, useRef, useState } from 'react';
import { type VisualizationData } from '../hooks/useData';
import { Globe } from 'lucide-react';
import * as echarts from 'echarts';

import { getLangColor, LANG_COUNTRY, LANG_ORDER } from './langColors';

interface Props {
  data: VisualizationData;
}

const targetMeta: { [key: string]: { nameCn: string; color: string } } = {
  'United States of America': { nameCn: '美国', color: '#3b82f6' },
  'United Kingdom': { nameCn: '英国', color: '#60a5fa' },
  'Canada': { nameCn: '加拿大', color: '#93c5fd' },
  'Australia': { nameCn: '澳大利亚', color: '#bfdbfe' },
};

export function GlobalMapSection({ data }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeLang, setActiveLang] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!chartRef.current) return;

    fetch(`${import.meta.env.BASE_URL}data/world_geo.json`)
      .then((res) => res.json())
      .then((geoJson) => {
        echarts.registerMap('world', geoJson as any);
        setMapLoaded(true);
      })
      .catch((err) => console.error('Failed to load world map:', err));
  }, []);

  useEffect(() => {
    if (!chartRef.current || !mapLoaded) return;

    const chart = echarts.init(chartRef.current);

    const coords = data.countryCoords || {};
    const targets = data.targetCoords || {};

    // Build source scatter data (geo coordinate system)
    const sourceData = LANG_ORDER.filter((lang) => !activeLang || lang === activeLang).map((lang) => {
        const country = LANG_COUNTRY[lang];
        const c = coords[country];
        const stats = data.langStats[lang];
        return {
          name: lang,
          value: c ? [c[0], c[1], stats?.total || 10, stats?.mw_rate || 0] : [0, 0, 10, 0],
          itemStyle: { color: getLangColor(lang) },
        };
      })
      .filter((d) => d.value[0] !== 0);

    // Build target scatter data
    const targetData = Object.entries(targets).map(([name, c]) => ({
      name,
      value: [c[0], c[1]],
      symbol: 'diamond',
      itemStyle: { color: targetMeta[name]?.color || '#3b82f6' },
    }));

    // Build flow lines
    const lineData: any[] = [];
    sourceData.forEach((src) => {
      targetData.forEach((tgt) => {
        lineData.push({
          coords: [src.value.slice(0, 2), tgt.value],
          lineStyle: { color: src.itemStyle.color, width: 1, opacity: 0.5, curveness: 0.2 },
        });
      });
    });

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#334155' },
        formatter: (params: any) => {
          if (params.seriesType === 'scatter') {
            const d = params.data;
            if (targetMeta[d.name]) {
              return `<b style="color:${targetMeta[d.name].color}">${targetMeta[d.name].nameCn}</b><br/><span style="color:#475569">英语国家（目标语言）</span>`;
            }
            return `<b style="color:${d.itemStyle?.color || '#fff'}">${d.name}</b><br/>
              国家: <b>${LANG_COUNTRY[d.name] ?? '—'}</b><br/>
              词汇总数: <b>${d.value[2]}</b><br/>
              MW收录率: <b>${d.value[3]}%</b>`;
          }
          return '';
        },
      },
      geo: {
        map: 'world',
        roam: true,
        zoom: 1.2,
        center: [10, 20],
        silent: false,
        itemStyle: {
          areaColor: 'rgba(51, 65, 85, 0.4)',
          borderColor: 'rgba(100, 116, 139, 0.5)',
          borderWidth: 0.5,
        },
        emphasis: {
          itemStyle: {
            areaColor: 'rgba(71, 85, 105, 0.6)',
          },
          label: { show: false },
        },
        label: {
          show: false,
        },
      },
      series: [
        // Flow lines on geo
        {
          type: 'lines',
          coordinateSystem: 'geo',
          data: lineData,
          silent: true,
          lineStyle: { curveness: 0.2 },
          z: 3,
        },
        // Target countries
        {
          type: 'scatter',
          coordinateSystem: 'geo',
          data: targetData,
          symbolSize: 16,
          label: {
            show: true,
            formatter: (p: any) => targetMeta[p.name]?.nameCn || p.name,
            position: 'right',
            color: '#60a5fa',
            fontSize: 11,
            fontWeight: 'bold',
            backgroundColor: 'rgba(241, 245, 249, 0.95)',
            padding: [2, 6],
            borderRadius: 4,
          },
          z: 5,
        },
        // Source language countries with ripple
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: sourceData,
          symbolSize: (val: number[]) => Math.max(10, Math.sqrt(val[2]) * 2.2),
          rippleEffect: { brushType: 'stroke', scale: 2.5, period: 4 },
          label: {
            show: true,
            formatter: '{b}',
            position: 'top',
            color: '#475569',
            fontSize: 10,
            fontWeight: 'bold',
            backgroundColor: 'rgba(226, 232, 240, 0.8)',
            padding: [2, 4],
            borderRadius: 3,
          },
          z: 6,
        },
      ],
      animationDuration: 1500,
    };

    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => { chart.dispose(); window.removeEventListener('resize', handleResize); };
  }, [data, activeLang, mapLoaded]);

  return (
    <section id="globalmap" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-6 h-6 text-blue-400" />
          <span className="text-blue-400 text-sm font-semibold uppercase tracking-wider">Global Flow Map</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">全球饮食词汇流向图</h2>
        <p className="text-slate-500 max-w-2xl mb-6">
          世界地图展示了饮食外来词从来源国家流向英语国家的路径。气泡大小反映词汇数量，颜色区分来源语种。
          点击上方语种可聚焦单一文化圈的传播路径。
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveLang('')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeLang === '' ? 'bg-white text-slate-900 shadow-lg' : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            全部显示
          </button>
          {LANG_ORDER.map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveLang(activeLang === lang ? '' : lang)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                activeLang === lang
                  ? 'text-white shadow-lg border-transparent'
                  : 'bg-white/5 text-slate-500 border-white/10 hover:text-slate-300'
              }`}
              style={activeLang === lang ? { backgroundColor: getLangColor(lang), boxShadow: `0 4px 15px ${getLangColor(lang)}40` } : {}}
            >
              {lang}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6 mb-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            <span>英语国家（目标）</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            <span>来源语种国家</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-slate-500 inline-block" />
            <span>词汇传播路径</span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden relative"
          style={{ background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)' }}>
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-slate-500 text-sm">正在加载世界地图...</div>
            </div>
          )}
          <div ref={chartRef} className="w-full" style={{ height: '520px' }} />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <h4 className="text-blue-400 font-semibold mb-1">多路径传播</h4>
            <p className="text-sm text-slate-500">每个来源语种的词汇同时流向美国、英国、加拿大和澳大利亚等多个英语国家。</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <h4 className="text-amber-400 font-semibold mb-1">殖民与贸易</h4>
            <p className="text-sm text-slate-500">西班牙语和法语词汇通过殖民历史流向美国；波斯语通过古代贸易路线传入英国。</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <h4 className="text-emerald-400 font-semibold mb-1">现代全球化</h4>
            <p className="text-sm text-slate-500">日语和韩语词汇在20世纪后期通过文化输出同时涌向所有英语国家。</p>
          </div>
        </div>
      </div>
    </section>
  );
}
