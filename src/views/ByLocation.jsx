import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { filterRecords, sumRecords, getPeriodTrend, fINR, fPct, fNum, formatPeriod, getPlatformSummary } from '../utils/calculations';
import KPICard from '../components/KPICard';

const LOC_COLORS = { HSR: '#7c6ef5', MTH: '#2dd4bf', BTM: '#f5c518', IND: '#f87171' };

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 12, color: p.color, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
          {p.name}: <strong>{p.value > 100 ? fINR(p.value, true) : fNum(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

export default function ByLocation({ records, brand }) {
  const base = brand && brand !== 'All' ? records.filter(r => r.brand === brand) : records;
  const weekly = base.filter(r => r.periodType === 'Weekly');

  const locations = [...new Set(weekly.map(r => r.location))].filter(Boolean).sort();
  const [activeLoc, setActiveLoc] = React.useState('All');

  const filtered = activeLoc === 'All' ? weekly : weekly.filter(r => r.location === activeLoc);
  const totals = sumRecords(filtered);

  // Trend for active loc
  const locForTrend = activeLoc === 'All' ? base : base.filter(r => r.location === activeLoc);
  const trend = getPeriodTrend(locForTrend).map(t => ({ ...t, period: formatPeriod(t.period) }));

  // Platform split for active loc
  const platSplit = getPlatformSummary(base.filter(r => activeLoc === 'All' || r.location === activeLoc), brand);

  // All locations comparison for bar chart
  const locComparison = locations.map(l => {
    const s = sumRecords(weekly.filter(r => r.location === l));
    return { location: l, ...s };
  });

  return (
    <div className="content-area">
      <div className="view-header">
        <div className="view-title">📍 By Location</div>
        <div className="view-subtitle">{brand && brand !== 'All' ? brand : 'All Brands'} · payout breakdown by kitchen</div>
      </div>

      <div className="filter-row">
        <span className="filter-label">Location</span>
        {['All', ...locations].map(l => (
          <button key={l} className={`pill${activeLoc === l ? ' active' : ''}`} onClick={() => setActiveLoc(l)}>{l}</button>
        ))}
      </div>

      {/* KPIs for selected location */}
      <div className="section-title" style={{ marginTop: 0 }}>
        {activeLoc === 'All' ? 'All Locations' : activeLoc} — Summary
      </div>
      <div className="kpi-grid kpi-grid-4" style={{ marginBottom: 24 }}>
        <KPICard label="GMV" value={fINR(totals.gmv, true)} color="purple" />
        <KPICard label="Net Payout" value={fINR(totals.netPayout, true)} color="green" />
        <KPICard label="Orders" value={fNum(totals.deliveredOrders)} color="blue" />
        <KPICard label="AOV" value={fINR(totals.aov)} color="gold" />
      </div>
      <div className="kpi-grid kpi-grid-4" style={{ marginBottom: 24 }}>
        <KPICard label="Net Margin %" value={fPct(totals.netMarginPct)} color={totals.netMarginPct > 20 ? 'green' : 'gold'} small />
        <KPICard label="Commission %" value={fPct(totals.commissionPct)} color="orange" small />
        <KPICard label="Ads %" value={fPct(totals.adsPct)} color={totals.adsPct > 10 ? 'red' : 'teal'} small />
        <KPICard label="TDS + TCS" value={fINR(totals.tds + totals.tcs, true)} color="purple" small />
      </div>

      {/* Location comparison bar chart (only for All) */}
      {activeLoc === 'All' && (
        <>
          <div className="section-title">Location Comparison</div>
          <div className="chart-row chart-row-2">
            <div className="chart-card">
              <div className="chart-card-title">GMV by Location</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={locComparison} barSize={44}>
                  <XAxis dataKey="location" tick={{ fill: '#6272a4', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => fINR(v, true)} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="gmv" name="GMV" radius={[4, 4, 0, 0]}>
                    {locComparison.map(l => <Cell key={l.location} fill={LOC_COLORS[l.location] || '#6366f1'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="chart-card-title">Net Margin% by Location</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={locComparison} barSize={44}>
                  <XAxis dataKey="location" tick={{ fill: '#6272a4', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(0)}%`} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="netMarginPct" name="Net Margin%" radius={[4, 4, 0, 0]}>
                    {locComparison.map(l => <Cell key={l.location} fill={l.netMarginPct > 20 ? '#4ade80' : l.netMarginPct < 10 ? '#f87171' : '#f5c518'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Trend for selected location */}
      {trend.length > 1 && (
        <>
          <div className="section-title">{activeLoc === 'All' ? 'All Locations' : activeLoc} — Revenue Trend</div>
          <div className="chart-card">
            <div className="chart-card-title">Weekly GMV & Net Payout</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fill: '#6272a4', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => fINR(v, true)} />
                <Tooltip content={<ChartTip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#8892c4' }} />
                <Line type="monotone" dataKey="gmv" name="GMV" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="netPayout" name="Net Payout" stroke="#4ade80" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Platform split for selected location */}
      <div className="section-title">Platform Split</div>
      <div className="chart-card">
        <div className="chart-card-title">Swiggy vs Zomato breakdown</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Orders</th>
              <th>GMV</th>
              <th>Net Payout</th>
              <th>Commission%</th>
              <th>Ads%</th>
              <th>Net Margin%</th>
              <th>AOV</th>
            </tr>
          </thead>
          <tbody>
            {platSplit.map(p => (
              <tr key={p.platform}>
                <td><span className={`badge-platform badge-${p.platform.toLowerCase()}`}>{p.platform}</span></td>
                <td>{fNum(p.deliveredOrders)}</td>
                <td>{fINR(p.gmv)}</td>
                <td style={{ color: 'var(--accent-green)' }}>{fINR(p.netPayout)}</td>
                <td>{fPct(p.commissionPct)}</td>
                <td>{fPct(p.adsPct)}</td>
                <td style={{ color: p.netMarginPct > 20 ? 'var(--accent-green)' : 'var(--accent-gold)' }}>{fPct(p.netMarginPct)}</td>
                <td>{fINR(p.aov)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
