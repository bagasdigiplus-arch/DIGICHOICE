"use client";

import React, { useMemo, useState } from "react";
import { PricelistAccessoryRow, PricelistDeviceRow } from "@/types/ascg";
import { formatRupiah } from "@/utils/formatters";
import {
  FileSpreadsheet,
  Search,
  Copy,
  Check,
  Smartphone,
  Sparkles,
  Tag,
  PlusCircle,
} from "lucide-react";

interface MasterPricelistViewProps {
  devices: PricelistDeviceRow[];
  accessories: PricelistAccessoryRow[];
  onAddManualItem?: (name: string, sku: string, price: number) => void;
}

export default function MasterPricelistView({
  devices,
  accessories,
  onAddManualItem,
}: MasterPricelistViewProps) {
  const [subTab, setSubTab] = useState<"device" | "accessory">("device");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [brandFilter, setBrandFilter] = useState("ALL");
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [addedSku, setAddedSku] = useState<string | null>(null);

  const handleCopy = (sku: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(sku).catch(() => {});
    }
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 1500);
  };

  const handleAdd = (name: string, sku: string, price: number) => {
    if (!onAddManualItem) return;
    onAddManualItem(name, sku, price);
    setAddedSku(sku);
    setTimeout(() => setAddedSku(null), 1200);
  };

  const deviceCategories = useMemo(() => {
    const s = new Set(devices.map((d) => d.Category));
    return ["ALL", ...Array.from(s)];
  }, [devices]);

  const accBrands = useMemo(() => {
    const s = new Set(accessories.map((a) => a.Brand));
    return ["ALL", ...Array.from(s)];
  }, [accessories]);

  const filteredDevices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return devices.filter((d) => {
      const matchCat = catFilter === "ALL" || d.Category === catFilter;
      const matchQ =
        !q ||
        d.SAP_Article.toLowerCase().includes(q) ||
        d.SAP_Description.toLowerCase().includes(q) ||
        d.Seri_Group.toLowerCase().includes(q) ||
        d.Remarks.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [devices, catFilter, search]);

  const filteredAccessories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accessories.filter((a) => {
      const matchBrand = brandFilter === "ALL" || a.Brand === brandFilter;
      const matchQ =
        !q ||
        a.SAP_Article.toLowerCase().includes(q) ||
        a.SAP_Description.toLowerCase().includes(q) ||
        a.Brand.toLowerCase().includes(q) ||
        a.Category.toLowerCase().includes(q);
      return matchBrand && matchQ;
    });
  }, [accessories, brandFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Official Pricelist Digimap • 23 November 2026 – Further Notice
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Master Pricelist Device &amp; Aksesoris (SAP Lookup)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Pencarian instan kode <strong>SAP Article</strong>, SRP Normal, dan
            Harga Promo / Repricing Cash untuk input kasir ETP.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-200/70 dark:bg-slate-900/80 p-1.5 rounded-xl border border-slate-300/60 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setSubTab("device");
              setSearch("");
            }}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition ${
              subTab === "device"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Smartphone className="w-4 h-4 text-blue-500" />
            Apple Device ({devices.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setSubTab("accessory");
              setSearch("");
            }}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition ${
              subTab === "accessory"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Accessories ({accessories.length})
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              subTab === "device"
                ? "Cari SAP Article (APPM...), iPhone 18, MacBook Neo, iPad, Watch, AirPods..."
                : "Cari SAP Article, Mutural, Zagg, PanzerGlass, UNIQ, UAG, Apple..."
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {subTab === "device" ? (
          <div className="flex flex-wrap gap-1.5">
            {deviceCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCatFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  catFilter === cat
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400"
                }`}
              >
                {cat === "ALL" ? "Semua LOB" : cat}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {accBrands.slice(0, 8).map((br) => (
              <button
                key={br}
                type="button"
                onClick={() => setBrandFilter(br)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  brandFilter === br
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-400"
                }`}
              >
                {br === "ALL" ? "Semua Brand" : br}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table Output */}
      {subTab === "device" ? (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">SAP Article</th>
                  <th className="py-3 px-4">LOB / Seri</th>
                  <th className="py-3 px-4">SAP Description</th>
                  <th className="py-3 px-4 text-right">Normal Price</th>
                  <th className="py-3 px-4 text-right">Promo / Cash Price</th>
                  <th className="py-3 px-4">Remarks / Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                {filteredDevices.map((item, idx) => {
                  const hasPromo = item.Promotion_Price < item.Normal_Price;
                  return (
                    <tr
                      key={`${item.SAP_Article}-${idx}`}
                      className="hover:bg-blue-500/5 transition"
                    >
                      <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleCopy(item.SAP_Article)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-500/15 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
                          title="Salin SAP Article"
                        >
                          {item.SAP_Article}
                          {copiedSku === item.SAP_Article ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.Category}
                        </span>
                        <div className="text-[11px] text-slate-500">
                          {item.Seri_Group}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {item.SAP_Description}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap text-slate-500">
                        {hasPromo ? (
                          <span className="line-through">
                            {formatRupiah(item.Normal_Price)}
                          </span>
                        ) : (
                          formatRupiah(item.Normal_Price)
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-900 dark:text-white">
                        {formatRupiah(item.Promotion_Price)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                item.Status === "EOL"
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                  : hasPromo
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  : "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                              }`}
                            >
                              {item.Status}
                            </span>
                            {item.Remarks && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {item.Remarks}
                              </span>
                            )}
                          </div>
                          {onAddManualItem && (
                            <button
                              type="button"
                              onClick={() =>
                                handleAdd(
                                  item.SAP_Description,
                                  item.SAP_Article,
                                  item.Promotion_Price
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600/10 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white transition"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              {addedSku === item.SAP_Article
                                ? "Masuk Keranjang"
                                : "Simulasi"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredDevices.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-slate-500"
                    >
                      Tidak ada item device yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">SAP Article</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">SAP Description</th>
                  <th className="py-3 px-4 text-right">Reference SRP</th>
                  <th className="py-3 px-4 text-right">Current Cash SRP</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                {filteredAccessories.map((acc, idx) => {
                  const isRepriced = acc.Current_SRP_Cash < acc.Reference_SRP;
                  return (
                    <tr
                      key={`${acc.SAP_Article}-${idx}`}
                      className="hover:bg-amber-500/5 transition"
                    >
                      <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleCopy(acc.SAP_Article)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/15 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
                        >
                          {acc.SAP_Article}
                          {copiedSku === acc.SAP_Article ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {acc.Brand}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800 text-xs">
                          <Tag className="w-3 h-3" />
                          {acc.Category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {acc.SAP_Description}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap text-slate-500">
                        {isRepriced ? (
                          <span className="line-through">
                            {formatRupiah(acc.Reference_SRP)}
                          </span>
                        ) : (
                          formatRupiah(acc.Reference_SRP)
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-900 dark:text-white">
                        {formatRupiah(acc.Current_SRP_Cash)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {onAddManualItem && (
                          <button
                            type="button"
                            onClick={() =>
                              handleAdd(
                                `${acc.Brand} - ${acc.SAP_Description}`,
                                acc.SAP_Article,
                                acc.Current_SRP_Cash
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-600/10 hover:bg-amber-600 text-amber-700 dark:text-amber-300 hover:text-white transition"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            {addedSku === acc.SAP_Article
                              ? "Masuk Keranjang"
                              : "+ ETP"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredAccessories.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-slate-500"
                    >
                      Tidak ada aksesoris yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
