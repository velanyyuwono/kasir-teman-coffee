# CHANGELOG

Semua perubahan penting pada project Kasir Teman Coffee dicatat di file ini.

---

## 2026-07-07 — v0.3.0

### Laporan Google Sheet — Perombakan Total Format
- **REKAP HARIAN**: Diubah dari matriks (menu × 31 kolom hari) menjadi tabel vertikal per menu dengan kolom QTY Bulan, Omzet, dan % Kontribusi. Ditambah blok ringkasan bulanan (total nota, gelas, omzet per metode, kas keluar, uang di laci) di bagian atas.
- **LAPORAN PENJUALAN**: Ditambah 2 kolom baru (Kas Keluar & Uang di Laci). Format tanggal lebih informatif. Hari tanpa transaksi otomatis abu-abu, uang di laci negatif otomatis merah.
- **LAPORAN PEMAKAIAN**: Diubah dari matriks menjadi tabel vertikal per bahan dengan kolom Saldo Awal → Masuk → Pakai Otomatis → Keluar Manual → Saldo Akhir → Status.
- **REKAP SELISIH BULANAN**: Diubah dari matriks menjadi tabel vertikal per bahan. Ditambah kolom Jumlah Opname, Rata-rata per opname, dan keterangan otomatis.
- **LAPORAN STOK KELUAR MANUAL**: Dihapus — datanya kini ada di kolom "Keluar Manual" sheet LAPORAN PEMAKAIAN.
- Tambah fungsi `setupSemuaLaporan()` — jalankan sekali untuk buat ulang semua laporan.

---

## 2026-07-07 — v0.2.0

### Kasir — Dropdown Kasir di Transaksi
- Tambah selector kasir (Ansor / El / Gofur / Anwar) di drawer keranjang sebelum form pembayaran.
- `simpanNota()`: terima field `kasir` dari frontend, simpan ke sheet NOTA.
- `HEADER_NOTA`: tambah kolom KASIR di kolom ke-9, STATUS geser ke kolom ke-10.
- `detailNota()`: return field kasir; ditampilkan di drawer rincian nota.
- Struk: tampilkan nama kasir yang melayani.
- Nama toko di struk diubah dari "KOPI TEKO" menjadi "TEMAN COFFEE".
- Quick pay: tambah tombol Rp10.000.
- Tambah fungsi `migrasiKolomKasir()` untuk migrasi aman dari data lama (v6 → v7).

### Dokumentasi
- Update PROJECT_STATE.md: semua fitur yang sudah selesai ditandai [x], bug tracker ditambahkan, roadmap diperbarui.

---

## 2026-07-07 — v0.1.0

### Repository
- Membuat repository GitHub "kasir-teman-coffee".
- Menambahkan README.md, CLAUDE.md, PROJECT_STATE.md.

### Source Code
- Upload file index.html (frontend kasir — HTML + CSS + JS, satu file, ~593 baris).
- Upload Code.gs sebagai Code.txt (backend Google Apps Script, ~1.026 baris).

### Fitur di v0.1.0
- Tampilan kasir dengan filter kategori (Kopi / Non kopi / Soda / Snack).
- Keranjang belanja dengan quick pay dan pilihan metode (Tunai / QRIS / Transfer).
- Simpan nota ke Google Spreadsheet dengan LockService (anti-race condition).
- Auto-numbering nota format T260707-001.
- Soft-cancel nota dengan audit trail + reversal stok otomatis.
- Potong stok otomatis berdasar resep saat transaksi.
- Rekap harian (omzet, per metode, kas keluar, uang di laci).
- Form stok masuk dan kas keluar dari HTML kasir.
- Sheet OPNAME dengan trigger onEdit — koreksi stok real-time.
- 6 sheet laporan otomatis berbasis SUMIFS.
- Mode DEMO bawaan untuk testing tanpa koneksi Spreadsheet.

### Catatan
- Code.gs disimpan sementara sebagai Code.txt karena keterbatasan upload GitHub.
