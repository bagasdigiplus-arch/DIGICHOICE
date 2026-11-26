"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  Database,
  Layers,
} from "lucide-react";
import {
  MasterDevice,
  AccessoryItem,
  BankPromo,
  BnplProvider,
  TradeInDevice,
  QoalaTier,
} from "@/types/ascg";
import { formatRupiah } from "@/utils/formatters";

export type UploadDatasetType =
  | "DEVICES"
  | "ACCESSORIES"
  | "PROMO_CC"
  | "BNPL"
  | "TRADE_IN"
  | "QOALA";

interface DataUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: MasterDevice[];
  accessories: AccessoryItem[];
  bankPromos: BankPromo[];
  bnplProviders: BnplProvider[];
  tradeInDevices: TradeInDevice[];
  qoalaTiers: QoalaTier[];
  onApplyDevices: (updated: MasterDevice[]) => void;
  onApplyAccessories: (updated: AccessoryItem[]) => void;
  onApplyBankPromos: (updated: BankPromo[]) => void;
  onApplyBnpl: (updated: BnplProvider[]) => void;
  onApplyTradeIn: (updated: TradeInDevice[]) => void;
  onApplyQoala: (updated: QoalaTier[]) => void;
  onResetAllToDefault: () => void;
}

const DATASET_META: Record<
  UploadDatasetType,
  {
    label: string;
    desc: string;
    acceptedCols: string;
    sampleHeaders: string[];
  }
> = {
  DEVICES: {
    label: "Master Devices (Pricelist Digimap / Master DB)",
    desc: "Mendukung langsung file Excel Pricelist Apple Device Digimap (kolom SAP Article, SAPDescription, Normal Price, Promotion Price) maupun format Master_Devices.",
    acceptedCols: "SAP Article / Device_ID, SAPDescription / Model_Varian, Normal Price, Promotion Price, EOL Status",
    sampleHeaders: [
      "Device_ID",
      "SAP_Article",
      "Kategori",
      "Seri_Keluarga",
      "Model_Varian",
      "Storage",
      "MSRP_Normal",
      "Harga_SRP_Promo",
    ],
  },
  ACCESSORIES: {
    label: "Master Accessories (Pricelist Accessories Digimap)",
    desc: "Mendukung langsung file Excel Pricelist Accessories Digimap (SAP Article, Brand, Category, SAP Description, Reference SRP, Repricing Cash) maupun format Master_Accessories.",
    acceptedCols: "SAP Article / Acc_ID, Brand, Category, SAP Description, Reference SRP, Repricing Cash",
    sampleHeaders: [
      "Acc_ID",
      "SAP_Article",
      "Kategori_Aksesoris",
      "Tier_Casing",
      "Merek",
      "Nama_Produk",
      "Harga_Normal",
      "Harga_Promo",
    ],
  },
  PROMO_CC: {
    label: "Promo Kartu Kredit & Bank (0% / Cashback)",
    desc: "Upload daftar promo bank bulanan untuk mengupdate tenor cicilan 0%, minimum transaksi, dan catatan cashback bank.",
    acceptedCols: "Bank_ID, Nama_Bank, Tenor_Tersedia (pisah koma), Bunga_Pct, Min_Transaksi, Catatan_Promo",
    sampleHeaders: [
      "Bank_ID",
      "Nama_Bank",
      "Tenor_Tersedia",
      "Bunga_Pct",
      "Min_Transaksi",
      "Catatan_Promo",
    ],
  },
  BNPL: {
    label: "BNPL / PayLater (Kredivo, Home Credit, Akulaku, SPayLater)",
    desc: "Upload skema bunga bulanan, biaya admin, minimum DP, dan tenor provider PayLater.",
    acceptedCols: "BNPL_ID, Nama_Provider, Tenor_Tersedia, Bunga_Bulanan_Pct, Biaya_Admin, Min_DP_Pct",
    sampleHeaders: [
      "BNPL_ID",
      "Nama_Provider",
      "Tenor_Tersedia",
      "Bunga_Bulanan_Pct",
      "Biaya_Admin",
      "Min_DP_Pct",
    ],
  },
  TRADE_IN: {
    label: "Trade-In Laku6 (Valuasi & Top-Up Bonus)",
    desc: "Upload tabel harga taksiran Grade A dan bonus top-up trade-in terbaru.",
    acceptedCols: "TradeIn_ID, Tipe_Device_Lama, Harga_Grade_A, Bonus_TopUp",
    sampleHeaders: ["TradeIn_ID", "Tipe_Device_Lama", "Harga_Grade_A", "Bonus_TopUp"],
  },
  QOALA: {
    label: "Proteksi Qoala (Tier Premi 12 & 24 Bulan)",
    desc: "Upload bracket harga perangkat dan premi proteksi Qoala 12 bulan & 24 bulan.",
    acceptedCols: "Tier_ID, Nama_Paket, Min_Harga, Max_Harga, Premi_12_Bln, Premi_24_Bln, SKU_12_Bln, SKU_24_Bln",
    sampleHeaders: [
      "Tier_ID",
      "Nama_Paket",
      "Min_Harga",
      "Max_Harga",
      "Premi_12_Bln",
      "Premi_24_Bln",
      "SKU_12_Bln",
      "SKU_24_Bln",
    ],
  },
};

function cleanNum(val: unknown): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  return Number(cleaned) || 0;
}

export default function DataUploadModal({
  isOpen,
  onClose,
  devices,
  accessories,
  bankPromos,
  bnplProviders,
  tradeInDevices,
  qoalaTiers,
  onApplyDevices,
  onApplyAccessories,
  onApplyBankPromos,
  onApplyBnpl,
  onApplyTradeIn,
  onApplyQoala,
  onResetAllToDefault,
}: DataUploadModalProps) {
  const [selectedType, setSelectedType] = useState<UploadDatasetType>("DEVICES");
  const [fileName, setFileName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [previewSummary, setPreviewSummary] = useState<{
    matchedCount: number;
    newCount: number;
    totalParsed: number;
    sampleChanges: { id: string; name: string; oldPrice?: number; newPrice: number }[];
  } | null>(null);
  const [pendingPayload, setPendingPayload] = useState<unknown>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const parseSheetToObjects = async (file: File): Promise<Record<string, unknown>[]> => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      const text = await file.text();
      const parsed = Papa.parse<Record<string, unknown>>(text, {
        header: true,
        skipEmptyLines: true,
      });
      return parsed.data;
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawMatrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

    // Auto-detect header row (Digimap official Excel files usually have header on row 4 / index 3)
    let headerIdx = 0;
    for (let i = 0; i < Math.min(10, rawMatrix.length); i++) {
      const row = rawMatrix[i] || [];
      const rowStr = row.map((c) => String(c || "").trim().toLowerCase()).join("|");
      if (
        rowStr.includes("sap article") ||
        rowStr.includes("device_id") ||
        rowStr.includes("acc_id") ||
        rowStr.includes("bank_id") ||
        rowStr.includes("bnpl_id") ||
        rowStr.includes("tradein_id") ||
        rowStr.includes("tier_id")
      ) {
        headerIdx = i;
        break;
      }
    }

    const headers = (rawMatrix[headerIdx] || []).map((h, idx) =>
      h ? String(h).trim().replace(/\s+/g, " ") : `col_${idx}`
    );

    const rows: Record<string, unknown>[] = [];
    for (let r = headerIdx + 1; r < rawMatrix.length; r++) {
      const rowArr = rawMatrix[r] || [];
      if (rowArr.every((cell) => cell === null || cell === undefined || String(cell).trim() === "")) {
        continue;
      }
      const obj: Record<string, unknown> = {};
      headers.forEach((h, cIdx) => {
        obj[h] = rowArr[cIdx];
      });
      rows.push(obj);
    }
    return rows;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg("");
    setPreviewSummary(null);
    setPendingPayload(null);
    setFileName(file.name);

    try {
      const rows = await parseSheetToObjects(file);
      if (!rows || rows.length === 0) {
        setErrorMsg("File kosong atau format header tidak dikenali.");
        return;
      }

      if (selectedType === "DEVICES") {
        const updatedMap = new Map<string, MasterDevice>();
        devices.forEach((d) => updatedMap.set(d.Device_ID, { ...d }));

        let matchedCount = 0;
        let newCount = 0;
        const sampleChanges: { id: string; name: string; oldPrice?: number; newPrice: number }[] = [];

        rows.forEach((r, idx) => {
          const sap = String(r["SAP Article"] || r["SAP_Article"] || "").trim();
          const devId = String(r["Device_ID"] || "").trim();
          const desc = String(r["SAPDescription"] || r["SAP Description"] || r["Model_Varian"] || "").trim();
          if (!desc && !devId) return;

          const normalPrice = cleanNum(r["Normal Price"] ?? r["MSRP_Normal"]);
          const promoPrice =
            cleanNum(r["Promotion Price"] ?? r["Harga_SRP_Promo"]) || normalPrice;
          if (normalPrice <= 0 && promoPrice <= 0) return;

          // Match by Device_ID or SAP_Article
          const existing = Array.from(updatedMap.values()).find(
            (item) =>
              (devId && item.Device_ID === devId) ||
              (sap && item.SAP_Article && item.SAP_Article.toLowerCase() === sap.toLowerCase())
          );

          if (existing) {
            const oldP = existing.Harga_SRP_Promo;
            existing.MSRP_Normal = normalPrice || existing.MSRP_Normal;
            existing.Harga_SRP_Promo = promoPrice || existing.Harga_SRP_Promo;
            if (sap) existing.SAP_Article = sap;
            updatedMap.set(existing.Device_ID, existing);
            matchedCount++;
            if (oldP !== existing.Harga_SRP_Promo && sampleChanges.length < 8) {
              sampleChanges.push({
                id: sap || existing.Device_ID,
                name: existing.Model_Varian,
                oldPrice: oldP,
                newPrice: existing.Harga_SRP_Promo,
              });
            }
          } else if (devId) {
            const newItem: MasterDevice = {
              Device_ID: devId,
              SAP_Article: sap,
              Barcode_EAN: sap || devId,
              Kategori: (String(r["Kategori"] || "iPhone") as MasterDevice["Kategori"]),
              Seri_Keluarga: String(r["Seri_Keluarga"] || "Apple Device"),
              Model_Varian: desc,
              Segmen_Target: "Base/Entry",
              Storage: String(r["Storage"] || "256GB"),
              MSRP_Normal: normalPrice || promoPrice,
              Harga_SRP_Promo: promoPrice || normalPrice,
              Casing_Compatibility_Tier: String(r["Casing_Compatibility_Tier"] || "Tier 1 - Tier 3"),
              Layar_Refresh_Rate: String(r["Layar_Refresh_Rate"] || "-"),
              Chipset_AI: String(r["Chipset_AI"] || "-"),
              Kamera_Utama: String(r["Kamera_Utama"] || "-"),
              Baterai_Port: String(r["Baterai_Port"] || "USB-C"),
              Material: String(r["Material"] || "Aluminum / Glass"),
            };
            updatedMap.set(devId, newItem);
            newCount++;
            if (sampleChanges.length < 8) {
              sampleChanges.push({
                id: sap || devId,
                name: desc,
                newPrice: newItem.Harga_SRP_Promo,
              });
            }
          } else if (sap && idx < 60 && String(r["EOL Status"] || "").trim() === "") {
            // Allow importing non-EOL Digimap device rows if explicitly desired
          }
        });

        const finalDevices = Array.from(updatedMap.values());
        setPendingPayload(finalDevices);
        setPreviewSummary({
          matchedCount,
          newCount,
          totalParsed: rows.length,
          sampleChanges,
        });
      } else if (selectedType === "ACCESSORIES") {
        const updatedMap = new Map<string, AccessoryItem>();
        accessories.forEach((a) => updatedMap.set(a.Acc_ID, { ...a }));

        let matchedCount = 0;
        let newCount = 0;
        const sampleChanges: { id: string; name: string; oldPrice?: number; newPrice: number }[] = [];

        rows.forEach((r) => {
          const sap = String(r["SAP Article"] || r["SAP_Article"] || "").trim();
          const accId = String(r["Acc_ID"] || r["Accessory_ID"] || "").trim();
          const desc = String(r["SAP Description"] || r["Nama_Produk"] || r["Accessory_Name"] || "").trim();
          if (!desc && !accId && !sap) return;

          const msrp = cleanNum(r["Reference SRP"] ?? r["Harga_Normal"] ?? r["Harga_MSRP"]);
          const promo =
            cleanNum(r["Repricing Cash"] ?? r["Current SRP Cash"] ?? r["Harga_Promo"] ?? r["Harga_Jual_Promo"]) ||
            msrp;
          if (msrp <= 0 && promo <= 0) return;

          const existing = Array.from(updatedMap.values()).find(
            (item) =>
              (accId && item.Acc_ID === accId) ||
              (sap && item.SAP_Article && item.SAP_Article.toLowerCase() === sap.toLowerCase())
          );

          if (existing) {
            const oldP = existing.Harga_Promo;
            existing.Harga_Normal = msrp || existing.Harga_Normal;
            existing.Harga_Promo = promo || existing.Harga_Promo;
            if (sap) existing.SAP_Article = sap;
            updatedMap.set(existing.Acc_ID, existing);
            matchedCount++;
            if (oldP !== existing.Harga_Promo && sampleChanges.length < 8) {
              sampleChanges.push({
                id: sap || existing.Acc_ID,
                name: existing.Nama_Produk,
                oldPrice: oldP,
                newPrice: existing.Harga_Promo,
              });
            }
          } else if (accId) {
            const newAcc: AccessoryItem = {
              Acc_ID: accId,
              SAP_Article: sap,
              Barcode_EAN: sap || accId,
              Kategori_Aksesoris:
                (String(r["Kategori_Aksesoris"] || "Casing") as AccessoryItem["Kategori_Aksesoris"]),
              Tier_Casing: String(r["Tier_Casing"] || "-"),
              Merek: String(r["Brand"] || r["Merek"] || "Apple"),
              Nama_Produk: desc,
              Label_Best_Seller: "Regular",
              Tag_Value_Utama: ["Updated via Excel"],
              Kompatibilitas_Segmen: "Semua Segmen",
              Harga_Normal: msrp || promo,
              Harga_Promo: promo || msrp,
              Material_Proteksi: desc,
            };
            updatedMap.set(accId, newAcc);
            newCount++;
            if (sampleChanges.length < 8) {
              sampleChanges.push({
                id: sap || accId,
                name: desc,
                newPrice: newAcc.Harga_Promo,
              });
            }
          }
        });

        const finalAcc = Array.from(updatedMap.values());
        setPendingPayload(finalAcc);
        setPreviewSummary({
          matchedCount,
          newCount,
          totalParsed: rows.length,
          sampleChanges,
        });
      } else if (selectedType === "PROMO_CC") {
        const parsedBanks: BankPromo[] = rows
          .filter((r) => r["Nama_Bank"] || r["Bank_ID"])
          .map((r, i) => ({
            Bank_ID: String(r["Bank_ID"] || `BNK-${i + 1}`),
            Nama_Bank: String(r["Nama_Bank"] || "Bank Partner"),
            Tenor_Tersedia: String(r["Tenor_Tersedia"] || "3,6,12,24")
              .split(",")
              .map((n) => Number(n.trim()))
              .filter((n) => n > 0),
            Bunga_Pct: cleanNum(r["Bunga_Pct"]),
            Min_Transaksi: cleanNum(r["Min_Transaksi"]) || 3000000,
            Catatan_Promo: String(r["Catatan_Promo"] || "Cicilan 0%"),
          }));
        setPendingPayload(parsedBanks);
        setPreviewSummary({
          matchedCount: parsedBanks.length,
          newCount: 0,
          totalParsed: rows.length,
          sampleChanges: parsedBanks.slice(0, 6).map((b) => ({
            id: b.Bank_ID,
            name: `${b.Nama_Bank} (${b.Catatan_Promo})`,
            newPrice: b.Min_Transaksi,
          })),
        });
      } else if (selectedType === "BNPL") {
        const parsedBnpl: BnplProvider[] = rows
          .filter((r) => r["Nama_Provider"] || r["BNPL_ID"])
          .map((r, i) => ({
            BNPL_ID: String(r["BNPL_ID"] || `BNPL-${i + 1}`),
            Nama_Provider: String(r["Nama_Provider"] || "PayLater"),
            Tenor_Tersedia: String(r["Tenor_Tersedia"] || "3,6,12")
              .split(",")
              .map((n) => Number(n.trim()))
              .filter((n) => n > 0),
            Bunga_Bulanan_Pct: cleanNum(r["Bunga_Bulanan_Pct"]),
            Biaya_Admin: cleanNum(r["Biaya_Admin"]),
            Min_DP_Pct: cleanNum(r["Min_DP_Pct"]),
          }));
        setPendingPayload(parsedBnpl);
        setPreviewSummary({
          matchedCount: parsedBnpl.length,
          newCount: 0,
          totalParsed: rows.length,
          sampleChanges: parsedBnpl.slice(0, 6).map((p) => ({
            id: p.BNPL_ID,
            name: `${p.Nama_Provider} (${p.Bunga_Bulanan_Pct}%/bln)`,
            newPrice: p.Biaya_Admin,
          })),
        });
      } else if (selectedType === "TRADE_IN") {
        const parsedTi: TradeInDevice[] = rows
          .filter((r) => r["Tipe_Device_Lama"] || r["TradeIn_ID"])
          .map((r, i) => ({
            TradeIn_ID: String(r["TradeIn_ID"] || `TI-${i + 1}`),
            Tipe_Device_Lama: String(r["Tipe_Device_Lama"] || "iPhone Trade-In"),
            Harga_Grade_A: cleanNum(r["Harga_Grade_A"]),
            Bonus_TopUp: cleanNum(r["Bonus_TopUp"]),
          }));
        setPendingPayload(parsedTi);
        setPreviewSummary({
          matchedCount: parsedTi.length,
          newCount: 0,
          totalParsed: rows.length,
          sampleChanges: parsedTi.slice(0, 6).map((t) => ({
            id: t.TradeIn_ID,
            name: t.Tipe_Device_Lama,
            newPrice: t.Harga_Grade_A + t.Bonus_TopUp,
          })),
        });
      } else if (selectedType === "QOALA") {
        const parsedQoala: any[] = rows
          .filter((r) => r["Nama_Paket"] || r["Tier_ID"])
          .map((r, i) => ({
            Tier_ID: String(r["Tier_ID"] || `QOA-${i + 1}`),
            Nama_Paket: String(r["Nama_Paket"] || `Tier ${i + 1}`),
            Min_Harga: cleanNum(r["Min_Harga"]),
            Max_Harga: cleanNum(r["Max_Harga"]),
            Premi_12_Bln: cleanNum(r["Premi_12_Bln"]),
            Premi_24_Bln: cleanNum(r["Premi_24_Bln"]),
            SKU_12_Bln: String(r["SKU_12_Bln"] || `QOA-12M-${i + 1}`),
            SKU_24_Bln: String(r["SKU_24_Bln"] || `QOA-24M-${i + 1}`),
            Cakupan: String(
              r["Cakupan"] || "Layar pecah, kerusakan cairan, pencurian dengan kekerasan"
            ),
          }));
        setPendingPayload(parsedQoala);
        setPreviewSummary({
          matchedCount: parsedQoala.length,
          newCount: 0,
          totalParsed: rows.length,
          sampleChanges: parsedQoala.slice(0, 6).map((q) => ({
            id: q.Tier_ID,
            name: q.Nama_Paket,
            newPrice: q.Premi_12_Bln,
          })),
        });
      }
    } catch (err) {
      setErrorMsg(`Gagal membaca file: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleApply = () => {
    if (!pendingPayload) return;
    if (selectedType === "DEVICES") onApplyDevices(pendingPayload as MasterDevice[]);
    else if (selectedType === "ACCESSORIES") onApplyAccessories(pendingPayload as AccessoryItem[]);
    else if (selectedType === "PROMO_CC") onApplyBankPromos(pendingPayload as BankPromo[]);
    else if (selectedType === "BNPL") onApplyBnpl(pendingPayload as BnplProvider[]);
    else if (selectedType === "TRADE_IN") onApplyTradeIn(pendingPayload as TradeInDevice[]);
    else if (selectedType === "QOALA") onApplyQoala(pendingPayload as QoalaTier[]);

    setPendingPayload(null);
    setPreviewSummary(null);
    setFileName("");
    onClose();
  };

  const handleDownloadTemplate = () => {
    const meta = DATASET_META[selectedType];
    let dataRows: Record<string, unknown>[] = [];
    if (selectedType === "DEVICES") dataRows = devices as unknown as Record<string, unknown>[];
    else if (selectedType === "ACCESSORIES") dataRows = accessories as unknown as Record<string, unknown>[];
    else if (selectedType === "PROMO_CC") dataRows = bankPromos as unknown as Record<string, unknown>[];
    else if (selectedType === "BNPL") dataRows = bnplProviders as unknown as Record<string, unknown>[];
    else if (selectedType === "TRADE_IN") dataRows = tradeInDevices as unknown as Record<string, unknown>[];
    else if (selectedType === "QOALA") dataRows = qoalaTiers as unknown as Record<string, unknown>[];

    const ws = XLSX.utils.json_to_sheet(dataRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedType);
    XLSX.writeFile(wb, `ASCG_Master_${selectedType}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    void meta;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Excel & CSV Master Data Sync Hub</h2>
              <p className="text-xs text-slate-300">
                Upload pembaruan harga Device, Accessories, Promo Bank, BNPL, Trade-In, atau Qoala tanpa input manual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Dataset Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              1. Pilih Modul Master Data yang Ingin Diperbarui
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(DATASET_META) as UploadDatasetType[]).map((key) => {
                const active = selectedType === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedType(key);
                      setPreviewSummary(null);
                      setPendingPayload(null);
                      setErrorMsg("");
                      setFileName("");
                    }}
                    className={`px-3 py-2.5 rounded-xl border text-left transition text-xs font-semibold flex items-center gap-2 ${
                      active
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{key.replace("_", " ")}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info & Template Download */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {DATASET_META[selectedType].label}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {DATASET_META[selectedType].desc}
                </p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export Excel Saat Ini
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Kolom Kunci:</span>{" "}
              {DATASET_META[selectedType].acceptedCols}
            </p>
          </div>

          {/* Dropzone / Upload Box */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              2. Upload File Excel (.xlsx / .xls) atau CSV (.csv)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/60 hover:bg-blue-50/40 transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {fileName ? fileName : "Klik untuk memilih file Excel / CSV dari komputer"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Mendukung format resmi Pricelist Digimap maupun template Master Database ASCG
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {previewSummary && (
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>File Berhasil Diparsing ({previewSummary.totalParsed} baris terbaca)</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {previewSummary.matchedCount} SKU cocok • {previewSummary.newCount} baru
                </span>
              </div>

              {previewSummary.sampleChanges.length > 0 && (
                <div className="bg-white rounded-lg border border-emerald-100 divide-y divide-slate-100 text-xs">
                  {previewSummary.sampleChanges.map((chg, idx) => (
                    <div key={idx} className="px-3 py-2 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="font-mono text-[11px] text-slate-400 mr-2">{chg.id}</span>
                        <span className="font-semibold text-slate-800">{chg.name}</span>
                      </div>
                      <div className="shrink-0 font-semibold text-emerald-700">
                        {chg.oldPrice !== undefined && (
                          <span className="line-through text-slate-400 mr-2">
                            {formatRupiah(chg.oldPrice)}
                          </span>
                        )}
                        {formatRupiah(chg.newPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onResetAllToDefault();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset ke Data Bawaan
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              disabled={!pendingPayload}
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 disabled:bg-slate-300 text-white text-xs font-bold hover:bg-blue-700 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Terapkan ke Master Database App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
