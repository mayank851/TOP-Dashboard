import React from 'react';

const NAV_ITEMS = [
  { id: 'overview',     icon: '📊', label: 'Overview' },
  { id: 'top',          icon: '🏆', label: 'TOP Intelligence' },
  { id: 'breakdown',    icon: '💸', label: 'Payout Breakdown' },
  { id: 'trends',       icon: '📈', label: 'Trends' },
];

export default function Sidebar({ activeView, setView, brand, setBrand, availableBrands, onUpload, periodType, setPeriodType }) {
  const fileRef = React.useRef();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) onUpload(f);
    e.target.value = '';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">
          <span className="sidebar-logo-bolt">⚡</span>
          TOP Dashboard
        </div>
        <div className="sidebar-logo-sub">Rethink Future Pvt. Ltd.</div>
      </div>

      {/* Brand selector */}
      <div style={{ padding: '12px 16px 0' }}>
        <div className="sidebar-section-label" style={{ padding: '0 2px 6px', marginTop: 0 }}>Brand</div>
        <select
          className="sidebar-brand-select"
          value={brand}
          onChange={e => setBrand(e.target.value)}
        >
          <option value="TOP">⚡ TOP (Taste of Protein)</option>
          {availableBrands.filter(b => b !== 'TOP').map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
          {availableBrands.length > 1 && <option value="All">All Brands</option>}
        </select>
      </div>

      {/* Period toggle */}
      <div style={{ padding: '10px 16px 0' }}>
        <div className="sidebar-section-label" style={{ padding: '0 2px 6px', marginTop: 0 }}>Period</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Weekly', 'Monthly'].map(p => (
            <button
              key={p}
              onClick={() => setPeriodType(p)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 6, border: '1px solid',
                borderColor: periodType === p ? 'var(--accent-purple)' : 'var(--border-light)',
                background: periodType === p ? 'var(--accent-purple)' : 'transparent',
                color: periodType === p ? '#fff' : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-section-label">Views</div>
      {NAV_ITEMS.map(item => (
        <div
          key={item.id}
          className={`nav-item${activeView === item.id ? ' active' : ''}`}
          onClick={() => setView(item.id)}
        >
          <span className="nav-item-icon">{item.icon}</span>
          {item.label}
        </div>
      ))}

      {/* Actions */}
      <div className="sidebar-section-label">Actions</div>
      <button className="sidebar-upload-btn" onClick={() => fileRef.current?.click()}>
        <span>📁</span> Load New Tracker
      </button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFile} />

      <div style={{ flex: 1 }} />
      <div style={{ padding: '12px 18px 16px', borderTop: '1px solid var(--border)', marginTop: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
          Rethink Future Pvt. Ltd.<br />
          HSR · MTH · BTM · IND
        </div>
      </div>
    </aside>
  );
}
