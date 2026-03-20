import React from 'react';
import { filterRecords, sumRecords, getLocationSummary, getPlatformSummary, fINR, fPct, fNum } from '../utils/calculations';
import KPICard from '../components/KPICard';
import FounderInsights from '../components/FounderInsights';

function WaterfallChart({ gmv, items, net }) {
  return (
    <div>
      {/* GMV */}
      <WRow label="Gross GMV" value={gmv} ref_gmv={gmv} color="#6366f1" isStart />
      {items.filter(i => Math.abs(i.value) > 0).map((item, i) => (
        <WRow key={i} label={item.label} value={-Math.abs(item.value)} ref_gmv={gmv} color={item.color} />
      ))}
      <div style={{ height: 1, background: 'var(--border-light)', margin: '8px 0' }} />
      <WRow label="Net Payout" value={net} ref_gmv={gmv} color="#4ade80" isEnd />
    </div>
  );
}

function WRow({ label, value, ref_gmv, color, isStart, isEnd }) {
  const isDeduction = value < 0;
  const barWidth = ref_gmv > 0 ? (Math.abs(value) / ref_gmv) * 100 : 0;
  const pct = ref_gmv > 0 ? (Math.abs(value) / ref_gmv) * 100 : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 0', borderBottom: isEnd ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{
        width: 190, flexShrink: 0, fontSize: 13, fontWeight: isEnd || isStart ? 700 : 500,
        color: isEnd ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-display)',
      }}>
        {label}
      </div>
      <div style={{ flex: 1, height: 10, background: 'var(--bg-surface)', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.min(barWidth, 100)}%`,
          background: color, borderRadius: 5,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{
        width: 130, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, flexShrink: 0,
        color: isEnd ? '#4ade80' : isDeduction ? '#f87171' : 'var(--text-primary)',
      }}>
        {isDeduction ? `− ${fINR(Math.abs(value))}` : fINR(value)}
      </div>
      <div style={{ width: 52, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
        {fPct(pct)}
      </div>
    </div>
  );
}

export default function PayoutBreakdown({ records, brand, periodType }) {
  const [loc, setLoc] = React.useState('All');
  const [plat, setPlat] = React.useState('All');

  const base = brand && brand !== 'All' ? records.filter(r => r.brand === brand) : records;
  const filtered = filterRecords(base, {
    location: loc !== 'All' ? loc : undefined,
    platform: plat !== 'All' ? plat : undefined,
    periodType,
  });

  const t = sumRecords(filtered);

  const locations = ['All', ...new Set(base.filter(r => r.periodType === 'Weekly').map(r => r.location))].filter(Boolean);
  const platforms = ['All', ...new Set(base.filter(r => r.periodType === 'Weekly').map(r => r.platform))].filter(Boolean);

  const deductionItems = [
    { label: 'Commission', value: t.commission, color: '#f87171' },
    { label: 'Ad Spend (Offers + CPC + Search)', value: t.totalAds, color: '#fb923c' },
    { label: 'GST Deduction', value: t.gstDeduction, color: '#fbbf24' },
    { label: 'TCS (Tax Collected at Source)', value: t.tcs, color: '#a78bfa' },
    { label: 'TDS (Tax Deducted at Source)', value: t.tds, color: '#818cf8' },
    { label: 'Hyperpure Deductions', value: t.hyperpure, color: '#60a5fa' },
    { label: 'Platform Fees', value: t.platformFees, color: '#2dd4bf' },
    { label: 'Cancellation Charges', value: t.cancelCharges, color: '#94a3b8' },
  ];

  const totalKnownDeductions = deductionItems.reduce((a, d) => a + Math.abs(d.value), 0);
  const reconciliation = t.netPayout - (t.gmv - totalKnownDeductions);
  const effectiveRate = t.gmv > 0 ? (t.netPayout / t.gmv) * 100 : 0;

  return (
    <div className="content-area">
      <div className="view-header">
        <div className="view-title">💸 Payout Breakdown</div>
        <div className="view-subtitle">{brand && brand !== 'All' ? brand : 'All Brands'} · GMV to Net Payout — full deduction waterfall</div>
      </div>

      <div className="filter-row">
        <span className="filter-label">Location</span>
        {locations.map(l => (
          <button key={l} className={`pill pill-sm${loc === l ? ' active' : ''}`} onClick={() => setLoc(l)}>{l}</button>
        ))}
        <span style={{ marginLeft: 12 }} className="filter-label">Platform</span>
        {platforms.map(p => (
          <button key={p} className={`pill pill-sm${plat === p ? ' active' : ''}`} onClick={() => setPlat(p)}>{p}</button>
        ))}
      </div>

      {/* Summary KPIs */}
      <div className="section-title" style={{ marginTop: 0 }}>Payout Summary</div>
      <div className="kpi-grid kpi-grid-4" style={{ marginBottom: 24 }}>
        <KPICard label="Gross GMV" value={fINR(t.gmv, true)} color="purple" sub="Starting point" />
        <KPICard label="Total Deductions" value={fINR(totalKnownDeductions, true)} color="red" sub="All platform costs" />
        <KPICard label="Net Payout" value={fINR(t.netPayout, true)} color="green" sub="Cash received" />
        <KPICard label="Effective Rate" value={fPct(effectiveRate)} color={effectiveRate > 20 ? 'green' : 'gold'} sub="Net payout / GMV" />
      </div>

      {/* Waterfall */}
      <div className="section-title">Deduction Waterfall</div>
      <div className="chart-card">
        <div className="chart-card-title">GMV → Deductions → Net Payout</div>
        <WaterfallChart gmv={t.gmv} items={deductionItems} net={t.netPayout} />
      </div>

      {/* Deduction detail table */}
      <div className="section-title">Deduction Detail</div>
      <div className="chart-card">
        <div className="chart-card-title">All deductions — absolute & % of GMV</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Deduction</th>
              <th>Amount</th>
              <th>% of GMV</th>
              <th>% of Total Deductions</th>
            </tr>
          </thead>
          <tbody>
            {deductionItems.filter(d => Math.abs(d.value) > 0).map((d, i) => (
              <tr key={i}>
                <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, display: 'inline-block', flexShrink: 0 }} />
                  {d.label}
                </td>
                <td style={{ color: '#f87171' }}>{fINR(Math.abs(d.value))}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{t.gmv > 0 ? fPct(Math.abs(d.value) / t.gmv * 100) : '—'}</td>
                <td style={{ color: 'var(--text-muted)' }}>{totalKnownDeductions > 0 ? fPct(Math.abs(d.value) / totalKnownDeductions * 100) : '—'}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td>Total Deductions</td>
              <td style={{ color: '#f87171' }}>{fINR(totalKnownDeductions)}</td>
              <td>{t.gmv > 0 ? fPct(totalKnownDeductions / t.gmv * 100) : '—'}</td>
              <td>100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tax analysis */}
      <div className="section-title">Tax Exposure</div>
      <div className="kpi-grid kpi-grid-3" style={{ marginBottom: 24 }}>
        <div className="kpi-card blue">
          <div className="kpi-label">TCS</div>
          <div className="kpi-value kpi-value-sm">{fINR(t.tcs, true)}</div>
          <div className="kpi-sub">Tax Collected at Source</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {t.gmv > 0 ? fPct(t.tcs / t.gmv * 100) : '—'} of GMV
          </div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-label">TDS</div>
          <div className="kpi-value kpi-value-sm">{fINR(t.tds, true)}</div>
          <div className="kpi-sub">Tax Deducted at Source</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {t.gmv > 0 ? fPct(t.tds / t.gmv * 100) : '—'} of GMV
          </div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-label">GST Deduction</div>
          <div className="kpi-value kpi-value-sm">{fINR(t.gstDeduction, true)}</div>
          <div className="kpi-sub">Platform GST deducted</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {t.gmv > 0 ? fPct(t.gstDeduction / t.gmv * 100) : '—'} of GMV
          </div>
        </div>
      </div>

      {Math.abs(reconciliation) > 100 && (
        <div className="alert-banner">
          ⚠️ Reconciliation gap: {fINR(Math.abs(reconciliation))} — sum of known deductions doesn't exactly equal GMV − Net Payout. Check for additional line items.
        </div>
      )}
<FounderInsights
        data={{
          gmv: fINR(t.gmv, true),
          netPayout: fINR(t.netPayout, true),
          effectiveRate: fPct(effectiveRate),
          commission: fINR(t.commission, true),
          commissionPct: fPct(t.commissionPct),
          adSpend: fINR(t.totalAds, true),
          adsPct: fPct(t.adsPct),
          discountPct: fPct(t.discountPct),
          tcs: fINR(t.tcs, true),
          tds: fINR(t.tds, true),
          hyperpure: fINR(t.hyperpure, true),
          totalDeductions: fINR(totalKnownDeductions, true),
          deductionPct: fPct(t.gmv > 0 ? totalKnownDeductions / t.gmv * 100 : 0),
        }}
        context="Payout Breakdown view — showing the full deduction waterfall from GMV to Net Payout. Focus on which deductions are highest and what levers exist to improve net payout."
      />
    </div>
  );
}