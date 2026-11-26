# Apple Smart Choice Guide (ASCG) + AR Casing

Interactive Sales & Pre-Checkout Web App untuk toko retail Apple (**Digiplus**) yang dilengkapi:
1. **Comparison Matrix & LOB Reference**: Perbandingan varian iPhone/iPad/MacBook/Apple Watch terbaru + perbandingan spesifikasi perangkat lama customer (`LOB_Apple_Devices`) + rekomendasi **Essential Bundle** otomatis sesuai segmen (*Base/Entry* -> Casing Tier 1–3; *Pro/Flagship* -> Casing Tier 4–6).
2. **Price List & E-Catalog Accessories**: Katalog & perbandingan head-to-head aksesoris lengkap dengan badge **`BEST SELLER`**, tag keunggulan, dan tarif resmi **Proteksi Qoala (12 & 24 Bulan)**.
3. **Simulasi Pembayaran, Trade-In Laku6 & Mini-ETP Cart**: Kalkulator cicilan cepat mandiri maupun 3-zone cart lengkap dengan taksiran buyback **Laku6 (Grade A/B/C)**, Promo Bank, Voucher, Redeem Poin MAPCLUB, Split Payment, Cicilan CC 0% & BNPL, serta layar **Kode SKU Kasir ETP**.

## Cara Menghubungkan Google Sheets Live CSV (Opsional)
1. Buka Google Sheets **Master Database ASCG** dan **LOB_Apple_Devices**.
2. Klik **File -> Share -> Publish to web**.
3. Pilih tab spesifik dan format **Comma-separated values (.csv)**, lalu salin link-nya.
4. Di dashboard **Vercel -> Project Settings -> Environment Variables**, tambahkan variabel berikut:
   - `NEXT_PUBLIC_CSV_MASTER_DEVICES`
   - `NEXT_PUBLIC_CSV_COMPARISON_MATRIX`
   - `NEXT_PUBLIC_CSV_LOB_DEVICES`
   - `NEXT_PUBLIC_CSV_MASTER_ACCESSORIES`
5. Redeploy project di Vercel. Tanpa konfigurasi CSV pun, aplikasi tetap berjalan lancar menggunakan *Built-in Master Data*.
