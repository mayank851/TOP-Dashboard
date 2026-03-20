// ─── Filters ────────────────────────────────────────────────────────────────

export function filterRecords(records, { brand, location, platform, periodType } = {}) {
  let r = records;
  if (brand && brand !== 'All') r = r.filter(x => x.brand === brand);
  if (location && location !== 'All') r = r.filter(x => x.location === location);
  if (platform && platform !== 'All') r = r.filter(x => x.platform === platform);
  if (periodType) r = r.filter(x => x.periodType === periodType);
  return r;
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

export function sumRecords(records) {
  const s = {
    deliveredOrders: 0, cancelledOrders: 0, gmv: 0, netSales: 0,
    commission: 0, totalAds: 0, discountShare: 0,
    tcs: 0, tds: 0, netPayout: 0, hyperpure: 0,
    gstDeduction: 0, platformFees: 0, longDist: 0, platformFee2: 0,
    gstSvc: 0, cancelCharges: 0, pkgCharges: 0,
  };
  records.forEach(r => {
    s.deliveredOrders += r.deliveredOrders;
    s.cancelledOrders += r.cancelledOrders;
    s.gmv += r.gmv;
    s.netSales += r.netSales;
    s.commission += r.commission;
    s.totalAds += r.totalAds;
    s.discountShare += r.discountShare;
    s.tcs += r.tcs;
    s.tds += r.tds;
    s.netPayout += r.netPayout;
    s.hyperpure += r.hyperpure;
    s.gstDeduction += r.gstDeduction;
    s.platformFees += r.platformFees;
    s.longDist += r.longDist;
    s.platformFee2 += r.platformFee2;
    s.gstSvc += r.gstSvc;
    s.cancelCharges += r.cancelCharges;
    s.pkgCharges += r.pkgCharges;
  });

  // Derived
  s.aov = s.deliveredOrders > 0 ? s.netSales / s.deliveredOrders : 0;
  s.commissionPct = s.gmv > 0 ? (s.commission / s.gmv) * 100 : 0;
  s.adsPct = s.gmv > 0 ? (s.totalAds / s.gmv) * 100 : 0;
  s.discountPct = s.gmv > 0 ? (s.discountShare / s.gmv) * 100 : 0;
  s.netMarginPct = s.gmv > 0 ? (s.netPayout / s.gmv) * 100 : 0;
  // Net payout on net sales — better operational metric
  s.netPayoutOnNetSales = s.netSales > 0 ? (s.netPayout / s.netSales) * 100 : 0;
  s.totalDeductions = s.commission + s.totalAds + s.tcs + s.tds + s.hyperpure + s.gstDeduction;
  return s;
}

// ─── Group by a key ──────────────────────────────────────────────────────────

export function groupBy(records, keyFn) {
  const map = {};
  records.forEach(r => {
    const k = keyFn(r);
    if (!map[k]) map[k] = [];
    map[k].push(r);
  });
  return map;
}

// ─── Period trend ─────────────────────────────────────────────────────────────

export function getPeriodTrend(records, periodType = 'Weekly') {
  const weekly = records.filter(r => r.periodType === periodType);
  const byPeriod = groupBy(weekly, r => r.periodStart);
  return Object.entries(byPeriod)
    .map(([period, recs]) => {
      const s = sumRecords(recs);
      return { period, ...s };
    })
    .sort((a, b) => a.period.localeCompare(b.period));
}

// ─── Brand summary ────────────────────────────────────────────────────────────

export function getBrandSummary(records, periodType = 'Weekly') {
  const filtered = records.filter(r => r.periodType === periodType);
  const byBrand = groupBy(filtered, r => r.brand);
  return Object.entries(byBrand).map(([brand, recs]) => ({
    brand,
    ...sumRecords(recs),
    periods: [...new Set(recs.map(r => r.periodStart))].length,
  })).sort((a, b) => b.gmv - a.gmv);
}

// ─── Location summary ─────────────────────────────────────────────────────────

export function getLocationSummary(records, brand = null, periodType = 'Weekly') {
  let recs = records.filter(r => r.periodType === periodType);
  if (brand && brand !== 'All') recs = recs.filter(r => r.brand === brand);
  const byLoc = groupBy(recs, r => r.location);
  return Object.entries(byLoc).map(([location, rows]) => ({
    location,
    ...sumRecords(rows),
  })).sort((a, b) => b.gmv - a.gmv);
}

// ─── Platform summary ─────────────────────────────────────────────────────────

export function getPlatformSummary(records, brand = null, periodType = 'Weekly') {
  let recs = records.filter(r => r.periodType === periodType);
  if (brand && brand !== 'All') recs = recs.filter(r => r.brand === brand);
  const byPlat = groupBy(recs, r => r.platform);
  return Object.entries(byPlat).map(([platform, rows]) => ({
    platform,
    ...sumRecords(rows),
  })).sort((a, b) => b.gmv - a.gmv);
}

// ─── Payout waterfall ─────────────────────────────────────────────────────────

export function getPayoutWaterfall(totals) {
  const { gmv, commission, totalAds, gstDeduction, tcs, tds, hyperpure,
          platformFees, cancelCharges, netPayout, discountShare } = totals;
  const deductions = [
    { label: 'Discounts', value: -Math.abs(discountShare || 0), color: '#e879f9' },
    { label: 'Commission', value: -Math.abs(commission), color: '#f87171' },
    { label: 'Ad Spend', value: -Math.abs(totalAds), color: '#fb923c' },
    { label: 'GST Deduction', value: -Math.abs(gstDeduction), color: '#fbbf24' },
    { label: 'TCS', value: -Math.abs(tcs), color: '#a78bfa' },
    { label: 'TDS', value: -Math.abs(tds), color: '#818cf8' },
    { label: 'Hyperpure', value: -Math.abs(hyperpure), color: '#60a5fa' },
    { label: 'Platform Fees', value: -Math.abs(platformFees), color: '#34d399' },
    { label: 'Cancel Charges', value: -Math.abs(cancelCharges), color: '#94a3b8' },
  ].filter(d => Math.abs(d.value) > 0);

  return { gmv, deductions, netPayout };
}

// ─── Format helpers ───────────────────────────────────────────────────────────

export function fINR(val, compact = false) {
  const abs = Math.abs(val);
  if (compact) {
    if (abs >= 1e7) return `₹${(val / 1e7).toFixed(2)}Cr`;
    if (abs >= 1e5) return `₹${(val / 1e5).toFixed(1)}L`;
    if (abs >= 1e3) return `₹${(val / 1e3).toFixed(1)}K`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  }
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
}

export function fPct(val, decimals = 1) {
  return `${(+val || 0).toFixed(decimals)}%`;
}

export function fNum(val) {
  return Math.round(val).toLocaleString('en-IN');
}

export function changeSign(val) {
  if (val > 0.05) return 'pos';
  if (val < -0.05) return 'neg';
  return 'neu';
}

export function changeArrow(val, positiveIsGood = true) {
  const isPos = val > 0;
  const isGood = positiveIsGood ? isPos : !isPos;
  const arrow = isPos ? '▲' : '▼';
  return { arrow, cls: isGood ? 'pos' : 'neg' };
}

export function pctChange(current, prior) {
  if (!prior || prior === 0) return null;
  return ((current - prior) / Math.abs(prior)) * 100;
}

export function formatPeriod(str, periodType = 'Weekly') {
  if (!str) return '';
  try {
    const d = new Date(str + 'T00:00:00');
    if (periodType === 'Monthly') {
      return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }
    // Weekly: W1 Feb 26, W2 Feb 26 etc
    const day = d.getDate();
    const weekNum = day <= 7 ? 1 : day <= 14 ? 2 : day <= 21 ? 3 : 4;
    const month = d.toLocaleDateString('en-IN', { month: 'short' });
    const yr = String(d.getFullYear()).slice(2);
    return `W${weekNum} ${month} '${yr}`;
  } catch {
    return str;
  }
}
