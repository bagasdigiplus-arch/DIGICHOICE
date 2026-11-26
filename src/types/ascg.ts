export type SegmenTarget = "Base/Entry" | "Pro/Flagship" | "Ecosystem";

export type AppleLobCategory = "iPhone" | "iPad" | "MacBook" | "Apple Watch" | "AirPods";

export type AccessoryCategory5 =
  | "Casing"
  | "Adapter & Kabel"
  | "Screen Protector"
  | "Lens Protector"
  | "Apple Watch Strap";

export interface MasterDevice {
  Device_ID: string;
  SAP_Article: string;
  Barcode_EAN: string;
  Kategori: AppleLobCategory;
  Seri_Keluarga: string;
  Model_Varian: string;
  Segmen_Target: SegmenTarget;
  Storage: string;
  MSRP_Normal: number;
  Harga_SRP_Promo: number;
  Casing_Compatibility_Tier: string;
  Layar_Refresh_Rate: string;
  Chipset_AI: string;
  Kamera_Utama: string;
  Baterai_Port: string;
  Material: string;
  Remarks?: string;
}

export interface PricelistDeviceRow {
  SAP_Article: string;
  SAP_Description: string;
  Category: AppleLobCategory;
  Seri_Group: string;
  Normal_Price: number;
  Promotion_Price: number;
  Remarks: string;
  Status: "Active" | "Promo" | "EOL";
}

export interface ComparisonItem {
  Compare_Group_ID: string;
  Kategori_Komparasi: string;
  Device_ID: string;
  SAP_Article?: string;
  Seri_Model_Varian: string;
  Segmen_Target: SegmenTarget;
  Harga_SRP_Normal: number;
  Harga_Promo_Cash: number;
  Upgrade_Delta_Cash: number;
  Kebutuhan_Utama_Tags: string;
  What_You_Gain_1: string;
  What_You_Gain_2: string;
  What_You_Gain_3: string;
  Layar_dan_Refresh_Rate: string;
  Chipset_dan_Apple_Intelligence: string;
  Sistem_Kamera_dan_Video: string;
  Baterai_dan_Konektivitas: string;
  Material_dan_Ketahanan: string;
  Best_For_Profile: string;
  Rekomendasi_Casing_Tier: string;
  Rekomendasi_Bundle_ID: string;
}

export interface LobDevice {
  LOB_ID: string;
  Kategori_LOB: "LOB iPhone" | "LOB iPad" | "LOB MacBook" | "LOB Apple Watch" | "LOB AirPods";
  Seri_atau_Lini: string;
  Model_Varian: string;
  Tahun_Rilis: string;
  Opsi_Storage: string;
  Layar_atau_Desain: string;
  Chipset_dan_Spec: string;
  Apple_Intelligence: string;
  Fitur_Utama: string;
  Baterai_dan_Port: string;
  Gap_vs_Seri_Baru_Toko: string;
  Rekomendasi_Upgrade_Terdekat: string;
}

export interface AccessoryItem {
  Acc_ID: string;
  SAP_Article: string;
  Barcode_EAN: string;
  Kategori_Aksesoris: AccessoryCategory5 | "Screen & Lens Protector" | "Audio / AirPods";
  LOB_Target?: AppleLobCategory | "Universal";
  Tier_Casing: string;
  Merek: string;
  Nama_Produk: string;
  Label_Best_Seller: "BEST SELLER" | "Regular";
  Tag_Value_Utama: string[];
  Kompatibilitas_Segmen: string;
  Harga_Normal: number;
  Harga_Promo: number;
  Material_Proteksi: string;
}

export interface PricelistAccessoryRow {
  Brand: string;
  SAP_Article: string;
  SAP_Description: string;
  Category: string;
  Reference_SRP: number;
  Current_SRP_Cash: number;
  Repricing_Cash: number;
  Remarks: string;
}

export interface EssentialBundleItem {
  Bundle_ID: string;
  Kategori_Blok: AccessoryCategory5;
  Segmen_Target: SegmenTarget;
  LOB_Target: AppleLobCategory;
  SAP_Article: string;
  Merek: string;
  Nama_Item: string;
  Tier_Casing: string;
  Label_Best_Seller: "BEST SELLER" | "Regular";
  Tag_Value: string[];
  Harga_Cash: number;
  Alasan_Rekomendasi: string;
}

export interface QoalaTier {
  Tier_ID: string;
  Kode_Tier:
    | "KLABRONZE"
    | "KLASILVER"
    | "KLAGOLD"
    | "KLAEMERALD"
    | "KLADIAMOND"
    | "KLAPLATINUM"
    | "KLATITANIUM"
    | "KLAVVIP";
  Nama_Paket: string;
  Min_Harga: number;
  Max_Harga: number;
  Premi_12_Bln: number;
  Premi_18_Bln: number;
  Premi_24_Bln: number;
  SKU_12_Bln: string;
  SKU_18_Bln: string;
  SKU_24_Bln: string;
  Deductible: string;
  Cakupan: string;
}

export interface BankPromo {
  Bank_ID: string;
  Nama_Bank: string;
  Tenor_Tersedia: number[];
  Bunga_Pct: number;
  Min_Transaksi: number;
  Catatan_Promo: string;
}

export interface BnplProvider {
  BNPL_ID: string;
  Nama_Provider: string;
  Tenor_Tersedia: number[];
  Bunga_Bulanan_Pct: number;
  Biaya_Admin: number;
  Min_DP_Pct: number;
}

export interface TradeInDevice {
  TradeIn_ID: string;
  Tipe_Device_Lama: string;
  Harga_Grade_A: number;
  Bonus_TopUp: number;
}

export interface CartItem {
  id: string;
  sku: string;
  name: string;
  category: "Device" | "Accessory" | "Qoala" | "Manual";
  segmen?: SegmenTarget;
  brand?: string;
  bestSeller?: boolean;
  price: number;
  qty: number;
}
