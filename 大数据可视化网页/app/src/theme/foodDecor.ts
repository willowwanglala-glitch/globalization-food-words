/** 各模块饮食风 emoji 与小装饰文案 */
export const sectionEmoji = {
  hero: '🍽️',
  globalmap: '🗺️',
  streamgraph: '🌊',
  bubble: '🫧',
  wordcloud: '☁️',
  sankey: '🥘',
  sunburst: '🎯',
  network: '🕸️',
  treemap: '🌳',
  radar: '📡',
  boxplot: '📦',
  category: '🏷️',
  asymmetry: '⚖️',
  spss: '📊',
  latency: '⏳',
  cases: '🍜',
  ml: '🧠',
  conclusion: '✨',
} as const;

export const statEmoji = {
  words: '🍱',
  langs: '🌍',
  mw: '📖',
  years: '📅',
} as const;

export const layerEmoji = {
  institutional: '🏛️',
  cultural: '🥂',
  identity: '🪪',
  technique: '🔪',
  food: '🥗',
} as const;

export const insightEmoji = {
  pantry: '🏺',
  wave: '📈',
  dictionary: '📕',
  corpus: '📝',
  cluster: '🧩',
} as const;

export type AccentKey =
  | 'amber'
  | 'sky'
  | 'violet'
  | 'emerald'
  | 'rose'
  | 'indigo'
  | 'purple'
  | 'orange'
  | 'teal'
  | 'cyan'
  | 'pink'
  | 'red';

export const accentStyles: Record<
  AccentKey,
  { badge: string; icon: string; dot: string }
> = {
  amber: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'text-amber-600',
    dot: 'bg-amber-400',
  },
  sky: {
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: 'text-sky-600',
    dot: 'bg-sky-400',
  },
  violet: {
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: 'text-violet-600',
    dot: 'bg-violet-400',
  },
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: 'text-emerald-600',
    dot: 'bg-emerald-400',
  },
  rose: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: 'text-rose-600',
    dot: 'bg-rose-400',
  },
  indigo: {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: 'text-indigo-600',
    dot: 'bg-indigo-400',
  },
  purple: {
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: 'text-purple-600',
    dot: 'bg-purple-400',
  },
  orange: {
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: 'text-orange-600',
    dot: 'bg-orange-400',
  },
  teal: {
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: 'text-teal-600',
    dot: 'bg-teal-400',
  },
  cyan: {
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    icon: 'text-cyan-600',
    dot: 'bg-cyan-400',
  },
  pink: {
    badge: 'bg-pink-50 text-pink-700 border-pink-200',
    icon: 'text-pink-600',
    dot: 'bg-pink-400',
  },
  red: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    icon: 'text-red-600',
    dot: 'bg-red-400',
  },
};
