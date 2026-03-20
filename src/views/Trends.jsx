import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar, Cell } from 'recharts';
import { filterRecords, getPeriodTrend, fINR, fPct, fNum, formatPeriod, groupBy, sumRecords } from '../utils/calculations';

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 12, color: p.color, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
          {p.name}: <strong>
            {typeof p.value === 'number'
              ? p.value > 10000 ? fINR(p.value, true)
              : p.value > 200 ? fNum(p.value)
              : fPct(p.value)
              : p.value}
          </strong>
        </div>
      ))}
    </div>
  );
};

export default function Trends({ records, brand }) {
  const [metric, setMetric] = React.useState('gmv');
  const [locFilter, setLocFilter] = React.useState('All');

  const base = brand && brand !== 'All' ? records.filter(r => r.brand === brand) : records;
  const weekly = base.filter(r => r.periodType === 'Weekly');
  const locations = [...new Set(weekly.map(r => r.location))].filter(Boolean).sort();

  const filtered = locFilter === 'All' ? base : base.filter(r => r.location === locFilter);
  const trend = getPeriodTrend(filtered).map(t => ({
    ...t,
    period: formatPeriod(t.period),
    commissionPct: +t.commissionPct.toFixed(2),
    adsPct: +t.adsPct.toFixed(2),
    netMarginPct: +t.netMarginPct.toFixed(2),
    discountPct: +t.discountPct.toFixed(2),
    aov: +t.aov.toFixed(0),
  }));

  // Multi-location trend
  const multiLocTrend = (() => {
    const byPeriod = {};
    weekly.forEach(r => {
      const p = formatPeriod(r.periodStart);
      if (!byPeriod[p]) byPeriod[p] = { period: p };
    });

    locations.forEach(l => {
      const locRecords = base.filter(r => r.location === l);
      const locTrend = getPeriodTrend(locRecords);
      locTrend.forEach(t => {
        const p = formatPeriod(t.period);
        if (!byPeriod[p]) byPeriod[p] = { period: p };
        byPeriod[p][l] = t.gmv;
      });
    });

    return Object.values(byPeriod).sort((a, b) => a.period.localeCompare(b.period));
  })();

  const LOC_COLORS = { HSR: '#7c6ef5', MTH: '#2dd4bf', BTM: '#f5c518', IND: '#f87171' };

  const METRIC_OPTIONS = [
    { key: 'gmv', label: 'GMV' },
    { key: 'netPayout', label: 'Net Payout' },
    { key: 'deliveredOrders', label: 'Orders' },
    { key: 'aov', label: 'AOV' },
    { key: 'netMarginPct', label: 'Net Margin%' },
    { key: 'commissionPct', label: 'Commission%' },
    { key: 'adsPct', label: 'Ads%' },
  ];

  return (
    <div className="content-area">
      <div className="view-header">
        <div className="view-title">📈 Trends</div>
        <div className="view-subtitle">{brand && brand !== 'All' ? brand : 'All Brands'} · period-over-period trend analysis</div>
      </div>

      <div className="filter-row">
        <span className="filter-label">Location</span>
        {['All', ...locations].map(l => (
          <button key={l} className={`pill pill-sm${locFilter === l ? ' active' : ''}`} onClick={() => setLocFilter(l)}>{l}</button>
        ))}
      </div>

      <div className="filter-row" style={{ marginTop: 4 }}>
        <span className="filter-label">Metric</span>
        {METRIC_OPTIONS.map(m => (
          <button key={m.key} className={`pill pill-sm${metric === m.key ? ' active' : ''}`} onClick={() => setMetric(m.key)}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Main trend chart */}
      <div className="section-title" style={{ marginTop: 8 }}>
        {METRIC_OPTIONS.find(m => m.key === metric)?.label} — Weekly Trend
      </div>
      <div className="chart-card">
        <div className="chart-card-title">
          {METRIC_OPTIONS.find(m => m.key === metric)?.label} · {locFilter === 'All' ? 'All Locations' : locFilter}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={trend} barSize={Math.max(24, Math.min(52, 300 / (trend.length || 1)))}>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fill: '#6272a4', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              axisLine={false} tickLine={false}
              tickFormatter={v => {
                if (['netMarginPct', 'commissionPct', 'adsPct', 'discountPct'].includes(metric)) return `${v}%`;
                if (metric === 'deliveredOrders') return fNum(v);
                return fINR(v, true);
              }}
            />
            <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey={metric} name={METRIC_OPTIONS.find(m => m.key === metric)?.label} radius={[4, 4, 0, 0]}>
              {trend.map((t, i) => (
                <Cell key={i} fill={
                  metric === 'netMarginPct' ? (t.netMarginPct > 20 ? '#4ade80' : t.netMarginPct < 10 ? '#f87171' : '#f5c518')
                  : metric === 'commissionPct' ? '#f87171'
                  : metric === 'adsPct' ? '#fb923c'
                  : '#6366f1'
                } fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Multi-metric overlay */}
      <div className="section-title">Unit Economics Overlay</div>
      <div className="chart-card">
        <div className="chart-card-title">Commission% vs Ads% vs Net Margin% — trend comparison</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trend}>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fill: '#6272a4', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip content={<ChartTip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#8892c4' }} />
            <Line type="monotone" dataKey="commissionPct" name="Commission%" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="adsPct" name="Ads%" stroke="#fb923c" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="netMarginPct" name="Net Margin%" stroke="#4ade80" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Multi-location GMV trend */}
      {locations.length > 1 && (
        <>
          <div className="section-title">GMV by Location — Weekly</div>
          <div className="chart-card">
            <div className="chart-card-title">Each location's contribution over time</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={multiLocTrend}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fill: '#6272a4', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => fINR(v, true)} />
                <Tooltip content={<ChartTip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#8892c4' }} />
                {locations.map(l => (
                  <Line key={l} type="monotone" dataKey={l} name={l} stroke={LOC_COLORS[l] || '#6366f1'} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
