import React from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, CartesianGrid, LineChart,
} from 'recharts';
import {
  filterRecords, sumRecords, getPeriodTrend, getLocationSummary,
  getPlatformSummary, getPayoutWaterfall, fINR, fPct, fNum, formatPeriod, pctChange,
} from '../utils/calculations';
import KPICard from '../components/KPICard';

const darkTooltipStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-light)',
  borderRadius: 8,
  padding: '10px 14px',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={darkTooltipStyle}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{typeof p.value === 'number' && p.value > 1000 ? fINR(p.value, true) : fPct(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

const RevTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={darkTooltipStyle}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value > 100 ? fINR(p.value, true) : fNum(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

export default function TopIntelligence({ records, brand, periodType }) {
  const [loc, setLoc] = React.useState('All');
  const [plat, setPlat] = React.useState('All');

  const currentBrand = brand || 'TOP';

  // All records for this brand (for location/platform tables — unfiltered by loc/plat)
  const brandRecords = filterRecords(records, { brand: currentBrand, periodType });

  // Filtered records for KPIs (respects loc + plat selection)
  const filteredRecords = filterRecords(records, {
    brand: currentBrand,
    location: loc !== 'All' ? loc : undefined,
    platform: plat !== 'All' ? plat : undefined,
    periodType,
  });

  const totals = sumRecords(filteredRecords);

  // Trend uses filtered records
  const trend = getPeriodTrend(
    filterRecords(records, {
      brand: currentBrand,
      location: loc !== 'All' ? loc : undefined,
      platform: plat !== 'All' ? plat : undefined,
    }),
    periodType
  );

  // Location + platform summary — filtered by loc/plat selections
  const locSummary = getLocationSummary(
    filterRecords(records, { brand: currentBrand, platform: plat !== 'All' ? plat : undefined }),
    null,
    periodType
  );
  const platSummary = getPlatformSummary(
    filterRecords(records, { brand: currentBrand, location: loc !== 'All' ? loc : undefined }),
    null,
    periodType
  );

  const waterfall = getPayoutWaterfall(totals);

  // Period-over-period
  const sortedPeriods = [...new Set(brandRecords.map(r => r.periodStart))].sort();
  const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
  const priorPeriod = sortedPeriods[sortedPeriods.length - 2];
  const lastRecs = sumRecords(filteredRecords.filter(r => r.periodStart === lastPeriod));
  const priorRecs = priorPeriod ? sumRecords(filteredRecords.filter(r => r.periodStart === priorPeriod)) : null;

  const gmvChange = priorRecs ? pctChange(lastRecs.gmv, priorRecs.gmv) : null;
  const ordersChange = priorRecs ? pctChange(lastRecs.deliveredOrders, priorRecs.deliveredOrders) : null;
  const netChange = priorRecs ? pctChange(lastRecs.netPayout, priorRecs.netPayout) : null;

  const trendData = trend.map(t => ({
    ...t,
    period: formatPeriod(t.period, periodType),
    commissionPct: +t.commissionPct.toFixed(1),
    adsPct: +t.adsPct.toFixed(1),
    netMarginPct: +t.netMarginPct.toFixed(1),
    netPayoutOnNetSales: +t.netPayoutOnNetSales.toFixed(1),
  }));

  const brandLocs = ['All', ...new Set(records.filter(r => r.brand === currentBrand && r.periodType === periodType).map(r => r.location))].filter(Boolean);
  const brandPlats = ['All', ...new Set(records.filter(r => r.brand === currentBrand && r.periodType === periodType).map(r => r.platform))].filter(Boolean);

  const periodLabel = periodType === 'Monthly' ? 'MoM' : 'WoW';

  return (
    <div className="content-area">
      <div className="view-header">
        <div className="view-title">🏆 {currentBrand} Intelligence</div>
        <div className="view-subtitle">
          Investor metrics — {periodType} view · {sortedPeriods.length} periods
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <span className="filter-label">Location</span>
        {brandLocs.map(l => (
          <button key={l} className={`pill pill-sm${loc === l ? ' active' : ''}`} onClick={() => setLoc(l)}>{l}</button>
        ))}
        <span style={{ marginLeft: 12 }} className="filter-label">Platform</span>
        {brandPlats.map(p => (
          <button key={p} className={`pill pill-sm${plat === p ? ' active' : ''}`} onClick={() => setPlat(p)}>{p}</button>
        ))}
      </div>

      {/* KPI Row 1 */}
      <div className="section-title" style={{ marginTop: 0 }}>Revenue & Volume</div>
      <div className="kpi-grid kpi-grid-5" style={{ marginBottom: 12 }}>
        <KPICard label="GMV" value={fINR(totals.gmv, true)} color="purple" changePct={gmvChange} sub={`vs prior ${periodType === 'Monthly' ? 'month' : 'week'}`} />
        <KPICard label="Net Payout" value={fINR(totals.netPayout, true)} color="green" changePct={netChange} sub={`vs prior ${periodType === 'Monthly' ? 'month' : 'week'}`} />
        <KPICard label="Net Sales" value={fINR(totals.netSales, true)} color="blue" sub="After discounts" />
        <KPICard label="Orders" value={fNum(totals.deliveredOrders)} color="teal" changePct={ordersChange} sub={`vs prior ${periodType === 'Monthly' ? 'month' : 'week'}`} />
        <KPICard label="AOV" value={fINR(totals.aov)} color="gold" sub="Avg order value" />
      </div>

      {/* KPI Row 2 - Unit Economics */}
      <div className="section-title">Unit Economics</div>
      <div className="kpi-grid kpi-grid-5" style={{ marginBottom: 24 }}>
        <KPICard label="Payout on Net Sales" value={fPct(totals.netPayoutOnNetSales)} color={totals.netPayoutOnNetSales > 55 ? 'green' : totals.netPayoutOnNetSales < 40 ? 'red' : 'gold'} sub="Best margin proxy" />
        <KPICard label="Net Margin % (on GMV)" value={fPct(totals.netMarginPct)} color={totals.netMarginPct > 40 ? 'green' : totals.netMarginPct < 30 ? 'red' : 'gold'} sub="Net payout / GMV" />
        <KPICard label="Commission %" value={fPct(totals.commissionPct)} color={totals.commissionPct > 28 ? 'red' : 'orange'} sub="of GMV" badge={totals.commissionPct > 28 ? 'HIGH' : null} />
        <KPICard label="Ads %" value={fPct(totals.adsPct)} color={totals.adsPct > 12 ? 'red' : totals.adsPct > 8 ? 'gold' : 'teal'} sub="of GMV" badge={totals.adsPct > 12 ? 'MONITOR' : null} />
        <KPICard label="TDS + TCS" value={fINR(totals.tds + totals.tcs, true)} color="purple" sub="Tax deductions" small />
      </div>

      {/* Revenue trend */}
      <div className="section-title">Revenue Trend</div>
      <div className="chart-card" style={{ marginBottom: 12 }}>
        <div className="chart-card-title">GMV & Net Payout — {periodType}</div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={trendData}>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fill: '#6272a4', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => fINR(v, true)} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<RevTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#8892c4' }} />
            <Bar yAxisId="left" dataKey="gmv" name="GMV" fill="#6366f1" radius={[3, 3, 0, 0]} fillOpacity={0.85} />
            <Line yAxisId="left" type="monotone" dataKey="netPayout" name="Net Payout" stroke="#4ade80" strokeWidth={2} dot={{ fill: '#4ade80', r: 4 }} />
            <Line yAxisId="right" type="monotone" dataKey="deliveredOrders" name="Orders" stroke="#f5c518" strokeWidth={2} dot={{ fill: '#f5c518', r: 3 }} strokeDasharray="5 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Unit economics trend */}
      <div className="chart-card" style={{ marginBottom: 12 }}>
        <div className="chart-card-title">Commission% · Ads% · Net Margin% — {periodType} trend</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fill: '#6272a4', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#8892c4' }} />
            <Line type="monotone" dataKey="commissionPct" name="Commission%" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="adsPct" name="Ads%" stroke="#fb923c" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="netPayoutOnNetSales" name="Payout on Net Sales%" stroke="#4ade80" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Platform + Location */}
      <div className="section-title">Platform & Location Split {loc !== 'All' || plat !== 'All' ? `— filtered` : ''}</div>
      <div className="chart-row chart-row-2">
        <div className="chart-card">
          <div className="chart-card-title">By Platform {plat !== 'All' ? `· ${plat} only` : ''}</div>
          <table className="data-table">
            <thead>
              <tr><th>Platform</th><th>Orders</th><th>GMV</th><th>Net Payout</th><th>Payout/NS%</th></tr>
            </thead>
            <tbody>
              {platSummary.map(p => (
                <tr key={p.platform}>
                  <td><span className={`badge-platform badge-${p.platform.toLowerCase()}`}>{p.platform}</span></td>
                  <td>{fNum(p.deliveredOrders)}</td>
                  <td>{fINR(p.gmv, true)}</td>
                  <td style={{ color: 'var(--accent-green)' }}>{fINR(p.netPayout, true)}</td>
                  <td style={{ color: p.netPayoutOnNetSales > 55 ? 'var(--accent-green)' : 'var(--accent-gold)' }}>{fPct(p.netPayoutOnNetSales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="chart-card">
          <div className="chart-card-title">By Location {loc !== 'All' ? `· ${loc} only` : ''}</div>
          <table className="data-table">
            <thead>
              <tr><th>Location</th><th>Orders</th><th>GMV</th><th>Net Payout</th><th>Payout/NS%</th></tr>
            </thead>
            <tbody>
              {locSummary.map(l => (
                <tr key={l.location}>
                  <td><strong>{l.location}</strong></td>
                  <td>{fNum(l.deliveredOrders)}</td>
                  <td>{fINR(l.gmv, true)}</td>
                  <td style={{ color: 'var(--accent-green)' }}>{fINR(l.netPayout, true)}</td>
                  <td style={{ color: l.netPayoutOnNetSales > 55 ? 'var(--accent-green)' : 'var(--accent-gold)' }}>{fPct(l.netPayoutOnNetSales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Waterfall */}
      <div className="section-title">Payout Waterfall</div>
      <div className="chart-card">
        <div className="chart-card-title">How GMV becomes Net Payout — deduction breakdown</div>
        <WaterfallDisplay waterfall={waterfall} />
      </div>
    </div>
  );
}

function WaterfallDisplay({ waterfall }) {
  const { gmv, deductions, netPayout } = waterfall;
  const allRows = [
    { label: 'Gross GMV', value: gmv, color: '#6366f1', isStart: true },
    ...deductions,
    { label: 'Net Payout', value: netPayout, color: '#4ade80', isEnd: true },
  ];
  return (
    <div style={{ padding: '8px 0' }}>
      {allRows.map((row, i) => {
        const isDeduction = row.value < 0;
        const barWidth = gmv > 0 ? (Math.abs(row.value) / gmv) * 100 : 0;
        const pct = gmv > 0 ? (Math.abs(row.value) / gmv) * 100 : 0;
        return (
          <div key={i} className="waterfall-row">
            <div className={`waterfall-label${row.isEnd ? ' total' : ''}`}>{row.label}</div>
            <div className="waterfall-bar-track">
              <div className="waterfall-bar-fill" style={{ width: `${Math.min(barWidth, 100)}%`, background: row.color }} />
            </div>
            <div className="waterfall-amount" style={{ color: row.isEnd ? '#4ade80' : isDeduction ? '#f87171' : 'var(--text-primary)' }}>
              {isDeduction ? `−${fINR(Math.abs(row.value))}` : fINR(row.value)}
            </div>
            <div className="waterfall-pct">{fPct(pct)}</div>
          </div>
        );
      })}
    </div>
  );
}
