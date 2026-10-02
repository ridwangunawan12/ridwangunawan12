// Membuat gambar OG 1200x630 dan favicon PNG dari HTML/SVG buatan sendiri.
// Jalankan: NODE_PATH="$(npm root -g)" node alat/buat_gambar.cjs
const path = require("path");
const { chromium } = require("playwright");
const AKAR = path.resolve(__dirname, "..");
const IMG = path.join(AKAR, "site/assets/img");
const fs = require("fs");
// Opsional: berkas Inter lokal (woff2) bila browser uji tidak bisa menjangkau Google Fonts.
const FONT = process.env.FONT_INTER;
async function pasangFont(page) {
  if (!FONT || !fs.existsSync(FONT)) return;
  await page.route("https://fonts.googleapis.com/**", (r) => r.fulfill({ contentType: "text/css",
    body: "@font-face{font-family:'Inter';font-weight:100 900;font-display:swap;src:url(https://fonts.gstatic.com/inter.woff2) format('woff2')}" }));
  await page.route("https://fonts.gstatic.com/**", (r) => r.fulfill({ contentType: "font/woff2", body: fs.readFileSync(FONT) }));
}
module.exports = { pasangFont };
if (require.main !== module) return;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await pasangFont(p);
  await p.goto("file://" + path.join(__dirname, "og.html"));
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(IMG, "og.png") });
  for (const [n, f] of [[32, "favicon-32.png"], [180, "apple-touch-icon.png"]]) {
    const q = await b.newPage({ viewport: { width: n, height: n } });
    await q.setContent(`<style>html,body{margin:0}</style><img src="file://${path.join(IMG, "favicon.svg")}" width="${n}" height="${n}">`);
    await q.waitForTimeout(150);
    await q.screenshot({ path: path.join(IMG, f), omitBackground: true });
  }
  await b.close();
  console.log("og.png, favicon-32.png, apple-touch-icon.png dibuat");
})();
