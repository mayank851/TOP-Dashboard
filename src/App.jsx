import React from 'react';
import './styles.css';
import { parseTracker, getMetadata } from './utils/parseTracker';
import Sidebar from './components/Sidebar';
import UploadScreen from './views/UploadScreen';
import Overview from './views/Overview';
import TopIntelligence from './views/TopIntelligence';
import ByLocation from './views/ByLocation';
import ByPlatform from './views/ByPlatform';
import PayoutBreakdown from './views/PayoutBreakdown';
import Trends from './views/Trends';

export default function App() {
  const [records, setRecords] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [view, setView] = React.useState('overview');
  const [brand, setBrand] = React.useState('TOP');
  const [meta, setMeta] = React.useState({ brands: ['TOP'], locations: [], platforms: [] });

  const handleUpload = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const recs = await parseTracker(file);
      if (!recs.length) throw new Error('No data rows found in the Data Log sheet.');
      const m = getMetadata(recs);
      setRecords(recs);
      setMeta(m);
      // Default to TOP if available, else first brand
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
          <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>
            Parsing tracker…
          </div>
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
          }}>
            ⚠️ {error}
          </div>
        )}
        <UploadScreen onUpload={handleUpload} />
      </>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'overview':    return <Overview records={records} brand={brand} />;
      case 'top':         return <TopIntelligence records={records} brand={brand} />;
      case 'location':    return <ByLocation records={records} brand={brand} />;
      case 'platform':    return <ByPlatform records={records} brand={brand} />;
      case 'breakdown':   return <PayoutBreakdown records={records} brand={brand} />;
      case 'trends':      return <Trends records={records} brand={brand} />;
      default:            return <Overview records={records} brand={brand} />;
    }
  };

  // Show periods in sidebar subtitle
  const periods = [...new Set(records.filter(r => r.periodType === 'Weekly').map(r => r.periodStart))].sort();
  const dateRange = periods.length >= 2
    ? `${periods[0]} → ${periods[periods.length - 1]}`
    : periods[0] || 'No periods';

  return (
    <div className="layout">
      <Sidebar
        activeView={view}
        setView={setView}
        brand={brand}
        setBrand={setBrand}
        availableBrands={meta.brands}
        onUpload={handleUpload}
        dateRange={dateRange}
      />
      <main className="main">
        {renderView()}
      </main>
    </div>
  );
}
