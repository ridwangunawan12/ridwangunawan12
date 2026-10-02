# BAHAN WEBSITE: Program "Corporate Valuation and Credit Risk" (Finansiologi)

Sumber fakta, naskah halaman, dan aturan untuk situs. Data struktur modul (judul, bagian, nama berkas, Excel peserta) ada di `kursus.json`; itulah kontrak data situs. Jangan menambah fakta di luar dua berkas ini.

## 1. Fakta program
- Bootcamp keuangan oleh Finansiologi. 12 modul dari dasar sampai capstone, level pemula sampai menengah.
- Running case: PT Indofood CBP Sukses Makmur Tbk (ICBP) dari Modul 3 sampai 12. Data pasar dan laporan keuangan nyata; parameter kredit ILUSTRATIF; fasilitas kredit dan LBO dalam latihan HIPOTETIS.
- Tiap modul: materi HTML ringkas (contoh Indonesia, Latihan Konsep), tugas interaktif (semua soal dijawab dulu, satu tombol memberi nilai dan contoh jawaban, boleh diulang), dan Excel peserta (sel kuning input, sel hijau jawaban). Modul 1, 2, dan 11 hanya bacaan (tanpa tugas dan Excel). Modul 9B bersifat lanjutan opsional.
- Sasaran: mahasiswa, fresh graduate, early career, career switcher, non-finance, manajer baru yang perlu membaca angka.
- Tagline: "Sebelum kamu menghitung angka, pahami dulu cerita di balik bisnisnya".
- Pesan inti program: parameter valuasi dan kredit (beta, premi risiko, spread, multiple) bukan konstanta; bergeser mengikuti rezim suku bunga dan peringkat. Rantai Modul 10: downgrade, spread naik, kupon refinancing naik, rasio bunga turun, WACC naik, nilai per saham turun.
- Peserta tidak perlu login. Perlu: browser modern dan Microsoft Excel (atau LibreOffice) untuk file .xlsx.
- JANGAN menampilkan: harga, jadwal, nama pengajar, jumlah sesi, testimoni, sertifikat, klaim penempatan kerja atau gaji, logo atau nama lembaga lain.
- Disclaimer footer (semua halaman): "Studi kasus memakai data ICBP per 29 September 2026 untuk tujuan belajar. Parameter kredit ILUSTRATIF; fasilitas kredit dan LBO bersifat HIPOTETIS. Bukan rekomendasi investasi dan tidak berafiliasi dengan ICBP."

## 2. Peta situs (statis, tanpa backend)
```
/index.html            Beranda (pengenalan)
/silabus/index.html    Silabus lengkap, klik modul
/belajar/index.html    Platform belajar (sidebar + penampil modul)
/unduhan/index.html    Pusat unduhan Excel
/modul/                berkas HTML modul (salinan apa adanya)
/unduh/                Excel peserta + zip
/assets/               css, js, gambar, logo, video
/data/kursus.json      kontrak data
```

### Beranda (urutan seksi, salinan teks boleh disesuaikan nadanya, makna tetap)
1. Hero (latar biru penuh, logo putih): judul "Belajar valuation dan credit risk dari satu cerita perusahaan nyata"; subjudul "12 modul, satu studi kasus (ICBP), dengan latihan interaktif dan Excel yang bisa kamu unduh."; tombol utama "Mulai belajar" menuju `/silabus/`; tombol sekunder "Lihat silabus"; di sisi kanan kartu mengambang dari screenshot (aset 01 dan 05).
2. Strip fakta: "12 modul", "9 tugas dengan Excel", "1 studi kasus nyata (ICBP)", "Pemula sampai menengah".
3. Masalah: "Valuation dan credit risk sering diajarkan terpisah. Padahal keduanya memandang perusahaan yang sama dari dua sisi." Diagram dua lingkaran beririsan (SVG buatan sendiri).
4. Tiga pilar belajar (kartu): Materi ringkas; Tugas interaktif dengan nilai otomatis; Excel peserta (sel kuning dan hijau). Pakai aset 01, 04/05, 07.
5. Satu cerita, satu perusahaan: ICBP, utang dolar, peringkat, akuisisi Pinehill (Agustus 2020) sebagai bahan latihan; rantai downgrade sebagai animasi kecil enam kotak.
6. Peta 12 modul (timeline 6 babak berwarna per `kursus.json`), tiap kartu bisa diklik ke detail di silabus.
7. Hasil akhir: "Satu model Excel terintegrasi dan satu presentasi ke committee" (aset 06 dan 09).
8. Untuk siapa (enam kartu sasaran) dan FAQ (accordion): Perlu latar belakang keuangan? Harus berurutan? Perlu software apa? Apakah ada kunci jawaban? (jawab: tugas interaktif menampilkan contoh jawaban setelah kamu mengecek). Apakah data ICBP asli? Apakah ini rekomendasi investasi? (tidak).
9. Video promosi: bila `assets/video/Finansiologi_CVCR_Video_Promosi.mp4` ada, tampilkan pemutar HTML5 dengan subtitle `.srt` (konversi ke .vtt); bila tidak ada, sembunyikan seksi tanpa celah kosong.
10. CTA akhir "Mulai belajar" dan footer (disclaimer, tagline, tautan Silabus, Belajar, Unduhan).

### Silabus (`/silabus/`)
- Judul "Silabus 12 modul". Filter babak (Semua, Fondasi, Valuation, Credit Risk, Jembatan, Karier, Capstone) sebagai tab. Daftar kartu modul (accordion; dapat dibuka semua).
- Kartu modul: nomor besar, judul, badge babak berwarna, ringkasan, "Yang kamu hasilkan" (`hasil_peserta`), catatan (`catatan`, bila ada), level dan estimasi waktu (diekstrak dari pil cover, lihat prompt), dan tombol: tiap bagian materi ("Buka 5A"), "Kerjakan tugas", "Unduh Excel", semuanya menuju `/belajar/#/<id>` atau berkas unduhan. 9B diberi lencana "Lanjutan opsional".
- Tombol melayang "Mulai dari Modul 1" dan "Lanjutkan belajar" (bila ada progres).

### Platform belajar (`/belajar/`)
- Tata letak: bar atas (logo, judul bagian aktif, tombol Sebelumnya/Berikutnya, "Tandai selesai", "Buka di tab baru", "Unduh Excel modul ini" bila ada), sidebar kiri (12 modul, bisa dilipat per modul; tiap bagian: ikon materi, tugas, atau bacaan; status selesai; kolom pencarian judul), area utama berisi `<iframe>` penuh tinggi (di bawah bar atas) memuat berkas dari `/modul/`. Ring progres total di atas sidebar (jumlah bagian selesai dari total, bagian opsional tidak dihitung).
- Rute hash: `/belajar/#/5a`, `#/5t` mengikuti `id` bagian pada `kursus.json`. Tanpa hash, buka bagian terakhir yang dibuka atau Modul 1.
- Sinkron saat tautan navigasi di DALAM modul diklik (modul punya navigasi `modnav` ke bagian lain): pada event `load` iframe, bila same-origin, baca nama berkas dari `contentWindow.location.pathname`, cocokkan ke `id`, perbarui sidebar dan hash. Bila tidak bisa (misalnya dibuka lewat file://), abaikan tanpa error.
- Progres disimpan di `localStorage` (hanya di cangkang situs, bukan di modul), dibungkus try/catch dengan fallback memori; tombol "Reset progres" dengan konfirmasi inline (bukan alert). Jangan menyimpan data pribadi.
- Seluler (lebar kurang dari 900 px): sidebar menjadi laci (drawer) dengan tombol menu; iframe tetap penuh; tidak ada scroll horizontal di cangkang pada 375 px.
- Pintasan keyboard: `[` sebelumnya, `]` berikutnya, `/` fokus pencarian.
- Modul memuat `body { background: transparent }`; beri latar `#F5F7FA` pada iframe dan wadah. JANGAN mengubah isi modul. Tugas interaktif punya bilah progres sticky sendiri; jangan menutupinya (tinggi bar atas cangkang maks 56 px).

### Pusat unduhan (`/unduhan/`)
- Tabel/kartu Excel peserta per modul: nama berkas, modul, deskripsi, ukuran (KB atau MB), tombol "Unduh" (atribut `download`). Tombol "Unduh semua (.zip)" untuk `unduh/Finansiologi_CVCR_Excel_Peserta.zip` (dibuat oleh skrip sinkron).
- Catatan di atas daftar: "Sel kuning adalah input, sel hijau adalah jawabanmu. Perhitungan penuh dikerjakan di Excel, hasil ringkasnya diketik di tugas interaktif. Tugas interaktif menampilkan contoh jawaban setelah kamu mengecek." 
- HANYA Excel peserta (Lembar_Tugas). Berkas Kunci_Jawaban dan deck contoh capstone (.pptx) TIDAK boleh ada di situs.

## 3. Identitas visual
Warna: biru #1E90E6, biru tua #1570C8, biru muda #E8F4FD, navy #1A3A5C, teks #2D2D2D, abu muda #F5F7FA, border #D0DFF0, aksen oranye #F5A623 (jarang), hijau #2E8B57 (selesai), merah #C0392B (hanya peringatan). Font Inter (400, 500, 600, 700, 800) dengan fallback Segoe UI. Kartu membulat 16 px, bayangan tipis, hero biru penuh dengan lingkaran dekoratif transparan (seperti cover modul), logo putih di atas biru (`Logo_Putih.png`, ikon `Logo_Gram_Putih.png` untuk favicon di atas latar biru). Bila logo tidak ada, wordmark teks "finansiologi" Inter 800. Babak: Fondasi #7DB9E8, Valuation #1E90E6, Credit Risk #1A3A5C, Jembatan #F5A623, Karier #8A97A6, Capstone #2E8B57.

## 4. Aturan teks
- Bahasa Indonesia baku yang hidup, "kamu", kalimat pendek, istilah Inggris keuangan tidak diterjemahkan paksa. Tanpa em dash, en dash, atau "--" di teks situs (tanda hubung tunggal boleh). Tanpa "beli" atau "jual" sebagai kata kerja transaksi. Tanpa janji hasil. Tanpa emoji.
- Tombol: "Mulai belajar", "Lihat silabus", "Buka materi", "Kerjakan tugas", "Unduh Excel", "Tandai selesai", "Lanjutkan belajar".

## 5. Daftar aset (folder aset_web/)
01-materi-5a-cover.png, 02-materi-7a-cover.png, 03-materi-10b-cover.png (cover materi); 04-tugas-interaktif-modul5.png; 05-tugas-hasil-nilai.png; 06-diagram-alur-model-terintegrasi.png; 07-excel-peserta-wacc.png; 09-deck-committee-model-excel.jpg. Aman ditampilkan. Boleh dipotong dan diberi bingkai; jangan diedit isinya. Opsional: `Logo_Putih.png`, `Logo_Gram_Putih.png`, dan `Finansiologi_CVCR_Video_Promosi.mp4` plus `.srt` dari folder video-promosi/hasil.
