/* ==========================================================================
   team sea — interações
   Sem dependências. Lê TEAM_SEA_CONFIG (config.js) e TEAM_SEA_PROJECTS /
   TEAM_SEA_CATEGORIES (projects.js) e monta toda a interface.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------- base */
  const CONFIG = window.TEAM_SEA_CONFIG || {};
  const CATEGORIES = window.TEAM_SEA_CATEGORIES || [];
  const PROJECTS = (window.TEAM_SEA_PROJECTS || []).filter((p) => p && p.id);
  const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const mq = (q) => window.matchMedia(q);
  const reduced = mq("(prefers-reduced-motion: reduce)").matches;
  const finePointer = mq("(hover: hover) and (pointer: fine)").matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const autoMotion = !reduced && !saveData;

  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ratioParts = (r) => { const [w, h] = String(r || "16:9").split(":").map(Number); return [w || 16, h || 9]; };
  const ratioCss = (r) => ratioParts(r).join(" / ");
  const ICON = {
    arrow: '<svg class="i" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
    play: '<svg class="i" aria-hidden="true" viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg>',
    ig: '<svg class="i" aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/></svg>',
    mail: '<svg class="i" aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    in: '<svg class="i" aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/></svg>',
    out: '<svg class="i" aria-hidden="true" viewBox="0 0 24 24"><path d="M7 17L17 7M8 7h9v9"/></svg>',
  };

  document.documentElement.classList.add("js");

  /* --------------------------------------------------- texto dividido */
  function splitText(el) {
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = "w";
            const inner = document.createElement("span");
            inner.className = "w__i";
            inner.style.setProperty("--i", i++);
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    walk(el);
  }
  $$("[data-split]").forEach(splitText);

  /* ------------------------------------------------------------ reveal */
  let revealIO = null;
  function observeReveal(root = document) {
    const els = $$("[data-reveal]:not(.is-in), [data-split]:not(.is-in)", root);
    if (reduced || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-in")); return; }
    if (!revealIO) {
      revealIO = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); revealIO.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    }
    els.forEach((e) => revealIO.observe(e));
  }
  // atrasos encadeados dentro da hero
  $$(".hero [data-reveal]").forEach((el, i) => el.style.setProperty("--delay", 0.25 + i * 0.12 + "s"));

  /* ------------------------------------------------------------ loader */
  function runLoader(done) {
    const loader = $(".loader");
    let seen = false;
    try { seen = sessionStorage.getItem("team sea-intro") === "1"; } catch (e) { /* armazenamento indisponível */ }
    const finish = () => {
      document.body.classList.remove("is-loading");
      done();
    };
    if (!loader || reduced || seen) {
      if (loader) loader.classList.add("is-gone");
      finish();
      return;
    }
    try { sessionStorage.setItem("team sea-intro", "1"); } catch (e) { /* ignora */ }
    const tc = $("[data-loader-tc]", loader);
    const bar = $(".loader__bar span", loader);
    const total = 1100;
    const t0 = performance.now();
    requestAnimationFrame(() => { bar.style.width = "100%"; });
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / total);
      const frames = Math.floor(p * 36);
      tc.textContent = `00:00:${String(Math.floor(frames / 24)).padStart(2, "0")}:${String(frames % 24).padStart(2, "0")}`;
      if (p < 1) requestAnimationFrame(tick);
      else {
        loader.classList.add("is-done");
        setTimeout(finish, 350);
        setTimeout(() => loader.classList.add("is-gone"), 1100);
      }
    };
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------- nav e menu */
  const nav = $("[data-nav]");
  const burger = $("[data-burger]");
  const menu = $("[data-menu]");
  const mainEls = () => [$("main"), $(".footer"), $(".nav__links"), $(".nav__logo"), $(".nav__cta")].filter(Boolean);

  function setMenu(open) {
    if (!menu) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    document.body.classList.toggle("is-locked", open);
    mainEls().forEach((el) => { el.inert = open; });
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add("is-open")));
      nav.classList.remove("is-hidden");
      const first = $("a", menu);
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 300);
    } else {
      menu.classList.remove("is-open");
      setTimeout(() => { if (!menu.classList.contains("is-open")) menu.hidden = true; }, reduced ? 0 : 700);
    }
  }
  if (burger) burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  if (menu) menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });

  // link ativo
  const navLinks = $$("[data-link]");
  if ("IntersectionObserver" in window) {
    const map = { inicio: "#inicio", destaques: "#inicio", servicos: "#servicos", projetos: "#projetos", sobre: "#sobre", ferramentas: "#sobre", contato: "#contato" };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const href = map[en.target.id];
        navLinks.forEach((a) => {
          const on = a.getAttribute("href") === href;
          a.classList.toggle("is-active", on);
          if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ----------------------------------------------- rolagem / parallax */
  const filtersEl = $("[data-filters]");
  const stage = $("[data-stage]");
  const parallaxEls = $$("[data-parallax]");
  let lastY = window.scrollY;
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle("is-scrolled", y > 20);
      const menuOpen = menu && menu.classList.contains("is-open");
      if (!menuOpen) {
        if (y > 160 && y > lastY + 4) nav.classList.add("is-hidden");
        else if (y < lastY - 4 || y <= 160) nav.classList.remove("is-hidden");
      }
      document.body.classList.toggle("nav-visible", !nav.classList.contains("is-hidden"));
    }
    if (filtersEl) {
      const top = filtersEl.getBoundingClientRect().top;
      const stickTop = parseFloat(getComputedStyle(filtersEl).top) || 0;
      filtersEl.classList.toggle("is-stuck", top <= stickTop + 1 && y > 200);
    }
    if (!reduced) {
      if (stage && y < window.innerHeight * 1.2) stage.style.transform = `translate3d(0, ${y * 0.08}px, 0)`;
      const vh = window.innerHeight;
      parallaxEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1 aprox.
        const target = el.querySelector("img") || el;
        target.style.transform = `translate3d(0, ${(-p * parseFloat(el.dataset.parallax || 0.08) * r.height).toFixed(1)}px, 0)`;
      });
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* -------------------------------------------------------------- hero */
  function initHero() {
    const vids = $$("[data-hero-video]");
    if (autoMotion) {
      vids.forEach((v) => {
        v.src = v.dataset.heroVideo;
        v.muted = true;
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      });
    }
    // timecode do REC
    const tc = $("[data-timecode]");
    const hero = $(".hero");
    let visible = true;
    if (hero && "IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => {
        visible = en.isIntersecting;
        vids.forEach((v) => { if (!v.src) return; if (visible) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause(); });
      }).observe(hero);
    }
    if (tc && !reduced) {
      const t0 = performance.now();
      let last = 0;
      const tick = (now) => {
        if (visible && now - last > 41) {
          last = now;
          const f = Math.floor(((now - t0) / 1000) * 24);
          const s = Math.floor(f / 24);
          tc.textContent = `00:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}:${String(f % 24).padStart(2, "0")}`;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    // parallax do mouse nas molduras
    if (finePointer && !reduced && hero && stage) {
      const frames = $$(".frame", stage);
      let mx = 0, my = 0, cx = 0, cy = 0, raf = null;
      const loop = () => {
        cx += (mx - cx) * 0.08; cy += (my - cy) * 0.08;
        frames.forEach((f) => {
          const d = parseFloat(f.dataset.depth || 1);
          f.style.transform = `translate3d(${(cx * 18 * d).toFixed(2)}px, ${(cy * 14 * d).toFixed(2)}px, 0) rotate(${(cx * 1.2 * d).toFixed(2)}deg)`;
        });
        raf = Math.abs(mx - cx) + Math.abs(my - cy) > 0.001 ? requestAnimationFrame(loop) : null;
      };
      hero.addEventListener("pointermove", (e) => {
        mx = e.clientX / window.innerWidth - 0.5;
        my = e.clientY / window.innerHeight - 0.5;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      hero.addEventListener("pointerleave", () => { mx = 0; my = 0; if (!raf) raf = requestAnimationFrame(loop); });
    }
  }

  /* ------------------------------------------------------------- cards */
  function cardHTML(p, i) {
    const cat = CAT[p.category] || { label: p.category, short: p.category };
    const [rw, rh] = ratioParts(p.ratio);
    const w = 960, h = Math.round((960 * rh) / rw);
    const pro = p.category === "reels-avancado";
    const isVideo = !!(p.video || p.preview);
    const href = `#/projeto/${encodeURIComponent(p.id)}`;
    return `
      <article class="card${pro ? " card--pro" : ""}" data-ratio="${esc(p.ratio)}" data-id="${esc(p.id)}" style="--ar:${ratioCss(p.ratio)};--i:${i || 0}">
        <a class="card__media" href="${href}" tabindex="-1" aria-hidden="true" data-cursor="${isVideo ? "play" : "view"}">
          <img src="${esc(p.thumbnail)}" alt="" width="${w}" height="${h}" loading="lazy" decoding="async">
          ${p.preview ? `<video muted loop playsinline preload="none" data-src="${esc(p.preview)}"></video>` : ""}
          <span class="card__badges"><span class="pill">${esc(cat.short)}</span>${pro ? '<span class="pill pill--accent">Edição avançada</span>' : ""}</span>
          ${isVideo ? `<span class="card__play">${ICON.play}</span>` : ""}
        </a>
        <div class="card__meta">
          <div class="card__row"><h3 class="card__title">${esc(p.title)}</h3><span class="mono card__year">${esc(p.year)}</span></div>
          <p class="mono card__cat">${esc(cat.label)}</p>
          ${p.description ? `<p class="card__desc">${esc(p.description)}</p>` : ""}
          <a class="card__cta" href="${href}" aria-label="Ver projeto completo: ${esc(p.title)}">Ver projeto ${ICON.arrow}</a>
        </div>
      </article>`;
  }

  /* masonry: cada card ocupa N linhas de 8px conforme a própria altura */
  const ROW = 8;
  const sizeCard = (card) => {
    const h = card.getBoundingClientRect().height;
    if (h) card.style.gridRowEnd = `span ${Math.ceil(h / ROW)}`;
  };
  const masonryRO = "ResizeObserver" in window ? new ResizeObserver((entries) => entries.forEach((e) => sizeCard(e.target))) : null;

  /* prévia de vídeo: hover no desktop, visibilidade no toque */
  const playPreview = (card) => {
    const v = $("video", card);
    if (!v || !autoMotion || document.body.classList.contains("modal-open")) return;
    if (!v.src) v.src = v.dataset.src;
    v.muted = true;
    const p = v.play();
    if (p && p.then) p.then(() => card.classList.add("is-playing")).catch(() => {});
  };
  const stopPreview = (card) => {
    const v = $("video", card);
    card.classList.remove("is-playing");
    if (v && v.src) v.pause();
  };
  const touchIO = !finePointer && autoMotion && "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.intersectionRatio >= 0.7) playPreview(en.target); else stopPreview(en.target);
    }), { threshold: [0, 0.7] })
    : null;

  function wireCards(container) {
    $$(".card:not([data-wired])", container).forEach((card) => {
      card.dataset.wired = "1";
      if (masonryRO) masonryRO.observe(card); else sizeCard(card);
      if ($("video", card)) {
        if (finePointer) {
          card.addEventListener("mouseenter", () => playPreview(card));
          card.addEventListener("mouseleave", () => stopPreview(card));
          card.addEventListener("focusin", () => playPreview(card));
          card.addEventListener("focusout", () => stopPreview(card));
        } else if (touchIO) touchIO.observe(card);
      }
    });
  }
  const pauseAllPreviews = () => $$(".card.is-playing").forEach(stopPreview);

  /* --------------------------------------------------------- destaques */
  function renderFeatured() {
    const el = $("[data-featured]");
    if (!el) return;
    let list = PROJECTS.filter((p) => p.featured);
    if (!list.length) list = PROJECTS.slice(0, 6);
    el.innerHTML = list.map((p, i) => cardHTML(p, i)).join("");
    const firstImg = $("img", el);
    if (firstImg) { firstImg.loading = "eager"; firstImg.setAttribute("fetchpriority", "high"); }
    $$(".card", el).forEach((c) => c.setAttribute("data-reveal", ""));
    wireCards(el);
  }

  /* ---------------------------------------------------------- serviços */
  let setFilter = () => {};
  function renderServices() {
    const el = $("[data-services]");
    if (!el) return;
    el.innerHTML = CATEGORIES.map((c, i) => {
      const n = PROJECTS.filter((p) => p.category === c.key).length;
      return `
        <li class="service${c.highlight ? " service--pro" : ""}" data-reveal>
          <button class="service__btn" type="button" data-cat="${esc(c.key)}" aria-label="${esc(c.label)} — ver ${n} projeto${n === 1 ? "" : "s"}">
            <span class="mono service__num">${String(i + 1).padStart(2, "0")} · ${n}</span>
            <span class="service__name">${esc(c.label)}</span>
            <span class="service__desc">${esc(c.description)}</span>
            <span class="service__arrow">${ICON.arrow}</span>
          </button>
        </li>`;
    }).join("");
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      setFilter(b.dataset.cat, { scroll: true });
    });

    if (!finePointer || reduced) return;
    const pv = document.createElement("div");
    pv.className = "service__preview";
    pv.setAttribute("aria-hidden", "true");
    pv.innerHTML = PROJECTS.length ? `<img src="${esc(PROJECTS[0].thumbnail)}" alt="" decoding="async" loading="lazy">` : "";
    if (!PROJECTS.length) return;
    document.body.appendChild(pv);
    const img = $("img", pv);
    let tx = 0, ty = 0, x = 0, y = 0, raf = null, on = false;
    const loop = () => {
      x += (tx - x) * 0.16; y += (ty - y) * 0.16;
      pv.style.left = x + "px"; pv.style.top = y + "px";
      raf = on || Math.abs(tx - x) > 0.5 ? requestAnimationFrame(loop) : null;
    };
    el.addEventListener("pointermove", (e) => {
      tx = e.clientX + 170; ty = e.clientY;
      if (!raf) { if (!on) { x = tx; y = ty; } raf = requestAnimationFrame(loop); }
    });
    el.addEventListener("pointerover", (e) => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      const p = PROJECTS.find((q) => q.category === b.dataset.cat);
      if (!p) { pv.classList.remove("is-on"); return; }
      if (img.getAttribute("src") !== p.thumbnail) img.src = p.thumbnail;
      on = true; pv.classList.add("is-on");
    });
    el.addEventListener("pointerleave", () => { on = false; pv.classList.remove("is-on"); });
  }

  /* ----------------------------------------------- galeria + filtros */
  const gallery = $("[data-gallery]");
  const moreBtn = $("[data-more]");
  const countEl = $("[data-count]");
  const introEl = $("[data-cat-intro]");
  const PAGE = Math.max(1, parseInt(CONFIG.pageSize, 10) || 8);
  const state = { filter: "all", shown: PAGE };
  const filtered = () => (state.filter === "all" ? PROJECTS : PROJECTS.filter((p) => p.category === state.filter));

  function renderFilters() {
    if (!filtersEl) return;
    const chips = [{ key: "all", label: "Todos os projetos", n: PROJECTS.length }]
      .concat(CATEGORIES.map((c) => ({ key: c.key, label: c.label, n: PROJECTS.filter((p) => p.category === c.key).length, pro: c.highlight })))
      .filter((c) => c.key === "all" || c.n > 0);
    filtersEl.innerHTML = chips.map((c) =>
      `<button class="chip${c.pro ? " chip--pro" : ""}" type="button" data-filter="${esc(c.key)}" aria-pressed="${c.key === state.filter}">${esc(c.label)} <sup>${c.n}</sup></button>`
    ).join("");
    filtersEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-filter]");
      if (b) setFilter(b.dataset.filter);
    });
    filtersEl.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const bs = $$("[data-filter]", filtersEl);
      const i = bs.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      const n = bs[(i + (e.key === "ArrowRight" ? 1 : -1) + bs.length) % bs.length];
      n.focus();
    });
  }

  function renderIntro() {
    if (!introEl) return;
    const c = CAT[state.filter];
    introEl.classList.toggle("is-pro", !!(c && c.highlight));
    introEl.innerHTML = c
      ? `<div><h3>${esc(c.label)}</h3><p>${esc(c.description)}</p></div><ul>${(c.items || []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`
      : `<div><h3>Todos os projetos</h3><p>Vídeo, motion e design em um só lugar. Use os filtros para navegar por categoria; passe o mouse sobre os cards para ver a prévia.</p></div>`;
  }

  function updateMore() {
    const total = filtered().length;
    const shown = Math.min(state.shown, total);
    if (moreBtn) moreBtn.hidden = shown >= total;
    if (countEl) countEl.textContent = total ? `Mostrando ${shown} de ${total} projeto${total === 1 ? "" : "s"}` : "";
  }

  function paintGallery(animate) {
    const list = filtered().slice(0, state.shown);
    gallery.innerHTML = list.length ? list.map((p, i) => cardHTML(p, i)).join("") : '<p class="empty">Nenhum projeto nesta categoria ainda.</p>';
    if (animate && !reduced) $$(".card", gallery).forEach((c) => c.classList.add("is-enter"));
    wireCards(gallery);
    updateMore();
  }

  let filterTimer = null;
  setFilter = function (key, opts = {}) {
    if (!CAT[key]) key = "all";
    $$("[data-filter]", filtersEl).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === key)));
    if (opts.scroll) {
      const sec = document.getElementById("projetos");
      if (sec) sec.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
    if (key === state.filter && !opts.force) return;
    state.filter = key;
    state.shown = PAGE;
    renderIntro();
    pauseAllPreviews();
    clearTimeout(filterTimer);
    const old = $$(".card", gallery);
    if (reduced || !old.length) { paintGallery(false); return; }
    gallery.style.minHeight = gallery.offsetHeight + "px";
    old.forEach((c) => c.classList.add("is-leave"));
    filterTimer = setTimeout(() => {
      paintGallery(true);
      requestAnimationFrame(() => { gallery.style.minHeight = ""; });
    }, 280);
  };

  if (moreBtn) moreBtn.addEventListener("click", () => {
    const list = filtered();
    const from = state.shown;
    state.shown += PAGE;
    const frag = list.slice(from, state.shown).map((p, i) => cardHTML(p, i)).join("");
    gallery.insertAdjacentHTML("beforeend", frag);
    const added = $$(".card", gallery).slice(from);
    if (!reduced) added.forEach((c) => c.classList.add("is-enter"));
    wireCards(gallery);
    updateMore();
    const firstNew = added[0] && $(".card__cta", added[0]);
    if (firstNew) firstNew.focus({ preventScroll: true });
  });

  /* ------------------------------------------------------------- modal */
  const modal = $("[data-modal]");
  const modalContent = $("[data-modal-content]");
  const modalScroll = $("[data-modal-scroll]");
  const modalIndex = $("[data-modal-index]");
  const baseTitle = document.title;
  let navList = PROJECTS;
  let currentId = null;
  let returnFocus = null;
  let pushedByUs = false;

  function videoKind(url) {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    if (yt) return { type: "youtube", id: yt[1] };
    const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return { type: "vimeo", id: vm[1] };
    return { type: "file", src: url };
  }
  const mimeOf = (src) => (/\.webm(\?|$)/i.test(src) ? "video/webm" : /\.mov(\?|$)/i.test(src) ? "video/quicktime" : "video/mp4");

  function playerHTML(p) {
    const cls = { "9:16": " player--v", "1:1": " player--sq", "4:5": " player--45" }[p.ratio] || "";
    const style = `style="--ar:${ratioCss(p.ratio)}"`;
    const k = videoKind(p.video);
    if (!k) {
      return `<div class="player${cls}" ${style}><img src="${esc(p.thumbnail)}" alt="${esc(p.title)} — imagem principal" decoding="async"><button class="player__open" type="button" data-lb-index="0" aria-label="Ampliar imagem principal"></button></div>`;
    }
    if (k.type === "file") {
      return `<div class="player${cls}" ${style}><video controls playsinline preload="metadata" poster="${esc(p.thumbnail)}" aria-label="Vídeo do projeto ${esc(p.title)}"><source src="${esc(k.src)}" type="${mimeOf(k.src)}">Seu navegador não reproduz este vídeo. <a href="${esc(k.src)}">Baixar o vídeo</a>.</video></div>`;
    }
    // YouTube / Vimeo: capa leve; o iframe só carrega após o clique
    return `<div class="player${cls}" ${style} data-embed="${k.type}:${esc(k.id)}">
        <img src="${esc(p.thumbnail)}" alt="" decoding="async">
        <button class="player__open card__play" style="position:absolute;inset:auto;left:50%;top:50%;transform:translate(-50%,-50%);width:76px;height:76px" type="button" data-embed-play aria-label="Reproduzir vídeo de ${esc(p.title)}">${ICON.play}</button>
      </div>`;
  }

  function lightboxList(p) {
    const list = [];
    if (!p.video) list.push(p.thumbnail);
    (p.gallery || []).forEach((g) => { if (g && list.indexOf(g) < 0) list.push(g); });
    return list;
  }

  function projectHTML(p) {
    const cat = CAT[p.category] || { label: p.category };
    const i = navList.findIndex((q) => q.id === p.id);
    const prev = navList[(i - 1 + navList.length) % navList.length];
    const next = navList[(i + 1) % navList.length];
    const lb = lightboxList(p);
    const offset = p.video ? 0 : 1; // a imagem principal ocupa o índice 0 quando não há vídeo
    const tall = ["9:16", "4:5"].includes(p.ratio);
    const gal = (p.gallery || []).filter(Boolean);
    return `
      <header class="project__head">
        <p class="eyebrow"><span class="mono">${esc(cat.label)}</span> · ${esc(p.year)}</p>
        <h2 class="project__title display" id="modal-title">${esc(p.title)}</h2>
        ${p.description ? `<p class="project__lead">${esc(p.description)}</p>` : ""}
      </header>
      <dl class="project__meta">
        <div><dt>Cliente</dt><dd>${esc(p.client || "—")}</dd></div>
        <div><dt>Ano</dt><dd>${esc(p.year)}</dd></div>
        <div><dt>Categoria</dt><dd>${esc(cat.short || cat.label)}</dd></div>
        <div><dt>Formato</dt><dd>${esc(p.ratio)}</dd></div>
      </dl>
      ${playerHTML(p)}
      <div class="project__body">
        ${p.objective ? `<section class="project__block"><h3>Objetivo do projeto</h3><p>${esc(p.objective)}</p></section>` : ""}
        ${p.process ? `<section class="project__block"><h3>Processo criativo</h3><p>${esc(p.process)}</p></section>` : ""}
        ${(p.tools || []).length ? `<section class="project__block"><h3>Ferramentas utilizadas</h3><ul class="tags">${p.tools.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></section>` : ""}
        ${(p.palette || []).length ? `<section class="project__block"><h3>Paleta de cores</h3><div class="swatches">${p.palette.map((c) => `<div class="swatch"><span style="background:${esc(c)}"></span><code>${esc(c)}</code></div>`).join("")}</div></section>` : ""}
        ${(p.typography || []).length ? `<section class="project__block"><h3>Tipografia</h3><ul class="tags">${p.typography.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></section>` : ""}
      </div>
      ${gal.length ? `<section>
        <h3 class="project__gallery-title">${p.category === "branding" ? "Estudo de caso — aplicações da identidade" : p.category === "social" ? "Artes da série" : "Materiais complementares"}</h3>
        <div class="pgallery${tall ? " pgallery--tall" : ""}">
          ${gal.map((g, k) => `<button type="button" data-lb-index="${lb.indexOf(g) >= 0 ? lb.indexOf(g) : k + offset}" style="aspect-ratio:${p.category === "branding" ? "4 / 3" : ratioCss(p.ratio)}" aria-label="Ampliar imagem ${k + 1} de ${gal.length}"><img src="${esc(g)}" alt="${esc(p.title)} — imagem complementar ${k + 1}" loading="lazy" decoding="async"></button>`).join("")}
        </div>
      </section>` : ""}
      ${navList.length > 1 ? `<nav class="pnav" aria-label="Outros projetos">
        <a href="#/projeto/${encodeURIComponent(prev.id)}" data-pnav rel="prev"><small>← Projeto anterior</small><strong>${esc(prev.title)}</strong></a>
        <a href="#/projeto/${encodeURIComponent(next.id)}" data-pnav rel="next"><small>Próximo projeto →</small><strong>${esc(next.title)}</strong></a>
      </nav>` : ""}`;
  }

  function fillModal(p) {
    currentId = p.id;
    const i = navList.findIndex((q) => q.id === p.id);
    modalIndex.textContent = `${String(i + 1).padStart(2, "0")} / ${String(navList.length).padStart(2, "0")} — ${(CAT[p.category] || {}).short || ""}`;
    modalContent.innerHTML = projectHTML(p);
    modalScroll.scrollTop = 0;
    document.title = `${p.title} — team sea`;
  }

  const outside = () => [$("main"), $(".footer"), nav, menu].filter(Boolean);

  function openModal(id) {
    const p = PROJECTS.find((q) => q.id === id);
    if (!p) return false;
    // navegação anterior/próximo respeita o filtro ativo, quando o projeto faz parte dele
    const f = filtered();
    navList = f.some((q) => q.id === id) ? f : PROJECTS;
    if (!modal.hidden && currentId) {
      // troca de projeto com o modal aberto
      modalContent.style.opacity = "0";
      setTimeout(() => { fillModal(p); modalContent.style.opacity = ""; }, reduced ? 0 : 180);
      return true;
    }
    returnFocus = document.activeElement;
    pauseAllPreviews();
    $$(".hero video").forEach((v) => v.pause());
    fillModal(p);
    modal.hidden = false;
    modal.classList.remove("is-leaving");
    if (!reduced) modal.classList.add("is-entering");
    document.body.classList.add("is-locked", "modal-open");
    outside().forEach((el) => { el.inert = true; });
    setTimeout(() => { const c = $("[data-close]", modal); if (c) c.focus({ preventScroll: true }); }, 60);
    setTimeout(() => modal.classList.remove("is-entering"), 900);
    return true;
  }

  function closeModalUI() {
    if (modal.hidden) return;
    $$("video", modal).forEach((v) => v.pause());
    const done = () => {
      modal.hidden = true;
      modal.classList.remove("is-leaving");
      modalContent.innerHTML = "";
      currentId = null;
      document.body.classList.remove("is-locked", "modal-open");
      outside().forEach((el) => { el.inert = false; });
      if (menu) menu.inert = false;
      document.title = baseTitle;
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
      $$(".hero video").forEach((v) => { if (v.src) { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); } });
    };
    if (reduced) done();
    else { modal.classList.add("is-leaving"); setTimeout(done, 580); }
  }

  function closeModal() {
    if (pushedByUs) { pushedByUs = false; history.back(); }
    else { history.replaceState(null, "", location.pathname + location.search + "#projetos"); closeModalUI(); }
  }

  const routeId = () => { const m = location.hash.match(/^#\/projeto\/([^/?#]+)/); return m ? decodeURIComponent(m[1]) : null; };
  function route() {
    const id = routeId();
    if (id) { if (!openModal(id)) history.replaceState(null, "", location.pathname + location.search); }
    else { pushedByUs = false; closeModalUI(); }
  }
  window.addEventListener("popstate", route);
  window.addEventListener("hashchange", () => { if (routeId() || !modal.hidden) route(); });

  // abre projetos a partir de qualquer link #/projeto/...
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#/projeto/"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
    e.preventDefault();
    const href = a.getAttribute("href");
    if (a.hasAttribute("data-pnav") || !modal.hidden) {
      history.replaceState(null, "", href);
    } else {
      history.pushState(null, "", href);
      pushedByUs = true;
      if (!reduced) { const c = $(".curtain"); if (c) { c.classList.remove("is-active"); void c.offsetWidth; c.classList.add("is-active"); } }
    }
    route();
  });

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) { closeModal(); return; }
      const lbBtn = e.target.closest("[data-lb-index]");
      if (lbBtn) {
        const p = PROJECTS.find((q) => q.id === currentId);
        if (p) openLightbox(lightboxList(p), parseInt(lbBtn.dataset.lbIndex, 10) || 0, p.title, lbBtn);
        return;
      }
      const emb = e.target.closest("[data-embed-play]");
      if (emb) {
        const box = emb.closest("[data-embed]");
        const [type, id] = box.dataset.embed.split(":");
        const src = type === "youtube"
          ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
          : `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0`;
        box.innerHTML = `<iframe src="${src}" title="Vídeo do projeto" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>`;
      }
    });
  }

  /* ---------------------------------------------------------- lightbox */
  const lb = $("[data-lightbox]");
  const lbMedia = $("[data-lb-media]");
  const lbCap = $("[data-lb-cap]");
  const lbState = { list: [], i: 0, title: "", back: null };

  function paintLightbox() {
    const src = lbState.list[lbState.i];
    lbMedia.innerHTML = "";
    const img = new Image();
    img.decoding = "async";
    img.alt = `${lbState.title} — imagem ${lbState.i + 1} de ${lbState.list.length}`;
    img.src = src;
    lbMedia.appendChild(img);
    lbCap.textContent = `${lbState.title} · ${String(lbState.i + 1).padStart(2, "0")} / ${String(lbState.list.length).padStart(2, "0")}`;
    const multi = lbState.list.length > 1;
    $("[data-lb-prev]", lb).hidden = !multi;
    $("[data-lb-next]", lb).hidden = !multi;
    if (multi) { const pre = new Image(); pre.src = lbState.list[(lbState.i + 1) % lbState.list.length]; }
  }
  function openLightbox(list, i, title, back) {
    if (!list.length) return;
    Object.assign(lbState, { list, i: Math.max(0, Math.min(i, list.length - 1)), title, back });
    paintLightbox();
    lb.hidden = false;
    if (modal) modal.inert = true;
    setTimeout(() => $("[data-lb-close]", lb).focus({ preventScroll: true }), 30);
  }
  function closeLightbox() {
    lb.hidden = true;
    if (modal) modal.inert = false;
    if (lbState.back && document.contains(lbState.back)) lbState.back.focus({ preventScroll: true });
  }
  const stepLightbox = (d) => { lbState.i = (lbState.i + d + lbState.list.length) % lbState.list.length; paintLightbox(); };
  if (lb) {
    $("[data-lb-close]", lb).addEventListener("click", closeLightbox);
    $("[data-lb-prev]", lb).addEventListener("click", () => stepLightbox(-1));
    $("[data-lb-next]", lb).addEventListener("click", () => stepLightbox(1));
    lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
    let sx = null;
    lb.addEventListener("pointerdown", (e) => { sx = e.clientX; });
    lb.addEventListener("pointerup", (e) => {
      if (sx == null) return;
      const dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 50 && lbState.list.length > 1) stepLightbox(dx < 0 ? 1 : -1);
    });
  }

  /* ------------------------------------------------------------ teclado */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (lb && !lb.hidden) { closeLightbox(); return; }
      if (modal && !modal.hidden) { closeModal(); return; }
      if (menu && menu.classList.contains("is-open")) { setMenu(false); burger.focus(); }
      return;
    }
    const tag = (e.target.tagName || "").toLowerCase();
    if (["input", "textarea", "select", "video", "iframe"].includes(tag)) return;
    if (lb && !lb.hidden && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { stepLightbox(e.key === "ArrowRight" ? 1 : -1); return; }
    if (modal && !modal.hidden && lb.hidden && (e.key === "ArrowRight" || e.key === "ArrowLeft") && navList.length > 1) {
      const i = navList.findIndex((q) => q.id === currentId);
      const n = navList[(i + (e.key === "ArrowRight" ? 1 : -1) + navList.length) % navList.length];
      history.replaceState(null, "", `#/projeto/${encodeURIComponent(n.id)}`);
      route();
    }
  });

  /* --------------------------------------------------------- ferramentas */
  function renderTools() {
    const grid = $("[data-tools]");
    if (grid) {
      grid.innerHTML = (CONFIG.tools || []).map((t) => `
        <li class="tool" data-reveal>
          <span class="tool__mono" aria-hidden="true">${esc(t.abbr || (t.name || "?").slice(0, 2))}</span>
          <span class="tool__name">${esc(t.name)}</span>
          ${t.note ? `<span class="tool__note">${esc(t.note)}</span>` : ""}
        </li>`).join("");
      $$(".tool", grid).forEach((el, i) => el.style.setProperty("--delay", i * 0.06 + "s"));
    }
    const skills = $("[data-skills]");
    if (skills) skills.innerHTML = (CONFIG.skills || []).map((s) => `<li>${esc(s)}</li>`).join("");
  }

  /* ------------------------------------------------------------- contato */
  function renderContact() {
    const c = CONFIG.contact || {};
    const wa = $("[data-whatsapp]");
    const note = $("[data-contact-note]");
    const num = String(c.whatsappNumber || "+5562999937694").replace(/\D/g, "");
    const waUrl = num ? `https://wa.me/${num}?text=${encodeURIComponent(c.whatsappMessage || "62999937694")}` : "";
    if (wa) {
      if (waUrl) { wa.href = waUrl; wa.hidden = false; }
      else if (CONFIG.demoMode) {
        wa.hidden = false;
        wa.removeAttribute("target");
        wa.href = "#contato";
        wa.setAttribute("aria-disabled", "true");
        wa.addEventListener("click", (e) => { e.preventDefault(); if (note) note.focus(); });
      }
    }
    const handle = String(c.instagram || "").replace(/^@/, "").trim();
    const items = [];
    if (handle) items.push({ href: `https://www.instagram.com/${encodeURIComponent(handle)}/`, icon: ICON.ig, k: "Instagram", v: "@" + handle, ext: true });
    if (c.email) items.push({ href: `mailto:${c.email}`, icon: ICON.mail, k: "E-mail", v: c.email });
    if (c.linkedin) items.push({ href: c.linkedin, icon: ICON.in, k: "LinkedIn", v: c.linkedin.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), ext: true });

    $$("[data-social-list]").forEach((list) => {
      if (list.tagName === "UL") {
        list.innerHTML = items.map((it) => `<li><a href="${esc(it.href)}"${it.ext ? ' target="_blank" rel="noopener"' : ""}><span class="ch__icon">${it.icon}</span><span class="ch__label"><small>${esc(it.k)}</small><span>${esc(it.v)}</span></span>${ICON.out}</a></li>`).join("");
        list.hidden = !items.length;
      } else {
        const all = (waUrl ? [{ href: waUrl, k: "WhatsApp", ext: true }] : []).concat(items);
        list.innerHTML = all.map((it) => `<a href="${esc(it.href)}"${it.ext ? ' target="_blank" rel="noopener"' : ""}>${esc(it.k)}</a>`).join("");
      }
    });

    const missing = [];
    if (!num) missing.push("WhatsApp");
    if (!c.email) missing.push("e-mail");
    if (!handle) missing.push("Instagram");
    if (!c.linkedin) missing.push("LinkedIn (opcional)");
    if (note && CONFIG.demoMode && missing.length) {
      note.hidden = false;
      note.tabIndex = -1;
      note.innerHTML = `Modo demonstração: preencha ${esc(missing.join(", "))} em <code>assets/js/config.js</code> para ativar os canais de contato.`;
    }
  }

  function initForm() {
    const form = $("[data-form]");
    if (!form) return;
    const select = $("#f-tipo", form);
    (CONFIG.projectTypes || []).forEach((t) => {
      const o = document.createElement("option");
      o.value = t; o.textContent = t;
      select.appendChild(o);
    });
    const status = $("[data-form-status]", form);
    const submit = $("[data-submit]", form);
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const rules = {
      nome: (v) => (v.trim().length < 2 ? "Informe seu nome." : ""),
      email: (v) => (!v.trim() ? "Informe seu e-mail." : !emailRe.test(v.trim()) ? "Digite um e-mail válido." : ""),
      tipo: (v) => (!v ? "Selecione o tipo de projeto." : ""),
      mensagem: (v) => (v.trim().length < 10 ? "Conte um pouco mais sobre o projeto (mínimo 10 caracteres)." : ""),
    };
    const check = (el) => {
      const rule = rules[el.name];
      if (!rule) return true;
      const msg = rule(el.value);
      const field = el.closest(".field");
      field.classList.toggle("is-invalid", !!msg);
      el.setAttribute("aria-invalid", msg ? "true" : "false");
      $(".field__error", field).textContent = msg;
      return !msg;
    };
    Object.keys(rules).forEach((name) => {
      const el = form.elements[name];
      el.addEventListener("blur", () => { if (el.value || el.dataset.touched) check(el); el.dataset.touched = "1"; });
      el.addEventListener("input", () => { if (el.closest(".field").classList.contains("is-invalid")) check(el); });
      el.addEventListener("change", () => { if (el.dataset.touched) check(el); });
    });

    const cfg = CONFIG.form || {};
    const contact = CONFIG.contact || {};
    const fallbackLinks = () => {
      const out = [];
      const num = String(contact.whatsappNumber || "").replace(/\D/g, "");
      if (num) out.push(`<a href="https://wa.me/${num}?text=${encodeURIComponent(contact.whatsappMessage || "")}" target="_blank" rel="noopener">WhatsApp</a>`);
      if (contact.email) out.push(`<a href="mailto:${esc(contact.email)}">e-mail</a>`);
      return out.length ? ` Você também pode falar pelo ${out.join(" ou ")}.` : "";
    };
    const endpoint = () => {
      if (cfg.provider === "formsubmit") return cfg.formsubmitEmail ? `https://formsubmit.co/ajax/${encodeURIComponent(cfg.formsubmitEmail)}` : "";
      return cfg.endpoint || "";
    };
    const setStatus = (type, html) => { status.className = "form__status" + (type ? " is-" + type : ""); status.innerHTML = html; };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fields = Object.keys(rules).map((n) => form.elements[n]);
      const ok = fields.map(check).every(Boolean);
      if (!ok) { const bad = fields.find((f) => f.getAttribute("aria-invalid") === "true"); if (bad) bad.focus(); setStatus("error", "Revise os campos destacados."); return; }
      if (form.elements._honey.value) return; // robô

      const url = endpoint();
      if (!url) {
        setStatus("error", "O envio pelo formulário ainda não foi configurado, então sua mensagem não foi enviada." + fallbackLinks());
        return;
      }
      const data = {
        name: form.elements.nome.value.trim(),
        email: form.elements.email.value.trim(),
        project_type: form.elements.tipo.value,
        message: form.elements.mensagem.value.trim(),
        _subject: cfg.subject || "Novo contato pelo portfólio",
        _replyto: form.elements.email.value.trim(),
      };
      if (cfg.provider === "formsubmit") { data._template = "table"; data._captcha = "false"; }

      submit.disabled = true;
      submit.classList.add("is-sending");
      $("span", submit).textContent = "Enviando";
      setStatus("", "");
      const ctrl = "AbortController" in window ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), 15000) : null;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
          signal: ctrl ? ctrl.signal : undefined,
        });
        let body = null;
        try { body = await res.json(); } catch (err) { body = null; }
        if (!res.ok) throw new Error((body && (body.message || body.error)) || "HTTP " + res.status);
        if (cfg.provider === "formsubmit" && body && String(body.success) !== "true") throw new Error(body.message || "Falha no envio");
        form.reset();
        $$("[aria-invalid]", form).forEach((el) => el.setAttribute("aria-invalid", "false"));
        Object.keys(rules).forEach((n) => { delete form.elements[n].dataset.touched; });
        setStatus("ok", "Mensagem enviada! Obrigado pelo contato — a resposta chega no seu e-mail em breve.");
      } catch (err) {
        setStatus("error", "Não foi possível enviar agora. Verifique sua conexão e tente novamente." + fallbackLinks());
      } finally {
        if (timer) clearTimeout(timer);
        submit.disabled = false;
        submit.classList.remove("is-sending");
        $("span", submit).textContent = "Enviar mensagem";
      }
    });
  }

  /* -------------------------------------------------------------- cursor */
  function initCursor() {
    if (!CONFIG.customCursor || !finePointer || reduced) return;
    const cur = $(".cursor");
    if (!cur) return;
    document.documentElement.classList.add("has-cursor");
    const dot = $(".cursor__dot", cur), ring = $(".cursor__ring", cur), label = $(".cursor__label", cur);
    let x = -100, y = -100, rx = -100, ry = -100;
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX; y = e.clientY;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }, { passive: true });
    const loop = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    document.addEventListener("pointerover", (e) => {
      const t = e.target;
      const view = t.closest("[data-cursor]");
      const field = t.closest("input, textarea, select, iframe, video");
      cur.classList.toggle("is-hidden", !!field);
      cur.classList.toggle("is-view", !!view && !field);
      label.textContent = view ? (view.dataset.cursor === "play" ? "Play" : "Ver") : "";
      cur.classList.toggle("is-hover", !view && !field && !!t.closest("a, button, [role='button'], label"));
    });
    document.addEventListener("pointerleave", () => cur.classList.add("is-hidden"));
    document.addEventListener("pointerenter", () => cur.classList.remove("is-hidden"));
  }

  /* --------------------------------------------------- botões magnéticos */
  function initMagnetic() {
    if (!finePointer || reduced) return;
    document.addEventListener("pointermove", (e) => {
      const b = e.target.closest && e.target.closest(".magnetic");
      $$(".magnetic.is-mag").forEach((m) => { if (m !== b) { m.style.transform = ""; m.classList.remove("is-mag"); } });
      if (!b) return;
      const r = b.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      b.classList.add("is-mag");
      b.style.transform = `translate(${(dx * 0.22).toFixed(1)}px, ${(dy * 0.32).toFixed(1)}px)`;
    }, { passive: true });
  }

  /* ---------------------------------------------------------------- init */
  renderFeatured();
  renderServices();
  renderFilters();
  renderIntro();
  if (gallery) paintGallery(false);
  renderTools();
  renderContact();
  initForm();
  initCursor();
  initMagnetic();
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  const role = $("[data-role]");
  if (role && CONFIG.role) role.textContent = CONFIG.role;
  const badge = $("[data-demo-badge]");
  if (badge && CONFIG.demoMode) { badge.hidden = false; document.body.classList.add("is-demo"); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => $$(".card").forEach(sizeCard));
  window.addEventListener("load", () => $$(".card").forEach(sizeCard));

  runLoader(() => {
    observeReveal();
    initHero();
    onScroll();
    if (routeId()) route();
  });
})();
