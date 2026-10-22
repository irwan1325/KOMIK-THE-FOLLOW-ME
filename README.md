# Website Komik (swipe)

Web baca komik: **swipe kiri-kanan** (kayak slide) atau **scroll ke bawah** (kayak webtoon), tinggal ganti lewat tombol di atas. Progress baca tersimpan otomatis di HP pembaca.

## Struktur folder

```
index.html, style.css, app.js   <- tampilan (nggak perlu diubah)
build.py                        <- bikin daftar chapter otomatis
comics.json                     <- hasil build.py (jangan diedit manual)
komik/
  info.json                     <- judul + sinopsis
  cover.jpg                     <- (opsional) cover
  chapter-01/  001.jpg 002.jpg ...
  chapter-02/  ...
```

Nama folder = judul chapter ("chapter-01" jadi "Chapter 01"). Nama file gambar diurutkan angka (001, 002, ... atau 1, 2, ... 10, sama-sama aman).

## Cara online-in (gratis, sekali setup)

1. Bikin akun di github.com, buat repository baru (misal `komik-gue`, Public).
2. Upload semua isi folder ini (drag & drop di halaman repo -> *Add file -> Upload files*). Pastikan folder `.github` ikut ke-upload; kalau nggak ikut, bikin file `.github/workflows/build.yml` lewat *Add file -> Create new file* dan copy isinya.
3. Buka *Settings -> Pages*, pilih *Deploy from a branch*, branch `main`, folder `/ (root)`, Save.
4. Tunggu 1-2 menit, webnya aktif di `https://username.github.io/komik-gue/`.

## Cara upload chapter baru

1. Buka repo -> *Add file -> Upload files*.
2. Drag gambar chapter baru. Biar masuk folder yang benar, tulis nama folder di nama file saat upload, atau buka dulu folder `komik/` lalu buat folder baru dengan *Create new file* dan ketik `chapter-03/namafile.txt`, setelah itu upload gambarnya ke folder tsb.
3. Commit. GitHub Action otomatis memperbarui `comics.json` (±30 detik), dan chapter baru muncul di web.

Alternatif tanpa GitHub: **Cloudflare Pages** atau **Netlify**, isi *Build command* dengan `python3 build.py`. Tiap upload, daftar chapter ikut ter-update.

## Tes di komputer

```
python3 build.py
python3 -m http.server
```
lalu buka http://localhost:8000

## Tips

- Lebar gambar ideal 800-1200 px, format JPG/WEBP biar loading cepat.
- Batas GitHub: 100 MB per file dan sekitar 1 GB per repo. Kalau komiknya sudah banyak banget, pindah ke Cloudflare R2 atau sejenisnya.
- Kontrol swipe: tap sisi kiri/kanan layar atau tombol panah keyboard untuk ganti halaman, tap tengah untuk sembunyikan menu.
