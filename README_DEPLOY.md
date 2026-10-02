# Situs Corporate Valuation and Credit Risk: cara jalankan dan deploy

Situs statis di folder `site/`. Tidak ada backend, tidak ada login, tidak ada build.

## 1. Sinkronkan konten modul
Letakkan repo ini satu tingkat di bawah folder yang berisi `modul-*.html` dan
`Finansiologi_Modul*_Lembar_Tugas_*.xlsx` (atau pakai `--sumber`), lalu jalankan:

    python sync_konten.py
    python sync_konten.py --sumber /path/ke/folder/modul

Skrip menyalin modul apa adanya ke `site/modul/`, Excel peserta ke `site/unduh/`, membuat
`Finansiologi_CVCR_Excel_Peserta.zip`, menulis `site/data/kursus.json`, `kursus.js`, dan
`checksum.json`, serta menyalin video promosi dari `video-promosi/hasil/` (atau `aset_web/video/`),
termasuk konversi `.srt` ke `.vtt`. Berkas `*Kunci*`, `.pptx`, dan subfolder sumber tidak pernah disalin.
Jalankan ulang setiap kali modul diperbarui; berkas yang tidak berubah tidak disalin ulang.

## 2. Jalankan lokal

    cd site && python -m http.server 8000
    # buka http://localhost:8000/

Membuka `site/index.html` langsung (file://) juga jalan; subtitle video dan sinkron sidebar saat
navigasi di dalam modul hanya aktif lewat server.

## 3. Deploy
- **GitHub Pages**: unggah isi `site/` ke branch atau folder Pages (semua path relatif, aman di subfolder).
- **Netlify**: drag and drop folder `site/`, atau set publish directory `site`.
- **Vercel**: `vercel deploy site` (tanpa build command).
Setelah domain ada, isi `site/sitemap.xml` dan baris Sitemap di `site/robots.txt`.

## 4. Uji

    python uji/buat_fixture.py /tmp/sumber_uji          # hanya bila modul asli tidak ada
    cp -r site /tmp/site_uji && python sync_konten.py --sumber /tmp/sumber_uji --situs /tmp/site_uji
    NODE_PATH="$(npm root -g)" node uji/uji_situs.cjs /tmp/site_uji /tmp/sumber_uji /tmp/shot

Butuh Playwright (`npm i -g playwright`). Hasil ditulis ke `uji/laporan_uji.md`.
Gambar OG dan favicon dibuat ulang dengan `node alat/buat_gambar.cjs`.
