"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  GitCompare,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";

interface AccessoriesCatalogViewProps {
  accessories?: any[];
  qoalaTiers?: any[];
  onAddAccToCart: (acc: any) => void;
  onAddQoalaToCart: (tier: any, duration: 12 | 24) => void;
}

const formatIDR = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);

export default function AccessoriesCatalogView({
  accessories = [],
  qoalaTiers = [],
  onAddAccToCart,
  onAddQoalaToCart,
}: AccessoriesCatalogViewProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [onlyBestSeller, setOnlyBestSeller] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [devicePriceHelper, setDevicePriceHelper] = useState<number>(16999000);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  // Ekstrak daftar kategori dinamis dari data aksesoris
  const categories = useMemo(() => {
    const set = new Set<string>();
    accessories.forEach((a: any) => {
      const cat = a.Kategori || a.Category || a.Segmen_Casing || "Lainnya";
      if (cat) set.add(String(cat));
    });
    return ["ALL", ...Array.from(set)];
  }, [accessories]);

  const filteredAcc = useMemo(() => {
    return accessories.filter((a: any) => {
      const cat = String(a.Kategori || a.Category || a.Segmen_Casing || "Lainnya");
      const name = String(a.Nama_Produk || a.Name || "");
      const brand = String(a.Merek || a.Brand || "");
      const sku = String(a.SAP_Article || a.SKU || "");
      const isBest = String(a.Label_Best_Seller || "").toUpperCase() === "BEST SELLER";

      if (selectedCategory !== "ALL" && cat !== selectedCategory) return false;
      if (onlyBestSeller && !isBest) return false;

      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        name.toLowerCase().includes(q) ||
        brand.toLowerCase().includes(q) ||
        sku.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q)
      );
    });
  }, [accessories, selectedCategory, onlyBestSeller, search]);

  const comparedItems = useMemo(() => {
    return accessories.filter((a: any) =>
      compareIds.includes(String(a.Acc_ID || a.SAP_Article))
    );
  }, [accessories, compareIds]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  // Deteksi otomatis tier Qoala yang cocok berdasarkan input harga perangkat
  const recommendedTierId = useMemo(() => {
    const match = qoalaTiers.find((t: any) => {
      const min = Number(t.Min_Harga ?? t.Harga_Min ?? 0);
      const max = Number(t.Max_Harga ?? t.Harga_Max ?? 999999999);
      return devicePriceHelper >= min && devicePriceHelper <= max;
    });
    return match ? String(match.Tier_ID || match.Kode_Tier) : null;
  }, [qoalaTiers, devicePriceHelper]);

  return (
    <div className="space-y-8">
      {/* Floating Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg">
          <CheckCircle2 className="w-4 h-4" />
          {toastMsg}
        </div>
      )}

      {/* SECTION 1: E-CATALOG AKSESORIS & HEAD-TO-HEAD COMPARISON */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">
              E-Catalog Aksesoris &amp; Perbandingan Head-to-Head
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih hingga 3 aksesoris untuk dibandingkan fiturnya di depan customer
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[230px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari casing, merek, SAP..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setOnlyBestSeller((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                onlyBestSeller
                  ? "bg-amber-500 text-slate-950 border-amber-500"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              BEST SELLER
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-500"
              }`}
            >
              {cat === "ALL" ? "Semua Kategori" : cat}
            </button>
          ))}
        </div>

        {/* Head-to-Head Comparison Drawer */}
        {comparedItems.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 dark:from-slate-900 dark:to-blue-950/30 border border-blue-200 dark:border-blue-800/70 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold">
                  Perbandingan Head-to-Head ({comparedItems.length}/3 Item)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCompareIds([])}
                className="text-xs font-semibold text-slate-500 hover:text-red-500"
              >
                Reset Pilihan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparedItems.map((item: any) => {
                const id = String(item.Acc_ID || item.SAP_Article);
                return (
                  <div
                    key={id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between relative"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCompare(id)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-500"
                      title="Hapus dari perbandingan"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="space-y-2 pr-5">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {item.Merek || "Brand"} • {item.Segmen_Casing || item.Kategori || "Accessory"}
                      </span>
                      <h4 className="text-sm font-bold">{item.Nama_Produk}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.Keunggulan ||
                          item.Deskripsi ||
                          "Perlindungan presisi, material tahan benturan, dan kompatibel penuh dengan perangkat Apple."}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {item.SAP_Article}
                        </div>
                        <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                          {formatIDR(Number(item.Harga_Promo || item.Harga_SRP || 0))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onAddAccToCart(item);
                          triggerToast(`${item.Nama_Produk} masuk ke Keranjang ETP`);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
                      >
                        + Cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Accessory Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAcc.map((acc: any, idx: number) => {
            const id = String(acc.Acc_ID || acc.SAP_Article || idx);
            const isBestSeller =
              String(acc.Label_Best_Seller || "").toUpperCase() === "BEST SELLER";
            const isCompared = compareIds.includes(id);
            const srp = Number(acc.Harga_SRP || acc.Harga_Promo || 0);
            const promo = Number(acc.Harga_Promo || srp);

            return (
              <div
                key={id}
                className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/60 transition shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {acc.Merek || "Apple / Partner"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isBestSeller && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          <Sparkles className="w-2.5 h-2.5" />
                          BEST SELLER
                        </span>
                      )}
                      {acc.Segmen_Casing && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {acc.Segmen_Casing}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold leading-snug mb-1.5">
                    {acc.Nama_Produk}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {acc.Keunggulan ||
                      acc.Deskripsi ||
                      "Aksesoris resmi dengan kualitas teruji untuk proteksi & kenyamanan harian."}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-slate-400">
                        SAP: {acc.SAP_Article}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-extrabold">
                          {formatIDR(promo)}
                        </span>
                        {srp > promo && (
                          <span className="text-xs line-through text-slate-400">
                            {formatIDR(srp)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCompare(id)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                        isCompared
                          ? "bg-blue-600/15 border-blue-500 text-blue-600 dark:text-blue-400"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500"
                      }`}
                    >
                      {isCompared ? "✓ Dibandingkan" : "Bandingkan"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onAddAccToCart(acc);
                        triggerToast(`${acc.Nama_Produk} ditambahkan ke Cart`);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Keranjang
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: PROTEKSI QOALA (100% COVERAGE MATRIX — 12 & 24 BULAN) */}
      <section className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold">
                  Tarif Resmi Proteksi Qoala (100% Attach Target)
                </h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  12 &amp; 24 Bulan
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Perlindungan kerusakan tidak terduga (layar pecah, terkena cairan, &amp; komponen internal).
              </p>
            </div>
          </div>

          {/* Quick Device Price Tier Finder */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
              Cek Tier Harga Unit:
            </span>
            <input
              type="number"
              step={500000}
              value={devicePriceHelper}
              onChange={(e) => setDevicePriceHelper(Number(e.target.value))}
              className="w-36 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Kode Tier</th>
                <th className="px-4 py-3">Rentang Harga Perangkat</th>
                <th className="px-4 py-3 text-right">Premi 12 Bulan</th>
                <th className="px-4 py-3 text-right">Premi 24 Bulan</th>
                <th className="px-4 py-3 text-center">Tambah ke Cart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {qoalaTiers.map((tier: any, idx: number) => {
                const tierKey = String(tier.Tier_ID || tier.Kode_Tier || idx);
                const isRecommended = recommendedTierId === tierKey;
                const minHarga = Number(tier.Min_Harga ?? tier.Harga_Min ?? 0);
                const maxHarga = Number(tier.Max_Harga ?? tier.Harga_Max ?? 0);

                return (
                  <tr
                    key={tierKey}
                    className={
                      isRecommended
                        ? "bg-emerald-500/10 dark:bg-emerald-500/15"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }
                  >
                    <td className="px-4 py-3.5 font-bold whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{tier.Kode_Tier || `Tier ${idx + 1}`}</span>
                        {isRecommended && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                            COCOK
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {tier.Rentang_Harga ||
                        `${formatIDR(minHarga)} – ${
                          maxHarga >= 90000000 ? "Ke Atas" : formatIDR(maxHarga)
                        }`}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="font-bold">
                        {formatIDR(Number(tier.Premi_12_Bln || 0))}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {tier.SKU_12_Bln}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatIDR(Number(tier.Premi_24_Bln || 0))}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {tier.SKU_24_Bln}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onAddQoalaToCart(tier, 12);
                            triggerToast(
                              `Qoala ${tier.Kode_Tier} (12 Bln) masuk ke Cart`
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-blue-600 hover:text-white transition"
                        >
                          + 12 Bln
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onAddQoalaToCart(tier, 24);
                            triggerToast(
                              `Qoala ${tier.Kode_Tier} (24 Bln) masuk ke Cart`
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                        >
                          + 24 Bln
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
