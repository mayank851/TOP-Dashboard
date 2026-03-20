import React from 'react';

export default function KPICard({ label, value, sub, change, changePct, color = '', small = false, badge }) {
  const renderChange = () => {
    if (changePct == null && change == null) return null;
    const pct = changePct ?? change;
    const isPos = pct > 0;
    const cls = isPos ? 'pos' : pct < 0 ? 'neg' : 'neu';
    const arrow = isPos ? '▲' : '▼';
    return (
      <div className={`kpi-change ${cls}`}>
        {arrow} {Math.abs(pct).toFixed(1)}%
        {sub && <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>{sub}</span>}
      </div>
    );
  };

  return (
    <div className={`kpi-card ${color}`}>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value${small ? ' kpi-value-sm' : ''}`}>{value}</div>
      {sub && changePct == null && change == null && (
        <div className="kpi-sub">{sub}</div>
      )}
      {badge && (
        <span style={{
          display: 'inline-block',
          background: 'rgba(245,197,24,0.15)',
          color: 'var(--accent-gold)',
          borderRadius: 4,
          padding: '2px 8px',
          fontSize: 10,
          fontWeight: 700,
          marginTop: 6,
          letterSpacing: '0.5px',
        }}>{badge}</span>
      )}
      {renderChange()}
    </div>
  );
}
