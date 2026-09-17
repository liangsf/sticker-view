/* 贴纸铺 - 表情包预览站 */
(() => {
  const app = document.getElementById("app");
  const searchInput = document.getElementById("searchInput");
  const lightbox = document.getElementById("lightbox");
  const lightboxMedia = document.getElementById("lightboxMedia");
  const lightboxLabel = document.getElementById("lightboxLabel");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxScene = document.getElementById("lightboxScene");
  const lightboxDownloads = document.getElementById("lightboxDownloads");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");
  const toast = document.getElementById("toast");

  let DATA = null;
  let currentList = [];   // 当前灯箱可切换的贴纸列表
  let currentIndex = -1;

  /* ---------- 工具 ---------- */
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const downloadName = (pack, sticker, ext) =>
    `${pack.name}-${sticker.label}.${ext}`;

  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => (toast.hidden = true), 1800);
  }

  function triggerDownload(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast(`已开始下载：${filename}`);
  }

  /* ---------- 路由 ---------- */
  function route() {
    const hash = location.hash || "#/";
    closeLightbox();
    if (hash.startsWith("#/pack/")) {
      const id = decodeURIComponent(hash.replace("#/pack/", ""));
      renderPack(id);
    } else {
      renderHome();
    }
  }

  /* ---------- 首页 ---------- */
  function renderHome() {
    const packs = DATA.packs;
    const total = packs.reduce((n, p) => n + p.count, 0);
    document.getElementById("statPacks").textContent = packs.length;
    document.getElementById("statStickers").textContent = total;

    const cards = packs
      .map((p) => {
        const badge = p.animated
          ? `<span class="pack-badge">✦ 动图</span>`
          : `<span class="pack-badge static">静态</span>`;
        const theme = p.theme
          ? `<span class="theme">${esc(p.theme)}</span>` : "";
        return `
        <a class="pack-card" href="#/pack/${encodeURIComponent(p.id)}">
          <div class="pack-cover">
            <img src="${esc(p.cover)}" alt="${esc(p.name)}" loading="lazy" />
            ${badge}
            <span class="pack-count">${p.count} 张</span>
          </div>
          <div class="pack-meta">
            <span class="name">${esc(p.name)}</span>
            ${theme}
            <span class="go">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </span>
          </div>
        </a>`;
      })
      .join("");

    app.innerHTML = `
      <section class="hero">
        <span class="hero-eyebrow">✦ 本地资源 · 即开即看</span>
        <h1>贴纸铺</h1>
        <p>精选 ${packs.length} 套表情包，共 ${total} 张贴纸。<br />动图自动播放，点击可放大查看并一键下载。</p>
      </section>
      <div class="section-title">
        <h2>全部表情包</h2>
        <span>${packs.filter((p) => p.animated).length} 套动图 · ${packs.filter((p) => !p.animated).length} 套静态</span>
      </div>
      <div class="pack-grid">${cards}</div>
    `;
  }

  /* ---------- 详情页 ---------- */
  function renderPack(id) {
    const pack = DATA.packs.find((p) => p.id === id);
    if (!pack) {
      app.innerHTML = `
        <div class="empty">
          <span class="emoji">🫥</span>
          <p>没有找到这套表情包</p>
          <p style="margin-top:14px"><a class="back-btn" href="#/">← 返回首页</a></p>
        </div>`;
      return;
    }

    const banner = pack.banner
      ? `<div class="detail-banner"><img src="${esc(pack.banner)}" alt="${esc(pack.name)}" /></div>` : "";

    const zipBtn = pack.zip
      ? `<button class="btn btn-primary" id="zipBtn">
           <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
           下载整套 ZIP
         </button>` : "";

    const avatar = pack.cover
      ? `<img class="avatar" src="${esc(pack.cover)}" alt="${esc(pack.name)}" />` : "";

    const cards = pack.stickers
      .map((s, i) => {
        const src = s.gif || s.png;
        return `
        <div class="sticker-card" data-index="${i}">
          <div class="sticker-thumb">
            <img src="${esc(src)}" alt="${esc(s.label)}" loading="lazy" />
          </div>
          <div class="sticker-name">${esc(s.label)}</div>
          ${s.caption ? `<div class="sticker-caption">${esc(s.caption)}</div>` : ""}
        </div>`;
      })
      .join("");

    app.innerHTML = `
      <div class="detail-top">
        <a class="back-btn" href="#/">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          返回首页
        </a>
      </div>
      ${banner}
      <div class="detail-head">
        ${avatar}
        <div class="info">
          <h1>${esc(pack.name)}</h1>
          <div class="sub">
            <span>${pack.count} 张贴纸</span>
            <span class="dot">·</span>
            <span>${pack.animated ? "含动图 / 视频" : "静态表情"}</span>
            ${pack.theme ? `<span class="dot">·</span><span>${esc(pack.theme)}</span>` : ""}
          </div>
        </div>
        ${zipBtn}
      </div>
      <div class="sticker-grid" id="stickerGrid">${cards}</div>
    `;

    if (pack.zip) {
      document.getElementById("zipBtn").addEventListener("click", () => {
        const name = decodeURIComponent(pack.zip.split("/").pop());
        triggerDownload(pack.zip, name);
      });
    }

    currentList = pack.stickers;
    document.getElementById("stickerGrid").addEventListener("click", (e) => {
      const card = e.target.closest(".sticker-card");
      if (!card) return;
      openLightbox(Number(card.dataset.index));
    });
  }

  /* ---------- 搜索 ---------- */
  function renderSearch(keyword) {
    const kw = keyword.trim().toLowerCase();
    if (!kw) {
      route();
      return;
    }
    const results = [];
    for (const pack of DATA.packs) {
      for (const s of pack.stickers) {
        const hay = [s.label, s.caption, s.scene, pack.name].join(" ").toLowerCase();
        if (hay.includes(kw)) results.push({ pack, sticker: s });
      }
    }

    const cards = results
      .map(({ pack, sticker }, i) => {
        const src = sticker.gif || sticker.png;
        return `
        <div class="sticker-card" data-index="${i}" title="${esc(pack.name)}">
          <div class="sticker-thumb"><img src="${esc(src)}" alt="${esc(sticker.label)}" loading="lazy" /></div>
          <div class="sticker-name">${esc(sticker.label)}</div>
          <div class="sticker-caption">${esc(pack.name)}</div>
        </div>`;
      })
      .join("");

    app.innerHTML = results.length
      ? `
        <p class="search-tip">找到 <b>${results.length}</b> 个与「${esc(keyword)}」相关的表情：</p>
        <div class="sticker-grid" id="stickerGrid">${cards}</div>`
      : `
        <div class="empty">
          <span class="emoji">🔍</span>
          <p>没有找到与「${esc(keyword)}」相关的表情</p>
          <p style="margin-top:14px"><a class="back-btn" href="#/">← 查看全部表情包</a></p>
        </div>`;

    currentList = results.map((r) => ({ ...r.sticker, _pack: r.pack }));
    const grid = document.getElementById("stickerGrid");
    if (grid) {
      grid.addEventListener("click", (e) => {
        const card = e.target.closest(".sticker-card");
        if (!card) return;
        openLightbox(Number(card.dataset.index));
      });
    }
  }

  /* ---------- 灯箱 ---------- */
  function openLightbox(index) {
    if (index < 0 || index >= currentList.length) return;
    currentIndex = index;
    const item = currentList[index];
    const pack = item._pack || DATA.packs.find((p) => p.stickers.includes(item));
    const s = item;

    // 视频优先，其次 gif，最后 png
    let media;
    if (s.mp4) {
      media = `<video src="${esc(s.mp4)}" autoplay loop muted playsinline></video>`;
    } else if (s.gif) {
      media = `<img src="${esc(s.gif)}" alt="${esc(s.label)}" />`;
    } else {
      media = `<img src="${esc(s.png)}" alt="${esc(s.label)}" />`;
    }
    lightboxMedia.innerHTML = media;
    lightboxLabel.textContent = s.label;
    lightboxCaption.textContent = s.caption
      ? `「${s.caption}」`
      : pack ? `来自《${pack.name}》` : "";
    lightboxScene.textContent = s.scene || "";

    const dl = [];
    if (s.png) dl.push(["PNG", s.png, "png"]);
    if (s.gif) dl.push(["GIF", s.gif, "gif"]);
    if (s.mp4) dl.push(["MP4", s.mp4, "mp4"]);
    lightboxDownloads.innerHTML = "";
    for (const [text, url, ext] of dl) {
      const btn = document.createElement("button");
      btn.className = "btn btn-ghost";
      btn.textContent = `下载 ${text}`;
      btn.addEventListener("click", () =>
        triggerDownload(url, downloadName(pack || { name: "sticker" }, s, ext)));
      lightboxDownloads.appendChild(btn);
    }

    lightboxPrev.hidden = index <= 0;
    lightboxNext.hidden = index >= currentList.length - 1;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxMedia.innerHTML = "";
    document.body.style.overflow = "";
    currentIndex = -1;
  }

  function stepLightbox(delta) {
    const next = currentIndex + delta;
    if (next >= 0 && next < currentList.length) openLightbox(next);
  }

  /* ---------- 事件 ---------- */
  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", () => stepLightbox(-1));
  lightboxNext.addEventListener("click", () => stepLightbox(1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  let searchTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    const kw = searchInput.value;
    searchTimer = setTimeout(() => {
      history.replaceState(null, "", kw.trim() ? "#/search" : location.hash || "#/");
      renderSearch(kw);
    }, 200);
  });
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      renderSearch("");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") stepLightbox(-1);
    else if (e.key === "ArrowRight") stepLightbox(1);
  });

  window.addEventListener("hashchange", () => {
    if (!location.hash.startsWith("#/search")) {
      searchInput.value = "";
      route();
    }
  });

  /* ---------- 启动 ---------- */
  fetch("data.json")
    .then((r) => r.json())
    .then((data) => {
      DATA = data;
      route();
    })
    .catch(() => {
      app.innerHTML = `
        <div class="empty">
          <span class="emoji">😵</span>
          <p>数据加载失败，请先运行 <code>node build.mjs</code> 生成 data.json</p>
        </div>`;
    });
})();
