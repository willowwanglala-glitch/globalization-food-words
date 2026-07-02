import { Routes, Route, Navigate } from 'react-router';
import { useData } from './hooks/useData';
import { useMlData } from './hooks/useMlData';
import { useSpssData } from './hooks/useSpssData';
import { FullReport } from './pages/FullReport';
import { PreReport } from './pages/PreReport';
import { LoadingScreen } from './sections/LoadingScreen';
import { reportUi } from './theme/reportUi';
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
    <div className={reportUi.page}>
      <div className="relative z-10">
      <Routes>
        <Route path="/" element={<FullReport {...sharedProps} />} />
        <Route path="/pre" element={<PreReport {...sharedProps} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </div>
  );
}

export default App;
