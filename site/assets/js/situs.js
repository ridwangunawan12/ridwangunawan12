/* Finansiologi CVCR: skrip bersama untuk beranda, silabus, dan unduhan.
   Skrip biasa (bukan module) supaya tetap jalan saat dibuka dari file://. */
(function () {
  "use strict";

  var KUNCI_PROGRES = "cvcr.progres.v1";
  var memori = null;

  /* ---------- Data ---------- */
  function data() {
    return window.KURSUS || null;
  }
  function akar() {
    return document.body.getAttribute("data-root") || "";
  }
  function semuaBagian(k) {
    var hasil = [];
    k.modul.forEach(function (m) {
      m.parts.forEach(function (p) { hasil.push({ modul: m, part: p }); });
    });
    return hasil;
  }
  function idKeHash(id) { return id.replace(/^m/, ""); }
  function hashKeId(h, k) {
    h = (h || "").replace(/^#\/?/, "").toLowerCase();
    if (!h) return null;
    var ada = semuaBagian(k).map(function (x) { return x.part.id; });
    if (ada.indexOf("m" + h) >= 0) return "m" + h;
    if (ada.indexOf(h) >= 0) return h;
    return null;
  }
  function babakDari(k, nama) {
    for (var i = 0; i < k.babak.length; i++) if (k.babak[i].nama === nama) return k.babak[i];
    return { nama: nama, warna: "#1E90E6", modul: [] };
  }

  /* Pilih teks gelap atau putih di atas warna babak, mana yang kontrasnya lebih tinggi. */
  function luminans(hex) {
    var c = hex.replace("#", "");
    var rgb = [0, 2, 4].map(function (i) {
      var v = parseInt(c.substr(i, 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  function terang(hex) {
    var l = luminans(hex);
    return (l + 0.05) / 0.065 > 1.05 / (l + 0.05);
  }

  function ukuran(bytes) {
    if (!bytes) return "";
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1).replace(".", ",") + " MB";
    return Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Progres (localStorage dengan cadangan memori) ---------- */
  function bacaProgres() {
    var kosong = { selesai: {}, terakhir: null };
    try {
      var raw = window.localStorage.getItem(KUNCI_PROGRES);
      if (raw) {
        var o = JSON.parse(raw);
        return { selesai: o.selesai || {}, terakhir: o.terakhir || null };
      }
      return kosong;
    } catch (e) {
      return memori || kosong;
    }
  }
  function simpanProgres(p) {
    memori = p;
    try { window.localStorage.setItem(KUNCI_PROGRES, JSON.stringify(p)); } catch (e) { /* cadangan memori */ }
  }
  function hapusProgres() {
    memori = null;
    try { window.localStorage.removeItem(KUNCI_PROGRES); } catch (e) { /* abaikan */ }
  }

  /* ---------- Ikon ---------- */
  var IKON = {
    materi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/><path d="M8 7h7"/></svg>',
    tugas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4h6v3H9z"/><path d="M15 5h3v16H6V5h3"/><path d="M9 13l2 2 4-4"/></svg>',
    bacaan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/></svg>',
    unduh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>',
    panah: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    kanan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>',
    cek: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>'
  };

  /* ---------- Perilaku bersama ---------- */
  function pasangKepala() {
    var kepala = document.querySelector(".kepala");
    if (kepala) {
      var cek = function () { kepala.classList.toggle("bergulir", window.scrollY > 8); };
      cek();
      window.addEventListener("scroll", cek, { passive: true });
    }
    var tombol = document.querySelector(".nav-toggle");
    var nav = document.getElementById("nav-utama");
    if (tombol && nav) {
      tombol.addEventListener("click", function () {
        var buka = !nav.classList.contains("terbuka");
        nav.classList.toggle("terbuka", buka);
        tombol.setAttribute("aria-expanded", String(buka));
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && nav.classList.contains("terbuka")) {
          nav.classList.remove("terbuka");
          tombol.setAttribute("aria-expanded", "false");
          tombol.focus();
        }
      });
    }
  }

  function pasangMuncul() {
    var el = document.querySelectorAll(".muncul");
    if (!("IntersectionObserver" in window)) {
      el.forEach(function (x) { x.classList.add("terlihat"); });
      return;
    }
    var io = new IntersectionObserver(function (entri) {
      entri.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("terlihat"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    el.forEach(function (x) { io.observe(x); });
  }

  /* ---------- Beranda ---------- */
  function beranda(k) {
    var nTugas = k.modul.filter(function (m) { return m.excel_peserta && m.excel_peserta.length; }).length;
    var elTugas = document.getElementById("fakta-tugas");
    if (elTugas) elTugas.textContent = String(nTugas);
    var elModul = document.getElementById("fakta-modul");
    if (elModul) elModul.textContent = String(k.modul.length);

    var peta = document.getElementById("peta-modul");
    if (peta) {
      peta.innerHTML = k.babak.map(function (b) {
        var modul = k.modul.filter(function (m) { return m.babak === b.nama; });
        var kelas = terang(b.warna) ? " terang" : "";
        return '<div class="babak-baris muncul" style="--warna:' + b.warna + '">' +
          '<div class="babak-label"><b>' + esc(b.nama) + '</b><span>Modul ' + esc(modul.map(function (m) { return m.no; }).join(", ")) + '</span></div>' +
          '<div class="babak-modul">' + modul.map(function (m) {
            var kode = m.parts.filter(function (p) { return p.jenis !== "tugas"; }).map(function (p) { return p.kode; });
            var info = m.parts.length > 1 ? kode.join(", ") + (m.parts.some(function (p) { return p.jenis === "tugas"; }) ? " + tugas" : "") : (m.parts[0].jenis === "bacaan" ? "Bacaan" : "Materi");
            return '<a class="modul-mini" href="silabus/#modul-' + m.no + '">' +
              '<span class="no' + kelas + '">' + m.no + '</span>' +
              '<span><b>' + esc(m.judul) + '</b><small>' + esc(info) + '</small></span></a>';
          }).join("") + '</div></div>';
      }).join("");
    }

    var seksiVideo = document.getElementById("video");
    if (seksiVideo && k.video && k.video.mp4) {
      var v = seksiVideo.querySelector("video");
      var src = document.createElement("source");
      src.src = akar() + k.video.mp4;
      src.type = "video/mp4";
      v.appendChild(src);
      // Subtitle diblokir browser di file://, jadi hanya dipasang saat dilayani server.
      if (k.video.vtt && location.protocol !== "file:") {
        var tr = document.createElement("track");
        tr.kind = "subtitles"; tr.srclang = "id"; tr.label = "Bahasa Indonesia"; tr.default = true;
        tr.src = akar() + k.video.vtt;
        v.appendChild(tr);
      }
      seksiVideo.hidden = false;
      var tautNav = document.getElementById("nav-video");
      if (tautNav) tautNav.hidden = false;
    }

    // Rantai downgrade: nyalakan kotak satu per satu saat terlihat.
    var rantai = document.querySelector(".rantai");
    if (rantai) {
      var kotak = rantai.querySelectorAll("li");
      var kurangGerak = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (kurangGerak || !("IntersectionObserver" in window)) {
        kotak.forEach(function (x) { x.classList.add("nyala"); });
      } else {
        var jalan = false;
        var putar = function () {
          var i = 0;
          kotak.forEach(function (x) { x.classList.remove("nyala"); });
          var t = setInterval(function () {
            if (i < kotak.length) { kotak[i].classList.add("nyala"); i++; }
            else { clearInterval(t); setTimeout(putar, 3200); }
          }, 650);
        };
        new IntersectionObserver(function (e, io) {
          if (e[0].isIntersecting && !jalan) { jalan = true; putar(); io.disconnect(); }
        }, { threshold: 0.4 }).observe(rantai);
      }
    }
  }

  /* ---------- Silabus ---------- */
  function silabus(k) {
    var daftar = document.getElementById("daftar-modul");
    var tab = document.getElementById("tab-babak");
    if (!daftar) return;
    var prog = bacaProgres();
    var r = akar();

    var tombolTab = [{ nama: "Semua", warna: "#1A3A5C" }].concat(k.babak);
    tab.innerHTML = tombolTab.map(function (b, i) {
      return '<button type="button" data-babak="' + esc(b.nama) + '" aria-pressed="' + (i === 0) + '" style="--warna:' + b.warna + '">' +
        (i ? "<i></i>" : "") + esc(b.nama) + '</button>';
    }).join("");

    daftar.innerHTML = k.modul.map(function (m) {
      var b = babakDari(k, m.babak);
      var kelas = terang(b.warna) ? " terang" : "";
      var materi = m.parts.filter(function (p) { return p.jenis !== "tugas"; });
      var tugas = m.parts.filter(function (p) { return p.jenis === "tugas"; });
      var hitung = m.parts.filter(function (p) { return !p.opsional; });
      var nSelesai = hitung.filter(function (p) { return prog.selesai[p.id]; }).length;
      var opsional = m.parts.some(function (p) { return p.opsional; });

      var tombol = materi.map(function (p) {
        var label = materi.length > 1 ? "Buka " + p.kode : (p.jenis === "bacaan" ? "Buka bacaan" : "Buka materi");
        return '<a class="tombol tombol-kecil tombol-lunak" href="' + r + 'belajar/#/' + idKeHash(p.id) + '">' + IKON[p.jenis] + esc(label) +
          (p.opsional ? ' <span class="lencana lencana-opsional">opsional</span>' : "") + '</a>';
      }).concat(tugas.map(function (p) {
        return '<a class="tombol tombol-kecil tombol-utama" href="' + r + 'belajar/#/' + idKeHash(p.id) + '">' + IKON.tugas + 'Kerjakan tugas</a>';
      })).concat((m.excel_peserta || []).map(function (x) {
        return x.tersedia === false ? "" :
          '<a class="tombol tombol-kecil tombol-lunak" href="' + r + 'unduh/' + encodeURI(x.file) + '" download>' + IKON.unduh + 'Unduh Excel <span class="sr">' + esc(x.file) + '</span></a>';
      })).join("");

      var info = '<div class="info"><b>Yang kamu hasilkan</b><span>' + esc(m.hasil_peserta) + '</span></div>';
      if (m.level) info += '<div class="info"><b>Level</b><span>' + esc(m.level) + '</span></div>';
      if (m.estimasi) info += '<div class="info"><b>Estimasi</b><span>' + esc(m.estimasi) + '</span></div>';
      if (m.catatan) info += '<div class="info catatan"><b>Catatan</b><span>' + esc(m.catatan) + '</span></div>';

      return '<details class="kartu-modul" id="modul-' + m.no + '" data-babak="' + esc(m.babak) + '" style="--warna:' + b.warna + '">' +
        '<summary><span class="nomor-besar" aria-hidden="true">' + (m.no < 10 ? "0" : "") + m.no + '</span>' +
        '<span><span class="lencana-baris"><span class="lencana lencana-babak' + kelas + '">' + esc(m.babak) + '</span>' +
        '<span class="lencana">Modul ' + m.no + '</span>' +
        (opsional ? '<span class="lencana lencana-opsional">9B: Lanjutan opsional</span>' : "") +
        (nSelesai ? '<span class="lencana lencana-selesai">' + nSelesai + ' dari ' + hitung.length + ' selesai</span>' : "") +
        '</span><h2>' + esc(m.judul) + '</h2><p class="ringkas">' + esc(m.ringkasan) + '</p></span>' +
        '<span class="panah">' + IKON.panah + '</span></summary>' +
        '<div class="badan"><div class="info-grid">' + info + '</div><div class="tombol-baris">' + tombol + '</div></div></details>';
    }).join("");

    // Filter babak.
    tab.addEventListener("click", function (e) {
      var t = e.target.closest("button");
      if (!t) return;
      var pilih = t.getAttribute("data-babak");
      tab.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === t)); });
      daftar.querySelectorAll(".kartu-modul").forEach(function (c) {
        c.hidden = !(pilih === "Semua" || c.getAttribute("data-babak") === pilih);
      });
    });

    // Buka semua / tutup semua.
    var bukaSemua = document.getElementById("buka-semua");
    if (bukaSemua) {
      bukaSemua.addEventListener("click", function () {
        var kartu = daftar.querySelectorAll(".kartu-modul:not([hidden])");
        var adaTutup = Array.prototype.some.call(kartu, function (c) { return !c.open; });
        kartu.forEach(function (c) { c.open = adaTutup; });
        bukaSemua.textContent = adaTutup ? "Tutup semua" : "Buka semua";
      });
    }

    // Buka kartu dari hash #modul-N.
    function dariHash() {
      var m = /^#modul-(\d+)$/.exec(location.hash);
      if (!m) return;
      var c = document.getElementById("modul-" + m[1]);
      if (c) { c.hidden = false; c.open = true; setTimeout(function () { c.scrollIntoView({ block: "start" }); }, 30); }
    }
    dariHash();
    window.addEventListener("hashchange", dariHash);

    // Tombol melayang.
    var lanjut = document.getElementById("lanjutkan");
    if (lanjut && prog.terakhir) {
      lanjut.href = r + "belajar/#/" + idKeHash(prog.terakhir);
      lanjut.hidden = false;
    }
  }

  /* ---------- Unduhan ---------- */
  function unduhan(k) {
    var daftar = document.getElementById("daftar-unduh");
    if (!daftar) return;
    var r = akar();
    var item = [];
    k.modul.forEach(function (m) {
      (m.excel_peserta || []).forEach(function (x) { item.push({ m: m, x: x }); });
    });
    daftar.innerHTML = item.map(function (it) {
      var x = it.x, m = it.m;
      var aksi = x.tersedia === false
        ? '<span class="tidak-tersedia">Belum tersedia</span>'
        : '<a class="tombol tombol-kecil tombol-utama" href="' + r + 'unduh/' + encodeURI(x.file) + '" download>' + IKON.unduh + 'Unduh</a>';
      return '<div class="unduh-item"><span class="ikon-xl" aria-hidden="true">XLSX</span>' +
        '<div><div class="nama">' + esc(x.file) + '</div><div class="meta">Modul ' + m.no + ': ' + esc(m.judul) + '. ' + esc(x.deskripsi) + '</div></div>' +
        '<span class="ukuran">' + ukuran(x.bytes || x.kb * 1024) + '</span>' + aksi + '</div>';
    }).join("");

    var zip = document.getElementById("zip-baris");
    if (zip) {
      if (k.zip) {
        var a = zip.querySelector("a");
        a.href = r + "unduh/" + encodeURI(k.zip.file);
        zip.querySelector(".zip-ukuran").textContent = item.filter(function (i) { return i.x.tersedia !== false; }).length + " berkas Excel, " + ukuran(k.zip.bytes);
        zip.hidden = false;
      }
    }
  }

  /* ---------- Mulai ---------- */
  window.CVCR = {
    data: data, akar: akar, semuaBagian: semuaBagian, idKeHash: idKeHash, hashKeId: hashKeId, babakDari: babakDari,
    terang: terang, ukuran: ukuran, esc: esc, IKON: IKON,
    bacaProgres: bacaProgres, simpanProgres: simpanProgres, hapusProgres: hapusProgres
  };

  function mulai() {
    document.documentElement.classList.remove("no-js");
    var halaman = document.body.getAttribute("data-halaman");
    if (halaman === "belajar") return; // ditangani belajar.js
    pasangKepala();
    var k = data();
    if (k) {
      if (halaman === "beranda") beranda(k);
      if (halaman === "silabus") silabus(k);
      if (halaman === "unduhan") unduhan(k);
    }
    pasangMuncul();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mulai);
  else mulai();
})();
