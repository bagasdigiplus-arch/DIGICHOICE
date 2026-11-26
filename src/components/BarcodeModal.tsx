"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Plus,
  ScanBarcode,
  Search,
  Smartphone,
  Shield,
  X,
} from "lucide-react";
import { AccessoryItem, MasterDevice } from "@/types/ascg";

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: MasterDevice[];
  accessories: AccessoryItem[];
  onAddDeviceToCart: (device: MasterDevice) => void;
  onAddAccToCart: (acc: AccessoryItem) => void;
}

const formatIDR = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);

const QUICK_SIMULATIONS = [
  { label: "iPhone 17 Pro 256GB (195950223301)", code: "195950223301" },
  { label: "iPhone 16 Base 128GB (195949612305)", code: "195949612305" },
  { label: "Zagg Crystal Palace (840056190201)", code: "840056190201" },
  { label: "Mutural MagSafe Matte (6971234500102)", code: "6971234500102" },
];

export default function BarcodeModal({
  isOpen,
  onClose,
  devices = [],
  accessories = [],
  onAddDeviceToCart,
  onAddAccToCart,
}: BarcodeModalProps) {
  const [query, setQuery] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  const stopCamera = () => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCameraError(null);
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCameraScanner = async () => {
    setCameraError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Browser tidak mendukung akses kamera. Gunakan scanner Bluetooth atau ketik manual.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);

      // Gunakan Native BarcodeDetector jika tersedia di browser (Chrome/Edge Android & Desktop)
      const DetectorClass = (window as any).BarcodeDetector;
      if (DetectorClass) {
        const detector = new DetectorClass({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
        });

        scanTimerRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              const detectedCode = String(barcodes[0].rawValue).trim();
              setQuery(detectedCode);
              stopCamera();
            }
          } catch {
            // Abaikan frame yang belum fokus
          }
        }, 350);
      } else {
        setCameraError(
          "Kamera aktif, namun auto-scan barcode tidak didukung browser ini (misal Safari iOS). Silakan arahkan barcode untuk referensi atau gunakan Chrome/Scanner Bluetooth."
        );
      }
    } catch {
      setCameraError("Izin kamera ditolak atau kamera tidak ditemukan pada perangkat.");
      stopCamera();
    }
  };

  const matchedResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { matchedDevices: [], matchedAcc: [] };

    const matchedDevices = devices.filter((d: any) => {
      const fields = [
        d.Barcode_EAN,
        d.EAN,
        d.SAP_Article,
        d.Device_ID,
        d.Model_Varian,
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      return fields.some((f) => f.includes(q));
    });

    const matchedAcc = accessories.filter((a: any) => {
      const fields = [
        a.Barcode_EAN,
        a.EAN,
        a.SAP_Article,
        a.Acc_ID,
        a.Nama_Produk,
        a.Merek,
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      return fields.some((f) => f.includes(q));
    });

    return {
      matchedDevices: matchedDevices.slice(0, 5),
      matchedAcc: matchedAcc.slice(0, 5),
    };
  }, [query, devices, accessories]);

  const handleFeedback = (label: string) => {
    setAddedFeedback(label);
    setTimeout(() => setAddedFeedback(null), 1800);
  };

  if (!isOpen) return null;

  const totalFound =
    matchedResults.matchedDevices.length + matchedResults.matchedAcc.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold">
                Scan Barcode EAN / UPC / Kode SKU
              </h3>
              <p className="text-[11px] text-slate-400">
                Pindai dengan kamera HP/iPad, scanner Bluetooth, atau ketik kode
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Camera Viewfinder */}
          {cameraActive && (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video border-2 border-blue-500">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-28 border-2 border-emerald-400 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center">
                  <div className="w-full h-0.5 bg-red-500 animate-pulse" />
                </div>
              </div>
              <div className="absolute bottom-2.5 inset-x-0 text-center text-[11px] font-semibold text-white drop-shadow">
                Arahkan barcode kotak Apple / aksesoris ke dalam kotak hijau
              </div>
            </div>
          )}

          {cameraError && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
              {cameraError}
            </div>
          )}

          {/* Input + Camera Toggle Button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Scan atau ketik Barcode EAN / Device ID / Acc ID..."
                className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border-2 border-blue-500/70 focus:border-blue-600 focus:outline-none text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={cameraActive ? stopCamera : startCameraScanner}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition ${
                cameraActive
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {cameraActive ? (
                <>
                  <CameraOff className="w-4 h-4" />
                  <span>Tutup</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Kamera</span>
                </>
              )}
            </button>
          </div>

          {addedFeedback && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              {addedFeedback} masuk ke Keranjang ETP!
            </div>
          )}

          {/* Search / Scan Results */}
          {query.trim() !== "" && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Hasil Pencarian ({totalFound})
              </div>

              {totalFound === 0 ? (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-500 text-center">
                  Kode <strong>{query}</strong> tidak ditemukan di Master Data saat ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {matchedResults.matchedDevices.map((d) => (
                    <div
                      key={d.Device_ID}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-blue-600 dark:text-blue-400">
                          <Smartphone className="w-3 h-3" />
                          <span>{d.SAP_Article}</span>
                          {(d as any).Barcode_EAN && (
                            <span>• EAN: {(d as any).Barcode_EAN}</span>
                          )}
                        </div>
                        <div className="text-xs font-bold truncate mt-0.5">
                          {d.Model_Varian} ({d.Storage})
                        </div>
                        <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatIDR(d.Harga_SRP_Promo)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onAddDeviceToCart(d);
                          handleFeedback(`${d.Model_Varian} (${d.Storage})`);
                        }}
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Cart
                      </button>
                    </div>
                  ))}

                  {matchedResults.matchedAcc.map((a) => (
                    <div
                      key={a.Acc_ID}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-600 dark:text-amber-400">
                          <Shield className="w-3 h-3" />
                          <span>{a.SAP_Article}</span>
                          {(a as any).Barcode_EAN && (
                            <span>• EAN: {(a as any).Barcode_EAN}</span>
                          )}
                        </div>
                        <div className="text-xs font-bold truncate mt-0.5">
                          {a.Merek} - {a.Nama_Produk}
                        </div>
                        <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatIDR(a.Harga_Promo)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onAddAccToCart(a);
                          handleFeedback(a.Nama_Produk);
                        }}
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Cart
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Simulations */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Simulasi Cepat Scan Kotak Produk:
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_SIMULATIONS.map((sim) => (
                <button
                  key={sim.code}
                  type="button"
                  onClick={() => setQuery(sim.code)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-blue-500/15 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition"
                >
                  {sim.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
