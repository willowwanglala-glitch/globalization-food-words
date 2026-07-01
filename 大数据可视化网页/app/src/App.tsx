import { Routes, Route } from 'react-router';
import { useData } from './hooks/useData';
import { useMlData } from './hooks/useMlData';
import { useSpssData } from './hooks/useSpssData';
import { FullReport } from './pages/FullReport';
import { PreReport } from './pages/PreReport';
import { LoadingScreen } from './sections/LoadingScreen';
import './App.css';

function App() {
  const { data, loading, error } = useData();
  const { data: mlData, loading: mlLoading, error: mlError } = useMlData();
  const { data: spssData, loading: spssLoading, error: spssError } = useSpssData();

  if (loading) return <LoadingScreen />;
  if (error || !data) {
    return <div className="text-center p-10 text-red-500">数据加载失败: {error}</div>;
  }

  const sharedProps = {
    data,
    mlData: mlData ?? null,
    mlLoading,
    mlError,
    spssData: spssData ?? null,
    spssLoading,
    spssError,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <Routes>
        <Route path="/" element={<FullReport {...sharedProps} />} />
        <Route path="/pre" element={<PreReport {...sharedProps} />} />
      </Routes>
    </div>
  );
}

export default App;
