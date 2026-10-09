// Fonds en pixel art générés à la volée.
// Ciel tramé, astre à halos, étoiles, aurore, nuages, rayons ; couches de relief éclairées par la gauche, grain,
// herbe avec touffes et fleurs, canopée de forêt, neige, lave, eau avec reflets, cascades ; sprites (chênes, bouleaux,
// arbres de jungle, palmiers, buissons, sapins, cerisiers, cristaux, château, maisons, moulin, torii, temple, pyramide…) ;
// particules en pixels (lucioles, braises, pétales, neige, bulles, spores, papillons). Une toile par couche (parallaxe).
// Pixel.monter(element, theme) -> { couches: [canvas], animer(t) }   ·   Pixel.image(theme, l, h) -> canvas fixe
"use strict";
(() => {
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map(r => r.map(v => (v + 0.5) / 16));
  const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const ton = (c, k) => k > 0 ? c.map(v => v + (255 - v) * k) : c.map(v => v * (1 + k));
  const alea = s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const bruit = s => { const r = alea(s), v = Array.from({ length: 256 }, r); return x => { const i = Math.floor(x), f = x - i, k = f * f * (3 - 2 * f); return v[i & 255] * (1 - k) + v[(i + 1) & 255] * k; }; };
  const palette = o => Object.fromEntries(Object.entries(o || {}).filter(([, v]) => typeof v === "string").map(([k, v]) => [k, rgb(v)]));

  class Toile {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
    px(x, y, c, a = 1) {
      x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const i = (y * this.w + x) * 4, d = this.d;
      if (a >= 1 || !d[i + 3]) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = a >= 1 ? 255 : Math.max(d[i + 3], a * 255); return; }
      d[i] += (c[0] - d[i]) * a; d[i + 1] += (c[1] - d[i + 1]) * a; d[i + 2] += (c[2] - d[i + 2]) * a;
    }
    lit(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null; const i = (y * this.w + x) * 4; return this.d[i + 3] ? [this.d[i], this.d[i + 1], this.d[i + 2]] : null; }
    rect(x, y, l, h, c, a) { for (let j = 0; j < h; j++) for (let i = 0; i < l; i++) this.px(x + i, y + j, c, a); }
    toile() { const cv = document.createElement("canvas"); cv.width = this.w; cv.height = this.h; cv.getContext("2d").putImageData(new ImageData(this.d, this.w, this.h), 0, 0); return cv; }
  }

  // ---------- sprites (a sombre, b moyen, c clair, t tronc, u tronc ombré, v lianes, w écorce blanche, k marques) ----------
  const SPRITES = {
    sapin: ["...a...", "..aba..", "..aaa..", ".aabaa.", ".aaaaa.", "aaabaaa", "..aaa..", ".aabaa.", "aaaaaaa", "...t...", "...t..."],
    sapinNeige: ["...n...", "..nna..", "..aaa..", ".nnbaa.", ".aaaaa.", "nnabaaa", "..aaa..", ".nnbaa.", "aaaaaaa", "...t...", "...t..."],
    feuillu: [".abcba.", "abbcbba", "abbbbba", "aabbbaa", ".aaaaa.", "...t...", "...t...", "..tt..."],
    chene: ["....bbcbb......", "..bbcccbbbb....", ".bbccbbbbbbba..", "bbccbbbbbbbbaa.", "bbbbbbcbbbbbaaa", "abbbbcccbbbaaaa", ".abbbbbbbbaaaa.", "..aaabbbaaaa...", "....aa.tu.a....", ".......tu......", ".......tu......", "......ttuu.....", ".....tt..uu...."],
    bouleau: ["..bcb..", ".bccbb.", "bbcbbba", "bbbbbaa", ".abbaa.", "..aba..", "...w...", "...k...", "...w...", "...w...", "...k...", "...w...", "..ww..."],
    jungle: [".....bbccbb......", "...bbccccbbbb....", ".bbbccbbbbbbbbaa.", "bbbbbbbbbcbbbbbaa", "abbbbbbbcccbbbaaa", "aabbbbabbbbbaaaa.", ".aaav.aaaavaaa...", "...v...tu..v.....", "...v...tu..v.....", "...v...tu........", ".......tu..v.....", ".......tu........", ".......tu........", ".......tu........", "......ttuu.......", ".....tt..uu......"],
    palmier: ["..bb...bb..", ".b..bcb..b.", "b..bbcbb..b", "..b..t..b..", ".....t.....", "......t....", "......t....", ".....t.....", ".....t.....", "......t....", ".....tt...."],
    buisson: [".bccb..", "bbbcbba", "abbbbaa", ".aaaa.."],
    fougere: ["b.c.b", ".bcb.", "abbba"],
    sakura: ["..abba...", ".abbbaa..", "abbaaaaa.", "aaaaaaaac", ".aaaacaac", "..ac.tcc.", "....t....", "...tt....", "....t...."],
    lunaire: [".vvlv..", "vvllvv.", "vvvvvvv", ".vvvvv.", "..vwv..", "...w...", "...w...", "...w...", "..ww...", "...w...", "...w...", "...w..."],
    cristal: ["..w..", ".wlp.", ".llp.", "pllpp", "plpp.", ".lpp.", ".pp..", "..p.."],
    cactus: ["...g...", "..lgg..", "..lgg.g", "g.lgg.g", "g.lgggg", "gglgg..", "..lgg..", "..lgg..", "..lgg.."],
    rocher: [".rrl..", "rrrrl.", "rrrrrr"],
    corail: ["c.c.c", "cc.cc", ".ccc.", "..c.."],
    torii: ["rrrrrrrrrrr", ".rrrrrrrrr.", "..r.....r..", ".kkkkkkkkk.", "..r.....r..", "..r.....r..", "..r.....r..", "..r.....r..", "..k.....k.."],
    mort: ["k...k...k", ".k..k..k.", "..k.k.k..", "...kkk...", "....k..k.", "..k.k.k..", "...kk....", "....k....", "....k....", "...kkk..."],
    maison: ["...rrr...", "..rrrrr..", ".rrrrrrr.", "rrrrrrrrr", ".wwwwwww.", ".wyww.ww.", ".wwwwdww.", ".wwwwdww."],
    moulin: ["........", "........", "........", "........", "...rrr..", "..rrrrr.", "..wwwww.", "..wywww.", "..wwwww.", "..wwdww.", "..wwdww."],
    bruyere: [".p.l.", "plpp.", "ppgpp"],
    champignon: [".cccc.", "cclccc", "cccccc", "..tt..", "..tt.."],
  };
  function sprite(t, nom, x, yBas, echelle, pal) {
    const m = SPRITES[nom], h = m.length, l = m[0].length, x0 = Math.round(x - (l * echelle) / 2), y0 = Math.round(yBas - h * echelle);
    m.forEach((ligne, j) => [...ligne].forEach((ch, i) => { const c = pal[ch]; if (c) for (let a = 0; a < echelle; a++) for (let b = 0; b < echelle; b++) t.px(x0 + i * echelle + a, y0 + j * echelle + b, c); }));
  }
  function lueur(t, x, y, r, c, force = 0.35) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const d = Math.hypot(i, j) / r; if (d < 1 && BAYER[(y + j) & 3][(x + i) & 3] < (1 - d) * 0.9) t.px(x + i, y + j, c, force * (1 - d)); } }

  // ---------- éléments animés : dessinés sur un calque posé juste au-dessus de leur couche ----------
  const hashA = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const ANIM = {
    eau(ctx, a, t) { const f = Math.floor(t / 350); ctx.fillStyle = "rgba(255,255,255,.85)"; for (const [x, y] of a.points) if (hashA(x * 3 + y, f) > 0.955) ctx.fillRect(x, y, 2, 1); },
    lave(ctx, a, t) { for (const [x, y] of a.points) { const v = 0.5 + 0.5 * Math.sin(t * 0.004 + x * 0.35 + y); if (v > 0.55) { ctx.fillStyle = `rgba(255,232,130,${((v - 0.55) * 1.4).toFixed(2)})`; ctx.fillRect(x, y, 1, 1); } } },
    cascade(ctx, a, t) { const dec = Math.floor(t * 0.03);
      for (let i = 0; i < a.l; i++) for (let y = a.hauts[i]; y < a.bas; y++) { ctx.fillStyle = (((y - dec + i * 3) % 7) + 7) % 7 < 2 ? "#F0FAFF" : a.couleur; ctx.fillRect(a.x0 + i, y, 1, 1); }
      ctx.fillStyle = "#F5FCFF"; for (let i = -3; i < a.l + 3; i++) for (let j = 0; j < 3; j++) if (hashA(i * 5 + j, Math.floor(t / 120)) < 0.7) ctx.fillRect(a.x0 + i, a.bas - j, 1, 1); },
    drapeau(ctx, a, t) { ctx.fillStyle = "#E0533B"; const l = 5 * a.e, h = 3 * a.e; for (let c = 0; c < l; c++) { const dy = Math.round(Math.sin(t * 0.006 - c * 0.7) * (c / l) * a.e); ctx.fillRect(a.x + c, a.y + dy, 1, h); } ctx.fillStyle = "#FF8A6A"; ctx.fillRect(a.x, a.y, 1, h); },
    fenetres(ctx, a, t) { for (const [x, y, w, h] of a.rects) if (hashA(x * 7 + y, Math.floor(t / 900)) > 0.72) { ctx.fillStyle = "rgba(255,244,190,.6)"; ctx.fillRect(x, y, w, h); } },
    fumee(ctx, a, t) { for (let k = 0; k < 6; k++) { const age = (t * 0.012 + k * 7 + a.x) % 42, s = age > 22 ? 2 : 1; ctx.fillStyle = `rgba(228,228,234,${((1 - age / 42) * 0.7).toFixed(2)})`; ctx.fillRect(Math.round(a.x + Math.sin(age / 5 + k) * 1.5 + age * 0.15), Math.round(a.y - age), s, s); } },
    moulin(ctx, a, t) { ctx.fillStyle = "#4A3020"; const e = a.e, croix = Math.floor(t / 420) % 2; for (let k = -3; k <= 3; k++) { if (croix) { ctx.fillRect(a.x + k * e, a.y, e, e); ctx.fillRect(a.x, a.y + k * e, e, e); } else { ctx.fillRect(a.x + k * e, a.y + k * e, e, e); ctx.fillRect(a.x + k * e, a.y - k * e, e, e); } } },
  };
  const dessinerAnim = (ctx, anims, t) => { for (const a of anims) ANIM[a.type](ctx, a, t); };

  function chateau(t, x, y, e, c, fen, anims) {
    const pierre = (i, j) => ton(c, ((i * 7 + j * 3) % 5 === 0) ? 0.1 : (i % 4 === 0 ? -0.06 : 0));
    const bloc = (a, b, l, h) => { for (let j = 0; j < h * e; j++) for (let i = 0; i < l * e; i++) t.px(x + a * e + i, y - b * e + j, ton(pierre(i, j), i < e ? 0.08 : 0)); };
    const cren = (a, b, l) => { for (let k = 0; k < l; k += 2) bloc(a + k, b + 1, 1, 1); };
    bloc(-10, 8, 20, 8); cren(-10, 8, 20); bloc(-14, 14, 5, 14); cren(-14, 14, 5); bloc(9, 14, 5, 14); cren(9, 14, 5); bloc(-3, 22, 6, 22); cren(-3, 22, 6);
    const fenetres = [[-1, 17], [1, 17], [-1, 12], [1, 12], [-12, 10], [11, 10], [-6, 4], [5, 4]].map(([a, b]) => [x + a * e, y - b * e, e, Math.round(e * 1.5)]);
    for (const [fx, fy, fw, fh] of fenetres) t.rect(fx, fy, fw, fh, fen);
    t.rect(x, y - 30 * e, Math.max(1, e / 2), 8 * e, ton(c, -0.3));
    // le drapeau flotte : il est dessiné sur le calque animé
    anims.push({ type: "drapeau", x: Math.round(x + e / 2), y: y - 30 * e, e }, { type: "fenetres", rects: fenetres });
    t.rect(x - e, y - 3 * e, 2 * e, 3 * e, ton(c, -0.45));
    lueur(t, x, y - 14 * e, 8 * e, fen, 0.18);
  }
  function pyramide(t, x, yBas, h, c, mousse) {
    const m = mousse && rgb(mousse);
    for (let j = 0; j < h; j++) { const demi = h - j, y = yBas - j; for (let i = -demi; i <= demi; i++) {
      let col = ton(c, i > 0 ? -0.2 : (j % 3 === 0 ? 0.08 : 0)); if (j % 3 === 0 && i > 0) col = ton(c, -0.32);
      if (m && ((((i * 13 + j * 7) % 9) + 9) % 9 < 3 || j < 2)) col = ton(m, i > 0 ? -0.2 : 0);
      t.px(x + i, y, col, 1); } }
    t.rect(x - 1, yBas - 5, 3, 5, ton(c, -0.55));
  }

  // ---------- rendu d'un thème ----------
  function rendre(th, W, H) {
    const r = alea(th.graine || 7), couches = [];
    // 1. ciel
    const ciel = new Toile(W, H), stops = th.ciel.map(rgb), B = 18, fin = th.finCiel || 0.75;
    const degrade = t => { const f = t * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(f)); return mix(stops[i], stops[i + 1], f - i); };
    for (let y = 0; y < H; y++) { const tb = Math.min(1, y / (H * fin)) * B, b0 = Math.floor(tb), fr = tb - b0;
      for (let x = 0; x < W; x++) ciel.px(x, y, degrade(Math.min(B, fr > BAYER[y & 3][x & 3] ? b0 + 1 : b0) / B)); }
    if (th.etoiles) for (let k = 0; k < W * H * th.etoiles; k++) { const x = r() * W | 0, y = Math.pow(r(), 1.6) * H * 0.5 | 0; if (r() < y / (H * 0.5)) continue; const c = r() > 0.85 ? [255, 246, 214] : [220, 220, 255]; ciel.px(x, y, c, 0.5 + r() * 0.5); if (r() > 0.93) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) ciel.px(x + dx, y + dy, c, 0.45); }
    if (th.aurore) { const n = bruit(th.graine + 3), cols = th.aurore.map(rgb);
      for (let x = 0; x < W; x++) { const yc = H * 0.22 + Math.sin(x / 26) * H * 0.05 + (n(x / 18) - 0.5) * H * 0.06, ep = H * 0.09;
        for (let j = 0; j < ep; j++) { const a = (1 - j / ep) * (x % 3 === 0 ? 0.55 : 0.38); if (BAYER[(yc + j) & 3][x & 3] < a * 1.6) ciel.px(x, yc + j, cols[j < ep / 2 ? 0 : 1], a); } } }
    if (th.astre) { const a = th.astre, ax = Math.round(a.x * W), ay = Math.round(a.y * H), rr = Math.max(3, Math.round(a.r * H)), c = rgb(a.couleur);
      [[2.6, 0.12], [1.9, 0.22], [1.4, 0.38]].forEach(([k, f]) => { for (let j = -rr * k; j <= rr * k; j++) for (let i = -rr * k; i <= rr * k; i++) if (Math.hypot(i, j) <= rr * k) ciel.px(ax + i, ay + j, c, f); });
      for (let j = -rr; j <= rr; j++) for (let i = -rr; i <= rr; i++) if (Math.hypot(i, j) <= rr) ciel.px(ax + i, ay + j, a.lune && ((i * 3 + j * 5) % 11 === 0 || Math.hypot(i + rr / 3, j - rr / 4) < rr / 4) ? ton(c, -0.1) : c); }
    if (th.rayons) for (let k = 0; k < 6; k++) { const x0 = r() * W, l = 6 + r() * 10; for (let y = 0; y < H; y++) for (let i = 0; i < l; i++) { const x = Math.round(x0 + i - y * 0.35); if (BAYER[y & 3][x & 3] < 0.5) ciel.px(x, y, [200, 236, 255], 0.12); } }
    let nuagesT = null;
    if (th.nuages) { nuagesT = new Toile(W * 2, H);
      for (let k = 0; k < th.nuages; k++) { const x0 = r() * W | 0, y = (0.06 + r() * 0.3) * H | 0, l = 14 + r() * 26 | 0, c = rgb(th.couleurNuage || "#FFFFFF");
        for (const x of [x0, x0 + W, x0 - W]) { nuagesT.rect(x, y + 3, l, 5, c, 0.94); nuagesT.rect(x + 3, y, l * 0.45 | 0, 4, c, 0.94); nuagesT.rect(x + (l * 0.5 | 0), y + 1, l * 0.35 | 0, 3, c, 0.94); nuagesT.rect(x + 1, y + 1, 3, 2, ton(c, 0.5), 0.9); nuagesT.rect(x, y + 8, l, 1, ton(c, -0.14), 0.9); } } }
    if (th.minerais) { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (r() < 0.12) ciel.px(x, y, ton(stops[0], (r() - 0.5) * 0.5), 0.7);
      const MIN = [["#5FE0E8", 0.18], ["#F2C94C", 0.22], ["#D8A88A", 0.3], ["#E04848", 0.3]];
      for (let k = 0; k < W * H * th.minerais; k++) { const x = r() * W | 0, y = r() * H * 0.8 | 0, [c, p] = MIN[r() * MIN.length | 0]; if (r() > p * 3) continue; const cc = rgb(c); for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [2, 1], [1, 2]]) if (r() < 0.8) ciel.px(x + dx, y + dy, (dx + dy) % 2 ? ton(cc, -0.25) : cc); } }
    couches.push({ canvas: ciel.toile(), profondeur: 0, fond: true });
    if (nuagesT) couches.push({ canvas: nuagesT.toile(), profondeur: 0, nuages: true });

    // 2. plafond de grotte
    if (th.plafond) { const p = th.plafond, t = new Toile(W, H), n = bruit(th.graine + 50), c = rgb(p.couleur);
      for (let x = 0; x < W; x++) { let bas = (p.base + (n(x / 14) - 0.5) * p.amplitude) * H; if (r() < 0.08) bas += 6 + r() * 18;
        for (let y = 0; y < bas; y++) t.px(x, y, ton(c, y > bas - 2 ? 0.15 : -0.25 * (1 - y / bas) + (r() < 0.06 ? 0.08 : 0))); }
      if (p.stalactites) for (let k = 0; k < W * p.stalactites; k++) { const x0 = r() * W | 0, l = 8 + r() * 26 | 0, larg = 2 + (r() * 3 | 0), haut0 = (p.base + (n(x0 / 14) - 0.5) * p.amplitude) * H - 2; for (let j = 0; j < l; j++) { const w = Math.max(0, Math.round(larg * (1 - j / l))); for (let i = -w; i <= w; i++) t.px(x0 + i, haut0 + j, ton(c, i < 0 ? 0.12 : -0.1)); } }
      couches.push({ canvas: t.toile(), profondeur: 0.15 }); }

    // 3. couches
    th.couches.forEach((cc, idx) => {
      const t = new Toile(W, H), prof = cc.profondeur ?? (idx + 1) / (th.couches.length + 1), anims = [];
      if (cc.eau) { // plan d'eau : du niveau à la base, reflets
        const c = rgb(cc.eau), y0 = Math.round(cc.niveau * H), cl = ton(c, 0.35);
        for (let y = y0; y < H; y++) for (let x = 0; x < W; x++) { const k = (y - y0) / (H - y0); t.px(x, y, ton(c, -0.25 * k + (BAYER[y & 3][x & 3] < 0.12 ? 0.08 : 0))); }
        for (let k = 0; k < W * 0.25; k++) { const x = r() * W | 0, y = y0 + 1 + (r() * (H - y0) * 0.7 | 0), l = 2 + r() * 8 | 0; t.rect(x, y, l, 1, cl, 0.8); }
        t.rect(0, y0, W, 1, ton(c, 0.5));
        const points = []; for (let k = 0; k < W * 0.7; k++) points.push([r() * W | 0, y0 + 1 + (r() * (H - y0) * 0.55 | 0)]);
        couches.push({ canvas: t.toile(), profondeur: prof, anims: [{ type: "eau", points }] }); return;
      }
      const c = rgb(cc.couleur), g = (th.graine || 7) * 31 + idx * 17, n1 = bruit(g), n2 = bruit(g + 5), n3 = bruit(g + 9), haut = [];
      for (let x = 0; x < W; x++) {
        let h = n1(x / (W * 0.16 / cc.rugosite)) * 0.65 + n2(x / (W * 0.07 / cc.rugosite)) * 0.25 + n3(x / 6) * 0.1;
        if (cc.aspect === "pics") h = Math.pow(1 - Math.abs(n1(x / (W * 0.11)) * 2 - 1), 1.8) * 0.85 + n3(x / 5) * 0.1;
        if (cc.aspect === "dunes") h = (Math.sin(x / (W * 0.09) + g) * 0.5 + 0.5) * 0.6 + n2(x / (W * 0.2)) * 0.4;
        if (cc.aspect === "falaises") { const brut = (n1(x / (W * 0.13)) * 0.75 + n2(x / (W * 0.05)) * 0.2 + n3(x / 5) * 0.05) * 7, palier = Math.floor(brut); h = (palier + Math.pow(brut - palier, 4)) / 7; }
        if (cc.cratere) { const d = Math.abs(x / W - cc.cratere.x) / cc.cratere.l; h = h * (d < 1 ? 0.35 + 0.65 * d * d : 1) + 0.3 * Math.exp(-Math.pow((d - 0.95) / 0.18, 2)); }
        haut.push(Math.round((cc.base - h * cc.amplitude) * H));
      }
      // constructions de la couche : emprise (demi-largeur en pixels) et terrassement du sol sous chacune
      const toits = { r: rgb("#9A3F2E"), w: rgb("#E2CFA8"), y: rgb("#FFD27A"), d: rgb("#5A3A24"), k: rgb("#4A3020") }, ouvrages = [];
      const em = cc.echelleMaison || 1;
      if (cc.chateau) { const e = cc.echelleChateau || 1; ouvrages.push({ x: Math.round(cc.chateau * W), demi: 15 * e, couvrable: true, dessin: (x, y) => chateau(t, x, y, e, cc.couleurChateau ? rgb(cc.couleurChateau) : ton(c, 0.08), rgb("#FFD27A"), anims) }); }
      for (const mx of cc.maisons || []) ouvrages.push({ x: Math.round(mx * W), demi: 5 * em, dessin: (x, y) => { sprite(t, "maison", x, y, em, toits); anims.push({ type: "fumee", x: x - 2 * em, y: y - 8 * em - 1 }); } });
      if (cc.moulin) ouvrages.push({ x: Math.round(cc.moulin * W), demi: 5 * em, dessin: (x, y) => { sprite(t, "moulin", x, y, em, toits); anims.push({ type: "moulin", x: Math.round(x - 4 * em) + 2 * em, y: y - 11 * em + 2 * em, e: em }); } });
      if (cc.torii) { const e = cc.echelleTorii || 2; ouvrages.push({ x: Math.round(cc.torii * W), demi: 6 * e, dessin: (x, y) => sprite(t, "torii", x, y, e, { r: rgb("#C8372D"), k: rgb("#3A1E1A") }) }); }
      if (cc.pyramide) { const hp = Math.round(cc.pyramide.h * H); ouvrages.push({ x: Math.round(cc.pyramide.x * W), demi: hp + 1, couvrable: true, dessin: (x, y) => pyramide(t, x, y, hp, rgb(cc.pyramide.couleur), cc.pyramide.mousse) }); }
      for (const o of ouvrages) { // plateau sous l'ouvrage, rampes douces de chaque côté
        const a = Math.max(0, o.x - o.demi), b = Math.min(W - 1, o.x + o.demi), rampe = Math.max(4, Math.round(o.demi * 0.6));
        let somme = 0; for (let x = a; x <= b; x++) somme += haut[x];
        o.niveau = Math.round(somme / (b - a + 1));
        for (let x = a - rampe; x <= b + rampe; x++) { if (x < 0 || x >= W) continue; const d = x < a ? (a - x) / rampe : x > b ? (x - b) / rampe : 0, k = 1 - d * d * (3 - 2 * d); haut[x] = Math.round(haut[x] + (o.niveau - haut[x]) * k); }
      }
      const libre = x => ouvrages.every(o => Math.abs(x - o.x) > o.demi + 2);
      const canopee = x => ouvrages.every(o => o.couvrable || Math.abs(x - o.x) > o.demi + 2); // la canopée peut passer devant le pied du château et du temple
      // remplissage : bandes tramées, éclairage par la gauche, grain
      for (let x = 0; x < W; x++) { const y0 = haut[x], pente = (haut[Math.min(W - 1, x + 2)] - haut[Math.max(0, x - 2)]) / 4, face = Math.round(8 + Math.abs(pente) * 6);
        for (let y = Math.max(0, y0); y < H; y++) {
          const pr = Math.min(1, (y - y0) / (H * 0.3)), bande = Math.floor(pr * 4 + BAYER[y & 3][x & 3] * 0.9) / 4;
          let k = 0.06 - bande * 0.32; if (y - y0 < face && !cc.herbe) k += pente < -0.3 ? 0.12 : pente > 0.3 ? -0.12 : 0;
          if (r() < 0.07) k += (r() - 0.5) * 0.16;
          t.px(x, y, y === y0 && !cc.herbe ? ton(c, 0.2) : ton(c, k)); } }
      // les constructions avant la canopée et le décor : elles se nichent dedans
      for (const o of ouvrages) o.dessin(o.x, o.niveau + 2);
      if (cc.foret) { const f = palette(cc.foret); // canopée : boules de feuillage le long de la crête
        for (let x = -4; x < W + 4; x += 2 + (r() * 3 | 0)) { if (r() < 0.18 || !canopee(x)) continue; const xx = Math.max(0, Math.min(W - 1, x)), rr = 2 + (r() * 6 | 0), cy = haut[xx] - rr * (0.3 + r() * 0.5);
          for (let j = -rr; j <= rr; j++) for (let i = -rr; i <= rr; i++) if (i * i + j * j <= rr * rr) t.px(x + i, cy + j, j < -rr / 2 && i < 0 ? f.c : (i + j > rr / 2 ? f.a : f.b));
          for (let y = Math.round(cy); y < haut[xx] + 3; y++) t.px(x, y, f.a); } }
      if (cc.herbe) { const hb = palette(cc.herbe), fleurs = (cc.herbe.fleurs || []).map(rgb);
        for (let x = 0; x < W; x++) { const y0 = haut[x], ep = 2 + ((x * 13) % 3);
          for (let j = 0; j < ep; j++) t.px(x, y0 + j, j === 0 ? hb.c : hb.b);
          if (BAYER[y0 & 3][x & 3] < 0.4) t.px(x, y0 + ep, hb.b);
          if (r() < 0.32) t.px(x, y0 - 1, hb.c); if (r() < 0.07) { t.px(x, y0 - 1, hb.b); t.px(x, y0 - 2, hb.c); }
          if (fleurs.length && r() < (cc.herbe.densiteFleurs || 0.04)) { t.px(x, y0 - 1, hb.a); t.px(x, y0 - 2, fleurs[r() * fleurs.length | 0]); } } }
      if (cc.neige) { const seuil = (cc.base - cc.amplitude * 0.55) * H; for (let x = 0; x < W; x++) if (haut[x] < seuil) { const ep = Math.min(seuil - haut[x], 2 + ((x * 7) % 5)); for (let j = 0; j < ep; j++) t.px(x, haut[x] + j, j === 0 ? [255, 255, 255] : (x % 5 === 0 ? [206, 218, 238] : [228, 236, 250])); } }
      if (cc.veines) for (let k = 0; k < W * 0.08; k++) { const x = r() * W | 0, l = 6 + r() * 22 | 0; for (let j = 2; j < l; j++) t.px(x + (j > l / 2 ? 1 : 0), haut[x] + j, ton(c, -0.22)); }
      if (cc.lave) { const n = bruit(g + 77), lv = rgb("#FF7A2A"), jn = rgb("#FFD24A"), points = [];
        for (let x = 0; x < W; x++) if (n(x / 7) > 0.6) { const y = haut[x] + 3 + ((x / 3 | 0) % 2); t.px(x, y, jn); t.px(x, y + 1, lv); lueur(t, x, y - 2, 3, lv, 0.12); points.push([x, y], [x, y + 1]); }
        if (points.length) anims.push({ type: "lave", points }); }
      if (cc.lac) { const lv = rgb(cc.lac.couleur), x0 = Math.max(0, Math.round((cc.lac.x - cc.lac.l / 2) * W)), x1 = Math.min(W - 1, Math.round((cc.lac.x + cc.lac.l / 2) * W));
        const zone = haut.slice(x0, x1 + 1), fond = x0 + zone.indexOf(Math.max(...zone));
        let niveau = Math.round(cc.lac.niveau ? cc.lac.niveau * H : cc.lac.prof ? Math.max(...zone) - cc.lac.prof * H : zone.reduce((a, b) => a + b, 0) / zone.length);
        // l'eau ne monte pas plus haut que le bord le plus bas de la cuvette, et ne remplit que le creux continu autour du fond
        const bordG = Math.min(...haut.slice(x0, fond + 1)), bordD = Math.min(...haut.slice(fond, x1 + 1));
        niveau = Math.max(niveau, Math.max(bordG, bordD) + 1);
        let g = fond, dr = fond; while (g > x0 && haut[g - 1] > niveau) g--; while (dr < x1 && haut[dr + 1] > niveau) dr++;
        const surface = []; for (let x = g; x <= dr; x++) if (haut[x] > niveau) for (let y = niveau; y <= Math.min(haut[x], niveau + 3); y++) surface.push([x, y]);
        if (surface.length) anims.push(cc.lac.lueur ? { type: "lave", points: surface } : { type: "eau", points: surface.filter((_, i) => i % 2 === 0) });
        for (let x = g; x <= dr; x++) if (haut[x] > niveau) { for (let y = niveau; y <= haut[x] + 1; y++) t.px(x, y, y === niveau ? ton(lv, 0.45) : ton(lv, -0.25 * Math.min(1, (y - niveau) / 8))); if (cc.lac.lueur) lueur(t, x, niveau - 2, 4, lv, 0.12); else if (x % 5 === 0) t.px(x, niveau + 2, ton(lv, 0.3)); } }
      if (cc.cascade) { const x0 = Math.round(cc.cascade.x * W), l = cc.cascade.l || 4, bas = Math.round(cc.cascade.bas * H), eau = rgb(cc.cascade.couleur || "#9FD4F2");
        for (let i = 0; i < l; i++) { const x = x0 + i, y1 = haut[Math.min(W - 1, x)]; for (let y = y1; y < bas; y++) t.px(x, y, (y + i * 3) % 7 < 2 ? [240, 250, 255] : ton(eau, i === 0 ? 0.15 : 0)); }
        for (let i = -3; i < l + 3; i++) for (let j = 0; j < 3; j++) if (r() < 0.7) t.px(x0 + i, bas - j, [245, 252, 255]);
        anims.push({ type: "cascade", x0, l, bas, couleur: `rgb(${eau.join(",")})`, hauts: Array.from({ length: l }, (_, i) => haut[Math.min(W - 1, x0 + i)]) }); }
      if (cc.decor) { const ds = [].concat(cc.decor), pal = palette(cc.palette);
        for (let x = 0; x < W; x++) if (r() < cc.densite && libre(x)) { const nom = ds[r() * ds.length | 0], e = cc.taille || 1; sprite(t, nom, x, haut[x] + 2, e, pal);
          if (nom === "cristal") lueur(t, x, haut[x] - 4 * e, 6 * e, pal.l || [200, 160, 255], 0.2); if (nom === "champignon") lueur(t, x, haut[x] - 3 * e, 5 * e, pal.c, 0.25); } }
      if (cc.stalagmites) for (let k = 0; k < W * cc.stalagmites; k++) { const x0 = r() * W | 0, l = 6 + r() * 22 | 0, larg = 2 + (r() * 3 | 0); for (let j = 0; j < l; j++) { const w = Math.max(0, Math.round(larg * (1 - j / l))); for (let i = -w; i <= w; i++) t.px(x0 + i, haut[x0] + 2 - j, ton(c, i < 0 ? 0.16 : -0.08)); } }
      if (cc.algues) for (let x = 0; x < W; x += 2) if (r() < cc.algues) { const l = 8 + r() * 24 | 0, c2 = rgb(cc.couleurAlgue); for (let j = 0; j < l; j++) t.px(x + Math.round(Math.sin(j / 3 + x) * 1.2), haut[x] - j, j % 4 === 0 ? ton(c2, 0.2) : c2); }
      couches.push({ canvas: t.toile(), profondeur: prof, anims });
    });
    return couches;
  }

  // ---------- particules en pixels ----------
  const PARTICULES = {
    lucioles: { nb: 0.0014, init: (p, W, H, r) => { p.x = r() * W; p.y = H * (0.55 + r() * 0.45); }, pas: (p, t) => [p.x + Math.sin(t * 0.0004 * p.v + p.p) * 6, p.y + Math.cos(t * 0.0006 * p.v + p.p) * 3], couleur: [255, 224, 130], alpha: (p, t) => Math.pow(Math.abs(Math.sin(t * 0.0015 * p.v + p.p)), 3), halo: true },
    braises: { nb: 0.0016, init: (p, W, H, r) => { p.x = r() * W; p.y = r() * H; }, pas: (p, t, W, H) => [(p.x + Math.sin(t * 0.001 + p.p) * 4) % W, H - ((H - p.y + t * 0.012 * p.v) % H)], couleur: [255, 150, 60], alpha: (p, t) => 0.5 + 0.5 * Math.sin(t * 0.004 + p.p) },
    petales: { nb: 0.0012, init: (p, W, H, r) => { p.x = r() * W; p.y = r() * H; }, pas: (p, t, W, H) => [(p.x + t * 0.008 * p.v + Math.sin(t * 0.002 + p.p) * 5) % W, (p.y + t * 0.006 * p.v) % H], couleur: [248, 176, 204], alpha: () => 0.95 },
    neige: { nb: 0.002, init: (p, W, H, r) => { p.x = r() * W; p.y = r() * H; }, pas: (p, t, W, H) => [(p.x + Math.sin(t * 0.001 + p.p) * 3 + W) % W, (p.y + t * 0.007 * p.v) % H], couleur: [255, 255, 255], alpha: () => 0.9 },
    bulles: { nb: 0.0012, init: (p, W, H, r) => { p.x = r() * W; p.y = r() * H; }, pas: (p, t, W, H) => [p.x + Math.sin(t * 0.002 + p.p) * 2, H - ((H - p.y + t * 0.01 * p.v) % H)], couleur: [200, 236, 255], alpha: () => 0.7 },
    spores: { nb: 0.0014, init: (p, W, H, r) => { p.x = r() * W; p.y = r() * H; }, pas: (p, t, W, H) => [(p.x + Math.sin(t * 0.0007 + p.p) * 8 + W) % W, (p.y + Math.cos(t * 0.0005 + p.p) * 6 + H) % H], couleur: [170, 220, 120], alpha: (p, t) => 0.3 + 0.5 * Math.abs(Math.sin(t * 0.001 + p.p)) },
    oiseaux: { nb: 0.00012, init: (p, W, H, r) => { p.x = r() * W; p.y = H * (0.1 + r() * 0.3); }, pas: (p, t, W) => [(p.x + t * 0.012 * p.v) % (W + 20) - 10, p.y + Math.sin(t * 0.001 + p.p) * 3], couleur: [40, 44, 60], alpha: () => 1, oiseau: true },
    papillons: { nb: 0.0004, init: (p, W, H, r) => { p.x = r() * W; p.y = H * (0.5 + r() * 0.4); p.c = r() > 0.5 ? [255, 236, 120] : [255, 255, 255]; }, pas: (p, t, W) => [(p.x + t * 0.006 * p.v + Math.sin(t * 0.003 + p.p) * 6) % W, p.y + Math.sin(t * 0.004 + p.p) * 4], couleur: [255, 255, 255], alpha: () => 1, aile: true },
  };

  function particules(def, W, H) {
    const cv = document.createElement("canvas"), ctx = cv.getContext("2d"), r = alea(99);
    cv.width = W; cv.height = H; cv.className = "pixel-couche pixel-particules";
    const parts = Array.from({ length: Math.max(6, Math.round(W * H * def.nb)) }, () => { const p = { p: r() * 6.28, v: 0.5 + r() }; def.init(p, W, H, r); return p; });
    const animer = t => { ctx.clearRect(0, 0, W, H); for (const p of parts) { const [x, y] = def.pas(p, t, W, H), a = def.alpha(p, t), c = p.c || def.couleur, X = Math.round(x), Y = Math.round(y);
      if (def.halo) { ctx.fillStyle = `rgba(${c},${a * 0.25})`; ctx.fillRect(X - 1, Y - 1, 3, 3); }
      ctx.fillStyle = `rgba(${c},${a})`;
      if (def.oiseau) { const o = Math.sin(t * 0.012 + p.p) > 0 ? 1 : 0; ctx.fillRect(X, Y, 1, 1); ctx.fillRect(X - 1, Y - o, 1, 1); ctx.fillRect(X + 1, Y - o, 1, 1); ctx.fillRect(X - 2, Y - 1 + o, 1, 1); ctx.fillRect(X + 2, Y - 1 + o, 1, 1); }
      else if (def.aile) { const o = Math.sin(t * 0.03 + p.p) > 0 ? 1 : 0; ctx.fillRect(X - 1, Y - o, 1, 1); ctx.fillRect(X + 1, Y - o, 1, 1); ctx.fillStyle = "rgba(60,40,20,1)"; ctx.fillRect(X, Y, 1, 1); }
      else ctx.fillRect(X, Y, 1, 1); } };
    animer(0);
    return { cv, animer };
  }

  // les couches animées (eau, lave, cascades, drapeaux, fumées, ailes de moulin) sont redessinées environ 10 fois par seconde
  // sur un calque posé juste au-dessus de leur couche, avec la même profondeur pour suivre la parallaxe
  function monter(el, th) {
    el.innerHTML = "";
    const H = th.resolution || 240, W = Math.max(140, Math.round(H * (el.clientWidth || innerWidth) / (el.clientHeight || innerHeight) * 1.12));
    const couches = [], calques = [];
    for (const c of rendre(th, W, H)) {
      c.canvas.className = "pixel-couche" + (c.fond ? " pixel-fond" : "") + (c.nuages ? " pixel-nuages" : "");
      c.canvas.dataset.profondeur = c.profondeur; el.appendChild(c.canvas); couches.push(c.canvas);
      if (c.anims && c.anims.length) {
        const cv = document.createElement("canvas"); cv.width = W; cv.height = H; cv.className = "pixel-couche pixel-anim"; cv.dataset.profondeur = c.profondeur;
        el.appendChild(cv); couches.push(cv); const ctx = cv.getContext("2d"); calques.push({ ctx, anims: c.anims }); dessinerAnim(ctx, c.anims, 0);
      }
    }
    let part = () => {};
    if (th.particules) { const p = particules(PARTICULES[th.particules], W, H); el.appendChild(p.cv); part = p.animer; }
    let dernier = -1e9;
    return { couches, animer: t => { part(t); if (t - dernier < 100) return; dernier = t; for (const k of calques) { k.ctx.clearRect(0, 0, W, H); dessinerAnim(k.ctx, k.anims, t); } } };
  }
  // une image fixe (galerie) : toutes les couches fusionnées, animations figées à leur premier instant
  function image(th, l, h) {
    const H = h, W = l, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d"); for (const c of rendre(th, W, H)) { ctx.drawImage(c.canvas, 0, 0); if (c.anims) dessinerAnim(ctx, c.anims, 0); }
    return cv;
  }

  // ---------- thèmes : nos biomes ----------
  const VERT = { a: "#3E7A34", b: "#5FA046", c: "#86C25A" };
  const THEMES = {
    crepuscule: { graine: 5, etoiles: 0.0025, particules: "lucioles", ciel: ["#0B0C24", "#231A4E", "#5B3A7A", "#C9667A", "#F4A86A", "#FBD38A"], finCiel: 0.82,
      astre: { x: 0.77, y: 0.6, r: 0.065, couleur: "#FFE2A8" },
      couches: [
        { base: 0.86, amplitude: 0.24, rugosite: 1, aspect: "pics", couleur: "#6E5C9E", neige: true, profondeur: 0.1 },
        { base: 0.86, amplitude: 0.14, rugosite: 1.2, couleur: "#4D417F", foret: { a: "#3E3470", b: "#4A3F80", c: "#5A4E92" }, profondeur: 0.22 },
        { base: 0.91, amplitude: 0.1, rugosite: 1, couleur: "#342B63", chateau: 0.77, echelleChateau: 2, decor: ["sapin", "feuillu"], densite: 0.05, palette: { a: "#2B2356", b: "#3E3478", c: "#4A4088", t: "#1E1838" }, profondeur: 0.38 },
        { base: 0.96, amplitude: 0.08, rugosite: 1.4, couleur: "#211A44", decor: ["sapin", "chene"], densite: 0.06, taille: 2, palette: { a: "#18132F", b: "#2A2252", c: "#342A60", t: "#100C20", u: "#0A0816" }, profondeur: 0.6 },
        { base: 1.03, amplitude: 0.06, rugosite: 1.6, couleur: "#120E2A", decor: "sapin", densite: 0.05, taille: 3, palette: { a: "#0C0A1E", b: "#1B1638", t: "#07060F" }, profondeur: 0.9 },
      ] },
    royaume: { graine: 5, particules: "oiseaux", nuages: 9, ciel: ["#2E6FD0", "#5E9CE6", "#9CCAF4", "#D8ECF8", "#FBE6B0"], finCiel: 0.82,
      astre: { x: 0.8, y: 0.18, r: 0.055, couleur: "#FFF6D0" },
      couches: [
        { base: 0.8, amplitude: 0.36, rugosite: 1, aspect: "pics", couleur: "#8E9EC4", neige: true, profondeur: 0.08 },
        { base: 0.78, amplitude: 0.18, rugosite: 1.2, couleur: "#5E9A6A", foret: { a: "#447E52", b: "#548E5E", c: "#72AA72" }, profondeur: 0.2 },
        { base: 0.84, amplitude: 0.2, aspect: "falaises", rugosite: 1.4, couleur: "#A8A49A", veines: true, herbe: { a: "#3E7A34", b: "#5A9A44", c: "#82BE5A", fleurs: ["#FFFFFF"] }, cascade: { x: 0.3, l: 4, bas: 0.88 }, chateau: 0.74, echelleChateau: 2, couleurChateau: "#E4DED2", profondeur: 0.3 },
        { base: 0.86, amplitude: 0.14, rugosite: 1, couleur: "#5AA044", herbe: { a: "#3A7A30", b: "#5FA046", c: "#8CC85E", fleurs: ["#FFE070", "#FFFFFF"] }, decor: ["chene", "sapin"], densite: 0.03, palette: { a: "#2F6A2C", b: "#4E8E3C", c: "#7AB850", t: "#5A3A22", u: "#3E2816" }, profondeur: 0.4 },
        { eau: "#4E94DA", niveau: 0.9, profondeur: 0.5 },
        { base: 0.96, amplitude: 0.07, rugosite: 1.4, couleur: "#4A9238", herbe: { a: "#2E6A28", b: "#4C8E38", c: "#7AB850", fleurs: ["#FF6A5A", "#FFE070", "#FFFFFF", "#B88AE8"], densiteFleurs: 0.08 }, decor: ["chene", "buisson", "bouleau"], densite: 0.03, taille: 2, palette: { a: "#285A26", b: "#3E7E34", c: "#64A848", t: "#5A3A22", u: "#3E2816", w: "#ECE8DC", k: "#2A2A2A" }, profondeur: 0.65 },
        { base: 1.04, amplitude: 0.05, rugosite: 1.6, couleur: "#3A7A2C", herbe: { a: "#245A20", b: "#3A7A2C", c: "#5E9E40", fleurs: ["#FFE070", "#FF6A5A"] }, decor: ["chene", "sapin"], densite: 0.02, taille: 3, palette: { a: "#1E4A1C", b: "#2E6A28", c: "#4E8E38", t: "#4A2E1A", u: "#2E1C10" }, profondeur: 0.9 },
      ] },
    // les contrées des peuples : fin d'après-midi dorée, château lointain, village et moulin, lac, lande fleurie
    contrees: { graine: 57, particules: "oiseaux", nuages: 7, couleurNuage: "#FFF2DA", ciel: ["#3E7CD0", "#78AEE6", "#BFDCF0", "#F4E2B4", "#F8C888"], finCiel: 0.8,
      astre: { x: 0.18, y: 0.3, r: 0.05, couleur: "#FFF0C8" },
      couches: [
        { base: 0.7, amplitude: 0.3, rugosite: 1, aspect: "pics", couleur: "#9C9EC2", neige: true, profondeur: 0.08 },
        { base: 0.76, amplitude: 0.14, rugosite: 1.2, couleur: "#5E8E62", foret: { a: "#46765A", b: "#568A62", c: "#70A272" }, profondeur: 0.18 },
        { base: 0.84, amplitude: 0.1, rugosite: 1.2, couleur: "#62A04A", herbe: { ...VERT, fleurs: ["#FFE070", "#FFFFFF"] }, decor: ["chene", "sapin"], densite: 0.02, chateau: 0.26, echelleChateau: 2, couleurChateau: "#DCD4C4", maisons: [0.6, 0.635, 0.67], moulin: 0.72, echelleMaison: 1, palette: { a: "#2F6A2C", b: "#4E8E3C", c: "#7AB850", t: "#5A3A22", u: "#3E2816" }, profondeur: 0.32 },
        { eau: "#4E94DA", niveau: 0.9, profondeur: 0.45 },
        { base: 0.97, amplitude: 0.06, rugosite: 1.4, couleur: "#4E8E3A", herbe: { a: "#2E6A28", b: "#4C8E38", c: "#7AB850", fleurs: ["#B88AE8", "#D6A2F0", "#FFE070", "#FFFFFF"], densiteFleurs: 0.1 }, decor: ["chene", "buisson", "bouleau"], densite: 0.025, taille: 2, palette: { a: "#285A26", b: "#3E7E34", c: "#64A848", t: "#5A3A22", u: "#3E2816", w: "#ECE8DC", k: "#2A2A2A" }, profondeur: 0.7 },
      ] },
    cimes: { graine: 131, particules: "oiseaux", nuages: 6, couleurNuage: "#FFE0B8", ciel: ["#4A6AB8", "#C88A9A", "#F6A86A", "#FCD48A"], finCiel: 0.8,
      astre: { x: 0.72, y: 0.66, r: 0.08, couleur: "#FFE8A8" },
      couches: [
        { base: 0.84, amplitude: 0.5, rugosite: 1, aspect: "pics", couleur: "#9A7A9A", neige: true, profondeur: 0.08 },
        { base: 0.84, amplitude: 0.22, rugosite: 1.1, aspect: "pics", couleur: "#6E6A8E", neige: true, profondeur: 0.18 },
        { base: 0.88, amplitude: 0.12, rugosite: 1.2, couleur: "#5E8A50", foret: { a: "#3E6A3A", b: "#4E7E46", c: "#7AA25A" }, profondeur: 0.32 },
        { base: 0.96, amplitude: 0.07, rugosite: 1.4, couleur: "#4A7A38", herbe: { a: "#2E5A28", b: "#4A7A38", c: "#7AA850", fleurs: ["#FFE070", "#FF9A5A"] }, decor: ["sapin", "chene"], densite: 0.03, taille: 2, palette: { a: "#244A22", b: "#365E30", c: "#5A8A44", t: "#4A2E1A", u: "#2E1C10" }, profondeur: 0.6 },
      ] },
    aube: { graine: 9, particules: "papillons", ciel: ["#4A3A7A", "#9A6A9A", "#E88A72", "#F6B26E", "#FAD892"], finCiel: 0.8, nuages: 6, couleurNuage: "#FFE2C8",
      astre: { x: 0.5, y: 0.7, r: 0.09, couleur: "#FFF0C8" },
      couches: [
        { base: 0.8, amplitude: 0.22, rugosite: 1, aspect: "pics", couleur: "#8A7AA8", neige: true },
        { base: 0.84, amplitude: 0.12, rugosite: 1.2, couleur: "#5E8A5A", foret: { a: "#3E6A40", b: "#4E7E4C", c: "#6A9A5E" }, chateau: 0.22, echelleChateau: 2, couleurChateau: "#B8A8A0", maisons: [0.31, 0.35, 0.39], moulin: 0.44, echelleMaison: 1 },
        { eau: "#6A8EC8", niveau: 0.86 },
        { base: 0.92, amplitude: 0.06, rugosite: 1.3, couleur: "#4E8A3E", herbe: { ...VERT, fleurs: ["#FFE070", "#FFFFFF", "#F08AB0"] }, decor: ["chene", "buisson"], densite: 0.025, palette: { a: "#2F6A2C", b: "#4E8E3C", c: "#7AB850", t: "#5A3A22", u: "#3E2816" } },
        { base: 1.02, amplitude: 0.05, rugosite: 1.6, couleur: "#3A7230", herbe: { ...VERT, fleurs: ["#FFE070", "#FFFFFF"] }, decor: ["chene", "buisson", "bouleau"], densite: 0.02, taille: 2, palette: { a: "#285A26", b: "#3E7E34", c: "#64A848", t: "#5A3A22", u: "#3E2816", w: "#E8E4D8", k: "#2A2A2A" } },
      ] },
    plaines: { graine: 13, particules: "papillons", nuages: 8, ciel: ["#5C9EE8", "#94C4F2", "#D6ECFA"], astre: { x: 0.82, y: 0.2, r: 0.05, couleur: "#FFF8D8" },
      couches: [
        { base: 0.62, amplitude: 0.22, aspect: "pics", rugosite: 1, couleur: "#9AAACC", neige: true },
        { base: 0.72, amplitude: 0.12, rugosite: 1, couleur: "#6E9E6A", foret: { a: "#4C7E4E", b: "#5E925A", c: "#78AA6A" }, maisons: [0.3, 0.335, 0.37, 0.41], moulin: 0.46, echelleMaison: 1 },
        { base: 0.8, amplitude: 0.08, rugosite: 1.2, couleur: "#68A84C", herbe: { ...VERT, fleurs: ["#FFE070", "#FFFFFF"] }, decor: ["chene", "bouleau", "buisson"], densite: 0.02, palette: { a: "#3A7A30", b: "#5A9C42", c: "#86C25A", t: "#6A4428", u: "#4A2E1A", w: "#ECE8DC", k: "#2A2A2A" } },
        { eau: "#4E92D8", niveau: 0.86 },
        { base: 0.94, amplitude: 0.05, rugosite: 1.4, couleur: "#5A9A40", herbe: { ...VERT, fleurs: ["#FF6A5A", "#FFE070", "#FFFFFF", "#7AA8FF"], densiteFleurs: 0.08 }, decor: ["chene", "buisson", "buisson"], densite: 0.02, taille: 2, palette: { a: "#2E6A28", b: "#4C8E38", c: "#7AB850", t: "#6A4428", u: "#4A2E1A" } },
      ] },
    falaises: { graine: 11, nuages: 6, particules: "papillons", ciel: ["#7FB6EA", "#B9DAF4", "#EAF4FA"], astre: { x: 0.8, y: 0.2, r: 0.05, couleur: "#FFFBEA" },
      couches: [
        { base: 0.66, amplitude: 0.36, aspect: "falaises", rugosite: 1, couleur: "#E3E7EB", veines: true, cascade: { x: 0.36, l: 5, bas: 0.84 } },
        { base: 0.78, amplitude: 0.26, aspect: "falaises", rugosite: 1.3, couleur: "#C2C9D1", veines: true },
        { eau: "#5EA2D8", niveau: 0.84 },
        { base: 0.88, amplitude: 0.08, rugosite: 1, couleur: "#7EB060", herbe: { ...VERT, fleurs: ["#FFFFFF", "#FFFFFF", "#FFE070"], densiteFleurs: 0.07 }, decor: ["sapin", "buisson"], densite: 0.025, palette: { a: "#3E6A3A", b: "#5E8A50", c: "#86B46A", t: "#5A4030" } },
        { base: 0.99, amplitude: 0.05, rugosite: 1.4, couleur: "#6AA050", herbe: { ...VERT, fleurs: ["#FFFFFF"] }, decor: ["rocher", "buisson"], densite: 0.02, taille: 2, palette: { r: "#D8DDE2", l: "#F4F6F8", a: "#3E7A34", b: "#5FA046", c: "#86C25A" } },
      ] },
    jungle: { graine: 17, particules: "lucioles", ciel: ["#8EC8B0", "#BEE2C8", "#E8F4DC"], finCiel: 0.7, nuages: 3, couleurNuage: "#F4FFF4",
      couches: [
        { base: 0.64, amplitude: 0.32, aspect: "pics", rugosite: 1.2, couleur: "#8CB8A0" },
        { base: 0.72, amplitude: 0.16, rugosite: 1, couleur: "#4E8A50", foret: { a: "#3A7040", b: "#4A8448", c: "#64A05A" }, pyramide: { x: 0.5, h: 0.22, couleur: "#9C9A80", mousse: "#5E8E48" }, cascade: { x: 0.8, l: 5, bas: 0.86 } },
        { eau: "#3E9AA0", niveau: 0.86 },
        { base: 0.9, amplitude: 0.1, rugosite: 1.3, couleur: "#2E6A32", herbe: { a: "#225A28", b: "#3A7E36", c: "#5EA246", fleurs: ["#FF5A8A", "#FFB040"] }, decor: ["jungle", "fougere"], densite: 0.025, taille: 2, palette: { a: "#1E5A26", b: "#2E7A32", c: "#52A042", t: "#5A3A22", u: "#3A2414", v: "#3E8A30" } },
        { base: 1.02, amplitude: 0.06, rugosite: 1.6, couleur: "#1E4E24", herbe: { a: "#16401C", b: "#2A6A2C", c: "#4A9038", fleurs: ["#FF5A8A"] }, decor: ["fougere", "buisson", "jungle"], densite: 0.02, taille: 3, palette: { a: "#164A1C", b: "#2A6E2A", c: "#4A963A", t: "#4A2E1A", u: "#2E1C10", v: "#3E8A30" } },
      ] },
    lunaire: { graine: 21, etoiles: 0.006, particules: "lucioles", ciel: ["#120F33", "#2E2360", "#6B4C9A", "#B48CC8"], astre: { x: 0.25, y: 0.24, r: 0.06, couleur: "#F1E9FF", lune: true },
      couches: [
        { base: 0.66, amplitude: 0.22, rugosite: 1, couleur: "#4A3A7E", foret: { a: "#3E2E70", b: "#4C3C84", c: "#6A58A8" } },
        { base: 0.78, amplitude: 0.12, rugosite: 1.1, couleur: "#3A2C68", decor: "lunaire", densite: 0.05, palette: { v: "#7E5CC0", l: "#A685E8", w: "#E8E2F4" } },
        { base: 0.9, amplitude: 0.08, rugosite: 1.3, couleur: "#2C2458", herbe: { a: "#241C4C", b: "#3A3070", c: "#5A4C9A", fleurs: ["#C6A6FF", "#8FE8FF"], densiteFleurs: 0.06 }, decor: "lunaire", densite: 0.035, taille: 2, palette: { v: "#9C74E0", l: "#C6A6FF", w: "#F2EEFA" } },
        { base: 0.99, amplitude: 0.04, rugosite: 1.6, couleur: "#18122F", decor: "cristal", densite: 0.025, taille: 2, palette: { p: "#9A5CE8", l: "#D4A8FF", w: "#FFFFFF" } },
      ] },
    caldeira: { graine: 31, particules: "braises", ciel: ["#1C0B0B", "#4A1712", "#9B3418", "#E07A2E"], astre: { x: 0.5, y: 0.86, r: 0.13, couleur: "#FF9A3C" },
      couches: [
        { base: 0.72, amplitude: 0.36, aspect: "pics", rugosite: 1, couleur: "#3A1C18", cratere: { x: 0.5, l: 0.2 }, lac: { x: 0.5, l: 0.36, couleur: "#FFA030", lueur: true, prof: 0.11 } },
        { base: 0.92, amplitude: 0.08, rugosite: 1.3, couleur: "#271310", lave: true },
        { base: 1.0, amplitude: 0.06, rugosite: 1.5, couleur: "#170B09", lave: true, decor: "rocher", densite: 0.03, taille: 2, palette: { r: "#0E0605", l: "#3A1A10" } },
      ] },
    sakuras: { graine: 41, particules: "petales", nuages: 4, ciel: ["#F4C6D6", "#FBE2EA", "#FFF4F0"], astre: { x: 0.82, y: 0.26, r: 0.05, couleur: "#FFFFFF" },
      couches: [
        { base: 0.66, amplitude: 0.26, aspect: "pics", rugosite: 1, couleur: "#C8B8D0", neige: true },
        { base: 0.76, amplitude: 0.12, rugosite: 1.1, couleur: "#8EBA7E", foret: { a: "#5E9A5A", b: "#6EA866", c: "#86BC78" }, decor: "sakura", densite: 0.06, palette: { a: "#F0A2BC", b: "#FFCADA", c: "#D8849E", t: "#6B4A3A" }, torii: 0.62, echelleTorii: 2 },
        { eau: "#7EB8E0", niveau: 0.85 },
        { base: 0.88, amplitude: 0.08, rugosite: 1.1, couleur: "#7AB06A", herbe: { a: "#4E8A44", b: "#6EA65A", c: "#94C878", fleurs: ["#F8A8C4", "#FFFFFF"], densiteFleurs: 0.07 }, decor: "sakura", densite: 0.035, palette: { a: "#F4A6BE", b: "#FFD0DE", c: "#D8849E", t: "#6B4A3A" } },
        { base: 0.99, amplitude: 0.05, rugosite: 1.3, couleur: "#6AA45A", herbe: { a: "#3E7A36", b: "#5A9A48", c: "#86BE68", fleurs: ["#F8A8C4"] }, decor: ["sakura", "buisson"], densite: 0.02, taille: 2, palette: { a: "#F28AAE", b: "#FFC2D6", c: "#D06A8E", t: "#5B3C2E" } },
      ] },
    abysses: { graine: 51, particules: "bulles", rayons: true, ciel: ["#3DA4D8", "#1B6FA8", "#0D3D6E", "#061B36"], finCiel: 1,
      couches: [
        { base: 0.8, amplitude: 0.18, rugosite: 1, couleur: "#0B3159", algues: 0.12, couleurAlgue: "#1F6E5A" },
        { base: 0.9, amplitude: 0.12, rugosite: 1.3, couleur: "#07203F", algues: 0.18, couleurAlgue: "#2A8A6A", decor: "corail", densite: 0.03, taille: 2, palette: { c: "#E8607A" } },
        { base: 1.0, amplitude: 0.06, rugosite: 1.6, couleur: "#041228", decor: ["rocher", "corail"], densite: 0.03, taille: 2, palette: { r: "#020A18", l: "#0E2846", c: "#F0A040" } },
      ] },
    desert: { graine: 61, ciel: ["#E9B872", "#F4D59A", "#FBEAC6"], astre: { x: 0.26, y: 0.32, r: 0.08, couleur: "#FFF6DA" },
      couches: [
        { base: 0.72, amplitude: 0.12, aspect: "dunes", rugosite: 1, couleur: "#E4B97C", pyramide: { x: 0.68, h: 0.22, couleur: "#D9A866" } },
        { base: 0.8, amplitude: 0.12, aspect: "dunes", rugosite: 1, couleur: "#D6A160" },
        { base: 0.88, amplitude: 0.12, aspect: "dunes", rugosite: 1, couleur: "#C99256", lac: { x: 0.8, l: 0.3, couleur: "#4EA6C8", prof: 0.035 }, decor: "palmier", densite: 0.012, taille: 2, palette: { b: "#4E8A34", c: "#7EB84E", t: "#8A6038" } },
        { base: 0.96, amplitude: 0.08, aspect: "dunes", rugosite: 1, couleur: "#C38A4A", decor: "cactus", densite: 0.01, taille: 2, palette: { g: "#4E7A34", l: "#7DAA4E" } },
        { base: 1.02, amplitude: 0.05, aspect: "dunes", rugosite: 1, couleur: "#A9713A" },
      ] },
    boreale: { graine: 71, particules: "neige", etoiles: 0.003, aurore: ["#5CF2B0", "#4FA8F0"], ciel: ["#0E1A3A", "#24406E", "#5E7CA8", "#9DB4D2"],
      couches: [
        { base: 0.66, amplitude: 0.3, aspect: "pics", rugosite: 1, couleur: "#8FA2C0", neige: true },
        { base: 0.76, amplitude: 0.1, rugosite: 1, couleur: "#C8D6E6", decor: "sapinNeige", densite: 0.14, palette: { a: "#355858", b: "#4A6E6E", n: "#F4F8FF", t: "#4A3428" } },
        { base: 0.84, amplitude: 0.12, rugosite: 1.1, couleur: "#DCE6F2", decor: "sapinNeige", densite: 0.06, palette: { a: "#2C4A4A", b: "#3E6262", n: "#F4F8FF", t: "#4A3428" } },
        { base: 0.96, amplitude: 0.08, rugosite: 1.3, couleur: "#F0F4FA", decor: "sapinNeige", densite: 0.035, taille: 2, palette: { a: "#203A3A", b: "#335454", n: "#FFFFFF", t: "#3E2C22" } },
      ] },
    grottes: { graine: 81, particules: "lucioles", minerais: 0.0007, ciel: ["#3A3640", "#2E2B34", "#24222A"], finCiel: 1,
      plafond: { couleur: "#4A4652", base: 0.16, amplitude: 0.16, stalactites: 0.05 },
      couches: [
        { base: 0.8, amplitude: 0.14, rugosite: 1.3, couleur: "#55505E", stalagmites: 0.03, decor: ["cristal", "champignon"], densite: 0.035, palette: { p: "#7A4AD0", l: "#B38AF0", w: "#F0E6FF", c: "#5FE0C8", t: "#C8C0B0" }, lac: { x: 0.7, l: 0.3, couleur: "#FF8A2A", lueur: true, prof: 0.04 } },
        { base: 0.94, amplitude: 0.08, rugosite: 1.6, couleur: "#3E3A46", stalagmites: 0.02, decor: ["champignon", "cristal", "rocher"], densite: 0.03, taille: 2, palette: { p: "#9A5CE8", l: "#D4A8FF", w: "#FFFFFF", c: "#7AF0D0", t: "#D8D0C0", r: "#2E2A34" } },
      ] },
    marais: { graine: 91, particules: "spores", ciel: ["#141A16", "#26302A", "#3E4A3A", "#5E6A48"], astre: { x: 0.7, y: 0.3, r: 0.07, couleur: "#C8E0A0", lune: true },
      couches: [
        { base: 0.74, amplitude: 0.12, rugosite: 1, couleur: "#2C362C", decor: "mort", densite: 0.03, palette: { k: "#1A201A" } },
        { base: 0.86, amplitude: 0.1, rugosite: 1.3, couleur: "#1E261E", decor: "mort", densite: 0.025, taille: 2, palette: { k: "#101410" }, lac: { x: 0.5, l: 0.9, couleur: "#3E5A2A", prof: 0.03 } },
        { base: 0.98, amplitude: 0.05, rugosite: 1.6, couleur: "#111611", decor: "mort", densite: 0.006, taille: 3, palette: { k: "#080A08" } },
      ] },
    lande: { graine: 101, etoiles: 0.005, particules: "lucioles", ciel: ["#0C0E26", "#1E1A44", "#3A2C5E", "#5A3E70"], astre: { x: 0.2, y: 0.28, r: 0.05, couleur: "#F4EEFF", lune: true },
      couches: [
        { base: 0.74, amplitude: 0.16, rugosite: 1, couleur: "#3A2A56" },
        { base: 0.86, amplitude: 0.1, rugosite: 1.2, couleur: "#2C2046", decor: "bruyere", densite: 0.22, palette: { p: "#7A3E8A", l: "#B06AC0", g: "#2A3A2A" } },
        { base: 0.98, amplitude: 0.06, rugosite: 1.5, couleur: "#1C1430", decor: "bruyere", densite: 0.16, taille: 2, palette: { p: "#8E4AA0", l: "#C884D8", g: "#1E2C1E" } },
      ] },
    prairie: { graine: 121, particules: "papillons", nuages: 7, ciel: ["#6AA8EC", "#A6D0F4", "#E2F2FC"], astre: { x: 0.18, y: 0.22, r: 0.05, couleur: "#FFF8D8" },
      couches: [
        { base: 0.6, amplitude: 0.3, aspect: "pics", rugosite: 1, couleur: "#9CAAC8", neige: true },
        { base: 0.74, amplitude: 0.14, rugosite: 1.1, couleur: "#78A866", foret: { a: "#4E8048", b: "#5E9452", c: "#7AAE64" } },
        { base: 0.86, amplitude: 0.1, rugosite: 1.2, couleur: "#6EAA4E", herbe: { ...VERT, fleurs: ["#B88AE8", "#FFE070", "#FFFFFF"], densiteFleurs: 0.1 }, decor: ["bouleau", "buisson"], densite: 0.02, palette: { a: "#3A7A30", b: "#5A9C42", c: "#86C25A", w: "#ECE8DC", k: "#2A2A2A" } },
        { base: 0.99, amplitude: 0.05, rugosite: 1.5, couleur: "#5A9A40", herbe: { ...VERT, fleurs: ["#B88AE8", "#FF6A5A", "#FFE070"], densiteFleurs: 0.12 }, decor: "buisson", densite: 0.015, taille: 2, palette: { a: "#2E6A28", b: "#4C8E38", c: "#7AB850" } },
      ] },
    steppe: { graine: 111, particules: "braises", ciel: ["#1A0C10", "#4A1A1C", "#A33C22", "#F08A3A"], astre: { x: 0.5, y: 0.82, r: 0.1, couleur: "#FFB35C" },
      couches: [
        { base: 0.8, amplitude: 0.18, rugosite: 1, aspect: "pics", couleur: "#3A1A1A" },
        { base: 0.9, amplitude: 0.1, rugosite: 1.2, couleur: "#2A1210", lave: true, decor: "mort", densite: 0.02, palette: { k: "#140808" } },
        { base: 1.0, amplitude: 0.05, rugosite: 1.5, couleur: "#160A08", lave: true },
      ] },
  };

  const BIOMES = [
    { id: "plaines", nom: "Plaines", texte: "Prairies ondulantes, bosquets de chênes, haies bocagères et hameaux. Le cœur paisible du royaume.", boss: "Kriger", portrait: "kriger", creatures: "Villageois, gobelins, rats" },
    { id: "falaises", nom: "Falaises blanches", texte: "De grandes parois éclatantes de calcite, des cascades, et des replats d'herbe semés de fleurs blanches.", boss: "Minotaure", portrait: "lr_minotaur", creatures: "Nains, golems, rats pestiférés" },
    { id: "jungle", nom: "Jungle ancestrale", texte: "Arbres géants et lianes, cascades, et des temples engloutis par la mousse.", boss: "Roi des ents", portrait: "ent_king", creatures: "Ents, sylvains, kobolds" },
    { id: "lunaire", nom: "Forêt lunaire", texte: "Un bois elfique au crépuscule éternel. Troncs blancs, feuillages violets, et des cristaux d'améthyste qui luisent au sol.", boss: "Druidesse elfe", portrait: "elven_druid", creatures: "Elfes, sylvains, hydres du Vide" },
    { id: "sakuras", nom: "Vallée des sakuras", texte: "Cerisiers étagés, tapis de pétales roses, bambous et mousse, nénuphars sur l'eau limpide.", boss: "Hana", portrait: "hana", creatures: "Esprits, fées, kitsunes" },
    { id: "caldeira", nom: "Caldeira", texte: "Un cratère de basalte noir, des lacs de lave contenus, des orgues de basalte. La lumière y est rouge, l'air chargé d'étincelles.", boss: "Flamental", portrait: "flamental", creatures: "Démons, faucheurs, élémentaires" },
    { id: "abysses", nom: "Abysses", texte: "Un océan profond. Des forêts de kelp géant, des ossements de léviathan, et des cheminées de magma qui crachent des colonnes de bulles.", boss: "Kraken", portrait: "kraken", creatures: "Pirates, crabes, léviathans" },
    { id: "desert", nom: "Désert", texte: "Un désert écrasé de chaleur, des oasis de palmiers. Le tombeau d'Anubis attend quelque part sous le sable.", boss: "Anubis", portrait: "lr_anubis", creatures: "Momies, scorpions, scolopendres" },
    { id: "boreale", nom: "Forêt boréale", texte: "Épicéas enneigés, bouleaux tordus, clairières de congères. Des hurlements de loups, au loin.", boss: "Yéti", portrait: "lr_yeti", creatures: "Vikings, loups, wendigos" },
  ];

  window.Pixel = { monter, image, THEMES, BIOMES,
    // outils partagés avec le monde en frise (monde.js)
    outils: { Toile, SPRITES, sprite, lueur, rgb, mix, ton, alea, bruit, palette, BAYER, ANIM, dessinerAnim, PARTICULES } };
})();
