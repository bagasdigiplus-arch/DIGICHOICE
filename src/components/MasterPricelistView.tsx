"use client";

import React, { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Search,
  Shield,
  ShoppingCart,
  Tag,
} from "lucide-react";
import { LOB_APPLE_DEVICES } from "../data/lobDevices";

interface MasterPricelistViewProps {
  customDevices?: any[];
  customAccessories?: any[];
  customQoala?: any[];
  onAddToCart?: (item: {
    sku: string;
    name: string;
    category: string;
    price: number;
    qty: number;
  }) => void;
}

interface PricelistRow {
  id: string;
  sku: string;
  category: "Device" | "Accessory" | "Qoala Protection";
  subCategory: string;
  name: string;
  srp: number;
  promoPrice?: number;
  badge?: string;
}

const DEFAULT_ACCESSORIES: PricelistRow[] = [
  {
    id: "acc-1",
    sku: "MG234ZA/A",
    category: "Accessory",
    subCategory: "Casing Tier 5",
    name: "iPhone Clear Case with MagSafe (Original)",
    srp: 899000,
    badge: "BEST SELLER",
  },
  {
    id: "acc-2",
    sku: "MG294ZA/A",
    category: "Accessory",
    subCategory: "Casing Tier 5",
    name: "iPhone Silicone Case with MagSafe (Original)",
    srp: 899000,
    badge: "BEST SELLER",
  },
  {
    id: "acc-3",
    sku: "TP-CASE-T2",
    category: "Accessory",
    subCategory: "Casing Tier 2",
    name: "Third-Party Shockproof Clear MagSafe Case",
    srp: 499000,
    promoPrice: 449000,
    badge: "VALUE PICK",
  },
  {
    id: "acc-4",
    sku: "MHJE3ZA/A",
    category: "Accessory",
    subCategory: "Power & Cable",
    name: "Apple 20W USB-C Power Adapter",
    srp: 449000,
    badge: "BEST SELLER",
  },
  {
    id: "acc-5",
    sku: "MY1W2ZA/A",
    category: "Accessory",
    subCategory: "Power & Cable",
    name: "Apple 30W USB-C Power Adapter",
    srp: 649000,
  },
  {
    id: "acc-6",
    sku: "TG-SAPPHIRE-PRO",
    category: "Accessory",
    subCategory: "Screen & Lens",
    name: "Premium Anti-Reflective Tempered Glass + Lens Ring",
    srp: 449000,
  },
  {
    id: "acc-7",
    sku: "MX2D3ZA/A",
    category: "Accessory",
    subCategory: "iPad Accessory",
    name: "Apple Pencil Pro",
    srp: 2299000,
  },
  {
    id: "acc-8",
    sku: "MXP93ZA/A",
    category: "Accessory",
    subCategory: "Audio",
    name: "AirPods 4 with Active Noise Cancellation",
    srp: 2999000,
    badge: "BEST SELLER",
  },
];

const DEFAULT_QOALA: PricelistRow[] = [
  {
    id: "qoala-1",
    sku: "QOA-12M-T1",
    category: "Qoala Protection",
    subCategory: "12 Bulan",
    name: "Proteksi Qoala 12 Bulan (Harga Perangkat Rp 5 Jt – Rp 12 Jt)",
    srp: 799000,
  },
  {
    id: "qoala-2",
    sku: "QOA-12M-T2",
    category: "Qoala Protection",
    subCategory: "12 Bulan",
    name: "Proteksi Qoala 12 Bulan (Harga Perangkat > Rp 12 Jt – Rp 20 Jt)",
    srp: 1099000,
    badge: "POPULAR",
  },
  {
    id: "qoala-3",
    sku: "QOA-12M-T3",
    category: "Qoala Protection",
    subCategory: "12 Bulan",
    name: "Proteksi Qoala 12 Bulan (Harga Perangkat > Rp 20 Jt)",
    srp: 1399000,
  },
  {
    id: "qoala-4",
    sku: "QOA-24M-T2",
    category: "Qoala Protection",
    subCategory: "24 Bulan",
    name: "Proteksi Qoala 24 Bulan (Harga Perangkat > Rp 12 Jt – Rp 20 Jt)",
    srp: 1599000,
  },
  {
    id: "qoala-5",
    sku: "QOA-24M-T3",
    category: "Qoala Protection",
    subCategory: "24 Bulan",
    name: "Proteksi Qoala 24 Bulan (Harga Perangkat > Rp 20 Jt)",
    srp: 1999000,
    badge: "RECOMMENDED PRO",
  },
];

const formatIDR = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

export default function MasterPricelistView({
  customDevices = [],
  customAccessories = [],
  customQoala = [],
  onAddToCart,
}: MasterPricelistViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | "Device" | "Accessory" | "Qoala Protection"
  >("ALL");
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  const masterRows: PricelistRow[] = useMemo(() => {
    // 1. Devices
    const deviceRows: PricelistRow[] =
      customDevices.length > 0
        ? customDevices.map((d: any, i: number) => ({
            id: `cdev-${i}`,
            sku: d.SKU || d.sku || `DEV-${i + 1}`,
            category: "Device",
            subCategory: d.LOB || d.lob || "Apple Device",
            name: `${d.Model || d.model || "Device"} ${d.Storage || d.Variant || ""}`.trim(),
            srp: Number(d.SRP || d.Price || d.price || 0),
            promoPrice: Number(d.Promo || d.Promo_Price || 0) || undefined,
            badge: d.Promo ? "PROMO" : undefined,
          }))
        : LOB_APPLE_DEVICES.filter((d) => d.isActive).map((d) => ({
            id: d.id,
            sku: d.sku,
            category: "Device",
            subCategory: d.lob,
            name: `${d.model} (${d.variant})`,
            srp: d.price,
            promoPrice: d.promoPrice,
            badge: d.promoPrice ? "PROMO" : undefined,
          }));

    // 2. Accessories
    const accRows: PricelistRow[] =
      customAccessories.length > 0
        ? customAccessories.map((a: any, i: number) => ({
            id: `cacc-${i}`,
            sku: a.SKU || a.sku || `ACC-${i + 1}`,
            category: "Accessory",
            subCategory: a.Tier || a.Category || "Accessory",
            name: a.Nama_Produk || a.Name || a.name || `Accessory ${i + 1}`,
            srp: Number(a.SRP || a.Price || a.price || 0),
            promoPrice: Number(a.Promo || 0) || undefined,
            badge: a.Badge || undefined,
          }))
        : DEFAULT_ACCESSORIES;

    // 3. Qoala
    const qoalaRows: PricelistRow[] =
      customQoala.length > 0
        ? customQoala.map((q: any, i: number) => ({
            id: `cqoa-${i}`,
            sku: q.SKU_ETP || q.Tier_ID || `QOA-${i + 1}`,
            category: "Qoala Protection",
            subCategory: q.Durasi || "12 / 24 Bulan",
            name: q.Nama_Paket || `Paket Proteksi Qoala ${i + 1}`,
            srp: Number(q.Premi || q.Price || 0),
          }))
        : DEFAULT_QOALA;

    return [...deviceRows, ...accRows, ...qoalaRows];
  }, [customDevices, customAccessories, customQoala]);

  const filteredRows = useMemo(() => {
    return masterRows.filter((row) => {
      const matchCategory =
        categoryFilter === "ALL" || row.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.sku.toLowerCase().includes(q) ||
        row.subCategory.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [masterRows, categoryFilter, searchQuery]);

  const handleCopySku = (sku: string) => {
    navigator.clipboard?.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 1800);
  };

  return (
    <div className="space-y-5">
      {/* Search & Category Filter Header */}
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama produk, kapasitas, tipe casing, Qoala, atau Kode SKU ETP..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "ALL", label: "Semua Item" },
              { key: "Device", label: "Perangkat Apple" },
              { key: "Accessory", label: "Aksesoris & Casing" },
              { key: "Qoala Protection", label: "Proteksi Qoala" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategoryFilter(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                categoryFilter === tab.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pricelist Table */}
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Menampilkan <strong className="text-zinc-900 dark:text-white">{filteredRows.length}</strong> item terdaftar
          </span>
          <span>Klik kode SKU untuk langsung menyalin ke Kasir ETP</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/70 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-5 py-3.5">Kode SKU ETP</th>
                <th className="px-5 py-3.5">Kategori</th>
                <th className="px-5 py-3.5">Nama Item</th>
                <th className="px-5 py-3.5 text-right">Harga SRP</th>
                <th className="px-5 py-3.5 text-right">Harga Promo / Net</th>
                {onAddToCart && <th className="px-5 py-3.5 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredRows.map((row) => {
                const effectivePrice = row.promoPrice || row.srp;
                const isCopied = copiedSku === row.sku;

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* 1-Click Copy SKU */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <button
                        onClick={() => handleCopySku(row.sku)}
                        title="Klik untuk salin SKU ETP"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-semibold border transition ${
                          isCopied
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                            : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-blue-500"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Tersalin!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-zinc-400" />
                            {row.sku}
                          </>
                        )}
                      </button>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {row.category === "Qoala Protection" ? (
                          <Shield className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Tag className="w-3 h-3 text-blue-500" />
                        )}
                        {row.subCategory}
                      </span>
                    </td>

                    {/* Item Name */}
                    <td className="px-5 py-3.5 font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{row.name}</span>
                        {row.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            {row.badge}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* SRP */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap text-zinc-500">
                      {row.promoPrice ? (
                        <span className="line-through text-xs">{formatIDR(row.srp)}</span>
                      ) : (
                        formatIDR(row.srp)
                      )}
                    </td>

                    {/* Net / Promo Price */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap font-bold text-zinc-900 dark:text-white">
                      {formatIDR(effectivePrice)}
                    </td>

                    {/* Add to Cart */}
                    {onAddToCart && (
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() =>
                            onAddToCart({
                              sku: row.sku,
                              name: row.name,
                              category: row.category,
                              price: effectivePrice,
                              qty: 1,
                            })
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Cart
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
