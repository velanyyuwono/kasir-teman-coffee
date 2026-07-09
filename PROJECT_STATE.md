# PROJECT_STATE.md

# Kasir Teman Coffee — Project State

**Project:** Kasir Teman Coffee  
**Versi:** 0.9.6  
**Status:** 🟢 Live — Dipakai Operasional Harian Sejak 8 Juli 2026  
**Terakhir Diperbarui:** 08 Juli 2026

---

## 🤖 Instruksi untuk AI

1. Baca `CLAUDE.md` — standar koding dan desain.
2. Baca `PROJECT_STATE.md` — kondisi terkini.
3. Baca `CHANGELOG.md` — riwayat perubahan.
4. Lanjutkan pekerjaan pada bagian **🔥 Sedang Dikerjakan**.
5. Jangan menghapus fitur yang sudah ada tanpa persetujuan.
6. Setelah selesai: perbarui dokumentasi, beri ringkasan, daftar file yang diubah, commit message.

---

## 🔥 Sedang Dikerjakan

- (kosong — sistem live, menunggu temuan dari operasional harian)

---

## 🎯 Backlog (Belum Diprioritaskan)

1. Membership / poin pelanggan — **PENDING** atas keputusan pemilik
2. QRIS otomatis — **DIBATALKAN** (tidak ada akun merchant; QRIS tetap statis/manual)
3. Edit harga menu dari HTML — **DIBATALKAN** (kebijakan: harga hanya diubah pemilik via Google Sheet)

---

## ✅ Sudah Selesai

### Printer & Cetak

- [x] Printer thermal EPPOS RPP02N (Bluetooth, 58mm) tersambung via aplikasi RawBT
- [x] **Cetak Langsung** — kirim ESC/POS mentah ke RawBT via Android Intent, tanpa dialog print
- [x] Cetak ulang struk dari riwayat nota kapan saja
- [x] Cetak via dialog browser tetap tersedia sebagai cadangan
- [x] CSS `@page` 58mm — perbaiki bug ukuran kertas untuk jalur cetak cadangan

### Performa

- [x] Simpan nota: 2 panggilan server → 1 panggilan (validasi stok digabung ke `simpanNota()`)
- [x] Cache menu di localStorage — halaman kasir tampil instan, sinkron di belakang layar

### Data Operasional

- [x] `resetSemuaData()` — reset total (backup dulu → kosongkan transaksi → saldo stok baru) untuk mulai operasional bersih
- [x] Saldo awal 33 bahan disinkronkan ke posisi akhir 8 Juli 2026 dari catatan Excel pemilik
- [x] Sistem **live** dipakai sejak 8 Juli 2026

### Aplikasi Kasir (index.html)

- [x] Login kasir — pilih nama; otomatis terisi di transaksi, stok, kas
- [x] Navigasi bawah: Dashboard / Kasir / Riwayat
- [x] Dashboard: hari ini, bulan ini, grafik 7 hari, top 5 menu, performa kasir
- [x] Kasir: filter kategori, badge qty, keranjang (hapus per item, kosongkan semua)
- [x] Validasi stok sebelum simpan — 1 panggilan server, drawer peringatan detail
- [x] Pembayaran: Tunai/QRIS/Transfer, quick pay Rp10–100rb, hitung kembalian
- [x] Struk: nomor urut item, Total Item, nama kasir, TEMAN COFFEE
- [x] Soft-cancel nota + audit siapa & kapan membatalkan
- [x] Rekap & Riwayat: satu area scroll utuh, kartu responsif
- [x] Manajemen menu: lihat per kategori, tambah baru, toggle aktif/nonaktif
- [x] Mode DEMO lengkap (termasuk validasi stok, dashboard, cetak)

### Backend (Code.gs)

- [x] Transaksi + LockService + auto-numbering + kolom KASIR
- [x] Potong stok dari resep + reversal saat batal
- [x] Audit trail LOG BATAL (append-only)
- [x] Manajemen menu: `getDaftarMenu`, `tambahMenu`, `toggleAktifMenu`
- [x] `getDashboard()` — 1 kali baca untuk semua data dashboard
- [x] `setupSemua()` — pasang dari nol 1 langkah
- [x] `backupHarian()` + `setupBackupOtomatis()` — backup tiap hari 23:00
- [x] `arsipTahunLalu()` — arsip data tahun lalu, saldo stok tetap akurat
- [x] `rapikanSemuaSheet()` + `rapikanNotaItem()` — percantik semua sheet data tanpa sentuh data
- [x] `resetSemuaData()` — reset total untuk mulai operasional baru

### Tampilan Sheet Google Spreadsheet

- [x] NOTA & ITEM: header biru-putih, zebra, filter otomatis per kolom, baris BATAL memerah otomatis, format Rp & tanggal
- [x] STOK_MUTASI: warna per jenis (Masuk hijau, Keluar merah, Koreksi kuning)
- [x] KAS: dropdown Kategori & Kasir anti salah ketik
- [x] LOG BATAL, STOK MASUK, OPNAME, STOK: header rapi, lebar kolom proporsional
- [x] Catatan penjelas di sel A1 setiap sheet data

### Laporan Google Sheet (semua format vertikal)

- [x] REKAP HARIAN — per menu + ringkasan bulanan (rumus laci sudah diperbaiki)
- [x] LAPORAN PENJUALAN — per hari + kas keluar + laci (bug bulan pendek sudah diperbaiki)
- [x] LAPORAN PEMAKAIAN — per bahan lengkap
- [x] REKAP SELISIH BULANAN — per bahan + rata-rata opname
- [x] REKAP TAHUNAN — tren 12 bulan dalam 1 layar
- [x] Kapasitas 60 baris via `LAPORAN_BARIS`
- [x] Sheet usang (2 varian nama) sudah dihapus dari sistem

---

## 🐛 Bug yang Diketahui

_(tidak ada bug terbuka saat ini)_

---

## 🗓️ Rutinitas Pemeliharaan

| Kapan | Apa | Fungsi |
|---|---|---|
| Otomatis tiap hari 23:00 | Backup ke Drive | `backupHarian()` (trigger) |
| Setiap awal Januari | Arsipkan data tahun lalu | `arsipTahunLalu()` |
| Jika menu/bahan > 60 | Naikkan kapasitas laporan | ubah `LAPORAN_BARIS`, jalankan `setupSemuaLaporan()` |
| Sesekali (opsional) | Percantik ulang sheet data | `rapikanSemuaSheet()` |

---

## 🏗️ Struktur Project

```
kasir-teman-coffee/
├── Code.gs           → Backend Google Apps Script
├── index.html        → Frontend kasir (HTML + CSS + JS, satu file)
├── PROJECT_STATE.md  → Status project (file ini)
├── CLAUDE.md         → Panduan koding untuk AI
├── CHANGELOG.md      → Riwayat perubahan
└── README.md         → Deskripsi project
```

**Sheet data:** MENU, NOTA, ITEM, STOK, STOK_MUTASI, RESEP, OPNAME, KAS, STOK MASUK, LOG BATAL  
**Sheet laporan:** REKAP HARIAN, LAPORAN PENJUALAN, LAPORAN PEMAKAIAN, REKAP SELISIH BULANAN, REKAP TAHUNAN

**Printer:** EPPOS RPP02N (Bluetooth 58mm) via aplikasi RawBT — cetak langsung ESC/POS dari aplikasi kasir.

---

## 📌 Teknologi

| Layer | Teknologi |
|---|---|
| Backend | Google Apps Script |
| Frontend | HTML + CSS + JS (vanilla) |
| Database | Google Spreadsheet |
| Hosting | Google Apps Script Web App |
| Cetak | RawBT (ESC/POS via Android Intent) |
