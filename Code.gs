/************************************************************
 * KASIR TEKO — server (Google Apps Script) v7
 * Perubahan dari v6:
 * - HEADER_NOTA: tambah kolom KASIR (kolom ke-9), STATUS geser ke kolom ke-10
 * - simpanNota(): terima payload.kasir, simpan ke sheet NOTA
 * - detailNota(): baca sampai kolom 10, return field kasir
 * - batalkanNota() / _coret(): STATUS sekarang di kolom 10
 * - rekapHari(): STATUS sekarang di kolom 10
 ************************************************************/

const TZ = 'Asia/Jakarta'; // WIB
const LAPORAN_BARIS = 60; // kapasitas baris menu/bahan di semua laporan — naikkan jika item > 60
const SH_MENU = 'MENU';
const SH_NOTA = 'NOTA';
const SH_ITEM = 'ITEM';
const HEADER_NOTA = ['ID_NOTA','TANGGAL','JAM','TOTAL','BAYAR','KEMBALI','METODE','CATATAN','KASIR','STATUS'];
const HEADER_ITEM = ['ID_NOTA','TANGGAL','MENU','KATEGORI','QTY','HARGA','SUBTOTAL','STATUS'];

/* ---------------------------------------------------------
 * RESEP_AWAL — HANYA dipakai setupResep() untuk mengisi sheet RESEP
 * pertama kali. Setelah sheet RESEP ada, sistem membaca dari SHEET,
 * bukan dari sini. Menambah/ubah resep = edit sheet RESEP langsung,
 * TIDAK perlu edit kode ini lagi.
 * --------------------------------------------------------- */
const RESEP_AWAL = {
  'Renjana':           [['Susu', 80], ['Gelas 14oz', 1], ['Konsentrat', 65]],
  'Butterscotch':      [['Butterscotch', 15], ['Susu', 100], ['Gelas 14oz', 1], ['Konsentrat', 40]],
  'Caramel':           [['Caramel', 15], ['Susu', 100], ['Gelas 14oz', 1], ['Konsentrat', 40]],
  'Hazelnut':          [['Hazelnut', 15], ['Susu', 100], ['Gelas 14oz', 1], ['Konsentrat', 40]],
  'Sakala':            [['Susu', 100], ['Gelas 14oz', 1], ['Konsentrat', 40]],
  'Kahwa':             [['Robusta', 2], ['Vanilla', 5], ['Gelas 14oz', 1], ['Fruktosa', 10]],
  'Americano':         [['Robusta', 2], ['Gelas 14oz', 1]],
  'Coffee milo':       [['Robusta', 2], ['Susu', 50], ['Milo 35gr', 1], ['Gelas 14oz', 1]],
  'Extra shot kopi':   [['Robusta', 2]],
  'Matchapresso':      [['Robusta', 2], ['Krimer', 15], ['Susu', 90], ['Matcha 18gr', 1], ['Gelas 14oz', 1]],
  'Kopi panas':        [['Gelas panas', 1], ['Kopi bubuk', 1]],
  'Chocolate':         [['Susu', 100], ['Coklat', 1], ['Gelas 14oz', 1]],
  'Milo malaysia':     [['Susu', 50], ['Milo 45gr', 1], ['Gelas 14oz', 1]],
  'Milo butterscotch': [['Butterscotch', 15], ['Susu', 50], ['Milo 35gr', 1], ['Gelas 14oz', 1]],
  'Milo caramel':      [['Caramel', 15], ['Susu', 50], ['Milo 35gr', 1], ['Gelas 14oz', 1]],
  'Milo hazelnut':     [['Hazelnut', 15], ['Susu', 50], ['Milo 35gr', 1], ['Gelas 14oz', 1]],
  'Redvelvet':         [['Susu', 100], ['Redvelvet', 1], ['Gelas 14oz', 1]],
  'Taro':              [['Taro', 1], ['Gelas 14oz', 1]],
  'Matcha':            [['Susu', 100], ['Matcha 20gr', 1], ['Gelas 14oz', 1]],
  'Matcha aren':       [['Susu', 100], ['Matcha 18gr', 1], ['Gelas 14oz', 1]],
  'Teh':               [['Gelas 18oz', 1]],
  'Milo oreo':         [['Susu', 50], ['Gelas 14oz', 1], ['Milo oreo', 1]],
  'Happy soda':        [['Gelas 18oz', 1], ['Soda', 1], ['Cocopandan', 50]],
  'Lychee squash':     [['Gelas 18oz', 1], ['Fruktosa', 25], ['Soda', 1], ['Leci', 40]],
  'Lemonade squash':   [['Gelas 18oz', 1], ['Fruktosa', 25], ['Soda', 1], ['Lemon', 40]],
  'Passion fruit squash': [['Gelas 18oz', 1], ['Fruktosa', 25], ['Soda', 1], ['Markisa', 40]],
  'Strawberry squash': [['Gelas 18oz', 1], ['Fruktosa', 25], ['Soda', 1], ['Strawberry', 40]],
  'Cocopandan squash': [['Gelas 18oz', 1], ['Fruktosa', 25], ['Soda', 1], ['Cocopandan', 40]],
  'Snack':             [['Sip', 1]]
};

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

/* Ambil SEMUA menu (termasuk nonaktif) untuk halaman Manajemen Produk */
function getDaftarMenu() {
  const sh   = SpreadsheetApp.getActive().getSheetByName(SH_MENU);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const rows = sh.getRange(2, 1, last - 1, 4).getValues();
  return rows
    .map(function(r, i) {
      return { baris: i + 2, nama: String(r[0] || ''), kategori: String(r[1] || ''), harga: Number(r[2]) || 0, aktif: r[3] !== false };
    })
    .filter(function(r) { return r.nama !== ''; });
}

/* Tambah menu baru ke sheet MENU */
function tambahMenu(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName(SH_MENU);
    // Cek duplikat nama (case-insensitive)
    const last = sh.getLastRow();
    if (last >= 2) {
      const names = sh.getRange(2, 1, last - 1, 1).getValues();
      for (let i = 0; i < names.length; i++) {
        if (String(names[i][0]).toLowerCase() === String(p.nama).toLowerCase()) {
          return { ok: false, pesan: 'Menu "' + p.nama + '" sudah ada.' };
        }
      }
    }
    sh.appendRow([p.nama, p.kategori, Number(p.harga) || 0, true]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* Toggle aktif/nonaktif menu — tidak menghapus data */
function toggleAktifMenu(baris, aktifBaru) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName(SH_MENU);
    sh.getRange(baris, 4).setValue(aktifBaru);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* Cek kecukupan stok untuk isi keranjang sebelum transaksi disimpan.
 * Dipanggil dari frontend saat kasir klik "Simpan".
 * Return: { ok: true } kalau semua cukup,
 *         { ok: false, peringatan: [{menu, bahan, butuh, sisa, satuan}] } kalau ada yang kurang. */
function cekStokKeranjang(items) {
  const ss    = SpreadsheetApp.getActive();
  const RESEP = _bacaResep(ss);

  // Hitung total kebutuhan bahan dari keranjang
  const butuh = {};
  (items || []).forEach(function(it) {
    const resep = RESEP[it.nama];
    const qty   = Number(it.qty) || 0;
    if (!resep || qty <= 0) return;
    resep.forEach(function(pair) {
      const bahan = pair[0], perGelas = pair[1];
      if (!butuh[bahan]) butuh[bahan] = { total: 0, menu: [] };
      butuh[bahan].total += perGelas * qty;
      if (butuh[bahan].menu.indexOf(it.nama) < 0) butuh[bahan].menu.push(it.nama);
    });
  });

  // Baca saldo stok saat ini
  const shStok = ss.getSheetByName('STOK');
  const saldo  = {};
  const satuan = {};
  if (shStok) {
    const last = shStok.getLastRow();
    if (last >= 2) {
      const rows = shStok.getRange(2, 1, last - 1, 9).getValues();
      rows.forEach(function(r) {
        if (r[0]) {
          saldo[String(r[0])]  = Number(r[6]) || 0;
          satuan[String(r[0])] = String(r[1] || '');
        }
      });
    }
  }

  // Bandingkan kebutuhan vs saldo
  const peringatan = [];
  Object.keys(butuh).forEach(function(bahan) {
    const sisa  = saldo[bahan] !== undefined ? saldo[bahan] : null;
    const perlu = butuh[bahan].total;
    if (sisa === null) return; // bahan tidak ada di sheet STOK, skip
    if (sisa < perlu) {
      peringatan.push({
        bahan:  bahan,
        butuh:  perlu,
        sisa:   sisa,
        kurang: perlu - sisa,
        satuan: satuan[bahan] || '',
        menu:   butuh[bahan].menu.join(', ')
      });
    }
  });

  if (peringatan.length > 0) return { ok: false, peringatan: peringatan };
  return { ok: true };
}

/* Simpan 1 nota (header ke NOTA, rincian ke ITEM) */
function simpanNota(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss   = SpreadsheetApp.getActive();
    const shNota = ss.getSheetByName(SH_NOTA);
    const shItem = ss.getSheetByName(SH_ITEM);
    const now    = new Date();
    const tglStr = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');
    const jam    = Utilities.formatDate(now, TZ, 'HH:mm:ss');
    const idNota = buatIdNota(shNota, now);

    let total = 0;
    const items     = payload.items || [];
    const barisItem = [];
    items.forEach(function(it) {
      const qty   = Number(it.qty)   || 0;
      const harga = Number(it.harga) || 0;
      const sub   = qty * harga;
      total += sub;
      barisItem.push([idNota, now, it.nama, it.kategori || '', qty, harga, sub, '']);
    });

    const bayar   = Number(payload.bayar)  || 0;
    const metode  = payload.metode         || 'Tunai';
    const kembali = bayar > 0 ? (bayar - total) : 0;
    const kasir   = payload.kasir          || '';  // ← BARU: kolom KASIR (kolom ke-9)

    // Kolom: ID_NOTA | TANGGAL | JAM | TOTAL | BAYAR | KEMBALI | METODE | CATATAN | KASIR | STATUS
    shNota.appendRow([idNota, now, jam, total, bayar, kembali, metode, payload.catatan || '', kasir, '']);

    if (barisItem.length) {
      shItem.getRange(shItem.getLastRow() + 1, 1, barisItem.length, 8).setValues(barisItem);
    }
    _potongStokDariResep(ss, items, idNota, now);

    return {
      ok: true, idNota: idNota, tgl: tglStr, jam: jam,
      total: total, bayar: bayar, kembali: kembali,
      metode: metode, catatan: payload.catatan || '', kasir: kasir, items: items
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
    ids.forEach(function(r) {
      const s = String(r[0]);
      if (s.indexOf(prefix) === 0) {
        const n = parseInt(s.split('-')[1], 10);
        if (!isNaN(n) && n > maxN) maxN = n;
      }
    });
  }
  return prefix + '-' + ('000' + (maxN + 1)).slice(-3);
}

/* Potong STOK_MUTASI otomatis (jenis 'Keluar') berdasar sheet RESEP. */
function _potongStokDariResep(ss, items, idNota, now) {
  const shMutasi = ss.getSheetByName('STOK_MUTASI');
  if (!shMutasi) return;
  const RESEP = _bacaResep(ss);
  const pakai = {};
  items.forEach(function(it) {
    const resep = RESEP[it.nama];
    const qty   = Number(it.qty) || 0;
    if (!resep || qty <= 0) return;
    resep.forEach(function(pair) {
      const bahan = pair[0], perGelas = pair[1];
      pakai[bahan] = (pakai[bahan] || 0) + perGelas * qty;
    });
  });
  const baris = Object.keys(pakai).map(function(bahan) {
    return [now, bahan, 'Keluar', pakai[bahan], 'Auto — ' + idNota];
  });
  if (baris.length) {
    shMutasi.getRange(shMutasi.getLastRow() + 1, 1, baris.length, 5).setValues(baris);
  }
}

/* Baca sheet RESEP -> { menu: [[bahan, jumlah], ...] }. */
function _bacaResep(ss) {
  const sh  = ss.getSheetByName('RESEP');
  const map = {};
  if (!sh) return map;
  const last = sh.getLastRow();
  if (last < 3) return map;
  const rows = sh.getRange(3, 1, last - 2, 3).getValues();
  rows.forEach(function(r) {
    const menu  = String(r[0] || '').trim();
    const bahan = String(r[1] || '').trim();
    const jml   = Number(r[2]) || 0;
    if (!menu || !bahan || jml <= 0) return;
    if (!map[menu]) map[menu] = [];
    map[menu].push([bahan, jml]);
  });
  return map;
}

/* ---------- helper tanggal ---------- */
function _tglStr(v) { return (v instanceof Date) ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v); }
function _jamStr(v) { return (v instanceof Date) ? Utilities.formatDate(v, TZ, 'HH:mm:ss')  : String(v); }

/* Rekap 1 tanggal (default hari ini) */
function rekapHari(tglStr) {
  const ss = SpreadsheetApp.getActive();
  if (!tglStr) tglStr = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const res = {
    tgl: tglStr, jumlahNota: 0, totalGelas: 0, totalOmzet: 0,
    perMetode: { Tunai: 0, QRIS: 0, Transfer: 0 }, nota: [],
    kasKeluar: [], totalKasKeluar: 0, uangDiLaci: 0
  };

  const shNota = ss.getSheetByName(SH_NOTA);
  const lastN  = shNota.getLastRow();
  if (lastN >= 2) {
    // Baca 10 kolom: kolom ke-10 (index 9) = STATUS  (v7: KASIR di kolom 9, STATUS di kolom 10)
    const rows = shNota.getRange(2, 1, lastN - 1, 10).getValues();
    rows.forEach(function(r) {
      if (!r[0]) return;
      if (_tglStr(r[1]) !== tglStr) return;
      const batal  = String(r[9]).toUpperCase() === 'BATAL';   // ← kolom 10 (index 9)
      const total  = Number(r[3]) || 0;
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
  const lastI  = shItem.getLastRow();
  const perMenu = {};
  if (lastI >= 2) {
    const it = shItem.getRange(2, 1, lastI - 1, 8).getValues();
    it.forEach(function(x) {
      if (_tglStr(x[1]) === tglStr && String(x[7]).toUpperCase() !== 'BATAL') {
        res.totalGelas += Number(x[4]) || 0;
        const nama = String(x[2] || '');
        if (!nama) return;
        if (!perMenu[nama]) perMenu[nama] = { menu: nama, qty: 0, subtotal: 0 };
        perMenu[nama].qty      += Number(x[4]) || 0;
        perMenu[nama].subtotal += Number(x[6]) || 0;
      }
    });
  }
  res.perMenu = Object.values(perMenu).sort(function(a, b) { return b.qty - a.qty; });

  const shKas = ss.getSheetByName('KAS');
  if (shKas) {
    const lastK = shKas.getLastRow();
    if (lastK >= 2) {
      const kk = shKas.getRange(2, 1, lastK - 1, 5).getValues();
      kk.forEach(function(r) {
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

/* Dashboard — data lengkap untuk halaman dashboard:
 * - ringkasan hari ini
 * - omzet 7 hari terakhir
 * - top 5 menu bulan ini
 * - performa per kasir bulan ini */
function getDashboard() {
  const ss  = SpreadsheetApp.getActive();
  const now = new Date();
  const tglHariIni = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');

  // Batas waktu bulan ini
  const tglAwalBulan = new Date(now.getFullYear(), now.getMonth(), 1);
  const tglAwalBulanStr = Utilities.formatDate(tglAwalBulan, TZ, 'yyyy-MM-dd');

  // Siapkan 7 hari terakhir
  var hari7 = [];
  for (var d = 6; d >= 0; d--) {
    var tgl = new Date(now); tgl.setDate(now.getDate() - d);
    hari7.push(Utilities.formatDate(tgl, TZ, 'yyyy-MM-dd'));
  }

  // Baca semua NOTA sekaligus
  var shNota = ss.getSheetByName(SH_NOTA);
  var lastN  = shNota.getLastRow();
  var notaRows = lastN >= 2 ? shNota.getRange(2, 1, lastN - 1, 10).getValues() : [];

  // Baca semua ITEM sekaligus
  var shItem = ss.getSheetByName(SH_ITEM);
  var lastI  = shItem.getLastRow();
  var itemRows = lastI >= 2 ? shItem.getRange(2, 1, lastI - 1, 8).getValues() : [];

  // Baca KAS
  var shKas = ss.getSheetByName('KAS');
  var kasRows = [];
  if (shKas) {
    var lastK = shKas.getLastRow();
    if (lastK >= 2) kasRows = shKas.getRange(2, 1, lastK - 1, 5).getValues();
  }

  // ---- Hitung ringkasan hari ini ----
  var hariIni = { omzet:0, nota:0, gelas:0, tunai:0, qris:0, transfer:0, kasKeluar:0 };
  notaRows.forEach(function(r) {
    if (!r[0] || _tglStr(r[1]) !== tglHariIni) return;
    if (String(r[9]).toUpperCase() === 'BATAL') return;
    hariIni.omzet += Number(r[3])||0;
    hariIni.nota++;
    var m = String(r[6]||'');
    if (m==='Tunai') hariIni.tunai += Number(r[3])||0;
    else if (m==='QRIS') hariIni.qris += Number(r[3])||0;
    else if (m==='Transfer') hariIni.transfer += Number(r[3])||0;
  });
  itemRows.forEach(function(r) {
    if (_tglStr(r[1])===tglHariIni && String(r[7]).toUpperCase()!=='BATAL') hariIni.gelas += Number(r[4])||0;
  });
  kasRows.forEach(function(r) {
    if (_tglStr(r[0])===tglHariIni) hariIni.kasKeluar += Number(r[2])||0;
  });
  hariIni.laci = hariIni.omzet - hariIni.kasKeluar;

  // ---- Omzet 7 hari terakhir ----
  var omzet7 = {};
  hari7.forEach(function(t) { omzet7[t] = 0; });
  notaRows.forEach(function(r) {
    if (!r[0]) return;
    var t = _tglStr(r[1]);
    if (omzet7[t] === undefined) return;
    if (String(r[9]).toUpperCase() === 'BATAL') return;
    omzet7[t] += Number(r[3])||0;
  });
  var grafik7 = hari7.map(function(t) { return { tgl: t, omzet: omzet7[t] }; });

  // ---- Top 5 menu bulan ini ----
  var perMenu = {};
  itemRows.forEach(function(r) {
    var t = _tglStr(r[1]);
    if (t < tglAwalBulanStr) return;
    if (String(r[7]).toUpperCase() === 'BATAL') return;
    var nama = String(r[2]||''); if (!nama) return;
    if (!perMenu[nama]) perMenu[nama] = { menu: nama, qty: 0, omzet: 0 };
    perMenu[nama].qty   += Number(r[4])||0;
    perMenu[nama].omzet += Number(r[6])||0;
  });
  var top5 = Object.values(perMenu)
    .sort(function(a,b) { return b.qty - a.qty; })
    .slice(0, 5);

  // ---- Performa per kasir bulan ini ----
  var perKasir = {};
  notaRows.forEach(function(r) {
    if (!r[0]) return;
    var t = _tglStr(r[1]);
    if (t < tglAwalBulanStr) return;
    if (String(r[9]).toUpperCase() === 'BATAL') return;
    var kasir = String(r[8]||'(Tidak dicatat)');
    if (!perKasir[kasir]) perKasir[kasir] = { kasir: kasir, nota: 0, omzet: 0 };
    perKasir[kasir].nota++;
    perKasir[kasir].omzet += Number(r[3])||0;
  });
  var kasirList = Object.values(perKasir).sort(function(a,b) { return b.omzet - a.omzet; });

  // ---- Ringkasan bulan ini ----
  var bulanIni = { omzet:0, nota:0, gelas:0 };
  notaRows.forEach(function(r) {
    if (!r[0] || _tglStr(r[1]) < tglAwalBulanStr) return;
    if (String(r[9]).toUpperCase() === 'BATAL') return;
    bulanIni.omzet += Number(r[3])||0;
    bulanIni.nota++;
  });
  itemRows.forEach(function(r) {
    if (_tglStr(r[1]) >= tglAwalBulanStr && String(r[7]).toUpperCase()!=='BATAL')
      bulanIni.gelas += Number(r[4])||0;
  });

  return {
    tglHariIni: tglHariIni,
    namaBulan:  Utilities.formatDate(now, TZ, 'MMMM yyyy'),
    hariIni:    hariIni,
    bulanIni:   bulanIni,
    grafik7:    grafik7,
    top5:       top5,
    kasirList:  kasirList
  };
}

/* Rincian 1 nota */
function detailNota(id) {
  const ss    = SpreadsheetApp.getActive();
  const items = [];
  const shItem = ss.getSheetByName(SH_ITEM);
  const lastI  = shItem.getLastRow();
  if (lastI >= 2) {
    const rows = shItem.getRange(2, 1, lastI - 1, 7).getValues();
    rows.forEach(function(r) {
      if (String(r[0]) === String(id))
        items.push({ nama: r[2], kategori: r[3], qty: Number(r[4]) || 0,
                     harga: Number(r[5]) || 0, sub: Number(r[6]) || 0 });
    });
  }

  let head = null;
  const shNota = ss.getSheetByName(SH_NOTA);
  const lastN  = shNota.getLastRow();
  if (lastN >= 2) {
    // Baca 10 kolom: KASIR di kolom 9 (index 8), STATUS di kolom 10 (index 9)
    const nr = shNota.getRange(2, 1, lastN - 1, 10).getValues();
    for (let i = 0; i < nr.length; i++) {
      if (String(nr[i][0]) === String(id)) {
        head = {
          idNota:  nr[i][0],
          tgl:     _tglStr(nr[i][1]),
          jam:     _jamStr(nr[i][2]),
          total:   Number(nr[i][3]) || 0,
          bayar:   Number(nr[i][4]) || 0,
          kembali: Number(nr[i][5]) || 0,
          metode:  nr[i][6] || '',
          catatan: nr[i][7] || '',
          kasir:   nr[i][8] || '',           // ← BARU: kolom ke-9
          status:  String(nr[i][9] || '')    // ← kolom ke-10
        };
        break;
      }
    }
  }
  // Jika nota dibatalkan, ambil info siapa & kapan dari LOG BATAL
  if (head && String(head.status).toUpperCase() === 'BATAL') {
    const shLog = ss.getSheetByName('LOG BATAL');
    if (shLog) {
      const lastL = shLog.getLastRow();
      if (lastL >= 2) {
        const logs = shLog.getRange(2, 1, lastL - 1, 3).getValues();
        for (let i = logs.length - 1; i >= 0; i--) {  // cari dari bawah (terbaru)
          if (String(logs[i][1]) === String(id)) {
            head.batalOleh  = String(logs[i][2] || '');
            head.batalWaktu = (logs[i][0] instanceof Date)
              ? Utilities.formatDate(logs[i][0], TZ, 'dd/MM HH:mm') : String(logs[i][0]);
            break;
          }
        }
      }
    }
  }
  return { head: head, items: items };
}

/* Batalkan 1 nota = DICORET (BATAL), tidak dihapus.
 * v0.7.2: terima {id, kasir} — catat siapa & kapan membatalkan ke sheet LOG BATAL.
 * Tetap kompatibel dengan panggilan lama yang hanya kirim id (string). */
function batalkanNota(p) {
  const id    = (p && typeof p === 'object') ? p.id : p;
  const kasir = (p && typeof p === 'object') ? (p.kasir || '') : '';
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActive();
    _coret(ss.getSheetByName(SH_ITEM), id, 8);   // STATUS ITEM di kolom H (8)
    _coret(ss.getSheetByName(SH_NOTA), id, 10);  // STATUS NOTA di kolom J (10)
    _batalkanPotonganStok(ss, id);
    _catatLogBatal(ss, id, kasir);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* Catat pembatalan ke sheet LOG BATAL (audit trail, append-only) */
function _catatLogBatal(ss, id, kasir) {
  let sh = ss.getSheetByName('LOG BATAL');
  if (!sh) {
    sh = ss.insertSheet('LOG BATAL');
    sh.getRange(1, 1, 1, 4).setValues([['WAKTU', 'ID_NOTA', 'DIBATALKAN OLEH', 'TOTAL NOTA']]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('yyyy-mm-dd HH:mm:ss');
    sh.getRange('D:D').setNumberFormat('"Rp"#,##0');
    sh.setColumnWidth(1, 150); sh.setColumnWidth(2, 130);
    sh.setColumnWidth(3, 150); sh.setColumnWidth(4, 110);
    _polesSheet(sh, 4, null, 1, 2, 50);
    sh.getRange('A1').setNote('Audit trail pembatalan nota — append-only, jangan diedit.');
  }
  // Ambil total nota untuk konteks audit
  let total = '';
  const shNota = ss.getSheetByName(SH_NOTA);
  const last   = shNota.getLastRow();
  if (last >= 2) {
    const rows = shNota.getRange(2, 1, last - 1, 4).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]) === String(id)) { total = Number(rows[i][3]) || 0; break; }
    }
  }
  sh.appendRow([new Date(), id, kasir || '(tidak diketahui)', total]);
}

/* Balikkan potongan stok otomatis milik 1 idNota. */
function _batalkanPotonganStok(ss, id) {
  const sh   = ss.getSheetByName('STOK_MUTASI');
  if (!sh) return;
  const last = sh.getLastRow();
  if (last < 2) return;
  const tag  = 'Auto — ' + id;
  const rows = sh.getRange(2, 1, last - 1, 5).getValues();
  const balik = {};
  rows.forEach(function(r) {
    if (String(r[4]) === tag && String(r[2]) === 'Keluar') {
      balik[r[1]] = (balik[r[1]] || 0) + (Number(r[3]) || 0);
    }
  });
  const now   = new Date();
  const baris = Object.keys(balik).map(function(bahan) {
    return [now, bahan, 'Masuk', balik[bahan], 'Reversal batal — ' + id];
  });
  if (baris.length) sh.getRange(sh.getLastRow() + 1, 1, baris.length, 5).setValues(baris);
}

function _coret(sh, id, statusCol) {
  if (!sh) return;
  const last = sh.getLastRow();
  if (last < 2) return;
  const ids   = sh.getRange(2, 1, last - 1, 1).getValues();
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
 * JALANKAN SEKALI: buat sheet MENU dengan menu awal
 * ========================================================= */
function setupMenu() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SH_MENU);
  if (sh) { Logger.log('Sheet MENU sudah ada — dilewati agar data tidak hilang. Hapus manual jika ingin reset.'); return; }
  sh = ss.insertSheet(SH_MENU);
  const head = ['NAMA', 'KATEGORI', 'HARGA', 'AKTIF'];
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  sh.setFrozenRows(1);
  const menuAwal = [
    ['Renjana','Kopi',10000,true],['Butterscotch','Kopi',12000,true],['Caramel','Kopi',12000,true],
    ['Hazelnut','Kopi',12000,true],['Sakala','Kopi',10000,true],['Kahwa','Kopi',10000,true],
    ['Americano','Kopi',8000,true],['Coffee milo','Kopi',12000,true],['Extra shot kopi','Kopi',2000,true],
    ['Matchapresso','Kopi',12000,true],['Kopi panas','Kopi',5000,true],
    ['Chocolate','Non kopi',10000,true],['Milo malaysia','Non kopi',12000,true],['Milo butterscotch','Non kopi',12000,true],
    ['Milo caramel','Non kopi',12000,true],['Milo hazelnut','Non kopi',12000,true],['Redvelvet','Non kopi',10000,true],
    ['Taro','Non kopi',10000,true],['Matcha','Non kopi',10000,true],['Matcha aren','Non kopi',12000,true],
    ['Teh','Non kopi',5000,true],['Milo oreo','Non kopi',12000,true],
    ['Happy soda','Soda',15000,true],['Lychee squash','Soda',12000,true],['Lemonade squash','Soda',12000,true],
    ['Passion fruit squash','Soda',12000,true],['Strawberry squash','Soda',12000,true],
    ['Cocopandan squash','Soda',12000,true],['Snack','Snack',1000,true]
  ];
  sh.getRange(2, 1, menuAwal.length, 4).setValues(menuAwal);
  sh.getRange(2, 3, menuAwal.length, 1).setNumberFormat('#,##0');
  sh.autoResizeColumns(1, 4);
  _polesSheet(sh, 4, null, 1, 2, 1 + menuAwal.length);
}

/* =========================================================
 * SETUP SEMUA — JALANKAN SEKALI SAAT PASANG PERTAMA KALI
 * Menjalankan semua fungsi setup dengan urutan yang benar.
 * Aman: sheet MENU yang sudah ada tidak akan ditimpa.
 * PERHATIAN: sheet STOK, RESEP, OPNAME, KAS, dan semua laporan
 * akan DIBUAT ULANG (data di dalamnya hilang).
 * ========================================================= */
function setupSemua() {
  Logger.log('=== SETUP SEMUA DIMULAI ===');
  Logger.log('[1/8] setupMenu — sheet MENU…');
  setupMenu();
  Logger.log('[2/8] setupSheets — header NOTA & ITEM…');
  setupSheets();
  Logger.log('[3/8] setupStok — sheet STOK & STOK_MUTASI…');
  setupStok();
  Logger.log('[4/8] setupResep — sheet RESEP (butuh MENU & STOK)…');
  setupResep();
  Logger.log('[5/8] setupKas — sheet KAS…');
  setupKas();
  Logger.log('[6/8] setupOpname — sheet OPNAME (butuh STOK)…');
  setupOpname();
  Logger.log('[7/8] setupStokMasuk — sheet STOK MASUK…');
  setupStokMasuk();
  Logger.log('[8/8] setupSemuaLaporan — semua sheet laporan…');
  setupSemuaLaporan();
  Logger.log('=== SETUP SEMUA SELESAI — sistem siap dipakai ===');
}

/* =========================================================
 * BACKUP OTOMATIS HARIAN
 * backupHarian()       — salin seluruh Spreadsheet ke folder BACKUP di Drive
 * setupBackupOtomatis() — JALANKAN SEKALI: pasang trigger otomatis tiap hari jam 23:00 WIB
 * Menyimpan 7 backup terakhir; yang lebih lama otomatis dihapus (ke Trash).
 * ========================================================= */
const BACKUP_FOLDER = 'BACKUP KASIR TEKO';
const BACKUP_SIMPAN = 7; // jumlah backup terakhir yang disimpan

function backupHarian() {
  const ss   = SpreadsheetApp.getActive();
  const file = DriveApp.getFileById(ss.getId());

  // Cari atau buat folder backup
  let folder;
  const cari = DriveApp.getFoldersByName(BACKUP_FOLDER);
  folder = cari.hasNext() ? cari.next() : DriveApp.createFolder(BACKUP_FOLDER);

  // Salin spreadsheet dengan nama bertanggal
  const nama = 'BACKUP ' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH.mm') + ' — Kasir Teko';
  file.makeCopy(nama, folder);

  // Hapus backup lama — simpan hanya BACKUP_SIMPAN terbaru
  const daftar = [];
  const it = folder.getFiles();
  while (it.hasNext()) daftar.push(it.next());
  daftar.sort(function(a, b) { return b.getDateCreated() - a.getDateCreated(); });
  for (let i = BACKUP_SIMPAN; i < daftar.length; i++) daftar[i].setTrashed(true);

  Logger.log('Backup selesai: ' + nama + ' (total tersimpan: ' + Math.min(daftar.length, BACKUP_SIMPAN) + ')');
}

function setupBackupOtomatis() {
  // Hapus trigger backup lama agar tidak dobel
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'backupHarian') ScriptApp.deleteTrigger(t);
  });
  // Pasang trigger harian jam 23:00
  ScriptApp.newTrigger('backupHarian').timeBased().everyDays(1).atHour(23).create();
  Logger.log('Trigger backup otomatis terpasang: setiap hari sekitar jam 23:00.');
  // Jalankan backup pertama sekarang sebagai uji
  backupHarian();
}

/* =========================================================
 * ARSIP TAHUNAN — jaga performa jangka panjang.
 * arsipTahunLalu() — JALANKAN SEKALI setiap awal tahun (mis. awal Januari).
 * Memindahkan semua data SEBELUM 1 Januari tahun berjalan
 * (NOTA, ITEM, STOK_MUTASI, KAS, LOG BATAL) ke file Spreadsheet arsip baru.
 * AMAN: backup otomatis dibuat dulu, dan efek mutasi stok yang diarsip
 * digulung ke SALDO AWAL sehingga saldo stok tetap akurat.
 * ========================================================= */
function arsipTahunLalu() {
  const batas = new Date(new Date().getFullYear(), 0, 1); // 1 Januari tahun ini
  return _arsipkanSebelum(batas);
}

function _arsipkanSebelum(batas) {
  const lock = LockService.getScriptLock();
  lock.waitLock(60000);
  try {
    // 0) Keamanan: backup dulu sebelum memindah apapun
    backupHarian();

    const ss    = SpreadsheetApp.getActive();
    const label = 'ARSIP KASIR TEKO — data sebelum ' + Utilities.formatDate(batas, TZ, 'yyyy-MM-dd');
    const arsip = SpreadsheetApp.create(label);

    const target = [
      { nama: SH_NOTA,      kolTgl: 2, nCols: 10, statusIdx: 9 },
      { nama: SH_ITEM,      kolTgl: 2, nCols: 8,  statusIdx: 7 },
      { nama: 'STOK_MUTASI',kolTgl: 1, nCols: 5,  rollup: true },
      { nama: 'KAS',        kolTgl: 1, nCols: 5 },
      { nama: 'LOG BATAL',  kolTgl: 1, nCols: 4 }
    ];

    const rollup   = {}; // bahan -> efek bersih (Masuk − Keluar + Koreksi) dari baris yang diarsip
    const ringkas  = [];

    target.forEach(function(t) {
      const sh = ss.getSheetByName(t.nama);
      if (!sh) return;
      const last = sh.getLastRow();
      if (last < 2) return;

      const data   = sh.getRange(2, 1, last - 1, t.nCols).getValues();
      const pindah = [], tetap = [];

      data.forEach(function(r) {
        if (!r[0] && !r[1]) return; // baris kosong — buang
        const tgl   = r[t.kolTgl - 1];
        const isOld = (tgl instanceof Date) && tgl < batas;
        if (isOld) {
          pindah.push(r);
          if (t.rollup) {
            const bahan = String(r[1]), jenis = String(r[2]), jml = Number(r[3]) || 0;
            if (!rollup[bahan]) rollup[bahan] = 0;
            if (jenis === 'Masuk')   rollup[bahan] += jml;
            if (jenis === 'Keluar')  rollup[bahan] -= jml;
            if (jenis === 'Koreksi') rollup[bahan] += jml;
          }
        } else {
          tetap.push(r);
        }
      });

      // Tulis ke file arsip (header + baris lama)
      const as = arsip.insertSheet(t.nama);
      as.getRange(1, 1, 1, t.nCols).setValues(sh.getRange(1, 1, 1, t.nCols).getValues()).setFontWeight('bold');
      as.setFrozenRows(1);
      if (pindah.length) as.getRange(2, 1, pindah.length, t.nCols).setValues(pindah);

      // Tulis ulang sheet utama: bersihkan area data + reset format coret, lalu isi baris yang tetap
      const area = sh.getRange(2, 1, last - 1, t.nCols);
      area.clearContent();
      area.setFontLine('none').setFontColor(null);
      if (tetap.length) sh.getRange(2, 1, tetap.length, t.nCols).setValues(tetap);

      // Terapkan ulang coret merah untuk baris BATAL yang masih tersisa
      if (t.statusIdx !== undefined) {
        for (let i = 0; i < tetap.length; i++) {
          if (String(tetap[i][t.statusIdx]).toUpperCase() === 'BATAL') {
            sh.getRange(2 + i, 1, 1, t.nCols).setFontLine('line-through').setFontColor('#c0392b');
          }
        }
      }
      ringkas.push(t.nama + ': ' + pindah.length + ' baris diarsip, ' + tetap.length + ' tersisa');
    });

    // Gulung efek mutasi yang diarsip ke SALDO AWAL sheet STOK (kolom C)
    const shStok = ss.getSheetByName('STOK');
    if (shStok) {
      const lastS = shStok.getLastRow();
      if (lastS >= 2) {
        const namaBahan = shStok.getRange(2, 1, lastS - 1, 1).getValues();
        for (let i = 0; i < namaBahan.length; i++) {
          const b = String(namaBahan[i][0] || '');
          if (b && rollup[b]) {
            const sel  = shStok.getRange(2 + i, 3);
            sel.setValue((Number(sel.getValue()) || 0) + rollup[b]);
          }
        }
      }
    }

    // Rapikan file arsip: hapus Sheet1 default
    const s1 = arsip.getSheetByName('Sheet1');
    if (s1 && arsip.getSheets().length > 1) arsip.deleteSheet(s1);

    const pesan = 'ARSIP SELESAI.\n' + ringkas.join('\n') +
      '\nSaldo stok tetap akurat (efek mutasi lama digulung ke SALDO AWAL).' +
      '\nFile arsip: ' + arsip.getUrl();
    Logger.log(pesan);
    return { ok: true, url: arsip.getUrl(), ringkas: ringkas };
  } finally {
    lock.releaseLock();
  }
}

/* =========================================================
 * JALANKAN SEKALI: pastikan NOTA & ITEM punya baris judul.
 * PENTING v7: Jika sheet NOTA sudah ada dengan 9 kolom lama,
 * jalankan migrasiKolomKasir() dulu sebelum setupSheets().
 * ========================================================= */
function setupSheets() {
  const ss = SpreadsheetApp.getActive();
  pastikanHeader(ss.getSheetByName(SH_NOTA), HEADER_NOTA);
  pastikanHeader(ss.getSheetByName(SH_ITEM), HEADER_ITEM);
}

function pastikanHeader(sh, judul) {
  if (!sh) return;
  const a1 = String(sh.getRange(1, 1).getValue()).trim().toUpperCase();
  if (a1 !== judul[0]) sh.insertRowBefore(1);
  sh.getRange(1, 1, 1, judul.length).setValues([judul]).setFontWeight('bold');
  sh.setFrozenRows(1);
}

/* =========================================================
 * MIGRASI v6 → v7: Sisipkan kolom KASIR ke kolom 9 di sheet NOTA
 * yang sudah punya data dari versi lama (9 kolom: tanpa KASIR).
 * JALANKAN SEKALI sebelum deploy v7 jika sheet NOTA sudah berisi data.
 * Aman dijalankan ulang — fungsi deteksi apakah kolom sudah ada.
 * ========================================================= */
function migrasiKolomKasir() {
  const ss     = SpreadsheetApp.getActive();
  const shNota = ss.getSheetByName(SH_NOTA);
  if (!shNota) { Logger.log('Sheet NOTA tidak ditemukan.'); return; }

  const header = shNota.getRange(1, 1, 1, shNota.getLastColumn()).getValues()[0];
  const sudahAda = header.some(function(h) { return String(h).toUpperCase() === 'KASIR'; });
  if (sudahAda) { Logger.log('Kolom KASIR sudah ada — migrasi dilewati.'); return; }

  // Sisipkan kolom kosong di posisi 9 (sebelum kolom STATUS lama)
  shNota.insertColumnBefore(9);
  shNota.getRange(1, 9).setValue('KASIR').setFontWeight('bold');
  Logger.log('Migrasi selesai: kolom KASIR ditambahkan di kolom 9 sheet NOTA.');
}

/* OPSIONAL — hapus semua data transaksi (judul tetap), untuk mulai bersih. */
function hapusSemuaTransaksi() {
  const ss = SpreadsheetApp.getActive();
  [SH_NOTA, SH_ITEM, 'STOK_MUTASI'].forEach(function(nm) {
    const sh   = ss.getSheetByName(nm);
    if (!sh) return;
    const last = sh.getLastRow();
    if (last >= 2) sh.getRange(2, 1, last - 1, sh.getLastColumn()).clearContent();
  });
}

/* Uji langsung ke Sheet: pemisah argumen (',' atau ';') */
function sepArgumen() {
  const ss  = SpreadsheetApp.getActive();
  const tmp = ss.insertSheet('_uji_sep_' + new Date().getTime());
  let sep   = ';';
  try {
    tmp.getRange('A1').setFormula('=IF(TRUE,1,2)');
    SpreadsheetApp.flush();
    const v = tmp.getRange('A1').getValue();
    if (v === 1 || v === '1') sep = ',';
  } catch(e) { sep = ';'; } finally { ss.deleteSheet(tmp); }
  return sep;
}

/* =========================================================
 * JALANKAN SEKALI: buat/segarkan sheet RESEP
 * ========================================================= */
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
  Object.keys(RESEP_AWAL).forEach(function(menu) {
    RESEP_AWAL[menu].forEach(function(pair) { rows.push([menu, pair[0], pair[1]]); });
  });
  if (rows.length) sh.getRange(3, 1, rows.length, 3).setValues(rows);
  const NROW   = 300;
  const shMenu = ss.getSheetByName(SH_MENU);
  const shStok = ss.getSheetByName('STOK');
  if (shMenu) {
    sh.getRange(3, 1, NROW, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInRange(shMenu.getRange('A2:A200'), true).setAllowInvalid(false).build());
  }
  if (shStok) {
    sh.getRange(3, 2, NROW, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInRange(shStok.getRange('A2:A200'), true).setAllowInvalid(false).build());
  }
  sh.autoResizeColumns(1, 3);
  _polesSheet(sh, 3, 3, 2, 3 + Math.max(rows.length, 1) - 1);
}

/* =========================================================
 * FITUR STOK
 * ========================================================= */
function setupStok() {
  const ss = SpreadsheetApp.getActive();
  const S  = sepArgumen();

  let m = ss.getSheetByName('STOK_MUTASI');
  if (m) ss.deleteSheet(m);
  m = ss.insertSheet('STOK_MUTASI');
  m.getRange(1, 1, 1, 5).setValues([['TANGGAL', 'BAHAN', 'JENIS', 'JUMLAH', 'KETERANGAN']]).setFontWeight('bold');
  m.setFrozenRows(1);
  m.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');

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
  const rng  = s.getRange(2, 9, items.length, 1);
  const rule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('MENIPIS').setBackground('#f8d7da').setFontColor('#c0392b').setRanges([rng]).build();
  s.setConditionalFormatRules([rule]);
}

function getStok() {
  const sh = SpreadsheetApp.getActive().getSheetByName('STOK');
  if (!sh) return [];
  const data = sh.getDataRange().getValues();
  const out  = [];
  for (let i = 1; i < data.length; i++) {
    const b = data[i][0];
    if (!b || String(b).toUpperCase() === 'TOTAL') continue;
    out.push({
      bahan:    String(b),
      satuan:   String(data[i][1] || ''),
      saldo:    Number(data[i][6]) || 0,
      batasMin: (data[i][7] === '' || data[i][7] === null) ? '' : Number(data[i][7]),
      status:   String(data[i][8] || '')
    });
  }
  return out;
}

/* Catat 1 gerakan stok (Masuk / Keluar) */
function catatStok(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss    = SpreadsheetApp.getActive();
    const sh    = ss.getSheetByName('STOK_MUTASI');
    const jenis = (p.jenis === 'Masuk') ? 'Masuk' : 'Keluar';
    const now   = new Date();
    sh.appendRow([now, p.bahan, jenis, Number(p.jumlah) || 0, p.keterangan || '']);
    if (jenis === 'Masuk') {
      const shMasuk = ss.getSheetByName('STOK MASUK');
      if (shMasuk) {
        const r = shMasuk.getLastRow() + 1;
        shMasuk.getRange(r, 1, 1, 3).setValues([[now, p.bahan, Number(p.jumlah) || 0]]);
        shMasuk.getRange(r, 5).setFormula('=IF(D' + r + '=""' + sepArgumen() + '""' + sepArgumen() + 'C' + r + '*D' + r + ')');
        shMasuk.getRange(r, 6).setFormula('=IF(D' + r + '=""' + sepArgumen() + '"Belum diisi harga"' + sepArgumen() + '"Lengkap")');
      }
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* =========================================================
 * KAS — pengeluaran tunai harian
 * ========================================================= */
const KATEGORI_KAS  = ['Es Batu', 'Beli Galon Air', 'Karyawan Bon', 'Uang Keluar Lainnya'];
const DAFTAR_KASIR  = ['Ansor', 'El', 'Gofur', 'Anwar'];

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

function setupKas() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('KAS');
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet('KAS');
  const head = ['TANGGAL', 'KATEGORI', 'JUMLAH', 'KASIR', 'KETERANGAN'];
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.getRange('A:A').setNumberFormat('yyyy-mm-dd HH:mm');
  sh.getRange('C:C').setNumberFormat('#,##0');
  sh.autoResizeColumns(1, 5);
  _polesSheet(sh, 5, null, 1, 2, 101);
}

/* =========================================================
 * SETUP LAPORAN
 * ========================================================= */
/* =========================================================
 * REKAP HARIAN — format VERTIKAL (baris per menu)
 * Kolom: MENU | HARGA | QTY BULAN INI | OMZET BULAN INI
 * + ringkasan total di atas (gelas, omzet, per metode)
 * Jauh lebih mudah dibaca daripada matriks 31 kolom.
 * ========================================================= */
function setupRekapHarian() {
  const ss = SpreadsheetApp.getActive();
  const S  = sepArgumen();
  const NAMA = 'REKAP HARIAN';
  let sh = ss.getSheetByName(NAMA);
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(NAMA);

  // --- Baris 1: Judul & bulan ---
  sh.getRange('A1').setValue('REKAP PENJUALAN PER MENU — otomatis dari ITEM & NOTA. Ganti B2 untuk lihat bulan lain.');
  sh.getRange('A2').setValue('Bulan:');
  sh.getRange('B2').setValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)).setNumberFormat('mmmm yyyy');

  // --- Baris 3–10: Ringkasan bulanan ---
  const ringkasan = [
    ['RINGKASAN BULAN INI', ''],
    ['Total Nota (valid)', '=COUNTIFS(NOTA!$B:$B,">="&B2,NOTA!$B:$B,"<"&EDATE(B2,1),NOTA!$J:$J,"<>BATAL")'],
    ['Total Gelas Terjual', '=SUMIFS(ITEM!$E:$E,ITEM!$B:$B,">="&B2,ITEM!$B:$B,"<"&EDATE(B2,1),ITEM!$H:$H,"<>BATAL")'],
    ['Total Omzet', '=SUMIFS(NOTA!$D:$D,NOTA!$B:$B,">="&B2,NOTA!$B:$B,"<"&EDATE(B2,1),NOTA!$J:$J,"<>BATAL")'],
    ['— Tunai', '=SUMIFS(NOTA!$D:$D,NOTA!$B:$B,">="&B2,NOTA!$B:$B,"<"&EDATE(B2,1),NOTA!$G:$G,"Tunai",NOTA!$J:$J,"<>BATAL")'],
    ['— QRIS', '=SUMIFS(NOTA!$D:$D,NOTA!$B:$B,">="&B2,NOTA!$B:$B,"<"&EDATE(B2,1),NOTA!$G:$G,"QRIS",NOTA!$J:$J,"<>BATAL")'],
    ['— Transfer', '=SUMIFS(NOTA!$D:$D,NOTA!$B:$B,">="&B2,NOTA!$B:$B,"<"&EDATE(B2,1),NOTA!$G:$G,"Transfer",NOTA!$J:$J,"<>BATAL")'],
    ['Total Kas Keluar', '=SUMIFS(KAS!$C:$C,KAS!$A:$A,">="&B2,KAS!$A:$A,"<"&EDATE(B2,1))'],
    ['Uang Bersih di Laci (est.)', '=B6-B10'],  // B6 = Total Omzet, B10 = Kas Keluar
  ];
  // Ganti pemisah sesuai locale
  if (S === ';') {
    ringkasan.forEach(function(r) { if (typeof r[1] === 'string') r[1] = r[1].replace(/,/g, ';'); });
  }
  sh.getRange(3, 1, ringkasan.length, 2).setValues(ringkasan);
  sh.getRange('B6').setNumberFormat('"Rp"#,##0');
  sh.getRange('B7').setNumberFormat('"Rp"#,##0');
  sh.getRange('B8').setNumberFormat('"Rp"#,##0');
  sh.getRange('B9').setNumberFormat('"Rp"#,##0');
  sh.getRange('B10').setNumberFormat('"Rp"#,##0');
  sh.getRange('B11').setNumberFormat('"Rp"#,##0');

  // Warnai ringkasan
  sh.getRange(3, 1, 1, 2).merge().setBackground('#1e3a5f').setFontColor('#ffffff').setFontWeight('bold');
  sh.getRange(4, 1, ringkasan.length - 1, 1).setFontColor('#374151').setFontWeight('bold');
  sh.getRange(4, 2, ringkasan.length - 1, 1).setHorizontalAlignment('right');
  sh.getRange('B11').setFontWeight('bold').setFontColor('#16a34a');

  // --- Baris 13+: Tabel per menu ---
  const rHead = ringkasan.length + 3; // baris header tabel = 13
  const head = ['MENU', 'KATEGORI', 'HARGA', 'QTY TERJUAL', 'OMZET', '% KONTRIBUSI'];
  sh.getRange(rHead, 1, 1, head.length).setValues([head]);

  const NROW = LAPORAN_BARIS;
  for (let i = 0; i < NROW; i++) {
    const r  = rHead + 1 + i;
    const mr = i + 2; // MENU!A2, A3, ...
    const namaRef = '$A' + r;
    sh.getRange(r, 1).setFormula('=IF(MENU!A' + mr + '=""' + S + '""' + S + 'MENU!A' + mr + ')');
    sh.getRange(r, 2).setFormula('=IF(MENU!A' + mr + '=""' + S + '""' + S + 'MENU!B' + mr + ')');
    sh.getRange(r, 3).setFormula('=IF(MENU!A' + mr + '=""' + S + '""' + S + 'MENU!C' + mr + ')');
    sh.getRange(r, 4).setFormula(
      '=IF(' + namaRef + '=""' + S + '""' + S +
      'SUMIFS(ITEM!$E:$E' + S + 'ITEM!$C:$C' + S + namaRef + S +
      'ITEM!$B:$B' + S + '">="&$B$2' + S +
      'ITEM!$B:$B' + S + '"<"&EDATE($B$2' + S + '1)' + S +
      'ITEM!$H:$H' + S + '"<>BATAL"))');
    sh.getRange(r, 5).setFormula('=IF(' + namaRef + '=""' + S + '""' + S + 'D' + r + '*C' + r + ')');
    sh.getRange(r, 6).setFormula('=IF(OR(' + namaRef + '=""' + S + '$B$6=0)' + S + '""' + S + 'E' + r + '/$B$6)');
  }
  const rT = rHead + 1 + NROW;
  sh.getRange(rT, 1).setValue('TOTAL');
  sh.getRange(rT, 4).setFormula('=SUM(D' + (rHead+1) + ':D' + (rT-1) + ')');
  sh.getRange(rT, 5).setFormula('=SUM(E' + (rHead+1) + ':E' + (rT-1) + ')');

  // Format
  sh.getRange(rHead + 1, 3, NROW + 1, 1).setNumberFormat('"Rp"#,##0');
  sh.getRange(rHead + 1, 5, NROW + 1, 1).setNumberFormat('"Rp"#,##0');
  sh.getRange(rHead + 1, 6, NROW, 1).setNumberFormat('0.0%');
  sh.setFrozenRows(rHead);
  sh.setColumnWidth(1, 170);
  sh.setColumnWidth(2, 90);
  sh.setColumnWidth(3, 90);
  sh.setColumnWidth(4, 100);
  sh.setColumnWidth(5, 110);
  sh.setColumnWidth(6, 110);
  _polesSheet(sh, 6, 1, rHead, rHead + 1, rT - 1);
  sh.getRange(rT, 1, 1, 6).setFontWeight('bold').setBackground('#1e3a5f').setFontColor('#ffffff');
}

/* =========================================================
 * LAPORAN PENJUALAN — format VERTIKAL (baris per hari)
 * Kolom: TANGGAL | NOTA | GELAS | OMZET | TUNAI | QRIS | TRANSFER | KAS KELUAR | LACI
 * + baris ringkasan bulanan di atas
 * ========================================================= */
function setupLaporanPenjualan() {
  const ss = SpreadsheetApp.getActive();
  const S  = sepArgumen(), L = colLetter;
  const NAMA = 'LAPORAN PENJUALAN';
  let sh = ss.getSheetByName(NAMA);
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(NAMA);

  // Judul & bulan
  sh.getRange('A1').setValue('LAPORAN PENJUALAN HARIAN — otomatis. Nota BATAL tidak dihitung. Ganti B2 untuk ganti bulan.');
  sh.getRange('A2').setValue('Bulan:');
  sh.getRange('B2').setValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)).setNumberFormat('mmmm yyyy');

  // Header
  const head = ['TANGGAL','NOTA','GELAS','OMZET','TUNAI','QRIS','TRANSFER','KAS KELUAR','UANG DI LACI'];
  const NC = head.length;
  sh.getRange(3, 1, 1, NC).setValues([head]);

  const HARI = 31;
  for (let i = 0; i < HARI; i++) {
    const r = 4 + i;
    const d = '$A' + r;
    const cek = '=IF(' + d + '=""' + S + '""' + S;  // rumus hanya hitung jika tanggal masih di bulan yang sama
    // Tanggal = B2 + i hari — KOSONG jika sudah masuk bulan berikutnya (fix bug bulan pendek)
    sh.getRange(r, 1).setFormula('=IF(MONTH($B$2+' + i + ')=MONTH($B$2)' + S + '$B$2+' + i + S + '"")').setNumberFormat('dd mmmm yyyy (ddd)');
    // STATUS NOTA di kolom J (v7)
    sh.getRange(r, 2).setFormula(cek + 'COUNTIFS(NOTA!$B:$B' + S + '">="&' + d + S + 'NOTA!$B:$B' + S + '"<"&(' + d + '+1)' + S + 'NOTA!$J:$J' + S + '"<>BATAL"))');
    sh.getRange(r, 3).setFormula(cek + 'SUMIFS(ITEM!$E:$E' + S + 'ITEM!$B:$B' + S + '">="&' + d + S + 'ITEM!$B:$B' + S + '"<"&(' + d + '+1)' + S + 'ITEM!$H:$H' + S + '"<>BATAL"))');
    sh.getRange(r, 4).setFormula(cek + 'SUMIFS(NOTA!$D:$D' + S + 'NOTA!$B:$B' + S + '">="&' + d + S + 'NOTA!$B:$B' + S + '"<"&(' + d + '+1)' + S + 'NOTA!$J:$J' + S + '"<>BATAL"))');
    sh.getRange(r, 5).setFormula(cek + 'SUMIFS(NOTA!$D:$D' + S + 'NOTA!$B:$B' + S + '">="&' + d + S + 'NOTA!$B:$B' + S + '"<"&(' + d + '+1)' + S + 'NOTA!$G:$G' + S + '"Tunai"' + S + 'NOTA!$J:$J' + S + '"<>BATAL"))');
    sh.getRange(r, 6).setFormula(cek + 'SUMIFS(NOTA!$D:$D' + S + 'NOTA!$B:$B' + S + '">="&' + d + S + 'NOTA!$B:$B' + S + '"<"&(' + d + '+1)' + S + 'NOTA!$G:$G' + S + '"QRIS"' + S + 'NOTA!$J:$J' + S + '"<>BATAL"))');
    sh.getRange(r, 7).setFormula(cek + 'SUMIFS(NOTA!$D:$D' + S + 'NOTA!$B:$B' + S + '">="&' + d + S + 'NOTA!$B:$B' + S + '"<"&(' + d + '+1)' + S + 'NOTA!$G:$G' + S + '"Transfer"' + S + 'NOTA!$J:$J' + S + '"<>BATAL"))');
    sh.getRange(r, 8).setFormula(cek + 'SUMIFS(KAS!$C:$C' + S + 'KAS!$A:$A' + S + '">="&' + d + S + 'KAS!$A:$A' + S + '"<"&(' + d + '+1)))');
    sh.getRange(r, 9).setFormula(cek + 'D' + r + '-H' + r + ')');
  }
  // Baris total
  const rT = 4 + HARI;
  sh.getRange(rT, 1).setValue('TOTAL BULAN');
  for (let c = 2; c <= NC; c++) sh.getRange(rT, c).setFormula('=SUM(' + L(c) + '4:' + L(c) + (rT-1) + ')');

  // Format uang
  sh.getRange(4, 4, HARI + 1, 6).setNumberFormat('"Rp"#,##0');
  // Warnai laci negatif merah
  const rngLaci = sh.getRange(4, 9, HARI, 1);
  const ruleMerah = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0).setBackground('#fde8e8').setFontColor('#c0392b').setRanges([rngLaci]).build();
  // Warnai hari tanpa transaksi (nota = 0) abu-abu
  const rngNol = sh.getRange(4, 1, HARI, NC);
  const ruleNol = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$B4=0').setFontColor('#b0b8c1').setRanges([rngNol]).build();
  sh.setConditionalFormatRules([ruleMerah, ruleNol]);

  sh.setFrozenRows(3);
  sh.setColumnWidth(1, 175);
  for (let c = 2; c <= NC; c++) sh.setColumnWidth(c, 100);
  _polesSheet(sh, NC, 1, 3, 4, rT - 1);
  sh.getRange(rT, 1, 1, NC).setFontWeight('bold').setBackground('#1e3a5f').setFontColor('#ffffff');
}

/* =========================================================
 * LAPORAN PEMAKAIAN BAHAN — format VERTIKAL (baris per bahan)
 * Kolom: BAHAN | SATUAN | PAKAI BULAN INI | MASUK BULAN INI | SALDO AKHIR
 * HANYA pemakaian otomatis dari penjualan (keterangan "Auto —")
 * Laporan Stok Keluar Manual DIHAPUS — digabung ke sini sebagai kolom terpisah
 * ========================================================= */
function setupLaporanPemakaian() {
  const ss = SpreadsheetApp.getActive();
  const S  = sepArgumen();
  const NAMA = 'LAPORAN PEMAKAIAN';
  let sh = ss.getSheetByName(NAMA);
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(NAMA);

  sh.getRange('A1').setValue('LAPORAN PEMAKAIAN BAHAN BULANAN — otomatis dari STOK_MUTASI. Ganti B2 untuk ganti bulan.');
  sh.getRange('A2').setValue('Bulan:');
  sh.getRange('B2').setValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)).setNumberFormat('mmmm yyyy');

  const head = ['BAHAN','SAT','SALDO AWAL BULAN','MASUK','PAKAI (otomatis)','KELUAR MANUAL','SALDO AKHIR (est.)','STATUS'];
  const NC = head.length;
  sh.getRange(3, 1, 1, NC).setValues([head]);

  const NROW = LAPORAN_BARIS;
  for (let i = 0; i < NROW; i++) {
    const r  = 4 + i;
    const mr = i + 2; // STOK!A2, A3, ...
    const namaRef = '$A' + r;
    // Nama & satuan dari sheet STOK
    sh.getRange(r, 1).setFormula('=IF(STOK!A' + mr + '=""' + S + '""' + S + 'STOK!A' + mr + ')');
    sh.getRange(r, 2).setFormula('=IF(STOK!A' + mr + '=""' + S + '""' + S + 'STOK!B' + mr + ')');
    // Saldo awal bulan = saldo sistem dikurangi semua mutasi bulan ini
    sh.getRange(r, 3).setFormula(
      '=IF(' + namaRef + '=""' + S + '""' + S +
      'IFERROR(VLOOKUP(' + namaRef + S + 'STOK!$A:$G' + S + '7' + S + 'FALSE)' + S + '0)' +
      '-SUMIFS(STOK_MUTASI!$D:$D' + S + 'STOK_MUTASI!$B:$B' + S + namaRef + S + 'STOK_MUTASI!$C:$C' + S + '"Masuk"' + S + 'STOK_MUTASI!$A:$A' + S + '">="&$B$2' + S + 'STOK_MUTASI!$A:$A' + S + '"<"&EDATE($B$2' + S + '1))' +
      '+SUMIFS(STOK_MUTASI!$D:$D' + S + 'STOK_MUTASI!$B:$B' + S + namaRef + S + 'STOK_MUTASI!$C:$C' + S + '"Keluar"' + S + 'STOK_MUTASI!$A:$A' + S + '">="&$B$2' + S + 'STOK_MUTASI!$A:$A' + S + '"<"&EDATE($B$2' + S + '1))' +
      '-SUMIFS(STOK_MUTASI!$D:$D' + S + 'STOK_MUTASI!$B:$B' + S + namaRef + S + 'STOK_MUTASI!$C:$C' + S + '"Koreksi"' + S + 'STOK_MUTASI!$A:$A' + S + '">="&$B$2' + S + 'STOK_MUTASI!$A:$A' + S + '"<"&EDATE($B$2' + S + '1)))');
    // Masuk bulan ini
    sh.getRange(r, 4).setFormula(
      '=IF(' + namaRef + '=""' + S + '""' + S +
      'SUMIFS(STOK_MUTASI!$D:$D' + S + 'STOK_MUTASI!$B:$B' + S + namaRef + S +
      'STOK_MUTASI!$C:$C' + S + '"Masuk"' + S +
      'STOK_MUTASI!$A:$A' + S + '">="&$B$2' + S +
      'STOK_MUTASI!$A:$A' + S + '"<"&EDATE($B$2' + S + '1)))');
    // Pakai otomatis (Auto — xxxx)
    sh.getRange(r, 5).setFormula(
      '=IF(' + namaRef + '=""' + S + '""' + S +
      'SUMIFS(STOK_MUTASI!$D:$D' + S + 'STOK_MUTASI!$B:$B' + S + namaRef + S +
      'STOK_MUTASI!$C:$C' + S + '"Keluar"' + S +
      'STOK_MUTASI!$E:$E' + S + '"Auto*"' + S +
      'STOK_MUTASI!$A:$A' + S + '">="&$B$2' + S +
      'STOK_MUTASI!$A:$A' + S + '"<"&EDATE($B$2' + S + '1)))');
    // Keluar manual (bukan Auto)
    sh.getRange(r, 6).setFormula(
      '=IF(' + namaRef + '=""' + S + '""' + S +
      'SUMIFS(STOK_MUTASI!$D:$D' + S + 'STOK_MUTASI!$B:$B' + S + namaRef + S +
      'STOK_MUTASI!$C:$C' + S + '"Keluar"' + S +
      'STOK_MUTASI!$E:$E' + S + '"<>Auto*"' + S +
      'STOK_MUTASI!$A:$A' + S + '">="&$B$2' + S +
      'STOK_MUTASI!$A:$A' + S + '"<"&EDATE($B$2' + S + '1)))');
    // Saldo akhir estimasi
    sh.getRange(r, 7).setFormula('=IF(' + namaRef + '=""' + S + '""' + S + 'C' + r + '+D' + r + '-E' + r + '-F' + r + ')');
    // Status
    sh.getRange(r, 8).setFormula(
      '=IF(' + namaRef + '=""' + S + '""' + S +
      'IF(IFERROR(VLOOKUP(' + namaRef + S + 'STOK!$A:$I' + S + '9' + S + 'FALSE)' + S + '"-")="MENIPIS"' + S +
      '"⚠ MENIPIS"' + S + '"✓ Aman"))');
  }

  // Baris total
  const rT = 4 + NROW;
  sh.getRange(rT, 1).setValue('TOTAL');
  sh.getRange(rT, 4).setFormula('=SUM(D4:D' + (rT-1) + ')');
  sh.getRange(rT, 5).setFormula('=SUM(E4:E' + (rT-1) + ')');
  sh.getRange(rT, 6).setFormula('=SUM(F4:F' + (rT-1) + ')');

  // Format angka
  sh.getRange(4, 3, NROW + 1, 5).setNumberFormat('#,##0');
  sh.setFrozenRows(3);
  sh.setColumnWidth(1, 170);
  sh.setColumnWidth(2, 50);
  sh.setColumnWidth(3, 110);
  sh.setColumnWidth(4, 90);
  sh.setColumnWidth(5, 120);
  sh.setColumnWidth(6, 110);
  sh.setColumnWidth(7, 120);
  sh.setColumnWidth(8, 90);

  // Warnai status menipis
  const rngStatus = sh.getRange(4, 8, NROW, 1);
  const ruleMenipis = SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('MENIPIS').setBackground('#fde8e8').setFontColor('#c0392b').setRanges([rngStatus]).build();
  sh.setConditionalFormatRules([ruleMenipis]);

  _polesSheet(sh, NC, 1, 3, 4, rT - 1);
  sh.getRange(rT, 1, 1, NC).setFontWeight('bold').setBackground('#1e3a5f').setFontColor('#ffffff');
}

/* Hapus sheet lama yang tidak dipakai lagi */
function setupLaporanStokMasuk() {
  // Laporan Stok Masuk tetap ada di sheet STOK MASUK (diisi otomatis dari HTML kasir)
  // Fungsi ini tidak membuat sheet laporan terpisah — sudah tidak diperlukan
  Logger.log('setupLaporanStokMasuk: sheet STOK MASUK sudah otomatis terisi dari HTML. Tidak perlu setup ulang.');
}

function setupLaporanStokKeluarManual() {
  // DIHAPUS — data keluar manual kini ada di kolom F sheet LAPORAN PEMAKAIAN
  // Menghapus semua varian nama sheet usang dari versi-versi lama
  const ss = SpreadsheetApp.getActive();
  ['LAPORAN STOK KELUAR MANUAL', 'LAPORAN KELUAR LAIN'].forEach(function(nama) {
    const lama = ss.getSheetByName(nama);
    if (lama) {
      ss.deleteSheet(lama);
      Logger.log('Sheet usang "' + nama + '" dihapus — datanya kini ada di kolom "KELUAR MANUAL" di LAPORAN PEMAKAIAN.');
    }
  });
}

/* Hapus semua laporan lama dan buat ulang semua */
/* =========================================================
 * REKAP TAHUNAN — tren bisnis per bulan dalam 1 layar
 * Kolom: BULAN | NOTA | GELAS | OMZET | TUNAI | QRIS | TRANSFER | KAS KELUAR | UANG DI LACI
 * Ganti tahun di B2. Bulan tanpa transaksi otomatis abu-abu.
 * ========================================================= */
function setupRekapTahunan() {
  const ss = SpreadsheetApp.getActive();
  const S  = sepArgumen(), L = colLetter;
  const NAMA = 'REKAP TAHUNAN';
  let sh = ss.getSheetByName(NAMA);
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(NAMA);

  sh.getRange('A1').setValue('REKAP TAHUNAN — tren per bulan, otomatis dari NOTA, ITEM, dan KAS. Ganti B2 untuk lihat tahun lain.');
  sh.getRange('A2').setValue('Tahun:');
  sh.getRange('B2').setValue(new Date().getFullYear());

  const head = ['BULAN','NOTA','GELAS','OMZET','TUNAI','QRIS','TRANSFER','KAS KELUAR','UANG DI LACI'];
  const NC = head.length;
  sh.getRange(3, 1, 1, NC).setValues([head]);

  const namaBulan = ['Januari','Februari','Maret','April','Mei','Juni',
                     'Juli','Agustus','September','Oktober','November','Desember'];

  for (let m = 1; m <= 12; m++) {
    const r  = 3 + m; // baris 4..15
    const d0 = 'DATE($B$2' + S + m + S + '1)';
    const d1 = 'DATE($B$2' + S + (m + 1) + S + '1)';
    sh.getRange(r, 1).setValue(namaBulan[m - 1]);
    sh.getRange(r, 2).setFormula('=COUNTIFS(NOTA!$B:$B' + S + '">="&' + d0 + S + 'NOTA!$B:$B' + S + '"<"&' + d1 + S + 'NOTA!$J:$J' + S + '"<>BATAL")');
    sh.getRange(r, 3).setFormula('=SUMIFS(ITEM!$E:$E' + S + 'ITEM!$B:$B' + S + '">="&' + d0 + S + 'ITEM!$B:$B' + S + '"<"&' + d1 + S + 'ITEM!$H:$H' + S + '"<>BATAL")');
    sh.getRange(r, 4).setFormula('=SUMIFS(NOTA!$D:$D' + S + 'NOTA!$B:$B' + S + '">="&' + d0 + S + 'NOTA!$B:$B' + S + '"<"&' + d1 + S + 'NOTA!$J:$J' + S + '"<>BATAL")');
    sh.getRange(r, 5).setFormula('=SUMIFS(NOTA!$D:$D' + S + 'NOTA!$B:$B' + S + '">="&' + d0 + S + 'NOTA!$B:$B' + S + '"<"&' + d1 + S + 'NOTA!$G:$G' + S + '"Tunai"' + S + 'NOTA!$J:$J' + S + '"<>BATAL")');
    sh.getRange(r, 6).setFormula('=SUMIFS(NOTA!$D:$D' + S + 'NOTA!$B:$B' + S + '">="&' + d0 + S + 'NOTA!$B:$B' + S + '"<"&' + d1 + S + 'NOTA!$G:$G' + S + '"QRIS"' + S + 'NOTA!$J:$J' + S + '"<>BATAL")');
    sh.getRange(r, 7).setFormula('=SUMIFS(NOTA!$D:$D' + S + 'NOTA!$B:$B' + S + '">="&' + d0 + S + 'NOTA!$B:$B' + S + '"<"&' + d1 + S + 'NOTA!$G:$G' + S + '"Transfer"' + S + 'NOTA!$J:$J' + S + '"<>BATAL")');
    sh.getRange(r, 8).setFormula('=SUMIFS(KAS!$C:$C' + S + 'KAS!$A:$A' + S + '">="&' + d0 + S + 'KAS!$A:$A' + S + '"<"&' + d1 + ')');
    sh.getRange(r, 9).setFormula('=D' + r + '-H' + r);
  }

  // Baris TOTAL TAHUN
  const rT = 16;
  sh.getRange(rT, 1).setValue('TOTAL TAHUN');
  for (let c = 2; c <= NC; c++) sh.getRange(rT, c).setFormula('=SUM(' + L(c) + '4:' + L(c) + '15)');

  // Format
  sh.getRange(4, 4, 13, 6).setNumberFormat('"Rp"#,##0');
  const rngNol = sh.getRange(4, 1, 12, NC);
  const ruleNol = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$B4=0').setFontColor('#b0b8c1').setRanges([rngNol]).build();
  const rngLaci = sh.getRange(4, 9, 12, 1);
  const ruleMerah = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0).setBackground('#fde8e8').setFontColor('#c0392b').setRanges([rngLaci]).build();
  sh.setConditionalFormatRules([ruleNol, ruleMerah]);

  sh.setFrozenRows(3);
  sh.setColumnWidth(1, 110);
  for (let c = 2; c <= NC; c++) sh.setColumnWidth(c, 105);
  _polesSheet(sh, NC, 1, 3, 4, 15);
  sh.getRange(rT, 1, 1, NC).setFontWeight('bold').setBackground('#1e3a5f').setFontColor('#ffffff');
}

/* =========================================================
 * RAPIKAN SEMUA SHEET — percantik tampilan TANPA menghapus data.
 * Aman dijalankan kapan saja, berulang kali.
 * Mencakup: STOK_MUTASI, KAS, LOG BATAL, STOK MASUK, OPNAME, STOK.
 * (Sheet laporan berbasis rumus cukup jalankan ulang setup-nya.)
 * ========================================================= */
function rapikanSemuaSheet() {
  const ss = SpreadsheetApp.getActive();

  // --- STOK_MUTASI (jurnal stok — paling sering diisi otomatis) ---
  let sh = ss.getSheetByName('STOK_MUTASI');
  if (sh) {
    sh.getRange(1, 1, 1, 5).setValues([['TANGGAL', 'BAHAN', 'JENIS', 'JUMLAH', 'KETERANGAN']]);
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');
    sh.getRange('D:D').setNumberFormat('#,##0');
    sh.setColumnWidth(1, 135); sh.setColumnWidth(2, 160); sh.setColumnWidth(3, 80);
    sh.setColumnWidth(4, 90);  sh.setColumnWidth(5, 240);
    _polesSheet(sh, 5, null, 1, 2, Math.max(sh.getLastRow(), 100));
    // Warna per jenis: Masuk hijau, Keluar merah muda, Koreksi kuning
    const rngJ = sh.getRange(2, 3, Math.max(sh.getMaxRows() - 1, 100), 1);
    sh.setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Masuk')
        .setBackground('#e8f5e9').setFontColor('#15803d').setRanges([rngJ]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Keluar')
        .setBackground('#fde8e8').setFontColor('#c0392b').setRanges([rngJ]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Koreksi')
        .setBackground('#fff3cd').setFontColor('#92600a').setRanges([rngJ]).build()
    ]);
    sh.getRange('A1').setNote('Jurnal semua gerakan stok. Terisi otomatis dari kasir & opname — JANGAN edit manual kecuali darurat.');
  }

  // --- KAS ---
  sh = ss.getSheetByName('KAS');
  if (sh) {
    sh.getRange(1, 1, 1, 5).setValues([['TANGGAL', 'KATEGORI', 'JUMLAH', 'KASIR', 'KETERANGAN']]);
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('yyyy-mm-dd HH:mm');
    sh.getRange('C:C').setNumberFormat('"Rp"#,##0');
    sh.setColumnWidth(1, 135); sh.setColumnWidth(2, 160); sh.setColumnWidth(3, 110);
    sh.setColumnWidth(4, 90);  sh.setColumnWidth(5, 240);
    // Dropdown kategori & kasir — cegah salah ketik saat edit manual
    const nMax = Math.max(sh.getMaxRows() - 1, 500);
    sh.getRange(2, 2, nMax, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(KATEGORI_KAS, true).setAllowInvalid(true).build());
    sh.getRange(2, 4, nMax, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(DAFTAR_KASIR, true).setAllowInvalid(true).build());
    _polesSheet(sh, 5, null, 1, 2, Math.max(sh.getLastRow(), 100));
    sh.getRange('A1').setNote('Pengeluaran tunai harian. Terisi otomatis dari tombol Kas di aplikasi kasir.');
  }

  // --- LOG BATAL ---
  sh = ss.getSheetByName('LOG BATAL');
  if (sh) {
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('yyyy-mm-dd HH:mm:ss');
    sh.getRange('D:D').setNumberFormat('"Rp"#,##0');
    sh.setColumnWidth(1, 150); sh.setColumnWidth(2, 130);
    sh.setColumnWidth(3, 150); sh.setColumnWidth(4, 110);
    _polesSheet(sh, 4, null, 1, 2, Math.max(sh.getLastRow(), 50));
    sh.getRange('A1').setNote('Audit trail pembatalan nota — append-only, jangan diedit.');
  }

  // --- STOK MASUK ---
  sh = ss.getSheetByName('STOK MASUK');
  if (sh) {
    sh.setColumnWidth(1, 135); sh.setColumnWidth(2, 160); sh.setColumnWidth(3, 80);
    sh.setColumnWidth(4, 120); sh.setColumnWidth(5, 120); sh.setColumnWidth(6, 140);
    sh.getRange('D:E').setNumberFormat('"Rp"#,##0');
    _polesSheet(sh, 6, 1, 2, 3, Math.max(sh.getLastRow(), 100));
  }

  // --- OPNAME ---
  sh = ss.getSheetByName('OPNAME');
  if (sh) {
    sh.setColumnWidth(1, 110); sh.setColumnWidth(2, 160); sh.setColumnWidth(3, 100);
    sh.setColumnWidth(4, 140); sh.setColumnWidth(5, 90);  sh.setColumnWidth(6, 280);
    _polesSheet(sh, 6, 1, 2, 3, Math.max(sh.getLastRow(), 62));
  }

  // --- STOK ---
  sh = ss.getSheetByName('STOK');
  if (sh) {
    sh.setColumnWidth(1, 160); sh.setColumnWidth(2, 70);
    for (let c = 3; c <= 8; c++) sh.setColumnWidth(c, 100);
    sh.setColumnWidth(9, 90);
    _polesSheet(sh, 9, null, 1, 2, Math.max(sh.getLastRow(), 40));
    sh.getRange('A1').setNote('Kartu stok. SALDO = Awal + Masuk − Keluar + Koreksi (otomatis dari STOK_MUTASI). Isi BATAS MIN untuk peringatan MENIPIS.');
  }

  Logger.log('Semua sheet data selesai dirapikan — data tidak ada yang berubah.');
}

function setupSemuaLaporan() {
  setupRekapHarian();
  setupLaporanPenjualan();
  setupLaporanPemakaian();
  setupRekapTahunan();
  setupLaporanStokKeluarManual(); // hapus sheet lama
  Logger.log('Semua laporan selesai dibuat ulang dengan format baru.');
}

/* =========================================================
 * SETUP OPNAME
 * ========================================================= */
function setupOpname() {
  const ss = SpreadsheetApp.getActive();
  const S  = sepArgumen();
  let sh = ss.getSheetByName('OPNAME');
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet('OPNAME');
  sh.getRange('A1').setValue('OPNAME FISIK — isi TANGGAL, BAHAN, STOK FISIK. Kolom lain otomatis.');
  const head = ['TANGGAL','BAHAN','STOK FISIK','STOK SISTEM (skrg)','SELISIH','KETERANGAN'];
  sh.getRange(2, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  sh.setFrozenRows(2);
  const NROW = 60;
  for (let i = 0; i < NROW; i++) {
    const r = 3 + i;
    sh.getRange(r, 4).setFormula(
      '=IF(B' + r + '=""' + S + '""' + S +
      'IFERROR(VLOOKUP(B' + r + S + 'STOK!$A:$G' + S + '7' + S + 'FALSE)' + S + '"")'
    );
    sh.getRange(r, 5).setFormula('=IF(OR(B' + r + '=""' + S + 'C' + r + '=""' + S + ')' + S + '""' + S + 'C' + r + '-D' + r + ')');
  }
  sh.getRange('A:A').setNumberFormat('yyyy-mm-dd');
  const rngTgl  = sh.getRange(3, 1, NROW, 1);
  const ruleTgl = SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build();
  rngTgl.setDataValidation(ruleTgl);
  const shStok   = ss.getSheetByName('STOK');
  const rngBahan = sh.getRange(3, 2, NROW, 1);
  if (shStok) {
    const sumberBahan = shStok.getRange('A2:A200');
    const ruleBahan   = SpreadsheetApp.newDataValidation()
      .requireValueInRange(sumberBahan, true).setAllowInvalid(false).build();
    rngBahan.setDataValidation(ruleBahan);
  }
  sh.autoResizeColumns(1, 6);
  _polesSheet(sh, 6, 1, 2, 3, 2 + NROW);
}

function terapkanOpname() {
  const ss       = SpreadsheetApp.getActive();
  const sh       = ss.getSheetByName('OPNAME');
  const shMutasi = ss.getSheetByName('STOK_MUTASI');
  if (!sh || !shMutasi) return { ok: false, pesan: 'Sheet OPNAME atau STOK_MUTASI tidak ada.' };
  const last = sh.getLastRow();
  if (last < 3) return { ok: true, diterapkan: 0 };
  const rows = sh.getRange(3, 1, last - 2, 6).getValues();
  const baris = [];
  let diterapkan = 0;
  rows.forEach(function(r, i) {
    const tgl = r[0], bahan = r[1], selisih = r[4], ket = r[5];
    if (bahan === '' || selisih === '' || ket !== '') return;
    if (Number(selisih) === 0) {
      sh.getRange(3 + i, 6).setValue('Tidak ada selisih — tidak perlu koreksi');
      return;
    }
    baris.push([tgl || new Date(), bahan, 'Koreksi', Number(selisih), 'Opname ' + Utilities.formatDate(new Date(tgl || new Date()), Session.getScriptTimeZone(), 'yyyy-MM-dd')]);
    sh.getRange(3 + i, 6).setValue('Diterapkan ke STOK_MUTASI ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'));
    diterapkan++;
  });
  if (baris.length) shMutasi.getRange(shMutasi.getLastRow() + 1, 1, baris.length, 5).setValues(baris);
  return { ok: true, diterapkan: diterapkan };
}

/* =========================================================
 * TRIGGER onEdit — opname otomatis
 * ========================================================= */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const sh = e.range.getSheet();
    if (sh.getName() !== 'OPNAME') return;
    const startRow = e.range.getRow(), startCol = e.range.getColumn();
    const numRows  = e.range.getNumRows(), numCols = e.range.getNumColumns();
    if (startCol > 3 || startCol + numCols - 1 < 3) return;
    const ss       = e.source;
    const shStok   = ss.getSheetByName('STOK');
    const shMutasi = ss.getSheetByName('STOK_MUTASI');
    if (!shStok || !shMutasi) return;
    const stokLast = shStok.getLastRow();
    if (stokLast < 2) return;
    const stokData = shStok.getRange(2, 1, stokLast - 1, 7).getValues();
    const saldoMap = {};
    stokData.forEach(function(r) { if (r[0]) saldoMap[String(r[0]).trim()] = Number(r[6]) || 0; });
    for (let i = 0; i < numRows; i++) {
      const row     = startRow + i;
      if (row < 3) continue;
      const fisik   = sh.getRange(row, 3).getValue();
      const bahan   = String(sh.getRange(row, 2).getValue() || '').trim();
      const ketCell = sh.getRange(row, 6);
      if (fisik === '' || fisik === null || !bahan) continue;
      const stokSistem = saldoMap[bahan];
      if (stokSistem === undefined) { ketCell.setValue('Bahan tidak ditemukan di STOK'); continue; }
      const selisih = Number(fisik) - stokSistem;
      const tgl     = sh.getRange(row, 1).getValue() || new Date();
      const now     = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
      if (selisih === 0) { ketCell.setValue('Tidak ada selisih (' + now + ')'); continue; }
      shMutasi.getRange(shMutasi.getLastRow() + 1, 1, 1, 5).setValues(
        [[tgl, bahan, 'Koreksi', selisih, 'Opname otomatis ' + now]]
      );
      ketCell.setValue('Diterapkan otomatis ke STOK_MUTASI ' + now);
      saldoMap[bahan] = Number(fisik);
    }
  } catch(err) { console.error('onEdit OPNAME error: ' + err); }
}

/* =========================================================
 * REKAP SELISIH BULANAN
 * ========================================================= */
/* =========================================================
 * REKAP SELISIH BULANAN — format VERTIKAL (baris per bahan)
 * Kolom: BAHAN | SAT | TOTAL KOREKSI | KALI OPNAME | RATA-RATA | KETERANGAN
 * Jauh lebih mudah dibaca daripada matriks 31 kolom hari.
 * ========================================================= */
function setupRekapSelisihBulanan() {
  const ss = SpreadsheetApp.getActive();
  const S  = sepArgumen();
  const NAMA = 'REKAP SELISIH BULANAN';
  let sh = ss.getSheetByName(NAMA);
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(NAMA);

  sh.getRange('A1').setValue('REKAP SELISIH OPNAME BULANAN — otomatis dari STOK_MUTASI jenis Koreksi. Negatif = kekurangan/susut. Ganti B2 untuk ganti bulan.');
  sh.getRange('A2').setValue('Bulan:');
  sh.getRange('B2').setValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)).setNumberFormat('mmmm yyyy');

  const head = ['BAHAN','SAT','TOTAL SELISIH','JUMLAH OPNAME','RATA-RATA/OPNAME','STATUS'];
  const NC = head.length;
  sh.getRange(3, 1, 1, NC).setValues([head]);

  const NROW = LAPORAN_BARIS;
  for (let i = 0; i < NROW; i++) {
    const r  = 4 + i;
    const mr = i + 2;
    const namaRef = '$A' + r;
    sh.getRange(r, 1).setFormula('=IF(STOK!A' + mr + '=""' + S + '""' + S + 'STOK!A' + mr + ')');
    sh.getRange(r, 2).setFormula('=IF(STOK!A' + mr + '=""' + S + '""' + S + 'STOK!B' + mr + ')');
    // Total koreksi bulan ini
    sh.getRange(r, 3).setFormula(
      '=IF(' + namaRef + '=""' + S + '""' + S +
      'SUMIFS(STOK_MUTASI!$D:$D' + S + 'STOK_MUTASI!$B:$B' + S + namaRef + S +
      'STOK_MUTASI!$C:$C' + S + '"Koreksi"' + S +
      'STOK_MUTASI!$A:$A' + S + '">="&$B$2' + S +
      'STOK_MUTASI!$A:$A' + S + '"<"&EDATE($B$2' + S + '1)))');
    // Jumlah kali opname
    sh.getRange(r, 4).setFormula(
      '=IF(' + namaRef + '=""' + S + '""' + S +
      'COUNTIFS(STOK_MUTASI!$B:$B' + S + namaRef + S +
      'STOK_MUTASI!$C:$C' + S + '"Koreksi"' + S +
      'STOK_MUTASI!$A:$A' + S + '">="&$B$2' + S +
      'STOK_MUTASI!$A:$A' + S + '"<"&EDATE($B$2' + S + '1)))');
    // Rata-rata per opname
    sh.getRange(r, 5).setFormula('=IF(OR(' + namaRef + '=""' + S + 'D' + r + '=0)' + S + '""' + S + 'C' + r + '/D' + r + ')');
    // Status: beri tanda kalau selisih signifikan (> ±10)
    sh.getRange(r, 6).setFormula(
      '=IF(' + namaRef + '=""' + S + '""' + S +
      'IF(C' + r + '=0' + S + '"✓ Tidak ada selisih"' + S +
      'IF(C' + r + '<0' + S + '"⬇ Kekurangan ' + '" & ABS(C' + r + ') & " " & B' + r + S +
      '"⬆ Kelebihan " & C' + r + ' & " " & B' + r + ')))');
  }

  // Format
  sh.getRange(4, 3, NROW, 1).setNumberFormat('#,##0.0');
  sh.getRange(4, 5, NROW, 1).setNumberFormat('#,##0.0');
  // Warnai selisih negatif (kekurangan) merah
  const rngSelisih = sh.getRange(4, 3, NROW, 1);
  const ruleMinus = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0).setBackground('#fde8e8').setFontColor('#c0392b').setRanges([rngSelisih]).build();
  // Warnai selisih positif (kelebihan) hijau muda
  const rulePlus = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(0).setBackground('#e8f5e9').setFontColor('#15803d').setRanges([rngSelisih]).build();
  sh.setConditionalFormatRules([ruleMinus, rulePlus]);

  sh.setFrozenRows(3);
  sh.setColumnWidth(1, 170);
  sh.setColumnWidth(2, 50);
  sh.setColumnWidth(3, 110);
  sh.setColumnWidth(4, 110);
  sh.setColumnWidth(5, 130);
  sh.setColumnWidth(6, 220);

  _polesSheet(sh, NC, 1, 3, 4, 3 + NROW);
}

/* =========================================================
 * SETUP STOK MASUK
 * ========================================================= */
function setupStokMasuk() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('STOK MASUK');
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet('STOK MASUK');
  sh.getRange('A1').setValue('STOK MASUK — TANGGAL/BAHAN/QTY terisi otomatis dari HTML kasir. Kolom HARGA/SATUAN diisi MANUAL oleh pemilik.');
  const head = ['TANGGAL', 'BAHAN', 'QTY', 'HARGA/SATUAN', 'TOTAL', 'STATUS'];
  sh.getRange(2, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  sh.setFrozenRows(2);
  sh.getRange('A:A').setNumberFormat('yyyy-mm-dd HH:mm');
  sh.getRange('D:E').setNumberFormat('#,##0');
  const rng  = sh.getRange(3, 1, 500, 6);
  const rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($B3<>""' + sepArgumen() + '$D3="")')
    .setBackground('#fff3cd').setRanges([rng]).build();
  sh.setConditionalFormatRules([rule]);
  sh.autoResizeColumns(1, 6);
  _polesSheet(sh, 6, 1, 2, 3, 502);
}

/* =========================================================
 * HELPER UMUM
 * ========================================================= */
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
    } catch(e) { /* banding gagal -> abaikan */ }
  }
}

function colLetter(c) {
  let s = '';
  while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = (c - m - 1) / 26; }
  return s;
}
