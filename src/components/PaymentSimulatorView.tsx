"use client";

import React, { useState, useMemo } from "react";
import {
  Calculator,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Wallet,
  Banknote,
  RefreshCw,
  Receipt,
  CheckCircle2,
  X,
  ScanBarcode,
  ShieldCheck,
} from "lucide-react";
import {
  CartItem,
  MasterDevice,
  AccessoryItem,
  QoalaTier,
  BankPromo,
  BnplProvider,
  TradeInDevice,
} from "@/types/ascg";
import { formatRupiah, calcMonthlyInstallment } from "@/utils/formatters";

interface PaymentSimulatorViewProps {
  cart: CartItem[];
  devices: MasterDevice[];
  accessories: AccessoryItem[];
  qoalaTiers: QoalaTier[];
  bankPromos: BankPromo[];
  bnplProviders: BnplProvider[];
  tradeInDevices: TradeInDevice[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onAddDeviceToCart: (device: MasterDevice) => void;
  onAddAccToCart: (acc: AccessoryItem) => void;
  onAddQoalaToCart: (tier: QoalaTier, duration: 12 | 24) => void;
  onAddManualItem: (name: string, sku: string, price: number) => void;
  onOpenBarcodeModal: () => void;
}

export default function PaymentSimulatorView({
  cart,
  devices,
  accessories,
  qoalaTiers,
  bankPromos,
  bnplProviders,
  tradeInDevices,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onAddDeviceToCart,
  onAddAccToCart,
  onAddQoalaToCart,
  onAddManualItem,
  onOpenBarcodeModal,
}: PaymentSimulatorViewProps) {
  const [mode, setMode] = useState<"CART_ETP" | "STANDALONE">(
    cart.length > 0 ? "CART_ETP" : "STANDALONE"
  );

  // ==========================
  // SHARED TRADE-IN & DEDUCTION STATE
  // ==========================
  const [selectedTradeInId, setSelectedTradeInId] = useState<string>("");
  const [tradeInGrade, setTradeInGrade] = useState<"A" | "B" | "C">("A");
  const [bankCashback, setBankCashback] = useState<number>(0);
  const [storeVoucher, setStoreVoucher] = useState<number>(0);
  const [mapclubPoints, setMapclubPoints] = useState<number>(0);
  const [splitDpCash, setSplitDpCash] = useState<number>(0);

  // Payment Tab State
  const [payMethodTab, setPayMethodTab] = useState<"CC" | "BNPL" | "CASH">("CC");
  const [selectedBankId, setSelectedBankId] = useState<string>(bankPromos[0]?.Bank_ID || "BNK-BCA");
  const [selectedBnplId, setSelectedBnplId] = useState<string>(
    bnplProviders[0]?.BNPL_ID || "BNPL-KRD"
  );

  // Standalone Calculator State
  const [standaloneDeviceId, setStandaloneDeviceId] = useState<string>(
    devices[3]?.Device_ID || ""
  );
  const [customStandalonePrice, setCustomStandalonePrice] = useState<number>(
    devices[3]?.Harga_SRP_Promo || 16999000
  );

  // Quick Add inside Cart ETP
  const [quickDeviceSelect, setQuickDeviceSelect] = useState<string>(devices[0]?.Device_ID || "");
  const [quickAccSelect, setQuickAccSelect] = useState<string>(accessories[0]?.Acc_ID || "");
  const [manualName, setManualName] = useState("");
  const [manualSku, setManualSku] = useState("");
  const [manualPrice, setManualPrice] = useState<number>(0);

  // ETP Cashier Handover Modal
  const [showEtpModal, setShowEtpModal] = useState(false);

  // Calculate Trade-In Laku6 Valuation
  const tradeInValuation = useMemo(() => {
    const item = tradeInDevices.find((t) => t.TradeIn_ID === selectedTradeInId);
    if (!item) return { base: 0, bonus: 0, total: 0, label: "" };
    const multiplier = tradeInGrade === "A" ? 1 : tradeInGrade === "B" ? 0.85 : 0.7;
    const base = Math.round(item.Harga_Grade_A * multiplier);
    return {
      base,
      bonus: item.Bonus_TopUp,
      total: base + item.Bonus_TopUp,
      label: `${item.Tipe_Device_Lama} (Grade ${tradeInGrade})`,
    };
  }, [selectedTradeInId, tradeInGrade, tradeInDevices]);

  // Subtotals
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );

  const activeGrossAmount = mode === "CART_ETP" ? cartSubtotal : customStandalonePrice;
  const totalDeductions =
    tradeInValuation.total + bankCashback + storeVoucher + mapclubPoints + splitDpCash;
  const netPayable = Math.max(0, activeGrossAmount - totalDeductions);

  const activeBank = useMemo(
    () => bankPromos.find((b) => b.Bank_ID === selectedBankId) || bankPromos[0],
    [bankPromos, selectedBankId]
  );

  const activeBnpl = useMemo(
    () => bnplProviders.find((p) => p.BNPL_ID === selectedBnplId) || bnplProviders[0],
    [bnplProviders, selectedBnplId]
  );

  // Recommended Qoala for current cart device
  const cartDevicePrice = useMemo(() => {
    const dev = cart.find((c) => c.category === "Device");
    return dev ? dev.price : 0;
  }, [cart]);

  const suggestedQoala = useMemo(() => {
    if (cartDevicePrice <= 0) return qoalaTiers[1];
    return (
      qoalaTiers.find((q) => cartDevicePrice >= q.Min_Harga && cartDevicePrice <= q.Max_Harga) ||
      qoalaTiers[1]
    );
  }, [cartDevicePrice, qoalaTiers]);

  return (
    <div className="space-y-6">
      {/* Top Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Simulasi Pembayaran, Trade-In Laku6 & Mini-ETP Cart
          </h2>
          <p className="text-xs text-slate-500">
            Hitung cicilan mandiri kapan saja atau kelola transaksi lengkap siap serah ke kasir ETP
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setMode("CART_ETP")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              mode === "CART_ETP"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Simulasi Transaksi Cart ({cart.reduce((s, i) => s + i.qty, 0)})
          </button>
          <button
            onClick={() => setMode("STANDALONE")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              mode === "STANDALONE"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            Kalkulator Cicilan Cepat (Bebas)
          </button>
        </div>
      </div>

      {/* MODE A: STANDALONE QUICK CALCULATOR */}
      {mode === "STANDALONE" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              1. Input Harga / Pilih Unit Apple
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Pilih Cepat dari Master Produk:
              </label>
              <select
                value={standaloneDeviceId}
                onChange={(e) => {
                  setStandaloneDeviceId(e.target.value);
                  const found = devices.find((d) => d.Device_ID === e.target.value);
                  if (found) setCustomStandalonePrice(found.Harga_SRP_Promo);
                }}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900"
              >
                <option value="">-- Input Harga Manual di Bawah --</option>
                {devices.map((d) => (
                  <option key={d.Device_ID} value={d.Device_ID}>
                    {d.Model_Varian} ({d.Storage}) — {formatRupiah(d.Harga_SRP_Promo)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Nominal Harga Transaksi (Rp):
              </label>
              <input
                type="number"
                value={customStandalonePrice}
                onChange={(e) => {
                  setStandaloneDeviceId("");
                  setCustomStandalonePrice(Number(e.target.value) || 0);
                }}
                className="w-full rounded-xl border-2 border-blue-500 bg-white px-3.5 py-2.5 text-base font-black text-slate-900"
              />
            </div>

            {/* Trade-In Laku6 Mini Box */}
            <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900">
                <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
                <span>Simulasi Trade-In Laku6 (Opsional)</span>
              </div>
              <select
                value={selectedTradeInId}
                onChange={(e) => setSelectedTradeInId(e.target.value)}
                className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-2 text-xs font-semibold"
              >
                <option value="">Tanpa Trade-In</option>
                {tradeInDevices.map((t) => (
                  <option key={t.TradeIn_ID} value={t.TradeIn_ID}>
                    {t.Tipe_Device_Lama} (Est. s.d. {formatRupiah(t.Harga_Grade_A + t.Bonus_TopUp)})
                  </option>
                ))}
              </select>

              {selectedTradeInId && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex gap-1.5">
                    {(["A", "B", "C"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setTradeInGrade(g)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${
                          tradeInGrade === g
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-white text-slate-700 border-slate-300"
                        }`}
                      >
                        Grade {g}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-extrabold text-emerald-700">
                    -{formatRupiah(tradeInValuation.total)}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Promo / Cashback Bank (Rp)
                </label>
                <input
                  type="number"
                  value={bankCashback || ""}
                  placeholder="0"
                  onChange={(e) => setBankCashback(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  DP Tunai / Split (Rp)
                </label>
                <input
                  type="number"
                  value={splitDpCash || ""}
                  placeholder="0"
                  onChange={(e) => setSplitDpCash(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Right Result Side-by-Side CC vs BNPL */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl bg-slate-900 text-white p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">Sisa Tagihan Pembiayaan (Net Payable)</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {formatRupiah(netPayable)}
                </p>
              </div>
              <div className="text-right text-xs text-slate-300">
                <p>Harga Awal: {formatRupiah(activeGrossAmount)}</p>
                <p className="text-amber-300 font-semibold">
                  Total Potongan & DP: -{formatRupiah(totalDeductions)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CC 0% Card */}
              <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-blue-700 font-extrabold text-sm">
                  <CreditCard className="h-4 w-4" />
                  <span>Kartu Kredit (Cicilan 0%)</span>
                </div>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold"
                >
                  {bankPromos.map((b) => (
                    <option key={b.Bank_ID} value={b.Bank_ID}>
                      {b.Nama_Bank}
                    </option>
                  ))}
                </select>
                <div className="divide-y divide-slate-100">
                  {activeBank.Tenor_Tersedia.map((tenor) => (
                    <div key={tenor} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">{tenor} Bulan (0%)</span>
                      <span className="text-sm font-black text-slate-900">
                        {formatRupiah(calcMonthlyInstallment(netPayable, tenor, 0))}
                        <span className="text-[11px] font-normal text-slate-400">/bln</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BNPL Card */}
              <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-purple-700 font-extrabold text-sm">
                  <Wallet className="h-4 w-4" />
                  <span>BNPL / PayLater Tanpa Kartu</span>
                </div>
                <select
                  value={selectedBnplId}
                  onChange={(e) => setSelectedBnplId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold"
                >
                  {bnplProviders.map((p) => (
                    <option key={p.BNPL_ID} value={p.BNPL_ID}>
                      {p.Nama_Provider} (Bunga est. {p.Bunga_Bulanan_Pct}%/bln)
                    </option>
                  ))}
                </select>
                <div className="divide-y divide-slate-100">
                  {activeBnpl.Tenor_Tersedia.map((tenor) => (
                    <div key={tenor} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">{tenor} Bulan</span>
                      <span className="text-sm font-black text-purple-800">
                        {formatRupiah(
                          calcMonthlyInstallment(
                            netPayable,
                            tenor,
                            activeBnpl.Bunga_Bulanan_Pct,
                            activeBnpl.Biaya_Admin
                          )
                        )}
                        <span className="text-[11px] font-normal text-slate-400">/bln</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE B: 3-ZONE MINI-ETP CART & CHECKOUT ENGINE */}
      {mode === "CART_ETP" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* ZONE 1: DAFTAR BELANJA & QUICK ADD (5 Cols) */}
          <div className="xl:col-span-5 rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Zona 1 • Item Keranjang Mini-ETP
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenBarcodeModal}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100"
                  >
                    <ScanBarcode className="h-3.5 w-3.5" /> Scan
                  </button>
                  {cart.length > 0 && (
                    <button
                      onClick={onClearCart}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Add Selectors */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2.5 text-xs">
                <div className="flex gap-1.5">
                  <select
                    value={quickDeviceSelect}
                    onChange={(e) => setQuickDeviceSelect(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold"
                  >
                    {devices.map((d) => (
                      <option key={d.Device_ID} value={d.Device_ID}>
                        {d.Model_Varian} ({d.Storage}) — {formatRupiah(d.Harga_SRP_Promo)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const d = devices.find((x) => x.Device_ID === quickDeviceSelect);
                      if (d) onAddDeviceToCart(d);
                    }}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 font-bold text-white shrink-0 hover:bg-blue-600"
                  >
                    + Unit
                  </button>
                </div>

                <div className="flex gap-1.5">
                  <select
                    value={quickAccSelect}
                    onChange={(e) => setQuickAccSelect(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold"
                  >
                    {accessories.map((a) => (
                      <option key={a.Acc_ID} value={a.Acc_ID}>
                        [{a.Merek}] {a.Nama_Produk} — {formatRupiah(a.Harga_Promo)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const a = accessories.find((x) => x.Acc_ID === quickAccSelect);
                      if (a) onAddAccToCart(a);
                    }}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 font-bold text-white shrink-0 hover:bg-blue-700"
                  >
                    + Aksesoris
                  </button>
                </div>

                {/* Quick Qoala Button */}
                {suggestedQoala && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> {suggestedQoala.Tier_ID}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onAddQoalaToCart(suggestedQoala, 12)}
                        className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white"
                      >
                        + Qoala 12B ({formatRupiah(suggestedQoala.Premi_12_Bln)})
                      </button>
                      <button
                        onClick={() => onAddQoalaToCart(suggestedQoala, 24)}
                        className="rounded bg-emerald-800 px-2 py-1 text-[11px] font-bold text-white"
                      >
                        + 24B
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Items List */}
              {cart.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  Keranjang simulasi masih kosong. Pilih unit dari{" "}
                  <strong>Comparison Matrix</strong>, <strong>E-Catalog</strong>, atau tombol{" "}
                  <strong>+ Unit</strong> di atas.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white">
                            {item.sku}
                          </span>
                          {item.bestSeller && (
                            <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-slate-950">
                              BEST SELLER
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-extrabold text-slate-900 truncate mt-1">
                          {item.name}
                        </p>
                        <p className="text-xs font-bold text-blue-700">
                          {formatRupiah(item.price * item.qty)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onUpdateQty(item.id, -1)}
                          className="rounded-lg border border-slate-300 bg-white p-1 hover:bg-slate-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                        <button
                          onClick={() => onUpdateQty(item.id, 1)}
                          className="rounded-lg border border-slate-300 bg-white p-1 hover:bg-slate-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="rounded-lg p-1 text-rose-500 hover:bg-rose-50 ml-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Custom Item Adder */}
            <div className="pt-3 border-t border-slate-200">
              <p className="text-[11px] font-bold text-slate-500 mb-1.5">
                Tambah Item Manual / Promo Khusus Toko:
              </p>
              <div className="grid grid-cols-12 gap-1.5 text-xs">
                <input
                  type="text"
                  placeholder="Nama Item"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="col-span-5 rounded-lg border border-slate-300 px-2 py-1.5"
                />
                <input
                  type="text"
                  placeholder="SKU"
                  value={manualSku}
                  onChange={(e) => setManualSku(e.target.value)}
                  className="col-span-3 rounded-lg border border-slate-300 px-2 py-1.5"
                />
                <input
                  type="number"
                  placeholder="Harga"
                  value={manualPrice || ""}
                  onChange={(e) => setManualPrice(Number(e.target.value) || 0)}
                  className="col-span-3 rounded-lg border border-slate-300 px-2 py-1.5"
                />
                <button
                  onClick={() => {
                    if (manualName && manualPrice > 0) {
                      onAddManualItem(manualName, manualSku || "MANUAL-SKU", manualPrice);
                      setManualName("");
                      setManualSku("");
                      setManualPrice(0);
                    }
                  }}
                  className="col-span-1 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* ZONE 2: TRADE-IN LAKU6, VOUCHER & SPLIT PAYMENT (3 Cols) */}
          <div className="xl:col-span-3 rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Zona 2 • Potongan & Laku6
            </h3>

            {/* Trade-In Laku6 */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900">
                <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
                <span>Trade-In Laku6 (Mau Jual)</span>
              </div>
              <select
                value={selectedTradeInId}
                onChange={(e) => setSelectedTradeInId(e.target.value)}
                className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-2 text-xs font-semibold"
              >
                <option value="">-- Tidak Ada Trade-In --</option>
                {tradeInDevices.map((t) => (
                  <option key={t.TradeIn_ID} value={t.TradeIn_ID}>
                    {t.Tipe_Device_Lama}
                  </option>
                ))}
              </select>

              {selectedTradeInId && (
                <>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["A", "B", "C"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setTradeInGrade(g)}
                        className={`rounded-lg py-1.5 text-xs font-bold border ${
                          tradeInGrade === g
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-white text-slate-700 border-slate-300"
                        }`}
                      >
                        Grade {g}
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] bg-white rounded-lg p-2 border border-amber-200 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Taksiran HP:</span>
                      <span className="font-bold">{formatRupiah(tradeInValuation.base)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>Bonus Top-Up:</span>
                      <span className="font-bold">+{formatRupiah(tradeInValuation.bonus)}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-slate-900 pt-1 border-t">
                      <span>Total Potongan:</span>
                      <span>-{formatRupiah(tradeInValuation.total)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Promo / Cashback Bank (Rp)
                </label>
                <input
                  type="number"
                  value={bankCashback || ""}
                  placeholder="0"
                  onChange={(e) => setBankCashback(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Voucher Toko / Gift Voucher (Rp)
                </label>
                <input
                  type="number"
                  value={storeVoucher || ""}
                  placeholder="0"
                  onChange={(e) => setStoreVoucher(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Redeem Poin MAPCLUB (1 Poin = Rp 1)
                </label>
                <input
                  type="number"
                  value={mapclubPoints || ""}
                  placeholder="0"
                  onChange={(e) => setMapclubPoints(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  DP / Split Payment Tunai-Debit-QRIS (Rp)
                </label>
                <input
                  type="number"
                  value={splitDpCash || ""}
                  placeholder="0"
                  onChange={(e) => setSplitDpCash(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
              </div>
            </div>
          </div>

          {/* ZONE 3: GRAND TOTAL, SKEMA CICILAN & HANDOVER KASIR ETP (4 Cols) */}
          <div className="xl:col-span-4 rounded-2xl bg-slate-900 text-white p-5 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-blue-300 uppercase tracking-wider">
                Zona 3 • Ringkasan & Cicilan
              </h3>

              {/* Grand Total Summary Box */}
              <div className="rounded-xl bg-white/10 border border-white/15 p-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal Belanja ({cart.reduce((s, i) => s + i.qty, 0)} item):</span>
                  <span className="font-bold text-white">{formatRupiah(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-amber-300">
                  <span>Total Pengurang (Trade-In + Promo + DP):</span>
                  <span className="font-bold">-{formatRupiah(totalDeductions)}</span>
                </div>
                <div className="pt-2 border-t border-white/15 flex items-baseline justify-between">
                  <span className="text-xs font-bold uppercase text-slate-300">
                    Sisa Tagihan (Net):
                  </span>
                  <span className="text-2xl font-black text-emerald-400">
                    {formatRupiah(netPayable)}
                  </span>
                </div>
              </div>

              {/* Payment Method Tabs */}
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-800 p-1 text-xs">
                <button
                  onClick={() => setPayMethodTab("CC")}
                  className={`rounded-lg py-2 font-bold flex items-center justify-center gap-1 transition ${
                    payMethodTab === "CC" ? "bg-blue-600 text-white" : "text-slate-400"
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" /> CC 0%
                </button>
                <button
                  onClick={() => setPayMethodTab("BNPL")}
                  className={`rounded-lg py-2 font-bold flex items-center justify-center gap-1 transition ${
                    payMethodTab === "BNPL" ? "bg-purple-600 text-white" : "text-slate-400"
                  }`}
                >
                  <Wallet className="h-3.5 w-3.5" /> BNPL
                </button>
                <button
                  onClick={() => setPayMethodTab("CASH")}
                  className={`rounded-lg py-2 font-bold flex items-center justify-center gap-1 transition ${
                    payMethodTab === "CASH" ? "bg-emerald-600 text-white" : "text-slate-400"
                  }`}
                >
                  <Banknote className="h-3.5 w-3.5" /> Cash/QRIS
                </button>
              </div>

              {/* CC 0% Breakdown */}
              {payMethodTab === "CC" && (
                <div className="space-y-2.5 text-xs">
                  <select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 font-bold text-white"
                  >
                    {bankPromos.map((b) => (
                      <option key={b.Bank_ID} value={b.Bank_ID}>
                        {b.Nama_Bank}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-blue-300">{activeBank.Catatan_Promo}</p>

                  <div className="rounded-xl bg-slate-800/80 border border-slate-700 divide-y divide-slate-700/80">
                    {activeBank.Tenor_Tersedia.map((tenor) => (
                      <div key={tenor} className="px-3.5 py-2.5 flex items-center justify-between">
                        <span className="font-semibold text-slate-300">{tenor} Bulan (0%)</span>
                        <span className="text-sm font-black text-white">
                          {formatRupiah(calcMonthlyInstallment(netPayable, tenor, 0))}
                          <span className="text-[11px] font-normal text-slate-400">/bln</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BNPL Breakdown */}
              {payMethodTab === "BNPL" && (
                <div className="space-y-2.5 text-xs">
                  <select
                    value={selectedBnplId}
                    onChange={(e) => setSelectedBnplId(e.target.value)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 font-bold text-white"
                  >
                    {bnplProviders.map((p) => (
                      <option key={p.BNPL_ID} value={p.BNPL_ID}>
                        {p.Nama_Provider} (Est. {p.Bunga_Bulanan_Pct}%/bln)
                      </option>
                    ))}
                  </select>

                  <div className="rounded-xl bg-slate-800/80 border border-slate-700 divide-y divide-slate-700/80">
                    {activeBnpl.Tenor_Tersedia.map((tenor) => (
                      <div key={tenor} className="px-3.5 py-2.5 flex items-center justify-between">
                        <span className="font-semibold text-slate-300">{tenor} Bulan</span>
                        <span className="text-sm font-black text-purple-300">
                          {formatRupiah(
                            calcMonthlyInstallment(
                              netPayable,
                              tenor,
                              activeBnpl.Bunga_Bulanan_Pct,
                              activeBnpl.Biaya_Admin
                            )
                          )}
                          <span className="text-[11px] font-normal text-slate-400">/bln</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CASH / DEBIT / QRIS */}
              {payMethodTab === "CASH" && (
                <div className="rounded-xl bg-emerald-950/60 border border-emerald-700/60 p-4 space-y-2 text-xs">
                  <p className="font-bold text-emerald-300">Pembayaran Penuh Tunai / Debit / QRIS</p>
                  <p className="text-slate-300">
                    Total yang dibayarkan di kasir ETP:{" "}
                    <strong className="text-white">{formatRupiah(netPayable)}</strong>
                  </p>
                  <p className="text-amber-300 font-semibold">
                    Estimasi Tambahan Poin MAPCLUB: +{Math.floor(netPayable / 1000).toLocaleString("id-ID")} Poin
                  </p>
                </div>
              )}
            </div>

            {/* Handover to Cashier ETP Button */}
            <button
              disabled={cart.length === 0}
              onClick={() => setShowEtpModal(true)}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 py-3.5 px-4 text-sm font-black text-slate-950 shadow-lg flex items-center justify-center gap-2 transition"
            >
              <Receipt className="h-4 w-4" />
              <span>Proses ke Kasir — Tampilkan Kode SKU ETP</span>
            </button>
          </div>
        </div>
      )}

      {/* ETP CASHIER HANDOVER MODAL */}
      {showEtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-extrabold">Ringkasan Kode Artikel (SKU) Kasir ETP</h3>
                  <p className="text-xs text-slate-400">
                    Tunjukkan layar ini ke kasir untuk input transaksi ETP
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEtpModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-extrabold text-slate-700">Kode SKU / Artikel</th>
                      <th className="p-3 font-extrabold text-slate-700">Nama Produk</th>
                      <th className="p-3 font-extrabold text-slate-700 text-center">Qty</th>
                      <th className="p-3 font-extrabold text-slate-700 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3 font-mono font-bold text-blue-700">{item.sku}</td>
                        <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                        <td className="p-3 text-center font-bold">{item.qty}</td>
                        <td className="p-3 text-right font-bold">
                          {formatRupiah(item.price * item.qty)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal Item:</span>
                  <span className="font-bold">{formatRupiah(cartSubtotal)}</span>
                </div>
                {tradeInValuation.total > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Trade-In Laku6 ({tradeInValuation.label}):</span>
                    <span className="font-bold">-{formatRupiah(tradeInValuation.total)}</span>
                  </div>
                )}
                {bankCashback > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Promo / Cashback Bank:</span>
                    <span className="font-bold">-{formatRupiah(bankCashback)}</span>
                  </div>
                )}
                {storeVoucher > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Voucher Toko:</span>
                    <span className="font-bold">-{formatRupiah(storeVoucher)}</span>
                  </div>
                )}
                {mapclubPoints > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Redeem Poin MAPCLUB:</span>
                    <span className="font-bold">-{formatRupiah(mapclubPoints)}</span>
                  </div>
                )}
                {splitDpCash > 0 && (
                  <div className="flex justify-between text-blue-700">
                    <span>Split Payment Awal (Cash/Debit/QRIS):</span>
                    <span className="font-bold">-{formatRupiah(splitDpCash)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>SISA PEMBIAYAAN ({payMethodTab}):</span>
                  <span className="text-blue-700">{formatRupiah(netPayable)}</span>
                </div>
              </div>

              <button
                onClick={() => setShowEtpModal(false)}
                className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-800"
              >
                Tutup Layar SKU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
