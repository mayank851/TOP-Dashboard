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
import FounderInsights from '../components/FounderInsights';

const darkTooltipStyle = {
  background: 'var(--bg-card)', border: '1px solid var(--border-light)',
  borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12,
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={darkTooltipStyle}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{typeof p.value === 'number' && p.value > 1000 ? fINR(p.value, true) : `${p.value}%`}</strong>
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
  const periodLabel = periodType === 'Monthly' ? 'month' : 'week';

  const allBrandRecs = filterRecords(records, { brand: currentBrand, periodType });
  const sortedPeriods = [...new Set(allBrandRecs.map(r => r.periodStart))].sort();
  const latestPeriod = sortedPeriods[sortedPeriods.length - 1];
  const priorPeriod = sortedPeriods[sortedPeriods.length - 2];
  const allPeriodStarts = [...new Set(records.filter(r => r.brand === currentBrand).map(r => r.periodStart))].sort();

  const [selectedPeriod, setSelectedPeriod] = React.useState('latest');
  const activePeriod = selectedPeriod === 'latest' ? latestPeriod : selectedPeriod;

  const currentRecs = filterRecords(records, {
    brand: currentBrand,
    location: loc !== 'All' ? loc : undefined,
    platform: plat !== 'All' ? plat : undefined,
    periodType,
  }).filter(r => r.periodStart === activePeriod);

  const priorRecs = priorPeriod ? filterRecords(records, {
    brand: currentBrand,
    location: loc !== 'All' ? loc : undefined,
    platform: plat !== 'All' ? plat : undefined,
    periodType,
  }).filter(r => r.periodStart === priorPeriod) : [];

  const totals = sumRecords(currentRecs);
  const priorTotals = priorRecs.length ? sumRecords(priorRecs) : null;

  const gmvChange = priorTotals ? pctChange(totals.gmv, priorTotals.gmv) : null;
  const ordersChange = priorTotals ? pctChange(totals.deliveredOrders, priorTotals.deliveredOrders) : null;
  const netChange = priorTotals ? pctChange(totals.netPayout, priorTotals.netPayout) : null;
  const nsChange = priorTotals ? pctChange(totals.netPayoutOnNetSales, priorTotals.netPayoutOnNetSales) : null;

  const trendBase = filterRecords(records, {
    brand: currentBrand,
    location: loc !== 'All' ? loc : undefined,
    platform: plat !== 'All' ? plat : undefined,
  });
  const trendData = getPeriodTrend(trendBase, periodType).map(t => ({
    ...t,
    period: formatPeriod(t.period, periodType, allPeriodStarts),
    platformFeesPct: +t.platformFeesPct.toFixed(1),
    adsPct: +t.adsPct.toFixed(1),
    netPayoutOnNetSales: +t.netPayoutOnNetSales.toFixed(1),
  }));

  const locSummary = getLocationSummary(
    filterRecords(records, { brand: currentBrand, platform: plat !== 'All' ? plat : undefined }).filter(r => r.periodStart === activePeriod),
    null, periodType
  );
  const platSummary = getPlatformSummary(
    filterRecords(records, { brand: currentBrand, location: loc !== 'All' ? loc : undefined }).filter(r => r.periodStart === activePeriod),
    null, periodType
  );

  const waterfall = getPayoutWaterfall(totals);
  const brandLocs = ['All', ...new Set(allBrandRecs.map(r => r.location))].filter(Boolean);
  const brandPlats = ['All', ...new Set(allBrandRecs.map(r => r.platform))].filter(Boolean);

  return (
    <div className="content-area">
      <div className="view-header">
        <div className="flex-between">
          <div>
            <div className="view-title">🏆 {currentBrand} Intelligence</div>
            <div className="view-subtitle">
              Showing: <strong style={{ color: 'var(--text-primary)' }}>{formatPeriod(activePeriod, periodType, allPeriodStarts)}</strong>
              {priorTotals && <span> · vs {formatPeriod(priorPeriod, periodType, allPeriodStarts)}</span>}
              {' '}· {sortedPeriods.length} {periodLabel}s in tracker
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 480 }}>
            <button className={`pill pill-sm${selectedPeriod === 'latest' ? ' active' : ''}`} onClick={() => setSelectedPeriod('latest')}>Latest</button>
            {[...sortedPeriods].reverse().slice(0, 6).map(p => (
              <button key={p} className={`pill pill-sm${selectedPeriod === p && selectedPeriod !== 'latest' ? ' active' : ''}`} onClick={() => setSelectedPeriod(p)}>
                {formatPeriod(p, periodType, allPeriodStarts)}
              </button>
            ))}
          </div>
        </div>
      </div>

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

      <div className="section-title" style={{ marginTop: 0 }}>Revenue & Volume — {formatPeriod(activePeriod, periodType, allPeriodStarts)}</div>
      <div className="kpi-grid kpi-grid-5" style={{ marginBottom: 12 }}>
        <KPICard label="GMV" value={fINR(totals.gmv, true)} color="purple" changePct={gmvChange} sub={`vs prior ${periodLabel}`} />
        <KPICard label="Net Payout" value={fINR(totals.netPayout, true)} color="green" changePct={netChange} sub={`vs prior ${periodLabel}`} />
        <KPICard label="Net Sales" value={fINR(totals.netSales, true)} color="blue" sub="After discounts" />
        <KPICard label="Orders" value={fNum(totals.deliveredOrders)} color="teal" changePct={ordersChange} sub={`vs prior ${periodLabel}`} />
        <KPICard label="AOV" value={fINR(totals.aov)} color="gold" sub="Avg order value" />
      </div>

      {priorTotals && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16,
          display: 'flex', gap: 32, flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, alignSelf: 'center', marginRight: 8 }}>
            Prior {periodLabel} ({formatPeriod(priorPeriod, periodType, allPeriodStarts)})
          </div>
          {[
            { l: 'GMV', v: fINR(priorTotals.gmv, true) },
            { l: 'Net Payout', v: fINR(priorTotals.netPayout, true) },
            { l: 'Orders', v: fNum(priorTotals.deliveredOrders) },
            { l: 'AOV', v: fINR(priorTotals.aov) },
            { l: 'Payout/NS%', v: fPct(priorTotals.netPayoutOnNetSales) },
            { l: 'PlatFees%', v: fPct(priorTotals.platformFeesPct) },
          ].map(m => (
            <div key={m.l}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>{m.l}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>{m.v}</div>
            </div>
          ))}
        </div>
      )}

      <div className="section-title">Unit Economics</div>
      <div className="kpi-grid kpi-grid-5" style={{ marginBottom: 12 }}>
        <KPICard label="Payout on Net Sales" value={fPct(totals.netPayoutOnNetSales)} color={totals.netPayoutOnNetSales > 55 ? 'green' : totals.netPayoutOnNetSales < 40 ? 'red' : 'gold'} changePct={nsChange} sub={`vs prior ${periodLabel}`} />
        <KPICard label="Net Margin % (on GMV)" value={fPct(totals.netMarginPct)} color={totals.netMarginPct > 40 ? 'green' : totals.netMarginPct < 30 ? 'red' : 'gold'} sub="Net payout / GMV" />
        <KPICard label="Platform Fees % (on NS)" value={fPct(totals.platformFeesPct)} color={totals.platformFeesPct > 35 ? 'red' : totals.platformFeesPct > 28 ? 'gold' : 'orange'} sub="incl. commission" badge={totals.platformFeesPct > 35 ? 'HIGH' : null} />
        <KPICard label="Ads % (on NS)" value={fPct(totals.adsPct)} color={totals.adsPct > 10 ? 'red' : totals.adsPct > 6 ? 'gold' : 'teal'} sub="of Net Sales" badge={totals.adsPct > 10 ? 'MONITOR' : null} />
        <KPICard label="Discount % of GMV" value={fPct(totals.discountPct)} color={totals.discountPct > 25 ? 'red' : totals.discountPct > 20 ? 'gold' : 'teal'} sub="Platform discount share" badge={totals.discountPct > 25 ? 'HIGH' : null} />
      </div>
      <div className="kpi-grid kpi-grid-5" style={{ marginBottom: 24 }}>
        <KPICard label="TDS + TCS" value={fINR(totals.tds + totals.tcs, true)} color="purple" sub="Tax deductions" small />
      </div>

      <div className="section-title">Revenue Trend — All Periods</div>
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

      <div className="chart-card" style={{ marginBottom: 12 }}>
        <div className="chart-card-title">Platform Fees% · Ads% · Payout on Net Sales% — trend</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fill: '#6272a4', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#8892c4' }} />
            <Line type="monotone" dataKey="platformFeesPct" name="Platform Fees%" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="adsPct" name="Ads%" stroke="#fb923c" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="netPayoutOnNetSales" name="Payout/NS%" stroke="#4ade80" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="section-title">Platform & Location — {formatPeriod(activePeriod, periodType, allPeriodStarts)}</div>
      <div className="chart-row chart-row-2">
        <div className="chart-card">
          <div className="chart-card-title">By Platform</div>
          <table className="data-table">
            <thead>
              <tr><th>Platform</th><th>Orders</th><th>GMV</th><th>Net Payout</th><th>Payout/NS%</th></tr>
            </thead>
            <tbody>
              {platSummary.length ? platSummary.map(p => (
                <tr key={p.platform}>
                  <td><span className={`badge-platform badge-${p.platform.toLowerCase()}`}>{p.platform}</span></td>
                  <td>{fNum(p.deliveredOrders)}</td>
                  <td>{fINR(p.gmv, true)}</td>
                  <td style={{ color: 'var(--accent-green)' }}>{fINR(p.netPayout, true)}</td>
                  <td style={{ color: p.netPayoutOnNetSales > 55 ? 'var(--accent-green)' : 'var(--accent-gold)' }}>{fPct(p.netPayoutOnNetSales)}</td>
                </tr>
              )) : <tr><td colSpan={5} className="no-data">No data for this period</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="chart-card">
          <div className="chart-card-title">By Location</div>
          <table className="data-table">
            <thead>
              <tr><th>Location</th><th>Orders</th><th>GMV</th><th>Net Payout</th><th>Payout/NS%</th></tr>
            </thead>
            <tbody>
              {locSummary.length ? locSummary.map(l => (
                <tr key={l.location}>
                  <td><strong>{l.location}</strong></td>
                  <td>{fNum(l.deliveredOrders)}</td>
                  <td>{fINR(l.gmv, true)}</td>
                  <td style={{ color: 'var(--accent-green)' }}>{fINR(l.netPayout, true)}</td>
                  <td style={{ color: l.netPayoutOnNetSales > 55 ? 'var(--accent-green)' : 'var(--accent-gold)' }}>{fPct(l.netPayoutOnNetSales)}</td>
                </tr>
              )) : <tr><td colSpan={5} className="no-data">No data for this period</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-title">Payout Waterfall — {formatPeriod(activePeriod, periodType, allPeriodStarts)}</div>
      <div className="chart-card">
        <div className="chart-card-title">How GMV becomes Net Payout — deduction breakdown</div>
        <WaterfallDisplay waterfall={waterfall} />
      </div>

      <FounderInsights
        data={{
          period: formatPeriod(activePeriod, periodType, allPeriodStarts),
          brand: currentBrand,
          gmv: fINR(totals.gmv, true),
          netPayout: fINR(totals.netPayout, true),
          orders: fNum(totals.deliveredOrders),
          aov: fINR(totals.aov),
          netPayoutOnNetSalesPct: fPct(totals.netPayoutOnNetSales),
          platformFeesPct: fPct(totals.platformFeesPct),
          adsPct: fPct(totals.adsPct),
          discountPct: fPct(totals.discountPct),
          gmvChange: gmvChange != null ? fPct(gmvChange) : 'N/A',
          ordersChange: ordersChange != null ? fPct(ordersChange) : 'N/A',
          netChange: netChange != null ? fPct(netChange) : 'N/A',
          platformSplit: platSummary.map(p => ({ platform: p.platform, gmv: fINR(p.gmv, true), netPayoutOnNetSales: fPct(p.netPayoutOnNetSales) })),
          locationSplit: locSummary.map(l => ({ location: l.location, gmv: fINR(l.gmv, true), netPayoutOnNetSales: fPct(l.netPayoutOnNetSales) })),
        }}
        context={`TOP Intelligence — ${periodType} view for ${currentBrand}. Current period: ${formatPeriod(activePeriod, periodType, allPeriodStarts)}. Primary brand for Seed/Series A investor discussions.`}
      />
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
