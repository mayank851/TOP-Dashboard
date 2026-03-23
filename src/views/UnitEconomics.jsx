import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import {
  filterRecords, sumRecords, getPeriodTrend, getEffectiveTakeRate,
  getPerOrderMetrics, getCohortData, getWeekOfMonthPattern, getDiscountOrdersCorrelation,
  fINR, fPct, fNum, formatPeriod, LOCATION_LAUNCH_DATES,
} from '../utils/calculations';
import FounderInsights from '../components/FounderInsights';

const LOC_COLORS = { HSR: '#7c6ef5', MTH: '#2dd4bf', BTM: '#f5c518', IND: '#f87171' };

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 12, color: p.color || 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? (p.value > 1000 ? fINR(p.value, true) : p.value > 100 ? fNum(Math.round(p.value)) : `${p.value.toFixed(1)}%`) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function UnitEconomics({ records, brand, periodType }) {
  const currentBrand = brand || 'TOP';

  const brandRecs = filterRecords(records, { brand: currentBrand, periodType });
  const sortedPeriods = [...new Set(brandRecs.map(r => r.periodStart))].sort();
  const latestPeriod = sortedPeriods[sortedPeriods.length - 1];
  const priorPeriod = sortedPeriods[sortedPeriods.length - 2];
  const allPeriodStarts = sortedPeriods;

  const latestRecs = brandRecs.filter(r => r.periodStart === latestPeriod);
  const priorRecs = priorPeriod ? brandRecs.filter(r => r.periodStart === priorPeriod) : [];
  const totals = sumRecords(latestRecs);
  const priorTotals = priorRecs.length ? sumRecords(priorRecs) : null;

  const perOrder = getPerOrderMetrics(totals);
  const priorPerOrder = priorTotals ? getPerOrderMetrics(priorTotals) : null;
  const effectiveTakeRate = getEffectiveTakeRate(totals);
  const priorTakeRate = priorTotals ? getEffectiveTakeRate(priorTotals) : null;

  const locSummaryAll = (() => {
    const locs = [...new Set(brandRecs.map(r => r.location))];
    const totalGMV = totals.gmv || 1;
    return locs.map(l => {
      const recs = latestRecs.filter(r => r.location === l);
      const s = sumRecords(recs);
      return { location: l, gmv: s.gmv, pct: (s.gmv / totalGMV) * 100, orders: s.deliveredOrders };
    }).sort((a, b) => b.gmv - a.gmv);
  })();

  const platforms = [...new Set(brandRecs.map(r => r.platform))].filter(Boolean);
  const trendAll = getPeriodTrend(records.filter(r => r.brand === currentBrand), periodType);
  const platTrendData = (() => {
    const byPeriod = {};
    platforms.forEach(plat => {
      const platRecs = records.filter(r => r.brand === currentBrand && r.platform === plat && r.periodType === periodType);
      const t = getPeriodTrend(platRecs, periodType);
      t.forEach(row => {
        const p = formatPeriod(row.period, periodType, allPeriodStarts);
        if (!byPeriod[p]) byPeriod[p] = { period: p };
        byPeriod[p][plat] = row.gmv;
      });
    });
    return Object.values(byPeriod).sort((a, b) => a.period.localeCompare(b.period));
  })();

  const cohortData = getCohortData(records, currentBrand);
  const cohortChartData = (() => {
    const allWeeks = Object.values(cohortData).flatMap(d => d.map(r => r.weekNum));
    if (!allWeeks.length) return [];
    const maxWeek = Math.max(...allWeeks);
    const rows = [];
    for (let w = 1; w <= maxWeek; w++) {
      const row = { week: `Wk ${w}` };
      Object.entries(cohortData).forEach(([loc, data]) => {
        const match = data.find(d => d.weekNum === w);
        if (match) row[loc] = match.deliveredOrders;
      });
      rows.push(row);
    }
    return rows;
  })();

  const seasonality = getWeekOfMonthPattern(records, currentBrand);

  const discountCorr = getDiscountOrdersCorrelation(records, currentBrand).map(d => ({
    ...d,
    period: formatPeriod(d.period, 'Weekly', allPeriodStarts),
  }));

  const takeRateTrend = trendAll.map(t => ({
    period: formatPeriod(t.period, periodType, allPeriodStarts),
    effectiveTakeRate: +getEffectiveTakeRate(t).toFixed(1),
    platformFeesPct: +t.platformFeesPct.toFixed(1),
    adsPct: +t.adsPct.toFixed(1),
  }));

  return (
    <div className="content-area">
      <div className="view-header">
        <div className="view-title">📋 Unit Economics</div>
        <div className="view-subtitle">
          {currentBrand} · {formatPeriod(latestPeriod, periodType, allPeriodStarts)} · investor data room view
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 0 }}>Per Order Economics — {formatPeriod(latestPeriod, periodType, allPeriodStarts)}</div>
      {perOrder && (
        <div className="kpi-grid kpi-grid-5" style={{ marginBottom: 12 }}>
          {[
            { label: 'GMV / Order', value: fINR(perOrder.gmvPerOrder), prior: priorPerOrder?.gmvPerOrder, color: 'purple' },
            { label: 'Net Payout / Order', value: fINR(perOrder.netPayoutPerOrder), prior: priorPerOrder?.netPayoutPerOrder, color: 'green' },
            { label: 'Platform Fees / Order', value: fINR(perOrder.platformFeesPerOrder), prior: priorPerOrder?.platformFeesPerOrder, color: 'orange' },
            { label: 'Ads Spend / Order', value: fINR(perOrder.adsPerOrder), prior: priorPerOrder?.adsPerOrder, color: 'gold' },
            { label: 'Discount / Order', value: fINR(perOrder.discountPerOrder), prior: priorPerOrder?.discountPerOrder, color: 'blue' },
          ].map(m => (
            <div key={m.label} className={`kpi-card ${m.color}`}>
              <div className="kpi-label">{m.label}</div>
              <div className="kpi-value kpi-value-sm">{m.value}</div>
              {m.prior != null && (
                <div style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                  Prior: {fINR(m.prior)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="section-title">Effective Platform Take Rate</div>
      <div className="kpi-grid kpi-grid-4" style={{ marginBottom: 12 }}>
        <div className={`kpi-card ${effectiveTakeRate > 50 ? 'red' : effectiveTakeRate > 40 ? 'gold' : 'green'}`}>
          <div className="kpi-label">Effective Take Rate</div>
          <div className="kpi-value">{fPct(effectiveTakeRate)}</div>
          <div className="kpi-sub">Platform Fees + Ads + GST / GMV</div>
          {priorTakeRate != null && (
            <div className={`kpi-change ${effectiveTakeRate > priorTakeRate ? 'neg' : 'pos'}`}>
              {effectiveTakeRate > priorTakeRate ? '▲' : '▼'} {Math.abs(effectiveTakeRate - priorTakeRate).toFixed(1)}pp vs prior
            </div>
          )}
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">Platform Fees (of GMV)</div>
          <div className="kpi-value">{fPct(totals.platformFeesPct)}</div>
          <div className="kpi-sub">Commission + delivery fees</div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-label">Ad Spend (of NS)</div>
          <div className="kpi-value">{fPct(totals.adsPct)}</div>
          <div className="kpi-sub">CPC + search + offers</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-label">GST Deduction (of GMV)</div>
          <div className="kpi-value">{fPct(totals.gmv > 0 ? totals.gstDeduction / totals.gmv * 100 : 0)}</div>
          <div className="kpi-sub">Platform GST collected</div>
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: 12 }}>
        <div className="chart-card-title">Effective Take Rate Trend — Platform is taking how much of every ₹100 GMV</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={takeRateTrend}>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fill: '#6272a4', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip content={<Tip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#8892c4' }} />
            <Line type="monotone" dataKey="effectiveTakeRate" name="Effective Take Rate%" stroke="#f87171" strokeWidth={2.5} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="platformFeesPct" name="Platform Fees%" stroke="#fb923c" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="adsPct" name="Ads%" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="section-title">Revenue Concentration Risk</div>
      <div className="chart-row chart-row-2">
        <div className="chart-card">
          <div className="chart-card-title">GMV Share by Location — {formatPeriod(latestPeriod, periodType, allPeriodStarts)}</div>
          <table className="data-table">
            <thead>
              <tr><th>Location</th><th>GMV</th><th>% of Total</th><th>Orders</th><th>Risk Signal</th></tr>
            </thead>
            <tbody>
              {locSummaryAll.map(l => (
                <tr key={l.location}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: LOC_COLORS[l.location] || '#6366f1', display: 'inline-block' }} />
                    <strong>{l.location}</strong>
                  </td>
                  <td>{fINR(l.gmv, true)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ height: 6, width: `${Math.min(l.pct, 100)}%`, maxWidth: 80, background: LOC_COLORS[l.location] || '#6366f1', borderRadius: 3, minWidth: 4 }} />
                      <span style={{ fontFamily: 'var(--font-mono)', color: l.pct > 60 ? 'var(--accent-red)' : 'var(--text-primary)' }}>{fPct(l.pct)}</span>
                    </div>
                  </td>
                  <td>{fNum(l.orders)}</td>
                  <td style={{ fontSize: 11, color: l.pct > 60 ? 'var(--accent-red)' : l.pct > 40 ? 'var(--accent-gold)' : 'var(--accent-green)' }}>
                    {l.pct > 60 ? '⚠ High concentration' : l.pct > 40 ? '▲ Monitor' : '✓ Healthy'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="chart-card">
          <div className="chart-card-title">Platform Dependency — GMV Split Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={platTrendData}>
              <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fill: '#6272a4', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => fINR(v, true)} />
              <Tooltip content={<Tip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#8892c4' }} />
              <Line type="monotone" dataKey="Swiggy" stroke="#fc8019" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="Zomato" stroke="#e23744" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="section-title">Location Maturity — Orders by Week Since Launch</div>
      <div className="chart-card" style={{ marginBottom: 12 }}>
        <div className="chart-card-title">
          Weekly orders from launch week · HSR (Nov '24) · MTH (Apr '25) · BTM (Dec '25) · IND (Jan '26)
        </div>
        {cohortChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={cohortChartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fill: '#6272a4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#8892c4' }} />
              {Object.keys(LOC_COLORS).map(loc => (
                <Line key={loc} type="monotone" dataKey={loc} name={loc} stroke={LOC_COLORS[loc]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state"><div className="empty-state-text">No cohort data available yet</div></div>
        )}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, fontFamily: 'var(--font-mono)' }}>
          Note: HSR history from Nov '24 to Mar '25 not yet in tracker — cohort will fill in once uploaded.
        </div>
      </div>

      <div className="section-title">Seasonality — Which Week of the Month Performs Best</div>
      <div className="chart-row chart-row-2">
        <div className="chart-card">
          <div className="chart-card-title">Avg GMV by Week of Month</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={seasonality} barSize={40}>
              <XAxis dataKey="week" tick={{ fill: '#6272a4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => fINR(v, true)} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="avgGMV" name="Avg GMV" radius={[4, 4, 0, 0]}>
                {seasonality.map((s, i) => (
                  <Cell key={i} fill={s.avgGMV === Math.max(...seasonality.map(x => x.avgGMV)) ? '#4ade80' : '#6366f1'} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <div className="chart-card-title">Avg Orders by Week of Month</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={seasonality} barSize={40}>
              <XAxis dataKey="week" tick={{ fill: '#6272a4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="avgOrders" name="Avg Orders" radius={[4, 4, 0, 0]}>
                {seasonality.map((s, i) => (
                  <Cell key={i} fill={s.avgOrders === Math.max(...seasonality.map(x => x.avgOrders)) ? '#f5c518' : '#6366f1'} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="section-title">Discount% vs Orders — Are Orders Driven by Discounts?</div>
      <div className="chart-card" style={{ marginBottom: 12 }}>
        <div className="chart-card-title">Weekly Discount% and Orders — correlation check</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={discountCorr}>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fill: '#6272a4', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<Tip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#8892c4' }} />
            <Line yAxisId="left" type="monotone" dataKey="discountPct" name="Discount%" stroke="#f87171" strokeWidth={2} dot={{ r: 4 }} />
            <Line yAxisId="right" type="monotone" dataKey="deliveredOrders" name="Orders" stroke="#4ade80" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
          If both lines move together → orders are discount-driven. If they diverge → organic demand is building.
        </div>
      </div>

      <div className="section-title">Tax Recovery — Cash Locked in TDS/TCS</div>
      <div className="kpi-grid kpi-grid-3" style={{ marginBottom: 24 }}>
        <div className="kpi-card blue">
          <div className="kpi-label">TCS — Tax Collected at Source</div>
          <div className="kpi-value kpi-value-sm">{fINR(totals.tcs, true)}</div>
          <div className="kpi-sub">Recoverable via ITR filing</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-label">TDS — Tax Deducted at Source</div>
          <div className="kpi-value kpi-value-sm">{fINR(totals.tds, true)}</div>
          <div className="kpi-sub">Offset against tax liability</div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-label">Total Tax Locked (this period)</div>
          <div className="kpi-value kpi-value-sm">{fINR(totals.tds + totals.tcs, true)}</div>
          <div className="kpi-sub">{totals.gmv > 0 ? fPct((totals.tds + totals.tcs) / totals.gmv * 100) : '—'} of GMV</div>
        </div>
      </div>

      <FounderInsights
        data={{
          brand: currentBrand,
          period: formatPeriod(latestPeriod, periodType, allPeriodStarts),
          perOrder,
          effectiveTakeRate: fPct(effectiveTakeRate),
          concentrationRisk: locSummaryAll.map(l => ({ location: l.location, pct: fPct(l.pct) })),
          seasonality: seasonality.map(s => ({ week: s.week, avgGMV: fINR(s.avgGMV, true), avgOrders: Math.round(s.avgOrders) })),
          taxLocked: fINR(totals.tds + totals.tcs, true),
        }}
        context={`Unit Economics view for ${currentBrand}. Focus on per-order profitability, platform concentration risk, and whether the business model is sustainable at scale. Key investor concern: is growth organic or discount-driven?`}
      />
    </div>
  );
}
