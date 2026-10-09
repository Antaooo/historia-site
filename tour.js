// La Tour, en pixel art : quarante étages qu'on gravit en faisant défiler la page. On part du sol, on traverse une mer
// de nuages, on arrive au sommet sous les étoiles. Les fenêtres s'allument étage par étage, un balcon à bannières
// marque chaque dizaine, un brasier brûle au sommet.
// Tour.monter(scene) puis Tour.maj(progression 0…1) au défilement ; Tour.animer(t) à chaque image.
"use strict";
(() => {
  const { Toile, rgb, ton, mix, alea, bruit, BAYER, lueur, sprite } = Pixel.outils;
  const N = 40, HE = 20, BASE = 58, SOMMET = 74, TH = N * HE + BASE + SOMMET, TW = 150, CX = 75;
  const yBas = i => TH - BASE - i * HE; // bas de l'étage i (0 = premier étage au-dessus du rez-de-chaussée)
  const largeur = i => Math.round(60 - i * 0.36) & ~1;
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

  // ---------- la tour (dessinée une fois) ----------
  function dessinerTour() {
    const t = new Toile(TW, TH), r = alea(40), fenetres = [], feux = [];
    const pierre = rgb("#9A90A6"), joint = rgb("#3E3448"), mousse = rgb("#5E8A3A");
    const mur = (x, y, x0, w, i) => { // un pixel de maçonnerie, éclairé par la gauche comme un cylindre
      const rang = Math.floor(y / 3), dx = x - x0 + (rang % 2) * 3;
      if (y % 3 === 0 || dx % 6 === 0) return ton(joint, (x - x0) / w < 0.3 ? 0.1 : 0);
      const u = (x - x0) / w, lum = 0.16 - Math.pow(Math.abs(u - 0.32) * 1.5, 1.6) * 0.5;
      let c = ton(pierre, lum + (hash(Math.floor(dx / 6), rang) - 0.5) * 0.12);
      if (i < 8 && hash(x, y) < 0.22 * (1 - i / 8)) c = ton(mousse, lum * 0.5);
      return c;
    };
    // rez-de-chaussée : socle large, grande porte en arc éclairée, marches et torches
    { const w = 76, x0 = CX - w / 2, y0 = TH - BASE;
      for (let y = y0; y < TH - 6; y++) for (let x = x0; x < x0 + w; x++) t.px(x, y, mur(x, y, x0, w, 0));
      for (let k = 0; k < 4; k++) t.rect(x0 - 2 - k * 3, TH - 6 + k * 2 - 6, w + 4 + k * 6, 2, ton(pierre, -0.1 - k * 0.04)); // marches
      const pw = 16, ph = 26, px0 = CX - pw / 2, py0 = TH - 12 - ph;
      for (let y = py0; y < TH - 12; y++) for (let x = px0; x < px0 + pw; x++) { const dy = y - py0, dxc = Math.abs(x - CX + 0.5); if (dy < 8 && dxc > Math.sqrt(64 - (8 - dy) * (8 - dy)) ) continue; t.px(x, y, mix(rgb("#FFC46A"), rgb("#B4561E"), (y - py0) / ph)); }
      for (let x = px0 - 2; x < px0 + pw + 2; x++) t.px(x, TH - 12, ton(pierre, -0.3));
      lueur(t, CX, TH - 22, 16, [255, 196, 106], 0.25);
      for (const tx of [x0 + 8, x0 + w - 9]) { t.rect(tx, TH - 34, 2, 8, [70, 50, 34]); feux.push({ x: tx + 1, y: TH - 36, r: 2 }); }
      // corniche du socle
      t.rect(x0 - 3, y0 - 3, w + 6, 3, ton(pierre, 0.1)); for (let x = x0 - 3; x < x0 + w + 3; x += 4) t.rect(x, y0 - 6, 2, 3, ton(pierre, 0.05)); }
    // les quarante étages
    for (let i = 0; i < N; i++) {
      const w = largeur(i), x0 = CX - w / 2, yb = yBas(i), yt = yb - HE;
      for (let y = yt; y < yb; y++) for (let x = x0; x < x0 + w; x++) t.px(x, y, mur(x, y, x0, w, i));
      // cordon de pierre à chaque étage, plus saillant tous les cinq
      const sail = i % 5 === 4 ? 2 : 1; t.rect(x0 - sail, yt, w + 2 * sail, 2, ton(pierre, 0.14)); t.rect(x0 - sail, yt + 2, w + 2 * sail, 1, ton(joint, 0.1));
      // fenêtres en arc : une au centre, deux de plus tous les cinq étages
      const fx = [CX]; if (i % 5 === 2) fx.push(CX - Math.round(w * 0.3), CX + Math.round(w * 0.3));
      for (const cx of fx) { const fw = 5, fh = 9, fx0 = cx - 2, fy0 = yt + 6;
        t.rect(fx0 - 1, fy0 - 1, fw + 2, fh + 2, ton(pierre, -0.25)); for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { if (y === 0 && (x === 0 || x === fw - 1)) continue; t.px(fx0 + x, fy0 + y, [26, 21, 54]); }
        t.rect(fx0 - 1, fy0 + fh + 1, fw + 2, 1, ton(pierre, 0.2)); fenetres.push({ i: i + 1, x: fx0, y: fy0, w: fw, h: fh }); }
      // balcon crénelé à chaque dizaine, bannières de part et d'autre
      if (i % 10 === 9) { const bw = w + 18, bx = CX - bw / 2, by = yt - 4;
        for (let k = 0; k < 4; k++) t.rect(bx + 3 + k, by + 4 + k, bw - 6 - 2 * k, 1, ton(pierre, -0.12 - k * 0.05)); // encorbellement
        t.rect(bx, by, bw, 4, ton(pierre, 0.08)); for (let x = bx; x < bx + bw; x += 4) t.rect(x, by - 4, 2, 4, ton(pierre, 0.12));
        for (const cote of [-1, 1]) { const bx0 = cote < 0 ? bx + 3 : bx + bw - 10, rouge = rgb("#B83A2E"), or = rgb("#F2C14E");
          for (let y = 0; y < 22; y++) for (let x = 0; x < 7; x++) { if (y > 17 && Math.abs(x - 3) < y - 17) continue; t.px(bx0 + x, by + 8 + y, x === 0 || x === 6 ? or : ton(rouge, x < 3 ? 0.08 : -0.06)); }
          t.rect(bx0 + 2, by + 13, 3, 3, or); t.rect(bx0 - 1, by + 7, 9, 1, [70, 50, 34]); }
        feux.push({ x: bx + 1, y: by - 6, r: 2 }, { x: bx + bw - 2, y: by - 6, r: 2 }); }
    }
    // couronne crénelée et brasier du sommet
    { const w = largeur(N - 1) + 14, x0 = CX - w / 2, y0 = yBas(N - 1) - HE;
      for (let k = 0; k < 5; k++) t.rect(x0 + 5 + k, y0 - 2 + k, w - 10 - 2 * k, 1, ton(pierre, -0.1 - k * 0.05));
      for (let y = y0 - 12; y < y0 - 2; y++) for (let x = x0; x < x0 + w; x++) t.px(x, y, mur(x, y, x0, w, N));
      for (let x = x0; x < x0 + w; x += 5) t.rect(x, y0 - 18, 3, 6, ton(pierre, 0.1));
      const by = y0 - 18; t.rect(CX - 6, by - 6, 12, 6, [60, 52, 64]); t.rect(CX - 8, by - 8, 16, 2, [90, 80, 96]);
      feux.push({ x: CX, y: by - 10, r: 6, brasier: true }); lueur(t, CX, by - 14, 22, [255, 190, 90], 0.12); }
    return { canvas: t.toile(), fenetres, feux };
  }

  // ---------- le sol au pied de la tour, les nuages, les étoiles ----------
  function dessinerSol(l) {
    const h = 70, t = new Toile(l, h), n = bruit(7), r = alea(8), herbe = rgb("#6FA84A");
    const pal = { a: rgb("#2F6A2C"), b: rgb("#4E8E3C"), c: rgb("#7AB850"), t: rgb("#5A3A22"), u: rgb("#3E2816") };
    const haut = Array.from({ length: l }, (_, x) => Math.round(h * 0.42 + (n(x / 18) - 0.5) * 14));
    for (let x = 0; x < l; x++) for (let y = haut[x]; y < h; y++) t.px(x, y, y === haut[x] ? ton(herbe, 0.15) : y - haut[x] < 3 ? herbe : ton(rgb("#7A5A3C"), -(y - haut[x]) / 120));
    for (let x = 4; x < l - 4; x++) if (Math.abs(x - l / 2) > 50 && r() < 0.05) sprite(t, r() < 0.5 ? "chene" : "sapin", x, haut[x] + 2, 1, pal);
    return t.toile();
  }
  function dessinerNuages(l, h, bandes, alpha) {
    const t = new Toile(l, h), r = alea(Math.round(h + l));
    for (const [yc, ep, densite] of bandes) for (let k = 0; k < l * densite; k++) {
      const x0 = r() * l | 0, y = yc + (r() - 0.5) * ep | 0, w = 16 + r() * 40 | 0, c = [255, 255, 255];
      t.rect(x0, y + 3, w, 6, c, alpha); t.rect(x0 + 4, y, w * 0.55 | 0, 4, c, alpha); t.rect(x0 + (w * 0.5 | 0), y + 1, w * 0.35 | 0, 3, c, alpha); t.rect(x0, y + 9, w, 1, [210, 218, 236], alpha);
    }
    return t.toile();
  }
  function dessinerEtoiles(l, h) {
    const t = new Toile(l, h), r = alea(99);
    for (let k = 0; k < l * h * 0.004; k++) { const x = r() * l | 0, y = r() * h | 0, c = r() > 0.8 ? [255, 236, 190] : [230, 236, 255]; t.px(x, y, c, 0.5 + r() * 0.5); if (r() > 0.94) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) t.px(x + dx, y + dy, c, 0.4); }
    return t.toile();
  }

  // ---------- montage et mise à jour ----------
  let el = null, k = 1, ty0 = 0, ty1 = 0, cTour, ctx, T, monde, nuagesLoin, nuagesProches, etoiles, sol, e = 1, q = 0, compteur, paliers;
  const CIEL = [[rgb("#7DB4F0"), rgb("#D4EAFA")], [rgb("#4E7CD6"), rgb("#A8CCF0")], [rgb("#2E3C8E"), rgb("#F0B072")]]; // jour, altitude, crépuscule doré au sommet
  const ciel = q => { const f = q * 2, i = Math.min(1, Math.floor(f)), u = f - i; return [mix(CIEL[i][0], CIEL[i + 1][0], u), mix(CIEL[i][1], CIEL[i + 1][1], u)].map(c => `rgb(${c.map(Math.round).join(",")})`); };

  function monter(scene) {
    el = scene.querySelector(".tour-scene"); compteur = scene.querySelector("#etage"); paliers = [...scene.querySelectorAll(".tour-paliers i")];
    const vh = el.clientHeight, vw = el.clientWidth; k = Math.max(2, vh / 300);
    T = T || dessinerTour();
    el.innerHTML = "";
    const L = Math.ceil(vw / k) + 2, xTour = vw > 900 ? 0.66 : 0.5;
    etoiles = Object.assign(dessinerEtoiles(L, Math.ceil(vh / k)), { className: "tour-etoiles" });
    nuagesLoin = Object.assign(dessinerNuages(L, TH, [[TH * 0.55, 150, 0.16], [TH * 0.5, 60, 0.1], [TH * 0.34, 70, 0.025]], 0.8), { className: "tour-nuages" });
    monde = document.createElement("div"); monde.className = "tour-monde";
    sol = Object.assign(dessinerSol(L), { className: "tour-sol" });
    cTour = T.canvas; cTour.className = "tour-pierre";
    const calque = document.createElement("canvas"); calque.width = TW; calque.height = TH; calque.className = "tour-pierre"; ctx = calque.getContext("2d");
    nuagesProches = Object.assign(dessinerNuages(L, TH, [[TH * 0.5, 180, 0.03]], 0.6), { className: "tour-nuages tour-nuages-proches" });
    for (const c of [etoiles, nuagesLoin, monde, nuagesProches]) el.appendChild(c);
    monde.append(sol, cTour, calque);
    const px = v => `${v}px`;
    for (const c of [etoiles]) { c.style.width = px(L * k); c.style.height = px(c.height * k); }
    for (const c of [nuagesLoin, nuagesProches]) { c.style.width = px(L * k); c.style.height = px(TH * k); }
    monde.style.height = px(TH * k);
    for (const c of [cTour, calque]) { c.style.width = px(TW * k); c.style.height = px(TH * k); c.style.left = px(vw * xTour - TW * k / 2); }
    sol.style.width = px(L * k); sol.style.height = px(sol.height * k); sol.style.top = px((TH - sol.height + 8) * k);
    ty0 = vh - TH * k; ty1 = vh * 0.1;
    maj(q, true);
  }

  function maj(p, force) {
    if (!el) return; q = p;
    const ty = ty0 + (ty1 - ty0) * q, vh = el.clientHeight;
    monde.style.transform = `translate3d(0,${ty}px,0)`;
    nuagesLoin.style.transform = `translate3d(0,${ty * 0.7 + vh * 0.12}px,0)`;
    nuagesProches.style.transform = `translate3d(0,${ty * 1.35 - vh * 0.35}px,0)`;
    etoiles.style.opacity = Math.max(0, Math.min(1, (q - 0.5) / 0.4));
    const [haut, bas] = ciel(q); el.style.setProperty("--ciel-haut", haut); el.style.setProperty("--ciel-bas", bas);
    // l'étage courant suit la montée : 1 au pied, 40 au sommet
    const n = Math.max(1, Math.min(N, Math.round(q * (N - 1)) + 1));
    if (n !== e || force) { e = n; compteur.textContent = e; paliers.forEach((pi, j) => pi.classList.toggle("atteint", e >= (j + 1) * 10)); }
  }

  // fenêtres allumées jusqu'à l'étage courant, celle de l'étage courant palpite ; torches et brasier
  function animer(t) {
    if (!ctx) return; ctx.clearRect(0, 0, TW, TH);
    for (const f of T.fenetres) { if (f.i > e) continue; const courant = f.i === e, v = courant ? 0.75 + 0.25 * Math.sin(t * 0.006) : 0.85;
      ctx.fillStyle = `rgba(255,${courant ? 236 : 206},${courant ? 150 : 110},${v})`; ctx.fillRect(f.x, f.y + 1, f.w, f.h - 1); ctx.fillRect(f.x + 1, f.y, f.w - 2, 1);
      if (courant) { ctx.fillStyle = "rgba(255,214,120,.18)"; ctx.fillRect(f.x - 3, f.y - 3, f.w + 6, f.h + 6); } }
    for (const f of T.feux) { const vif = !f.brasier || e >= N, n = f.brasier ? 14 : 5;
      for (let j = 0; j < n; j++) { const a = hash(j, Math.floor(t / 90) + f.x), dx = Math.round((a - 0.5) * f.r * 2), h = Math.round(hash(j + 7, Math.floor(t / 90)) * f.r * 2.4);
        ctx.fillStyle = j % 3 === 0 ? "rgba(255,240,170,.95)" : "rgba(255,140,40,.9)"; if (vif) ctx.fillRect(f.x + dx, f.y - h, 1, h + 1); }
      if (f.brasier && vif) { const g = ctx.createRadialGradient(f.x, f.y - 4, 1, f.x, f.y - 4, 22 + Math.sin(t * 0.008) * 2); g.addColorStop(0, "rgba(255,200,100,.45)"); g.addColorStop(1, "rgba(255,160,60,0)"); ctx.fillStyle = g; ctx.fillRect(f.x - 26, f.y - 30, 52, 52); } }
  }

  window.Tour = { monter, maj, animer };
})();
