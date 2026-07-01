import { type VisualizationData } from '../hooks/useData';
import { Globe, BookOpen, TrendingUp, BarChart3, Layers, Scale } from 'lucide-react';
import { useMemo } from 'react';
import { sankeyLayerLeaders, streamSurgeStats } from '../utils/vizStats';

interface Props {
  data: VisualizationData;
}

export function ConclusionSection({ data }: Props) {
  const totalWords = Object.values(data.langStats).reduce((sum, s) => sum + s.total, 0);
  const multiSourceCount = Object.values(data.langStats).flatMap((s) => s.words).filter(
    (w) => w.is_multi_source || (w.sources_all && w.sources_all.length > 1)
  ).length;
  const totalLangs = Object.keys(data.langStats).length;
  const avgMwRate = Object.values(data.langStats).reduce((sum, s) => sum + s.mw_rate, 0) / totalLangs;
  const surge = useMemo(() => streamSurgeStats(data), [data]);
  const foodLeaders = useMemo(() => sankeyLayerLeaders(data, '食物层', 3), [data]);

  return (
    <section id="conclusion" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">核心发现与理论贡献</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            基于 {totalWords} 个去重饮食借词在 Ngrams 语料、MW 首次记录与 MW 收录三维数据上的交叉分析，
            本研究提出「层累型全球 pantry」与「语料—词典双轨不对称」框架。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/5 border border-indigo-500/20 rounded-2xl p-6 hover:border-indigo-500/40 transition-all">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4">
              <Scale className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">语料—词典双轨不对称</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              荷兰语/阿拉伯语/汉语：语料频率高、MW 收录中等；意大利语：收录率 89.6% 但平均语料仅 20.3 ppm。
              韩语 MW 28.2% 却有 30 ppm 平均语料——「响不响」与「收不收」常不同步。
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6 hover:border-amber-500/40 transition-all">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
              <Layers className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">层累型借用</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              首次年 &lt;1800 的词近期语料中位 0.47 ppm，远高于 1950 年后新词（0.05 ppm）。
              早期殖民交换词仍是底层高频，新词叠加而非替代——借用是层累而非换代。
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 transition-all">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">多中心语义分层</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              法语在制度层词条极少；食物层由{foodLeaders.map((x) => x.lang).join('、')}等主导。
              全球 pantry（调料、饮品、主食）多语汇入，而非单一殖民二元结构。
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-6 hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">词典语义场偏见</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              SPSS 卡方检验（662 词，五类语义场）显示 MW 收录与类别显著相关（χ²=32.33，p&lt;.001）。
              饮品类收录率约 46%，技法/调味约 76%——偏见因语义场而异，见「SPSS检验」模块。
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-all">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">1980–2000 语料浪潮</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {surge[0] ? (
                <>
                  {surge[0].lang}聚合频率 {surge[0].v80.toFixed(0)}→{surge[0].v2000.toFixed(0)} ppm（+
                  {surge[0].delta.toFixed(0)}）
                  {surge.length > 1
                    ? `，${surge.slice(1, 4).map((r) => `${r.lang} +${r.delta.toFixed(0)}`).join('、')} ppm。`
                    : '。'}
                </>
              ) : (
                <>1980–2000 年代多语种语料频率同步抬升。</>
              )}
              全球化浪潮呈多语共振。
            </p>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/10 to-sky-500/5 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/40 transition-all">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">轨迹 &gt; 首次年</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              随机森林显示：预测语料峰值时，历史平均频率占 95.7% 特征重要性，首次年份仅 1.8%。
              借词流行度取决于已有使用轨迹，而非「哪一年首次被 MW 记录」。
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-semibold">全球化下的饮食词汇借用</span>
          </div>
          <p className="text-slate-500 text-sm mb-4">
            数据来源：Google Books Ngrams (English corpus, 1800-2020) + Merriam-Webster Dictionary
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500">
            <span>{totalWords} 个去重借词（{multiSourceCount} 个一词多来源）</span>
            <span>·</span>
            <span>{totalLangs} 个来源语种</span>
            <span>·</span>
            <span>{Math.round(avgMwRate)}% 平均 MW 收录率</span>
            <span>·</span>
            <span>1800-2020 年时间跨度</span>
          </div>
          <p className="text-slate-500 text-xs mt-6">
            理论框架：层累型全球 Pantry / 语料—词典双轨不对称 (Corpus–Dictionary Dual-Track Asymmetry)
          </p>
        </div>
      </div>
    </section>
  );
}
