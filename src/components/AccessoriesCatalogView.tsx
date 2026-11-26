"use client";

import React, { useState, useMemo } from "react";
import {
  Award,
  PlusCircle,
  CheckSquare,
  Square,
  SlidersHorizontal,
  LayoutGrid,
  Columns3,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { AccessoryItem, QoalaTier } from "@/types/ascg";
import { formatRupiah, calcMonthlyInstallment } from "@/utils/formatters";

interface AccessoriesCatalogViewProps {
  accessories: AccessoryItem[];
  qoalaTiers: QoalaTier[];
  onAddAccToCart: (acc: AccessoryItem) => void;
  onAddQoalaToCart: (tier: QoalaTier, duration: 12 | 24) => void;
}

export default function AccessoriesCatalogView({
  accessories,
  qoalaTiers,
  onAddAccToCart,
  onAddQoalaToCart,
}: AccessoriesCatalogViewProps) {
  const categories = [
    "Semua",
    "Casing",
    "Adapter & Kabel",
    "Screen & Lens Protector",
    "Audio / AirPods",
    "Proteksi Qoala",
  ] as const;

  const [selectedCat, setSelectedCat] = useState<string>("Semua");
  const [selectedTier, setSelectedTier] = useState<string>("Semua");
  const [selectedSegmen, setSelectedSegmen] = useState<string>("Semua");
  const [onlyBestSeller, setOnlyBestSeller] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"GRID" | "COMPARE">("GRID");
  const [compareIds, setCompareIds] = useState<string[]>(["ACC-CS-02", "ACC-CS-04", "ACC-CS-05"]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const filteredAccessories = useMemo(() => {
    if (selectedCat === "Proteksi Qoala") return [];
    return accessories.filter((item) => {
      if (selectedCat !== "Semua" && item.Kategori_Aksesoris !== selectedCat) return false;
      if (selectedTier !== "Semua" && item.Tier_Casing !== selectedTier) return false;
      if (
        selectedSegmen !== "Semua" &&
        item.Kompatibilitas_Segmen !== selectedSegmen &&
        item.Kompatibilitas_Segmen !== "Semua Segmen"
      ) {
        return false;
      }
      if (onlyBestSeller && item.Label_Best_Seller !== "BEST SELLER") return false;
      return true;
    });
  }, [accessories, selectedCat, selectedTier, selectedSegmen, onlyBestSeller]);

  const comparedItems = useMemo(
    () => accessories.filter((a) => compareIds.includes(a.Acc_ID)),
    [accessories, compareIds]
  );

  return (
    <div className="space-y-6">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Price List & E-Catalog Accessories + Qoala
          </h2>
          <p className="text-xs text-slate-500">
            Bandingkan keunggulan Casing Tier 1–6, Adapter, Tempered Glass, AirPods, dan Proteksi Qoala
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setViewMode("GRID")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              viewMode === "GRID"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Grid E-Catalog
          </button>
          <button
            onClick={() => setViewMode("COMPARE")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              viewMode === "COMPARE"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Columns3 className="h-3.5 w-3.5" />
            Compare Aksesoris ({compareIds.length})
          </button>
        </div>
      </div>

      {/* Category & Attribute Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold border transition ${
                selectedCat === cat
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {selectedCat !== "Proteksi Qoala" && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filter Detail:</span>
            </div>

            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700"
            >
              <option value="Semua">Semua Tier Casing</option>
              <option value="Tier 1">Tier 1 (Value)</option>
              <option value="Tier 2">Tier 2 (MagSafe Entry)</option>
              <option value="Tier 3">Tier 3 (Mid Hybrid)</option>
              <option value="Tier 4">Tier 4 (Pro Graphene)</option>
              <option value="Tier 5">Tier 5 (Apple Original)</option>
              <option value="Tier 6">Tier 6 (Designer Luxury)</option>
            </select>

            <select
              value={selectedSegmen}
              onChange={(e) => setSelectedSegmen(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700"
            >
              <option value="Semua">Semua Segmen Device</option>
              <option value="Base/Entry">Khusus Base/Entry (Tier 1–3)</option>
              <option value="Pro/Flagship">Khusus Pro/Flagship (Tier 4–6)</option>
            </select>

            <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 font-bold text-amber-800">
              <input
                type="checkbox"
                checked={onlyBestSeller}
                onChange={(e) => setOnlyBestSeller(e.target.checked)}
                className="accent-amber-500"
              />
              <span>Hanya BEST SELLER</span>
            </label>
          </div>
        )}
      </div>

      {/* VIEW MODE: GRID E-CATALOG */}
      {viewMode === "GRID" && selectedCat !== "Proteksi Qoala" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAccessories.map((acc) => {
            const isChecked = compareIds.includes(acc.Acc_ID);
            const cicilan24 = calcMonthlyInstallment(acc.Harga_Promo, 24);

            return (
              <div
                key={acc.Acc_ID}
                className="rounded-2xl bg-white border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                        {acc.Merek}
                      </span>
                      {acc.Tier_Casing !== "-" && (
                        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-800">
                          {acc.Tier_Casing}
                        </span>
                      )}
                    </div>
                    {acc.Label_Best_Seller === "BEST SELLER" && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-black text-slate-950 shadow-sm">
                        <Award className="h-3 w-3" /> BEST SELLER
                      </span>
                    )}
                  </div>

                  {/* Title & SKU */}
                  <div>
                    <p className="text-[11px] font-mono text-slate-400">
                      SKU: {acc.Acc_ID} • EAN: {acc.Barcode_EAN}
                    </p>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5 leading-snug">
                      {acc.Nama_Produk}
                    </h3>
                  </div>

                  {/* Value Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {acc.Tag_Value_Utama.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800"
                      >
                        <Tag className="h-2.5 w-2.5" /> {tag}
                      </span>
                    ))}
                  </div>

                  {/* Material & Compatibility */}
                  <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1 border border-slate-100">
                    <p className="text-slate-600">
                      <strong className="text-slate-800">Material:</strong> {acc.Material_Proteksi}
                    </p>
                    <p className="text-slate-600">
                      <strong className="text-slate-800">Cocok Untuk:</strong>{" "}
                      <span className="font-semibold text-blue-700">{acc.Kompatibilitas_Segmen}</span>
                    </p>
                  </div>
                </div>

                {/* Price & Action Footer */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                  <div>
                    {acc.Harga_Normal > acc.Harga_Promo && (
                      <p className="text-[11px] text-slate-400 line-through">
                        {formatRupiah(acc.Harga_Normal)}
                      </p>
                    )}
                    <p className="text-base font-black text-slate-900">
                      {formatRupiah(acc.Harga_Promo)}
                    </p>
                    <p className="text-[10px] font-semibold text-blue-600">
                      +{formatRupiah(cicilan24)}/bln (24x)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCompare(acc.Acc_ID)}
                      title="Bandingkan Aksesoris"
                      className={`rounded-lg border p-2 text-xs font-bold transition ${
                        isChecked
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      onClick={() => onAddAccToCart(acc)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PROTEKSI QOALA SECTION (Always shown when selectedCat === 'Semua' or 'Proteksi Qoala') */}
      {(selectedCat === "Semua" || selectedCat === "Proteksi Qoala") && viewMode === "GRID" && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-extrabold text-slate-900">
              Tarif Resmi Proteksi Qoala (12 Bulan & 24 Bulan)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {qoalaTiers.map((q) => (
              <div
                key={q.Tier_ID}
                className="rounded-2xl bg-white border border-emerald-200 p-4 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                    {q.Tier_ID}
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900 mt-1.5">{q.Nama_Paket}</h4>
                  <p className="text-xs text-slate-500 mt-1">{q.Cakupan}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">12 Bulan:</span>
                    <button
                      onClick={() => onAddQoalaToCart(q, 12)}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white"
                    >
                      + {formatRupiah(q.Premi_12_Bln)}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">24 Bulan:</span>
                    <button
                      onClick={() => onAddQoalaToCart(q, 24)}
                      className="rounded-lg bg-slate-900 hover:bg-blue-600 px-2.5 py-1 text-xs font-bold text-white"
                    >
                      + {formatRupiah(q.Premi_24_Bln)}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE: HEAD-TO-HEAD ACCESSORY COMPARISON */}
      {viewMode === "COMPARE" && (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold">
                Head-to-Head Comparison Accessories ({comparedItems.length} Produk Dipilih)
              </h3>
              <p className="text-xs text-slate-300">
                Centang hingga 3 produk di tab Grid E-Catalog untuk membandingkan detail spesifikasi
              </p>
            </div>
            <button
              onClick={() => setViewMode("GRID")}
              className="rounded-lg bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-bold"
            >
              + Ubah Pilihan
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="p-4 font-extrabold text-slate-600 w-44">Parameter</th>
                  {comparedItems.map((item) => (
                    <th key={item.Acc_ID} className="p-4 min-w-[230px]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">
                          {item.Merek}
                        </span>
                        {item.Label_Best_Seller === "BEST SELLER" && (
                          <span className="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-black text-slate-950">
                            BEST SELLER
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-extrabold text-slate-900">{item.Nama_Produk}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-slate-50">Tier & Segmen</td>
                  {comparedItems.map((item) => (
                    <td key={item.Acc_ID} className="p-4 font-semibold text-blue-700">
                      {item.Tier_Casing} • {item.Kompatibilitas_Segmen}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-slate-50">Harga Promo Cash</td>
                  {comparedItems.map((item) => (
                    <td key={item.Acc_ID} className="p-4 font-black text-base text-slate-900">
                      {formatRupiah(item.Harga_Promo)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-slate-50">Tambahan Cicilan 24x</td>
                  {comparedItems.map((item) => (
                    <td key={item.Acc_ID} className="p-4 font-bold text-emerald-700">
                      +{formatRupiah(calcMonthlyInstallment(item.Harga_Promo, 24))}/bulan
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-slate-50">Keunggulan Utama</td>
                  {comparedItems.map((item) => (
                    <td key={item.Acc_ID} className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {item.Tag_Value_Utama.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-slate-50">Material & Proteksi</td>
                  {comparedItems.map((item) => (
                    <td key={item.Acc_ID} className="p-4 text-slate-700">
                      {item.Material_Proteksi}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-slate-50">Aksi Cepat</td>
                  {comparedItems.map((item) => (
                    <td key={item.Acc_ID} className="p-4">
                      <button
                        onClick={() => onAddAccToCart(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> Tambah ke Cart
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
