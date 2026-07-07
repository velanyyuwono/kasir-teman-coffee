# CHANGELOG — TEKO KASIR

## [2026-07-07] Sesi besar: RESEP, Stok, OPNAME, KAS, Laporan, Tampilan

### Added
- **RESEP (BOM)** — awalnya konstanta di kode, dipindah jadi sheet **RESEP** (format panjang: 1 baris = 1 pasangan menu-bahan). Dropdown validasi MENU (dari sheet MENU) dan BAHAN (dari sheet STOK). Fungsi: `setupResep()`, `_bacaResep()`.
- **Potong stok otomatis saat jualan** — `simpanNota()` sekarang memanggil `_potongStokDariResep()`, membaca sheet RESEP, menulis baris "Keluar" ke STOK_MUTASI dengan keterangan `Auto — <idNota>`.
- **Reversal stok saat nota dibatalkan** — `batalkanNota()` memanggil `_batalkanPotonganStok()`, menulis baris "Masuk" penyeimbang (bukan menghapus jejak lama).
- **Kolom KOREKSI di sheet STOK** — `SALDO = SALDO AWAL + MASUK − KELUAR + KOREKSI`. Koreksi berasal dari opname.
- **Sheet OPNAME** — manual, isi TANGGAL/BAHAN/STOK FISIK, kolom STOK SISTEM & SELISIH otomatis. Dropdown BAHAN, validasi tanggal (kalender). Fungsi: `setupOpname()`.
- **Trigger `onEdit()` otomatis** — begitu STOK FISIK di OPNAME diisi, langsung hitung selisih dan tulis baris "Koreksi" ke STOK_MUTASI + tandai KETERANGAN "Diterapkan otomatis...". Tidak perlu tombol/fungsi manual lagi.
- **`terapkanOpname()`** — dipertahankan sebagai fungsi cadangan manual untuk kasus paste banyak baris sekaligus yang mungkin tidak lengkap tertangkap `onEdit`.
- **Sheet REKAP SELISIH BULANAN** — matriks bahan × tanggal, SUMIFS dari STOK_MUTASI jenis "Koreksi", kolom TOTAL = akumulasi selisih 1 bulan. Font merah untuk nilai negatif. Fungsi: `setupRekapSelisihBulanan()`.
- **Sheet STOK MASUK** — antrian restock: TANGGAL/BAHAN/QTY terisi otomatis dari tombol Masuk di HTML kasir; kolom HARGA/SATUAN dikosongkan, diisi manual oleh pemilik; baris tanpa harga disorot kuning. Fungsi: `setupStokMasuk()`.
- **Sheet KAS** — pengeluaran tunai harian (Es Batu/Beli Galon Air/Karyawan Bon/Uang Keluar Lainnya), per kasir (Ansor/El/Gofur/Anwar). Fungsi: `setupKas()`, `catatKas()`.
- **`rekapHari()` diperluas** — tambah `perMenu` (agregasi menu × qty × subtotal per hari), `kasKeluar`, `totalKasKeluar`, `uangDiLaci` (= totalOmzet − totalKasKeluar). Field lama tidak dihapus.
- **Panel Rekap di HTML** — tampil blok "Menu terjual hari ini" (flat, urut qty terbanyak), blok "Kas keluar hari ini", kartu "Total Kas Keluar" & "Uang di Laci". Riwayat nota lama tidak diubah.
- **Tombol 💰 Kas di HTML** — drawer pilih kategori + kasir + jumlah + keterangan, dengan `confirm()` sebelum kirim.
- **Konfirmasi sebelum simpan stok** — `simpanStok()` di HTML sekarang `confirm()` dulu (jenis, jumlah, satuan, bahan) sebelum kirim ke server.
- **`_polesSheet()`** — helper tampilan: judul abu-abu word-wrap, header biru tebal putih, banding warna selang-seling baris data. Dipasang di 10 sheet: RESEP, REKAP HARIAN, STOK, OPNAME, STOK MASUK, LAPORAN PENJUALAN, LAPORAN PEMAKAIAN, LAPORAN STOK MASUK, LAPORAN STOK KELUAR MANUAL, REKAP SELISIH BULANAN, KAS.
- **`hapusSemuaTransaksi()` diperluas** — sekarang juga mengosongkan STOK_MUTASI (dulu cuma NOTA+ITEM), supaya percobaan reset benar-benar bersih.

### Changed
- Palet warna Index.html: krem/coklat (`#f4ede4`/`#6f4e37`) → biru-teal cerah (`#eef2f7`/`#2563eb`), kategori menu dapat warna beda (Kopi biru, Non kopi ungu, Soda teal, Snack oranye).
- `setupStok()` — daftar bahan awal: **Bunga telang** dan **Jeruk bali** dihapus (menu Butterfly pea squash & Grapefruit squash tidak dijual lagi).
- RESEP (baik konstanta lama maupun sheet baru) — entri Butterfly pea squash & Grapefruit squash dihapus.
- `getStok()` — indeks kolom disesuaikan ulang setelah kolom KOREKSI disisipkan di STOK.

### Removed
- `setupLaporanKeluarLain()` / tab **LAPORAN KELUAR LAIN** — dihapus atas permintaan, lalu fungsinya dibangun ulang lebih jelas sebagai `setupLaporanStokMasuk()` + `setupLaporanStokKeluarManual()`.

### Rejected (didiskusikan, tidak dibangun)
- Desain "buku murni → drift → stok buku otomatis" (format OPNAME di 07_TEKO_CATATAN_JULI.xlsx) — ditolak karena rantai formula "cari tanggal opname terakhir per bahan" rapuh, sudah terbukti jadi sumber bug berulang di file Excel lama. Ledger + `onEdit` dipertahankan sebagai gantinya.
- "6 target akhir" (DASHBOARD, STOK MASUK+harga, HPP&LABA, BIAYA OPERASIONAL, STOK KONSENTRAT, TUTUP BULAN) — STOK MASUK dibangun versi ringan (qty saja, tanpa harga wajib), sehingga HPP & LABA dan DASHBOARD **tetap terblokir** sampai kolom HARGA/SATUAN benar-benar diisi rutin.
