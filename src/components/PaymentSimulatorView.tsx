"use client";

import React, { useMemo, useState } from "react";
import {
  Banknote,
  Calculator,
  Check,
  Copy,
  CreditCard,
  Minus,
  Plus,
  RefreshCw,
  ScanBarcode,
  ShieldCheck,
  ShoppingCart,
  Trash2,
} from "lucide-react";

interface PaymentSimulatorViewProps {
  cart: any[];
  devices?: any[];
  accessories?: any[];
  qoalaTiers?: any[];
  bankPromos?: any[];
  bnplProviders?: any[];
  tradeInDevices?: any[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onAddDeviceToCart: (device: any) => void;
  onAddAccToCart: (acc: any) => void;
  onAddQoalaToCart: (tier: any, duration: 12 | 24) => void;
  onAddManualItem: (name: string, sku: string, price: number) => void;
  onOpenBarcodeModal: () => void;
}

const formatIDR = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(val || 0)));

export default function PaymentSimulatorView({
  cart = [],
  devices = [],
  accessories = [],
  qoalaTiers = [],
  bankPromos = [],
  bnplProviders = [],
  tradeInDevices = [],
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onAddDeviceToCart,
  onAddAccToCart,
  onAddQoalaToCart,
  onAddManualItem,
  onOpenBarcodeModal,
}: PaymentSimulatorViewProps) {
  // Trade-In Laku6 States
  const [selectedTradeInId, setSelectedTradeInId] = useState<string>("");
  const [tradeInGrade, setTradeInGrade] = useState<"A" | "B" | "C">("A");
  const [tradeInBonus, setTradeInBonus] = useState<number>(0);

  // Promo, Voucher, MAPCLUB
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [voucherAmount, setVoucherAmount] = useState<number>(0);
  const [mapclubPoints, setMapclubPoints] = useState<number>(0);

  // Payment Scheme & Split Payment
  const [paymentMethod, setPaymentMethod] = useState<
    "FULL" | "CC_0" | "BNPL"
  >("CC_0");
  const [tenor, setTenor] = useState<number>(12);
  const [selectedBnplId, setSelectedBnplId] = useState<string>("");
  const [splitDpCash, setSplitDpCash] = useState<number>(0);

  // Quick Add & Manual Item
  const [quickAddType, setQuickAddType] = useState<"DEVICE" | "ACC" | "QOALA">(
    "DEVICE"
  );
  const [quickAddId, setQuickAddId] = useState<string>("");
  const [manualName, setManualName] = useState("");
  const [manualSku, setManualSku] = useState("");
  const [manualPrice, setManualPrice] = useState<number>(0);

  // Copy Feedback
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Subtotal & Attach Rate Check
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1),
        0
      ),
    [cart]
  );

  const attachStatus = useMemo(() => {
    const hasDevice = cart.some((i) => i.category === "Device");
    const hasAcc = cart.some((i) => i.category === "Accessory");
    const hasQoala = cart.some((i) => i.category === "Qoala");
    return { hasDevice, hasAcc, hasQoala };
  }, [cart]);

  // Trade-In Laku6 Valuation
  const selectedTradeIn = useMemo(
    () =>
      tradeInDevices.find(
        (t: any) => String(t.TradeIn_ID || t.Model_Lama) === selectedTradeInId
      ),
    [tradeInDevices, selectedTradeInId]
  );

  const tradeInValue = useMemo(() => {
    if (!selectedTradeIn) return 0;
    const baseA = Number(
      selectedTradeIn.Harga_Grade_A ?? selectedTradeIn.Estimasi_Buyback ?? 0
    );
    const baseB = Number(
      selectedTradeIn.Harga_Grade_B ?? Math.round(baseA * 0.85)
    );
    const baseC = Number(
      selectedTradeIn.Harga_Grade_C ?? Math.round(baseA * 0.7)
    );
    const gradeVal =
      tradeInGrade === "A" ? baseA : tradeInGrade === "B" ? baseB : baseC;
    return gradeVal + Number(tradeInBonus || 0);
  }, [selectedTradeIn, tradeInGrade, tradeInBonus]);

  // Bank Promo Discount
  const selectedBank = useMemo(
    () =>
      bankPromos.find(
        (b: any) => String(b.Promo_ID || b.Nama_Bank) === selectedBankId
      ),
    [bankPromos, selectedBankId]
  );

  const bankDiscount = useMemo(() => {
    if (!selectedBank) return 0;
    const minTrx = Number(selectedBank.Min_Transaksi || 0);
    if (subtotal < minTrx) return 0;
    return Number(selectedBank.Nominal_Diskon || selectedBank.Cashback || 0);
  }, [selectedBank, subtotal]);

  // Net Payable & Installment Calculation
  const totalDeductions =
    tradeInValue +
    bankDiscount +
    Number(voucherAmount || 0) +
    Number(mapclubPoints || 0);

  const netPayable = Math.max(0, subtotal - totalDeductions);
  const financedAmount = Math.max(0, netPayable - Number(splitDpCash || 0));

  const selectedBnpl = useMemo(
    () =>
      bnplProviders.find(
        (p: any) => String(p.BNPL_ID || p.Nama_Provider) === selectedBnplId
      ) || bnplProviders[0],
    [bnplProviders, selectedBnplId]
  );

  const monthlyInstallment = useMemo(() => {
    if (paymentMethod === "FULL" || tenor <= 0) return financedAmount;
    if (paymentMethod === "CC_0") {
      return financedAmount / tenor;
    }
    // BNPL monthly interest rate (default ~1.99%/bln jika tidak tercantum di master)
    const monthlyRate =
      Number(selectedBnpl?.Bunga_Persen ?? selectedBnpl?.Interest_Rate ?? 1.99) /
      100;
    const totalWithInterest = financedAmount * (1 + monthlyRate * tenor);
    return totalWithInterest / tenor;
  }, [paymentMethod, tenor, financedAmount, selectedBnpl]);

  const handleQuickAdd = () => {
    if (quickAddType === "DEVICE") {
      const target =
        devices.find((d: any) => String(d.Device_ID) === quickAddId) ||
        devices[0];
      if (target) onAddDeviceToCart(target);
    } else if (quickAddType === "ACC") {
      const target =
        accessories.find((a: any) => String(a.Acc_ID) === quickAddId) ||
        accessories[0];
      if (target) onAddAccToCart(target);
    } else {
      const target =
        qoalaTiers.find((q: any) => String(q.Tier_ID) === quickAddId) ||
        qoalaTiers[0];
      if (target) onAddQoalaToCart(target, 12);
    }
  };

  const handleCopySku = (sku: string) => {
    navigator.clipboard?.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 1600);
  };

  const handleCopyEtpSummary = () => {
    const lines = [
      "=== RINGKASAN KASIR ETP — DIGI CHOICE ===",
      ...cart.map(
        (i) =>
          `• [${i.sku}] ${i.name} x${i.qty} = ${formatIDR(i.price * i.qty)}`
      ),
      `Subtotal: ${formatIDR(subtotal)}`,
      tradeInValue > 0 ? `Trade-In Laku6 (Grade ${tradeInGrade}): -${formatIDR(tradeInValue)}` : null,
      bankDiscount > 0 ? `Promo Bank: -${formatIDR(bankDiscount)}` : null,
      voucherAmount > 0 ? `Voucher: -${formatIDR(voucherAmount)}` : null,
      mapclubPoints > 0 ? `Redeem MAPCLUB: -${formatIDR(mapclubPoints)}` : null,
      `TOTAL BAYAR NET: ${formatIDR(netPayable)}`,
      splitDpCash > 0 ? `Split DP Cash/Debit: ${formatIDR(splitDpCash)}` : null,
      paymentMethod !== "FULL"
        ? `Skema ${paymentMethod === "CC_0" ? "Cicilan 0% CC" : "BNPL"} ${tenor}x: ${formatIDR(monthlyInstallment)}/bln`
        : "Skema: Full Payment",
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard?.writeText(lines);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* ZONA 1: UNIFIED ETP CONSULTATION CART (5 COLS) */}
      <div className="xl:col-span-5 space-y-4">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-extrabold">1. Keranjang Konsultasi</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenBarcodeModal}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition"
              >
                <ScanBarcode className="w-3.5 h-3.5" />
                Scan
              </button>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={onClearCart}
                  className="text-xs font-semibold text-slate-400 hover:text-red-500"
                >
                  Kosongkan
                </button>
              )}
            </div>
          </div>

          {/* Attach Rate Indicator Pills */}
          <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
            <span
              className={`px-2.5 py-1 rounded-full ${
                attachStatus.hasDevice
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400"
              }`}
            >
              {attachStatus.hasDevice ? "✓ Unit Utama" : "○ Unit Utama"}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full ${
                attachStatus.hasAcc
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400"
              }`}
            >
              {attachStatus.hasAcc ? "✓ Aksesoris / Casing" : "○ Belum Ada Casing"}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full ${
                attachStatus.hasQoala
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {attachStatus.hasQoala ? "✓ 100% Qoala" : "! Wajib Tawarkan Qoala"}
            </span>
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
              Keranjang masih kosong. Tambahkan unit, aksesoris, atau Qoala di bawah.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 truncate">
                        {item.sku}
                      </span>
                    </div>
                    <div className="text-xs font-bold truncate mt-1">
                      {item.name}
                    </div>
                    <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                      {formatIDR(item.price * item.qty)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-blue-500"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.id, 1)}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-blue-500"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1 text-slate-400 hover:text-red-500 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Add Bar */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block text-[11px] font-bold uppercase text-slate-500">
              Tambah Cepat dari Master Data
            </label>
            <div className="flex gap-1.5">
              {(["DEVICE", "ACC", "QOALA"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setQuickAddType(t);
                    setQuickAddId("");
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    quickAddType === t
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {t === "DEVICE" ? "Unit" : t === "ACC" ? "Aksesoris" : "Qoala 12B"}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <select
                value={quickAddId}
                onChange={(e) => setQuickAddId(e.target.value)}
                className="flex-1 min-w-0 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs"
              >
                {quickAddType === "DEVICE" &&
                  devices.map((d: any) => (
                    <option key={d.Device_ID} value={d.Device_ID}>
                      {d.Model_Varian} ({d.Storage}) — {formatIDR(d.Harga_SRP_Promo)}
                    </option>
                  ))}
                {quickAddType === "ACC" &&
                  accessories.map((a: any) => (
                    <option key={a.Acc_ID} value={a.Acc_ID}>
                      {a.Merek} - {a.Nama_Produk} ({formatIDR(a.Harga_Promo)})
                    </option>
                  ))}
                {quickAddType === "QOALA" &&
                  qoalaTiers.map((q: any) => (
                    <option key={q.Tier_ID} value={q.Tier_ID}>
                      Qoala {q.Kode_Tier} 12 Bln ({formatIDR(q.Premi_12_Bln)})
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleQuickAdd}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold whitespace-nowrap"
              >
                + Tambah
              </button>
            </div>
          </div>

          {/* Manual Item Entry */}
          <details className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <summary className="text-xs font-semibold text-slate-500 cursor-pointer hover:text-blue-500">
              + Input Item / Biaya Tambahan Manual
            </summary>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nama Item"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="col-span-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700"
              />
              <input
                type="text"
                placeholder="Kode SKU"
                value={manualSku}
                onChange={(e) => setManualSku(e.target.value)}
                className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700"
              />
              <input
                type="number"
                placeholder="Harga (Rp)"
                value={manualPrice || ""}
                onChange={(e) => setManualPrice(Number(e.target.value))}
                className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={() => {
                  if (!manualName || manualPrice <= 0) return;
                  onAddManualItem(
                    manualName,
                    manualSku || "MANUAL-SKU",
                    manualPrice
                  );
                  setManualName("");
                  setManualSku("");
                  setManualPrice(0);
                }}
                className="col-span-2 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold hover:bg-blue-600"
              >
                Masukkan ke Keranjang
              </button>
            </div>
          </details>
        </div>
      </div>

      {/* ZONA 2: TRADE-IN LAKU6, PROMO BANK & SKEMA CICILAN (4 COLS) */}
      <div className="xl:col-span-4 space-y-4">
        {/* Trade-In Laku6 Box */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-extrabold">2A. Trade-In Laku6</h3>
          </div>

          <select
            value={selectedTradeInId}
            onChange={(e) => setSelectedTradeInId(e.target.value)}
            className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs"
          >
            <option value="">-- Tanpa Trade-In --</option>
            {tradeInDevices.map((t: any, idx: number) => {
              const key = String(t.TradeIn_ID || t.Model_Lama || idx);
              return (
                <option key={key} value={key}>
                  {t.Model_Lama || t.Model} ({t.Storage || "All"})
                </option>
              );
            })}
          </select>

          {selectedTradeIn && (
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-3 gap-1.5">
                {(["A", "B", "C"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setTradeInGrade(g)}
                    className={`py-1.5 rounded-lg text-xs font-bold border ${
                      tradeInGrade === g
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    Grade {g}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Top-Up / Bonus Trade-In:</span>
                <input
                  type="number"
                  step={100000}
                  value={tradeInBonus || ""}
                  placeholder="0"
                  onChange={(e) => setTradeInBonus(Number(e.target.value))}
                  className="w-32 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-right font-semibold"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Total Potongan Buyback:
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  -{formatIDR(tradeInValue)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Promo Bank, Voucher & MAPCLUB */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-extrabold">
              2B. Promo Bank, Voucher &amp; MAPCLUB
            </h3>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">
              Promo Kartu Kredit / Debit Bank
            </label>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs"
            >
              <option value="">-- Pilih Promo Bank --</option>
              {bankPromos.map((b: any, idx: number) => {
                const key = String(b.Promo_ID || b.Nama_Bank || idx);
                return (
                  <option key={key} value={key}>
                    {b.Nama_Bank} — Potongan{" "}
                    {formatIDR(Number(b.Nominal_Diskon || b.Cashback || 0))}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Voucher Belanja (Rp)
              </label>
              <input
                type="number"
                step={50000}
                value={voucherAmount || ""}
                placeholder="0"
                onChange={(e) => setVoucherAmount(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Redeem MAPCLUB (Rp)
              </label>
              <input
                type="number"
                step={10000}
                value={mapclubPoints || ""}
                placeholder="0"
                onChange={(e) => setMapclubPoints(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Payment Scheme & Split Payment */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-extrabold">
              2C. Skema Pembayaran &amp; Split DP
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { key: "FULL", label: "Full Pay" },
                { key: "CC_0", label: "Cicilan 0%" },
                { key: "BNPL", label: "BNPL" },
              ] as const
            ).map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setPaymentMethod(m.key)}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  paymentMethod === m.key
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {paymentMethod === "BNPL" && bnplProviders.length > 0 && (
            <select
              value={selectedBnplId}
              onChange={(e) => setSelectedBnplId(e.target.value)}
              className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs"
            >
              {bnplProviders.map((p: any, idx: number) => {
                const key = String(p.BNPL_ID || p.Nama_Provider || idx);
                return (
                  <option key={key} value={key}>
                    {p.Nama_Provider || p.Provider}
                  </option>
                );
              })}
            </select>
          )}

          {paymentMethod !== "FULL" && (
            <div className="grid grid-cols-4 gap-1.5">
              {[3, 6, 12, 24].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTenor(t)}
                  className={`py-1.5 rounded-lg text-xs font-bold border ${
                    tenor === t
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {t} Bln
                </button>
              ))}
            </div>
          )}

          <div className="pt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500">Split Payment (DP Tunai/Debit):</span>
            <input
              type="number"
              step={500000}
              value={splitDpCash || ""}
              placeholder="0"
              onChange={(e) => setSplitDpCash(Number(e.target.value))}
              className="w-36 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-right font-semibold"
            />
          </div>
        </div>
      </div>

      {/* ZONA 3: RINGKASAN PEMBAYARAN & MINI-ETP CASHIER SCREEN (3 COLS) */}
      <div className="xl:col-span-3 space-y-4">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Calculator className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">
              3. Layar Kasir Mini-ETP
            </h3>
          </div>

          {/* Breakdown Numbers */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal Keranjang</span>
              <span className="font-semibold text-white">{formatIDR(subtotal)}</span>
            </div>
            {tradeInValue > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Trade-In Laku6 ({tradeInGrade})</span>
                <span>-{formatIDR(tradeInValue)}</span>
              </div>
            )}
            {bankDiscount > 0 && (
              <div className="flex justify-between text-blue-400">
                <span>Promo Bank</span>
                <span>-{formatIDR(bankDiscount)}</span>
              </div>
            )}
            {voucherAmount > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Voucher</span>
                <span>-{formatIDR(voucherAmount)}</span>
              </div>
            )}
            {mapclubPoints > 0 && (
              <div className="flex justify-between text-purple-400">
                <span>Redeem MAPCLUB</span>
                <span>-{formatIDR(mapclubPoints)}</span>
              </div>
            )}

            <div className="pt-2.5 border-t border-slate-800 flex justify-between items-baseline">
              <span className="font-bold text-slate-300">Total Bayar Net</span>
              <span className="text-lg font-extrabold text-emerald-400">
                {formatIDR(netPayable)}
              </span>
            </div>

            {splitDpCash > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>DP Cash / Debit</span>
                <span className="font-bold">{formatIDR(splitDpCash)}</span>
              </div>
            )}
          </div>

          {/* Monthly Installment Highlight */}
          <div className="p-3.5 rounded-xl bg-blue-600/20 border border-blue-500/40">
            <div className="text-[11px] text-blue-300 font-semibold">
              {paymentMethod === "FULL"
                ? "Pembayaran Penuh (1x)"
                : paymentMethod === "CC_0"
                ? `Estimasi Cicilan 0% (${tenor} Bulan)`
                : `Estimasi Cicilan BNPL (${tenor} Bulan)`}
            </div>
            <div className="text-xl font-black text-white mt-0.5">
              {formatIDR(monthlyInstallment)}
              {paymentMethod !== "FULL" && (
                <span className="text-xs font-normal text-blue-200"> /bln</span>
              )}
            </div>
          </div>

          {/* SAP Article / SKU List for Cashier Input */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-400">
                Daftar Kode SKU ETP ({cart.length})
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] font-bold text-amber-300 truncate">
                      {item.sku}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {item.name} (x{item.qty})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopySku(item.sku)}
                    className="p-1.5 rounded bg-white/10 hover:bg-blue-600 text-white shrink-0"
                    title="Salin SKU ETP"
                  >
                    {copiedSku === item.sku ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyEtpSummary}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 transition shadow"
          >
            {copiedSummary ? (
              <>
                <Check className="w-4 h-4" />
                Ringkasan Kasir Tersalin!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Salin Semua Ringkasan ETP
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
