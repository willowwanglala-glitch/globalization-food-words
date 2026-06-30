import { useState, useEffect } from 'react';

export interface LangStats {
  [key: string]: {
    total: number;
    mw_included: number;
    mw_rate: number;
    median_year: number | null;
    words: Array<{
      word: string;
      year: number | null;
      category: string;
      mw_included: boolean;
      sources_all?: string[];
      is_multi_source?: boolean;
    }>;
  };
}

export interface BubbleItem {
  word: string;
  lang: string;
  year: number;
  totalFreq: number;
  recentFreq: number;
  category: string;
  mwIncluded: boolean;
}

export interface CaseStudy {
  lang: string;
  firstUse: number | null;
  mwIncluded: boolean;
  category: string;
  timeSeries: Array<{ year: number; freq: number }>;
}

export interface LatencyItem {
  lang: string;
  medianYear: number;
  firstQuartile: number;
  thirdQuartile: number;
  wordCount: number;
  mwRate: number;
}

export interface RadarItem {
  lang: string;
  mwRate: number;
  wordCount: number;
  modernity: number;
  diversity: number;
  historicalDepth: number;
}

export interface BoxplotItem {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
}

export interface WordcloudItem {
  name: string;
  value: number;
  lang: string;
}

export interface VisualizationData {
  langStats: LangStats;
  streamgraph: { [key: string]: number[] };
  decades: number[];
  bubbleData: BubbleItem[];
  sankey: {
    nodes: Array<{ name: string }>;
    links: Array<{ source: string; target: string; value: number }>;
  };
  latency: LatencyItem[];
  caseStudies: { [key: string]: CaseStudy };
  treemap: Array<{ name: string; value: number; mwRate: number; medianYear: number | null }>;
  semanticLayers: any;
  network: {
    nodes: Array<{ id: string; name: string; category: string; value: number; color: string }>;
    links: Array<{ source: string; target: string; value: number }>;
  };
  sunburst: any;
  radar: RadarItem[];
  boxplot: { [key: string]: BoxplotItem };
  categoryDist: { [key: string]: { [key: string]: number } };
  wordcloud: WordcloudItem[];
  countryCoords: { [key: string]: number[] };
  targetCoords: { [key: string]: number[] };
}

export function useData() {
  const [data, setData] = useState<VisualizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/visualization_data.json`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
