import { type VisualizationData } from '../hooks/useData';

export interface StreamSurgeRow {
  lang: string;
  v80: number;
  v2000: number;
  delta: number;
}

export function streamSurgeStats(data: VisualizationData): StreamSurgeRow[] {
  const decades = data.decades;
  const i80 = decades.indexOf(1980);
  const i2000 = decades.indexOf(2000);
  if (i80 < 0 || i2000 < 0) return [];

  return Object.entries(data.streamgraph)
    .map(([lang, vals]) => ({
      lang,
      v80: vals[i80] ?? 0,
      v2000: vals[i2000] ?? 0,
      delta: (vals[i2000] ?? 0) - (vals[i80] ?? 0),
    }))
    .sort((a, b) => b.delta - a.delta);
}

export function sankeyLangLayerCount(
  data: VisualizationData,
  lang: string,
  layer: string
): number {
  return data.sankey.links
    .filter((l) => l.source === lang && l.target === layer)
    .reduce((sum, l) => sum + l.value, 0);
}

export function sankeyLayerLeaders(
  data: VisualizationData,
  layer: string,
  topN = 3
): Array<{ lang: string; value: number }> {
  const counts = new Map<string, number>();
  for (const l of data.sankey.links) {
    if (l.target !== layer) continue;
    counts.set(l.source, (counts.get(l.source) ?? 0) + l.value);
  }
  return [...counts.entries()]
    .map(([lang, value]) => ({ lang, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);
}

export function sankeyLayerTotal(data: VisualizationData, layer: string): number {
  return data.sankey.links
    .filter((l) => l.target === layer)
    .reduce((sum, l) => sum + l.value, 0);
}
