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
  const [selectedTradeInId, setSelectedTradeInId] = useState("");
  const [tradeInGrade, setTradeInGrade] = useState<"A" | "B" | "C">("A");
  const [tradeInBonus, setTradeInBonus] = useState(0);

  const [selectedBankId, setSelectedBankId] = useState("");
  const [manualBankDiscount, setManualBankDiscount] = useState(0);
  const [voucherAmount, setVoucherAmount] = useState(0);
  const [mapclubPoints, setMapclubPoints] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState<"FULL" | "CC_0" | "BNPL">("CC_0");
  const [tenor, setTenor] = useState(12);
  const [selectedBnplId, setSelectedBnplId] = useState("");
  const [splitDpCash, setSplitDpCash] = useState(0);

  const [quickAddType, setQuickAddType] = useState<"DEVICE" | "ACC" | "QOALA">("DEVICE");
  const [quickAddId, setQuickAddId] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualSku, setManualSku] = useState("");
  const [manualPrice, setManualPrice] = useState(0);

  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 1), 0),
    [cart]
  );

  const hasDevice = cart.some((i) => i.category === "Device");
  const hasAcc = cart.some((i) => i.category === "Accessory");
  const hasQoala = cart.some((i) => i.category === "Qoala");

  const selectedTradeIn = useMemo(
    () =>
      tradeInDevices.find(
        (t: any, idx: number) =>
          String(t.TradeIn_ID || t.Tipe_Device_Lama || t.Model_Lama || idx) === selectedTradeInId
      ),
    [tradeInDevices, selectedTradeInId]
  );

  const handleSelectTradeIn = (id: string) => {
    setSelectedTradeInId(id);
    const found = tradeInDevices.find(
      (t: any, idx: number) =>
        String(t.TradeIn_ID || t.Tipe_Device_Lama || t.Model_Lama || idx) === id
    );
    setTradeInBonus(found ? Number(found.Bonus_TopUp ?? found.TopUp_Bonus ?? 0) : 0);
  };

  const tradeInValue = useMemo(() => {
    if (!selectedTradeIn) return 0;
    const baseA = Number(selectedTradeIn.Harga_Grade_A ?? selectedTradeIn.Estimasi_Buyback ?? 0);
    const mult = tradeInGrade === "A" ? 1 : tradeInGrade === "B" ? 0.85 : 0.7;
    return Math.round(baseA * mult) + Number(tradeInBonus || 0);
  }, [selectedTradeIn, tradeInGrade, tradeInBonus]);

  const selectedBank = useMemo(
    () =>
      bankPromos.find(
        (b: any, idx: number) =>
          String(b.Bank_ID || b.Promo_ID || b.Nama_Bank || idx) === selectedBankId
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
    const match = String(found.Catatan_Promo || "").match(/(\d{1,3}(?:\.\d{3})+)/);
    setManualBankDiscount(match ? Number(match[1].replace(/\./g, "")) : 0);
  };

  const bankDiscount =
    selectedBank && subtotal >= Number(selectedBank.Min_Transaksi || 0)
      ? Number(manualBankDiscount || 0)
      : 0;

  const netPayable = Math.max(
    0,
    subtotal - (tradeInValue + bankDiscount + Number(voucherAmount || 0) + Number(mapclubPoints || 0))
  );
  const financedAmount = Math.max(0, netPayable - Number(splitDpCash || 0));

  const selectedBnpl = useMemo(
    () =>
      bnplProviders.find(
        (p: any, idx: number) => String(p.BNPL_ID || p.Nama_Provider || idx) === selectedBnplId
      ) || bnplProviders[0],
    [bnplProviders, selectedBnplId]
  );

  const monthlyInstallment = useMemo(() => {
    if (paymentMethod === "FULL" || tenor <= 0) return financedAmount;
    if (paymentMethod === "CC_0") return financedAmount / tenor;
    const rate = Number(selectedBnpl?.Bunga_Bulanan_Pct ?? selectedBnpl?.Bunga_Persen ?? 1.99) / 100;
    const admin = Number(selectedBnpl?.Biaya_Admin ?? 0);
    return (financedAmount * (1 + rate * tenor) + admin) / tenor;
  }, [paymentMethod, tenor, financedAmount, selectedBnpl]);

  const handleQuickAdd = () => {
    if (quickAddType === "DEVICE") {
      const target = devices.find((d: any) => String(d.Device_ID) === quickAddId) || devices[0];
      if (target) onAddDeviceToCart(target);
    } else if (quickAddType === "ACC") {
      const target = accessories.find((a: any) => String(a.Acc_ID) === quickAddId) || accessories[0];
      if (target) onAddAccToCart(target);
    } else {
      const target = qoalaTiers.find((q: any) => String(q.Tier_ID) === quickAddId) || qoalaTiers[0];
      if (target) onAddQoalaToCart(target, 12);
    }
  };

  const handleCopySku = (sku: string) => {
    navigator.clipboard?.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 1500);
  };

  const handleCopyEtpSummary = () => {
    const devName = selectedTradeIn?.Tipe_Device_Lama || selectedTradeIn?.Model_Lama || "Device Lama";
    const lines = [
      "=== RINGKASAN KASIR ETP — DIGI CHOICE ===",
      ...cart.map((i) => "• [" + i.sku + "] " + i.name + " x" + i.qty + " = " + formatIDR(i.price * i.qty)),
      "Subtotal: " + formatIDR(subtotal),
      tradeInValue > 0 ? "Trade-In (" + devName + " - Grade " + tradeInGrade + "): -" + formatIDR(tradeInValue) : "",
      bankDiscount > 0 ? "Promo Bank: -" + formatIDR(bankDiscount) : "",
      voucherAmount > 0 ? "Voucher: -" + formatIDR(voucherAmount) : "",
      mapclubPoints > 0 ? "MAPCLUB: -" + formatIDR(mapclubPoints) : "",
      "TOTAL BAYAR NET: " + formatIDR(netPayable),
      splitDpCash > 0 ? "Split DP Cash: " + formatIDR(splitDpCash) : "",
      paymentMethod !== "FULL"
        ? "Cicilan " + tenor + "x: " + formatIDR(monthlyInstallment) + "/bln"
        : "Skema: Full Payment",
    ].filter(Boolean);

    navigator.clipboard?.writeText(lines.join("\n"));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* ZONA 1: KERANJANG KONSULTASI */}
      <div className="xl:col-span-5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-extrabold">1. Keranjang Konsultasi</h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onOpenBarcodeModal} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <ScanBarcode className="w-3.5 h-3.5" /> Scan
            </button>
            {cart.length > 0 && (
              <button type="button" onClick={onClearCart} className="text-xs text-slate-400 hover:text-red-500">
                Kosongkan
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
          <span className={`px-2.5 py-1 rounded-full ${hasDevice ? "bg-blue-500/15 text-blue-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
            {hasDevice ? "✓ Unit" : "○ Unit"}
          </span>
          <span className={`px-2.5 py-1 rounded-full ${hasAcc ? "bg-amber-500/15 text-amber-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
            {hasAcc ? "✓ Casing/Acc" : "○ Casing/Acc"}
          </span>
          <span className={`px-2.5 py-1 rounded-full ${hasQoala ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
            {hasQoala ? "✓ 100% Qoala" : "! Wajib Qoala"}
          </span>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {cart.map((item) => (
            <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-slate-400">{item.category} • {item.sku}</div>
                <div className="text-xs font-bold truncate">{item.name}</div>
                <div className="text-xs font-extrabold text-blue-500">{formatIDR(item.price * item.qty)}</div>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => onUpdateQty(item.id, -1)} className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"><Minus className="w-3 h-3" /></button>
                <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                <button type="button" onClick={() => onUpdateQty(item.id, 1)} className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"><Plus className="w-3 h-3" /></button>
                <button type="button" onClick={() => onRemoveItem(item.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Tambah Cepat */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex gap-1.5">
            {(["DEVICE", "ACC", "QOALA"] as const).map((t) => (
              <button key={t} type="button" onClick={() => { setQuickAddType(t); setQuickAddId(""); }} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${quickAddType === t ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                {t === "DEVICE" ? "Unit" : t === "ACC" ? "Aksesoris" : "Qoala 12B"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select value={quickAddId} onChange={(e) => setQuickAddId(e.target.value)} className="flex-1 min-w-0 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs">
              {quickAddType === "DEVICE" && devices.map((d: any) => <option key={d.Device_ID} value={d.Device_ID}>{d.Model_Varian} ({d.Storage})</option>)}
              {quickAddType === "ACC" && accessories.map((a: any) => <option key={a.Acc_ID} value={a.Acc_ID}>{a.Merek} - {a.Nama_Produk}</option>)}
              {quickAddType === "QOALA" && qoalaTiers.map((q: any) => <option key={q.Tier_ID} value={q.Tier_ID}>Qoala {q.Kode_Tier} ({formatIDR(q.Premi_12_Bln)})</option>)}
            </select>
            <button type="button" onClick={handleQuickAdd} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">+ Tambah</button>
          </div>
        </div>

        {/* Manual Item */}
        <details className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <summary className="text-xs font-semibold text-slate-500 cursor-pointer">+ Input Item Manual</summary>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input type="text" placeholder="Nama Item" value={manualName} onChange={(e) => setManualName(e.target.value)} className="col-span-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs" />
            <input type="text" placeholder="SKU" value={manualSku} onChange={(e) => setManualSku(e.target.value)} className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs" />
            <input type="number" placeholder="Harga" value={manualPrice || ""} onChange={(e) => setManualPrice(Number(e.target.value))} className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs" />
            <button type="button" onClick={() => { if (manualName && manualPrice > 0) { onAddManualItem(manualName, manualSku || "MANUAL", manualPrice); setManualName(""); setManualSku(""); setManualPrice(0); } }} className="col-span-2 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold">Simpan Item</button>
          </div>
        </details>
      </div>

      {/* ZONA 2: TRADE-IN LAKU6, PROMO & SKEMA CICILAN */}
      <div className="xl:col-span-4 space-y-4">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-extrabold">2A. Trade-In Laku6</h3>
          </div>
          <select value={selectedTradeInId} onChange={(e) => handleSelectTradeIn(e.target.value)} className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium">
            <option value="">-- Tanpa Trade-In --</option>
            {tradeInDevices.map((t: any, idx: number) => {
              const key = String(t.TradeIn_ID || t.Tipe_Device_Lama || t.Model_Lama || idx);
              const label = t.Tipe_Device_Lama || t.Model_Lama || t.Model || `Device Lama #${idx + 1}`;
              const estA = Number(t.Harga_Grade_A ?? t.Estimasi_Buyback ?? 0);
              return <option key={key} value={key}>{label} {estA > 0 ? `(Est. ${formatIDR(estA)})` : ""}</option>;
            })}
          </select>

          {selectedTradeIn && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1.5">
                {(["A", "B", "C"] as const).map((g) => (
                  <button key={g} type="button" onClick={() => setTradeInGrade(g)} className={`py-1.5 rounded-lg text-xs font-bold border ${tradeInGrade === g ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}>
                    Grade {g}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Top-Up Bonus:</span>
                <input type="number" step={100000} value={tradeInBonus || ""} onChange={(e) => setTradeInBonus(Number(e.target.value))} className="w-32 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-right font-semibold" />
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 flex justify-between text-xs font-bold text-emerald-500">
                <span>Potongan Buyback:</span>
                <span>-{formatIDR(tradeInValue)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-extrabold">2B. Promo Bank, Voucher &amp; MAPCLUB</h3>
          </div>
          <select value={selectedBankId} onChange={(e) => handleSelectBank(e.target.value)} className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs">
            <option value="">-- Pilih Promo Bank --</option>
            {bankPromos.map((b: any, idx: number) => (
              <option key={String(b.Bank_ID || idx)} value={String(b.Bank_ID || idx)}>
                {b.Nama_Bank} {b.Catatan_Promo ? `— ${b.Catatan_Promo}` : ""}
              </option>
            ))}
          </select>
          {selectedBank && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Nominal Diskon Bank:</span>
              <input type="number" step={50000} value={manualBankDiscount || ""} onChange={(e) => setManualBankDiscount(Number(e.target.value))} className="w-32 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-right font-semibold" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Voucher (Rp)" value={voucherAmount || ""} onChange={(e) => setVoucherAmount(Number(e.target.value))} className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs" />
            <input type="number" placeholder="MAPCLUB (Rp)" value={mapclubPoints || ""} onChange={(e) => setMapclubPoints(Number(e.target.value))} className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-extrabold">2C. Skema Cicilan &amp; Split DP</h3>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(["FULL", "CC_0", "BNPL"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setPaymentMethod(m)} className={`py-2 rounded-xl text-xs font-bold border ${paymentMethod === m ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}>
                {m === "FULL" ? "Full Pay" : m === "CC_0" ? "Cicilan 0%" : "BNPL"}
              </button>
            ))}
          </div>
          {paymentMethod === "BNPL" && bnplProviders.length > 0 && (
            <select value={selectedBnplId} onChange={(e) => setSelectedBnplId(e.target.value)} className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs">
              {bnplProviders.map((p: any, idx: number) => (
                <option key={String(p.BNPL_ID || idx)} value={String(p.BNPL_ID || idx)}>{p.Nama_Provider || p.Provider}</option>
              ))}
            </select>
          )}
          {paymentMethod !== "FULL" && (
            <div className="grid grid-cols-4 gap-1.5">
              {[3, 6, 12, 24].map((t) => (
                <button key={t} type="button" onClick={() => setTenor(t)} className={`py-1.5 rounded-lg text-xs font-bold border ${tenor === t ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}>
                  {t} Bln
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Split DP Cash/Debit:</span>
            <input type="number" step={500000} value={splitDpCash || ""} placeholder="0" onChange={(e) => setSplitDpCash(Number(e.target.value))} className="w-32 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-right font-semibold" />
          </div>
        </div>
      </div>

      {/* ZONA 3: LAYAR KASIR MINI-ETP */}
      <div className="xl:col-span-3 bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Calculator className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-extrabold uppercase">3. Layar Kasir ETP</h3>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{formatIDR(subtotal)}</span></div>
          {tradeInValue > 0 && <div className="flex justify-between text-emerald-400"><span>Trade-In ({tradeInGrade})</span><span>-{formatIDR(tradeInValue)}</span></div>}
          {bankDiscount > 0 && <div className="flex justify-between text-blue-400"><span>Promo Bank</span><span>-{formatIDR(bankDiscount)}</span></div>}
          {voucherAmount > 0 && <div className="flex justify-between text-amber-400"><span>Voucher</span><span>-{formatIDR(voucherAmount)}</span></div>}
          {mapclubPoints > 0 && <div className="flex justify-between text-purple-400"><span>MAPCLUB</span><span>-{formatIDR(mapclubPoints)}</span></div>}
          <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
            <span className="font-bold">Total Net</span>
            <span className="text-lg font-extrabold text-emerald-400">{formatIDR(netPayable)}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-blue-600/20 border border-blue-500/40">
          <div className="text-[11px] text-blue-300">{paymentMethod === "FULL" ? "Full Payment" : `Cicilan ${tenor} Bulan`}</div>
          <div className="text-xl font-black">{formatIDR(monthlyInstallment)}{paymentMethod !== "FULL" ? "/bln" : ""}</div>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          <div className="text-[11px] font-bold uppercase text-slate-400 flex items-center justify-between">
            <span>SKU Kasir ({cart.length})</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          {cart.map((item) => (
            <div key={item.id} className="p-2 rounded-lg bg-white/5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-mono text-[11px] font-bold text-amber-300 truncate">{item.sku}</div>
                <div className="text-[10px] text-slate-400 truncate">{item.name} (x{item.qty})</div>
              </div>
              <button type="button" onClick={() => handleCopySku(item.sku)} className="p-1.5 rounded bg-white/10 hover:bg-blue-600 shrink-0">
                {copiedSku === item.sku ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={handleCopyEtpSummary} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2">
          {copiedSummary ? <><Check className="w-4 h-4" /> Tersalin!</> : <><Copy className="w-4 h-4" /> Salin Ringkasan ETP</>}
        </button>
      </div>
    </div>
  );
}
