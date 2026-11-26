"use client";

import React, { useMemo, useState } from "react";
import {
  Banknote, Calculator, Check, Copy, CreditCard,
  Minus, Plus, RefreshCw, ScanBarcode, ShieldCheck, ShoppingCart, Trash2,
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
    if (!found) return setManualBankDiscount(0);
    const explicit = Number(found.Nominal_Diskon || found.Cashback || 0);
    if (explicit > 0) return setManualBankDiscount(explicit);
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
            <input type="text" placeholder="Nama Item" value={manualName} onChange={(e) => setManualName(e.target.value)} className="col-span-2 rounded-lg bg-slate-100 dark:
