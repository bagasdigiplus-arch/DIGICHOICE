// Normalisasi angka dari format Rupiah Excel/CSV (misal "Rp 12.999.000" -> 12999000)
export function parseCleanNumber(val: unknown, fallback = 0): number {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (val === null || val === undefined) return fallback;
  const cleaned = String(val)
    .replace(/rp/gi, "")
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : fallback;
}

export function normalizeTradeInRows(rows: any[]) {
  return (rows || [])
    .filter((r) => r && (r.Tipe_Device_Lama || r.Model_Lama || r.Model))
    .map((r, idx) => {
      const gradeA = parseCleanNumber(r.Harga_Grade_A ?? r.Estimasi_Buyback);
      return {
        ...r,
        TradeIn_ID: String(r.TradeIn_ID || `TI-${idx + 1}`),
        Tipe_Device_Lama: String(
          r.Tipe_Device_Lama || r.Model_Lama || r.Model || `Device #${idx + 1}`
        ).trim(),
        Harga_Grade_A: gradeA,
        Harga_Grade_B: parseCleanNumber(r.Harga_Grade_B, Math.round(gradeA * 0.85)),
        Harga_Grade_C: parseCleanNumber(r.Harga_Grade_C, Math.round(gradeA * 0.7)),
        Bonus_TopUp: parseCleanNumber(r.Bonus_TopUp ?? r.TopUp_Bonus, 0),
      };
    });
}

export function normalizeBankPromoRows(rows: any[]) {
  return (rows || [])
    .filter((r) => r && r.Nama_Bank)
    .map((r, idx) => ({
      ...r,
      Bank_ID: String(r.Bank_ID || r.Promo_ID || `BANK-${idx + 1}`),
      Nama_Bank: String(r.Nama_Bank).trim(),
      Min_Transaksi: parseCleanNumber(r.Min_Transaksi, 0),
      Nominal_Diskon: parseCleanNumber(r.Nominal_Diskon ?? r.Cashback, 0),
      Bunga_Pct: parseCleanNumber(r.Bunga_Pct, 0),
      Catatan_Promo: String(r.Catatan_Promo || "").trim(),
    }));
}

export function normalizeBnplRows(rows: any[]) {
  return (rows || [])
    .filter((r) => r && (r.Nama_Provider || r.Provider))
    .map((r, idx) => ({
      ...r,
      BNPL_ID: String(r.BNPL_ID || `BNPL-${idx + 1}`),
      Nama_Provider: String(r.Nama_Provider || r.Provider).trim(),
      Bunga_Bulanan_Pct: parseCleanNumber(r.Bunga_Bulanan_Pct ?? r.Bunga_Persen, 1.99),
      Biaya_Admin: parseCleanNumber(r.Biaya_Admin, 0),
      Min_DP_Pct: parseCleanNumber(r.Min_DP_Pct, 0),
    }));
}

export function normalizeMasterBundle(raw: any) {
  return {
    ...raw,
    tradeInDevices: normalizeTradeInRows(raw?.tradeInDevices || []),
    bankPromos: normalizeBankPromoRows(raw?.bankPromos || []),
    bnplProviders: normalizeBnplRows(raw?.bnplProviders || []),
  };
}
