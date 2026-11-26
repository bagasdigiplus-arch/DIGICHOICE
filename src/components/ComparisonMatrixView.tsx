"use client";

import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  Sparkles,
  Shield,
  ArrowRight,
  Smartphone,
  History,
  Award,
  PlusCircle,
  Layers,
} from "lucide-react";
import {
  ComparisonItem,
  LobDevice,
  AccessoryItem,
  QoalaTier,
  MasterDevice,
} from "@/types/ascg";
import { formatRupiah, calcMonthlyInstallment } from "@/utils/formatters";

interface ComparisonMatrixViewProps {
  comparisons: ComparisonItem[];
  devices: MasterDevice[];
  lobDevices: LobDevice[];
  accessories: AccessoryItem[];
  qoalaTiers: QoalaTier[];
  onSendBundleToCart: (items: {
    sku: string;
    name: string;
    category: "Device" | "Accessory" | "Qoala";
    price: number;
    brand?: string;
    bestSeller?: boolean;
    segmen?: "Base/Entry" | "Pro/Flagship" | "Ecosystem";
  }[]) => void;
}

export default function ComparisonMatrixView({
  comparisons,
  devices,
  lobDevices,
  accessories,
  qoalaTiers,
  onSendBundleToCart,
}: ComparisonMatrixViewProps) {
  const [subMode, setSubMode] = useState<"NEW_LINEUP" | "LOB_COMPARE">("NEW_LINEUP");

  // State for New Lineup Comparison
  const groups = useMemo(() => {
    const map = new Map<string, string>();
    comparisons.forEach((c) => {
      if (!map.has(c.Compare_Group_ID)) {
        map.set(c.Compare_Group_ID, c.Kategori_Komparasi || c.Compare_Group_ID);
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [comparisons]);

  const [selectedGroup, setSelectedGroup] = useState<string>(groups[0]?.id || "CMP-ENTRY");
  const filteredCards = useMemo(
    () => comparisons.filter((c) => c.Compare_Group_ID === selectedGroup),
    [comparisons, selectedGroup]
  );

  // Active target unit for Essential Bundle auto-recommendation
  const [focusedDeviceId, setFocusedDeviceId] = useState<string>("");
  const activeFocusItem = useMemo(() => {
    return (
      filteredCards.find((c) => c.Device_ID === focusedDeviceId) ||
      filteredCards[filteredCards.length - 1] ||
      comparisons[0]
    );
  }, [filteredCards, focusedDeviceId, comparisons]);

  // Essential Bundle interactive checkboxes
  const recommendedCasing = useMemo(() => {
    if (!activeFocusItem) return accessories[0];
    const isPro = activeFocusItem.Segmen_Target === "Pro/Flagship";
    if (isPro) {
      return (
        accessories.find((a) => a.Acc_ID === "ACC-CS-04") ||
        accessories.find((a) => a.Kategori_Aksesoris === "Casing")!
      );
    }
    return (
      accessories.find((a) => a.Acc_ID === "ACC-CS-02") ||
      accessories.find((a) => a.Kategori_Aksesoris === "Casing")!
    );
  }, [activeFocusItem, accessories]);

  const recommendedAdapter = useMemo(
    () => accessories.find((a) => a.Acc_ID === "ACC-AD-01") || accessories[0],
    [accessories]
  );

  const recommendedGlass = useMemo(
    () => accessories.find((a) => a.Acc_ID === "ACC-SP-01") || accessories[0],
    [accessories]
  );

  const matchedQoala = useMemo(() => {
    const price = activeFocusItem?.Harga_Promo_Cash || 15000000;
    return (
      qoalaTiers.find((q) => price >= q.Min_Harga && price <= q.Max_Harga) || qoalaTiers[1]
    );
  }, [activeFocusItem, qoalaTiers]);

  const [includeCasing, setIncludeCasing] = useState(true);
  const [includeAdapter, setIncludeAdapter] = useState(true);
  const [includeGlass, setIncludeGlass] = useState(true);
  const [includeQoala, setIncludeQoala] = useState(true);

  // State for LOB Comparison
  const lobCategories: LobDevice["Kategori_LOB"][] = [
    "LOB iPhone",
    "LOB iPad",
    "LOB MacBook",
    "LOB Apple Watch",
    "LOB AirPods",
  ];
  const [selectedLobCat, setSelectedLobCat] = useState<LobDevice["Kategori_LOB"]>("LOB iPhone");
  const filteredLobList = useMemo(
    () => lobDevices.filter((l) => l.Kategori_LOB === selectedLobCat),
    [lobDevices, selectedLobCat]
  );
  const [selectedLobId, setSelectedLobId] = useState<string>("");
  const currentLob = useMemo(
    () => filteredLobList.find((l) => l.LOB_ID === selectedLobId) || filteredLobList[0],
    [filteredLobList, selectedLobId]
  );

  const handleSendSelectedBundle = () => {
    if (!activeFocusItem) return;
    const bundleList: {
      sku: string;
      name: string;
      category: "Device" | "Accessory" | "Qoala";
      price: number;
      brand?: string;
      bestSeller?: boolean;
      segmen?: "Base/Entry" | "Pro/Flagship" | "Ecosystem";
    }[] = [
      {
        sku: activeFocusItem.Device_ID,
        name: activeFocusItem.Seri_Model_Varian,
        category: "Device",
        price: activeFocusItem.Harga_Promo_Cash,
        brand: "Apple",
        segmen: activeFocusItem.Segmen_Target,
      },
    ];

    if (includeCasing && recommendedCasing) {
      bundleList.push({
        sku: recommendedCasing.Acc_ID,
        name: recommendedCasing.Nama_Produk,
        category: "Accessory",
        price: recommendedCasing.Harga_Promo,
        brand: recommendedCasing.Merek,
        bestSeller: recommendedCasing.Label_Best_Seller === "BEST SELLER",
      });
    }
    if (includeGlass && recommendedGlass) {
      bundleList.push({
        sku: recommendedGlass.Acc_ID,
        name: recommendedGlass.Nama_Produk,
        category: "Accessory",
        price: recommendedGlass.Harga_Promo,
        brand: recommendedGlass.Merek,
        bestSeller: recommendedGlass.Label_Best_Seller === "BEST SELLER",
      });
    }
    if (includeAdapter && recommendedAdapter) {
      bundleList.push({
        sku: recommendedAdapter.Acc_ID,
        name: recommendedAdapter.Nama_Produk,
        category: "Accessory",
        price: recommendedAdapter.Harga_Promo,
        brand: recommendedAdapter.Merek,
        bestSeller: recommendedAdapter.Label_Best_Seller === "BEST SELLER",
      });
    }
    if (includeQoala && matchedQoala) {
      bundleList.push({
        sku: matchedQoala.SKU_12_Bln,
        name: `${matchedQoala.Nama_Paket} (12 Bulan)`,
        category: "Qoala",
        price: matchedQoala.Premi_12_Bln,
        brand: "Qoala",
      });
    }

    onSendBundleToCart(bundleList);
  };

  return (
    <div className="space-y-6">
      {/* Top Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Comparison Matrix & Smart Step-Up Guide
          </h2>
          <p className="text-xs text-slate-500">
            Bandingkan varian Apple baru di toko atau ukur lonjakan fitur dari perangkat lama (LOB) customer
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setSubMode("NEW_LINEUP")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              subMode === "NEW_LINEUP"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Bandingkan Varian Baru
          </button>
          <button
            onClick={() => setSubMode("LOB_COMPARE")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              subMode === "LOB_COMPARE"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Bandingkan Device Lama (LOB)
          </button>
        </div>
      </div>

      {/* MODE 1: NEW LINEUP COMPARISON MATRIX */}
      {subMode === "NEW_LINEUP" && (
        <>
          {/* Group Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setSelectedGroup(g.id);
                  setFocusedDeviceId("");
                }}
                className={`rounded-xl px-4 py-2 text-xs font-bold border transition ${
                  selectedGroup === g.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCards.map((item) => {
              const isSelectedForBundle = activeFocusItem?.Device_ID === item.Device_ID;
              const cicilan24 = calcMonthlyInstallment(item.Harga_Promo_Cash, 24, 0);
              const deltaCicilan24 = calcMonthlyInstallment(item.Upgrade_Delta_Cash, 24, 0);

              return (
                <div
                  key={item.Device_ID}
                  onClick={() => setFocusedDeviceId(item.Device_ID)}
                  className={`cursor-pointer rounded-2xl bg-white border-2 transition-all flex flex-col justify-between overflow-hidden ${
                    isSelectedForBundle
                      ? "border-blue-600 shadow-lg ring-2 ring-blue-100"
                      : "border-slate-200 hover:border-blue-300 shadow-sm"
                  }`}
                >
                  <div>
                    {/* Card Header */}
                    <div
                      className={`px-5 py-4 ${
                        item.Segmen_Target === "Pro/Flagship"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-900 border-b border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            item.Segmen_Target === "Pro/Flagship"
                              ? "bg-amber-500 text-slate-950"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {item.Segmen_Target}
                        </span>
                        {isSelectedForBundle && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3" /> Target Bundle Aktif
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-extrabold">{item.Seri_Model_Varian}</h3>
                      <p
                        className={`text-xs mt-0.5 ${
                          item.Segmen_Target === "Pro/Flagship" ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {item.Best_For_Profile}
                      </p>
                    </div>

                    {/* Pricing & Installment Box */}
                    <div className="px-5 py-3.5 bg-blue-50/50 border-b border-slate-100">
                      <div className="flex items-baseline justify-between">
                        <div>
                          {item.Harga_SRP_Normal > item.Harga_Promo_Cash && (
                            <p className="text-xs text-slate-400 line-through">
                              {formatRupiah(item.Harga_SRP_Normal)}
                            </p>
                          )}
                          <p className="text-xl font-black text-slate-900">
                            {formatRupiah(item.Harga_Promo_Cash)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-semibold text-blue-700">
                            CC 0% 24 Bln: {formatRupiah(cicilan24)}/bln
                          </p>
                          {item.Upgrade_Delta_Cash > 0 ? (
                            <span className="inline-block mt-0.5 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              Selisih +{formatRupiah(deltaCicilan24)}/bln
                            </span>
                          ) : (
                            <span className="inline-block mt-0.5 rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              Varian Baseline Grup
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* What You Gain If You Upgrade */}
                    <div className="p-5 space-y-3">
                      <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-3 space-y-2">
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                          Keunggulan Utama (What You Gain):
                        </p>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          <li className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{item.What_You_Gain_1}</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{item.What_You_Gain_2}</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{item.What_You_Gain_3}</span>
                          </li>
                        </ul>
                      </div>

                      {/* Technical Specs */}
                      <div className="space-y-2 text-xs pt-1">
                        <div className="border-b border-slate-100 pb-1.5">
                          <span className="text-[11px] font-semibold text-slate-400 block">
                            Layar & Refresh Rate
                          </span>
                          <span className="font-semibold text-slate-800">
                            {item.Layar_dan_Refresh_Rate}
                          </span>
                        </div>
                        <div className="border-b border-slate-100 pb-1.5">
                          <span className="text-[11px] font-semibold text-slate-400 block">
                            Chipset & Apple Intelligence
                          </span>
                          <span className="font-semibold text-slate-800">
                            {item.Chipset_dan_Apple_Intelligence}
                          </span>
                        </div>
                        <div className="border-b border-slate-100 pb-1.5">
                          <span className="text-[11px] font-semibold text-slate-400 block">
                            Kamera & Video
                          </span>
                          <span className="font-semibold text-slate-800">
                            {item.Sistem_Kamera_dan_Video}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block">
                            Baterai, Port & Material
                          </span>
                          <span className="font-medium text-slate-700">
                            {item.Baterai_dan_Konektivitas} • {item.Material_dan_Ketahanan}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600">
                      {item.Rekomendasi_Casing_Tier.split("(")[0]}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendBundleToCart([
                          {
                            sku: item.Device_ID,
                            name: item.Seri_Model_Varian,
                            category: "Device",
                            price: item.Harga_Promo_Cash,
                            brand: "Apple",
                            segmen: item.Segmen_Target,
                          },
                        ]);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-600 transition"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Pilih Unit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AUTO ESSENTIAL BUNDLE RECOMMENDATION BAR */}
          {activeFocusItem && (
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-6 shadow-xl border border-slate-700">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-700/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-amber-500 px-2.5 py-0.5 text-[11px] font-extrabold text-slate-950 uppercase">
                      Rekomendasi Bundle Wajib Otomatis
                    </span>
                    <span className="text-xs text-blue-300 font-semibold">
                      Segmen: {activeFocusItem.Segmen_Target}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold mt-1">
                    Lengkapi {activeFocusItem.Seri_Model_Varian} dengan Proteksi & Aksesoris Ideal
                  </h3>
                  <p className="text-xs text-slate-300">
                    {activeFocusItem.Segmen_Target === "Pro/Flagship"
                      ? "Perangkat Pro/Flagship otomatis diarahkan ke Casing Tier 4–6 (Durability Kokoh & Raised Camera Guard)."
                      : "Perangkat Base/Entry otomatis diarahkan ke Casing Tier 1–3 (Value & Anti-Yellowing)."}
                  </p>
                </div>

                <button
                  onClick={handleSendSelectedBundle}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-400 px-5 py-3 text-sm font-extrabold text-white shadow-lg transition shrink-0"
                >
                  <span>Kirim Unit + Bundle ke Simulasi Pembayaran</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
                {/* Casing Option */}
                <label className="cursor-pointer rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 p-3.5 flex flex-col justify-between transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeCasing}
                        onChange={(e) => setIncludeCasing(e.target.checked)}
                        className="h-4 w-4 rounded accent-blue-500"
                      />
                      <span className="text-xs font-bold text-amber-400">
                        {recommendedCasing?.Tier_Casing} • {recommendedCasing?.Merek}
                      </span>
                    </div>
                    <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-slate-950">
                      BEST SELLER
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white mt-2">
                    {recommendedCasing?.Nama_Produk}
                  </p>
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-300">
                      {formatRupiah(recommendedCasing?.Harga_Promo || 0)}
                    </span>
                    <span className="text-[11px] text-slate-300">
                      +{formatRupiah(calcMonthlyInstallment(recommendedCasing?.Harga_Promo || 0, 24))}/bln
                    </span>
                  </div>
                </label>

                {/* Screen Protector */}
                <label className="cursor-pointer rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 p-3.5 flex flex-col justify-between transition">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeGlass}
                      onChange={(e) => setIncludeGlass(e.target.checked)}
                      className="h-4 w-4 rounded accent-blue-500"
                    />
                    <span className="text-xs font-bold text-blue-300">Screen Protection</span>
                  </div>
                  <p className="text-xs font-semibold text-white mt-2">
                    {recommendedGlass?.Nama_Produk}
                  </p>
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-300">
                      {formatRupiah(recommendedGlass?.Harga_Promo || 0)}
                    </span>
                    <span className="text-[11px] text-slate-300">
                      +{formatRupiah(calcMonthlyInstallment(recommendedGlass?.Harga_Promo || 0, 24))}/bln
                    </span>
                  </div>
                </label>

                {/* Adapter */}
                <label className="cursor-pointer rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 p-3.5 flex flex-col justify-between transition">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeAdapter}
                      onChange={(e) => setIncludeAdapter(e.target.checked)}
                      className="h-4 w-4 rounded accent-blue-500"
                    />
                    <span className="text-xs font-bold text-blue-300">Power Adapter</span>
                  </div>
                  <p className="text-xs font-semibold text-white mt-2">
                    {recommendedAdapter?.Nama_Produk}
                  </p>
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-300">
                      {formatRupiah(recommendedAdapter?.Harga_Promo || 0)}
                    </span>
                    <span className="text-[11px] text-slate-300">
                      +{formatRupiah(calcMonthlyInstallment(recommendedAdapter?.Harga_Promo || 0, 24))}/bln
                    </span>
                  </div>
                </label>

                {/* Proteksi Qoala */}
                <label className="cursor-pointer rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 p-3.5 flex flex-col justify-between transition">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeQoala}
                      onChange={(e) => setIncludeQoala(e.target.checked)}
                      className="h-4 w-4 rounded accent-blue-500"
                    />
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5" /> Proteksi Qoala 12 Bln
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white mt-2">
                    {matchedQoala?.Nama_Paket}
                  </p>
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-300">
                      {formatRupiah(matchedQoala?.Premi_12_Bln || 0)}
                    </span>
                    <span className="text-[11px] text-slate-300">
                      +{formatRupiah(calcMonthlyInstallment(matchedQoala?.Premi_12_Bln || 0, 24))}/bln
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODE 2: LEGACY / LOB COMPARISON */}
      {subMode === "LOB_COMPARE" && (
        <div className="space-y-5">
          {/* Category LOB Filter */}
          <div className="flex flex-wrap gap-2">
            {lobCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedLobCat(cat);
                  setSelectedLobId("");
                }}
                className={`rounded-xl px-4 py-2 text-xs font-bold border transition ${
                  selectedLobCat === cat
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Selector Dropdown for Customer's Old Device */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 shrink-0">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>Pilih Perangkat Lama Customer:</span>
            </div>
            <select
              value={currentLob?.LOB_ID || ""}
              onChange={(e) => setSelectedLobId(e.target.value)}
              className="w-full sm:max-w-md rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              {filteredLobList.map((lob) => (
                <option key={lob.LOB_ID} value={lob.LOB_ID}>
                  [{lob.Tahun_Rilis}] {lob.Model_Varian} ({lob.Seri_atau_Lini})
                </option>
              ))}
            </select>
          </div>

          {currentLob && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Card: Customer's Current Old Device */}
              <div className="rounded-2xl bg-white border border-slate-300 overflow-hidden shadow-sm">
                <div className="bg-slate-200 px-5 py-3.5 border-b border-slate-300 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                      Perangkat Customer Saat Ini ({currentLob.LOB_ID})
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {currentLob.Model_Varian}
                    </h3>
                  </div>
                  <span className="rounded-lg bg-slate-700 px-2.5 py-1 text-xs font-bold text-white">
                    Rilis {currentLob.Tahun_Rilis}
                  </span>
                </div>

                <div className="p-5 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3 border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-slate-400 block">Layar / Desain</span>
                      <span className="font-semibold text-slate-800">
                        {currentLob.Layar_atau_Desain}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Chipset & Spesifikasi</span>
                      <span className="font-semibold text-slate-800">
                        {currentLob.Chipset_dan_Spec}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-slate-400 block">Status Apple Intelligence</span>
                      <span
                        className={`inline-block mt-0.5 rounded px-2 py-0.5 font-bold ${
                          currentLob.Apple_Intelligence.includes("Tidak")
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {currentLob.Apple_Intelligence}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Baterai & Port</span>
                      <span className="font-semibold text-slate-800">
                        {currentLob.Baterai_dan_Port}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Fitur Utama Saat Rilis</span>
                    <span className="font-medium text-slate-700">{currentLob.Fitur_Utama}</span>
                  </div>

                  {/* Pain Point / Gap Highlight */}
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 mt-2">
                    <p className="text-[11px] font-extrabold uppercase text-rose-800 mb-1">
                      Keterbatasan / Gap vs Seri Baru di Toko:
                    </p>
                    <p className="text-xs font-medium text-rose-900">
                      {currentLob.Gap_vs_Seri_Baru_Toko}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Card: Upgrade Target Recommendation */}
              <div className="rounded-2xl bg-gradient-to-br from-blue-950 via-slate-900 to-slate-900 text-white border border-blue-800 overflow-hidden shadow-lg flex flex-col justify-between">
                <div>
                  <div className="bg-blue-600/30 px-5 py-3.5 border-b border-blue-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-300">
                        Rekomendasi Upgrade Terdekat di Toko
                      </span>
                      <h3 className="text-lg font-extrabold text-white">
                        {currentLob.Rekomendasi_Upgrade_Terdekat}
                      </h3>
                    </div>
                    <Award className="h-6 w-6 text-amber-400" />
                  </div>

                  <div className="p-5 space-y-4 text-xs">
                    <p className="text-slate-300 leading-relaxed">
                      Dengan melakukan upgrade dari <strong>{currentLob.Model_Varian}</strong> ke{" "}
                      <strong>{currentLob.Rekomendasi_Upgrade_Terdekat}</strong>, pelanggan langsung
                      mendapatkan lonjakan teknologi terbaru serta berhak atas program{" "}
                      <span className="text-amber-300 font-bold">
                        Trade-In Laku6 + Bonus Top-Up
                      </span>{" "}
                      di kasir.
                    </p>

                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                        Unit Tersedia di Toko yang Cocok:
                      </p>
                      {devices
                        .filter((d) =>
                          currentLob.Rekomendasi_Upgrade_Terdekat
                            .toLowerCase()
                            .includes(d.Seri_Keluarga.toLowerCase())
                        )
                        .slice(0, 3)
                        .map((dev) => (
                          <div
                            key={dev.Device_ID}
                            className="rounded-xl bg-white/10 border border-white/15 p-3 flex items-center justify-between gap-2"
                          >
                            <div>
                              <p className="font-bold text-white text-sm">
                                {dev.Model_Varian} ({dev.Storage})
                              </p>
                              <p className="text-[11px] text-slate-300">{dev.Layar_Refresh_Rate}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-extrabold text-emerald-300 text-sm">
                                {formatRupiah(dev.Harga_SRP_Promo)}
                              </p>
                              <button
                                onClick={() =>
                                  onSendBundleToCart([
                                    {
                                      sku: dev.Device_ID,
                                      name: `${dev.Model_Varian} (${dev.Storage})`,
                                      category: "Device",
                                      price: dev.Harga_SRP_Promo,
                                      brand: "Apple",
                                      segmen: dev.Segmen_Target,
                                    },
                                  ])
                                }
                                className="mt-1 inline-flex items-center gap-1 rounded-lg bg-blue-500 hover:bg-blue-400 px-2.5 py-1 text-[11px] font-bold text-white transition"
                              >
                                <PlusCircle className="h-3 w-3" /> Simulasikan
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-white/5 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-300">
                    Ingin hitung potongan Trade-In Laku6?
                  </span>
                  <button
                    onClick={() => setSubMode("NEW_LINEUP")}
                    className="font-bold text-amber-400 hover:underline"
                  >
                    Lihat Paket Bundling &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
