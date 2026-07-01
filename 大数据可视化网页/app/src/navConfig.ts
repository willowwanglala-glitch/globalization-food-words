export interface NavItem {
  id: string;
  label: string;
}

/** 完整探索版导航（保留原网页全部模块） */
export const FULL_NAV: NavItem[] = [
  { id: 'hero', label: '首页' },
  { id: 'globalmap', label: '全球地图' },
  { id: 'streamgraph', label: '词汇浪潮' },
  { id: 'bubble', label: '气泡图' },
  { id: 'wordcloud', label: '词云' },
  { id: 'sankey', label: '桑基图' },
  { id: 'sunburst', label: '旭日图' },
  { id: 'network', label: '网络图' },
  { id: 'treemap', label: '树图' },
  { id: 'radar', label: '雷达图' },
  { id: 'boxplot', label: '箱线图' },
  { id: 'category', label: '类别分布' },
  { id: 'asymmetry', label: '双轨不对称' },
  { id: 'spss', label: 'SPSS检验' },
  { id: 'latency', label: '时序分布' },
  { id: 'cases', label: '个案深描' },
  { id: 'ml', label: '机器学习' },
  { id: 'conclusion', label: '核心结论' },
];

/** 答辩精简版导航（10 屏） */
export const PRE_NAV: NavItem[] = [
  { id: 'hero', label: '开头' },
  { id: 'globalmap', label: '全球流向' },
  { id: 'streamgraph', label: '词汇浪潮' },
  { id: 'bubble', label: '气泡图' },
  { id: 'sankey', label: '桑基图' },
  { id: 'asymmetry', label: '双轨不对称' },
  { id: 'spss', label: 'SPSS检验' },
  { id: 'ml', label: '机器学习' },
  { id: 'cases', label: '个案深描' },
  { id: 'conclusion', label: '核心结论' },
];
