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
  const [paymentMethod, setPaymentMethod] = useState<"FULL" | "CC_0" | "BNPL">(
    "CC_0"
  );
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

  // Bank Promo Discount
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
        selectedBnpl?.Bunga_Bulanan_Pct ?? selectedBnpl?.Bunga_Persen ?? 1.99
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
