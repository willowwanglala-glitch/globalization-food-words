import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Menu, X, BarChart3 } from 'lucide-react';
import type { NavItem } from '../navConfig';

interface Props {
  navItems: NavItem[];
  variant?: 'full' | 'pre';
}

export function Navigation({ navItems, variant = 'full' }: Props) {
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
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-2 min-w-0">
            <BarChart3 className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="font-bold text-slate-900 text-sm hidden sm:block truncate">
              {variant === 'pre' ? '🍜 答辩精简版' : '🍽️ 饮食词汇借用可视化'}
            </span>
            {variant === 'pre' && (
              <span className="hidden lg:inline text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                PRE · 10 屏
              </span>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                {item.label}
              </button>
            ))}
            <Link
              to={variant === 'pre' ? '/' : '/pre'}
              className="ml-2 px-2.5 py-1.5 text-xs text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-md transition-colors whitespace-nowrap"
            >
              {variant === 'pre' ? '完整版' : '答辩版'}
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-slate-500"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white/98 backdrop-blur-md border-t border-slate-200 max-h-[70vh] overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="block w-full text-left px-4 py-3 text-sm text-slate-500 hover:text-amber-400 hover:bg-slate-100"
            >
              {item.label}
            </button>
          ))}
          <Link
            to={variant === 'pre' ? '/' : '/pre'}
            onClick={() => setMobileOpen(false)}
            className="block px-4 py-3 text-sm text-indigo-600 border-t border-slate-200"
          >
            {variant === 'pre' ? '切换到完整版 →' : '切换到答辩精简版 →'}
          </Link>
        </div>
      )}
    </nav>
  );
}
