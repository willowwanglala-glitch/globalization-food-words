import { useEffect, useRef } from 'react';
import { type VisualizationData } from '../hooks/useData';
import { Globe, BookOpen, Languages, TrendingUp } from 'lucide-react';
import CountUp from 'react-countup';
import { statEmoji, sectionEmoji } from '../theme/foodDecor';

interface Props {
  data: VisualizationData;
  mlWordsWithNgrams?: number;
  variant?: 'full' | 'pre';
}

export function HeroSection({ data, mlWordsWithNgrams, variant = 'full' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated background particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      r: number;
      dx: number;
      dy: number;
      color: string;
      word: string;
    }> = [];

    const words = ['sushi', 'taco', 'pizza', 'croissant', 'ramen', 'dim sum', 'baguette', 'kebab'];
    const colors = ['#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981'];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3 + 1,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        word: words[Math.floor(Math.random() * words.length)],
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '55';
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(245, 158, 11, ${0.1 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animId);
  }, []);

  const totalWords = Object.values(data.langStats).reduce((sum, s) => sum + s.total, 0);
  const multiSourceCount = Object.values(data.langStats).flatMap((s) => s.words).filter(
    (w) => w.is_multi_source || (w.sources_all && w.sources_all.length > 1)
  ).length;
  const totalLangs = Object.keys(data.langStats).length;
  const avgMwRate = Object.values(data.langStats).reduce((sum, s) => sum + s.mw_rate, 0) / totalLangs;

  const statCards = [
    {
      emoji: statEmoji.words,
      icon: BookOpen,
      value: <CountUp end={totalWords} duration={2} />,
      label: '外来饮食词汇',
      card: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200',
      iconCls: 'text-amber-600',
      valueCls: 'text-amber-700',
      labelCls: 'text-amber-700/80',
    },
    {
      emoji: statEmoji.langs,
      icon: Languages,
      value: <CountUp end={totalLangs} duration={2} />,
      label: '来源语种',
      card: 'bg-gradient-to-br from-sky-50 to-cyan-50 border-sky-200',
      iconCls: 'text-sky-600',
      valueCls: 'text-sky-700',
      labelCls: 'text-sky-700/80',
    },
    {
      emoji: statEmoji.mw,
      icon: TrendingUp,
      value: <CountUp end={Math.round(avgMwRate)} duration={2} suffix="%" />,
      label: '词典平均收录率',
      card: 'bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200',
      iconCls: 'text-violet-600',
      valueCls: 'text-violet-700',
      labelCls: 'text-violet-700/80',
    },
    {
      emoji: statEmoji.years,
      icon: Globe,
      value: '1800-2020',
      label: 'Ngrams 时间跨度',
      card: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200',
      iconCls: 'text-emerald-600',
      valueCls: 'text-emerald-700',
      labelCls: 'text-emerald-700/80',
    },
  ] as const;

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-sm mb-6">
          <span aria-hidden>{sectionEmoji.hero}</span>
          <Globe className="w-4 h-4" />
          <span>{variant === 'pre' ? '答辩精简版 · 10 屏' : '大数据与可视化期末项目'}</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            全球化下的
          </span>
          <br />
          <span className="text-slate-900">
            饮食词汇借用 <span className="text-3xl sm:text-4xl lg:text-5xl align-middle" aria-hidden>🥡</span>
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
          探索 {totalWords} 个去重饮食借词如何跨越语言边界——从 Google Ngrams 语料到 MW 词典，
          揭示<span className="text-amber-600 font-semibold">「层累型全球 pantry」</span>与
          <span className="text-indigo-600 font-semibold">语料—词典双轨不对称</span>。
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto mb-10">
          {statCards.map(({ emoji, icon: Icon, value, label, card, iconCls, valueCls, labelCls }) => (
            <div
              key={label}
              className={`relative rounded-xl p-4 border shadow-sm transition-transform hover:scale-[1.02] ${card}`}
            >
              <span className="absolute top-2 right-2 text-lg opacity-90 select-none" aria-hidden>
                {emoji}
              </span>
              <Icon className={`w-6 h-6 mx-auto mb-2 ${iconCls}`} />
              <div className={`text-2xl sm:text-3xl font-bold tabular-nums ${valueCls}`}>{value}</div>
              <div className={`text-xs font-semibold mt-1.5 tracking-wide ${labelCls}`}>{label}</div>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          数据口径：{totalWords} 个去重英文词（其中 {multiSourceCount} 个一词多来源，见清单「来源列表」列）；
          气泡图 {data.bubbleData.length} 条有语料词；机器学习 {mlWordsWithNgrams ?? '—'} 条完整轨迹词。
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => document.getElementById('globalmap')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/25"
          >
            {variant === 'pre' ? '🎬 开始答辩' : '🔍 开始探索'}
          </button>
          <button
            onClick={() => document.getElementById('asymmetry')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/25"
          >
            ⚖️ 双轨不对称
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-amber-400 rounded-full" />
        </div>
      </div>
    </section>
  );
}
