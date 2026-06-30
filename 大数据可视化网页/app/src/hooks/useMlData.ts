import { useState, useEffect } from 'react';

export interface MlClusterMeta {
  id: number;
  name: string;
  description: string;
  color: string;
  count: number;
  examples: string[];
}

export interface MlPoint {
  word: string;
  word_key: string;
  cluster: number;
  pca1: number;
  pca2: number;
  source_lang: string;
  category: string;
  first_year: number;
  popularity: number;
}

export interface MlCentroidCurve {
  cluster: number;
  name: string;
  years: number[];
  values: number[];
}

export interface MlRegression {
  target: string;
  model: string;
  n_samples: number;
  r2: number;
  cv_r2_mean: number;
  cv_r2_std: number;
  features: string[];
  feature_importance: Array<{ feature: string; importance: number }>;
  scatter: Array<{ actual: number; predicted: number }>;
  skipped?: boolean;
}

export interface MlResults {
  generated_at: string;
  stats: {
    word_list_rows: number;
    words_with_ngrams: number;
    words_exported: number;
    year_range_ngrams: [number, number];
  };
  clustering: {
    method: string;
    k: number;
    silhouette: number;
    pca_explained_variance: number[];
    clusters: MlClusterMeta[];
    points: MlPoint[];
    centroid_curves: MlCentroidCurve[];
  };
  regression: MlRegression;
  narrative: string[];
}

export function useMlData() {
  const [data, setData] = useState<MlResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/ml_results.json`)
      .then((res) => {
        if (!res.ok) throw new Error('ml_results.json 加载失败');
        return res.json();
      })
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
