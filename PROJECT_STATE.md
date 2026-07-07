# PROJECT_STATE.md

# Kasir Teman Coffee — Project State

**Project:** Kasir Teman Coffee  
**Versi:** 0.4.0  
**Status:** 🟡 Sedang Dikembangkan  
**Terakhir Diperbarui:** 07 Juli 2026

---

## 🤖 Instruksi untuk AI

Sebelum mulai bekerja:

1. Baca `CLAUDE.md` — standar koding dan desain.
2. Baca `PROJECT_STATE.md` — kondisi terkini project.
3. Baca `CHANGELOG.md` — riwayat perubahan.
4. Lanjutkan pekerjaan pada bagian **🔥 Sedang Dikerjakan**.
5. Jangan menghapus fitur yang sudah ada tanpa persetujuan.
6. Setelah pekerjaan selesai:
   - Perbarui `PROJECT_STATE.md`.
   - Perbarui `CHANGELOG.md`.
   - Berikan ringkasan perubahan.
   - Berikan daftar file yang diubah.
   - Buat commit message yang sesuai.

---

## 🔥 Sedang Dikerjakan

- [ ] Manajemen Produk — tambah/edit/nonaktifkan menu dari HTML

- [ ] Validasi stok minimum — peringatan ke kasir saat bahan tidak cukup untuk menu yang dipesan

---

## 🎯 Tugas Berikutnya (Prioritas Urut)

1. Manajemen Produk — tambah/edit/nonaktifkan menu langsung dari HTML
2. Membership / poin pelanggan
3. QRIS otomatis
4. Dashboard ringkasan bisnis
5. Login & hak akses per kasir

---

## ✅ Sudah Selesai

### Backend (Code.gs)

- [x] Struktur sheet otomatis — `setupSheets()`, `setupStok()`, `setupResep()`, `setupOpname()`, dll.
- [x] Simpan transaksi — `simpanNota()` dengan LockService (anti-race condition)
- [x] Kolom KASIR di sheet NOTA — siapa yang melayani tercatat per transaksi
- [x] Auto-numbering nota — format `T260707-001`
- [x] Soft-cancel nota — `batalkanNota()` dengan audit trail
- [x] Potong stok otomatis berdasar resep — `_potongStokDariResep()`
- [x] Reversal stok saat nota dibatalkan — `_batalkanPotonganStok()`
- [x] Opname stok real-time — `onEdit()` trigger
- [x] Rekap harian — `rekapHari()` lengkap
- [x] Catat stok masuk / kas keluar dari HTML
- [x] Migrasi aman v6→v7 — `migrasiKolomKasir()`
- [x] Setup semua laporan sekaligus — `setupSemuaLaporan()`

### Laporan Google Sheet (format vertikal, v0.3.0)

- [x] **REKAP HARIAN** — per menu: QTY, Omzet, % Kontribusi + ringkasan bulanan
- [x] **LAPORAN PENJUALAN** — per hari: Nota, Gelas, Omzet, Tunai/QRIS/Transfer, Kas Keluar, Uang di Laci
- [x] **LAPORAN PEMAKAIAN** — per bahan: Saldo Awal → Masuk → Pakai Otomatis → Keluar Manual → Saldo Akhir
- [x] **REKAP SELISIH BULANAN** — per bahan: Total Selisih, Jumlah Opname, Rata-rata, Keterangan
- [x] **LAPORAN STOK KELUAR MANUAL** — dihapus, digabung ke LAPORAN PEMAKAIAN

### Frontend (index.html)

- [x] Halaman kasir — filter kategori (Kopi / Non kopi / Soda / Snack)
- [x] Keranjang belanja — tambah, kurang, hapus item
- [x] Selector kasir — pilih siapa yang melayani sebelum simpan nota
- [x] Form pembayaran — Tunai / QRIS / Transfer, hitung kembalian
- [x] Quick pay — Rp10rb, Rp20rb, Rp50rb, Rp100rb + Uang Pas
- [x] Cetak struk — nama toko "TEMAN COFFEE", tampil nama kasir
- [x] Soft-cancel nota dengan konfirmasi
- [x] Rekap harian + riwayat nota per tanggal
- [x] Detail nota — lihat rincian, kasir, metode bayar
- [x] Form stok masuk dan kas keluar
- [x] Mode DEMO — bisa test tanpa Spreadsheet

---

## 🐛 Bug yang Diketahui

| # | Deskripsi | File | Prioritas |
|---|---|---|---|
| B-1 | Tidak ada validasi stok minimum — saldo stok bisa negatif tanpa peringatan | Code.gs + index.html | 🔴 Tinggi |
| B-2 | `Code.txt` seharusnya `Code.gs` — rename di GitHub | GitHub | 🟢 Rendah |

---

## 🏗️ Struktur Project

```
kasir-teman-coffee/
│
├── Code.txt          → Backend Google Apps Script (seharusnya Code.gs)
├── index.html        → Frontend kasir (HTML + CSS + JS, satu file)
│
├── PROJECT_STATE.md  → Status project (file ini)
├── CLAUDE.md         → Panduan koding dan desain untuk AI
├── CHANGELOG.md      → Riwayat perubahan
└── README.md         → Deskripsi project
```

**Sheet di Spreadsheet:**
- Data: NOTA, ITEM, MENU, STOK, STOK_MUTASI, RESEP, OPNAME, KAS, STOK MASUK
- Laporan: REKAP HARIAN, LAPORAN PENJUALAN, LAPORAN PEMAKAIAN, REKAP SELISIH BULANAN

---

## 📌 Teknologi

| Layer | Teknologi |
|---|---|
| Backend | Google Apps Script |
| Frontend | HTML + CSS + JS (vanilla, no framework) |
| Database | Google Spreadsheet |
| Hosting | Google Apps Script Web App |
