import { useState, useEffect } from 'react';

export interface SpssCategoryRow {
  category: string;
  mw_included: number;
  not_included: number;
  total: number;
  mw_rate: number;
}

export interface SpssChiSquare {
  chi2: number;
  df: number;
  p: number;
  p_display: string | number;
  n_valid: number;
  cells_expected_lt5_pct: number;
  min_expected: number;
}

export interface SpssView {
  label: string;
  categories: SpssCategoryRow[];
  chi_square: SpssChiSquare;
  spss_note?: string;
}

export interface SpssMwCategoryResults {
  test: string;
  description: string;
  overall_mw_rate: number;
  merged: SpssView;
  detailed: SpssView;
}

export function useSpssData() {
  const [data, setData] = useState<SpssMwCategoryResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/spss_mw_category.json`)
      .then((res) => {
        if (!res.ok) throw new Error('spss_mw_category.json 加载失败');
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
