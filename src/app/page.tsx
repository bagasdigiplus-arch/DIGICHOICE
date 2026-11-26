"use client";

import React, { useEffect, useState } from "react";
import {
  Layers,
  ShieldCheck,
  Calculator,
  FileSpreadsheet,
  Upload,
  ScanBarcode,
  Sun,
  Moon,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import ComparisonMatrixView from "@/components/ComparisonMatrixView";
import AccessoriesCatalogView from "@/components/AccessoriesCatalogView";
import PaymentSimulatorView from "@/components/PaymentSimulatorView";
import MasterPricelistView from "@/components/MasterPricelistView";
import DataUploadModal from "@/components/DataUploadModal";
import BarcodeModal from "@/components/BarcodeModal";
import {
  SEED_MASTER_DEVICES,
  SEED_ACCESSORIES,
  SEED_QOALA_TIERS,
  SEED_BANK_PROMOS,
  SEED_BNPL_PROVIDERS,
  SEED_TRADEIN_DEVICES,
} from "@/data/seedData";
import {
  MasterDevice,
  AccessoryItem,
  QoalaTier,
  BankPromo,
  BnplProvider,
  TradeInDevice,
  CartItem,
} from "@/types/ascg";

type NavTab = "COMPARISON" | "ACCESSORIES" | "SIMULATOR" | "PRICELIST";

const STORAGE_KEY = "digi_choice_ascg_db_v1";

export default function DigiChoiceHomePage() {
  const [activeTab, setActiveTab] = useState<NavTab>("COMPARISON");
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isBarcodeOpen, setIsBarcodeOpen] = useState<boolean>(false);

  // Master Data States
  const [devices, setDevices] = useState<MasterDevice[]>(SEED_MASTER_DEVICES);
  const [accessories, setAccessories] =
    useState<AccessoryItem[]>(SEED_ACCESSORIES);
  const [qoalaTiers, setQoalaTiers] = useState<QoalaTier[]>(SEED_QOALA_TIERS);
  const [bankPromos, setBankPromos] = useState<BankPromo[]>(SEED_BANK_PROMOS);
  const [bnplProviders, setBnplProviders] =
    useState<BnplProvider[]>(SEED_BNPL_PROVIDERS);
  const [tradeInDevices, setTradeInDevices] = useState<TradeInDevice[]>(
    SEED_TRADEIN_DEVICES
  );

  // Unified ETP Consultation Cart
  const [cart, setCart] = useState<CartItem[]>([
    {
      id: "DEV-IP17PRO-256",
      sku: "APPMG8G4ID/A",
      name: "iPhone 17 Pro (256GB)",
      category: "Device",
      segmen: "Pro/Flagship",
      brand: "Apple",
      price: 23499000,
      qty: 1,
    },
  ]);

  // Apply Dark/Light theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  // Load persisted Master Data updates from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.devices) && parsed.devices.length)
          setDevices(parsed.devices);
        if (Array.isArray(parsed.accessories) && parsed.accessories.length)
          setAccessories(parsed.accessories);
        if (Array.isArray(parsed.qoalaTiers) && parsed.qoalaTiers.length)
          setQoalaTiers(parsed.qoalaTiers);
        if (Array.isArray(parsed.bankPromos) && parsed.bankPromos.length)
          setBankPromos(parsed.bankPromos);
        if (Array.isArray(parsed.bnplProviders) && parsed.bnplProviders.length)
          setBnplProviders(parsed.bnplProviders);
        if (
          Array.isArray(parsed.tradeInDevices) &&
          parsed.tradeInDevices.length
        )
          setTradeInDevices(parsed.tradeInDevices);
      }
    } catch {
      // Ignore storage error
    }
  }, []);

  const persistMaster = (next: {
    devices?: MasterDevice[];
    accessories?: AccessoryItem[];
    qoalaTiers?: QoalaTier[];
    bankPromos?: BankPromo[];
    bnplProviders?: BnplProvider[];
    tradeInDevices?: TradeInDevice[];
  }) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          devices: next.devices ?? devices,
          accessories: next.accessories ?? accessories,
          qoalaTiers: next.qoalaTiers ?? qoalaTiers,
          bankPromos: next.bankPromos ?? bankPromos,
          bnplProviders: next.bnplProviders ?? bnplProviders,
          tradeInDevices: next.tradeInDevices ?? tradeInDevices,
        })
      );
    } catch {
      // Ignore storage quota
    }
  };

  // Cart Actions
  const upsertCartItem = (newItem: Omit<CartItem, "qty">) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === newItem.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...prev, { ...newItem, qty: 1 }];
    });
  };

  const handleAddDeviceToCart = (device: MasterDevice) => {
    upsertCartItem({
      id: device.Device_ID,
      sku: device.SAP_Article,
      name: `${device.Model_Varian} (${device.Storage})`,
      category: "Device",
      segmen: device.Segmen_Target,
      brand: "Apple",
      price: device.Harga_SRP_Promo,
    });
  };

  const handleAddAccToCart = (acc: AccessoryItem) => {
    upsertCartItem({
      id: acc.Acc_ID,
      sku: acc.SAP_Article,
      name: `${acc.Merek} -${acc.Nama_Produk}`,
      category: "Accessory",
      brand: acc.Merek,
      bestSeller: acc.Label_Best_Seller === "BEST SELLER",
      price: acc.Harga_Promo,
    });
  };

  const handleAddQoalaToCart = (tier: QoalaTier, duration: 12 | 24) => {
    const sku = duration === 12 ? tier.SKU_12_Bln : tier.SKU_24_Bln;
    const price = duration === 12 ? tier.Premi_12_Bln : tier.Premi_24_Bln;
    upsertCartItem({
      id: `${tier.Tier_ID}-${duration}M`,
      sku,
      name: `Proteksi Qoala ${tier.Kode_Tier} (${duration} Bulan)`,
      category: "Qoala",
      brand: "Qoala",
      price,
    });
  };

  const handleAddManualItem = (name: string, sku: string, price: number) => {
    upsertCartItem({
      id: `MANUAL-${sku}-${Date.now()}`,
      sku,
      name,
      category: "Manual",
      price,
    });
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty + delta } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => setCart([]);

  const handleResetAllToDefault = () => {
    setDevices(SEED_MASTER_DEVICES);
    setAccessories(SEED_ACCESSORIES);
    setQoalaTiers(SEED_QOALA_TIERS);
    setBankPromos(SEED_BANK_PROMOS);
    setBnplProviders(SEED_BNPL_PROVIDERS);
    setTradeInDevices(SEED_TRADEIN_DEVICES);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const totalCartQty = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Top Sticky Glass Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-base sm:text-lg">
                  DIGI CHOICE
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Digimap Retail Suite
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
                Compare Smart, Bundle Right, Checkout Fast
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBarcodeOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-200/70 dark:bg-slate-900 hover:bg-blue-500/15 border border-slate-300/60 dark:border-slate-800 transition"
              title="Scan Barcode / Cari SAP Article"
            >
              <ScanBarcode className="w-4 h-4 text-blue-500" />
              <span className="hidden sm:inline">Scan Barcode</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-500/30 transition"
              title="Upload Excel / CSV Pricelist Digimap"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("SIMULATOR")}
              className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
              title="Buka Keranjang ETP & Simulasi Cicilan"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden md:inline">Keranjang ETP</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-white text-blue-700 font-extrabold">
                {totalCartQty}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="Toggle Dark/Light Mode"
              className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-300/60 dark:border-slate-800 hover:border-blue-500 transition"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Pill Bar */}
        <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("COMPARISON")}
              className={`px-
