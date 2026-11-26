import Papa from "papaparse";
import { GOOGLE_SHEET_CSV_URLS } from "@/config/sheets";
import {
  SEED_MASTER_DEVICES,
  SEED_COMPARISON_MATRIX,
  SEED_LOB_DEVICES,
  SEED_ACCESSORIES,
  SEED_ESSENTIAL_BUNDLES,
  SEED_QOALA_TIERS,
  SEED_BANK_PROMOS,
  SEED_BNPL_PROVIDERS,
  SEED_TRADEIN_DEVICES,
  SEED_PRICELIST_DEVICES,
  SEED_PRICELIST_ACCESSORIES,
} from "@/data/seedData";
import {
  MasterDevice,
  ComparisonItem,
  LobDevice,
  AccessoryItem,
  AccessoryCategory5,
  EssentialBundleItem,
  QoalaTier,
  BankPromo,
  BnplProvider,
  TradeInDevice,
  PricelistDeviceRow,
  PricelistAccessoryRow,
  SegmenTarget,
  AppleLobCategory,
} from "@/types/ascg";

function parseNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  return Number(cleaned) || 0;
}

/**
 * Normalisasi nama header kolom: toleran terhadap spasi, underscore, huruf besar/kecil.
 * Contoh: "Device ID" === "Device_ID" === "deviceid"
 */
function normalizeHeaderKey(key: string): string {
  return String(key || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getField(row: Record<string, string>, candidates: string[]): string {
  if (!row) return "";
  const normalizedMap = new Map<string, string>();
  Object.entries(row).forEach(([k, v]) => {
    normalizedMap.set(normalizeHeaderKey(k), v ?? "");
  });
  for (const cand of candidates) {
    const val = normalizedMap.get(normalizeHeaderKey(cand));
    if (val !== undefined && String(val).trim() !== "") {
      return String(val).trim();
    }
  }
  return "";
}

function stripHashtags(raw: string): string {
  return raw
    .replace(/#/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchCsvRows(url: string): Promise<Record<string, string>[] | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });
    return parsed.data;
  } catch {
    return null;
  }
}

async function fetchRawMatrix(url: string): Promise<string[][] | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    const parsed = Papa.parse<string[]>(text, {
      header: false,
      skipEmptyLines: false,
    });
    return parsed.data;
  } catch {
    return null;
  }
}

/**
 * Memecah sheet horizontal multi-blok (dipisahkan kolom kosong vertikal) menjadi array blok tabel terpisah.
 * Digunakan untuk tab:
 * - `3. Master Accessories` (5 blok: Casing, Adapter, Screen Protector, Lens Protector, Strap)
 * - `4 Essential Bundles` (5 blok berdampingan)
 * - `8. Legacy Apple Devices` (5 blok LOB berdampingan)
 */
export function splitHorizontalBlocks(matrix: string[][]): {
  blockTitle: string;
  headers: string[];
  rows: Record<string, string>[];
}[] {
  if (!matrix || matrix.length < 2) return [];

  // Cari baris header utama (baris yang punya >= 4 sel non-kosong & tidak diawali angka judul blok saja)
  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(matrix.length, 6); r++) {
    const nonEmptyCount = (matrix[r] || []).filter((c) => String(c || "").trim() !== "").length;
    if (nonEmptyCount >= 4) {
      headerRowIdx = r;
      break;
    }
  }

  const headerRow = matrix[headerRowIdx] || [];
  const titleRow = headerRowIdx > 0 ? matrix[headerRowIdx - 1] || [] : [];
  const maxCols = Math.max(...matrix.slice(headerRowIdx, headerRowIdx + 10).map((r) => (r || []).length));

  const segments: { startCol: number; endCol: number; title: string }[] = [];
  let inBlock = false;
  let startCol = 0;

  for (let c = 0; c <= maxCols; c++) {
    const hVal = String(headerRow[c] || "").trim();
    if (hVal !== "" && !inBlock) {
      inBlock = true;
      startCol = c;
    } else if (hVal === "" && inBlock) {
      const blockTitle =
        String(titleRow[startCol] || "").trim() ||
        String(headerRow[startCol] || "").trim() ||
        `Block ${segments.length + 1}`;
      segments.push({ startCol, endCol: c - 1, title: blockTitle });
      inBlock = false;
    }
  }

  return segments.map((seg) => {
    const headers: string[] = [];
    for (let c = seg.startCol; c <= seg.endCol; c++) {
      headers.push(String(headerRow[c] || `col_${c}`).trim());
    }
    const rows: Record<string, string>[] = [];
    for (let r = headerRowIdx + 1; r < matrix.length; r++) {
      const rawRow = matrix[r] || [];
      const obj: Record<string, string> = {};
      let hasData = false;
      for (let c = seg.startCol; c <= seg.endCol; c++) {
        const key = headers[c - seg.startCol];
        const val = String(rawRow[c] || "").trim();
        if (val !== "") hasData = true;
        obj[key] = val;
      }
      if (hasData) rows.push(obj);
    }
    return { blockTitle: seg.title, headers, rows };
  });
}

function mapBlockCategory5(title: string, idx: number): AccessoryCategory5 {
  const up = title.toUpperCase();
  if (up.includes("CASING") || up.includes("CASE")) return "Casing";
  if (up.includes("ADAPTER") || up.includes("CHARGER") || up.includes("KABEL")) return "Adapter & Kabel";
  if (up.includes("LENS")) return "Lens Protector";
  if (up.includes("SCREEN") || up.includes("TEMPERED")) return "Screen Protector";
  if (up.includes("STRAP") || up.includes("WATCH")) return "Apple Watch Strap";
  const order: AccessoryCategory5[] = [
    "Casing",
    "Adapter & Kabel",
    "Screen Protector",
    "Lens Protector",
    "Apple Watch Strap",
  ];
  return order[idx] || "Casing";
}

/**
 * Parser untuk `3. Master Accessories` (5 blok horizontal berdampingan)
 */
export async function loadMasterAccessories(): Promise<AccessoryItem[]> {
  const url = GOOGLE_SHEET_CSV_URLS.MASTER_ACCESSORIES;
  if (!url) return SEED_ACCESSORIES;

  const matrix = await fetchRawMatrix(url);
  if (!matrix) return SEED_ACCESSORIES;

  const blocks = splitHorizontalBlocks(matrix);
  if (blocks.length === 0) return SEED_ACCESSORIES;

  const result: AccessoryItem[] = [];
  blocks.forEach((blk, bIdx) => {
    const kategori = mapBlockCategory5(blk.blockTitle, bIdx);
    blk.rows.forEach((r, rIdx) => {
      const nama = getField(r, ["Nama Produk", "Nama_Produk", "SAP Description", "Product Name"]);
      const sap = getField(r, ["SAP Article", "SAP_Article", "SKU", "Acc ID", "Acc_ID"]);
      if (!nama && !sap) return;

      const bestRaw = getField(r, ["Label Best Seller", "Label_Best_Seller", "Status"]).toUpperCase();
      const tagsRaw = getField(r, ["Tag Value Utama", "Tag_Value_Utama", "Tag Value", "Highlight Value"]);
      const hargaNormal = parseNumber(getField(r, ["Harga Normal", "Harga_Normal", "SRP Normal"]));
      const hargaPromo =
        parseNumber(getField(r, ["Harga Promo", "Harga_Promo", "Current SRP Cash"])) || hargaNormal;

      result.push({
        Acc_ID: getField(r, ["Acc ID", "Acc_ID"]) || `ACC-${bIdx + 1}-${rIdx + 1}`,
        SAP_Article: sap || `SKU-ACC-${bIdx + 1}-${rIdx + 1}`,
        Barcode_EAN: getField(r, ["Barcode EAN", "Barcode_EAN", "EAN"]) || sap,
        Kategori_Aksesoris: kategori,
        LOB_Target: (getField(r, ["LOB Target", "LOB_Target", "LOB"]) as AppleLobCategory) ||
          (kategori === "Lens Protector"
            ? "iPhone"
            : kategori === "Apple Watch Strap"
            ? "Apple Watch"
            : "iPhone"),
        Tier_Casing: getField(r, ["Tier Casing", "Tier_Casing", "Tier"]) || "-",
        Merek: getField(r, ["Merek", "Brand"]) || "Digimap Partner",
        Nama_Produk: nama || sap,
        Label_Best_Seller: bestRaw.includes("BEST") ? "BEST SELLER" : "Regular",
        Tag_Value_Utama: tagsRaw
          ? tagsRaw
              .split(/[,;|]/)
              .map((t) => stripHashtags(t))
              .filter(Boolean)
          : ["Official Partner"],
        Kompatibilitas_Segmen:
          getField(r, ["Kompatibilitas Segmen", "Kompatibilitas_Segmen", "Kompatibilitas"]) ||
          "Semua Segmen",
        Harga_Normal: hargaNormal,
        Harga_Promo: hargaPromo,
        Material_Proteksi:
          getField(r, ["Material Proteksi", "Material_Proteksi", "Material"]) ||
          "Standar Proteksi Resmi Digimap",
      });
    });
  });

  return result.length > 0 ? result : SEED_ACCESSORIES;
}

/**
 * Parser untuk `4 Essential Bundles` (5 blok horizontal berdampingan)
 */
export async function loadEssentialBundles(): Promise<EssentialBundleItem[]> {
  const url = GOOGLE_SHEET_CSV_URLS.ESSENTIAL_BUNDLES;
  if (!url) return SEED_ESSENTIAL_BUNDLES;

  const matrix = await fetchRawMatrix(url);
  if (!matrix) return SEED_ESSENTIAL_BUNDLES;

  const blocks = splitHorizontalBlocks(matrix);
  if (blocks.length === 0) return SEED_ESSENTIAL_BUNDLES;

  const result: EssentialBundleItem[] = [];
  blocks.forEach((blk, bIdx) => {
    const kategori = mapBlockCategory5(blk.blockTitle, bIdx);
    blk.rows.forEach((r, rIdx) => {
      const nama = getField(r, ["Nama Item", "Nama_Item", "Nama Produk", "Nama_Produk"]);
      if (!nama) return;
      const segRaw = getField(r, ["Segmen Target", "Segmen_Target", "Segmen"]);
      const segmen: SegmenTarget = segRaw.toLowerCase().includes("pro")
        ? "Pro/Flagship"
        : segRaw.toLowerCase().includes("eco")
        ? "Ecosystem"
        : "Base/Entry";

      const bestRaw = getField(r, ["Label Best Seller", "Label_Best_Seller"]).toUpperCase();
      const tagsRaw = getField(r, ["Tag Value", "Tag_Value", "Tag Value Utama"]);

      result.push({
        Bundle_ID: getField(r, ["Bundle ID", "Bundle_ID"]) || `BND-${bIdx + 1}-${rIdx + 1}`,
        Kategori_Blok: kategori,
        Segmen_Target: segmen,
        LOB_Target: (getField(r, ["LOB Target", "LOB_Target", "LOB"]) as AppleLobCategory) || "iPhone",
        SAP_Article: getField(r, ["SAP Article", "SAP_Article", "SKU"]) || `BND-SKU-${rIdx + 1}`,
        Merek: getField(r, ["Merek", "Brand"]) || "Apple / Partner",
        Nama_Item: nama,
        Tier_Casing: getField(r, ["Tier Casing", "Tier_Casing"]) || "-",
        Label_Best_Seller: bestRaw.includes("BEST") ? "BEST SELLER" : "Regular",
        Tag_Value: tagsRaw
          ? tagsRaw
              .split(/[,;|]/)
              .map((t) => stripHashtags(t))
              .filter(Boolean)
          : [],
        Harga_Cash: parseNumber(getField(r, ["Harga Cash", "Harga_Cash", "Harga Promo", "Harga"])),
        Alasan_Rekomendasi:
          getField(r, ["Alasan Rekomendasi", "Alasan_Rekomendasi", "Keterangan"]) ||
          "Rekomendasi proteksi wajib toko",
      });
    });
  });

  return result.length > 0 ? result : SEED_ESSENTIAL_BUNDLES;
}

/**
 * Parser untuk `8. Legacy Apple Devices` (5 blok horizontal LOB berdampingan)
 */
export async function loadLobDevices(): Promise<LobDevice[]> {
  const url = GOOGLE_SHEET_CSV_URLS.LEGACY_APPLE_DEVICES;
  if (!url) return SEED_LOB_DEVICES;

  const matrix = await fetchRawMatrix(url);
  if (!matrix) return SEED_LOB_DEVICES;

  const blocks = splitHorizontalBlocks(matrix);
  if (blocks.length === 0) return SEED_LOB_DEVICES;

  const lobOrder: LobDevice["Kategori_LOB"][] = [
    "LOB iPhone",
    "LOB iPad",
    "LOB MacBook",
    "LOB Apple Watch",
    "LOB AirPods",
  ];

  const result: LobDevice[] = [];
  blocks.forEach((blk, bIdx) => {
    const up = blk.blockTitle.toUpperCase();
    let kategori: LobDevice["Kategori_LOB"] = lobOrder[bIdx] || "LOB iPhone";
    if (up.includes("IPAD")) kategori = "LOB iPad";
    else if (up.includes("MAC")) kategori = "LOB MacBook";
    else if (up.includes("WATCH")) kategori = "LOB Apple Watch";
    else if (up.includes("AIRPOD")) kategori = "LOB AirPods";
    else if (up.includes("IPHONE")) kategori = "LOB iPhone";

    blk.rows.forEach((r, rIdx) => {
      const model = getField(r, ["Model Varian", "Model_Varian", "Model", "Seri"]);
      if (!model) return;
      result.push({
        LOB_ID: getField(r, ["LOB ID", "LOB_ID"]) || `LEG-${bIdx + 1}-${rIdx + 1}`,
        Kategori_LOB: kategori,
        Seri_atau_Lini: getField(r, ["Seri atau Lini", "Seri_atau_Lini", "Seri"]) || kategori,
        Model_Varian: model,
        Tahun_Rilis: getField(r, ["Tahun Rilis", "Tahun_Rilis", "Tahun"]) || "-",
        Opsi_Storage: getField(r, ["Opsi Storage", "Opsi_Storage", "Storage"]) || "-",
        Layar_atau_Desain: getField(r, ["Layar atau Desain", "Layar_atau_Desain", "Layar"]) || "-",
        Chipset_dan_Spec: getField(r, ["Chipset dan Spec", "Chipset_dan_Spec", "Chipset"]) || "-",
        Apple_Intelligence:
          getField(r, ["Apple Intelligence", "Apple_Intelligence"]) || "Tidak Mendukung",
        Fitur_Utama: getField(r, ["Fitur Utama", "Fitur_Utama"]) || "-",
        Baterai_dan_Port: getField(r, ["Baterai dan Port", "Baterai_dan_Port"]) || "-",
        Gap_vs_Seri_Baru_Toko:
          getField(r, ["Gap vs Seri Baru Toko", "Gap_vs_Seri_Baru_Toko", "Gap"]) || "-",
        Rekomendasi_Upgrade_Terdekat:
          getField(r, [
            "Rekomendasi Upgrade Terdekat",
            "Rekomendasi_Upgrade_Terdekat",
            "Rekomendasi Upgrade",
          ]) || "-",
      });
    });
  });

  return result.length > 0 ? result : SEED_LOB_DEVICES;
}

/**
 * Parser untuk `3 Proteksi Qoala` (Hanya Qoala 8 Tier: KLABRONZE - KLAVVIP, tanpa AppleCare+)
 */
export async function loadQoalaTiers(): Promise<QoalaTier[]> {
  const url = GOOGLE_SHEET_CSV_URLS.PROTEKSI_QOALA;
  if (!url) return SEED_QOALA_TIERS;

  const rawRows = await fetchCsvRows(url);
  if (!rawRows || rawRows.length === 0) return SEED_QOALA_TIERS;

  const parsed: QoalaTier[] = [];
  rawRows.forEach((r, idx) => {
    const desc = getField(r, ["QOALA Description", "Nama Paket", "Nama_Paket", "Tier"]);
    // Pastikan kebijakan ketat: hanya Proteksi Qoala, abaikan AppleCare+
    if (!desc || desc.toUpperCase().includes("APPLECARE")) return;

    const p12 = parseNumber(getField(r, ["Premi 12 Months", "Premi 12 Bln", "Premi_12_Bln", "12 Months"]));
    const p18 = parseNumber(getField(r, ["Premi 18 Months", "Premi 18 Bln", "Premi_18_Bln", "18 Months"]));
    const p24 = parseNumber(getField(r, ["Premi 24 Months", "Premi 24 Bln", "Premi_24_Bln", "24 Months"]));

    if (p12 === 0 && p18 === 0 && p24 === 0) return;

    const kodeMatch = desc.toUpperCase().match(/KLA[A-Z]+/);
    const kodeTier = (kodeMatch ? kodeMatch[0] : `KLA_TIER_${idx + 1}`) as QoalaTier["Kode_Tier"];

    parsed.push({
      Tier_ID: getField(r, ["Tier ID", "Tier_ID"]) || `QOA-${idx + 1}`,
      Kode_Tier: kodeTier,
      Nama_Paket: desc,
      Min_Harga: parseNumber(getField(r, ["Min Harga", "Min_Harga"])),
      Max_Harga: parseNumber(getField(r, ["Max Harga", "Max_Harga"])) || 999999999,
      Premi_12_Bln: p12,
      Premi_18_Bln: p18 || Math.round(p12 * 1.38),
      Premi_24_Bln: p24 || Math.round(p12 * 1.75),
      SKU_12_Bln: `${kodeTier}-12M`,
      SKU_18_Bln: `${kodeTier}-18M`,
      SKU_24_Bln: `${kodeTier}-24M`,
      Deductible: getField(r, ["Deductible", "Deductible Klaim"]) || "Rp 250.000 – Rp 500.000 / klaim",
      Cakupan:
        getField(r, ["Cakupan", "Coverage"]) ||
        "Layar retak, kena cairan, kerusakan tak terduga & pencurian",
    });
  });

  return parsed.length > 0 ? parsed : SEED_QOALA_TIERS;
}

export async function loadAllAscgData() {
  const [
    rawDevices,
    rawComp,
    lobDevices,
    accessories,
    essentialBundles,
    qoalaTiers,
    rawPromos,
    rawTradeIn,
    rawPricelistDev,
    rawPricelistAcc,
  ] = await Promise.all([
    fetchCsvRows(GOOGLE_SHEET_CSV_URLS.MASTER_DEVICES),
    fetchCsvRows(GOOGLE_SHEET_CSV_URLS.COMPARISON_MATRIX),
    loadLobDevices(),
    loadMasterAccessories(),
    loadEssentialBundles(),
    loadQoalaTiers(),
    fetchCsvRows(GOOGLE_SHEET_CSV_URLS.PROMO_CC_BNPL),
    fetchCsvRows(GOOGLE_SHEET_CSV_URLS.TRADEIN_LAKU6),
    fetchCsvRows(GOOGLE_SHEET_CSV_URLS.PRICE_LIST_APPLE_DEVICE),
    fetchCsvRows(GOOGLE_SHEET_CSV_URLS.PRICE_LIST_ACCESSORIES),
  ]);

  const devices: MasterDevice[] =
    rawDevices && rawDevices.length > 0
      ? rawDevices
          .map((r, i) => {
            const model = getField(r, ["Model Varian", "Model_Varian", "SAPDescription"]);
            if (!model) return null;
            return {
              Device_ID: getField(r, ["Device ID", "Device_ID"]) || `DEV-${i + 1}`,
              SAP_Article:
                getField(r, ["SAP Article", "SAP_Article"]) ||
                getField(r, ["Device ID", "Device_ID"]) ||
                `SAP-DEV-${i + 1}`,
              Barcode_EAN:
                getField(r, ["Barcode EAN", "Barcode_EAN"]) ||
                getField(r, ["SAP Article", "SAP_Article"]) ||
                "",
              Kategori: (getField(r, ["Kategori", "LOB"]) as AppleLobCategory) || "iPhone",
              Seri_Keluarga: getField(r, ["Seri Keluarga", "Seri_Keluarga"]) || "",
              Model_Varian: model,
              Segmen_Target:
                (getField(r, ["Segmen Target", "Segmen_Target"]) as SegmenTarget) || "Base/Entry",
              Storage: getField(r, ["Storage", "Kapasitas"]) || "256GB",
              MSRP_Normal: parseNumber(getField(r, ["MSRP Normal", "MSRP_Normal", "Normal Price"])),
              Harga_SRP_Promo:
                parseNumber(
                  getField(r, ["Harga SRP Promo", "Harga_SRP_Promo", "Promotion Price"])
                ) || parseNumber(getField(r, ["MSRP Normal", "MSRP_Normal", "Normal Price"])),
              Casing_Compatibility_Tier:
                getField(r, ["Casing Compatibility Tier", "Casing_Compatibility_Tier"]) ||
                "Tier 1 - Tier 3",
              Layar_Refresh_Rate:
                getField(r, ["Layar Refresh Rate", "Layar_Refresh_Rate"]) || "",
              Chipset_AI: getField(r, ["Chipset AI", "Chipset_AI"]) || "",
              Kamera_Utama: getField(r, ["Kamera Utama", "Kamera_Utama"]) || "",
              Baterai_Port: getField(r, ["Baterai Port", "Baterai_Port"]) || "",
              Material: getField(r, ["Material"]) || "",
              Remarks: getField(r, ["Remarks"]) || "",
            } as MasterDevice;
          })
          .filter((x): x is MasterDevice => x !== null)
      : SEED_MASTER_DEVICES;

  const comparisons: ComparisonItem[] =
    rawComp && rawComp.length > 0
      ? rawComp
          .map((r, i) => {
            const varian = getField(r, ["Seri Model Varian", "Seri_Model_Varian"]);
            if (!varian) return null;
            return {
              Compare_Group_ID:
                getField(r, ["Compare Group ID", "Compare_Group_ID"]) || "CMP-GENERAL",
              Kategori_Komparasi:
                getField(r, ["Kategori Komparasi", "Kategori_Komparasi"]) || "Komparasi Apple",
              Device_ID: getField(r, ["Device ID", "Device_ID"]) || `CMP-${i + 1}`,
              SAP_Article: getField(r, ["SAP Article", "SAP_Article"]) || undefined,
              Seri_Model_Varian: varian,
              Segmen_Target:
                (getField(r, ["Segmen Target", "Segmen_Target"]) as SegmenTarget) || "Base/Entry",
              Harga_SRP_Normal: parseNumber(
                getField(r, ["Harga SRP Normal", "Harga_SRP_Normal"])
              ),
              Harga_Promo_Cash: parseNumber(
                getField(r, ["Harga Promo Cash", "Harga_Promo_Cash"])
              ),
              Upgrade_Delta_Cash: parseNumber(
                getField(r, ["Upgrade Delta Cash", "Upgrade_Delta_Cash"])
              ),
              Kebutuhan_Utama_Tags: stripHashtags(
                getField(r, ["Kebutuhan Utama Tags", "Kebutuhan_Utama_Tags"])
              ),
              What_You_Gain_1: getField(r, ["What You Gain 1", "What_You_Gain_1"]),
              What_You_Gain_2: getField(r, ["What You Gain 2", "What_You_Gain_2"]),
              What_You_Gain_3: getField(r, ["What You Gain 3", "What_You_Gain_3"]),
              Layar_dan_Refresh_Rate: getField(r, [
                "Layar dan Refresh Rate",
                "Layar_dan_Refresh_Rate",
              ]),
              Chipset_dan_Apple_Intelligence: getField(r, [
                "Chipset dan Apple Intelligence",
                "Chipset_dan_Apple_Intelligence",
              ]),
              Sistem_Kamera_dan_Video: getField(r, [
                "Sistem Kamera dan Video",
                "Sistem_Kamera_dan_Video",
              ]),
              Baterai_dan_Konektivitas: getField(r, [
                "Baterai dan Konektivitas",
                "Baterai_dan_Konektivitas",
              ]),
              Material_dan_Ketahanan: getField(r, [
                "Material dan Ketahanan",
                "Material_dan_Ketahanan",
              ]),
              Best_For_Profile: getField(r, ["Best For Profile", "Best_For_Profile"]),
              Rekomendasi_Casing_Tier: getField(r, [
                "Rekomendasi Casing Tier",
                "Rekomendasi_Casing_Tier",
              ]),
              Rekomendasi_Bundle_ID: getField(r, [
                "Rekomendasi Bundle ID",
                "Rekomendasi_Bundle_ID",
              ]),
            } as ComparisonItem;
          })
          .filter((x): x is ComparisonItem => x !== null)
      : SEED_COMPARISON_MATRIX;

  const bankPromos: BankPromo[] =
    rawPromos && rawPromos.length > 0
      ? rawPromos
          .filter((r) => getField(r, ["Nama Bank", "Nama_Bank"]))
          .map((r, i) => ({
            Bank_ID: getField(r, ["Bank ID", "Bank_ID"]) || `BNK-${i + 1}`,
            Nama_Bank: getField(r, ["Nama Bank", "Nama_Bank"]),
            Tenor_Tersedia: (getField(r, ["Tenor Tersedia", "Tenor_Tersedia"]) || "3,6,12,24")
              .split(",")
              .map((n) => Number(n.trim()))
              .filter(Boolean),
            Bunga_Pct: parseNumber(getField(r, ["Bunga Pct", "Bunga_Pct"])),
            Min_Transaksi:
              parseNumber(getField(r, ["Min Transaksi", "Min_Transaksi"])) || 3000000,
            Catatan_Promo: getField(r, ["Catatan Promo", "Catatan_Promo"]),
          }))
      : SEED_BANK_PROMOS;

  const tradeInDevices: TradeInDevice[] =
    rawTradeIn && rawTradeIn.length > 0
      ? rawTradeIn
          .filter((r) => getField(r, ["Tipe Device Lama", "Tipe_Device_Lama"]))
          .map((r, i) => ({
            TradeIn_ID: getField(r, ["TradeIn ID", "TradeIn_ID"]) || `TI-${i + 1}`,
            Tipe_Device_Lama: getField(r, ["Tipe Device Lama", "Tipe_Device_Lama"]),
            Harga_Grade_A: parseNumber(getField(r, ["Harga Grade A", "Harga_Grade_A"])),
            Bonus_TopUp: parseNumber(getField(r, ["Bonus TopUp", "Bonus_TopUp"])),
          }))
      : SEED_TRADEIN_DEVICES;

  const pricelistDevices: PricelistDeviceRow[] =
    rawPricelistDev && rawPricelistDev.length > 0
      ? rawPricelistDev
          .filter((r) => getField(r, ["SAPDescription", "SAP Description"]))
          .map((r) => {
            const catRaw = getField(r, ["Category"]).toUpperCase();
            let category: AppleLobCategory = "iPhone";
            if (catRaw.includes("IPAD")) category = "iPad";
            else if (catRaw.includes("WATCH")) category = "Apple Watch";
            else if (catRaw.includes("AIRPOD") || catRaw.includes("AUDIO")) category = "AirPods";
            else if (catRaw.includes("MAC") || catRaw.includes("MBA") || catRaw.includes("MBP"))
              category = "MacBook";

            const norm = parseNumber(getField(r, ["Normal Price"]));
            const promo = parseNumber(getField(r, ["Promotion Price"])) || norm;
            const eol = getField(r, ["EOL Status"]).toUpperCase();

            return {
              SAP_Article: getField(r, ["SAP Article"]),
              SAP_Description: getField(r, ["SAPDescription", "SAP Description"]),
              Category: category,
              Seri_Group: category,
              Normal_Price: norm,
              Promotion_Price: promo,
              Remarks: getField(r, ["Remarks"]),
              Status: eol.includes("EOL") ? "EOL" : promo < norm ? "Promo" : "Active",
            };
          })
      : SEED_PRICELIST_DEVICES;

  const pricelistAccessories: PricelistAccessoryRow[] =
    rawPricelistAcc && rawPricelistAcc.length > 0
      ? rawPricelistAcc
          .filter((r) => getField(r, ["SAP Description", "SAPDescription"]))
          .map((r) => {
            const refSrp = parseNumber(getField(r, ["Reference SRP"]));
            const currSrp = parseNumber(getField(r, ["Current SRP Cash"])) || refSrp;
            const repSrp = parseNumber(getField(r, ["Repricing Cash"])) || currSrp;
            return {
              Brand: getField(r, ["Brand"]) || "Partner",
              SAP_Article: getField(r, ["SAP Article"]),
              SAP_Description: getField(r, ["SAP Description", "SAPDescription"]),
              Category: getField(r, ["Category"]) || "Accessory",
              Reference_SRP: refSrp,
              Current_SRP_Cash: currSrp,
              Repricing_Cash: repSrp,
              Remarks: getField(r, ["Remarks"]),
            };
          })
      : SEED_PRICELIST_ACCESSORIES;

  const hasAnyLiveUrl = Object.values(GOOGLE_SHEET_CSV_URLS).some((u) => Boolean(u));

  return {
    devices,
    comparisons,
    lobDevices,
    accessories,
    essentialBundles,
    qoalaTiers,
    bankPromos,
    bnplProviders: SEED_BNPL_PROVIDERS,
    tradeInDevices,
    pricelistDevices,
    pricelistAccessories,
    isLiveSheet: hasAnyLiveUrl,
  };
}
