import { useEffect, useRef } from 'react';
import { type VisualizationData } from '../hooks/useData';
import { Globe, BookOpen, Languages, TrendingUp } from 'lucide-react';
import CountUp from 'react-countup';

interface Props {
  data: VisualizationData;
  mlWordsWithNgrams?: number;
}

export function HeroSection({ data, mlWordsWithNgrams }: Props) {
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
        ctx.fillStyle = p.color + '40';
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

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-sm mb-6">
          <Globe className="w-4 h-4" />
          <span>大数据与可视化期末项目</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            全球化下的
          </span>
          <br />
          <span className="text-white">饮食词汇借用</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-500 max-w-3xl mx-auto mb-8 leading-relaxed">
          探索 {totalWords} 个去重饮食借词如何跨越语言边界——从 Google Ngrams 语料到 MW 词典，
          揭示<span className="text-amber-400 font-semibold">「层累型全球 pantry」</span>与
          <span className="text-indigo-400 font-semibold">语料—词典双轨不对称</span>。
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto mb-10">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <BookOpen className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl sm:text-3xl font-bold text-white">
              <CountUp end={totalWords} duration={2} />
            </div>
            <div className="text-xs text-slate-500 mt-1">外来饮食词汇</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <Languages className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl sm:text-3xl font-bold text-white">
              <CountUp end={totalLangs} duration={2} />
            </div>
            <div className="text-xs text-slate-500 mt-1">来源语种</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <TrendingUp className="w-6 h-6 text-pink-400 mx-auto mb-2" />
            <div className="text-2xl sm:text-3xl font-bold text-white">
              <CountUp end={Math.round(avgMwRate)} duration={2} suffix="%" />
            </div>
            <div className="text-xs text-slate-500 mt-1">词典平均收录率</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <Globe className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-2xl sm:text-3xl font-bold text-white">1800-2020</div>
            <div className="text-xs text-slate-500 mt-1">Ngrams 时间跨度</div>
          </div>
        </div>

        <p className="text-xs text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          数据口径：{totalWords} 个去重英文词（其中 {multiSourceCount} 个一词多来源，见清单「来源列表」列）；
          气泡图 {data.bubbleData.length} 条有语料词；机器学习 {mlWordsWithNgrams ?? '—'} 条完整轨迹词。
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => document.getElementById('streamgraph')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/25"
          >
            开始探索
          </button>
          <button
            onClick={() => document.getElementById('asymmetry')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/25"
          >
            双轨不对称
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
