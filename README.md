# Kasir Teman Coffee ☕

Sistem POS (Point of Sale) untuk **Teman Coffee**, Pasuruan.  
Dibangun di atas Google Apps Script + Google Spreadsheet. Tidak butuh server, tidak butuh biaya hosting.

---

## Fitur Utama

- **Kasir** — input pesanan cepat, filter kategori, badge qty di tiap menu
- **Keranjang** — tambah/kurang item, pilih kasir yang melayani, metode bayar (Tunai / QRIS / Transfer), hitung kembalian otomatis
- **Quick Pay** — tombol Rp10rb / Rp20rb / Rp50rb / Rp100rb + Uang Pas
- **Validasi Stok** — peringatan otomatis jika bahan tidak cukup sebelum nota disimpan
- **Struk** — cetak struk thermal 58mm langsung dari browser, mencantumkan nama kasir
- **Soft-cancel** — nota dicoret (tidak dihapus), saldo stok otomatis dikembalikan
- **Stok** — kartu stok otomatis, opname real-time via Google Sheet, potong stok dari resep
- **Kas** — catat pengeluaran tunai harian per kategori dan kasir
- **Rekap Harian** — omzet, per metode bayar, kas keluar, uang di laci — langsung dari HTML
- **Laporan Google Sheet** — format vertikal, mudah dibaca, ganti bulan cukup ubah 1 sel
- **Mode DEMO** — bisa dicoba tanpa koneksi ke Spreadsheet

---

## Struktur File

```
kasir-teman-coffee/
├── Code.gs          → Backend Google Apps Script
├── index.html       → Frontend kasir (HTML + CSS + JS, satu file)
├── PROJECT_STATE.md → Status & roadmap project
├── CLAUDE.md        → Panduan untuk AI / developer
├── CHANGELOG.md     → Riwayat perubahan
└── README.md        → File ini
```

---

## Sheet di Google Spreadsheet

| Sheet | Keterangan |
|---|---|
| MENU | Daftar menu aktif (nama, kategori, harga) |
| NOTA | Header setiap transaksi |
| ITEM | Rincian item per transaksi |
| STOK | Kartu stok dengan saldo otomatis |
| STOK_MUTASI | Jurnal semua gerakan stok (Masuk/Keluar/Koreksi) |
| RESEP | Pemakaian bahan per menu per gelas |
| OPNAME | Input stok fisik — koreksi otomatis saat diisi |
| KAS | Catatan pengeluaran tunai harian |
| STOK MASUK | Log restock dari HTML kasir |
| REKAP HARIAN | Per menu: QTY & omzet bulan ini + ringkasan |
| LAPORAN PENJUALAN | Per hari: nota, gelas, omzet, per metode, laci |
| LAPORAN PEMAKAIAN | Per bahan: saldo awal → masuk → pakai → akhir |
| REKAP SELISIH BULANAN | Selisih opname per bahan per bulan |

---

## Cara Pasang (Pertama Kali)

1. Buat Google Spreadsheet baru
2. Buka **Extensions → Apps Script**
3. Hapus kode default, paste seluruh isi `Code.gs`
4. Simpan → jalankan fungsi-fungsi setup berikut **secara berurutan**:

```
setupSheets()        ← buat header NOTA & ITEM
setupStok()          ← buat sheet STOK & STOK_MUTASI
setupResep()         ← buat sheet RESEP dengan resep awal
setupKas()           ← buat sheet KAS
setupOpname()        ← buat sheet OPNAME
setupStokMasuk()     ← buat sheet STOK MASUK
setupSemuaLaporan()  ← buat semua sheet laporan sekaligus
```

5. Kembali ke Apps Script → **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy URL deployment
7. Buka `index.html`, ganti nilai variabel `SCRIPT_URL` dengan URL tadi
8. Upload `index.html` ke Apps Script atau buka langsung via URL deployment

---

## Cara Update dari Versi Lama

Jika sudah ada data di sheet NOTA dari versi sebelumnya (sebelum v0.2.0):

```
migrasiKolomKasir()   ← sisipkan kolom KASIR tanpa hapus data lama
setupSemuaLaporan()   ← perbarui format laporan
```

---

## Versi

**v0.4.0** — 07 Juli 2026

Lihat [CHANGELOG.md](CHANGELOG.md) untuk riwayat lengkap.

---

## Kasir Aktif

Ansor · El · Gofur · Anwar

---

## Kontak

Teman Coffee — Pasuruan, Jawa Timur
