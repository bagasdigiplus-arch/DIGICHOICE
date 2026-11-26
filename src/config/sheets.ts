/**
 * KONFIGURASI GOOGLE SHEETS PUBLISHED CSV — DIGI CHOICE
 * Base Endpoint Master Database Publik:
 * https://docs.google.com/spreadsheets/d/e/2PACX-1vSMZKZA-DhA8Ku0mKea1m5snrB19oxVxQpt0UfR0u0yMe4gZCYYJN_NELRwM0qHfzz7PJTpVTNJquZN/pub&gid=<id_tab>
 *
 * Cara menghubungkan tab secara live:
 * Isi `SHEET_TAB_GIDS` di bawah ini atau atur variabel environment `NEXT_PUBLIC_GID_*` / `NEXT_PUBLIC_CSV_*`.
 * Jika GID dibiarkan kosong (""), aplikasi otomatis menggunakan Fallback Master Seed Data (Update 23 Nov 2026).
 */

export const MASTER_SHEET_BASE_PUB_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSMZKZA-DhA8Ku0mKea1m5snrB19oxVxQpt0UfR0u0yMe4gZCYYJN_NELRwM0qHfzz7PJTpVTNJquZN/pub";

export interface SheetTabRegistryItem {
  key: keyof typeof SHEET_TAB_GIDS;
  tabName: string;
  description: string;
  layoutType: "vertical" | "horizontal-5-blocks";
}

export const SHEET_TAB_GIDS = {
  PRICE_LIST_APPLE_DEVICE: process.env.NEXT_PUBLIC_GID_PRICE_LIST_DEVICE || "",
  PRICE_LIST_ACCESSORIES: process.env.NEXT_PUBLIC_GID_PRICE_LIST_ACCESSORIES || "",
  MASTER_DEVICES: process.env.NEXT_PUBLIC_GID_MASTER_DEVICES || "",
  COMPARISON_MATRIX: process.env.NEXT_PUBLIC_GID_COMPARISON_MATRIX || "",
  MASTER_ACCESSORIES: process.env.NEXT_PUBLIC_GID_MASTER_ACCESSORIES || "",
  ESSENTIAL_BUNDLES: process.env.NEXT_PUBLIC_GID_ESSENTIAL_BUNDLES || "",
  PROTEKSI_QOALA: process.env.NEXT_PUBLIC_GID_PROTEKSI_QOALA || "",
  PROMO_CC_BNPL: process.env.NEXT_PUBLIC_GID_PROMO_CC_BNPL || "",
  TRADEIN_LAKU6: process.env.NEXT_PUBLIC_GID_TRADEIN_LAKU6 || "",
  SIMULASI_ETP_TESTER: process.env.NEXT_PUBLIC_GID_SIMULASI_ETP_TESTER || "",
  LEGACY_APPLE_DEVICES: process.env.NEXT_PUBLIC_GID_LEGACY_APPLE_DEVICES || "",
};

export const SHEET_TAB_REGISTRY: SheetTabRegistryItem[] = [
  {
    key: "PRICE_LIST_APPLE_DEVICE",
    tabName: "PRICE LIST APPLE DEVICE",
    description: "Referensi harga resmi & SAP Article seluruh unit Apple",
    layoutType: "vertical",
  },
  {
    key: "PRICE_LIST_ACCESSORIES",
    tabName: "PRICE LIST ACCESSORIES",
    description: "Referensi harga & SAP Article 4.200+ SKU aksesoris Digimap",
    layoutType: "vertical",
  },
  {
    key: "MASTER_DEVICES",
    tabName: "1. Master Devices",
    description: "Data terstruktur 5 LOB (iPhone, iPad, MacBook termasuk MacBook Neo 13", Watch, AirPods)",
    layoutType: "vertical",
  },
  {
    key: "COMPARISON_MATRIX",
    tabName: "2. Comparison Matrix Apple",
    description: "8 kategori komparasi, 9 Segmen Target, 10 Kebutuhan Utama, Best For & Upgrade Delta Cash",
    layoutType: "vertical",
  },
  {
    key: "MASTER_ACCESSORIES",
    tabName: "3. Master Accessories",
    description: "5 blok horizontal: Casing, Adapter, Screen Protector, Lens Protector (iPhone), Strap (Watch)",
    layoutType: "horizontal-5-blocks",
  },
  {
    key: "ESSENTIAL_BUNDLES",
    tabName: "4 Essential Bundles",
    description: "5 blok horizontal paket rekomendasi wajib tersegmentasi per seri & LOB",
    layoutType: "horizontal-5-blocks",
  },
  {
    key: "PROTEKSI_QOALA",
    tabName: "3 Proteksi Qoala",
    description: "Pricelist 8 tier Qoala (KLABRONZE–KLAVVIP) & 24 opsi skema tenor 12, 18, dan 24 Bulan",
    layoutType: "vertical",
  },
  {
    key: "PROMO_CC_BNPL",
    tabName: "5 Promo CC BNPL",
    description: "Daftar bank partner CC 0% (3–24 bln) & penyedia BNPL (Kredivo, Indodana, SPayLater, HCI)",
    layoutType: "vertical",
  },
  {
    key: "TRADEIN_LAKU6",
    tabName: "6 TradeIn Laku6",
    description: "Estimasi buyback Laku6 / Mau Jual berdasarkan tipe perangkat & Grade A/B/C",
    layoutType: "vertical",
  },
  {
    key: "SIMULASI_ETP_TESTER",
    tabName: "7 Simulasi ETP Tester",
    description: "Struktur perhitungan transaksi kasir ETP, split payment & handover SKU",
    layoutType: "vertical",
  },
  {
    key: "LEGACY_APPLE_DEVICES",
    tabName: "8. Legacy Apple Devices",
    description: "5 blok horizontal perangkat Apple generasi lama vs baru per LOB",
    layoutType: "horizontal-5-blocks",
  },
];

export function buildSheetCsvUrl(gidOrFullUrl: string): string {
  const val = (gidOrFullUrl || "").trim();
  if (!val) return "";
  if (val.startsWith("http://") || val.startsWith("https://")) {
    if (val.includes("output=csv")) return val;
    if (val.includes("/pub&gid=")) {
      return val.replace("/pub&gid=", "/pub?output=csv&gid=");
    }
    return val.includes("?") ? `${val}&output=csv` : `${val}?output=csv`;
  }
  return `${MASTER_SHEET_BASE_PUB_URL}?output=csv&gid=${encodeURIComponent(val)}`;
}

export const GOOGLE_SHEET_CSV_URLS = {
  PRICE_LIST_APPLE_DEVICE: buildSheetCsvUrl(
    process.env.NEXT_PUBLIC_CSV_PRICE_LIST_DEVICE || SHEET_TAB_GIDS.PRICE_LIST_APPLE_DEVICE
  ),
  PRICE_LIST_ACCESSORIES: buildSheetCsvUrl(
    process.env.NEXT_PUBLIC_CSV_PRICE_LIST_ACCESSORIES || SHEET_TAB_GIDS.PRICE_LIST_ACCESSORIES
  ),
  MASTER_DEVICES: buildSheetCsvUrl(
    process.env.NEXT_PUBLIC_CSV_MASTER_DEVICES || SHEET_TAB_GIDS.MASTER_DEVICES
  ),
  COMPARISON_MATRIX: buildSheetCsvUrl(
    process.env.NEXT_PUBLIC_CSV_COMPARISON_MATRIX || SHEET_TAB_GIDS.COMPARISON_MATRIX
  ),
  MASTER_ACCESSORIES: buildSheetCsvUrl(
    process.env.NEXT_PUBLIC_CSV_MASTER_ACCESSORIES || SHEET_TAB_GIDS.MASTER_ACCESSORIES
  ),
  ESSENTIAL_BUNDLES: buildSheetCsvUrl(
    process.env.NEXT_PUBLIC_CSV_ESSENTIAL_BUNDLES || SHEET_TAB_GIDS.ESSENTIAL_BUNDLES
  ),
  PROTEKSI_QOALA: buildSheetCsvUrl(
    process.env.NEXT_PUBLIC_CSV_PROTEKSI_QOALA || SHEET_TAB_GIDS.PROTEKSI_QOALA
  ),
  PROMO_CC_BNPL: buildSheetCsvUrl(
    process.env.NEXT_PUBLIC_CSV_PROMO_CC_BNPL || SHEET_TAB_GIDS.PROMO_CC_BNPL
  ),
  TRADEIN_LAKU6: buildSheetCsvUrl(
    process.env.NEXT_PUBLIC_CSV_TRADEIN_LAKU6 || SHEET_TAB_GIDS.TRADEIN_LAKU6
  ),
  SIMULASI_ETP_TESTER: buildSheetCsvUrl(
    process.env.NEXT_PUBLIC_CSV_SIMULASI_ETP_TESTER || SHEET_TAB_GIDS.SIMULASI_ETP_TESTER
  ),
  LEGACY_APPLE_DEVICES: buildSheetCsvUrl(
    process.env.NEXT_PUBLIC_CSV_LEGACY_APPLE_DEVICES || SHEET_TAB_GIDS.LEGACY_APPLE_DEVICES
  ),
  // Alias backward-compatible
  LOB_APPLE_DEVICES: buildSheetCsvUrl(
    process.env.NEXT_PUBLIC_CSV_LOB_DEVICES || SHEET_TAB_GIDS.LEGACY_APPLE_DEVICES
  ),
};
