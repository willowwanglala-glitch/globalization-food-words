/** 全站浅色报告主题 — 共用 Tailwind 类名 */
export const reportUi = {
  page: 'report-page min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/60 text-slate-900',
  sectionTitle: 'text-3xl sm:text-4xl font-bold text-slate-900 mb-4',
  sectionLead: 'text-slate-600 max-w-3xl mb-2 leading-relaxed',
  sectionNote: 'text-xs text-slate-500 max-w-3xl mb-6',
  chartPanel: 'bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6',
  insightCard: 'rounded-xl p-4 border bg-white shadow-sm',
  navScrolled: 'bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200',
  navTitle: 'font-bold text-slate-900 text-sm',
  mobileMenu: 'md:hidden bg-white/98 backdrop-blur-md border-t border-slate-200 max-h-[70vh] overflow-y-auto',
} as const;

/** ECharts 浅色主题 tooltip / 坐标轴 */
export const chartTheme = {
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderColor: 'rgba(148, 163, 184, 0.45)',
    textStyle: { color: '#334155' },
  },
  axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.55)' } },
  axisLabel: { color: '#475569' },
  nameTextStyle: { color: '#64748b' },
  splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } },
} as const;
