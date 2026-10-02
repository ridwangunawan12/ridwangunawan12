# PROMPT UNTUK CLAUDE CODE: Website pengenalan dan platform belajar "Corporate Valuation and Credit Risk" (Finansiologi)

Kamu adalah front-end engineer sekaligus desainer. Bangun website statis (tanpa backend, tanpa login, tanpa build tool wajib) yang: (1) memperkenalkan program bootcamp "Corporate Valuation and Credit Risk"; (2) memungkinkan pengunjung klik "Mulai belajar" lalu melihat silabus 12 modul; (3) membawa peserta ke halaman seperti learning platform tempat mereka mengakses materi, tugas interaktif, dan mengunduh Excel peserta.

## Masukan
Folder kerja berisi `BAHAN_WEBSITE_CVCR.md` (fakta, peta situs, spesifikasi tiap halaman, identitas visual, aturan teks), `kursus.json` (kontrak data: 12 modul, bagian, nama berkas, Excel peserta), dan `aset_web/` (screenshot dan diagram), plus logo bila saya lampirkan. Baca ketiganya PENUH dan patuhi.

Konten modul ada di folder induk (satu tingkat di atas folder kerja ini): berkas `modul-*.html` dan `Finansiologi_Modul*_Lembar_Tugas_*.xlsx`. Perlakukan berkas modul sebagai kotak hitam: JANGAN membaca isinya (hemat token) dan JANGAN mengubah satu byte pun. Satu-satunya pembacaan yang diizinkan adalah skrip regex untuk mengekstrak teks pil cover "Level: ..." dan "Estimasi: ..." per modul (bila tidak ditemukan, kosongkan field itu dan sembunyikan di UI).

## Larangan keras (keamanan konten)
- Hanya salin berkas yang cocok pola putih: `modul-*.html` dan `Finansiologi_Modul*_Lembar_Tugas_*.xlsx`. DILARANG menyalin atau mengakses: semua berkas `*Kunci*` (kunci jawaban pengajar), semua `.pptx` (deck contoh kunci capstone), dan subfolder `Claude outputs`, `KP`, `ihsg_high_yield_era`, `sumber-data-icbp`, `video-promosi` (kecuali berkas video dan subtitle final yang sengaja saya sebut di bawah). Tambahkan uji otomatis yang GAGAL bila ada berkas berpola `*Kunci*` atau `*.pptx` di pohon situs.
- Tanpa harga, jadwal, nama pengajar, jumlah sesi, testimoni, sertifikat, janji karier atau gaji. Tanpa analytics, cookie, atau skrip pihak ketiga selain font Google Inter. Tanpa em dash, en dash, atau "--" di teks situs buatanmu (berkas modul tidak diperiksa). Tanpa "beli" atau "jual" sebagai kata kerja transaksi. Tanpa emoji.

## Arsitektur
- HTML, CSS, dan JavaScript murni (ES modules boleh), satu `assets/css/situs.css`, satu atau dua berkas JS. Data dimuat dari `data/kursus.json`. Semua path RELATIF supaya situs jalan di subfolder (GitHub Pages) dan juga saat dibuka dari `file://` (fetch JSON bisa gagal di file://: tanam salinan data sebagai `data/kursus.js` yang di-include sebagai script biasa, dan pakai itu sebagai sumber utama).
- Skrip `sync_konten.py` (Python 3, tanpa dependensi luar) yang idempoten: baca whitelist, salin modul ke `site/modul/` dan Excel peserta ke `site/unduh/`, hitung ukuran dan checksum SHA-256 (tulis `data/checksum.json`), ekstrak level dan estimasi dari pil cover, bangun `data/kursus.json` dan `data/kursus.js` dari `kursus.json` masukan, buat `unduh/Finansiologi_CVCR_Excel_Peserta.zip`, dan salin video promosi bila ada di `../video-promosi/hasil/` (hanya `.mp4` dan `.srt`; konversi `.srt` ke `.vtt`). Jalankan ulang skrip kapan pun modul diperbarui.
- Hasil di folder `site/` (siap diunggah). Sertakan `README_DEPLOY.md` singkat (cara jalankan lokal dengan `python -m http.server`, deploy ke GitHub Pages, Netlify, atau Vercel, dan cara memperbarui konten lewat skrip sinkron), `robots.txt`, `sitemap.xml` (path relatif sebagai komentar bila domain belum ada), meta description dan Open Graph per halaman, favicon dari logo ikon, dan gambar OG 1200x630 yang kamu buat dari hero.

## Halaman dan perilaku (rinci di BAHAN_WEBSITE_CVCR.md bagian 2)
1. Beranda: hero, strip fakta, masalah, tiga pilar, satu cerita (ICBP), peta 12 modul, hasil akhir, untuk siapa dan FAQ, video promosi (opsional), CTA, footer. Tombol utama "Mulai belajar" menuju silabus.
2. Silabus: tab babak, kartu modul accordion, tombol per bagian menuju platform dan unduhan; "Lanjutkan belajar" bila ada progres.
3. Platform belajar: bar atas, sidebar 12 modul dengan pencarian dan status selesai, ring progres, penampil `<iframe>` penuh tinggi, rute hash `#/<id>`, sinkron saat navigasi di dalam modul, tombol Sebelumnya/Berikutnya/Tandai selesai/Buka di tab baru/Unduh Excel modul ini, drawer di seluler, pintasan keyboard. Progres di `localStorage` (try/catch, fallback memori) hanya di cangkang situs.
4. Pusat unduhan: daftar Excel peserta dengan ukuran dan tombol unduh, plus zip semua.

## Kualitas desain
Ikuti identitas Finansiologi (bagian 3 bahan): bersih, profesional, hangat; hero biru penuh dengan lingkaran dekoratif; kartu membulat; tipografi Inter dengan hierarki jelas; animasi halus seperlunya (fade dan geser pendek, hormati `prefers-reduced-motion`); kontras WCAG AA; fokus keyboard terlihat; tautan "lewati ke konten"; semua gambar punya `alt`; target sentuh minimal 44 px. Tampilan harus rapi di 375, 768, 1280, dan 1920 px tanpa scroll horizontal di halaman cangkang. Halaman beranda harus terasa seperti produk pendidikan keuangan yang tepercaya, bukan template generik: gunakan screenshot nyata di kartu mengambang bergaya perangkat, diagram dua lingkaran dan rantai downgrade sebagai SVG buatan sendiri, dan tipografi angka besar pada strip fakta.

## Cara kerja (hemat token)
1. Cek lingkungan satu perintah (`python --version`, `node --version`); gunakan Python untuk skrip sinkron. Bila perlu server uji, pakai `python -m http.server`.
2. Tulis `sync_konten.py` dan jalankan; periksa keluaran ringkasnya (jumlah modul, jumlah Excel, ukuran total, modul tanpa level/estimasi).
3. Bangun CSS dan komponen bersama dulu, lalu halaman satu per satu (beranda, silabus, platform, unduhan). Setelah tiap halaman selesai, jalankan uji ringkas.
4. Uji dengan Playwright (Chromium): (a) alur utama: beranda, klik "Mulai belajar", silabus, klik "Buka 5A", platform memuat `modul/modul-05a-...html` (iframe berisi judul modul); klik "Berikutnya" berpindah ke 5B dan hash berubah; klik tautan navigasi di dalam modul memperbarui sidebar; "Tandai selesai" memperbarui ring progres dan tetap ada setelah reload; (b) semua tautan internal dan semua `file` di `kursus.json` menghasilkan 200 dan tidak kosong; (c) tombol unduh mengunduh berkas yang checksum-nya sama dengan sumber; (d) tidak ada berkas `*Kunci*` atau `.pptx` di `site/`; (e) tidak ada error konsol selain kegagalan memuat font eksternal; (f) tidak ada scroll horizontal di 375, 768, 1280 px untuk keempat halaman; (g) checksum semua berkas `modul/` sama dengan sumber; (h) pemeriksaan tanda pisah ganda dan kata terlarang pada HTML, JS, dan JSON buatanmu.
5. Ambil screenshot setiap halaman pada 1440 px dan 375 px, susun contact sheet, dan LIHAT dengan alat baca gambar. Perbaiki tumpang tindih, teks terpotong, kontras rendah, dan celah kosong. Ulangi sampai bersih.

## Keluaran
Folder `site/` (siap unggah), `sync_konten.py`, `README_DEPLOY.md`, `uji/` berisi skrip Playwright dan laporan hasil. Laporan akhir maksimum 15 baris: struktur, hasil uji (jumlah lulus), ukuran total situs, modul yang levelnya tidak terekstrak, dan hal yang perlu saya putuskan (misalnya domain, tautan sosial).

## Batasan
- Jangan menambah fitur di luar daftar (akun, komentar, pembayaran, forum, sertifikat, analytics). Bila ada keputusan kecil yang tidak diatur, pilih sendiri, catat satu baris di laporan, dan lanjut; jangan bertanya.
- Jangan mengunggah atau mem-publish apa pun ke layanan luar. Jangan mengubah berkas di luar folder kerja, kecuali membaca whitelist di folder induk.
