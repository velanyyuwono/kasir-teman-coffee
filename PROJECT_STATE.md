# PROJECT_STATE — TEKO KASIR
Update terakhir: 2026-07-07

## Arsitektur
Google Apps Script Web App (Code.gs + Index.html) di atas 1 Google Spreadsheet ("TEKO KASIR"). Berjalan di HP/tablet Android lewat browser Chrome, tanpa laptop (TECO POS React/Firebase resmi tidak dilanjutkan — alasan: tidak ada laptop). Sinkron real-time per transaksi lewat `google.script.run`.

## Sheet yang ada sekarang
| Sheet | Fungsi setup | Sumber isi | Catatan |
|---|---|---|---|
| MENU | (manual, sudah ada sebelum proyek ini) | manual | Butterfly pea squash & Grapefruit squash harus dihapus manual oleh Anda — belum dikonfirmasi sudah dihapus |
| RESEP | `setupResep()` | seed 29 menu + manual tambahan | Sumber kebenaran resep sekarang — TIDAK lagi di kode |
| STOK | `setupStok()` | seed awal + STOK_MUTASI | Kolom KOREKSI dari opname |
| STOK_MUTASI | (dibuat sebelum proyek ini) | otomatis (jualan, HTML masuk/keluar, onEdit koreksi) | Ledger utama semua pergerakan stok |
| OPNAME | `setupOpname()` | manual (pemilik saja) | onEdit otomatis tulis Koreksi ke STOK_MUTASI |
| STOK MASUK | `setupStokMasuk()` | otomatis dari tombol Masuk HTML (qty) + manual (harga) | Baris kuning = harga belum diisi |
| KAS | `setupKas()` | manual dari tombol 💰 HTML | Kategori: Es Batu/Galon Air/Karyawan Bon/Lainnya; per kasir |
| NOTA, ITEM | (dibuat sebelum proyek ini) | otomatis dari transaksi kasir | — |
| REKAP HARIAN | `setupRekapHarian()` | otomatis dari ITEM | — |
| LAPORAN PENJUALAN | `setupLaporanPenjualan()` | otomatis dari NOTA/ITEM | — |
| LAPORAN PEMAKAIAN | `setupLaporanPemakaian()` | otomatis, filter keterangan "Auto —" | Habis karena jualan saja |
| LAPORAN STOK MASUK | `setupLaporanStokMasuk()` | otomatis, jenis Masuk | **Belum pernah dijalankan** |
| LAPORAN STOK KELUAR MANUAL | `setupLaporanStokKeluarManual()` | otomatis, Keluar non-Auto | **Belum pernah dijalankan** |
| REKAP SELISIH BULANAN | `setupRekapSelisihBulanan()` | otomatis, jenis Koreksi | — |

## Status 6 target akhir yang ditetapkan Velany
1. **TAMBAH MENU** (form input resep) — sebagian: RESEP kini di sheet (bisa diedit langsung tanpa kode), tapi belum ada form khusus di HTML.
2. **HPP & LABA** — **terblokir**. STOK MASUK dibangun versi qty-saja; harga diisi manual, tidak wajib, tidak real-time. HPP tidak bisa dihitung sampai harga rutin terisi.
3. **DASHBOARD** (omzet/laba/margin) — terblokir, turunan dari poin 2.
4. **BIAYA OPERASIONAL** — belum dimulai.
5. **STOK KONSENTRAT** (produksi batch) — belum dimulai.
6. **TUTUP BULAN** (rollover saldo bulanan) — belum dimulai, memang direncanakan paling akhir.

## Keputusan desain kunci (jangan dibongkar tanpa alasan baru)
- OPNAME pakai **ledger + onEdit**, BUKAN "buku murni/drift" — sudah ditolak eksplisit, alasan: rentan bug tanpa tanda error kalau ada bahan telat diopname.
- Data finansial sensitif (OPNAME, harga di STOK MASUK) **manual di Sheets, tidak lewat HTML** — supaya karyawan tidak bisa mengubahnya.
- RESEP format panjang (1 baris = 1 pasangan menu-bahan), BUKAN format lebar 30+ kolom seperti file Excel lama — alasan: format lebar sudah didiagnosis tidak scalable di SDD TECO POS.
- LAPORAN PEMAKAIAN (otomatis dari jualan) vs LAPORAN STOK MASUK/KELUAR MANUAL (input karyawan) sengaja dipisah — supaya bisa diaudit mana yang laku vs mana yang rusak/tumpah/restock.

## RISIKO TERBUKA (belum diselesaikan, bukan "selesai")
1. **Menjalankan ulang `setupOpname()` / `setupStokMasuk()` / `setupKas()` menghapus seluruh isi sheet itu.** Data opname Robusta/Krimer dan kas Rp100.000 (Ansor) sudah ada di Sheets — belum ada versi "poles tampilan tanpa hapus data".
2. **`uangDiLaci` di `rekapHari()` dihitung dari `totalOmzet` (semua metode bayar)**, bukan cuma Tunai. Kalau ada penjualan QRIS/Transfer, angka "Uang di Laci" akan lebih besar dari uang tunai fisik yang sebenarnya ada.
3. Menu MENU sheet: penghapusan Butterfly pea squash & Grapefruit squash di sheet MENU belum dikonfirmasi sudah dilakukan Velany (kode sudah disesuaikan, tapi sheet MENU itu manual, di luar kendali kode).

## Belum dijalankan sama sekali oleh Velany (kode sudah dikirim, menunggu eksekusi)
- `setupLaporanStokMasuk()`
- `setupLaporanStokKeluarManual()`
- Fungsi `_polesSheet()` yang baru ditambahkan ke 10 sheet — efeknya baru terlihat kalau sheet terkait di-rebuild ulang (lihat Risiko #1 sebelum melakukan ini).
