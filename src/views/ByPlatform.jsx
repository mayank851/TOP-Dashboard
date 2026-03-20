import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { filterRecords, sumRecords, getPeriodTrend, fINR, fPct, fNum, formatPeriod } from '../utils/calculations';
import KPICard from '../components/KPICard';

const PLAT_COLORS = { Swiggy: '#fc8019', Zomato: '#e23744' };
const PLAT_TEXT = { Swiggy: 'var(--swiggy)', Zomato: 'var(--zomato)' };

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 12, color: p.color, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
          {p.name}: <strong>{p.value > 1000 ? fINR(p.value, true) : p.value > 100 ? fNum(p.value) : fPct(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

export default function ByPlatform({ records, brand }) {
  const base = brand && brand !== 'All' ? records.filter(r => r.brand === brand) : records;
  const weekly = base.filter(r => r.periodType === 'Weekly');

  const platforms = [...new Set(weekly.map(r => r.platform))].filter(Boolean);
  const [activePlat, setActivePlat] = React.useState('All');

  const filtered = activePlat === 'All' ? weekly : weekly.filter(r => r.platform === activePlat);
  const totals = sumRecords(filtered);

  // Per-platform summary
  const platSummary = platforms.map(p => {
    const recs = weekly.filter(r => r.platform === p);
    const s = sumRecords(recs);
    return { platform: p, ...s };
  }).sort((a, b) => b.gmv - a.gmv);

  const totalGMV = platSummary.reduce((a, b) => a + b.gmv, 0);

  // Trend data
  const platForTrend = activePlat === 'All' ? base : base.filter(r => r.platform === activePlat);
  const trend = getPeriodTrend(platForTrend).map(t => ({ ...t, period: formatPeriod(t.period) }));

  // Swiggy vs Zomato head-to-head if both exist
  const swiggy = platSummary.find(p => p.platform === 'Swiggy');
  const zomato = platSummary.find(p => p.platform === 'Zomato');

  return (
    <div className="content-area">
      <div className="view-header">
        <div className="view-title">🔀 By Platform</div>
        <div className="view-subtitle">{brand && brand !== 'All' ? brand : 'All Brands'} · Swiggy vs Zomato payout analysis</div>
      </div>

      <div className="filter-row">
        <span className="filter-label">Platform</span>
        {['All', ...platforms].map(p => (
          <button key={p} className={`pill${activePlat === p ? ' active' : ''}`} onClick={() => setActivePlat(p)}>
            {p}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="section-title" style={{ marginTop: 0 }}>
        {activePlat === 'All' ? 'All Platforms' : activePlat} — Summary
      </div>
      <div className="kpi-grid kpi-grid-4" style={{ marginBottom: 24 }}>
        <KPICard label="GMV" value={fINR(totals.gmv, true)} color="purple" />
        <KPICard label="Net Payout" value={fINR(totals.netPayout, true)} color="green" />
        <KPICard label="Orders" value={fNum(totals.deliveredOrders)} color="blue" />
        <KPICard label="Net Margin %" value={fPct(totals.netMarginPct)} color={totals.netMarginPct > 20 ? 'green' : 'gold'} />
      </div>

      {/* Swiggy vs Zomato head-to-head */}
      {swiggy && zomato && activePlat === 'All' && (
        <>
          <div className="section-title">Swiggy vs Zomato — Head to Head</div>
          <div className="chart-row chart-row-2" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
              <PlatCard plat={swiggy} totalGMV={totalGMV} />
            </div>
            <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
              <PlatCard plat={zomato} totalGMV={totalGMV} />
            </div>
          </div>

          {/* Comparison bars */}
          <div className="chart-card" style={{ marginBottom: 12 }}>
            <div className="chart-card-title">Key Metrics Comparison</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th><span style={{ color: 'var(--swiggy)' }}>Swiggy</span></th>
                  <th><span style={{ color: 'var(--zomato)' }}>Zomato</span></th>
                  <th>Winner</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Orders', s: swiggy.deliveredOrders, z: zomato.deliveredOrders, fmt: fNum, higher: true },
                  { label: 'GMV', s: swiggy.gmv, z: zomato.gmv, fmt: v => fINR(v, true), higher: true },
                  { label: 'Net Payout', s: swiggy.netPayout, z: zomato.netPayout, fmt: v => fINR(v, true), higher: true },
                  { label: 'Commission%', s: swiggy.commissionPct, z: zomato.commissionPct, fmt: fPct, higher: false },
                  { label: 'Ads%', s: swiggy.adsPct, z: zomato.adsPct, fmt: fPct, higher: false },
                  { label: 'Net Margin%', s: swiggy.netMarginPct, z: zomato.netMarginPct, fmt: fPct, higher: true },
                  { label: 'AOV', s: swiggy.aov, z: zomato.aov, fmt: fINR, higher: true },
                ].map(row => {
                  const sWins = row.higher ? row.s >= row.z : row.s <= row.z;
                  return (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td style={{ color: sWins ? 'var(--accent-green)' : 'var(--text-primary)' }}>{row.fmt(row.s)}</td>
                      <td style={{ color: !sWins ? 'var(--accent-green)' : 'var(--text-primary)' }}>{row.fmt(row.z)}</td>
                      <td>
                        <span style={{ color: sWins ? 'var(--swiggy)' : 'var(--zomato)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12 }}>
                          {sWins ? '🟠 Swiggy' : '🔴 Zomato'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Trend */}
      {trend.length > 1 && (
        <>
          <div className="section-title">Revenue Trend</div>
          <div className="chart-card">
            <div className="chart-card-title">Weekly GMV & Orders — {activePlat === 'All' ? 'All Platforms' : activePlat}</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fill: '#6272a4', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => fINR(v, true)} />
                <Tooltip content={<ChartTip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#8892c4' }} />
                <Line type="monotone" dataKey="gmv" name="GMV" stroke={activePlat === 'Swiggy' ? '#fc8019' : activePlat === 'Zomato' ? '#e23744' : '#6366f1'} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="netPayout" name="Net Payout" stroke="#4ade80" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Full platform breakdown table */}
      <div className="section-title">All Platforms — Full Breakdown</div>
      <div className="chart-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Orders</th>
              <th>GMV</th>
              <th>Net Sales</th>
              <th>Net Payout</th>
              <th>Commission%</th>
              <th>Ads%</th>
              <th>Net Margin%</th>
              <th>AOV</th>
              <th>GMV Share</th>
            </tr>
          </thead>
          <tbody>
            {platSummary.map(p => (
              <tr key={p.platform}>
                <td><span className={`badge-platform badge-${p.platform.toLowerCase()}`}>{p.platform}</span></td>
                <td>{fNum(p.deliveredOrders)}</td>
                <td>{fINR(p.gmv)}</td>
                <td>{fINR(p.netSales)}</td>
                <td style={{ color: 'var(--accent-green)' }}>{fINR(p.netPayout)}</td>
                <td>{fPct(p.commissionPct)}</td>
                <td>{fPct(p.adsPct)}</td>
                <td style={{ color: p.netMarginPct > 20 ? 'var(--accent-green)' : 'var(--accent-gold)' }}>{fPct(p.netMarginPct)}</td>
                <td>{fINR(p.aov)}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{totalGMV > 0 ? fPct(p.gmv / totalGMV * 100) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlatCard({ plat, totalGMV }) {
  const share = totalGMV > 0 ? (plat.gmv / totalGMV) * 100 : 0;
  const isSwiggy = plat.platform === 'Swiggy';
  return (
    <div className="chart-card" style={{ borderLeftColor: isSwiggy ? 'var(--swiggy)' : 'var(--zomato)', borderLeftWidth: 3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span className={`badge-platform badge-${plat.platform.toLowerCase()}`} style={{ fontSize: 13, padding: '4px 14px' }}>
          {plat.platform}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{fPct(share)} of GMV</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { l: 'GMV', v: fINR(plat.gmv, true) },
          { l: 'Net Payout', v: fINR(plat.netPayout, true), green: true },
          { l: 'Orders', v: fNum(plat.deliveredOrders) },
          { l: 'Net Margin%', v: fPct(plat.netMarginPct) },
          { l: 'Commission%', v: fPct(plat.commissionPct) },
          { l: 'Ads%', v: fPct(plat.adsPct) },
        ].map(m => (
          <div key={m.l}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 3 }}>{m.l}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: m.green ? 'var(--accent-green)' : 'var(--text-primary)' }}>{m.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
