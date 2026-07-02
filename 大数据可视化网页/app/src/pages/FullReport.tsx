import { HeroSection } from '../sections/HeroSection';
import { StreamgraphSection } from '../sections/StreamgraphSection';
import { BubbleChartSection } from '../sections/BubbleChartSection';
import { SankeySection } from '../sections/SankeySection';
import { NetworkSection } from '../sections/NetworkSection';
import { TreemapSection } from '../sections/TreemapSection';
import { LatencySection } from '../sections/LatencySection';
import { CaseStudySection } from '../sections/CaseStudySection';
import { SunburstSection } from '../sections/SunburstSection';
import { RadarSection } from '../sections/RadarSection';
import { BoxplotSection } from '../sections/BoxplotSection';
import { WordCloudSection } from '../sections/WordCloudSection';
import { CategoryDistSection } from '../sections/CategoryDistSection';
import { AsymmetrySection } from '../sections/AsymmetrySection';
import { GlobalMapSection } from '../sections/GlobalMapSection';
import { ConclusionSection } from '../sections/ConclusionSection';
import { MachineLearningSection } from '../sections/MachineLearningSection';
import { SpssSection } from '../sections/SpssSection';
import { Navigation } from '../sections/Navigation';
import { FULL_NAV } from '../navConfig';
import type { VisualizationData } from '../hooks/useData';
import type { MlResults } from '../hooks/useMlData';
import type { SpssMwCategoryResults } from '../hooks/useSpssData';

interface Props {
  data: VisualizationData;
  mlData: MlResults | null;
  mlLoading: boolean;
  mlError: string | null;
  spssData: SpssMwCategoryResults | null;
  spssLoading: boolean;
  spssError: string | null;
}

export function FullReport({
  data,
  mlData,
  mlLoading,
  mlError,
  spssData,
  spssLoading,
  spssError,
}: Props) {
  return (
    <>
      <Navigation navItems={FULL_NAV} variant="full" />
      <HeroSection
        data={data}
        mlWordsWithNgrams={mlData?.stats.words_with_ngrams}
        variant="full"
      />
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
      {mlLoading && (
        <div className="text-center py-16 text-slate-500 text-sm">机器学习分析模块加载中…</div>
      )}
      {mlError && (
        <div className="text-center py-16 text-amber-400 text-sm">
          机器学习数据加载失败：{mlError}（请确认 public/data/ml_results.json 存在）
        </div>
      )}
      {mlData && <MachineLearningSection data={mlData} />}
      <CaseStudySection data={data} />
      <ConclusionSection data={data} />
    </>
  );
}
