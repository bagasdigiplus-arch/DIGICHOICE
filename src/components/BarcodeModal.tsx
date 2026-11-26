"use client";

import React, { useState, useEffect } from "react";
import { X, ScanBarcode, Search, PlusCircle, CheckCircle2, Smartphone, ShieldCheck } from "lucide-react";
import { MasterDevice, AccessoryItem } from "@/types/ascg";
import { formatRupiah } from "@/utils/formatters";

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: MasterDevice[];
  accessories: AccessoryItem[];
  onAddDeviceToCart: (device: MasterDevice) => void;
  onAddAccToCart: (acc: AccessoryItem) => void;
}

export default function BarcodeModal({
  isOpen,
  onClose,
  devices,
  accessories,
  onAddDeviceToCart,
  onAddAccToCart,
}: BarcodeModalProps) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBarcodeInput("");
      setAddedFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const query = barcodeInput.trim().toLowerCase();

  const matchedDevice = query
    ? devices.find(
        (d) =>
          d.Barcode_EAN.toLowerCase().includes(query) ||
          d.Device_ID.toLowerCase().includes(query) ||
          d.Model_Varian.toLowerCase().includes(query)
      )
    : null;

  const matchedAcc =
    query && !matchedDevice
      ? accessories.find(
          (a) =>
            a.Barcode_EAN.toLowerCase().includes(query) ||
            a.Acc_ID.toLowerCase().includes(query) ||
            a.Nama_Produk.toLowerCase().includes(query)
        )
      : null;

  const sampleBarcodes = [
    { label: "iPhone 17 Pro 256GB", code: "195950223301" },
    { label: "iPhone 16 Base 128GB", code: "195949612305" },
    { label: "Zagg Crystal Palace", code: "840056190201" },
    { label: "Mutural MagSafe Matte", code: "6971234500102" },
  ];

  const handleAdd = () => {
    if (matchedDevice) {
      onAddDeviceToCart(matchedDevice);
      setAddedFeedback(matchedDevice.Model_Varian);
    } else if (matchedAcc) {
      onAddAccToCart(matchedAcc);
      setAddedFeedback(matchedAcc.Nama_Produk);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <ScanBarcode className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold">Scan Barcode EAN / UPC / Kode SKU</h3>
              <p className="text-xs text-slate-400">
                Pindai dengan scanner Bluetooth atau ketik kode barcode kotak produk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={barcodeInput}
              onChange={(e) => {
                setBarcodeInput(e.target.value);
                setAddedFeedback(null);
              }}
              placeholder="Scan atau ketik Barcode EAN / Device ID / Acc ID..."
              className="w-full rounded-xl border-2 border-blue-500 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium focus:bg-white focus:outline-none"
            />
          </div>

          {/* Quick Test Chips */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Simulasi Cepat Scan Kotak Produk:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sampleBarcodes.map((s) => (
                <button
                  key={s.code}
                  onClick={() => setBarcodeInput(s.code)}
                  className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition"
                >
                  {s.label} ({s.code})
                </button>
              ))}
            </div>
          </div>

          {/* Result Card */}
          {matchedDevice && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-blue-600 p-2 text-white">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="inline-block rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">
                      SKU: {matchedDevice.Device_ID} • EAN: {matchedDevice.Barcode_EAN}
                    </span>
                    <h4 className="mt-1 text-base font-bold text-slate-900">
                      {matchedDevice.Model_Varian} ({matchedDevice.Storage})
                    </h4>
                    <p className="text-xs text-slate-600">{matchedDevice.Chipset_AI}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 line-through">
                    {formatRupiah(matchedDevice.MSRP_Normal)}
                  </p>
                  <p className="text-base font-extrabold text-blue-700">
                    {formatRupiah(matchedDevice.Harga_SRP_Promo)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-blue-200/70">
                <span className="text-xs font-medium text-slate-600">
                  Casing Cocok: <strong>{matchedDevice.Casing_Compatibility_Tier}</strong>
                </span>
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                >
                  <PlusCircle className="h-4 w-4" />
                  Tambah ke Simulasi Cart
                </button>
              </div>
            </div>
          )}

          {matchedAcc && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-emerald-600 p-2 text-white">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">
                        SKU: {matchedAcc.Acc_ID}
                      </span>
                      {matchedAcc.Label_Best_Seller === "BEST SELLER" && (
                        <span className="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          BEST SELLER
                        </span>
                      )}
                    </div>
                    <h4 className="mt-1 text-base font-bold text-slate-900">
                      {matchedAcc.Nama_Produk}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {matchedAcc.Merek} • {matchedAcc.Tier_Casing} ({matchedAcc.Kompatibilitas_Segmen})
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-extrabold text-emerald-700">
                    {formatRupiah(matchedAcc.Harga_Promo)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-emerald-200/70">
                <span className="text-xs text-slate-600">{matchedAcc.Material_Proteksi}</span>
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                >
                  <PlusCircle className="h-4 w-4" />
                  Tambah ke Simulasi Cart
                </button>
              </div>
            </div>
          )}

          {query && !matchedDevice && !matchedAcc && (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Kode barcode atau SKU <strong>"{barcodeInput}"</strong> tidak ditemukan di master database.
            </div>
          )}

          {addedFeedback && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-xs font-semibold text-white">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Berhasil menambahkan "{addedFeedback}" ke Simulasi Pembayaran!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
