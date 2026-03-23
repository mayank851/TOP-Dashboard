// ─── Filters ────────────────────────────────────────────────────────────────

export function filterRecords(records, { brand, location, platform, periodType } = {}) {
  let r = records;
  if (brand && brand !== 'All') r = r.filter(x => x.brand === brand);
  if (location && location !== 'All') r = r.filter(x => x.location === location);
  if (platform && platform !== 'All') r = r.filter(x => x.platform === platform);
  if (periodType) r = r.filter(x => x.periodType === periodType);
  return r;
}

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

  s.aov = s.deliveredOrders > 0 ? s.netSales / s.deliveredOrders : 0;
  s.adsPct = s.netSales > 0 ? (s.totalAds / s.netSales) * 100 : 0;
  s.discountPct = s.gmv > 0 ? (s.discountShare / s.gmv) * 100 : 0;
  s.netMarginPct = s.gmv > 0 ? (s.netPayout / s.gmv) * 100 : 0;
  s.netPayoutOnNetSales = s.netSales > 0 ? (s.netPayout / s.netSales) * 100 : 0;
  s.platformFeesPct = s.netSales > 0 ? (s.platformFees / s.netSales) * 100 : 0;
  s.totalDeductions = s.platformFees + s.totalAds + s.tcs + s.tds + s.hyperpure + s.gstDeduction;
  return s;
}

export function groupBy(records, keyFn) {
  const map = {};
  records.forEach(r => {
    const k = keyFn(r);
    if (!map[k]) map[k] = [];
    map[k].push(r);
  });
  return map;
}

export function getPeriodTrend(records, periodType = 'Weekly') {
  const filtered = records.filter(r => r.periodType === periodType);
  const byPeriod = groupBy(filtered, r => r.periodStart);
  return Object.entries(byPeriod)
    .map(([period, recs]) => ({ period, ...sumRecords(recs) }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

export function getBrandSummary(records, periodType = 'Weekly') {
  const filtered = records.filter(r => r.periodType === periodType);
  const byBrand = groupBy(filtered, r => r.brand);
  return Object.entries(byBrand).map(([brand, recs]) => ({
    brand, ...sumRecords(recs),
    periods: [...new Set(recs.map(r => r.periodStart))].length,
  })).sort((a, b) => b.gmv - a.gmv);
}

export function getLocationSummary(records, brand = null, periodType = 'Weekly') {
  let recs = records.filter(r => r.periodType === periodType);
  if (brand && brand !== 'All') recs = recs.filter(r => r.brand === brand);
  const byLoc = groupBy(recs, r => r.location);
  return Object.entries(byLoc).map(([location, rows]) => ({
    location, ...sumRecords(rows),
  })).sort((a, b) => b.gmv - a.gmv);
}

export function getPlatformSummary(records, brand = null, periodType = 'Weekly') {
  let recs = records.filter(r => r.periodType === periodType);
  if (brand && brand !== 'All') recs = recs.filter(r => r.brand === brand);
  const byPlat = groupBy(recs, r => r.platform);
  return Object.entries(byPlat).map(([platform, rows]) => ({
    platform, ...sumRecords(rows),
  })).sort((a, b) => b.gmv - a.gmv);
}

export function getPayoutWaterfall(totals) {
  const { gmv, totalAds, gstDeduction, tcs, tds, hyperpure,
          platformFees, cancelCharges, netPayout, discountShare } = totals;
  const deductions = [
    { label: 'Discounts', value: -Math.abs(discountShare || 0), color: '#e879f9' },
    { label: 'Platform Fees (incl. Commission)', value: -Math.abs(platformFees), color: '#f87171' },
    { label: 'Ad Spend', value: -Math.abs(totalAds), color: '#fb923c' },
    { label: 'GST Deduction', value: -Math.abs(gstDeduction), color: '#fbbf24' },
    { label: 'TCS', value: -Math.abs(tcs), color: '#a78bfa' },
    { label: 'TDS', value: -Math.abs(tds), color: '#818cf8' },
    { label: 'Hyperpure', value: -Math.abs(hyperpure), color: '#60a5fa' },
    { label: 'Cancel Charges', value: -Math.abs(cancelCharges), color: '#94a3b8' },
  ].filter(d => Math.abs(d.value) > 0);
  return { gmv, deductions, netPayout };
}

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

export function pctChange(current, prior) {
  if (!prior || prior === 0) return null;
  return ((current - prior) / Math.abs(prior)) * 100;
}

export function getEffectiveTakeRate(totals) {
  const { gmv, platformFees, totalAds, gstDeduction } = totals;
  return gmv > 0 ? ((platformFees + totalAds + gstDeduction) / gmv) * 100 : 0;
}

export function getPerOrderMetrics(totals) {
  const { deliveredOrders: orders, gmv, platformFees, totalAds, netPayout, discountShare, tds, tcs } = totals;
  if (!orders) return null;
  return {
    gmvPerOrder: gmv / orders,
    platformFeesPerOrder: platformFees / orders,
    adsPerOrder: totalAds / orders,
    netPayoutPerOrder: netPayout / orders,
    discountPerOrder: discountShare / orders,
    taxPerOrder: (tds + tcs) / orders,
  };
}

export const LOCATION_LAUNCH_DATES = {
  HSR: '2024-11-01',
  MTH: '2025-04-01',
  BTM: '2025-12-01',
  IND: '2026-01-01',
};

export function getWeeksSinceLaunch(periodStart, location) {
  const launch = LOCATION_LAUNCH_DATES[location];
  if (!launch) return null;
  const launchDate = new Date(launch + 'T00:00:00');
  const periodDate = new Date(periodStart + 'T00:00:00');
  const diff = (periodDate - launchDate) / (7 * 24 * 60 * 60 * 1000);
  return Math.round(diff) + 1;
}

export function getCohortData(records, brand = 'TOP') {
  const weekly = records.filter(r => r.periodType === 'Weekly' && r.brand === brand);
  const locations = Object.keys(LOCATION_LAUNCH_DATES);
  const result = {};
  locations.forEach(loc => {
    const locRecs = weekly.filter(r => r.location === loc);
    const byPeriod = groupBy(locRecs, r => r.periodStart);
    result[loc] = Object.entries(byPeriod)
      .map(([period, recs]) => {
        const s = sumRecords(recs);
        const weekNum = getWeeksSinceLaunch(period, loc);
        return { period, weekNum, location: loc, ...s };
      })
      .filter(r => r.weekNum > 0)
      .sort((a, b) => a.weekNum - b.weekNum);
  });
  return result;
}

export function getWeekOfMonthPattern(records, brand = 'TOP') {
  const weekly = records.filter(r => r.periodType === 'Weekly' && r.brand === brand);
  const byWeekNum = { 1: [], 2: [], 3: [], 4: [] };
  weekly.forEach(r => {
    const d = new Date(r.periodStart + 'T00:00:00');
    const day = d.getDate();
    const wk = day < 8 ? 1 : day < 15 ? 2 : day < 22 ? 3 : 4;
    byWeekNum[wk].push(r);
  });
  return Object.entries(byWeekNum).map(([wk, recs]) => {
    if (!recs.length) return { week: `W${wk} of month`, avgGMV: 0, avgOrders: 0, avgNetPayout: 0, count: 0 };
    const byPeriod = groupBy(recs, r => r.periodStart);
    const periodTotals = Object.values(byPeriod).map(p => sumRecords(p));
    return {
      week: `W${wk} of month`,
      avgGMV: periodTotals.reduce((a, b) => a + b.gmv, 0) / periodTotals.length,
      avgOrders: periodTotals.reduce((a, b) => a + b.deliveredOrders, 0) / periodTotals.length,
      avgNetPayout: periodTotals.reduce((a, b) => a + b.netPayout, 0) / periodTotals.length,
      count: periodTotals.length,
    };
  });
}

export function getDiscountOrdersCorrelation(records, brand = 'TOP') {
  const trend = getPeriodTrend(records.filter(r => r.brand === brand), 'Weekly');
  return trend.map(t => ({
    period: t.period,
    discountPct: +t.discountPct.toFixed(1),
    deliveredOrders: t.deliveredOrders,
    gmv: t.gmv,
  }));
}

export function formatPeriod(str, periodType = 'Weekly', allPeriods = null) {
  if (!str) return '';
  try {
    const d = new Date(str + 'T00:00:00');
    if (periodType === 'Monthly') {
      return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }
    const month = d.toLocaleDateString('en-IN', { month: 'short' });
    const yr = String(d.getFullYear()).slice(2);
    const day = d.getDate();
    const weekNum = day < 8 ? 1 : day < 15 ? 2 : day < 22 ? 3 : 4;
    return `W${weekNum} ${month} '${yr}`;
  } catch {
    return str;
  }
}
