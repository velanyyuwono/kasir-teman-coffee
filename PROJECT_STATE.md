# PROJECT_STATE.md

# Kasir Teman Coffee — Project State

**Project:** Kasir Teman Coffee  
**Versi:** 0.1.0  
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

- [ ] Dropdown kasir di form transaksi (index.html + Code.gs)
- [ ] Sinkronisasi data menu DEMO vs RESEP_AWAL (Code.gs)
- [ ] Tambah bahan Bunga telang & Jeruk bali di setupStok() (Code.gs)

---

## 🎯 Tugas Berikutnya (Prioritas Urut)

1. Validasi stok minimum sebelum transaksi — peringatan ke kasir jika bahan habis
2. Quick pay Rp10rb — tambah tombol di keranjang
3. Perbaiki nama toko di struk — buat bisa dikonfigurasi (saat ini hardcoded "KOPI TEKO")
4. Rename `Code.txt` → `Code.gs` di GitHub
5. Manajemen Produk — tambah/edit/hapus menu langsung dari HTML
6. Stock minimum alert
7. Membership / poin pelanggan
8. QRIS
9. Dashboard & Laporan
10. Login & hak akses kasir

---

## ✅ Sudah Selesai

### Backend (Code.gs)

- [x] Struktur sheet otomatis — `setupSheets()`, `setupStok()`, `setupResep()`, `setupOpname()`, `setupRekapHarian()`, `setupLaporanPenjualan()`, `setupLaporanPemakaian()`, `setupLaporanStokMasuk()`, `setupLaporanStokKeluarManual()`, `setupRekapSelisih()`
- [x] Simpan transaksi — `simpanNota()` dengan LockService (anti-race condition)
- [x] Auto-numbering nota — format `T260707-001` (kode bulan + urutan harian)
- [x] Soft-cancel nota — `batalkanNota()` dengan audit trail, data tidak dihapus
- [x] Potong stok otomatis berdasar resep — `_potongStokDariResep()`
- [x] Reversal stok saat nota dibatalkan — `_batalkanPotonganStok()`
- [x] Opname stok real-time — `onEdit()` trigger, tanpa klik tombol
- [x] Rekap harian — `rekapHari()` lengkap: omzet, per metode bayar, kas keluar, uang di laci
- [x] Catat stok masuk — `catatStok()`
- [x] Catat kas keluar — `catatKas()` dengan kategori, kasir, keterangan
- [x] Ambil data menu — `getMenu()`
- [x] Ambil data stok — `getStok()`
- [x] Cetak struk HTML — `strukHTML()`
- [x] Helper `_polesSheet()` — format tampilan sheet konsisten
- [x] Helper `sepArgumen()` — deteksi pemisah formula otomatis (`,` atau `;`)
- [x] Data resep awal — `RESEP_AWAL` dengan 29 menu (siap diisi ke sheet RESEP)

### Frontend (index.html)

- [x] Halaman kasir — tampilan daftar menu dengan filter kategori (Kopi / Non kopi / Soda / Snack)
- [x] Keranjang belanja — tambah, kurang, hapus item
- [x] Form pembayaran — pilih metode (Tunai / QRIS / Transfer), hitung kembalian
- [x] Quick pay — tombol Rp20rb, Rp50rb, Rp100rb + Uang Pas
- [x] Cetak struk — via `window.print()` dengan CSS `@media print`
- [x] Soft-cancel nota — konfirmasi sebelum batal, aman dari klik tidak sengaja
- [x] Rekap harian — drawer rekap omzet, per metode bayar, kas keluar
- [x] Detail nota — drawer lihat rincian transaksi per nota
- [x] Form stok masuk — drawer input stok + kasir
- [x] Form kas keluar — drawer input pengeluaran + kasir + kategori
- [x] Mode DEMO — bisa ditest tanpa koneksi Spreadsheet
- [x] Desain responsive — mobile-first, CSS variables, tanpa framework eksternal

---

## 🐛 Bug yang Diketahui

| # | Deskripsi | File | Prioritas |
|---|---|---|---|
| B-1 | Menu `Butterfly pea squash` & `Grapefruit squash` ada di DEMO tapi tidak ada di RESEP_AWAL — stok tidak terpotong | Code.gs | 🔴 Tinggi |
| B-2 | Bahan `Bunga telang` & `Jeruk bali` ada di DEMO_STOK tapi tidak ada di `setupStok()` | Code.gs | 🔴 Tinggi |
| B-3 | Kasir yang melayani tidak dikirim saat simpan nota — tidak bisa audit per kasir | index.html + Code.gs | 🟡 Sedang |
| B-4 | Tidak ada validasi stok minimum — saldo stok bisa negatif tanpa peringatan | Code.gs | 🟡 Sedang |
| B-5 | Quick pay tidak ada Rp10rb — padahal harga menu berkisar Rp2rb–Rp15rb | index.html | 🟢 Rendah |
| B-6 | Nama toko di struk hardcoded "KOPI TEKO" — tidak konsisten dengan header sistem | index.html | 🟢 Rendah |
| B-7 | `Code.txt` seharusnya `Code.gs` — GitHub tidak detect syntax Apps Script | GitHub | 🟢 Rendah |

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

**Database:** Google Spreadsheet (sheet: NOTA, ITEM, STOK, RESEP, OPNAME, REKAP HARIAN, LAPORAN PENJUALAN, LAPORAN PEMAKAIAN, LAPORAN STOK MASUK, LAPORAN STOK KELUAR MANUAL, REKAP SELISIH BULANAN)

---

## 📌 Ringkasan Teknologi

| Layer | Teknologi |
|---|---|
| Backend | Google Apps Script |
| Frontend | HTML + CSS + JavaScript (vanilla, no framework) |
| Database | Google Spreadsheet |
| Hosting | Google Apps Script Web App |

---

## 📝 Catatan

- `[ ]` = Belum selesai
- `[x]` = Sudah selesai
- Repository GitHub ini adalah **Single Source of Truth** untuk seluruh project.
- Semua kode backend ada di `Code.txt` (satu file, ~1.026 baris).
- Semua kode frontend ada di `index.html` (satu file, ~593 baris).
