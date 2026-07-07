# CHANGELOG

Semua perubahan penting pada project Kasir Teman Coffee dicatat di file ini.

---

## 2026-07-07 — v0.6.2

### UX Kasir
- Tombol "🗑️ Kosongkan" di header drawer keranjang — hapus semua item sekaligus dengan konfirmasi (sebelumnya harus minus satu per satu).
- Input uang bayar ikut direset saat keranjang dikosongkan.

---

## 2026-07-07 — v0.6.1

### Setup Guided
- Tambah `setupMenu()` — buat sheet MENU otomatis dengan 29 menu awal (sebelumnya harus dibuat manual, padahal setupResep bergantung padanya). Aman: tidak menimpa sheet MENU yang sudah ada.
- Tambah `setupSemua()` — satu fungsi menjalankan 8 setup dengan urutan dependensi yang benar, lengkap dengan log kemajuan. Pasang dari nol kini cukup 1 langkah.

---

## 2026-07-07 — v0.6.0

### Login Kasir
- Layar pilih nama kasir saat pertama buka aplikasi.
- Nama kasir otomatis terisi di keranjang, stok, dan kas selama sesi.
- Tombol "Ganti Kasir" di header dengan konfirmasi.
- Navigasi bawah (Dashboard / Kasir / Riwayat) hanya tampil setelah login.

### Dashboard
- Ringkasan hari ini: omzet, nota, gelas, per metode, kas keluar, uang di laci.
- Ringkasan bulan ini: omzet, nota, gelas.
- Grafik omzet 7 hari terakhir (hari ini berwarna hijau).
- Top 5 menu terlaris bulan ini (qty + omzet).
- Performa per kasir bulan ini (nota + omzet).
- Fungsi backend `getDashboard()` membaca semua data sekali jalan (efisien).
- Demo mode: semua data dashboard terhitung dari transaksi demo yang dibuat di sesi.

### Navigasi
- Navigasi bawah 3 tab: Dashboard / Kasir / Riwayat.
- Halaman kasir hanya load menu saat pertama kali dibuka (lazy load).
- Tombol Rekap dipindah ke nav bawah, header lebih ringkas.

---

## 2026-07-07 — v0.5.0

### Manajemen Produk
- Tombol 🍽️ Menu di header kasir.
- Drawer daftar menu: tampil semua menu dikelompokkan per kategori, dengan harga dan status aktif/nonaktif.
- Toggle aktif/nonaktif langsung dari drawer — menu nonaktif hilang dari halaman kasir secara real-time.
- Drawer form tambah menu baru: isi nama, pilih kategori (dengan warna sesuai kategori), isi harga.
- Validasi duplikat nama saat tambah menu baru.
- Setelah tambah menu atau toggle, halaman kasir otomatis refresh tanpa reload.
- Demo mode: semua fitur berfungsi penuh tanpa koneksi Spreadsheet.

---

## 2026-07-07 — v0.4.0

### Validasi Stok Minimum Sebelum Transaksi
- Tambah fungsi backend `cekStokKeranjang(items)` — membaca resep dari sheet RESEP, menghitung total kebutuhan bahan dari isi keranjang, membandingkan dengan saldo di sheet STOK.
- Alur `simpan()` di frontend diubah menjadi 2 tahap: cek stok dulu → baru simpan nota.
- Tambah drawer **Peringatan Stok** — tampil jika ada bahan yang tidak cukup, menampilkan detail per bahan: dibutuhkan / sisa / kurang beserta nama menu penyebabnya.
- Kasir bisa pilih **Batal** (ubah pesanan) atau **Tetap Simpan** (abaikan peringatan, nota tetap masuk).
- Tambah `DEMO_RESEP` di frontend — resep lengkap untuk simulasi validasi stok di mode DEMO.
- Tambah handler `cekStokKeranjang` di fungsi `demo()` — berfungsi penuh tanpa koneksi Spreadsheet.

### Dokumentasi
- `README.md` diperbarui lengkap — fitur, struktur file, daftar sheet, cara pasang, cara update dari versi lama.
- `CLAUDE.md` diperbarui total — arsitektur akurat, struktur kolom setiap sheet, standar koding, data referensi, 7 aturan keras.

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
