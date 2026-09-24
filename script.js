(function () {
  const IMG_SRC = "assets/mitchelle.jpg";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COLORS = ["#2E56C7", "#E9B949", "#3FA36B", "#F4F6FB", "#5B7FE0"];

  /* A jigsaw piece outline. edges = [top, right, bottom, left]; 1 = tab, -1 = hole, 0 = flat. */
  function piecePath(s, edges) {
    const p = new Path2D();
    const c = [[0, 0], [s, 0], [s, s], [0, s]];
    const n = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    p.moveTo(0, 0);
    for (let i = 0; i < 4; i++) {
      const [ax, ay] = c[i], [bx, by] = c[(i + 1) % 4], [nx, ny] = n[i], t = edges[i];
      if (!t) { p.lineTo(bx, by); continue; }
      const P = (u, v) => [ax + (bx - ax) * u + nx * v * s * t, ay + (by - ay) * u + ny * v * s * t];
      p.lineTo(...P(0.36, 0));
      p.bezierCurveTo(...P(0.42, 0), ...P(0.30, 0.22), ...P(0.50, 0.22));
      p.bezierCurveTo(...P(0.70, 0.22), ...P(0.58, 0), ...P(0.64, 0));
      p.lineTo(bx, by);
    }
    p.closePath();
    return p;
  }
  /* A four-point sparkle, drawn in a box of size s. */
  function starPath(s) {
    const p = new Path2D(), c = s / 2, k = s * 0.12;
    p.moveTo(c, 0);
    p.quadraticCurveTo(c + k, c - k, s, c);
    p.quadraticCurveTo(c + k, c + k, c, s);
    p.quadraticCurveTo(c - k, c + k, 0, c);
    p.quadraticCurveTo(c - k, c - k, c, 0);
    p.closePath();
    return p;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const sign = () => (Math.random() < 0.5 ? -1 : 1);

  /* ---------- puzzle-piece burst ---------- */
  const fx = document.getElementById("fx");
  const fctx = fx.getContext("2d");
  let parts = [], fxRunning = false;
  function sizeFx() {
    const d = window.devicePixelRatio || 1;
    fx.width = innerWidth * d; fx.height = innerHeight * d;
    fctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function burst(x, y, count) {
    for (let i = 0; i < count; i++) {
      const star = Math.random() < 0.35;
      const s = star ? rnd(8, 18) : rnd(10, 22), a = rnd(-Math.PI * 0.95, -Math.PI * 0.05), v = rnd(6, 15);
      parts.push({
        x, y, s, star, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2,
        r: rnd(0, 6.28), vr: rnd(-0.2, 0.2), life: 0, max: rnd(110, 170),
        color: star ? pick(["#F6D27A", "#FFFFFF", "#E9B949"]) : pick(COLORS),
        path: star ? starPath(s) : piecePath(s, [sign(), sign(), sign(), sign()])
      });
    }
    if (!fxRunning) { fxRunning = true; requestAnimationFrame(tickFx); }
  }
  function tickFx() {
    fctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => p.life < p.max && p.y < innerHeight + 60);
    for (const p of parts) {
      p.life++; p.vy += p.star ? 0.16 : 0.28; p.vx *= p.star ? 0.97 : 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      fctx.save();
      fctx.globalAlpha = Math.min(1, (p.max - p.life) / 30) * (p.star ? 0.6 + 0.4 * Math.sin(p.life * 0.4) : 1);
      fctx.translate(p.x, p.y); fctx.rotate(p.r); fctx.translate(-p.s / 2, -p.s / 2);
      fctx.fillStyle = p.color; fctx.fill(p.path);
      fctx.restore();
    }
    if (parts.length) requestAnimationFrame(tickFx);
    else { fxRunning = false; fctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  sizeFx();
  addEventListener("resize", () => { sizeFx(); if (puzzleReady) drawPuzzle(performance.now()); });

  /* ---------- opening the present ---------- */
  const stage = document.getElementById("stage");
  const gift = document.getElementById("gift");
  const card = document.getElementById("card");
  const footer = document.getElementById("footer");
  const scene = document.getElementById("scene");
  let opened = false;

  /* ---------- twinkling sparkles around the wrapped present ---------- */
  const sp = document.getElementById("sparkles");
  const sctx = sp.getContext("2d");
  let twinkles = [], sparkRunning = false, sw = 0, sh = 0;
  function sizeSparkles() {
    const d = window.devicePixelRatio || 1;
    sw = sp.clientWidth; sh = sp.clientHeight;
    sp.width = sw * d; sp.height = sh * d;
    sctx.setTransform(d, 0, 0, d, 0, 0);
    const count = Math.round(Math.min(60, (sw * sh) / 9000));
    twinkles = Array.from({ length: count }, () => newTwinkle(true));
  }
  function newTwinkle(anywhere) {
    const s = rnd(4, 11);
    return {
      x: rnd(0, sw), y: anywhere ? rnd(0, sh) : sh + 10, s,
      vy: rnd(0.12, 0.45), phase: rnd(0, 6.28), speed: rnd(0.02, 0.05),
      color: Math.random() < 0.7 ? "#F6D27A" : "#FFFFFF", path: starPath(s)
    };
  }
  function tickSparkles() {
    if (stage.hidden) { sparkRunning = false; return; }
    sctx.clearRect(0, 0, sw, sh);
    for (let i = 0; i < twinkles.length; i++) {
      const t = twinkles[i];
      t.y -= t.vy; t.phase += t.speed;
      if (t.y < -12) twinkles[i] = newTwinkle(false);
      const a = Math.max(0, Math.sin(t.phase));
      sctx.save();
      sctx.globalAlpha = a * 0.85;
      sctx.translate(t.x - t.s / 2, t.y - t.s / 2);
      sctx.fillStyle = t.color;
      sctx.fill(t.path);
      sctx.restore();
    }
    requestAnimationFrame(tickSparkles);
  }
  function startSparkles() {
    if (reduce || sparkRunning) return;
    sizeSparkles();
    sparkRunning = true;
    requestAnimationFrame(tickSparkles);
  }
  startSparkles();
  addEventListener("resize", () => { if (!stage.hidden && !reduce) sizeSparkles(); });

  function openGift() {
    if (opened) return;
    opened = true;
    stage.classList.add("leaving");
    const reveal = () => {
      stage.hidden = true;
      card.hidden = false;
      footer.hidden = false;
      scrollTo({ top: 0 });
      if (!reduce) {
        card.classList.remove("entering");
        void card.offsetWidth;
        card.classList.add("entering");
        burst(innerWidth * 0.2, innerHeight * 0.95, 40);
        burst(innerWidth * 0.8, innerHeight * 0.95, 40);
      }
      watchPuzzle();
    };
    if (reduce) { reveal(); return; }
    gift.classList.add("shaking");
    setTimeout(() => {
      gift.classList.remove("shaking");
      gift.classList.add("opening");
      scene.classList.add("opening");
      const b = gift.getBoundingClientRect();
      const cx = b.left + b.width / 2, cy = b.top + b.height * 0.3;
      setTimeout(() => burst(cx, cy, 100), 120);
      setTimeout(() => burst(cx, cy, 60), 380);
    }, 600);
    setTimeout(reveal, 1900);
  }
  gift.addEventListener("click", openGift);

  /* ---------- flipping between the card and the wins page ---------- */
  const pageEls = [document.getElementById("page1"), document.getElementById("page2")];
  function showPage(n, animate) {
    pageEls.forEach((el, i) => {
      el.hidden = i !== n - 1;
      el.classList.remove("turning");
    });
    const cur = pageEls[n - 1];
    if (animate && !reduce) { void cur.offsetWidth; cur.classList.add("turning"); }
    document.querySelectorAll(".page-tab").forEach(t => t.setAttribute("aria-pressed", String(t.dataset.page === String(n))));
    if (animate) card.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    if (n === 1 && puzzleReady && animStart) drawPuzzle(performance.now());
  }
  document.querySelectorAll(".page-tab, .turn-btn").forEach(b =>
    b.addEventListener("click", () => showPage(Number(b.dataset.page), true)));

  document.getElementById("rewrap").addEventListener("click", () => {
    showPage(1, false);
    opened = false;
    card.hidden = true;
    footer.hidden = true;
    stage.hidden = false;
    stage.classList.remove("leaving");
    gift.classList.remove("opening", "shaking");
    scene.classList.remove("opening");
    card.classList.remove("entering");
    startSparkles();
    scrollTo({ top: 0 });
    gift.focus();
  });

  /* ---------- the photo jigsaw ---------- */
  const N = 3;
  const cv = document.getElementById("puzzle");
  const ctx = cv.getContext("2d");
  const img = new Image();
  let pieces = [], puzzleReady = false, animStart = 0, W = 0, s = 0, pad = 0;
  // square crop of the 1000x667 photo, centred on her face
  const SRC = { x: 40, y: 0, w: 667, h: 667 };

  function layout() {
    const d = window.devicePixelRatio || 1;
    W = cv.clientWidth || 340;
    cv.width = W * d; cv.height = W * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    s = W / (N + 0.6);
    pad = s * 0.3;
  }
  function buildPieces() {
    const h = [], v = [];
    for (let r = 0; r < N; r++) { h.push([]); v.push([]); for (let c = 0; c < N; c++) { h[r].push(sign()); v[r].push(sign()); } }
    pieces = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const edges = [
        r === 0 ? 0 : -h[r - 1][c],
        c === N - 1 ? 0 : v[r][c],
        r === N - 1 ? 0 : h[r][c],
        c === 0 ? 0 : -v[r][c - 1]
      ];
      pieces.push({
        r, c, edges,
        hx: pad + c * s, hy: pad + r * s,
        sx: rnd(-s * 0.4, W - s * 0.6), sy: rnd(-s * 0.4, W - s * 0.6),
        sr: rnd(-1, 1), delay: 0
      });
    }
    pieces.sort(() => Math.random() - 0.5).forEach((p, i) => (p.delay = i * 110));
  }
  const DUR = 900;
  const easeOutBack = t => { const k = 1.5; return 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2); };

  function drawPuzzle(now) {
    layout();
    const path = p => piecePath(s, p.edges);
    ctx.clearRect(0, 0, W, W);
    ctx.strokeStyle = "rgba(15,27,56,.12)";
    ctx.setLineDash([4, 5]);
    ctx.strokeRect(pad, pad, s * N, s * N);
    ctx.setLineDash([]);
    let done = true;
    for (const p of pieces) {
      const t = reduce ? 1 : Math.max(0, Math.min(1, (now - animStart - p.delay) / DUR));
      if (t < 1) done = false;
      const e = t === 0 ? 0 : easeOutBack(t);
      const x = p.sx + (p.hx - p.sx) * e, y = p.sy + (p.hy - p.sy) * e, rot = p.sr * (1 - e);
      const pp = path(p);
      ctx.save();
      ctx.translate(x + s / 2, y + s / 2); ctx.rotate(rot); ctx.translate(-s / 2, -s / 2);
      if (t < 1) { ctx.shadowColor = "rgba(11,22,49,.35)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6; ctx.fillStyle = "#16295C"; ctx.fill(pp); ctx.shadowColor = "transparent"; }
      ctx.save();
      ctx.clip(pp);
      ctx.drawImage(img, SRC.x, SRC.y, SRC.w, SRC.h, -p.c * s, -p.r * s, N * s, N * s);
      ctx.restore();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = t < 1 ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.28)";
      ctx.stroke(pp);
      ctx.restore();
    }
    return done;
  }
  function run() {
    buildPieces();
    animStart = performance.now();
    const loop = now => { if (!drawPuzzle(now)) requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  img.onload = () => { puzzleReady = true; };
  img.src = IMG_SRC;

  let watched = false;
  function watchPuzzle() {
    if (!puzzleReady) { img.addEventListener("load", watchPuzzle, { once: true }); return; }
    buildPieces();
    drawPuzzle(0);
    if (watched) { run(); return; }
    watched = true;
    if (!("IntersectionObserver" in window)) { run(); return; }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); run(); }
    }, { threshold: 0.45 });
    io.observe(cv);
  }
  document.getElementById("again").addEventListener("click", run);
})();
