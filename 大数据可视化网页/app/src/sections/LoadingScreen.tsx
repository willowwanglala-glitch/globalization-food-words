import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.random() * 15, 100));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col items-center justify-center z-50">
      <Loader2 className="w-12 h-12 animate-spin text-amber-600 mb-6" />
      <p className="text-3xl mb-3 select-none" aria-hidden>🍽️</p>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">正在加载数据可视化...</h2>
      <p className="text-slate-500 mb-6">662 个去重饮食借词 | Google Ngrams 1800-2020</p>
      <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-slate-500 mt-3 text-sm">{Math.round(progress)}%</p>
    </div>
  );
}
