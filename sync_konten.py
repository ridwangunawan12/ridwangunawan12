#!/usr/bin/env python3
"""Sinkronkan konten modul ke folder situs.

Membaca whitelist dari folder sumber (default: folder induk), menyalin modul HTML
apa adanya ke site/modul/, Excel peserta ke site/unduh/, membuat zip, menghitung
checksum SHA-256, mengekstrak level dan estimasi dari pil cover, lalu menulis
site/data/kursus.json dan site/data/kursus.js. Aman dijalankan berulang kali.

Pemakaian:
    python sync_konten.py [--sumber ..] [--situs site]
"""
import argparse
import fnmatch
import hashlib
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path

AKAR = Path(__file__).resolve().parent
POLA_HTML = "modul-*.html"
POLA_EXCEL = "Finansiologi_Modul*_Lembar_Tugas_*.xlsx"
POLA_TERLARANG = ("*Kunci*", "*kunci*", "*.pptx")
NAMA_ZIP = "Finansiologi_CVCR_Excel_Peserta.zip"
NAMA_VIDEO = "Finansiologi_CVCR_Video_Promosi"

RE_LEVEL = re.compile(r">\s*Level\s*:?\s*([^<]{2,40}?)\s*<", re.I)
RE_ESTIMASI = re.compile(r">\s*Estimasi\s*:?\s*([^<]{2,60}?)\s*<", re.I)


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for blok in iter(lambda: f.read(1 << 20), b""):
            h.update(blok)
    return h.hexdigest()


def terlarang(nama):
    return any(fnmatch.fnmatch(nama, p) for p in POLA_TERLARANG)


def salin_bila_beda(src, dst):
    """Salin byte demi byte bila isi berbeda. Kembalikan True bila menyalin."""
    if dst.exists() and dst.stat().st_size == src.stat().st_size and sha256(dst) == sha256(src):
        return False
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dst)
    return True


def daftar_whitelist(sumber, pola):
    # Hanya berkas langsung di folder sumber, tidak masuk subfolder.
    hasil = {}
    if not sumber.is_dir():
        return hasil
    for p in sorted(sumber.iterdir()):
        if p.is_file() and fnmatch.fnmatch(p.name, pola) and not terlarang(p.name):
            hasil[p.name] = p
    return hasil


def ekstrak_pil(path):
    # Satu-satunya pembacaan isi modul: regex pil cover di awal berkas.
    teks = path.read_bytes()[:200_000].decode("utf-8", "ignore")
    lv = RE_LEVEL.search(teks)
    es = RE_ESTIMASI.search(teks)
    return (lv.group(1).strip() if lv else ""), (es.group(1).strip() if es else "")


def srt_ke_vtt(srt_teks):
    baris = ["WEBVTT", ""]
    for b in srt_teks.replace("\r\n", "\n").split("\n"):
        if "-->" in b:
            b = b.replace(",", ".")
        baris.append(b)
    return "\n".join(baris).rstrip() + "\n"


def bersihkan_basi(folder, simpan, pola):
    for p in folder.glob(pola):
        if p.name not in simpan:
            p.unlink()
            print(f"  hapus basi: {p.relative_to(folder.parent)}")


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--sumber", default=str(AKAR.parent), help="folder berisi modul-*.html dan Excel peserta")
    ap.add_argument("--situs", default=str(AKAR / "site"), help="folder situs keluaran")
    ap.add_argument("--masukan", default=str(AKAR / "kursus.json"), help="kontrak data kursus.json")
    ap.add_argument("--aset", default=str(AKAR / "aset_web"), help="folder screenshot dan aset")
    args = ap.parse_args()

    sumber, situs = Path(args.sumber).resolve(), Path(args.situs).resolve()
    aset = Path(args.aset).resolve()
    kursus = json.loads(Path(args.masukan).read_text(encoding="utf-8"))

    d_modul, d_unduh = situs / "modul", situs / "unduh"
    d_data, d_img, d_video = situs / "data", situs / "assets" / "img", situs / "assets" / "video"
    for d in (d_modul, d_unduh, d_data, d_img, d_video):
        d.mkdir(parents=True, exist_ok=True)

    html_src = daftar_whitelist(sumber, POLA_HTML)
    excel_src = daftar_whitelist(sumber, POLA_EXCEL)
    checksum = {"modul": {}, "unduh": {}}
    tersalin = 0

    # Modul HTML: hanya yang tercantum di kursus.json dan ada di sumber.
    dipakai_html = set()
    hilang = []
    tanpa_pil = []
    for m in kursus["modul"]:
        m_level, m_estimasi = "", ""
        for part in m["parts"]:
            src = html_src.get(part["file"])
            part["tersedia"] = bool(src)
            part["level"], part["estimasi"] = "", ""
            if not src:
                hilang.append(part["file"])
                continue
            dipakai_html.add(src.name)
            tersalin += salin_bila_beda(src, d_modul / src.name)
            part["bytes"] = src.stat().st_size
            checksum["modul"][src.name] = sha256(src)
            lv, es = ekstrak_pil(src)
            part["level"], part["estimasi"] = lv, es
            if part["jenis"] != "tugas":
                m_level = m_level or lv
                m_estimasi = m_estimasi or es
        m["level"], m["estimasi"] = m_level, m_estimasi
        if any(p["tersedia"] for p in m["parts"]) and not (m_level and m_estimasi):
            tanpa_pil.append(m["no"])

        # Excel peserta.
        for x in m.get("excel_peserta") or []:
            src = excel_src.get(x["file"])
            x["tersedia"] = bool(src)
            if src:
                tersalin += salin_bila_beda(src, d_unduh / src.name)
                x["bytes"] = src.stat().st_size
                checksum["unduh"][src.name] = sha256(src)
            else:
                x["bytes"] = int(x.get("kb", 0)) * 1024
                hilang.append(x["file"])

    # Bersihkan berkas yang tidak lagi ada di sumber, hanya bila sumber berisi modul.
    if html_src:
        bersihkan_basi(d_modul, dipakai_html, "*")
    if excel_src:
        bersihkan_basi(d_unduh, set(checksum["unduh"]) | {NAMA_ZIP}, "*")

    # Zip semua Excel peserta, deterministik (tanggal tetap) supaya idempoten.
    zip_path = d_unduh / NAMA_ZIP
    if checksum["unduh"]:
        tmp = zip_path.with_suffix(".tmp")
        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
            for nama in sorted(checksum["unduh"]):
                info = zipfile.ZipInfo(nama, date_time=(2026, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                z.writestr(info, (d_unduh / nama).read_bytes())
        if zip_path.exists() and sha256(zip_path) == sha256(tmp):
            tmp.unlink()
        else:
            tmp.replace(zip_path)
        checksum["unduh"][NAMA_ZIP] = sha256(zip_path)
        kursus["zip"] = {"file": NAMA_ZIP, "bytes": zip_path.stat().st_size}
    else:
        kursus["zip"] = None

    # Screenshot dan aset gambar.
    if aset.is_dir():
        for p in sorted(aset.iterdir()):
            if p.is_file() and p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp", ".svg") and not terlarang(p.name):
                salin_bila_beda(p, d_img / p.name)

    # Video promosi: hanya .mp4 dan .srt (dikonversi ke .vtt).
    kursus["video"] = None
    for kandidat in (sumber / "video-promosi" / "hasil", aset / "video"):
        mp4 = kandidat / f"{NAMA_VIDEO}.mp4"
        if mp4.is_file():
            salin_bila_beda(mp4, d_video / mp4.name)
            video = {"mp4": f"assets/video/{mp4.name}", "vtt": None}
            srt = kandidat / f"{NAMA_VIDEO}.srt"
            if srt.is_file():
                vtt = srt_ke_vtt(srt.read_text(encoding="utf-8-sig"))
                (d_video / f"{NAMA_VIDEO}.vtt").write_text(vtt, encoding="utf-8")
                video["vtt"] = f"assets/video/{NAMA_VIDEO}.vtt"
            kursus["video"] = video
            break

    kursus.pop("aturan_file", None)
    teks_json = json.dumps(kursus, ensure_ascii=False, indent=1)
    (d_data / "kursus.json").write_text(teks_json + "\n", encoding="utf-8")
    (d_data / "kursus.js").write_text(
        "/* Dibuat oleh sync_konten.py. Jangan diedit manual. */\nwindow.KURSUS = " + teks_json + ";\n",
        encoding="utf-8",
    )
    (d_data / "checksum.json").write_text(json.dumps(checksum, indent=1, sort_keys=True) + "\n", encoding="utf-8")

    # Pengaman terakhir: tidak boleh ada berkas terlarang di pohon situs.
    bocor = [str(p.relative_to(situs)) for p in situs.rglob("*") if p.is_file() and terlarang(p.name)]
    if bocor:
        print("GAGAL: berkas terlarang di situs:", ", ".join(bocor))
        sys.exit(1)

    total = sum(p.stat().st_size for p in situs.rglob("*") if p.is_file())
    n_part = sum(len(m["parts"]) for m in kursus["modul"])
    n_xl = sum(len(m.get("excel_peserta") or []) for m in kursus["modul"])
    print(f"Sumber          : {sumber}")
    print(f"Modul HTML      : {len(checksum['modul'])} dari {n_part} tersedia")
    print(f"Excel peserta   : {len([k for k in checksum['unduh'] if k != NAMA_ZIP])} dari {n_xl} tersedia")
    print(f"Zip             : {'ya' if kursus['zip'] else 'tidak (belum ada Excel)'}")
    print(f"Video           : {kursus['video']['mp4'] if kursus['video'] else 'tidak ada'}"
          f"{' + subtitle' if kursus['video'] and kursus['video']['vtt'] else ''}")
    print(f"Berkas disalin  : {tersalin}")
    print(f"Ukuran situs    : {total / 1048576:.1f} MB")
    print(f"Tanpa level/estimasi: {', '.join(map(str, tanpa_pil)) or 'tidak ada'}")
    if hilang:
        print(f"Belum ada di sumber ({len(hilang)}): " + ", ".join(hilang[:6]) + (" ..." if len(hilang) > 6 else ""))


if __name__ == "__main__":
    main()
