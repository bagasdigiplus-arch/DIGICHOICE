"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Smartphone,
  Zap,
} from "lucide-react";
import { LOB_APPLE_DEVICES, LobDeviceSpec } from "../data/lobDevices";

interface ComparisonMatrixViewProps {
  customDevices?: any[];
  onAddToCart?: (item: {
    sku: string;
    name: string;
    category: string;
    price: number;
    qty: number;
  }) => void;
}

const formatIDR = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

export default function ComparisonMatrixView({
  customDevices = [],
  onAddToCart,
}: ComparisonMatrixViewProps) {
  const [selectedLob, setSelectedLob] = useState<
    "iPhone" | "iPad" | "MacBook" | "Apple Watch"
  >("iPhone");
  const [mode, setMode] = useState<"UPGRADE" | "HEAD_TO_HEAD">("UPGRADE");
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);

  // Gabungkan data bawaan LOB_APPLE_DEVICES dengan data dari upload Excel/Google Sheets jika ada
  const allDevices: LobDeviceSpec[] = useMemo(() => {
    if (!customDevices || customDevices.length === 0) return LOB_APPLE_DEVICES;
    const mappedCustom: LobDeviceSpec[] = customDevices.map((d: any, idx: number) => {
      const modelName = d.Model || d.model || d.Nama_Produk || `Apple Device ${idx + 1}`;
      const isPro = /pro|max|ultra/i.test(modelName);
      return {
        id: d.id || `custom-dev-${idx}`,
        sku: d.SKU || d.sku || `SKU-DEV-${idx + 1}`,
        lob: (d.LOB || d.lob || "iPhone") as any,
        model: modelName,
        variant: d.Storage || d.Variant || d.variant || "Standard",
        year: Number(d.Year || 2026),
        isActive: d.Status ? d.Status !== "Legacy" : true,
        segment: isPro ? "Pro/Flagship" : "Base/Entry",
        price: Number(d.SRP || d.Price || d.price || 0),
        promoPrice: Number(d.Promo || d.Promo_Price || d.promoPrice || 0) || undefined,
        chip: d.Chip || d.chip || "Apple Silicon",
        chipScore: isPro ? 96 : 85,
        display: d.Display || d.display || "Retina XDR Display",
        refreshRate: isPro ? "120Hz ProMotion" : "60Hz",
        camera: d.Camera || d.camera || "Advanced Apple Camera",
        battery: d.Battery || d.battery || "All-Day Battery Life",
        port: d.Port || d.port || "USB-C",
        appleIntelligence: true,
        keyHighlights: [
          `Performa ${d.Chip || "Apple Silicon"} responsif untuk produktivitas harian`,
          `Dukungan penuh ekosistem Apple & garansi resmi Indonesia`,
        ],
      };
    });
    return [...mappedCustom, ...LOB_APPLE_DEVICES];
  }, [customDevices]);

  const activeList = useMemo(
    () => allDevices.filter((d) => d.lob === selectedLob && d.isActive),
    [allDevices, selectedLob]
  );

  const baselineList = useMemo(
    () =>
      mode === "UPGRADE"
        ? allDevices.filter((d) => d.lob === selectedLob && !d.isActive)
        : activeList,
    [allDevices, selectedLob, mode, activeList]
  );

  const [leftId, setLeftId] = useState<string>("");
  const [rightId, setRightId] = useState<string>("");

  const leftDevice = useMemo(
    () => baselineList.find((d) => d.id === leftId) || baselineList[0],
    [baselineList, leftId]
  );

  const rightDevice = useMemo(
    () =>
      activeList.find((d) => d.id === rightId) ||
      activeList[0],
    [activeList, rightId]
  );

  // Kalkulasi "What You Gain If You Upgrade" secara dinamis
  const upgradeGains = useMemo(() => {
    if (!leftDevice || !rightDevice) return [];
    const gains: { title: string; detail: string; badge: string }[] = [];

    const speedDiff = Math.max(15, Math.round(((rightDevice.chipScore - leftDevice.chipScore) / Math.max(30, leftDevice.chipScore)) * 100));
    if (rightDevice.chip !== leftDevice.chip) {
      gains.push({
        title: `Lonjakan Performa ke ${rightDevice.chip}`,
        detail: `Estimasi peningkatan kecepatan proses & grafis hingga +${speedDiff}% dibanding ${leftDevice.chip}.`,
        badge: `+${speedDiff}% Faster`,
      });
    }

    if (!leftDevice.appleIntelligence && rightDevice.appleIntelligence) {
      gains.push({
        title: "Siap Apple Intelligence (AI)",
        detail: "Mendukung Writing Tools, Clean Up foto, Genmoji, dan Siri generasi terbaru.",
        badge: "New AI Era",
      });
    }

    if (leftDevice.port.includes("Lightning") && rightDevice.port.includes("USB-C")) {
      gains.push({
        title: "Transisi ke Port Universal USB-C",
        detail: "Satu kabel untuk iPhone, iPad, dan MacBook dengan transfer data jauh lebih cepat.",
        badge: "USB-C Universal",
      });
    }

    if (!leftDevice.refreshRate.includes("120Hz") && rightDevice.refreshRate.includes("120Hz")) {
      gains.push({
        title: "Layar Super Mulus 120Hz ProMotion",
        detail: "Scrolling 2x lebih halus dengan dukungan Always-On Display yang hemat daya.",
        badge: "120Hz ProMotion",
      });
    }

    if (leftDevice.camera !== rightDevice.camera) {
      gains.push({
        title: "Upgrade Sistem Kamera & Optik",
        detail: `Beralih dari ${leftDevice.camera} ke ${rightDevice.camera}.`,
        badge: "Pro Optics",
      });
    }

    return gains.length > 0
      ? gains
      : rightDevice.keyHighlights.map((h, i) => ({
          title: `Keunggulan Utama #${i + 1}`,
          detail: h,
          badge: "Highlight",
        }));
  }, [leftDevice, rightDevice]);

  // Rekomendasi Essential Bundle otomatis sesuai segmen Base/Entry vs Pro/Flagship
  const essentialBundle = useMemo(() => {
    if (!rightDevice) return [];
    const isPro = rightDevice.segment === "Pro/Flagship";
    const devPrice = rightDevice.promoPrice || rightDevice.price;

    if (selectedLob === "iPhone") {
      return isPro
        ? [
            {
              sku: "ACC-CASE-T5-MAG",
              name: "Casing Tier 4–6 (Pro MagSafe / FineWoven / Aramid)",
              tag: "Casing Tier 4–6",
              price: 899000,
            },
            {
              sku: "ACC-TG-SAPPHIRE",
              name: "Tempered Glass Full-Cover + Lens Ring Protector",
              tag: "Protection",
              price: 449000,
            },
            {
              sku: "ACC-ADP-30W-ORIG",
              name: "Apple 30W USB-C Power Adapter Original",
              tag: "Fast Charge",
              price: 649000,
            },
            {
              sku: "QOALA-24M-PRO",
              name: "Proteksi Qoala 24 Bulan (Layar Pecah & Cairan)",
              tag: "Qoala 24 Bln",
              price: devPrice > 20000000 ? 1899000 : 1499000,
            },
          ]
        : [
            {
              sku: "ACC-CASE-T2-CLR",
              name: "Casing Tier 1–3 (Clear MagSafe / Silicone Essential)",
              tag: "Casing Tier 1–3",
              price: 499000,
            },
            {
              sku: "ACC-TG-STD",
              name: "Tempered Glass HD Anti-Scratch",
              tag: "Protection",
              price: 299000,
            },
            {
              sku: "ACC-ADP-20W-ORIG",
              name: "Apple 20W USB-C Power Adapter Original",
              tag: "Fast Charge",
              price: 449000,
            },
            {
              sku: "QOALA-12M-BASE",
              name: "Proteksi Qoala 12 Bulan (Total Protection)",
              tag: "Qoala 12 Bln",
              price: 899000,
            },
          ];
    }

    if (selectedLob === "MacBook") {
      return [
        {
          sku: isPro ? "ACC-SLV-PRO14" : "ACC-SLV-AIR13",
          name: isPro ? "Premium Leather Sleeve + USB-C Multiport Hub" : "Minimalist Sleeve + USB-C Adapter",
          tag: isPro ? "Tier 4–6" : "Tier 1–3",
          price: isPro ? 1299000 : 799000,
        },
        {
          sku: "QOALA-MAC-24M",
          name: "Proteksi Qoala 24 Bulan MacBook",
          tag: "Qoala 24 Bln",
          price: 1999000,
        },
      ];
    }

    return [
      {
        sku: "ACC-ESSENTIAL-PACK",
        name: isPro ? "Pro Accessory Bundle (Tier 4–6)" : "Essential Accessory Bundle (Tier 1–3)",
        tag: isPro ? "Pro Bundle" : "Essential",
        price: isPro ? 999000 : 599000,
      },
      {
        sku: "QOALA-GADGET-12M",
        name: "Proteksi Qoala 12 Bulan",
        tag: "Qoala 12 Bln",
        price: 799000,
      },
    ];
  }, [rightDevice, selectedLob]);

  const bundleTotal = essentialBundle.reduce((acc, b) => acc + b.price, 0);

  const handlePushToCart = (includeBundle: boolean) => {
    if (!rightDevice || !onAddToCart) return;
    onAddToCart({
      sku: rightDevice.sku,
      name: `${rightDevice.model} (${rightDevice.variant})`,
      category: rightDevice.lob,
      price: rightDevice.promoPrice || rightDevice.price,
      qty: 1,
    });
    if (includeBundle) {
      essentialBundle.forEach((b) =>
        onAddToCart({
          sku: b.sku,
          name: b.name,
          category: "Bundle / Qoala",
          price: b.price,
          qty: 1,
        })
      );
    }
    setAddedFeedback(
      includeBundle
        ? "Perangkat + Essential Bundle masuk ke Simulasi Cart!"
        : "Perangkat masuk ke Simulasi Cart!"
    );
    setTimeout(() => setAddedFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: LOB Filter & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {(["iPhone", "iPad", "MacBook", "Apple Watch"] as const).map((lob) => (
            <button
              key={lob}
              onClick={() => {
                setSelectedLob(lob);
                setLeftId("");
                setRightId("");
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedLob === lob
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {lob}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => {
              setMode("UPGRADE");
              setLeftId("");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === "UPGRADE"
                ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Upgrade dari Perangkat Lama
          </button>
          <button
            onClick={() => {
              setMode("HEAD_TO_HEAD");
              setLeftId("");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === "HEAD_TO_HEAD"
                ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Bandingkan Seri Aktif
          </button>
        </div>
      </div>

      {/* Selector Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
        {/* Left Device Selector */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            {mode === "UPGRADE" ? "Perangkat Customer Saat Ini (LOB Baseline)" : "Pilihan Model A"}
          </label>
          <select
            value={leftDevice?.id || ""}
            onChange={(e) => setLeftId(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {baselineList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.model} {d.variant !== "Legacy" ? `(${d.variant})` : `• Rilis ${d.year}`}
              </option>
            ))}
          </select>
          {leftDevice && (
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
              <span>Chip: {leftDevice.chip}</span>
              <span>Tahun: {leftDevice.year}</span>
            </div>
          )}
        </div>

        {/* Arrow Divider */}
        <div className="lg:col-span-1 flex justify-center">
          <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ArrowRight className="w-5 h-5 rotate-90 lg:rotate-0" />
          </div>
        </div>

        {/* Right Device Selector */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/30 dark:to-zinc-900 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Rekomendasi Upgrade / Model B
            </label>
            {rightDevice && (
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  rightDevice.segment === "Pro/Flagship"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {rightDevice.segment}
              </span>
            )}
          </div>
          <select
            value={rightDevice?.id || ""}
            onChange={(e) => setRightId(e.target.value)}
            className="w-full rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {activeList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.model} ({d.variant}) — {formatIDR(d.promoPrice || d.price)}
              </option>
            ))}
          </select>
          {rightDevice && (
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="font-mono text-zinc-500">SKU: {rightDevice.sku}</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {formatIDR(rightDevice.promoPrice || rightDevice.price)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* What You Gain If You Upgrade Banner */}
      {rightDevice && (
        <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                What You Gain If You Upgrade ke {rightDevice.model}
              </h3>
              <p className="text-xs text-zinc-500">
                Poin nilai tambah utama untuk disampaikan saat konsultasi customer
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {upgradeGains.map((gain, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/70 flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-600/10 text-blue-600 dark:text-blue-400 mb-2">
                    {gain.badge}
                  </span>
                  <h4 className="text-sm font-bold mb-1">{gain.title}</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {gain.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-Side Spec Matrix */}
      {leftDevice && rightDevice && (
        <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold">Matriks Perbandingan Spesifikasi Teknis</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-6 py-3.5 w-1/4">Parameter</th>
                  <th className="px-6 py-3.5 w-[37.5%]">{leftDevice.model}</th>
                  <th className="px-6 py-3.5 w-[37.5%] text-blue-600 dark:text-blue-400">
                    {rightDevice.model} ({rightDevice.variant})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                <tr>
                  <td className="px-6 py-3.5 font-medium text-zinc-500">Chipset & Performa</td>
                  <td className="px-6 py-3.5">{leftDevice.chip}</td>
                  <td className="px-6 py-3.5 font-semibold text-zinc-900 dark:text-white">
                    {rightDevice.chip}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5 font-medium text-zinc-500">Layar & Refresh Rate</td>
                  <td className="px-6 py-3.5">
                    {leftDevice.display} ({leftDevice.refreshRate})
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-zinc-900 dark:text-white">
                    {rightDevice.display} ({rightDevice.refreshRate})
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5 font-medium text-zinc-500">Sistem Kamera / Sensor</td>
                  <td className="px-6 py-3.5">{leftDevice.camera}</td>
                  <td className="px-6 py-3.5 font-semibold text-zinc-900 dark:text-white">
                    {rightDevice.camera}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5 font-medium text-zinc-500">Daya Tahan Baterai</td>
                  <td className="px-6 py-3.5">{leftDevice.battery}</td>
                  <td className="px-6 py-3.5 font-semibold text-zinc-900 dark:text-white">
                    {rightDevice.battery}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5 font-medium text-zinc-500">Konektivitas / Port</td>
                  <td className="px-6 py-3.5">{leftDevice.port}</td>
                  <td className="px-6 py-3.5 font-semibold text-zinc-900 dark:text-white">
                    {rightDevice.port}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5 font-medium text-zinc-500">Apple Intelligence</td>
                  <td className="px-6 py-3.5">
                    {leftDevice.appleIntelligence ? "Didukung" : "Tidak Didukung"}
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    {rightDevice.appleIntelligence ? "Didukung Penuh" : "Standard WatchOS"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Segmented Essential Bundle Recommendation */}
      {rightDevice && (
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-900 dark:to-zinc-950 text-white rounded-2xl p-6 border border-zinc-700 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-700/80">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Smart Attach-Rate Engine • Profil {rightDevice.segment}
                </span>
              </div>
              <h3 className="text-lg font-bold">
                Rekomendasi Essential Bundle untuk {rightDevice.model}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {rightDevice.segment === "Pro/Flagship"
                  ? "Segmen Pro/Flagship diarahkan ke Casing Tier 4–6 + Proteksi Qoala 24 Bulan untuk proteksi maksimal."
                  : "Segmen Base/Entry diarahkan ke Casing Tier 1–3 + Paket Charger & Qoala 12 Bulan yang hemat."}
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="text-xs text-zinc-400">Estimasi Paket Aksesoris & Qoala</div>
              <div className="text-xl font-extrabold text-emerald-400">
                {formatIDR(bundleTotal)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-5">
            {essentialBundle.map((item) => (
              <div
                key={item.sku}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="pr-3">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {item.tag}
                  </span>
                  <div className="text-sm font-medium mt-1">{item.name}</div>
                  <div className="text-[11px] font-mono text-zinc-400">SKU: {item.sku}</div>
                </div>
                <div className="text-sm font-bold whitespace-nowrap">{formatIDR(item.price)}</div>
              </div>
            ))}
          </div>

          {onAddToCart && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {addedFeedback ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  {addedFeedback}
                </div>
              ) : (
                <span className="text-xs text-zinc-400">
                  Langsung masukkan ke Simulasi Pembayaran & Kasir ETP:
                </span>
              )}

              <div className="flex flex-wrap gap-2.5 ml-auto">
                <button
                  onClick={() => handlePushToCart(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 transition"
                >
                  + Unit Saja
                </button>
                <button
                  onClick={() => handlePushToCart(true)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center gap-2 shadow transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  + Unit & Essential Bundle
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
