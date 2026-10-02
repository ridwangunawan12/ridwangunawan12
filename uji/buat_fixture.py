#!/usr/bin/env python3
"""Membuat folder sumber TIRUAN untuk uji: modul HTML palsu, Excel palsu, dan umpan terlarang.

Dipakai hanya untuk pengujian ketika berkas modul asli tidak tersedia.
Pemakaian: python uji/buat_fixture.py <folder_tujuan>
"""
import json
import os
import sys
import zipfile
from pathlib import Path

AKAR = Path(__file__).resolve().parent.parent
tujuan = Path(sys.argv[1]).resolve()
tujuan.mkdir(parents=True, exist_ok=True)
kursus = json.loads((AKAR / "kursus.json").read_text(encoding="utf-8"))

PIL = {
    1: ("Pemula", "30 sampai 40 menit"), 2: ("Pemula", "40 sampai 50 menit"), 3: ("Menengah", "60 sampai 75 menit"),
    5: ("Menengah", "60 sampai 75 menit"), 7: ("Menengah", "45 sampai 60 menit"), 10: ("Menengah", "55 sampai 70 menit"),
}

for m in kursus["modul"]:
    for p in m["parts"]:
        nav = " ".join(f'<a href="{q["file"]}">{q["kode"]}</a>' for q in m["parts"])
        lv, es = PIL.get(m["no"], ("", ""))
        pil = ""
        if lv and p["jenis"] != "tugas":
            # Variasi format: Modul 10 memakai "Estimasi" tanpa titik dua, seperti cover 10B.
            sep = "" if m["no"] == 10 else ":"
            pil = f'<span class="pill">Level: {lv}</span><span class="pill">Estimasi{sep} {es}</span>'
        sticky = '<div style="position:sticky;top:0;background:#fff;padding:8px">Progres tugas</div>' if p["jenis"] == "tugas" else ""
        isi = f"""<!doctype html><html lang="id"><head><meta charset="utf-8"><title>{p['judul']}</title>
<style>body{{background:transparent;font-family:sans-serif;margin:0}}.cover{{background:#1E90E6;color:#fff;padding:40px}}.pill{{border:1px solid #fff;border-radius:99px;padding:4px 10px;margin-right:6px}}</style></head>
<body>{sticky}<div class="cover"><h1>{p['judul']}</h1><div>{pil}</div></div><nav class="modnav">{nav}</nav>
<main style="padding:40px;height:1600px"><p>Isi tiruan untuk uji modul {m['no']} bagian {p['kode']}.</p></main></body></html>"""
        (tujuan / p["file"]).write_text(isi, encoding="utf-8")
    for x in m.get("excel_peserta") or []:
        with zipfile.ZipFile(tujuan / x["file"], "w") as z:
            z.writestr("isi.txt", f"Excel tiruan {x['file']}\n" * 200)

# Umpan terlarang: tidak boleh ikut tersalin.
(tujuan / "Finansiologi_Modul5_Kunci_Jawaban_ICBP.xlsx").write_bytes(b"kunci")
(tujuan / "Finansiologi_Modul5_Lembar_Tugas_Kunci_ICBP.xlsx").write_bytes(b"kunci")
(tujuan / "modul-05-kunci-jawaban.html").write_text("kunci", encoding="utf-8")
(tujuan / "modul-05-Kunci.html").write_text("kunci", encoding="utf-8")
(tujuan / "Capstone_Contoh_Deck.pptx").write_bytes(b"pptx")
for sub in ("Claude outputs", "KP", "ihsg_high_yield_era", "sumber-data-icbp"):
    (tujuan / sub).mkdir(exist_ok=True)
    (tujuan / sub / "modul-99-bocor.html").write_text("bocor", encoding="utf-8")

# Video dan subtitle promosi.
hasil = tujuan / "video-promosi" / "hasil"
hasil.mkdir(parents=True, exist_ok=True)
mp4 = hasil / "Finansiologi_CVCR_Video_Promosi.mp4"
if not mp4.exists():
    os.symlink(AKAR / "aset_web" / "video" / "Finansiologi_CVCR_Video_Promosi.mp4", mp4)
(hasil / "Finansiologi_CVCR_Video_Promosi.srt").write_text(
    "1\n00:00:00,000 --> 00:00:03,500\nBayangkan dua analis menilai satu perusahaan yang sama.\n\n"
    "2\n00:00:03,600 --> 00:00:07,000\nKesimpulannya terdengar berbeda.\n", encoding="utf-8")
(hasil / "draft_lama.mov").write_bytes(b"bukan untuk situs")
print(f"Fixture dibuat di {tujuan}")
