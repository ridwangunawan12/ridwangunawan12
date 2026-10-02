/* Finansiologi CVCR: platform belajar (sidebar, penampil modul, progres). */
(function () {
  "use strict";
  var C = window.CVCR;
  var k = C && C.data();
  if (!k) return;

  var r = C.akar();
  var urutan = C.semuaBagian(k);
  var dihitung = urutan.filter(function (x) { return !x.part.opsional; });
  var prog = C.bacaProgres();
  var aktif = null;

  var $ = function (id) { return document.getElementById(id); };
  var bingkai = $("penampil");
  var pesan = $("p-pesan");
  var sisi = $("p-sisi");
  var tirai = $("p-tirai");
  var tMenu = $("t-menu");
  var tSebelum = $("t-sebelum");
  var tBerikut = $("t-berikut");
  var tSelesai = $("t-selesai");
  var tTab = $("t-tab");
  var tExcel = $("t-excel");
  var cari = $("cari");
  var daftar = $("p-daftar");

  function cariIndeks(id) {
    for (var i = 0; i < urutan.length; i++) if (urutan[i].part.id === id) return i;
    return -1;
  }
  function dariBerkas(nama) {
    for (var i = 0; i < urutan.length; i++) if (urutan[i].part.file === nama) return urutan[i].part.id;
    return null;
  }

  /* ---------- Sidebar ---------- */
  function bangunDaftar() {
    daftar.innerHTML = k.modul.map(function (m) {
      var b = C.babakDari(k, m.babak);
      return '<details class="p-modul" data-no="' + m.no + '" style="--warna:' + b.warna + '">' +
        '<summary><span class="no' + (C.terang(b.warna) ? " terang" : "") + '">' + m.no + '</span><b>' + C.esc(m.judul) + '</b>' + C.IKON.panah + '</summary>' +
        '<ul class="p-bagian">' + m.parts.map(function (p) {
          return '<li data-cari="' + C.esc((m.no + " " + m.judul + " " + p.kode + " " + p.judul).toLowerCase()) + '">' +
            '<a href="#/' + C.idKeHash(p.id) + '" data-id="' + p.id + '">' +
            '<span class="jenis">' + C.IKON[p.jenis] + '</span>' +
            '<span><span class="kode">' + C.esc(p.kode) + '</span>' + C.esc(p.jenis === "tugas" ? "Lembar tugas interaktif" : p.judul.replace(/\s*\(opsional\)$/i, "")) +
            (p.opsional ? '<span class="opsi">opsional</span>' : "") + '</span>' +
            '<span class="status" aria-hidden="true"></span>' +
            '<span class="sr status-sr"></span></a></li>';
        }).join("") + '</ul></details>';
    }).join("") + '<p class="p-kosong" id="p-kosong" hidden>Tidak ada bagian yang cocok.</p>';
  }

  function segarkanStatus() {
    daftar.querySelectorAll("a[data-id]").forEach(function (a) {
      var id = a.getAttribute("data-id");
      var s = a.querySelector(".status");
      var done = !!prog.selesai[id];
      s.classList.toggle("selesai", done);
      s.innerHTML = done ? C.IKON.cek : "";
      a.querySelector(".status-sr").textContent = done ? "(selesai)" : "";
      if (id === aktif) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    daftar.querySelectorAll(".p-modul").forEach(function (d) {
      var m = k.modul[Number(d.getAttribute("data-no")) - 1];
      var wajib = m.parts.filter(function (p) { return !p.opsional; });
      var penuh = wajib.every(function (p) { return prog.selesai[p.id]; });
      d.querySelector(".no").classList.toggle("penuh", penuh);
    });

    var n = dihitung.filter(function (x) { return prog.selesai[x.part.id]; }).length;
    var total = dihitung.length;
    var persen = total ? Math.round((n / total) * 100) : 0;
    var lingkar = 2 * Math.PI * 28;
    var isi = document.querySelector(".cincin .isi");
    isi.style.strokeDasharray = String(lingkar);
    isi.style.strokeDashoffset = String(lingkar * (1 - n / total));
    $("cincin-angka").textContent = persen + "%";
    $("progres-teks").textContent = n + " dari " + total + " bagian selesai";
    $("cincin").setAttribute("aria-label", "Progres " + persen + " persen");

    var done = aktif && prog.selesai[aktif];
    tSelesai.classList.toggle("aktif", !!done);
    tSelesai.setAttribute("aria-pressed", String(!!done));
    tSelesai.querySelector(".lbl").textContent = done ? "Selesai" : "Tandai selesai";
  }

  /* ---------- Navigasi ---------- */
  function buka(id, opsi) {
    opsi = opsi || {};
    var i = cariIndeks(id);
    if (i < 0) i = 0;
    var x = urutan[i];
    var p = x.part, m = x.modul;
    aktif = p.id;
    prog.terakhir = p.id;
    C.simpanProgres(prog);

    var hashBaru = "#/" + C.idKeHash(p.id);
    if (location.hash !== hashBaru) history.replaceState(null, "", hashBaru);

    var src = r + "modul/" + p.file;
    if (!opsi.dariIframe) {
      if (p.tersedia === false) {
        bingkai.hidden = true;
        bingkai.removeAttribute("src");
        pesan.hidden = false;
      } else {
        pesan.hidden = true;
        bingkai.hidden = false;
        bingkai.src = src;
      }
    }
    bingkai.title = "Modul " + m.no + ": " + p.judul;
    $("judul-kecil").textContent = "Modul " + m.no + (p.jenis === "tugas" ? " · Tugas" : " · " + p.kode);
    $("judul-besar").textContent = p.jenis === "tugas" ? "Lembar tugas: " + m.judul : p.judul;
    document.title = (p.jenis === "tugas" ? "Tugas Modul " + m.no : p.kode + " " + p.judul) + " | Belajar CVCR Finansiologi";

    tSebelum.disabled = i === 0;
    tBerikut.disabled = i === urutan.length - 1;
    tTab.href = src;
    var x0 = (m.excel_peserta || []).filter(function (e) { return e.tersedia !== false; })[0];
    [tExcel, $("t-excel-laci")].forEach(function (t) {
      if (!t) return;
      if (x0) { t.hidden = false; t.href = r + "unduh/" + encodeURI(x0.file); t.title = "Unduh Excel " + x0.file; }
      else t.hidden = true;
    });
    $("t-tab-laci").href = src;

    var det = daftar.querySelector('.p-modul[data-no="' + m.no + '"]');
    if (det && !det.open) det.open = true;
    segarkanStatus();
    var a = daftar.querySelector('a[data-id="' + p.id + '"]');
    if (a && a.scrollIntoView && !opsi.tanpaGulir) a.scrollIntoView({ block: "nearest" });
  }

  function geser(arah) {
    var i = cariIndeks(aktif) + arah;
    if (i >= 0 && i < urutan.length) buka(urutan[i].part.id);
  }

  function tandai() {
    if (!aktif) return;
    if (prog.selesai[aktif]) delete prog.selesai[aktif];
    else prog.selesai[aktif] = true;
    C.simpanProgres(prog);
    segarkanStatus();
  }

  function dariHash() {
    var id = C.hashKeId(location.hash, k);
    if (id && id !== aktif) buka(id);
  }

  /* Sinkron saat navigasi di dalam modul (modnav). Gagal diam-diam di file:// atau lintas origin. */
  function pasangPintasan(doc) {
    try {
      doc.addEventListener("keydown", tombolPintas);
    } catch (e) { /* abaikan */ }
  }
  bingkai.addEventListener("load", function () {
    try {
      var w = bingkai.contentWindow;
      var nama = decodeURIComponent(w.location.pathname.split("/").pop() || "");
      var id = dariBerkas(nama);
      if (id && id !== aktif) buka(id, { dariIframe: true });
      pasangPintasan(w.document);
    } catch (e) { /* tidak bisa membaca iframe: abaikan */ }
  });

  /* ---------- Laci seluler ---------- */
  function laci(buka) {
    sisi.classList.toggle("terbuka", buka);
    tirai.hidden = !buka;
    tMenu.setAttribute("aria-expanded", String(buka));
    if (buka) cari.focus({ preventScroll: true });
  }
  function laciAktif() { return window.matchMedia("(max-width: 900px)").matches; }

  /* ---------- Pencarian ---------- */
  cari.addEventListener("input", function () {
    var q = cari.value.trim().toLowerCase();
    var ada = 0;
    daftar.querySelectorAll(".p-modul").forEach(function (d) {
      var cocok = 0;
      d.querySelectorAll("li").forEach(function (li) {
        var ok = !q || li.getAttribute("data-cari").indexOf(q) >= 0;
        li.hidden = !ok;
        if (ok) cocok++;
      });
      d.hidden = cocok === 0;
      if (q && cocok) d.open = true;
      ada += cocok;
    });
    $("p-kosong").hidden = ada > 0;
  });

  /* ---------- Pintasan keyboard ---------- */
  function tombolPintas(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    var mengetik = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    if (mengetik) {
      if (e.key === "Escape" && t === cari) { cari.value = ""; cari.dispatchEvent(new Event("input")); cari.blur(); }
      return;
    }
    if (e.key === "[") { e.preventDefault(); geser(-1); }
    else if (e.key === "]") { e.preventDefault(); geser(1); }
    else if (e.key === "/") {
      e.preventDefault();
      if (laciAktif()) laci(true);
      cari.focus();
    } else if (e.key === "Escape" && sisi.classList.contains("terbuka")) { laci(false); tMenu.focus(); }
  }
  document.addEventListener("keydown", tombolPintas);

  /* ---------- Reset progres dengan konfirmasi inline ---------- */
  var tReset = $("t-reset");
  var konf = $("konfirmasi");
  tReset.addEventListener("click", function () { konf.hidden = false; tReset.hidden = true; $("t-reset-ya").focus(); });
  $("t-reset-batal").addEventListener("click", function () { konf.hidden = true; tReset.hidden = false; tReset.focus(); });
  $("t-reset-ya").addEventListener("click", function () {
    C.hapusProgres();
    prog = { selesai: {}, terakhir: aktif };
    C.simpanProgres(prog);
    konf.hidden = true; tReset.hidden = false;
    segarkanStatus();
    tReset.focus();
  });

  /* ---------- Pasang ---------- */
  bangunDaftar();
  tSebelum.addEventListener("click", function () { geser(-1); });
  tBerikut.addEventListener("click", function () { geser(1); });
  tSelesai.addEventListener("click", tandai);
  tMenu.addEventListener("click", function () { laci(!sisi.classList.contains("terbuka")); });
  tirai.addEventListener("click", function () { laci(false); });
  daftar.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-id]");
    if (!a) return;
    e.preventDefault();
    buka(a.getAttribute("data-id"), { tanpaGulir: true });
    if (laciAktif()) laci(false);
  });
  window.addEventListener("hashchange", dariHash);

  var awal = C.hashKeId(location.hash, k) || (prog.terakhir && cariIndeks(prog.terakhir) >= 0 ? prog.terakhir : urutan[0].part.id);
  buka(awal);
})();
