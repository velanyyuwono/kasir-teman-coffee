# PROJECT_STATE.md

# Kasir Teman Coffee — Project State

**Project:** Kasir Teman Coffee  
**Versi:** 0.9.0  
**Status:** 🟢 Stabil — Dipakai Operasional Harian  
**Terakhir Diperbarui:** 08 Juli 2026

---

## 🤖 Instruksi untuk AI

Sebelum mulai bekerja:

1. Baca `CLAUDE.md` — standar koding dan desain.
2. Baca `PROJECT_STATE.md` — kondisi terkini project.
3. Baca `CHANGELOG.md` — riwayat perubahan.
4. Lanjutkan pekerjaan pada bagian **🔥 Sedang Dikerjakan**.
5. Jangan menghapus fitur yang sudah ada tanpa persetujuan.
6. Setelah pekerjaan selesai: perbarui dokumentasi, beri ringkasan, daftar file yang diubah, dan commit message.

---

## 🔥 Sedang Dikerjakan

- (kosong — menunggu kebutuhan berikutnya dari lapangan)

---

## 🎯 Backlog (Belum Diprioritaskan)

1. Membership / poin pelanggan — **PENDING atas keputusan pemilik**
2. QRIS otomatis — **DIBATALKAN** (tidak ada akun merchant; QRIS tetap statis/manual)
3. Edit harga menu dari HTML — **DIBATALKAN** (kebijakan: harga hanya diubah pemilik via Google Sheet)

---

## ✅ Sudah Selesai

### Aplikasi Kasir (index.html)

- [x] Login kasir — pilih nama saat buka aplikasi; nama otomatis terisi di transaksi, stok, kas
- [x] Navigasi bawah 3 tab: Dashboard / Kasir / Riwayat
- [x] Dashboard: hari ini, bulan ini, grafik omzet 7 hari, top 5 menu, performa per kasir
- [x] Halaman kasir dengan filter kategori + badge qty
- [x] Keranjang: tambah/kurang, hapus per item (✕), kosongkan semua (🗑️)
- [x] Validasi stok sebelum simpan — drawer peringatan detail per bahan, bisa lanjut atau batal
- [x] Pembayaran: Tunai/QRIS/Transfer, quick pay Rp10/20/50/100rb + Uang Pas, hitung kembalian
- [x] Struk: nomor urut item, Total Item (pcs), nama kasir, nama toko TEMAN COFFEE
- [x] Soft-cancel nota + tercatat siapa & kapan membatalkan (tampil di detail nota)
- [x] Rekap & Riwayat: satu area scroll utuh, kartu responsif
- [x] Manajemen menu: lihat semua (per kategori), tambah baru, toggle aktif/nonaktif — real-time
- [x] Form stok masuk & kas keluar
- [x] Mode DEMO lengkap (termasuk validasi stok & dashboard)
- [x] Semua fix tampilan tablet/landscape

### Backend (Code.gs)

- [x] Transaksi dengan LockService + auto-numbering T260707-001
- [x] Kolom KASIR di NOTA (kolom 9; STATUS di kolom 10) + `migrasiKolomKasir()`
- [x] Potong stok dari resep + reversal saat batal
- [x] Audit trail: sheet LOG BATAL (append-only) — waktu, ID, pembatal, nilai nota
- [x] Opname real-time via trigger `onEdit()`
- [x] `cekStokKeranjang()` — validasi kecukupan bahan
- [x] Manajemen menu: `getDaftarMenu()`, `tambahMenu()` (anti-duplikat), `toggleAktifMenu()`
- [x] `getDashboard()` — semua data dashboard 1 kali baca
- [x] `setupSemua()` — pasang dari nol 1 langkah (8 setup urutan benar) + `setupMenu()`
- [x] `backupHarian()` + `setupBackupOtomatis()` — backup tiap hari 23:00, simpan 7 terakhir
- [x] `arsipTahunLalu()` — arsip data tahun lalu ke file terpisah, saldo stok tetap akurat
- [x] `rapikanSemuaSheet()` — percantik semua sheet data tanpa sentuh data

### Laporan Google Sheet (semua format vertikal)

- [x] REKAP HARIAN — per menu + ringkasan bulanan (FIX: rumus Uang di Laci)
- [x] LAPORAN PENJUALAN — per hari + kas keluar + laci (FIX: bug bulan pendek)
- [x] LAPORAN PEMAKAIAN — per bahan: awal → masuk → pakai → keluar manual → akhir
- [x] REKAP SELISIH BULANAN — per bahan + jumlah opname + rata-rata
- [x] REKAP TAHUNAN — tren 12 bulan dalam 1 layar
- [x] Kapasitas 60 baris via konstanta `LAPORAN_BARIS`
- [x] Sheet usang terhapus: LAPORAN STOK KELUAR MANUAL & LAPORAN KELUAR LAIN

---

## 🐛 Bug yang Diketahui

| # | Deskripsi | File | Prioritas |
|---|---|---|---|
| B-1 | `Code.txt` seharusnya `Code.gs` — rename di GitHub | GitHub | 🟢 Rendah |

---

## 🗓️ Rutinitas Pemeliharaan

| Kapan | Apa | Fungsi |
|---|---|---|
| Otomatis tiap hari 23:00 | Backup ke Drive | `backupHarian()` (trigger) |
| Sekali (sudah?) | Aktifkan backup otomatis | `setupBackupOtomatis()` |
| Setiap awal Januari | Arsipkan data tahun lalu | `arsipTahunLalu()` |
| Jika menu/bahan > 60 | Naikkan kapasitas laporan | ubah `LAPORAN_BARIS`, jalankan `setupSemuaLaporan()` |

---

## 🏗️ Struktur Project

```
kasir-teman-coffee/
├── Code.txt          → Backend Google Apps Script (rename ke Code.gs)
├── index.html        → Frontend kasir (HTML + CSS + JS, satu file)
├── PROJECT_STATE.md  → Status project (file ini)
├── CLAUDE.md         → Panduan koding untuk AI
├── CHANGELOG.md      → Riwayat perubahan
└── README.md         → Deskripsi project
```

**Sheet data:** MENU, NOTA, ITEM, STOK, STOK_MUTASI, RESEP, OPNAME, KAS, STOK MASUK, LOG BATAL  
**Sheet laporan:** REKAP HARIAN, LAPORAN PENJUALAN, LAPORAN PEMAKAIAN, REKAP SELISIH BULANAN, REKAP TAHUNAN

---

## 📌 Teknologi

| Layer | Teknologi |
|---|---|
| Backend | Google Apps Script |
| Frontend | HTML + CSS + JS (vanilla) |
| Database | Google Spreadsheet |
| Hosting | Google Apps Script Web App |
