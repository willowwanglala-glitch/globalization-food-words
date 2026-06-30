import { useState, useMemo } from 'react';
import { type VisualizationData } from '../hooks/useData';
import { Cloud } from 'lucide-react';
import { LANG_COLORS } from './langColors';

interface Props {
  data: VisualizationData;
}


export function WordCloudSection({ data }: Props) {
  const [activeLang, setActiveLang] = useState<string>('');
  const [hoveredWord, setHoveredWord] = useState<string>('');

  const words = useMemo(() => {
    const filtered = activeLang
      ? data.wordcloud.filter((w) => w.lang === activeLang)
      : data.wordcloud;
    // Sort by value and normalize
    const maxVal = Math.max(...filtered.map((w) => w.value), 1);
    return filtered.map((w) => ({
      ...w,
      size: Math.max(14, (w.value / maxVal) * 56),
    }));
  }, [data, activeLang]);

  // Pre-computed positions to avoid overlap (simple grid + random offset)
  const positionedWords = useMemo(() => {
    const cols = 8;
    return words.map((w, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const baseX = (col / cols) * 100 + 6;
      const baseY = (row / Math.max(Math.ceil(words.length / cols), 1)) * 100 + 5;
      const offsetX = (Math.sin(i * 7.3) * 4);
      const offsetY = (Math.cos(i * 5.7) * 3);
      return {
        ...w,
        x: Math.max(2, Math.min(92, baseX + offsetX)),
        y: Math.max(2, Math.min(92, baseY + offsetY)),
      };
    });
  }, [words]);

  return (
    <section id="wordcloud" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Cloud className="w-6 h-6 text-sky-400" />
          <span className="text-sky-400 text-sm font-semibold uppercase tracking-wider">Word Cloud</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">高频词汇词云图</h2>
        <p className="text-slate-500 max-w-2xl mb-2">
          词云以字体大小表示词汇的累计使用频率，颜色区分来源语种。越大的词汇代表其在英语书籍中的历史存在感越强。
        </p>
        <p className="text-xs text-slate-500 max-w-2xl mb-6">
          词云含 {data.wordcloud.length} 条词条（去重约{' '}
          {new Set(data.wordcloud.map((w) => w.name.toLowerCase())).size} 个），覆盖有 Ngrams 语料的子集。
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveLang('')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeLang === '' ? 'bg-white text-slate-900 shadow-lg' : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            全部
          </button>
          {Object.keys(LANG_COLORS).map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveLang(activeLang === lang ? '' : lang)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeLang === lang ? 'text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'
              }`}
              style={activeLang === lang ? { backgroundColor: LANG_COLORS[lang], boxShadow: `0 4px 15px ${LANG_COLORS[lang]}40` } : {}}
            >
              {lang}
            </button>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 relative overflow-hidden" style={{ height: '500px' }}>
          {positionedWords.map((w) => (
            <span
              key={`${w.name}-${w.lang}`}
              className="absolute cursor-pointer transition-all duration-300 hover:scale-110 select-none"
              style={{
                left: `${w.x}%`,
                top: `${w.y}%`,
                fontSize: `${w.size}px`,
                color: hoveredWord === w.name ? '#fff' : (LANG_COLORS[w.lang] || '#475569'),
                fontWeight: 'bold',
                textShadow: hoveredWord === w.name ? `0 0 20px ${LANG_COLORS[w.lang] || '#fff'}` : 'none',
                opacity: hoveredWord && hoveredWord !== w.name ? 0.3 : 0.9,
                transform: 'translate(-50%, -50%)',
                zIndex: hoveredWord === w.name ? 10 : 1,
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={() => setHoveredWord(w.name)}
              onMouseLeave={() => setHoveredWord('')}
              title={`${w.name} | ${w.lang} | ${w.value.toFixed(2)} ppm`}
            >
              {w.name}
            </span>
          ))}

          {hoveredWord && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-200 rounded-lg px-4 py-2 text-sm text-white z-20 pointer-events-none">
              {(() => {
                const w = words.find((x) => x.name === hoveredWord);
                return w ? (
                  <span>
                    <b style={{ color: LANG_COLORS[w.lang] || '#fff' }}>{w.name}</b>
                    <span className="text-slate-500 ml-2">{w.lang} | 累计频率: {w.value.toFixed(2)} ppm</span>
                  </span>
                ) : null;
              })()}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-4">
            <h4 className="text-sky-400 font-semibold mb-1">高频霸主</h4>
            <p className="text-sm text-slate-500">sushi, taco, pizza 等词汇因其全球化程度而成为最大的词云元素。</p>
          </div>
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
            <h4 className="text-rose-400 font-semibold mb-1">色彩编码</h4>
            <p className="text-sm text-slate-500">每个颜色对应一个来源语种，通过颜色分布可直观判断哪些语种的词汇在英语中更"响亮"。</p>
          </div>
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
            <h4 className="text-indigo-400 font-semibold mb-1">交互探索</h4>
            <p className="text-sm text-slate-500">悬停词汇可查看详细信息，点击上方语种按钮可筛选特定文化的词汇输出。</p>
          </div>
        </div>
      </div>
    </section>
  );
}
