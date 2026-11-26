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
  const [manualBankDiscount, setManualBankDiscount] = useState<number>(0);
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

  // Trade-In Laku6 Valuation (sesuai struktur ascg.ts: TradeIn_ID, Tipe_Device_Lama, Harga_Grade_A, Bonus_TopUp)
  const selectedTradeIn = useMemo(
    () =>
      tradeInDevices.find(
        (t: any, idx: number) =>
          String(t.TradeIn_ID || t.Tipe_Device_Lama || t.Model_Lama || idx) ===
          selectedTradeInId
      ),
    [tradeInDevices, selectedTradeInId]
  );

  const handleSelectTradeIn = (id: string) => {
    setSelectedTradeInId(id);
    const found = tradeInDevices.find(
      (t: any, idx: number) =>
        String(t.TradeIn_ID || t.Tipe_Device_Lama || t.Model_Lama || idx) === id
    );
    if (found) {
      setTradeInBonus(Number(found.Bonus_TopUp ?? found.TopUp_Bonus ?? 0));
    } else {
      setTradeInBonus(0);
    }
  };

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

  // Bank Promo Discount (sesuai struktur ascg.ts: Bank_ID, Nama_Bank, Min_Transaksi, Catatan_Promo)
  const selectedBank = useMemo(
    () =>
      bankPromos.find(
        (b: any, idx: number) =>
          String(b.Bank_ID || b.Promo_ID || b.Nama_Bank || idx) ===
          selectedBankId
      ),
    [bankPromos, selectedBankId]
  );

  const handleSelectBank = (id: string) => {
    setSelectedBankId(id);
    const found = bankPromos.find(
      (b: any, idx: number) =>
        String(b.Bank_ID || b.Promo_ID || b.Nama_Bank || idx) === id
    );
    if (!found) {
      setManualBankDiscount(0);
      return;
    }
    const explicit = Number(found.Nominal_Diskon || found.Cashback || 0);
    if (explicit > 0) {
      setManualBankDiscount(explicit);
      return;
    }
    // Deteksi otomatis angka potongan/cashback dari Catatan_Promo (misal "Rp 1.000.000" atau "1.500.000")
    const note = String(found.Catatan_Promo || "");
    const match = note.match(/(\d{1,3}(?:\.\d{3})+)/);
    if (match) {
      const parsed = Number(match[1].replace(/\./g, ""));
      setManualBankDiscount(parsed);
    } else {
      setManualBankDiscount(0);
    }
  };

  const bankDiscount = useMemo(() => {
    if (!selectedBank) return 0;
    const minTrx = Number(selectedBank.Min_Transaksi || 0);
    if (subtotal < minTrx) return 0;
    return Number(manualBankDiscount || 0);
  }, [selectedBank, subtotal, manualBankDiscount]);

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
        (p: any, idx: number) =>
          String(p.BNPL_ID || p.Nama_Provider || idx) === selectedBnplId
      ) || bnplProviders[0],
    [bnplProviders, selectedBnplId]
  );

  const monthlyInstallment = useMemo(() => {
    if (paymentMethod === "FULL" || tenor <= 0) return financedAmount;
    if (paymentMethod === "CC_0") {
      return financedAmount / tenor;
    }
    const monthlyRate =
      Number(
        selectedBnpl?.Bunga_Bulanan_Pct ??
          selectedBnpl?.Bunga_Persen ??
          1.99
      ) / 100;
    const adminFee = Number(selectedBnpl?.Biaya_Admin ?? 0);
    const totalWithInterest =
      financedAmount * (1 + monthlyRate * tenor) + adminFee;
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
    const deviceLabel =
      selectedTradeIn?.Tipe_Device_Lama ||
      selectedTradeIn?.Model_Lama ||
      "Device Lama";
    const lines = [
      "=== RINGKASAN KASIR ETP — DIGI CHOICE ===",
      ...cart.map(
        (i) =>
          `• [${i.sku}] ${i.name} x${i.qty} = ${formatIDR(i.price * i.qty)}` ), `Subtotal: ${formatIDR(subtotal)}`,
      tradeInValue > 0
        ? `Trade-In Laku6 (${deviceLabel} - Grade ${tradeInGrade}): -${formatIDR(
            tradeInValue
          )}`
        : null,
      bankDiscount > 0
        ? `Promo Bank (${selectedBank?.Nama_Bank || ""}): -${formatIDR( bankDiscount )}` : null, voucherAmount > 0 ? `Voucher: -${formatIDR(voucherAmount)}` : null,
      mapclubPoints > 0 ? `Redeem MAPCLUB: -${formatIDR(mapclubPoints)}` : null,
      `TOTAL BAYAR NET: ${formatIDR(netPayable)}`,
      splitDpCash > 0 ? `Split DP Cash/Debit: ${formatIDR(splitDpCash)}` : null,
      paymentMethod !== "FULL"
        ? `Skema ${ paymentMethod === "CC_0" ? "Cicilan 0\% CC" : "BNPL" } ${tenor}x: ${formatIDR(monthlyInstallment)}/bln` : "Skema: Full Payment", ] .filter(Boolean) .join("\n");  navigator.clipboard?.writeText(lines); setCopiedSummary(true); setTimeout(() => setCopiedSummary(false), 2000); };  return ( <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start"> {/* ZONA 1: UNIFIED ETP CONSULTATION CART (5 COLS) */} <div className="xl:col-span-5 space-y-4"> <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"> <div className="flex items-center justify-between"> <div className="flex items-center gap-2"> <ShoppingCart className="w-5 h-5 text-blue-600" /> <h2 className="text-base font-extrabold">1. Keranjang Konsultasi</h2> </div> <div className="flex items-center gap-2"> <button type="button" onClick={onOpenBarcodeModal} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition" > <ScanBarcode className="w-3.5 h-3.5" /> Scan </button> {cart.length > 0 && ( <button type="button" onClick={onClearCart} className="text-xs font-semibold text-slate-400 hover:text-red-500" > Kosongkan </button> )} </div> </div>  {/* Attach Rate Indicator Pills */} <div className="flex flex-wrap gap-1.5 text-[11px] font-bold"> <span className={`px-2.5 py-1 rounded-full ${
                attachStatus.hasDevice
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400"
              }`}
            >
              {attachStatus.hasDevice ? "✓ Unit Utama" : "○ Unit Utama"}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full ${ attachStatus.hasAcc ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400" }`} > {attachStatus.hasAcc ? "✓ Aksesoris / Casing" : "○ Belum Ada Casing"} </span> <span className={`px-2.5 py-1 rounded-full ${
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
            onChange={(e) => handleSelectTradeIn(e.target.value)}
            className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium"
          >
            <option value="">-- Tanpa Trade-In --</option>
            {tradeInDevices.map((t: any, idx: number) => {
              const key = String(
                t.TradeIn_ID || t.Tipe_Device_Lama || t.Model_Lama || idx
              );
              const label =
                t.Tipe_Device_Lama ||
                t.Model_Lama ||
                t.Model ||
                t.Nama_Perangkat ||
                `Device Lama #${idx + 1}`; const estA = Number( t.Harga_Grade_A ?? t.Estimasi_Buyback ?? 0 ); return ( <option key={key} value={key}> {label} {estA > 0 ? `(Est. s/d ${formatIDR(estA)})` : ""}
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
                    className={`py-1.5 rounded-lg text-xs font-bold border ${ tradeInGrade === g ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300" }`} > Grade {g} </button> ))} </div>  <div className="flex items-center justify-between text-xs"> <span className="text-slate-500">Top-Up / Bonus Trade-In:</span> <input type="number" step={100000} value={tradeInBonus \vert{}\vert{} ""} placeholder="0" onChange={(e) => setTradeInBonus(Number(e.target.value))} className="w-32 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-right font-semibold" /> </div>  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs"> <span className="font-semibold text-emerald-700 dark:text-emerald-300"> Total Potongan Buyback: </span> <span className="font-extrabold text-emerald-600 dark:text-emerald-400"> -{formatIDR(tradeInValue)} </span> </div> </div> )} </div>  {/* Promo Bank, Voucher & MAPCLUB */} <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"> <div className="flex items-center gap-2"> <Banknote className="w-4 h-4 text-blue-500" /> <h3 className="text-sm font-extrabold"> 2B. Promo Bank, Voucher &amp; MAPCLUB </h3> </div>  <div> <label className="block text-[11px] text-slate-500 mb-1"> Promo Kartu Kredit / Debit Bank </label> <select value={selectedBankId} onChange={(e) => handleSelectBank(e.target.value)} className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs" > <option value="">-- Pilih Promo Bank --</option> {bankPromos.map((b: any, idx: number) => { const key = String( b.Bank_ID \vert{}\vert{} b.Promo_ID \vert{}\vert{} b.Nama_Bank \vert{}\vert{} idx ); return ( <option key={key} value={key}> {b.Nama_Bank} {b.Catatan_Promo ? ` — ${b.Catatan_Promo}` : ""}
                  </option>
                );
              })}
            </select>

            {selectedBank && (
              <div className="mt-2 space-y-1.5">
                {selectedBank.Catatan_Promo && (
                  <p className="text-[11px] text-blue-600 dark:text-blue-400">
                    Info: {selectedBank.Catatan_Promo} (Min. Trx{" "}
                    {formatIDR(Number(selectedBank.Min_Transaksi || 0))})
                  </p>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Nominal Cashback/Diskon:</span>
                  <input
                    type="number"
                    step={50000}
                    value={manualBankDiscount || ""}
                    placeholder="0"
                    onChange={(e) =>
                      setManualBankDiscount(Number(e.target.value))
                    }
                    className="w-32 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-right font-semibold"
                  />
                </div>
              </div>
            )}
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
                className={`py
