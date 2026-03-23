import React from 'react';
import './styles.css';
import { parseTracker, getMetadata } from './utils/parseTracker';
import Sidebar from './components/Sidebar';
import UploadScreen from './views/UploadScreen';
import Overview from './views/Overview';
import TopIntelligence from './views/TopIntelligence';
import PayoutBreakdown from './views/PayoutBreakdown';
import Trends from './views/Trends';
import UnitEconomics from './views/UnitEconomics';

const STORAGE_KEY = 'top_dashboard_records_v1';

function saveToStorage(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export default function App() {
  const [records, setRecords] = React.useState(() => loadFromStorage());
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [view, setView] = React.useState('overview');
  const [brand, setBrand] = React.useState('TOP');
  const [periodType, setPeriodType] = React.useState('Weekly');
  const [meta, setMeta] = React.useState(() => {
    const saved = loadFromStorage();
    return saved ? getMetadata(saved) : { brands: ['TOP'], locations: [], platforms: [] };
  });

  const handleUpload = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const recs = await parseTracker(file);
      if (!recs.length) throw new Error('No data rows found in the Data Log sheet.');
      const m = getMetadata(recs);
      setRecords(recs);
      setMeta(m);
      saveToStorage(recs);
      const defaultBrand = m.brands.includes('TOP') ? 'TOP' : m.brands[0];
      setBrand(defaultBrand);
      setView('overview');
    } catch (e) {
      setError(e.message || 'Failed to parse tracker file.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>⚡</div>
          <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>Parsing tracker…</div>
        </div>
      </div>
    );
  }

  if (!records) {
    return (
      <>
        {error && (
          <div style={{
            position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171',
            borderRadius: 8, padding: '10px 20px', color: '#f87171', fontSize: 13,
            zIndex: 100, fontFamily: 'var(--font-mono)',
          }}>⚠️ {error}</div>
        )}
        <UploadScreen onUpload={handleUpload} />
      </>
    );
  }

  const props = { records, brand, periodType };

  const renderView = () => {
    switch (view) {
      case 'overview':      return <Overview {...props} />;
      case 'top':           return <TopIntelligence {...props} />;
      case 'uniteconomics': return <UnitEconomics {...props} />;
      case 'breakdown':     return <PayoutBreakdown {...props} />;
      case 'trends':        return <Trends {...props} />;
      default:              return <Overview {...props} />;
    }
  };

  return (
    <div className="layout">
      <Sidebar
        activeView={view}
        setView={setView}
        brand={brand}
        setBrand={setBrand}
        availableBrands={meta.brands}
        onUpload={handleUpload}
        periodType={periodType}
        setPeriodType={setPeriodType}
      />
      <main className="main">
        {renderView()}
      </main>
    </div>
  );
}
