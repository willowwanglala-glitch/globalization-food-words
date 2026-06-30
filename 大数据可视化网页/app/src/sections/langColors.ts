/** 13 语种全局唯一配色（深色背景下尽量拉开色相差距） */
export const LANG_COLORS: Record<string, string> = {
  法语: '#EF476F',
  西班牙语: '#FF9F1C',
  日语: '#F72585',
  意大利语: '#06D6A0',
  汉语: '#118AB2',
  德语: '#8338EC',
  韩语: '#00B4D8',
  阿拉伯语: '#E85D04',
  波斯语: '#40916C',
  荷兰语: '#4361EE',
  纳瓦特尔语: '#CAD035',
  土耳其语: '#A47148',
  '印地语/乌尔都语': '#FFD60A',
};

/** 全球地图：语种 → 代表国家（GeoJSON 名称） */
export const LANG_COUNTRY: Record<string, string> = {
  法语: 'France',
  西班牙语: 'Mexico',
  日语: 'Japan',
  意大利语: 'Italy',
  汉语: 'China',
  德语: 'Germany',
  韩语: 'South Korea',
  阿拉伯语: 'Saudi Arabia',
  波斯语: 'Iran',
  荷兰语: 'Netherlands',
  纳瓦特尔语: 'Mexico',
  土耳其语: 'Turkey',
  '印地语/乌尔都语': 'India',
};

/** 桑基图语义层（与语种色分离，避免混淆） */
export const LAYER_COLORS: Record<string, string> = {
  制度层: '#EF476F',
  文化资本层: '#FF9F1C',
  身份层: '#8338EC',
  技术层: '#00B4D8',
  食物层: '#06D6A0',
  英语词汇: '#64748b',
};

export const LANG_ORDER = Object.keys(LANG_COLORS);

export const LANG_COLORS_ARRAY = LANG_ORDER.map((lang) => ({
  lang,
  color: LANG_COLORS[lang],
}));

export function getLangColor(lang: string, fallback = '#64748b'): string {
  return LANG_COLORS[lang] ?? fallback;
}

/** 旭日图：内圈语种色，外圈同色系递减透明度 */
export function applySunburstLangColors(
  nodes: Array<{ name: string; children?: unknown[]; value?: number }>
): Array<{ name: string; children?: unknown[]; value?: number; itemStyle?: { color: string; opacity?: number } }> {
  const tint = (hex: string, opacity: number) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  };

  const walk = (
    node: { name: string; children?: unknown[]; value?: number },
    rootLang: string,
    depth: number
  ) => {
    const base = getLangColor(rootLang);
    const opacity = depth === 0 ? 1 : depth === 1 ? 0.82 : depth === 2 ? 0.62 : 0.45;
    const styled: {
      name: string;
      children?: unknown[];
      value?: number;
      itemStyle?: { color: string; opacity?: number };
    } = {
      ...node,
      itemStyle: depth === 0 ? { color: base } : { color: tint(base, opacity), opacity },
    };
    if (node.children) {
      styled.children = (node.children as typeof nodes).map((c) =>
        walk(c as { name: string; children?: unknown[]; value?: number }, rootLang, depth + 1)
      );
    }
    return styled;
  };

  return nodes.map((n) => walk(n, n.name, 0));
}
