(() => {
  const app = document.getElementById("app");
  let data = null;
  let teardown = null;

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  async function init() {
    try {
      const r = await fetch("comics.json?" + Date.now());
      if (!r.ok) throw new Error(r.status);
      data = await r.json();
    } catch (e) {
      app.innerHTML = `<p class="msg">Gagal memuat <b>comics.json</b>.<br>Kalau lagi tes di komputer, jangan klik dua kali index.html — jalankan <code>python3 -m http.server</code> lalu buka localhost:8000.</p>`;
      return;
    }
    document.title = data.title || "Komik";
    addEventListener("hashchange", route);
    route();
  }

  function route() {
    if (teardown) { teardown(); teardown = null; }
    const m = location.hash.match(/^#\/c\/(\d+)/);
    if (m) renderReader(parseInt(m[1], 10));
    else renderHome();
  }

  /* ---------------- Beranda ---------------- */
  function renderHome() {
    window.scrollTo(0, 0);
    const chs = data.chapters || [];
    if (!chs.length) {
      app.innerHTML = `<p class="msg">Belum ada chapter. Taruh gambar di folder <b>komik/nama-chapter/</b> lalu jalankan build.</p>`;
      return;
    }
    const last = store.get("last", null);
    const done = store.get("done", {});
    const cover = data.cover ? `<img class="cover" src="${esc(data.cover)}" alt="">` : `<div class="cover"></div>`;
    const resume = last && chs[last.ch] ? `<a class="btn primary" href="#/c/${last.ch}">Lanjut baca · ${esc(chs[last.ch].title)}</a>` : "";
    const first = `<a class="btn ${resume ? "" : "primary"}" href="#/c/0">Mulai dari awal</a>`;
    const newest = chs.length > 1 ? `<a class="btn" href="#/c/${chs.length - 1}">Chapter terbaru</a>` : "";
    const items = chs
      .map((c, i) => ({ c, i }))
      .reverse()
      .map(({ c, i }) => `<li class="${done[i] ? "read" : ""}"><a href="#/c/${i}"><span>${esc(c.title)}</span><small>${c.pages.length} hal</small></a></li>`)
      .join("");
    app.innerHTML = `
      <main class="home">
        <section class="hero">
          ${cover}
          <div>
            <h1>${esc(data.title || "Komik")}</h1>
            ${data.description ? `<p>${esc(data.description)}</p>` : ""}
            <div class="btns">${resume}${first}${newest}</div>
          </div>
        </section>
        <h2>Daftar chapter</h2>
        <ul class="chlist">${items}</ul>
      </main>`;
  }

  /* ---------------- Reader ---------------- */
  function renderReader(i) {
    const chs = data.chapters || [];
    const ch = chs[i];
    if (!ch) { location.hash = "#/"; return; }
    document.title = `${ch.title} · ${data.title || "Komik"}`;

    let mode = store.get("mode", "swipe");
    const total = ch.pages.length;
    const hasNext = i < chs.length - 1;
    const options = chs.map((c, k) => `<option value="${k}" ${k === i ? "selected" : ""}>${esc(c.title)}</option>`).join("");
    const nextBtn = hasNext
      ? `<a class="btn primary" href="#/c/${i + 1}">Lanjut: ${esc(chs[i + 1].title)} →</a>`
      : `<span>Chapter terakhir. Tunggu update berikutnya ya!</span>`;
    const end = `<div class="slide endslide"><h3>Tamat chapter ini</h3>${nextBtn}<a class="btn" href="#/">Daftar chapter</a></div>`;

    const imgs = ch.pages.map((src, k) => `<img src="${esc(src)}" alt="Halaman ${k + 1}" ${k < 2 ? "" : 'loading="lazy"'} draggable="false">`);

    app.innerHTML = `
      <div class="reader" id="reader">
        <div class="topbar">
          <a class="back" href="#/" aria-label="Kembali">←</a>
          <select id="chsel" aria-label="Pilih chapter">${options}</select>
          <button class="mode" id="modebtn">${mode === "swipe" ? "Mode: Swipe" : "Mode: Scroll"}</button>
        </div>
        ${mode === "swipe"
          ? `<div class="pager" id="pager">${imgs.map((t) => `<div class="slide">${t}</div>`).join("")}${end}</div>`
          : `<div class="scroller" id="scroller"><div class="strip">${imgs.join("")}${end}</div></div>`}
        <div class="bottombar"><span id="counter">1 / ${total}</span></div>
      </div>`;

    const reader = document.getElementById("reader");
    const counter = document.getElementById("counter");
    document.getElementById("chsel").addEventListener("change", (e) => { location.hash = "#/c/" + e.target.value; });
    document.getElementById("modebtn").addEventListener("click", () => {
      store.set("mode", mode === "swipe" ? "scroll" : "swipe");
      route();
    });

    const markProgress = (page) => {
      counter.textContent = `${Math.min(page + 1, total)} / ${total}`;
      store.set("last", { ch: i, page });
      if (page >= total - 1) { const d = store.get("done", {}); d[i] = 1; store.set("done", d); }
    };

    if (mode === "swipe") {
      const pager = document.getElementById("pager");
      const slideCount = total + 1;
      const cur = () => Math.round(pager.scrollLeft / pager.clientWidth);
      const go = (n, smooth = true) => {
        n = Math.max(0, Math.min(slideCount - 1, n));
        pager.scrollTo({ left: n * pager.clientWidth, behavior: smooth ? "smooth" : "auto" });
      };
      let raf = 0;
      pager.addEventListener("scroll", () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => markProgress(cur()));
      }, { passive: true });

      pager.addEventListener("click", (e) => {
        if (e.target.closest("a,button,select")) return;
        const x = e.clientX / innerWidth;
        if (x < 0.3) go(cur() - 1);
        else if (x > 0.7) go(cur() + 1);
        else reader.classList.toggle("hide-ui");
      });

      const onKey = (e) => {
        if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(cur() + 1); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); go(cur() - 1); }
      };
      addEventListener("keydown", onKey);
      const onResize = () => go(cur(), false);
      addEventListener("resize", onResize);
      teardown = () => { removeEventListener("keydown", onKey); removeEventListener("resize", onResize); };

      const last = store.get("last", null);
      const start = last && last.ch === i && last.page < total - 1 ? last.page : 0;
      requestAnimationFrame(() => { go(start, false); markProgress(start); });
    } else {
      const scroller = document.getElementById("scroller");
      const pics = [...scroller.querySelectorAll(".strip img")];
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) markProgress(pics.indexOf(en.target)); });
      }, { root: scroller, threshold: 0.5 });
      pics.forEach((p) => io.observe(p));
      let lastY = 0;
      scroller.addEventListener("scroll", () => {
        const y = scroller.scrollTop;
        reader.classList.toggle("hide-ui", y > lastY && y > 80);
        lastY = y;
      }, { passive: true });
      teardown = () => io.disconnect();
      markProgress(0);
    }
  }

  init();
})();
