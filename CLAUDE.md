# CLAUDE.md — Panduan untuk AI Developer

File ini adalah instruksi wajib bagi Claude (atau AI lain) sebelum menyentuh kode apapun di project ini.

---

## Wajib Dibaca Sebelum Mulai

1. Baca `PROJECT_STATE.md` — kondisi terkini, fitur selesai, bug aktif, tugas berikutnya
2. Baca `CHANGELOG.md` — riwayat perubahan per versi
3. Baca file ini sampai habis
4. **Jangan tulis kode apapun sebelum memahami arsitektur di bawah**

---

## Arsitektur Sistem

```
Browser (index.html)
    ↕ google.script.run (AJAX tanpa HTTP)
Google Apps Script (Code.gs)
    ↕ SpreadsheetApp
Google Spreadsheet (database)
```

- **Satu file frontend** — `index.html` berisi HTML + CSS + JS semuanya. Tidak ada framework, tidak ada npm, tidak ada build step.
- **Satu file backend** — `Code.gs` berisi semua fungsi Apps Script. Tidak ada file terpisah.
- **Database = Google Spreadsheet** — setiap sheet adalah satu "tabel".
- **Mode DEMO** — `index.html` bisa jalan tanpa koneksi Spreadsheet menggunakan data dummy (`MENU_DEMO`, `DEMO_STOK`, `DEMO_RESEP`). Selalu jaga mode DEMO tetap sinkron dengan data live.

---

## Standar Koding

### Umum
- Bahasa komentar: **Indonesia**
- Nama variabel & fungsi: **bahasa Inggris** (camelCase)
- Nama sheet & header kolom: **HURUF BESAR**, kata dipisah spasi
- Tidak ada `var` di Code.gs — gunakan `const` / `let`
- Di `index.html` gunakan `var` (kompatibilitas Google Apps Script WebApp)

### Google Apps Script (Code.gs)
- Setiap fungsi yang menulis ke Spreadsheet **wajib pakai LockService**
- Gunakan `sepArgumen()` untuk deteksi pemisah formula (`,` atau `;`) — jangan hardcode
- Gunakan `colLetter()` untuk konversi angka ke huruf kolom
- Gunakan `_polesSheet()` untuk formatting header sheet yang konsisten
- Fungsi setup (`setupSheets`, `setupStok`, dll) hanya dijalankan sekali saat pasang pertama kali atau reset — **jangan panggil dari frontend**
- Fungsi publik (dipanggil dari HTML): `getMenu`, `simpanNota`, `batalkanNota`, `detailNota`, `rekapHari`, `getStok`, `catatStok`, `catatKas`, `cekStokKeranjang`

### Frontend (index.html)
- CSS menggunakan **CSS variables** — warna dan ukuran di `:root`, jangan hardcode warna di selector lain
- Semua interaksi via `apiCall(fn, arg, callback)` — satu fungsi untuk handle LIVE dan DEMO
- Drawer/modal menggunakan class `.sheet` + `.overlay` dengan fungsi `show()` / `hide()`
- Drawer level 2 (di atas drawer lain) pakai class `.lvl2` dan z-index lebih tinggi
- Tidak ada library eksternal — murni vanilla JS

---

## Struktur Sheet (Database)

### NOTA — header transaksi
| Kolom | Isi |
|---|---|
| A: ID_NOTA | Format T260707-001 |
| B: TANGGAL | Date object |
| C: JAM | HH:mm:ss |
| D: TOTAL | Angka |
| E: BAYAR | Angka |
| F: KEMBALI | Angka |
| G: METODE | Tunai / QRIS / Transfer |
| H: CATATAN | Teks |
| I: KASIR | Nama kasir (Ansor/El/Gofur/Anwar) |
| J: STATUS | Kosong = aktif, BATAL = dibatalkan |

> ⚠️ STATUS ada di **kolom J (ke-10)**. Jangan salah referensi ke kolom I.

### ITEM — rincian item per transaksi
| Kolom | Isi |
|---|---|
| A: ID_NOTA | Referensi ke NOTA |
| B: TANGGAL | Date object |
| C: MENU | Nama menu |
| D: KATEGORI | Kopi / Non kopi / Soda / Snack |
| E: QTY | Angka |
| F: HARGA | Angka |
| G: SUBTOTAL | QTY × HARGA |
| H: STATUS | Kosong = aktif, BATAL = dibatalkan |

### STOK_MUTASI — jurnal stok
| Kolom | Isi |
|---|---|
| A: TANGGAL | Datetime |
| B: BAHAN | Nama bahan |
| C: JENIS | Masuk / Keluar / Koreksi |
| D: JUMLAH | Angka |
| E: KETERANGAN | Teks (pemakaian otomatis: "Auto — T260707-001") |

---

## Data Referensi

### Daftar Kasir
```
Ansor, El, Gofur, Anwar
```

### Kategori Menu
```
Kopi, Non kopi, Soda, Snack
```

### Kategori Kas Keluar
```
Es Batu, Beli Galon Air, Karyawan Bon, Uang Keluar Lainnya
```

### Warna Kategori (CSS)
```
Kopi      → var(--kopi)     #2563eb  biru
Non kopi  → var(--nonkopi)  #7c3aed  ungu
Soda      → var(--soda)     #0891b2  cyan
Snack     → var(--snack)    #ea580c  oranye
```

---

## Standar Desain

- **Tema**: Modern Minimal — bersih, tidak ramai
- **Font**: Arial / Helvetica (system font, tidak ada import)
- **Warna utama**: `#2563eb` (biru — `var(--brand)`)
- **Background**: `#eef2f7` (abu-abu terang)
- **Card/sheet**: `#ffffff`
- **Radius**: 12–14px untuk card, 10px untuk tombol, 999px untuk badge/pill
- **Header sheet Google Spreadsheet**: background `#2563eb`, teks putih, bold
- **Baris total sheet**: background `#1e3a5f`, teks putih, bold

---

## Aturan Penting — Jangan Dilanggar

1. **Jangan hapus data** — semua cancel/batal harus soft-delete (tulis STATUS = BATAL)
2. **Jangan ubah struktur sheet NOTA/ITEM** tanpa sediakan fungsi migrasi
3. **Jangan hardcode pemisah formula** — selalu pakai `sepArgumen()`
4. **Jangan panggil fungsi setup dari frontend** — hanya dijalankan manual dari Apps Script editor
5. **Selalu update DEMO_RESEP** jika ada perubahan resep di `RESEP_AWAL`
6. **Mode DEMO harus selalu berfungsi** — setiap fungsi baru di backend harus ada padanannya di `demo()` di frontend
7. **Satu LockService per fungsi tulis** — jangan nested lock

---

## Setelah Selesai Bekerja

Wajib lakukan ini sebelum selesai:

1. Update `PROJECT_STATE.md` — tandai tugas selesai `[x]`, perbarui versi
2. Update `CHANGELOG.md` — catat semua perubahan di versi baru
3. Berikan ringkasan: file yang diubah + commit message yang disarankan
4. Jika ada perubahan struktur sheet — sediakan fungsi migrasi aman

---

## Versi Saat Ini

**v0.4.0** — 07 Juli 2026

Fitur terakhir ditambahkan: Validasi stok minimum sebelum transaksi.
