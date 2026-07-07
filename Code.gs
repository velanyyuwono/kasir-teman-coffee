/************************************************************
 *  KASIR TEKO — server (Google Apps Script) v6
 *  Perbaikan penting: memastikan tab NOTA & ITEM punya
 *  baris judul (header) -> menyembuhkan nomor nota kembar
 *  dan hapus nota yang tidak berpengaruh.
 ************************************************************/

const TZ      = 'Asia/Jakarta';   // WIB
const SH_MENU = 'MENU';
const SH_NOTA = 'NOTA';
const SH_ITEM = 'ITEM';

const HEADER_NOTA = ['ID_NOTA','TANGGAL','JAM','TOTAL','BAYAR','KEMBALI','METODE','CATATAN','STATUS'];
const HEADER_ITEM = ['ID_NOTA','TANGGAL','MENU','KATEGORI','QTY','HARGA','SUBTOTAL','STATUS'];

/* ---------------------------------------------------------
 * RESEP_AWAL — HANYA dipakai setupResep() untuk mengisi sheet RESEP
 * pertama kali. Setelah sheet RESEP ada, sistem membaca dari SHEET,
 * bukan dari sini. Menambah/ubah resep = edit sheet RESEP langsung,
 * TIDAK perlu edit kode ini lagi.
 * --------------------------------------------------------- */
const RESEP_AWAL = {
  'Renjana': [['Susu', 80], ['Gelas 14oz', 1], ['Konsentrat', 65]],
  'Butterscotch': [['Butterscotch', 15], ['Susu', 100], ['Gelas 14oz', 1], ['Konsentrat', 40]],
  'Caramel': [['Caramel', 15], ['Susu', 100], ['Gelas 14oz', 1], ['Konsentrat', 40]],
  'Hazelnut': [['Hazelnut', 15], ['Susu', 100], ['Gelas 14oz', 1], ['Konsentrat', 40]],
  'Sakala': [['Susu', 100], ['Gelas 14oz', 1], ['Konsentrat', 40]],
  'Kahwa': [['Robusta', 2], ['Vanilla', 5], ['Gelas 14oz', 1], ['Fruktosa', 10]],
  'Americano': [['Robusta', 2], ['Gelas 14oz', 1]],
  'Coffee milo': [['Robusta', 2], ['Susu', 50], ['Milo 35gr', 1], ['Gelas 14oz', 1]],
  'Extra shot kopi': [['Robusta', 2]],
  'Matchapresso': [['Robusta', 2], ['Krimer', 15], ['Susu', 90], ['Matcha 18gr', 1], ['Gelas 14oz', 1]],
  'Kopi panas': [['Gelas panas', 1], ['Kopi bubuk', 1]],
  'Chocolate': [['Susu', 100], ['Coklat', 1], ['Gelas 14oz', 1]],
  'Milo malaysia': [['Susu', 50], ['Milo 45gr', 1], ['Gelas 14oz', 1]],
  'Milo butterscotch': [['Butterscotch', 15], ['Susu', 50], ['Milo 35gr', 1], ['Gelas 14oz', 1]],
  'Milo caramel': [['Caramel', 15], ['Susu', 50], ['Milo 35gr', 1], ['Gelas 14oz', 1]],
  'Milo hazelnut': [['Hazelnut', 15], ['Susu', 50], ['Milo 35gr', 1], ['Gelas 14oz', 1]],
  'Redvelvet': [['Susu', 100], ['Redvelvet', 1], ['Gelas 14oz', 1]],
  'Taro': [['Taro', 1], ['Gelas 14oz', 1]],
  'Matcha': [['Susu', 100], ['Matcha 20gr', 1], ['Gelas 14oz', 1]],
  'Matcha aren': [['Susu', 100], ['Matcha 18gr', 1], ['Gelas 14oz', 1]],
  'Teh': [['Gelas 18oz', 1]],
  'Milo oreo': [['Susu', 50], ['Gelas 14oz', 1], ['Milo oreo', 1]],
  'Happy soda': [['Gelas 18oz', 1], ['Soda', 1], ['Cocopandan', 50]],
  'Lychee squash': [['Gelas 18oz', 1], ['Fruktosa', 25], ['Soda', 1], ['Leci', 40]],
  'Lemonade squash': [['Gelas 18oz', 1], ['Fruktosa', 25], ['Soda', 1], ['Lemon', 40]],
  'Passion fruit squash': [['Gelas 18oz', 1], ['Fruktosa', 25], ['Soda', 1], ['Markisa', 40]],
  'Strawberry squash': [['Gelas 18oz', 1], ['Fruktosa', 25], ['Soda', 1], ['Strawberry', 40]],
  'Cocopandan squash': [['Gelas 18oz', 1], ['Fruktosa', 25], ['Soda', 1], ['Cocopandan', 40]],
  'Snack': [['Sip', 1]]
};

/* JALANKAN SEKALI: buat sheet RESEP (format panjang: 1 baris = 1 pasangan
 * menu-bahan). Menu tanpa resep tetap bisa dijual, hanya tidak motong stok. */
function setupResep() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('RESEP');
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet('RESEP');

  sh.getRange('A1').setValue('RESEP — 1 baris = 1 bahan yang dipotong per 1 gelas terjual. Menu baru: tambah baris di bawah. Nama MENU harus sama persis dengan sheet MENU; nama BAHAN harus sama persis dengan sheet STOK.');
  const head = ['MENU', 'BAHAN', 'JUMLAH / 1 GELAS'];
  sh.getRange(2, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  sh.setFrozenRows(2);

  const rows = [];
  Object.keys(RESEP_AWAL).forEach(function (menu) {
    RESEP_AWAL[menu].forEach(function (pair) {
      rows.push([menu, pair[0], pair[1]]);
    });
  });
  if (rows.length) sh.getRange(3, 1, rows.length, 3).setValues(rows);

  // Dropdown validasi: MENU dari sheet MENU, BAHAN dari sheet STOK —
  // menutup typo yang bikin potong stok diam-diam gagal.
  const NROW = 300;
  const shMenu = ss.getSheetByName(SH_MENU), shStok = ss.getSheetByName('STOK');
  if (shMenu) {
    sh.getRange(3, 1, NROW, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInRange(shMenu.getRange('A2:A200'), true).setAllowInvalid(false).build());
  }
  if (shStok) {
    sh.getRange(3, 2, NROW, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInRange(shStok.getRange('A2:A200'), true).setAllowInvalid(false).build());
  }
  sh.autoResizeColumns(1, 3);
  _polesSheet(sh, 3, 1, 2, 3, 3 + Math.max(rows.length, 1) - 1);
}

/* Baca sheet RESEP -> { menu: [[bahan, jumlah], ...] }.
 * Kalau sheet RESEP belum ada, kembalikan objek kosong (tidak motong stok). */
function _bacaResep(ss) {
  const sh = ss.getSheetByName('RESEP');
  const map = {};
  if (!sh) return map;
  const last = sh.getLastRow();
  if (last < 3) return map;
  const rows = sh.getRange(3, 1, last - 2, 3).getValues();
  rows.forEach(function (r) {
    const menu = String(r[0] || '').trim(), bahan = String(r[1] || '').trim(), jml = Number(r[2]) || 0;
    if (!menu || !bahan || jml <= 0) return;
    if (!map[menu]) map[menu] = [];
    map[menu].push([bahan, jml]);
  });
  return map;
}

/* Tampilkan halaman kasir */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Kasir Teko')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* Ambil daftar menu aktif dari sheet MENU */
function getMenu() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SH_MENU);
  const data = sh.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < data.length; i++) {
    const nama = data[i][0], kategori = data[i][1], harga = data[i][2], aktif = data[i][3];
    if (!nama) continue;
    if (aktif === false) continue;
    out.push({ nama: String(nama), kategori: String(kategori || 'Lainnya'), harga: Number(harga) || 0 });
  }
  return out;
}

/* Simpan 1 nota (header ke NOTA, rincian ke ITEM) */
function simpanNota(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss     = SpreadsheetApp.getActive();
    const shNota = ss.getSheetByName(SH_NOTA);
    const shItem = ss.getSheetByName(SH_ITEM);

    const now    = new Date();
    const tglStr = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');
    const jam    = Utilities.formatDate(now, TZ, 'HH:mm:ss');
    const idNota = buatIdNota(shNota, now);

    let total = 0;
    const items = payload.items || [];
    const barisItem = [];
    items.forEach(function (it) {
      const qty   = Number(it.qty)   || 0;
      const harga = Number(it.harga) || 0;
      const sub   = qty * harga;
      total += sub;
      barisItem.push([idNota, now, it.nama, it.kategori || '', qty, harga, sub, '']);
    });

    const bayar   = Number(payload.bayar) || 0;
    const metode  = payload.metode || 'Tunai';
    const kembali = bayar > 0 ? (bayar - total) : 0;

    shNota.appendRow([idNota, now, jam, total, bayar, kembali, metode, payload.catatan || '', '']);
    if (barisItem.length) {
      shItem.getRange(shItem.getLastRow() + 1, 1, barisItem.length, 8).setValues(barisItem);
    }

    _potongStokDariResep(ss, items, idNota, now);

    return {
      ok: true, idNota: idNota, tgl: tglStr, jam: jam,
      total: total, bayar: bayar, kembali: kembali,
      metode: metode, catatan: payload.catatan || '', items: items
    };
  } finally {
    lock.releaseLock();
  }
}

/* Nomor nota: T + yymmdd + (nomor tertinggi hari itu + 1) */
function buatIdNota(shNota, now) {
  const prefix = 'T' + Utilities.formatDate(now, TZ, 'yyMMdd');
  const last = shNota.getLastRow();
  let maxN = 0;
  if (last >= 2) {
    const ids = shNota.getRange(2, 1, last - 1, 1).getValues();
    ids.forEach(function (r) {
      const s = String(r[0]);
      if (s.indexOf(prefix) === 0) {
        const n = parseInt(s.split('-')[1], 10);
        if (!isNaN(n) && n > maxN) maxN = n;
      }
    });
  }
  return prefix + '-' + ('000' + (maxN + 1)).slice(-3);
}

/* Potong STOK_MUTASI otomatis (jenis 'Keluar') berdasar sheet RESEP.
 * Menu yang tidak punya baris di RESEP dilewati (tidak error, tidak potong
 * apa pun) — supaya menu baru tidak memblokir transaksi, tapi wajib
 * ditambah resepnya di sheet RESEP supaya stoknya ikut terpotong. */
function _potongStokDariResep(ss, items, idNota, now) {
  const shMutasi = ss.getSheetByName('STOK_MUTASI');
  if (!shMutasi) return;
  const RESEP = _bacaResep(ss);

  const pakai = {}; // { bahan: totalJumlah }
  items.forEach(function (it) {
    const resep = RESEP[it.nama];
    const qty = Number(it.qty) || 0;
    if (!resep || qty <= 0) return;
    resep.forEach(function (pair) {
      const bahan = pair[0], perGelas = pair[1];
      pakai[bahan] = (pakai[bahan] || 0) + perGelas * qty;
    });
  });

  const baris = Object.keys(pakai).map(function (bahan) {
    return [now, bahan, 'Keluar', pakai[bahan], 'Auto — ' + idNota];
  });
  if (baris.length) {
    shMutasi.getRange(shMutasi.getLastRow() + 1, 1, baris.length, 5).setValues(baris);
  }
}

/* ---------- helper tanggal ---------- */
function _tglStr(v) { return (v instanceof Date) ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v); }
function _jamStr(v) { return (v instanceof Date) ? Utilities.formatDate(v, TZ, 'HH:mm:ss') : String(v); }

/* Rekap 1 tanggal (default hari ini) */
function rekapHari(tglStr) {
  const ss = SpreadsheetApp.getActive();
  if (!tglStr) tglStr = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');

  const res = { tgl: tglStr, jumlahNota: 0, totalGelas: 0, totalOmzet: 0,
                perMetode: { Tunai: 0, QRIS: 0, Transfer: 0 }, nota: [],
                kasKeluar: [], totalKasKeluar: 0, uangDiLaci: 0 };

  const shNota = ss.getSheetByName(SH_NOTA);
  const lastN = shNota.getLastRow();
  if (lastN >= 2) {
    const rows = shNota.getRange(2, 1, lastN - 1, 9).getValues();
    rows.forEach(function (r) {
      if (!r[0]) return;
      if (_tglStr(r[1]) !== tglStr) return;
      const batal = String(r[8]).toUpperCase() === 'BATAL';
      const total = Number(r[3]) || 0;
      const metode = r[6] || 'Tunai';
      if (!batal) {
        res.jumlahNota++;
        res.totalOmzet += total;
        if (res.perMetode[metode] === undefined) res.perMetode[metode] = 0;
        res.perMetode[metode] += total;
      }
      res.nota.push({ idNota: r[0], jam: _jamStr(r[2]), total: total, metode: metode, batal: batal });
    });
  }

  const shItem = ss.getSheetByName(SH_ITEM);
  const lastI = shItem.getLastRow();
  const perMenu = {}; // { menu: { qty, subtotal } }
  if (lastI >= 2) {
    const it = shItem.getRange(2, 1, lastI - 1, 8).getValues();
    it.forEach(function (x) {
      if (_tglStr(x[1]) === tglStr && String(x[7]).toUpperCase() !== 'BATAL') {
        res.totalGelas += Number(x[4]) || 0;
        const nama = String(x[2] || '');
        if (!nama) return;
        if (!perMenu[nama]) perMenu[nama] = { menu: nama, qty: 0, subtotal: 0 };
        perMenu[nama].qty += Number(x[4]) || 0;
        perMenu[nama].subtotal += Number(x[6]) || 0;
      }
    });
  }
  res.perMenu = Object.values(perMenu).sort(function (a, b) { return b.qty - a.qty; });

  const shKas = ss.getSheetByName('KAS');
  if (shKas) {
    const lastK = shKas.getLastRow();
    if (lastK >= 2) {
      const kk = shKas.getRange(2, 1, lastK - 1, 5).getValues();
      kk.forEach(function (r) {
        if (_tglStr(r[0]) !== tglStr) return;
        const jml = Number(r[2]) || 0;
        res.kasKeluar.push({ kategori: String(r[1] || ''), jumlah: jml, kasir: String(r[3] || ''), keterangan: String(r[4] || '') });
        res.totalKasKeluar += jml;
      });
    }
  }
  res.uangDiLaci = res.totalOmzet - res.totalKasKeluar;

  res.nota.reverse();
  return res;
}

/* Rincian 1 nota */
function detailNota(id) {
  const ss = SpreadsheetApp.getActive();
  const items = [];
  const shItem = ss.getSheetByName(SH_ITEM);
  const lastI = shItem.getLastRow();
  if (lastI >= 2) {
    const rows = shItem.getRange(2, 1, lastI - 1, 7).getValues();
    rows.forEach(function (r) {
      if (String(r[0]) === String(id))
        items.push({ nama: r[2], kategori: r[3], qty: Number(r[4]) || 0,
                     harga: Number(r[5]) || 0, sub: Number(r[6]) || 0 });
    });
  }
  let head = null;
  const shNota = ss.getSheetByName(SH_NOTA);
  const lastN = shNota.getLastRow();
  if (lastN >= 2) {
    const nr = shNota.getRange(2, 1, lastN - 1, 9).getValues();
    for (let i = 0; i < nr.length; i++) {
      if (String(nr[i][0]) === String(id)) {
        head = { idNota: nr[i][0], tgl: _tglStr(nr[i][1]), jam: _jamStr(nr[i][2]),
                 total: Number(nr[i][3]) || 0, bayar: Number(nr[i][4]) || 0,
                 kembali: Number(nr[i][5]) || 0, metode: nr[i][6] || '', catatan: nr[i][7] || '',
                 status: String(nr[i][8] || '') };
        break;
      }
    }
  }
  return { head: head, items: items };
}

/* Batalkan 1 nota = DICORET (BATAL), tidak dihapus. Laporan tidak menghitungnya. */
function batalkanNota(id) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActive();
    _coret(ss.getSheetByName(SH_ITEM), id, 8); // STATUS kolom H
    _coret(ss.getSheetByName(SH_NOTA), id, 9); // STATUS kolom I
    _batalkanPotonganStok(ss, id);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}
/* Balikkan potongan stok otomatis milik 1 idNota (tulis Masuk penyeimbang).
 * Tidak menghapus baris Keluar lama — supaya jejak audit tetap utuh. */
function _batalkanPotonganStok(ss, id) {
  const sh = ss.getSheetByName('STOK_MUTASI');
  if (!sh) return;
  const last = sh.getLastRow();
  if (last < 2) return;
  const tag = 'Auto — ' + id;
  const rows = sh.getRange(2, 1, last - 1, 5).getValues();
  const balik = {};
  rows.forEach(function (r) {
    if (String(r[4]) === tag && String(r[2]) === 'Keluar') {
      balik[r[1]] = (balik[r[1]] || 0) + (Number(r[3]) || 0);
    }
  });
  const now = new Date();
  const baris = Object.keys(balik).map(function (bahan) {
    return [now, bahan, 'Masuk', balik[bahan], 'Reversal batal — ' + id];
  });
  if (baris.length) sh.getRange(sh.getLastRow() + 1, 1, baris.length, 5).setValues(baris);
}
function _coret(sh, id, statusCol) {
  if (!sh) return;
  const last = sh.getLastRow();
  if (last < 2) return;
  const ids = sh.getRange(2, 1, last - 1, 1).getValues();
  const lebar = Math.max(sh.getLastColumn(), statusCol);
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      const row = i + 2;
      sh.getRange(row, statusCol).setValue('BATAL');
      sh.getRange(row, 1, 1, lebar).setFontLine('line-through').setFontColor('#c0392b');
    }
  }
}

/* =========================================================
 *  JALANKAN SEKALI: pastikan NOTA & ITEM punya baris judul.
 *  Aman dijalankan berulang (tidak menggandakan judul).
 * ========================================================= */
function setupSheets() {
  const ss = SpreadsheetApp.getActive();
  pastikanHeader(ss.getSheetByName(SH_NOTA), HEADER_NOTA);
  pastikanHeader(ss.getSheetByName(SH_ITEM), HEADER_ITEM);
}
function pastikanHeader(sh, judul) {
  if (!sh) return;
  const a1 = String(sh.getRange(1, 1).getValue()).trim().toUpperCase();
  if (a1 !== judul[0]) sh.insertRowBefore(1);         // sisipkan baris judul bila belum ada
  sh.getRange(1, 1, 1, judul.length).setValues([judul]).setFontWeight('bold');
  sh.setFrozenRows(1);
}

/* OPSIONAL — hapus semua data transaksi (judul tetap), untuk mulai bersih.
 * Termasuk STOK_MUTASI: potongan otomatis, input manual, dan koreksi
 * semuanya ikut terhapus — SALDO kembali ke SALDO AWAL murni. */
function hapusSemuaTransaksi() {
  const ss = SpreadsheetApp.getActive();
  [SH_NOTA, SH_ITEM, 'STOK_MUTASI'].forEach(function (nm) {
    const sh = ss.getSheetByName(nm);
    if (!sh) return;
    const last = sh.getLastRow();
    if (last >= 2) sh.getRange(2, 1, last - 1, sh.getLastColumn()).clearContent();
  });
}

/* Uji langsung ke Sheet: pemisah argumen (',' atau ';') */
function sepArgumen() {
  const ss = SpreadsheetApp.getActive();
  const tmp = ss.insertSheet('_uji_sep_' + new Date().getTime());
  let sep = ';';
  try {
    tmp.getRange('A1').setFormula('=IF(TRUE,1,2)');
    SpreadsheetApp.flush();
    const v = tmp.getRange('A1').getValue();
    if (v === 1 || v === '1') sep = ',';
  } catch (e) { sep = ';'; } finally { ss.deleteSheet(tmp); }
  return sep;
}

/* JALANKAN SEKALI: membuat/menyegarkan tab REKAP HARIAN */
function setupRekapHarian() {
  const ss = SpreadsheetApp.getActive();
  const NAMA = 'REKAP HARIAN';
  let sh = ss.getSheetByName(NAMA);
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(NAMA);

  const NROW = 40, cD1 = 3, HARI = 31;
  const cDN = cD1 + HARI - 1, cQTY = cDN + 1, cRP = cDN + 2;
  const L = colLetter, S = sepArgumen();

  sh.getRange('A1').setValue('REKAP HARIAN — terisi OTOMATIS dari tab ITEM. Jangan diketik manual.');
  sh.getRange('A2').setValue('Bulan:');
  sh.getRange('B2').setValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)).setNumberFormat('yyyy-mm-dd');
  sh.getRange('D2').setValue('Total Gelas:');
  sh.getRange('F2').setValue('Total Omzet:');

  sh.getRange(3, 1).setValue('MENU');
  sh.getRange(3, 2).setValue('HARGA');
  for (let c = cD1; c <= cDN; c++) sh.getRange(3, c).setFormula('=$B$2+' + (c - cD1)).setNumberFormat('d');
  sh.getRange(3, cQTY).setValue('TOTAL QTY');
  sh.getRange(3, cRP).setValue('TOTAL Rp');

  for (let r = 4; r < 4 + NROW; r++) {
    const mr = r - 2;
    sh.getRange(r, 1).setFormula('=IF(MENU!A' + mr + '=""' + S + '""' + S + 'MENU!A' + mr + ')');
    sh.getRange(r, 2).setFormula('=IF(MENU!C' + mr + '=""' + S + '""' + S + 'MENU!C' + mr + ')');
    for (let c = cD1; c <= cDN; c++) {
      const col = L(c);
      sh.getRange(r, c).setFormula(
        '=IF($A' + r + '=""' + S + '""' + S +
        'SUMIFS(ITEM!$E:$E' + S + 'ITEM!$C:$C' + S + '$A' + r + S +
        'ITEM!$B:$B' + S + '">="&' + col + '$3' + S +
        'ITEM!$B:$B' + S + '"<"&(' + col + '$3+1)' + S +
        'ITEM!$H:$H' + S + '"<>BATAL"))'
      );
    }
    sh.getRange(r, cQTY).setFormula('=IF($A' + r + '=""' + S + '""' + S + 'SUM(' + L(cD1) + r + ':' + L(cDN) + r + '))');
    sh.getRange(r, cRP).setFormula('=IF($A' + r + '=""' + S + '""' + S + '$B' + r + '*' + L(cQTY) + r + ')');
  }

  const rT = 4 + NROW;
  sh.getRange(rT, 1).setValue('TOTAL');
  for (let c = cD1; c <= cRP; c++) sh.getRange(rT, c).setFormula('=SUM(' + L(c) + '4:' + L(c) + (rT - 1) + ')');

  sh.getRange('E2').setFormula('=' + L(cQTY) + rT);
  sh.getRange('G2').setFormula('=' + L(cRP) + rT);

  sh.getRange(3, 1, 1, cRP).setFontWeight('bold');
  sh.getRange(rT, 1, 1, cRP).setFontWeight('bold');
  sh.getRange(4, 2, NROW, 1).setNumberFormat('"Rp"#,##0');
  sh.getRange(4, cRP, NROW + 1, 1).setNumberFormat('"Rp"#,##0');
  sh.getRange('G2').setNumberFormat('"Rp"#,##0');
  sh.getRange(4, cD1, NROW, HARI).setNumberFormat('0;-0;');
  sh.getRange(3, cD1, 1, HARI).setHorizontalAlignment('center');
  sh.setFrozenRows(3);
  sh.setFrozenColumns(2);
  sh.autoResizeColumn(1);
  _polesSheet(sh, cRP, 1, 3, 4, rT - 1);
}
/* Rapikan tampilan 1 sheet: judul abu-abu di atas (kalau ada), header biru
 * tebal, baris data dikasih pita warna selang-seling (banding) supaya
 * gampang dibaca — dipakai di semua sheet setup*() supaya konsisten. */
function _polesSheet(sh, numCols, titleRow, headerRow, dataStartRow, dataEndRow) {
  if (titleRow) {
    sh.getRange(titleRow, 1, 1, numCols).merge().setWrap(true)
      .setBackground('#eef2f7').setFontColor('#64748b').setFontStyle('italic')
      .setFontSize(9).setVerticalAlignment('middle');
    sh.setRowHeight(titleRow, 36);
  }
  sh.getRange(headerRow, 1, 1, numCols)
    .setBackground('#2563eb').setFontColor('#ffffff').setFontWeight('bold')
    .setVerticalAlignment('middle');
  sh.setRowHeight(headerRow, 26);
  if (dataEndRow >= dataStartRow) {
    try {
      sh.getRange(dataStartRow, 1, dataEndRow - dataStartRow + 1, numCols)
        .applyRowBanding(SpreadsheetApp.BandingTheme.BLUE, false, false);
    } catch (e) { /* banding gagal (mis. overlap) -> abaikan, tidak fatal */ }
  }
}

function colLetter(c) {
  let s = '';
  while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = (c - m - 1) / 26; }
  return s;
}

/* =========================================================
 *  FITUR STOK (kartu stok sederhana untuk kasir)
 * ========================================================= */

/* JALANKAN SEKALI: membuat tab STOK + STOK_MUTASI (isi bahan otomatis) */
function setupStok() {
  const ss = SpreadsheetApp.getActive();
  const S = sepArgumen();

  // --- STOK_MUTASI (jurnal gerakan) ---
  let m = ss.getSheetByName('STOK_MUTASI');
  if (m) ss.deleteSheet(m);
  m = ss.insertSheet('STOK_MUTASI');
  m.getRange(1, 1, 1, 5).setValues([['TANGGAL', 'BAHAN', 'JENIS', 'JUMLAH', 'KETERANGAN']]).setFontWeight('bold');
  m.setFrozenRows(1);
  m.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');

  // --- STOK (kartu stok, saldo otomatis) ---
  const items = [
    ['Robusta','Gr',12],['Krimer','Gr',318],['Vanilla','Ml',340],['Hazelnut','Ml',349],
    ['Caramel','Ml',413],['Butterscotch','Ml',265],['Susu','Ml',71900],['Matcha 20gr','Pc',13],
    ['Matcha 18gr','Pc',16],['Milo 45gr','Pc',28],['Milo 35gr','Pc',14],['Coklat','Pc',46],
    ['Redvelvet','Pc',19],['Taro','Pc',24],['Sip','Pc',19],['Gelas panas','Pc',43],
    ['Gelas 14oz','Pc',87],['Gelas 18oz','Pc',48],['Kopi bubuk','Pc',1],['Fruktosa','Ml',265],
    ['Milo oreo','Pc',5],['Soda','Pc',9],
    ['Cocopandan','Ml',602],['Lemon','Ml',957],['Markisa','Ml',20],['Leci','Ml',934],
    ['Strawberry','Ml',572],['Konsentrat','Ml',801],['Robusta konsentrat','Gr',121],
    ['Krimer konsentrat','Gr',420],['Vanilla konsentrat','Ml',600]
  ];

  let s = ss.getSheetByName('STOK');
  if (s) ss.deleteSheet(s);
  s = ss.insertSheet('STOK');
  // KOREKSI = hasil opname fisik, diinput MANUAL sebagai baris jenis 'Koreksi'
  // di STOK_MUTASI (bukan lewat HTML kasir) — supaya cuma pemilik yang bisa ubah.
  const head = ['BAHAN','SATUAN','SALDO AWAL','MASUK','KELUAR','KOREKSI (opname)','SALDO','BATAS MIN','STATUS'];
  s.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  s.setFrozenRows(1);

  for (let i = 0; i < items.length; i++) {
    const r = i + 2;
    s.getRange(r, 1).setValue(items[i][0]);
    s.getRange(r, 2).setValue(items[i][1]);
    s.getRange(r, 3).setValue(items[i][2]);
    s.getRange(r, 4).setFormula('=SUMIFS(STOK_MUTASI!$D:$D' + S + 'STOK_MUTASI!$B:$B' + S + '$A' + r + S + 'STOK_MUTASI!$C:$C' + S + '"Masuk")');
    s.getRange(r, 5).setFormula('=SUMIFS(STOK_MUTASI!$D:$D' + S + 'STOK_MUTASI!$B:$B' + S + '$A' + r + S + 'STOK_MUTASI!$C:$C' + S + '"Keluar")');
    s.getRange(r, 6).setFormula('=SUMIFS(STOK_MUTASI!$D:$D' + S + 'STOK_MUTASI!$B:$B' + S + '$A' + r + S + 'STOK_MUTASI!$C:$C' + S + '"Koreksi")');
    s.getRange(r, 7).setFormula('=C' + r + '+D' + r + '-E' + r + '+F' + r);
    s.getRange(r, 9).setFormula('=IF(H' + r + '=""' + S + '"-"' + S + 'IF(G' + r + '<=H' + r + S + '"MENIPIS"' + S + '"Aman"))');
  }

  s.getRange(2, 3, items.length, 5).setNumberFormat('#,##0');
  s.autoResizeColumns(1, 9);
  _polesSheet(s, 9, null, 1, 2, 1 + items.length);

  const rng = s.getRange(2, 9, items.length, 1);
  const rule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('MENIPIS').setBackground('#f8d7da').setFontColor('#c0392b').setRanges([rng]).build();
  s.setConditionalFormatRules([rule]);
}

/* JALANKAN SEKALI: buat tab OPNAME (manual, hanya di Sheets — bukan di HTML).
 * Karyawan hitung fisik lalu SAMPAIKAN ke pemilik; pemilik yang mengetik
 * hasil di sini dan di STOK_MUTASI. Kolom SELISIH & STOK SISTEM otomatis,
 * supaya salah ketik langsung kelihatan sebelum dijadikan Koreksi.
 * Baris Koreksi di STOK_MUTASI TETAP harus ditambah manual terpisah —
 * OPNAME di sini murni catatan, tidak otomatis mengubah SALDO. */
function setupOpname() {
  const ss = SpreadsheetApp.getActive();
  const S = sepArgumen();
  let sh = ss.getSheetByName('OPNAME');
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet('OPNAME');

  sh.getRange('A1').setValue('OPNAME FISIK — isi TANGGAL, BAHAN, STOK FISIK. Kolom lain otomatis. Setelah selesai isi, jalankan fungsi terapkanOpname() sekali untuk mengoreksi STOK sesuai hasil hitung fisik. Kolom KETERANGAN akan terisi otomatis kalau baris itu sudah diterapkan — jangan diedit manual.');
  const head = ['TANGGAL','BAHAN','STOK FISIK','STOK SISTEM (skrg)','SELISIH','KETERANGAN'];
  sh.getRange(2, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  sh.setFrozenRows(2);

  const NROW = 60;
  for (let i = 0; i < NROW; i++) {
    const r = 3 + i;
    sh.getRange(r, 4).setFormula(
      '=IF(B' + r + '=""' + S + '""' + S +
      'IFERROR(VLOOKUP(B' + r + S + 'STOK!$A:$G' + S + '7' + S + 'FALSE)' + S + '""))'
    );
    sh.getRange(r, 5).setFormula('=IF(OR(B' + r + '=""' + S + 'C' + r + '=""' + S + ')' + S + '""' + S + 'C' + r + '-D' + r + ')');
  }
  sh.getRange('A:A').setNumberFormat('yyyy-mm-dd');

  // TANGGAL -> keluarkan kalender (bukan ketik manual). Di app Sheets Android,
  // ketuk dua kali (double-tap) selnya untuk memunculkan kalender bisa di-geser.
  const rngTgl = sh.getRange(3, 1, NROW, 1);
  const ruleTgl = SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build();
  rngTgl.setDataValidation(ruleTgl);

  // BAHAN -> dropdown, sumbernya langsung daftar bahan di STOK!A2:A (bukan ketik bebas)
  // supaya tidak ada typo yang bikin VLOOKUP gagal cocok dengan nama di STOK.
  const shStok = ss.getSheetByName('STOK');
  const rngBahan = sh.getRange(3, 2, NROW, 1);
  if (shStok) {
    const sumberBahan = shStok.getRange('A2:A200');
    const ruleBahan = SpreadsheetApp.newDataValidation()
      .requireValueInRange(sumberBahan, true).setAllowInvalid(false).build();
    rngBahan.setDataValidation(ruleBahan);
  }

  sh.autoResizeColumns(1, 6);
  _polesSheet(sh, 6, 1, 2, 3, 2 + NROW);
}

/* JALANKAN MANUAL setelah selesai isi opname hari ini.
 * Baca baris OPNAME yang SELISIH-nya terisi & belum pernah diterapkan
 * (KETERANGAN masih kosong), tulis 1 baris "Koreksi" ke STOK_MUTASI per
 * baris, lalu tandai KETERANGAN supaya tidak diterapkan dobel kalau
 * fungsi ini dijalankan ulang. STOK akan otomatis mengikuti hasil
 * hitung fisik terbaru (SALDO = ...+KOREKSI). */
function terapkanOpname() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName('OPNAME');
  const shMutasi = ss.getSheetByName('STOK_MUTASI');
  if (!sh || !shMutasi) return { ok: false, pesan: 'Sheet OPNAME atau STOK_MUTASI tidak ada.' };

  const last = sh.getLastRow();
  if (last < 3) return { ok: true, diterapkan: 0 };

  const rows = sh.getRange(3, 1, last - 2, 6).getValues();
  const baris = [];
  let diterapkan = 0;

  rows.forEach(function (r, i) {
    const tgl = r[0], bahan = r[1], selisih = r[4], ket = r[5];
    if (bahan === '' || selisih === '' || ket !== '') return; // belum siap / sudah diterapkan
    if (Number(selisih) === 0) {
      sh.getRange(3 + i, 6).setValue('Tidak ada selisih — tidak perlu koreksi');
      return;
    }
    baris.push([tgl || new Date(), bahan, 'Koreksi', Number(selisih), 'Opname ' + Utilities.formatDate(new Date(tgl || new Date()), Session.getScriptTimeZone(), 'yyyy-MM-dd')]);
    sh.getRange(3 + i, 6).setValue('Diterapkan ke STOK_MUTASI ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'));
    diterapkan++;
  });

  if (baris.length) {
    shMutasi.getRange(shMutasi.getLastRow() + 1, 1, baris.length, 5).setValues(baris);
  }
  return { ok: true, diterapkan: diterapkan };
}
function getStok() {
  const sh = SpreadsheetApp.getActive().getSheetByName('STOK');
  if (!sh) return [];
  const data = sh.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < data.length; i++) {
    const b = data[i][0];
    if (!b || String(b).toUpperCase() === 'TOTAL') continue;
    out.push({
      bahan: String(b), satuan: String(data[i][1] || ''),
      saldo: Number(data[i][6]) || 0,
      batasMin: (data[i][7] === '' || data[i][7] === null) ? '' : Number(data[i][7]),
      status: String(data[i][8] || '')
    });
  }
  return out;
}

/* Catat 1 gerakan stok (Masuk / Keluar) */
function catatStok(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName('STOK_MUTASI');
    const jenis = (p.jenis === 'Masuk') ? 'Masuk' : 'Keluar';
    const now = new Date();
    sh.appendRow([now, p.bahan, jenis, Number(p.jumlah) || 0, p.keterangan || '']);

    if (jenis === 'Masuk') {
      const shMasuk = ss.getSheetByName('STOK MASUK');
      if (shMasuk) {
        const r = shMasuk.getLastRow() + 1;
        shMasuk.getRange(r, 1, 1, 3).setValues([[now, p.bahan, Number(p.jumlah) || 0]]);
        // D=HARGA/SATUAN sengaja dikosongkan — diisi manual oleh pemilik di Sheets
        shMasuk.getRange(r, 5).setFormula('=IF(D' + r + '=""' + sepArgumen() + '""' + sepArgumen() + 'C' + r + '*D' + r + ')');
        shMasuk.getRange(r, 6).setFormula('=IF(D' + r + '=""' + sepArgumen() + '"Belum diisi harga"' + sepArgumen() + '"Lengkap")');
      }
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* JALANKAN SEKALI: bikin sheet antrian STOK MASUK. Karyawan input qty
 * lewat HTML (catatStok menulis ke sini otomatis); HARGA/SATUAN diisi
 * MANUAL oleh pemilik kapan saja — tidak menghalangi stok jalan normal. */
function setupStokMasuk() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('STOK MASUK');
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet('STOK MASUK');

  sh.getRange('A1').setValue('STOK MASUK — TANGGAL/BAHAN/QTY terisi otomatis dari HTML kasir. Kolom HARGA/SATUAN diisi MANUAL oleh pemilik kapan saja. Baris kuning = belum diisi harga.');
  const head = ['TANGGAL', 'BAHAN', 'QTY', 'HARGA/SATUAN', 'TOTAL', 'STATUS'];
  sh.getRange(2, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  sh.setFrozenRows(2);
  sh.getRange('A:A').setNumberFormat('yyyy-mm-dd HH:mm');
  sh.getRange('D:E').setNumberFormat('#,##0');

  // Baris kosong belum diisi harga -> kuning, biar kelihatan "utang harga"
  const rng = sh.getRange(3, 1, 500, 6);
  const rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($B3<>""' + sepArgumen() + '$D3="")')
    .setBackground('#fff3cd')
    .setRanges([rng]).build();
  sh.setConditionalFormatRules([rule]);
  sh.autoResizeColumns(1, 6);
  _polesSheet(sh, 6, 1, 2, 3, 502);
}

/* =========================================================
 *  LAPORAN PENJUALAN HARIAN (otomatis dari NOTA & ITEM)
 *  Nota BATAL tidak dihitung.
 * ========================================================= */
function setupLaporanPenjualan() {
  const ss = SpreadsheetApp.getActive();
  const S = sepArgumen(), L = colLetter;
  const NAMA = 'LAPORAN PENJUALAN';
  let sh = ss.getSheetByName(NAMA);
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(NAMA);

  sh.getRange('A1').setValue('LAPORAN PENJUALAN HARIAN — otomatis dari NOTA & ITEM. Nota BATAL tidak dihitung.');
  sh.getRange('A2').setValue('Bulan:');
  sh.getRange('B2').setValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)).setNumberFormat('yyyy-mm-dd');

  const head = ['TANGGAL','JUMLAH NOTA','TOTAL GELAS','OMZET','TUNAI','QRIS','TRANSFER'];
  sh.getRange(3, 1, 1, head.length).setValues([head]).setFontWeight('bold');

  const HARI = 31;
  for (let i = 0; i < HARI; i++) {
    const r = 4 + i;
    const d = '$A' + r, d1 = '($A' + r + '+1)';
    sh.getRange(r, 1).setFormula('=$B$2+' + i).setNumberFormat('yyyy-mm-dd (ddd)');
    sh.getRange(r, 2).setFormula('=COUNTIFS(NOTA!$B:$B' + S + '">="&' + d + S + 'NOTA!$B:$B' + S + '"<"&' + d1 + S + 'NOTA!$I:$I' + S + '"<>BATAL")');
    sh.getRange(r, 3).setFormula('=SUMIFS(ITEM!$E:$E' + S + 'ITEM!$B:$B' + S + '">="&' + d + S + 'ITEM!$B:$B' + S + '"<"&' + d1 + S + 'ITEM!$H:$H' + S + '"<>BATAL")');
    sh.getRange(r, 4).setFormula('=SUMIFS(NOTA!$D:$D' + S + 'NOTA!$B:$B' + S + '">="&' + d + S + 'NOTA!$B:$B' + S + '"<"&' + d1 + S + 'NOTA!$I:$I' + S + '"<>BATAL")');
    sh.getRange(r, 5).setFormula(_metodeF(S, d, d1, 'Tunai'));
    sh.getRange(r, 6).setFormula(_metodeF(S, d, d1, 'QRIS'));
    sh.getRange(r, 7).setFormula(_metodeF(S, d, d1, 'Transfer'));
  }

  const rT = 4 + HARI;
  sh.getRange(rT, 1).setValue('TOTAL');
  for (let c = 2; c <= 7; c++) sh.getRange(rT, c).setFormula('=SUM(' + L(c) + '4:' + L(c) + (rT - 1) + ')');

  sh.getRange(3, 1, 1, 7).setFontWeight('bold');
  sh.getRange(rT, 1, 1, 7).setFontWeight('bold');
  sh.getRange(4, 4, HARI + 1, 4).setNumberFormat('"Rp"#,##0');
  sh.setFrozenRows(3);
  sh.autoResizeColumns(1, 7);
  _polesSheet(sh, 7, 1, 3, 4, rT - 1);
}
function _metodeF(S, d, d1, m) {
  return '=SUMIFS(NOTA!$D:$D' + S + 'NOTA!$B:$B' + S + '">="&' + d + S + 'NOTA!$B:$B' + S + '"<"&' + d1 +
         S + 'NOTA!$G:$G' + S + '"' + m + '"' + S + 'NOTA!$I:$I' + S + '"<>BATAL")';
}

/* =========================================================
 *  LAPORAN PEMAKAIAN & LAPORAN KELUAR LAIN (matriks bahan x tanggal)
 *  Dipisah dari STOK_MUTASI (jenis Keluar) berdasar keterangan:
 *    keterangan diawali "Auto —" -> habis karena laku, otomatis dari RESEP.
 *  Jalankan setupLaporanPemakaian() sekali, lalu jalankan ulang tiap ganti
 *  bulan (B2 bisa diedit manual juga).
 * ========================================================= */
function setupLaporanPemakaian() {
  _buildLaporanKeluarSheet(
    'LAPORAN PEMAKAIAN',
    'LAPORAN PEMAKAIAN HARIAN — otomatis dari STOK_MUTASI, HANYA yang keterangannya diawali "Auto —" (habis karena terjual, dihitung dari RESEP).',
    'Keluar', 'Auto*'
  );
}

/* JALANKAN SEKALI: laporan supaya Anda bisa awasi input karyawan lewat HTML —
 * semua "Masuk" (restock) dan "Keluar" yang BUKAN otomatis dari penjualan
 * (rusak/tumpah/dipakai staf, dicatat manual lewat drawer Stok di HTML). */
function setupLaporanStokMasuk() {
  _buildLaporanKeluarSheet(
    'LAPORAN STOK MASUK',
    'LAPORAN STOK MASUK HARIAN — semua restock (jenis Masuk) di STOK_MUTASI, termasuk yang diinput lewat drawer Stok di HTML kasir. Pakai untuk mengawasi input karyawan.',
    'Masuk', null
  );
}
function setupLaporanStokKeluarManual() {
  _buildLaporanKeluarSheet(
    'LAPORAN STOK KELUAR MANUAL',
    'LAPORAN STOK KELUAR MANUAL HARIAN — Keluar yang BUKAN otomatis dari penjualan (rusak/tumpah/dipakai staf), diinput lewat drawer Stok di HTML kasir. Pemakaian karena jualan ada di LAPORAN PEMAKAIAN. Pakai untuk mengawasi input karyawan.',
    'Keluar', '<>Auto*'
  );
}
function _buildLaporanKeluarSheet(nama, deskripsi, jenis, kriteriaKeterangan) {
  const ss = SpreadsheetApp.getActive();
  const S = sepArgumen(), L = colLetter;
  let sh = ss.getSheetByName(nama);
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(nama);

  const NROW = 40, cD1 = 3, HARI = 31, cDN = cD1 + HARI - 1, cTOT = cDN + 1;

  sh.getRange('A1').setValue(deskripsi);
  sh.getRange('A2').setValue('Bulan:');
  sh.getRange('B2').setValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)).setNumberFormat('yyyy-mm-dd');

  sh.getRange(3, 1).setValue('BAHAN');
  sh.getRange(3, 2).setValue('SATUAN');
  for (let c = cD1; c <= cDN; c++) sh.getRange(3, c).setFormula('=$B$2+' + (c - cD1)).setNumberFormat('d');
  sh.getRange(3, cTOT).setValue('TOTAL');

  for (let r = 4; r < 4 + NROW; r++) {
    const mr = r - 2; // STOK!A2 sejajar baris 4
    sh.getRange(r, 1).setFormula('=IF(STOK!A' + mr + '=""' + S + '""' + S + 'STOK!A' + mr + ')');
    sh.getRange(r, 2).setFormula('=IF(STOK!A' + mr + '=""' + S + '""' + S + 'STOK!B' + mr + ')');
    for (let c = cD1; c <= cDN; c++) {
      const col = L(c);
      const kriteriaExtra = kriteriaKeterangan
        ? (S + 'STOK_MUTASI!$E:$E' + S + '"' + kriteriaKeterangan + '"')
        : '';
      sh.getRange(r, c).setFormula(
        '=IF($A' + r + '=""' + S + '""' + S +
        'SUMIFS(STOK_MUTASI!$D:$D' + S + 'STOK_MUTASI!$B:$B' + S + '$A' + r + S +
        'STOK_MUTASI!$C:$C' + S + '"' + jenis + '"' +
        kriteriaExtra + S +
        'STOK_MUTASI!$A:$A' + S + '">="&' + col + '$3' + S +
        'STOK_MUTASI!$A:$A' + S + '"<"&(' + col + '$3+1)))'
      );
    }
    sh.getRange(r, cTOT).setFormula('=IF($A' + r + '=""' + S + '""' + S + 'SUM(' + L(cD1) + r + ':' + L(cDN) + r + '))');
  }

  const rT = 4 + NROW;
  sh.getRange(rT, 1).setValue('TOTAL');
  for (let c = cD1; c <= cTOT; c++) sh.getRange(rT, c).setFormula('=SUM(' + L(c) + '4:' + L(c) + (rT - 1) + ')');

  sh.getRange(3, 1, 1, cTOT).setFontWeight('bold');
  sh.getRange(rT, 1, 1, cTOT).setFontWeight('bold');
  sh.getRange(4, cD1, NROW, HARI).setNumberFormat('0;-0;');
  sh.getRange(3, cD1, 1, HARI).setHorizontalAlignment('center');
  sh.setFrozenRows(3);
  sh.setFrozenColumns(2);
  sh.autoResizeColumn(1);
  _polesSheet(sh, cTOT, 1, 3, 4, rT - 1);
}

/* =========================================================
 *  TRIGGER OTOMATIS — begitu STOK FISIK di sheet OPNAME diketik,
 *  langsung hitung selisih & tulis Koreksi ke STOK_MUTASI.
 *  Simple trigger (nama fungsi "onEdit" itu sendiri) -> jalan otomatis,
 *  TIDAK perlu diaktifkan lewat menu Trigger, TIDAK perlu dijalankan manual.
 *  terapkanOpname() dibiarkan tetap ada sebagai cadangan (misal setelah
 *  paste banyak baris sekaligus, yang kadang tidak lengkap tertangkap onEdit).
 * ========================================================= */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const sh = e.range.getSheet();
    if (sh.getName() !== 'OPNAME') return;

    const startRow = e.range.getRow(), startCol = e.range.getColumn();
    const numRows = e.range.getNumRows(), numCols = e.range.getNumColumns();
    if (startCol > 3 || startCol + numCols - 1 < 3) return; // di luar kolom C (STOK FISIK)

    const ss = e.source;
    const shStok = ss.getSheetByName('STOK');
    const shMutasi = ss.getSheetByName('STOK_MUTASI');
    if (!shStok || !shMutasi) return;

    const stokLast = shStok.getLastRow();
    if (stokLast < 2) return;
    const stokData = shStok.getRange(2, 1, stokLast - 1, 7).getValues(); // A..G
    const saldoMap = {};
    stokData.forEach(function (r) { if (r[0]) saldoMap[String(r[0]).trim()] = Number(r[6]) || 0; });

    for (let i = 0; i < numRows; i++) {
      const row = startRow + i;
      if (row < 3) continue;

      const fisik = sh.getRange(row, 3).getValue();
      const bahan = String(sh.getRange(row, 2).getValue() || '').trim();
      const ketCell = sh.getRange(row, 6);
      if (fisik === '' || fisik === null || !bahan) continue;

      const stokSistem = saldoMap[bahan];
      if (stokSistem === undefined) { ketCell.setValue('Bahan tidak ditemukan di STOK'); continue; }

      const selisih = Number(fisik) - stokSistem;
      const tgl = sh.getRange(row, 1).getValue() || new Date();
      const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');

      if (selisih === 0) {
        ketCell.setValue('Tidak ada selisih (' + now + ')');
        continue;
      }
      shMutasi.getRange(shMutasi.getLastRow() + 1, 1, 1, 5).setValues(
        [[tgl, bahan, 'Koreksi', selisih, 'Opname otomatis ' + now]]
      );
      ketCell.setValue('Diterapkan otomatis ke STOK_MUTASI ' + now);
      saldoMap[bahan] = Number(fisik); // jaga-jaga kalau 1 bahan diedit >1 baris sekaligus (paste)
    }
  } catch (err) {
    console.error('onEdit OPNAME error: ' + err);
  }
}

/* =========================================================
 *  REKAP SELISIH BULANAN (matriks bahan x tanggal)
 *  SUMIFS langsung dari STOK_MUTASI jenis "Koreksi" — setiap baris Koreksi
 *  ditulis otomatis oleh onEdit() saat STOK FISIK diisi di OPNAME.
 *  Angka bisa negatif (kekurangan/susut) atau positif (kelebihan).
 *  Kolom TOTAL = akumulasi selisih bahan itu sepanjang bulan yang dipilih.
 * ========================================================= */
function setupRekapSelisihBulanan() {
  const ss = SpreadsheetApp.getActive();
  const S = sepArgumen(), L = colLetter;
  const NAMA = 'REKAP SELISIH BULANAN';
  let sh = ss.getSheetByName(NAMA);
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(NAMA);

  const NROW = 40, cD1 = 3, HARI = 31, cDN = cD1 + HARI - 1, cTOT = cDN + 1;

  sh.getRange('A1').setValue('REKAP SELISIH BULANAN — otomatis dari STOK_MUTASI (jenis Koreksi, ditulis onEdit saat opname). Negatif = kekurangan/susut, positif = kelebihan. TOTAL = akumulasi 1 bulan.');
  sh.getRange('A2').setValue('Bulan:');
  sh.getRange('B2').setValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)).setNumberFormat('yyyy-mm-dd');

  sh.getRange(3, 1).setValue('BAHAN');
  sh.getRange(3, 2).setValue('SATUAN');
  for (let c = cD1; c <= cDN; c++) sh.getRange(3, c).setFormula('=$B$2+' + (c - cD1)).setNumberFormat('d');
  sh.getRange(3, cTOT).setValue('TOTAL SELISIH BULAN');

  for (let r = 4; r < 4 + NROW; r++) {
    const mr = r - 2; // STOK!A2 sejajar baris 4
    sh.getRange(r, 1).setFormula('=IF(STOK!A' + mr + '=""' + S + '""' + S + 'STOK!A' + mr + ')');
    sh.getRange(r, 2).setFormula('=IF(STOK!A' + mr + '=""' + S + '""' + S + 'STOK!B' + mr + ')');
    for (let c = cD1; c <= cDN; c++) {
      const col = L(c);
      sh.getRange(r, c).setFormula(
        '=IF($A' + r + '=""' + S + '""' + S +
        'SUMIFS(STOK_MUTASI!$D:$D' + S + 'STOK_MUTASI!$B:$B' + S + '$A' + r + S +
        'STOK_MUTASI!$C:$C' + S + '"Koreksi"' + S +
        'STOK_MUTASI!$A:$A' + S + '">="&' + col + '$3' + S +
        'STOK_MUTASI!$A:$A' + S + '"<"&(' + col + '$3+1)))'
      );
    }
    sh.getRange(r, cTOT).setFormula('=IF($A' + r + '=""' + S + '""' + S + 'SUM(' + L(cD1) + r + ':' + L(cDN) + r + '))');
  }

  const rT = 4 + NROW;
  sh.getRange(rT, 1).setValue('TOTAL SEMUA BAHAN');
  for (let c = cD1; c <= cTOT; c++) sh.getRange(rT, c).setFormula('=SUM(' + L(c) + '4:' + L(c) + (rT - 1) + ')');

  sh.getRange(3, 1, 1, cTOT).setFontWeight('bold');
  sh.getRange(rT, 1, 1, cTOT).setFontWeight('bold');
  sh.getRange(4, cD1, NROW, HARI).setNumberFormat('0;-0;');
  sh.getRange(3, cD1, 1, HARI).setHorizontalAlignment('center');

  // Tandai selisih negatif (kekurangan) merah supaya kelihatan sekilas
  const rngAngka = sh.getRange(4, cD1, NROW, HARI + 1);
  const ruleMinus = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0).setFontColor('#c0392b').setRanges([rngAngka]).build();
  sh.setConditionalFormatRules([ruleMinus]);

  sh.setFrozenRows(3);
  sh.setFrozenColumns(2);
  sh.autoResizeColumn(1);
  _polesSheet(sh, cTOT, 1, 3, 4, rT - 1);
}

/* =========================================================
 *  KAS — pengeluaran tunai harian (bukan penjualan).
 *  UANG DI LACI = TOTAL PENJUALAN (dari NOTA, hari itu) - TOTAL KAS KELUAR.
 *  Penjualan TIDAK dicatat di sini — sudah ada di NOTA, supaya tidak dobel.
 * ========================================================= */
const KATEGORI_KAS = ['Es Batu', 'Beli Galon Air', 'Karyawan Bon', 'Uang Keluar Lainnya'];
const DAFTAR_KASIR = ['Ansor', 'El', 'Gofur', 'Anwar'];

function catatKas(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName('KAS');
    if (!sh) return { ok: false, pesan: 'Sheet KAS belum ada — jalankan setupKas() dulu.' };
    sh.appendRow([new Date(), p.kategori || 'Uang Keluar Lainnya', Number(p.jumlah) || 0, p.kasir || '', p.keterangan || '']);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* JALANKAN SEKALI: bikin sheet KAS. */
function setupKas() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('KAS');
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet('KAS');

  sh.getRange('A1').setValue('KAS — pengeluaran tunai harian (di luar penjualan). Diisi lewat tombol 💰 di HTML kasir. UANG DI LACI dihitung di panel Rekap: TOTAL PENJUALAN hari itu dikurangi TOTAL baris di sini.');
  const head = ['TANGGAL', 'KATEGORI', 'JUMLAH', 'KASIR', 'KETERANGAN'];
  sh.getRange(2, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  sh.setFrozenRows(2);
  sh.getRange('A:A').setNumberFormat('yyyy-mm-dd HH:mm');
  sh.getRange('C:C').setNumberFormat('#,##0');

  const NROW = 500;
  sh.getRange(3, 2, NROW, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(KATEGORI_KAS, true).setAllowInvalid(false).build());
  sh.getRange(3, 4, NROW, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(DAFTAR_KASIR, true).setAllowInvalid(false).build());
  sh.autoResizeColumns(1, 5);
  _polesSheet(sh, 5, 1, 2, 3, 502);
}
