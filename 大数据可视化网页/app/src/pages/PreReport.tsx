import { HeroSection } from '../sections/HeroSection';
import { GlobalMapSection } from '../sections/GlobalMapSection';
import { StreamgraphSection } from '../sections/StreamgraphSection';
import { BubbleChartSection } from '../sections/BubbleChartSection';
import { SankeySection } from '../sections/SankeySection';
import { AsymmetrySection } from '../sections/AsymmetrySection';
import { SpssSection } from '../sections/SpssSection';
import { MachineLearningSection } from '../sections/MachineLearningSection';
import { CaseStudySection } from '../sections/CaseStudySection';
import { ConclusionSection } from '../sections/ConclusionSection';
import { Navigation } from '../sections/Navigation';
import { PRE_NAV } from '../navConfig';
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

export function PreReport({
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
      <Navigation navItems={PRE_NAV} variant="pre" />
      <HeroSection
        data={data}
        mlWordsWithNgrams={mlData?.stats.words_with_ngrams}
        variant="pre"
      />
      <GlobalMapSection data={data} />
      <StreamgraphSection data={data} />
      <BubbleChartSection data={data} />
      <SankeySection data={data} />
      <AsymmetrySection data={data} />
      {spssLoading && (
        <div className="text-center py-16 text-slate-500 text-sm">SPSS 检验模块加载中…</div>
      )}
      {spssError && (
        <div className="text-center py-16 text-amber-400 text-sm">
          SPSS 数据加载失败：{spssError}
        </div>
      )}
      {spssData && <SpssSection data={spssData} />}
      {mlLoading && (
        <div className="text-center py-16 text-slate-500 text-sm">机器学习分析模块加载中…</div>
      )}
      {mlError && (
        <div className="text-center py-16 text-amber-400 text-sm">
          机器学习数据加载失败：{mlError}
        </div>
      )}
      {mlData && <MachineLearningSection data={mlData} />}
      <CaseStudySection data={data} />
      <ConclusionSection data={data} />
    </>
  );
}
