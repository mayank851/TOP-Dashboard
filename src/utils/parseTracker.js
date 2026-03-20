import * as XLSX from 'xlsx';

// Column indices (0-based) for Data Log sheet
export const COL = {
  PERIOD_START: 0,
  PERIOD_TYPE: 1,
  BRAND: 2,
  LOCATION: 3,
  PLATFORM: 4,
  DELIVERED_ORDERS: 5,
  CANCELLED_ORDERS: 6,
  TOTAL_ORDERS: 7,
  ITEM_TOTAL: 8,
  PKG_CHARGES: 9,
  DISCOUNT_SHARE: 10,
  GST_COLLECTED: 11,
  GMV: 12,
  NET_SALES: 13,
  CUST_PAID: 14,
  COMMISSION: 15,
  LONG_DIST: 16,
  PLATFORM_FEE2: 17,
  GST_SVC: 18,
  CANCEL_CHARGES: 19,
  CUST_COMPLAINTS: 20,
  TOTAL_COMPLAINTS: 21,
  ADS_OFFERS: 22,
  CPC_ADS: 23,
  SEARCH_ADS: 24,
  TOTAL_ADS: 25,
  GST_DEDUCTION: 26,
  TCS: 27,
  TDS: 28,
  NET_PAYOUT: 29,
  HYPERPURE: 30,
  PLATFORM_FEES: 31,
  TOTAL_TAXES: 32,
  AOV: 33,
  COMMISSION_PCT: 34,
  DISCOUNT_PCT: 35,
  ADS_PCT: 36,
  NET_MARGIN_PCT: 37,
};

function excelDateToString(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === 'number') {
    // Excel serial → JS date
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return d.toISOString().slice(0, 10);
  }
  if (typeof val === 'string') {
    // Already a string date
    return val.slice(0, 10);
  }
  return String(val);
}

function n(v) { return typeof v === 'number' ? v : (parseFloat(v) || 0); }

export async function parseTracker(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });

        const sheetName =
          wb.SheetNames.find(s => /data.?log/i.test(s)) ||
          wb.SheetNames.find(s => /log/i.test(s)) ||
          wb.SheetNames[0];

        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: 0 });

        // Skip header row
        const records = rows
          .slice(1)
          .filter(row => row[COL.BRAND] && String(row[COL.BRAND]).trim() && String(row[COL.BRAND]).trim() !== 'Brand')
          .map(row => ({
            periodStart: excelDateToString(row[COL.PERIOD_START]),
            periodType: String(row[COL.PERIOD_TYPE] || '').trim(),
            brand: String(row[COL.BRAND] || '').trim(),
            location: String(row[COL.LOCATION] || '').trim(),
            platform: String(row[COL.PLATFORM] || '').trim(),
            deliveredOrders: n(row[COL.DELIVERED_ORDERS]),
            cancelledOrders: n(row[COL.CANCELLED_ORDERS]),
            totalOrders: n(row[COL.TOTAL_ORDERS]),
            itemTotal: n(row[COL.ITEM_TOTAL]),
            pkgCharges: n(row[COL.PKG_CHARGES]),
            discountShare: n(row[COL.DISCOUNT_SHARE]),
            gstCollected: n(row[COL.GST_COLLECTED]),
            gmv: n(row[COL.GMV]),
            netSales: n(row[COL.NET_SALES]),
            custPaid: n(row[COL.CUST_PAID]),
            commission: n(row[COL.COMMISSION]),
            longDist: n(row[COL.LONG_DIST]),
            platformFee2: n(row[COL.PLATFORM_FEE2]),
            gstSvc: n(row[COL.GST_SVC]),
            cancelCharges: n(row[COL.CANCEL_CHARGES]),
            custComplaints: n(row[COL.CUST_COMPLAINTS]),
            totalComplaints: n(row[COL.TOTAL_COMPLAINTS]),
            adsOffers: n(row[COL.ADS_OFFERS]),
            cpcAds: n(row[COL.CPC_ADS]),
            searchAds: n(row[COL.SEARCH_ADS]),
            totalAds: n(row[COL.TOTAL_ADS]),
            gstDeduction: n(row[COL.GST_DEDUCTION]),
            tcs: n(row[COL.TCS]),
            tds: n(row[COL.TDS]),
            netPayout: n(row[COL.NET_PAYOUT]),
            hyperpure: n(row[COL.HYPERPURE]),
            platformFees: n(row[COL.PLATFORM_FEES]),
            totalTaxes: n(row[COL.TOTAL_TAXES]),
            aov: n(row[COL.AOV]),
            commissionPct: n(row[COL.COMMISSION_PCT]),
            discountPct: n(row[COL.DISCOUNT_PCT]),
            adsPct: n(row[COL.ADS_PCT]),
            netMarginPct: n(row[COL.NET_MARGIN_PCT]),
          }));

        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function getMetadata(records) {
  const brands = [...new Set(records.map(r => r.brand))].filter(Boolean).sort();
  const locations = [...new Set(records.map(r => r.location))].filter(Boolean).sort();
  const platforms = [...new Set(records.map(r => r.platform))].filter(Boolean).sort();
  const periodTypes = [...new Set(records.map(r => r.periodType))].filter(Boolean);
  const periods = [...new Set(records.map(r => r.periodStart))].filter(Boolean).sort();
  return { brands, locations, platforms, periodTypes, periods };
}
