import { useData } from './hooks/useData';
import { HeroSection } from './sections/HeroSection';
import { StreamgraphSection } from './sections/StreamgraphSection';
import { BubbleChartSection } from './sections/BubbleChartSection';
import { SankeySection } from './sections/SankeySection';
import { NetworkSection } from './sections/NetworkSection';
import { TreemapSection } from './sections/TreemapSection';
import { LatencySection } from './sections/LatencySection';
import { CaseStudySection } from './sections/CaseStudySection';
import { SunburstSection } from './sections/SunburstSection';
import { RadarSection } from './sections/RadarSection';
import { BoxplotSection } from './sections/BoxplotSection';
import { WordCloudSection } from './sections/WordCloudSection';
import { CategoryDistSection } from './sections/CategoryDistSection';
import { AsymmetrySection } from './sections/AsymmetrySection';
import { GlobalMapSection } from './sections/GlobalMapSection';
import { ConclusionSection } from './sections/ConclusionSection';
import { MachineLearningSection } from './sections/MachineLearningSection';
import { SpssSection } from './sections/SpssSection';
import { Navigation } from './sections/Navigation';
import { LoadingScreen } from './sections/LoadingScreen';
import { useMlData } from './hooks/useMlData';
import { useSpssData } from './hooks/useSpssData';
import './App.css';

function App() {
  const { data, loading, error } = useData();
  const { data: mlData, loading: mlLoading, error: mlError } = useMlData();
  const { data: spssData, loading: spssLoading, error: spssError } = useSpssData();

  if (loading) return <LoadingScreen />;
  if (error || !data) return <div className="text-center p-10 text-red-500">数据加载失败: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <Navigation />
      <HeroSection data={data} mlWordsWithNgrams={mlData?.stats.words_with_ngrams} />
      <GlobalMapSection data={data} />
      <StreamgraphSection data={data} />
      <BubbleChartSection data={data} />
      <WordCloudSection data={data} />
      <SankeySection data={data} />
      <SunburstSection data={data} />
      <NetworkSection data={data} />
      <TreemapSection data={data} />
      <RadarSection data={data} />
      <BoxplotSection data={data} />
      <CategoryDistSection data={data} />
      <AsymmetrySection data={data} />
      {spssLoading && (
        <div className="text-center py-16 text-slate-500 text-sm">SPSS 检验模块加载中…</div>
      )}
      {spssError && (
        <div className="text-center py-16 text-amber-400 text-sm">
          SPSS 数据加载失败：{spssError}（请确认 public/data/spss_mw_category.json 存在）
        </div>
      )}
      {spssData && <SpssSection data={spssData} />}
      <LatencySection data={data} />
      <CaseStudySection data={data} />
      {mlLoading && (
        <div className="text-center py-16 text-slate-500 text-sm">机器学习分析模块加载中…</div>
      )}
      {mlError && (
        <div className="text-center py-16 text-amber-400 text-sm">
          机器学习数据加载失败：{mlError}（请确认 public/data/ml_results.json 存在）
        </div>
      )}
      {mlData && <MachineLearningSection data={mlData} />}
      <ConclusionSection data={data} />
    </div>
  );
}

export default App;
