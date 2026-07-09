# CHANGELOG

Semua perubahan penting pada project Kasir Teman Coffee dicatat di file ini.

---

## 2026-07-08 — v0.9.5

### Perapian Sheet NOTA & ITEM
- `rapikanNotaItem()` — header biru + putih, zebra banding, lebar kolom disesuaikan per kolom, format Rupiah & tanggal/jam otomatis.
- **Filter otomatis** ditambahkan di kedua sheet — tap ikon corong di header kolom untuk filter/sortir nota per tanggal, kasir, metode, atau menu.
- Baris dengan STATUS = BATAL kini otomatis memerah (conditional formatting), bukan hanya font strikethrough manual.
- Catatan penjelas ditambahkan di sel A1 kedua sheet.
- Didaftarkan otomatis ke `setupSheets()` (saat pasang baru) dan `rapikanSemuaSheet()` (kapan saja tanpa sentuh data).

---

## 2026-07-08 — v0.9.4

### Update Saldo Awal Stok (Mulai Operasional Nyata)
- Saldo awal 33 bahan di `setupStok()` diperbarui ke posisi akhir **8 Juli 2026**, diambil dari kolom "STOK BUKU (sudah koreksi)" file catatan Excel pemilik — sudah mencakup semua koreksi opname hingga tanggal tersebut.
- Ini adalah update kedua (revisi dari v0.9.3) setelah pemilik mengirim file yang lebih baru dan akurat.

---

## 2026-07-08 — v0.9.3

### Reset Data Awal + Fungsi Reset Terpusat
- `resetSemuaData()` — fungsi baru: backup otomatis dulu → kosongkan NOTA, ITEM, KAS, LOG BATAL, STOK MASUK, input OPNAME (termasuk bersihkan sisa coretan merah nota batal) → bangun ulang STOK & STOK_MUTASI dengan saldo awal terbaru.
- Saldo awal pertama kali diisi dari file catatan Excel pemilik (posisi akhir Juli, 33 bahan termasuk Bunga telang & Jeruk bali yang bahannya masih ada meski menunya sudah dihapus).

---

## 2026-07-08 — v0.9.2

### Cetak Langsung via RawBT (Printer Thermal EPPOS RPP02N)
- Tombol **⚡ CETAK LANGSUNG** — mengirim struk sebagai perintah ESC/POS mentah langsung ke aplikasi RawBT via Android Intent, tanpa dialog print, tanpa render halaman. Kertas keluar dalam hitungan detik.
- `strukTeks()` — generator format ESC/POS: judul toko ukuran besar tebal (rata tengah), kolom kiri-kanan presisi 32 karakter (lebar kertas 58mm), TOTAL dicetak tebal, umpan kertas otomatis untuk sobek.
- Tombol **⚡ Cetak Ulang Struk** ditambahkan di drawer detail nota — cetak ulang struk nota lama kapan saja (nonaktif untuk nota yang sudah dibatalkan).
- Tombol cetak lama (dialog print browser) tetap ada sebagai cadangan jika RawBT bermasalah.
- CSS `@page { size: 58mm auto; margin: 0 }` ditambahkan — memperbaiki bug ukuran kertas 80mm yang membuat struk tercetak kecil di tengah dan menghasilkan halaman kedua kosong saat mencetak lewat dialog print.

---

## 2026-07-08 — v0.9.1

### Optimasi Anti-Lag
- **Simpan nota dipangkas dari 2 panggilan server jadi 1** — validasi stok (`cekStokKeranjang`) kini dijalankan di dalam `simpanNota()` di sisi server; jika stok kurang, server menolak simpan dan mengembalikan daftar peringatan (bukan lagi permintaan terpisah dari frontend). Lag simpan nota berkurang sekitar 50%.
- `simpanNota()` menerima parameter `payload.paksa` — dikirim ulang dengan flag ini jika kasir memilih "Tetap Simpan" meski stok kurang.
- **Cache menu di localStorage** — halaman kasir menampilkan menu instan dari cache tablet saat dibuka, sinkronisasi ke versi terbaru server berjalan diam-diam di belakang tanpa membuat kasir menunggu layar kosong.

---

## 2026-07-08 — v0.9.0

### Performa Jangka Panjang — Arsip Tahunan
- `arsipTahunLalu()` — jalankan sekali setiap awal Januari: memindahkan semua data tahun lalu (NOTA, ITEM, STOK_MUTASI, KAS, LOG BATAL) ke file Spreadsheet arsip terpisah.
- Backup otomatis dibuat sebelum arsip dimulai (keamanan berlapis).
- Saldo stok tetap akurat — efek bersih mutasi yang diarsip digulung otomatis ke kolom SALDO AWAL.
- Coretan merah nota BATAL yang tersisa diterapkan ulang di posisi benar.
- File utama tetap ramping → rekap, dashboard, dan simpan nota tetap cepat bertahun-tahun.

### Perapian Tampilan Semua Sheet Data
- `rapikanSemuaSheet()` — percantik STOK_MUTASI, KAS, LOG BATAL, STOK MASUK, OPNAME, STOK **tanpa menyentuh data** (aman dijalankan berulang).
- STOK_MUTASI: kolom JENIS berwarna otomatis (Masuk hijau, Keluar merah, Koreksi kuning).
- KAS: dropdown Kategori & Kasir untuk cegah salah ketik saat edit manual.
- Setiap sheet diberi catatan penjelas di sel A1 (muncul saat hover).
- LOG BATAL kini langsung rapi sejak pertama dibuat.

### Pembersihan Sheet Usang
- `setupLaporanStokKeluarManual()` kini menghapus kedua varian nama sheet usang: "LAPORAN STOK KELUAR MANUAL" dan "LAPORAN KELUAR LAIN" (peninggalan versi lama). Datanya sudah tercakup di kolom KELUAR MANUAL sheet LAPORAN PEMAKAIAN.

---

## 2026-07-08 — v0.8.0

### REKAP TAHUNAN (Sheet Laporan Baru)
- 12 baris (Januari–Desember) + TOTAL TAHUN: Nota, Gelas, Omzet, Tunai/QRIS/Transfer, Kas Keluar, Uang di Laci.
- Ganti tahun cukup ubah 1 sel (B2).
- Bulan tanpa transaksi otomatis abu-abu; laci negatif otomatis merah.
- Terdaftar di `setupSemuaLaporan()`.

---

## 2026-07-08 — v0.7.5

### Kapasitas Laporan 40 → 60 Baris
- Konstanta terpusat baru `LAPORAN_BARIS = 60` — dipakai REKAP HARIAN, LAPORAN PEMAKAIAN, dan REKAP SELISIH BULANAN.
- Sebelumnya menu/bahan ke-41 dst tidak terhitung di laporan tanpa peringatan. Kini aman sampai 60 item; jika lebih, cukup ubah 1 angka.

---

## 2026-07-07 — v0.7.4

### FIX Laporan — Bug Bulan Pendek (LAPORAN PENJUALAN)
- Baris tanggal selalu 31 hari, sehingga untuk bulan pendek (Feb, Apr, Jun, Sep, Nov) baris sisa berisi tanggal bulan berikutnya dan transaksinya IKUT terhitung di TOTAL BULAN.
- Diperbaiki: tanggal di luar bulan kini otomatis kosong, dan semua rumus hanya menghitung jika tanggal masih dalam bulan yang dipilih.
- Jalankan ulang `setupLaporanPenjualan()` untuk menerapkan.

---

## 2026-07-07 — v0.7.3

### FIX Laporan — Bug Rumus Uang di Laci (REKAP HARIAN)
- Rumus "Uang Bersih di Laci" salah mengacu ke B9 (Transfer) alih-alih B6 (Total Omzet). Akibatnya angka laci = Transfer − Kas Keluar, salah total.
- Diperbaiki menjadi `=B6-B10` (Total Omzet − Kas Keluar).
- Jalankan ulang `setupRekapHarian()` untuk menerapkan perbaikan.

---

## 2026-07-07 — v0.7.2

### Audit Pembatalan Nota
- Sheet baru **LOG BATAL** (append-only) — mencatat waktu, ID nota, siapa yang membatalkan, dan nilai nota. Dibuat otomatis saat pembatalan pertama.
- Nama pembatal diambil otomatis dari kasir yang sedang login — tanpa input tambahan.
- Konfirmasi pembatalan kini menampilkan "Pembatalan ini akan tercatat atas nama: X" — efek pencegahan.
- Detail nota yang dibatalkan menampilkan siapa dan kapan membatalkan.
- Kompatibel mundur: panggilan lama batalkanNota(id) tetap berfungsi.

---

## 2026-07-07 — v0.7.1

### Backup Otomatis Harian
- `backupHarian()` — salin seluruh Spreadsheet ke folder "BACKUP KASIR TEKO" di Google Drive dengan nama bertanggal.
- `setupBackupOtomatis()` — jalankan sekali untuk pasang trigger otomatis setiap hari jam 23:00 WIB, sekaligus langsung backup pertama sebagai uji.
- Otomatis menyimpan hanya 7 backup terakhir — yang lebih lama dipindah ke Trash agar Drive tidak penuh.

---

## 2026-07-07 — v0.7.0

### Perbaikan Struk
- Nomor urut di setiap baris item (1. 2. 3. ...) — memudahkan cross-check kasir vs pembeli.
- Baris "Total Item ... pcs" sebelum total harga — pembeli bisa cepat verifikasi jumlah pesanan.
- FIX: setelah transaksi selesai, pilihan kasir kembali ke kasir yang login (sebelumnya selalu reset ke Ansor).

---

## 2026-07-07 — v0.6.4

### Perbaikan Drawer Rekap & Riwayat
- Seluruh isi drawer (tanggal, kartu ringkasan, riwayat nota) kini satu area scroll — tidak ada lagi jendela riwayat kecil yang terjepit di bawah.
- Tinggi drawer dinaikkan dari 90vh ke 92vh agar lebih lega.

---

## 2026-07-07 — v0.6.3

### Perbaikan Tampilan (dari feedback lapangan)
- FIX: Daftar item keranjang tidak terlihat di layar tablet/landscape — area daftar kini dijamin tinggi minimum, form pembayaran bisa di-scroll, dan spacing dirampingkan.
- FIX: Bar keranjang menutupi navigasi bawah — kasir tidak bisa kembali ke Dashboard/Riwayat. Bar keranjang dinaikkan di atas navigasi.
- Tambah tombol ✕ (hapus item) di setiap baris keranjang — tidak perlu tap minus berkali-kali.
- Kartu rekap dibuat responsif (otomatis 3-4 kolom di layar lebar) dan lebih ramping — riwayat nota langsung terlihat.

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
