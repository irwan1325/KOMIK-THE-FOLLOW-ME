#!/usr/bin/env python3
"""Scan folder komik/ lalu bikin comics.json otomatis.

Struktur:
  komik/
    info.json            (opsional: {"title": "...", "description": "..."})
    cover.jpg            (opsional: kalau tidak ada, pakai halaman pertama chapter 1)
    chapter-01/  001.jpg 002.jpg ...
    chapter-02/  ...

Urutan chapter & halaman memakai urutan angka alami (2 sebelum 10).
"""
import json
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
KOMIK = ROOT / "komik"
EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}


def natural(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]


def url(path):
    return "/".join(quote(p) for p in path.relative_to(ROOT).parts)


def pretty(name):
    return re.sub(r"[-_]+", " ", name).strip().title()


def main():
    KOMIK.mkdir(exist_ok=True)
    info = {}
    info_file = KOMIK / "info.json"
    if info_file.exists():
        info = json.loads(info_file.read_text(encoding="utf-8"))

    chapters = []
    for d in sorted((p for p in KOMIK.iterdir() if p.is_dir()), key=lambda p: natural(p.name)):
        pages = sorted((f for f in d.iterdir() if f.suffix.lower() in EXT), key=lambda f: natural(f.name))
        if pages:
            chapters.append({"title": pretty(d.name), "pages": [url(f) for f in pages]})

    cover = None
    for f in sorted(KOMIK.iterdir()):
        if f.is_file() and f.stem.lower() == "cover" and f.suffix.lower() in EXT:
            cover = url(f)
            break
    if not cover and chapters:
        cover = chapters[0]["pages"][0]

    out = {
        "title": info.get("title", "Komik Gue"),
        "description": info.get("description", ""),
        "cover": cover,
        "chapters": chapters,
    }
    (ROOT / "comics.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK: {len(chapters)} chapter, {sum(len(c['pages']) for c in chapters)} halaman -> comics.json")


if __name__ == "__main__":
    main()
