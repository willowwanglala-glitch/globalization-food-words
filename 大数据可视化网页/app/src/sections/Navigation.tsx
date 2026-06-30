import { useState, useEffect } from 'react';
import { Menu, X, BarChart3 } from 'lucide-react';

const navItems = [
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
];

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setMobileOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-slate-950/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-white text-sm hidden sm:block">饮食词汇借用可视化</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-amber-400 hover:bg-white rounded-md transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-slate-500"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-950/95 backdrop-blur-md border-t border-white/10">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="block w-full text-left px-4 py-3 text-sm text-slate-500 hover:text-amber-400 hover:bg-white"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
