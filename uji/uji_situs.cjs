// Uji otomatis situs CVCR dengan Playwright (Chromium).
// Pemakaian: NODE_PATH="$(npm root -g)" node uji/uji_situs.cjs <folder_situs> <folder_sumber> [folder_screenshot]
// Menulis ringkasan ke uji/laporan_uji.md dan keluar dengan kode 1 bila ada yang gagal.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { chromium } = require("playwright");
const { pasangFont } = require("../alat/buat_gambar.cjs");

const SITUS = path.resolve(process.argv[2] || "site");
const SUMBER = path.resolve(process.argv[3] || "..");
const SHOT = process.argv[4] ? path.resolve(process.argv[4]) : null;
const PORT = 8000 + Math.floor(Math.random() * 900);
const BASE = `http://127.0.0.1:${PORT}/`;
const HALAMAN = ["", "silabus/", "belajar/", "unduhan/"];
const kursus = JSON.parse(fs.readFileSync(path.join(SITUS, "data/kursus.json"), "utf8"));

const hasil = [];
function catat(nama, lulus, detail = "") {
  hasil.push({ nama, lulus, detail });
  console.log(`${lulus ? "LULUS" : "GAGAL"}  ${nama}${detail ? "  :: " + detail : ""}`);
}
async function uji(nama, fn) {
  try {
    const d = await fn();
    catat(nama, true, d || "");
  } catch (e) {
    catat(nama, false, String(e && e.message ? e.message : e).split("\n")[0]);
  }
}
function pastikan(kondisi, pesan) { if (!kondisi) throw new Error(pesan); }
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
function semuaBerkas(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...semuaBerkas(p)); else out.push(p);
  }
  return out;
}
const bukanFont = (t) => !/fonts\.(googleapis|gstatic)\.com|Failed to load resource.*(font|woff)/i.test(t);

(async () => {
  const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], { cwd: SITUS, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 900));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true });
  const galat = [];
  ctx.on("page", (p) => {
    p.on("console", (m) => { if (m.type() === "error" && bukanFont(m.text() + " " + ((m.location() || {}).url || ""))) galat.push(`${p.url()}: ${m.text()}`); });
    p.on("pageerror", (e) => galat.push(`${p.url()}: ${e.message}`));
  });
  const page = await ctx.newPage();
  await pasangFont(page);

  // (a) Alur utama.
  await uji("a1 beranda: Mulai belajar menuju silabus", async () => {
    await page.goto(BASE);
    await page.locator(".hero a", { hasText: "Mulai belajar" }).first().click();
    await page.waitForURL(/\/silabus\/$/);
    await page.waitForSelector(".kartu-modul");
    return `${await page.locator(".kartu-modul").count()} kartu modul`;
  });
  await uji("a2 silabus: Buka 5A memuat modul 5A di iframe", async () => {
    await page.locator("#modul-5 > summary").click();
    await page.locator("#modul-5 a", { hasText: "Buka 5A" }).click();
    await page.waitForURL(/\/belajar\/#\/5a$/);
    const src = await page.locator("#penampil").getAttribute("src");
    pastikan(/modul\/modul-05a-cost-of-capital-wacc\.html$/.test(src), "src iframe " + src);
    const f = page.frameLocator("#penampil");
    const h1 = await f.locator("h1").first().textContent({ timeout: 5000 });
    pastikan(/Cost of Capital/.test(h1), "judul iframe " + h1);
    return h1;
  });
  await uji("a3 Berikutnya pindah ke 5B dan hash berubah", async () => {
    await page.locator("#t-berikut").click();
    await page.waitForFunction(() => location.hash === "#/5b");
    await page.waitForFunction(() => /modul-05b/.test(document.getElementById("penampil").src));
    return "hash #/5b";
  });
  await uji("a4 tautan modnav di dalam modul memperbarui sidebar dan hash", async () => {
    const f = page.frameLocator("#penampil");
    await f.locator(".modnav a", { hasText: "5C" }).click();
    await page.waitForFunction(() => location.hash === "#/5c", null, { timeout: 5000 });
    const aktif = await page.locator('#p-daftar a[aria-current="page"]').getAttribute("data-id");
    pastikan(aktif === "m5c", "sidebar aktif " + aktif);
    const judul = await page.locator("#judul-besar").textContent();
    return `sidebar m5c, judul "${judul}"`;
  });
  await uji("a5 Tandai selesai memperbarui ring dan bertahan setelah reload", async () => {
    const sebelum = await page.locator("#cincin-angka").textContent();
    await page.locator("#t-selesai").click();
    const sesudah = await page.locator("#cincin-angka").textContent();
    pastikan(sebelum !== sesudah, `ring tetap ${sesudah}`);
    await page.reload();
    await page.waitForSelector("#p-daftar a", { state: "attached" });
    const reload = await page.locator("#cincin-angka").textContent();
    pastikan(reload === sesudah, `setelah reload ${reload}`);
    pastikan(await page.locator('#p-daftar a[data-id="m5c"] .status.selesai').count() === 1, "status sidebar");
    return `${sebelum} ke ${sesudah}, tetap setelah reload`;
  });
  await uji("a6 pintasan keyboard [ ] dan /", async () => {
    await page.locator("body").click({ position: { x: 5, y: 200 } }).catch(() => {});
    await page.locator("#judul-besar").click();
    await page.keyboard.press("]");
    await page.waitForFunction(() => location.hash === "#/5t");
    await page.keyboard.press("[");
    await page.waitForFunction(() => location.hash === "#/5c");
    await page.keyboard.press("/");
    pastikan(await page.evaluate(() => document.activeElement.id === "cari"), "fokus pencarian");
    await page.keyboard.type("covenant");
    const n = await page.locator("#p-daftar li:not([hidden])").count();
    pastikan(n > 0, "hasil pencarian kosong");
    return `${n} hasil untuk "covenant"`;
  });
  await uji("a7 reset progres dengan konfirmasi inline", async () => {
    await page.locator("#t-reset").click();
    pastikan(await page.locator("#konfirmasi").isVisible(), "konfirmasi tidak tampil");
    await page.locator("#t-reset-ya").click();
    const v = await page.locator("#cincin-angka").textContent();
    pastikan(v === "0%", "ring " + v);
    return "kembali ke 0%";
  });
  await uji("a8 silabus menampilkan Lanjutkan belajar bila ada progres", async () => {
    await page.goto(BASE + "silabus/");
    const t = page.locator("#lanjutkan");
    pastikan(await t.isVisible(), "tombol tersembunyi");
    return await t.getAttribute("href");
  });

  // (b) Tautan internal dan semua berkas di kursus.json.
  await uji("b tautan internal dan berkas kursus.json menghasilkan 200 dan tidak kosong", async () => {
    const url = new Set();
    for (const h of HALAMAN) {
      await page.goto(BASE + h);
      await page.waitForTimeout(150);
      const daftar = await page.evaluate(() => [...document.querySelectorAll("a[href], img[src], script[src], link[href], source[src], track[src], video[poster]")]
        .map((e) => e.href || e.src || (e.getAttribute("poster") && new URL(e.getAttribute("poster"), location.href).href)).filter(Boolean));
      daftar.forEach((u) => { if (u.startsWith(BASE)) url.add(u.split("#")[0]); });
    }
    for (const m of kursus.modul) {
      m.parts.forEach((p) => url.add(BASE + "modul/" + p.file));
      (m.excel_peserta || []).forEach((x) => url.add(BASE + "unduh/" + encodeURI(x.file)));
    }
    if (kursus.zip) url.add(BASE + "unduh/" + kursus.zip.file);
    const buruk = [];
    for (const u of url) {
      const r = await ctx.request.get(u);
      const b = await r.body();
      if (r.status() !== 200 || b.length === 0) buruk.push(`${r.status()} ${u.replace(BASE, "/")}`);
    }
    pastikan(!buruk.length, buruk.slice(0, 4).join(", "));
    return `${url.size} URL diperiksa`;
  });

  // (c) Unduhan sama dengan sumber.
  await uji("c tombol unduh menghasilkan berkas dengan checksum sama dengan sumber", async () => {
    await page.goto(BASE + "unduhan/");
    const tombol = page.locator(".unduh-item a[download]");
    const n = await tombol.count();
    pastikan(n > 0, "tidak ada tombol unduh");
    let cocok = 0;
    for (let i = 0; i < n; i++) {
      const [d] = await Promise.all([page.waitForEvent("download"), tombol.nth(i).click()]);
      const tmp = await d.path();
      const asli = path.join(SUMBER, d.suggestedFilename());
      pastikan(fs.existsSync(asli), "sumber tidak ada " + d.suggestedFilename());
      pastikan(sha(tmp) === sha(asli), "checksum beda " + d.suggestedFilename());
      cocok++;
    }
    const [z] = await Promise.all([page.waitForEvent("download"), page.locator("#zip-baris a").click()]);
    pastikan(sha(await z.path()) === sha(path.join(SITUS, "unduh", kursus.zip.file)), "zip beda");
    return `${cocok} Excel + zip cocok`;
  });

  // (d) Tidak ada berkas terlarang.
  await uji("d tidak ada berkas *Kunci* atau .pptx di situs", async () => {
    const bocor = semuaBerkas(SITUS).filter((f) => /kunci/i.test(path.basename(f)) || /\.pptx$/i.test(f) || /bocor/.test(f));
    pastikan(!bocor.length, bocor.join(", "));
    return `${semuaBerkas(SITUS).length} berkas bersih`;
  });

  // (f) Tidak ada scroll horizontal; sekaligus screenshot.
  for (const w of [375, 768, 1280]) {
    await uji(`f tanpa scroll horizontal pada ${w} px`, async () => {
      const p = await ctx.newPage();
      await pasangFont(p);
      await p.setViewportSize({ width: w, height: 900 });
      const lebar = [];
      for (const h of HALAMAN) {
        await p.goto(BASE + h);
        await p.waitForTimeout(200);
        const sw = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
        if (sw > w) lebar.push(`/${h} ${sw}px`);
      }
      await p.close();
      pastikan(!lebar.length, lebar.join(", "));
      return "4 halaman";
    });
  }

  // (g) Checksum modul sama dengan sumber.
  await uji("g checksum semua berkas modul/ sama dengan sumber", async () => {
    const f = fs.readdirSync(path.join(SITUS, "modul"));
    pastikan(f.length > 0, "modul/ kosong");
    const beda = f.filter((n) => sha(path.join(SITUS, "modul", n)) !== sha(path.join(SUMBER, n)));
    pastikan(!beda.length, beda.join(", "));
    return `${f.length} berkas identik`;
  });

  // (h) Tanda pisah ganda, kata terlarang, emoji.
  await uji("h teks situs bebas em dash, en dash, '--', beli/jual, emoji", async () => {
    const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
    const KATA = /\b(beli|jual|membeli|menjual|dibeli|dijual|pembelian|penjualan)\b/i;
    const masalah = [];
    for (const h of HALAMAN) {
      await page.goto(BASE + h);
      await page.waitForTimeout(150);
      const teks = await page.evaluate(() => {
        document.querySelectorAll("details").forEach((d) => (d.open = true));
        document.querySelectorAll("[hidden]").forEach((d) => (d.hidden = false));
        const meta = [...document.querySelectorAll("meta[content], [title], [aria-label], [alt], [placeholder]")]
          .map((e) => [e.getAttribute("content"), e.getAttribute("title"), e.getAttribute("aria-label"), e.getAttribute("alt"), e.getAttribute("placeholder")].join(" "));
        return document.title + " " + document.body.innerText + " " + meta.join(" ");
      });
      if (/[—–]/.test(teks)) masalah.push(`/${h} em/en dash`);
      if (/--/.test(teks)) masalah.push(`/${h} "--"`);
      if (KATA.test(teks)) masalah.push(`/${h} kata ${teks.match(KATA)[0]}`);
      if (EMOJI.test(teks)) masalah.push(`/${h} emoji`);
    }
    // Berkas buatan sendiri: HTML, JS, CSS, JSON.
    const milik = semuaBerkas(SITUS).filter((f) => /\.(html|js|css|json)$/.test(f) && !f.includes(path.sep + "modul" + path.sep));
    for (const f of milik) {
      const s = fs.readFileSync(f, "utf8");
      if (/[—–]/.test(s)) masalah.push(`${path.relative(SITUS, f)} em/en dash`);
      if (EMOJI.test(s)) masalah.push(`${path.relative(SITUS, f)} emoji`);
      if (KATA.test(s.replace(/<[^>]+>/g, " "))) masalah.push(`${path.relative(SITUS, f)} kata terlarang`);
      if (f.endsWith(".json")) {
        const str = []; JSON.parse(s, (k, v) => { if (typeof v === "string") str.push(v); return v; });
        if (str.some((v) => /--/.test(v))) masalah.push(`${path.relative(SITUS, f)} "--"`);
      }
      if (f.endsWith(".html")) {
        const tampak = s.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style)[\s\S]*?<\/\1>/g, "").replace(/<[^>]+>/g, " ");
        if (/--/.test(tampak)) masalah.push(`${path.relative(SITUS, f)} "--" di teks`);
      }
    }
    pastikan(!masalah.length, masalah.join("; "));
    return `4 halaman + ${milik.length} berkas`;
  });

  // Video dan subtitle tampil bila ada.
  await uji("video promosi tampil dengan subtitle .vtt", async () => {
    await page.goto(BASE);
    pastikan(await page.locator("#video").isVisible(), "seksi video tersembunyi");
    const tr = await page.locator("#video track").getAttribute("src");
    const r = await ctx.request.get(new URL(tr, BASE).href);
    pastikan(r.status() === 200 && (await r.text()).startsWith("WEBVTT"), "vtt tidak valid");
    return tr;
  });

  // Situs juga jalan dari file://.
  await uji("file:// beranda dan platform memuat data tanpa server", async () => {
    const p = await ctx.newPage();
    await p.goto("file://" + path.join(SITUS, "index.html"));
    const n = await p.locator(".modul-mini").count();
    await p.goto("file://" + path.join(SITUS, "belajar/index.html") + "#/7a");
    const src = await p.locator("#penampil").getAttribute("src");
    await p.close();
    pastikan(n === 12 && /modul-07a/.test(src), `peta ${n}, src ${src}`);
    return "peta 12 modul, iframe 7A";
  });

  // Screenshot 1440 dan 375.
  if (SHOT) {
    fs.mkdirSync(SHOT, { recursive: true });
    for (const w of [1440, 375]) {
      const p = await ctx.newPage();
      await pasangFont(p);
      await p.setViewportSize({ width: w, height: w === 375 ? 812 : 900 });
      for (const h of HALAMAN) {
        await p.goto(BASE + h + (h === "belajar/" ? "#/5a" : ""));
        await p.evaluate(() => document.fonts.ready);
        await p.evaluate(async () => {
          document.querySelectorAll(".muncul").forEach((e) => e.classList.add("terlihat"));
          document.querySelectorAll(".rantai li").forEach((e, i) => i < 3 && e.classList.add("nyala"));
        });
        if (h === "silabus/") await p.locator("#modul-5 > summary").click();
        await p.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = "eager")));
        await p.waitForTimeout(500);
        const nama = (h.replace("/", "") || "beranda") + "-" + w + ".png";
        await p.screenshot({ path: path.join(SHOT, nama), fullPage: h !== "belajar/" });
      }
      if (w === 375) {
        await p.goto(BASE + "belajar/#/5a");
        await p.locator("#t-menu").click();
        await p.waitForTimeout(400);
        await p.screenshot({ path: path.join(SHOT, "belajar-laci-375.png") });
      }
      await p.close();
    }
  }

  // (e) Konsol bersih (dievaluasi terakhir agar mencakup semua kunjungan).
  catat("e tidak ada error konsol selain font eksternal", galat.length === 0, galat.slice(0, 3).join(" | "));

  await browser.close();
  server.kill();

  const lulus = hasil.filter((h) => h.lulus).length;
  const md = [`# Laporan uji situs CVCR`, ``, `Dijalankan: ${new Date().toISOString()}`, `Situs: ${path.basename(SITUS)}, sumber: ${path.basename(SUMBER)}`, ``,
    `**${lulus} dari ${hasil.length} lulus**`, ``, `| Hasil | Uji | Detail |`, `|---|---|---|`,
    ...hasil.map((h) => `| ${h.lulus ? "LULUS" : "GAGAL"} | ${h.nama} | ${String(h.detail).replace(/\|/g, "/")} |`)].join("\n");
  fs.writeFileSync(path.join(__dirname, "laporan_uji.md"), md + "\n");
  console.log(`\n${lulus} dari ${hasil.length} lulus`);
  process.exit(lulus === hasil.length ? 0 : 1);
})();
