import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getBrandSummary, getLocationSummary, getPeriodTrend, formatPeriod, fINR, fPct, fNum, pctChange } from '../utils/calculations';
import FounderInsights from '../components/FounderInsights';

const BRAND_COLORS = { TOP: '#7c6ef5', FB: '#2dd4bf', FI: '#f5c518' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 12, color: p.color || 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
          {p.name}: {fINR(p.value, true)}
        </div>
      ))}
    </div>
  );
};

export default function Overview({ records, periodType }) {
  const brands = getBrandSummary(records, periodType);
  const allLoc = getLocationSummary(records, null, periodType);
  const trend = getPeriodTrend(records, periodType);
  const last = trend[trend.length - 1];
  const prior = trend[trend.length - 2];
  const gmvChange = last && prior ? pctChange(last.gmv, prior.gmv) : null;
  const ordersChange = last && prior ? pctChange(last.deliveredOrders, prior.deliveredOrders) : null;

  const total = brands.reduce((a, b) => ({
    gmv: a.gmv + b.gmv, netPayout: a.netPayout + b.netPayout,
    netSales: a.netSales + b.netSales, deliveredOrders: a.deliveredOrders + b.deliveredOrders,
    discountShare: a.discountShare + b.discountShare,
  }), { gmv: 0, netPayout: 0, netSales: 0, deliveredOrders: 0, discountShare: 0 });

  const netPayoutOnNetSales = total.netSales > 0 ? (total.netPayout / total.netSales) * 100 : 0;
  const discountPct = total.gmv > 0 ? (total.discountShare / total.gmv) * 100 : 0;
  const periodLabel = periodType === 'Monthly' ? 'MoM' : 'WoW';

  const insightData = {
    periodType,
    totalGMV: fINR(total.gmv, true),
    totalNetPayout: fINR(total.netPayout, true),
    totalOrders: fNum(total.deliveredOrders),
    netPayoutOnNetSalesPct: fPct(netPayoutOnNetSales),
    discountPct: fPct(discountPct),
    gmvChange: gmvChange != null ? fPct(gmvChange) : 'N/A',
    brands: brands.map(b => ({
      brand: b.brand, gmv: fINR(b.gmv, true), netPayout: fINR(b.netPayout, true),
      commissionPct: fPct(b.commissionPct), adsPct: fPct(b.adsPct),
      discountPct: fPct(b.discountPct), netPayoutOnNetSales: fPct(b.netPayoutOnNetSales),
    })),
    locations: allLoc.map(l => ({
      location: l.location, gmv: fINR(l.gmv, true), netPayoutOnNetSales: fPct(l.netPayoutOnNetSales),
    })),
  };

  return (
    <div className="content-area">
      <div className="view-header">
        <div className="view-title">📊 Overview</div>
        <div className="view-subtitle">All brands · All locations · All platforms · {periodType} view</div>
      </div>

      <div className="section-title" style={{ marginTop: 0 }}>Portfolio Summary</div>
      <div className="kpi-grid kpi-grid-5" style={{ marginBottom: 24 }}>
        <div className="kpi-card purple">
          <div className="kpi-label">Total GMV</div>
          <div className="kpi-value">{fINR(total.gmv, true)}</div>
          <div className={`kpi-change${gmvChange != null ? (gmvChange >= 0 ? ' pos' : ' neg') : ' neu'}`}>
            {gmvChange != null ? `${gmvChange >= 0 ? '▲' : '▼'} ${Math.abs(gmvChange).toFixed(1)}% ${periodLabel}` : 'Gross merchandise value'}
          </div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Net Payout</div>
          <div className="kpi-value">{fINR(total.netPayout, true)}</div>
          <div className="kpi-sub">Cash received from platforms</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-label">Total Orders</div>
          <div className="kpi-value">{fNum(total.deliveredOrders)}</div>
          <div className={`kpi-change${ordersChange != null ? (ordersChange >= 0 ? ' pos' : ' neg') : ' neu'}`}>
            {ordersChange != null ? `${ordersChange >= 0 ? '▲' : '▼'} ${Math.abs(ordersChange).toFixed(1)}% ${periodLabel}` : 'Delivered across all brands'}
          </div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-label">Payout on Net Sales</div>
          <div className="kpi-value">{fPct(netPayoutOnNetSales)}</div>
          <div className="kpi-sub">Cash kept after deductions</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">Discount % of GMV</div>
          <div className="kpi-value">{fPct(discountPct)}</div>
          <div className="kpi-sub" style={{ color: discountPct > 25 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
            {discountPct > 25 ? '⚠ Monitor — above 25%' : 'Discount share of GMV'}
          </div>
        </div>
      </div>

      <div className="section-title">Brand Breakdown</div>
      <div className="chart-row chart-row-2">
        <div className="chart-card">
          <div className="chart-card-title">GMV by Brand</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={brands} barSize={48}>
              <XAxis dataKey="brand" tick={{ fill: '#6272a4', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => fINR(v, true)} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="gmv" name="GMV" radius={[4, 4, 0, 0]}>
                {brands.map(b => <Cell key={b.brand} fill={BRAND_COLORS[b.brand] || '#6366f1'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <div className="chart-card-title">Net Payout by Brand</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={brands} barSize={48}>
              <XAxis dataKey="brand" tick={{ fill: '#6272a4', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6272a4', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => fINR(v, true)} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="netPayout" name="Net Payout" radius={[4, 4, 0, 0]}>
                {brands.map(b => <Cell key={b.brand} fill={BRAND_COLORS[b.brand] || '#22c55e'} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: 12 }}>
        <div className="chart-card-title">Brand Performance — {periodType}</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Brand</th><th>Orders</th><th>GMV</th><th>Net Sales</th>
              <th>Net Payout</th><th>Payout/NS%</th><th>Commission%</th>
              <th>Ads%</th><th>Discount%</th><th>AOV</th>
            </tr>
          </thead>
          <tbody>
            {brands.map(b => (
              <tr key={b.brand}>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: BRAND_COLORS[b.brand] || '#6366f1', display: 'inline-block' }} />
                    <strong>{b.brand}</strong>
                  </span>
                </td>
                <td>{fNum(b.deliveredOrders)}</td>
                <td>{fINR(b.gmv)}</td>
                <td>{fINR(b.netSales)}</td>
                <td style={{ color: 'var(--accent-green)' }}>{fINR(b.netPayout)}</td>
                <td style={{ color: b.netPayoutOnNetSales > 55 ? 'var(--accent-green)' : b.netPayoutOnNetSales < 40 ? 'var(--accent-red)' : 'var(--accent-gold)' }}>{fPct(b.netPayoutOnNetSales)}</td>
                <td style={{ color: b.commissionPct > 25 ? 'var(--accent-red)' : 'var(--text-primary)' }}>{fPct(b.commissionPct)}</td>
                <td style={{ color: b.adsPct > 10 ? 'var(--accent-gold)' : 'var(--text-primary)' }}>{fPct(b.adsPct)}</td>
                <td style={{ color: b.discountPct > 25 ? 'var(--accent-red)' : 'var(--text-primary)' }}>{fPct(b.discountPct)}</td>
                <td>{fINR(b.aov)}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td>All</td>
              <td>{fNum(brands.reduce((a, b) => a + b.deliveredOrders, 0))}</td>
              <td>{fINR(total.gmv)}</td>
              <td>{fINR(total.netSales)}</td>
              <td style={{ color: 'var(--accent-green)' }}>{fINR(total.netPayout)}</td>
              <td style={{ color: 'var(--accent-gold)' }}>{fPct(netPayoutOnNetSales)}</td>
              <td>—</td><td>—</td>
              <td style={{ color: discountPct > 25 ? 'var(--accent-red)' : 'var(--text-primary)' }}>{fPct(discountPct)}</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="section-title">All Locations</div>
      <div className="chart-card">
        <div className="chart-card-title">Location Performance — {periodType}</div>
        <table className="data-table">
          <thead>
            <tr><th>Location</th><th>Orders</th><th>GMV</th><th>Net Payout</th><th>Payout/NS%</th><th>Commission%</th><th>Ads%</th><th>Discount%</th><th>AOV</th></tr>
          </thead>
          <tbody>
            {allLoc.map(l => (
              <tr key={l.location}>
                <td><strong>{l.location}</strong></td>
                <td>{fNum(l.deliveredOrders)}</td>
                <td>{fINR(l.gmv)}</td>
                <td style={{ color: 'var(--accent-green)' }}>{fINR(l.netPayout)}</td>
                <td style={{ color: l.netPayoutOnNetSales > 55 ? 'var(--accent-green)' : 'var(--accent-gold)' }}>{fPct(l.netPayoutOnNetSales)}</td>
                <td>{fPct(l.commissionPct)}</td>
                <td>{fPct(l.adsPct)}</td>
                <td style={{ color: l.discountPct > 25 ? 'var(--accent-red)' : 'var(--text-primary)' }}>{fPct(l.discountPct)}</td>
                <td>{fINR(l.aov)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FounderInsights data={insightData} context={`Overview page — ${periodType} view across all brands (TOP, FB, FI) and locations (HSR, MTH, BTM, IND). TOP is the primary brand for investor discussions.`} />
    </div>
  );
}
