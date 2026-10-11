// La Tour, en pixel art : cent étages, un boss à chacun. On la découvre du sommet, dans l'orage, jusqu'à la porte au sol :
// la tour défile dans le même sens que la page. Le ciel passe de la nuit d'orage au plein jour, la pierre du granit moussu
// à l'obsidienne runique, un balcon à bannières marque chaque dizaine, des tourelles s'accrochent aux étages 25, 50 et 75,
// un cristal brûle au sommet, la foudre frappe et un dragon tourne autour de la flèche.
// Tour.monter(scene) puis Tour.maj(progression 0…1) au défilement ; Tour.animer(t) à chaque image.
"use strict";
(() => {
  const { Toile, rgb, ton, mix, alea, bruit, lueur, sprite } = Pixel.outils;
  const N = 100, HE = 14, BASE = 64, SOMMET = 170, TH = N * HE + BASE + SOMMET, TW = 300, CX = 150;
  const yBas = i => TH - BASE - i * HE; // bas de l'étage i (0 = premier étage au-dessus du rez-de-chaussée)
  const largeur = i => Math.round(66 - i * 0.24) & ~1;
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  // une teinte de pierre et une couleur de bannière par dizaine d'étages
  const PIERRES = ["#A09686", "#9A92A0", "#9090A6", "#8688A8", "#7C7FA6", "#70709E", "#636090", "#545080", "#45406C", "#352E54"].map(rgb);
  const BANNIERES = ["#B83A2E", "#2E6FB8", "#3E8E3A", "#C08A2E", "#7A3AB8", "#2E9AA0", "#B83A7A", "#C0662A", "#4A4AB8", "#E0B040"].map(rgb);
  const OR = rgb("#F2C14E"), JOINT = rgb("#2A2236"), MOUSSE = rgb("#5E8A3A");

  // ---------- la tour (dessinée une fois) ----------
  function dessinerTour() {
    const t = new Toile(TW, TH), fenetres = [], feux = [], runes = [];
    const mur = (x, y, x0, w, i) => { // un pixel de maçonnerie, éclairé par la gauche comme un cylindre
      const pierre = PIERRES[Math.min(9, Math.max(0, Math.floor(i / 10)))], rang = Math.floor(y / 3), dx = x - x0 + (rang % 2) * 3;
      const u = (x - x0) / w, lum = 0.16 - Math.pow(Math.abs(u - 0.32) * 1.5, 1.6) * 0.5;
      if (y % 3 === 0 || dx % 6 === 0) return ton(JOINT, lum * 0.6);
      let c = ton(pierre, lum + (hash(Math.floor(dx / 6), rang) - 0.5) * 0.12);
      if (i < 12 && hash(x, y) < 0.26 * (1 - i / 12)) c = ton(MOUSSE, lum * 0.5);
      return c;
    };
    // rez-de-chaussée : socle large, grande porte en arc éclairée, marches, torches
    { const w = 80, x0 = CX - w / 2, y0 = TH - BASE;
      for (let y = y0; y < TH - 6; y++) for (let x = x0; x < x0 + w; x++) t.px(x, y, mur(x, y, x0, w, 0));
      for (let k = 0; k < 4; k++) t.rect(x0 - 2 - k * 3, TH - 12 + k * 2, w + 4 + k * 6, 2, ton(PIERRES[0], -0.1 - k * 0.04));
      const pw = 18, ph = 30, px0 = CX - pw / 2, py0 = TH - 12 - ph;
      for (let y = py0; y < TH - 12; y++) for (let x = px0; x < px0 + pw; x++) { const dy = y - py0, dxc = Math.abs(x - CX + 0.5); if (dy < 9 && dxc > Math.sqrt(81 - (9 - dy) * (9 - dy))) continue; t.px(x, y, mix(rgb("#FFC46A"), rgb("#B4561E"), (y - py0) / ph)); }
      for (let x = px0 - 2; x < px0 + pw + 2; x++) t.px(x, TH - 12, ton(PIERRES[0], -0.3));
      lueur(t, CX, TH - 24, 18, [255, 196, 106], 0.25);
      for (const tx of [x0 + 8, x0 + w - 9]) { t.rect(tx, TH - 36, 2, 8, [70, 50, 34]); feux.push({ x: tx + 1, y: TH - 38, r: 2 }); }
      t.rect(x0 - 3, y0 - 3, w + 6, 3, ton(PIERRES[0], 0.1)); for (let x = x0 - 3; x < x0 + w + 3; x += 4) t.rect(x, y0 - 6, 2, 3, ton(PIERRES[0], 0.05)); }
    // les cent étages
    for (let i = 0; i < N; i++) {
      const w = largeur(i), x0 = CX - w / 2, yb = yBas(i), yt = yb - HE, tier = Math.floor(i / 10), pierre = PIERRES[tier];
      for (let y = yt; y < yb; y++) for (let x = x0; x < x0 + w; x++) t.px(x, y, mur(x, y, x0, w, i));
      const sail = i % 5 === 4 ? 2 : 1; t.rect(x0 - sail, yt, w + 2 * sail, 2, ton(pierre, 0.16)); t.rect(x0 - sail, yt + 2, w + 2 * sail, 1, ton(JOINT, 0.1));
      // fenêtres en arc : une au centre, deux de plus tous les cinq étages
      const fx = [CX]; if (i % 5 === 2) fx.push(CX - Math.round(w * 0.3), CX + Math.round(w * 0.3));
      for (const cx of fx) { const fw = 4, fh = 7, fx0 = cx - 2, fy0 = yt + 4;
        t.rect(fx0 - 1, fy0 - 1, fw + 2, fh + 2, ton(pierre, -0.3)); for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { if (y === 0 && (x === 0 || x === fw - 1)) continue; t.px(fx0 + x, fy0 + y, [22, 18, 46]); }
        fenetres.push({ i: i + 1, x: fx0, y: fy0, w: fw, h: fh }); }
      // runes gravées dans l'obsidienne des derniers étages
      if (i >= 80) for (let k = 0; k < 3; k++) { const rx = x0 + 3 + Math.floor(hash(i, k) * (w - 6)), ry = yt + 3 + Math.floor(hash(k, i) * (HE - 6)); if (Math.abs(rx - CX) > 4) runes.push({ x: rx, y: ry, p: hash(i * 3, k) * 6.28 }); }
      // tourelles accrochées aux étages 25, 50 et 75
      if (i === 24 || i === 49 || i === 74) for (const cote of [-1, 1]) {
        const tw = 12, tx0 = cote < 0 ? x0 - tw - 1 : x0 + w + 1, tb = yb, th = HE * 5;
        for (let k = 0; k < 6; k++) t.rect(tx0 + (cote < 0 ? k + 2 : 0), tb + k, tw - k - 2, 1, ton(pierre, -0.15 - k * 0.04)); // encorbellement
        for (let y = tb - th; y < tb; y++) for (let x = tx0; x < tx0 + tw; x++) t.px(x, y, mur(x, y, tx0, tw, i));
        t.rect(tx0 + 4, tb - th + 14, 4, 6, [22, 18, 46]); fenetres.push({ i: i + 1, x: tx0 + 4, y: tb - th + 14, w: 4, h: 6 });
        for (let k = 0; k < 16; k++) { const lw = Math.max(1, Math.round((tw + 4) * (1 - k / 16))); t.rect(tx0 + tw / 2 - lw / 2, tb - th - k - 1, lw, 1, ton(rgb("#3A3458"), k < 3 ? 0.1 : -0.05 * (k % 2))); }
        t.rect(tx0 + tw / 2 - 1, tb - th - 20, 2, 4, OR); }
      // balcon crénelé à chaque dizaine, bannières à la couleur de la dizaine
      if (i % 10 === 9) { const bw = w + 20, bx = CX - bw / 2, by = yt - 4, ban = BANNIERES[tier];
        for (let k = 0; k < 4; k++) t.rect(bx + 3 + k, by + 4 + k, bw - 6 - 2 * k, 1, ton(pierre, -0.12 - k * 0.05));
        t.rect(bx, by, bw, 4, ton(pierre, 0.08)); for (let x = bx; x < bx + bw; x += 4) t.rect(x, by - 4, 2, 4, ton(pierre, 0.12));
        for (const cote of [-1, 1]) { const bx0 = cote < 0 ? bx + 3 : bx + bw - 10;
          for (let y = 0; y < 22; y++) for (let x = 0; x < 7; x++) { if (y > 17 && Math.abs(x - 3) < y - 17) continue; t.px(bx0 + x, by + 8 + y, x === 0 || x === 6 ? OR : ton(ban, x < 3 ? 0.1 : -0.08)); }
          t.rect(bx0 + 2, by + 13, 3, 3, OR); t.rect(bx0 - 1, by + 7, 9, 1, [70, 50, 34]); }
        feux.push({ x: bx + 1, y: by - 6, r: 2 }, { x: bx + bw - 2, y: by - 6, r: 2 }); }
    }
    // couronne crénelée, flèche d'obsidienne cerclée d'or, cristal au sommet
    const yc = yBas(N - 1) - HE;
    { const w = largeur(N - 1) + 16, x0 = CX - w / 2;
      for (let k = 0; k < 5; k++) t.rect(x0 + 5 + k, yc - 2 + k, w - 10 - 2 * k, 1, ton(PIERRES[9], -0.1 - k * 0.05));
      for (let y = yc - 12; y < yc - 2; y++) for (let x = x0; x < x0 + w; x++) t.px(x, y, mur(x, y, x0, w, 99));
      for (let x = x0; x < x0 + w; x += 5) t.rect(x, yc - 18, 3, 6, ton(PIERRES[9], 0.12));
      const hf = 110, base = yc - 18, larg = 30;
      for (let k = 0; k < hf; k++) { const lw = Math.max(1, Math.round(larg * Math.pow(1 - k / hf, 1.25))), xl = CX - lw / 2;
        for (let x = 0; x < lw; x++) t.px(xl + x, base - k, ton(rgb("#241C3A"), x < lw * 0.35 ? 0.12 : -0.08));
        if (k % 14 === 7) t.rect(xl, base - k, lw, 1, OR); }
      feux.push({ x: CX - 12, y: yc - 22, r: 2 }, { x: CX + 12, y: yc - 22, r: 2 });
      lueur(t, CX, base - hf - 4, 26, [190, 140, 255], 0.16); }
    return { canvas: t.toile(), fenetres, feux, runes, cristal: { x: CX, y: yc - 18 - 110 - 6 } };
  }

  // ---------- le sol au pied de la tour, les nuages, les étoiles ----------
  function dessinerSol(l) {
    const h = 70, t = new Toile(l, h), n = bruit(7), r = alea(8), herbe = rgb("#6FA84A");
    const pal = { a: rgb("#2F6A2C"), b: rgb("#4E8E3C"), c: rgb("#7AB850"), t: rgb("#5A3A22"), u: rgb("#3E2816") };
    const haut = Array.from({ length: l }, (_, x) => Math.round(h * 0.42 + (n(x / 18) - 0.5) * 14));
    for (let x = 0; x < l; x++) for (let y = haut[x]; y < h; y++) t.px(x, y, y === haut[x] ? ton(herbe, 0.15) : y - haut[x] < 3 ? herbe : ton(rgb("#7A5A3C"), -(y - haut[x]) / 120));
    for (let x = 4; x < l - 4; x++) if (Math.abs(x - l / 2) > 60 && r() < 0.05) sprite(t, r() < 0.5 ? "chene" : "sapin", x, haut[x] + 2, 1, pal);
    return t.toile();
  }
  function dessinerNuages(l, h, bandes, alpha, couleur = [255, 255, 255], ombre = [210, 218, 236]) {
    const t = new Toile(l, h), r = alea(Math.round(h + l + couleur[0]));
    for (const [yc, ep, densite] of bandes) for (let k = 0; k < l * densite; k++) {
      const x0 = r() * l | 0, y = yc + (r() - 0.5) * ep | 0, w = 16 + r() * 40 | 0;
      t.rect(x0, y + 3, w, 6, couleur, alpha); t.rect(x0 + 4, y, w * 0.55 | 0, 4, couleur, alpha); t.rect(x0 + (w * 0.5 | 0), y + 1, w * 0.35 | 0, 3, couleur, alpha); t.rect(x0, y + 9, w, 1, ombre, alpha);
    }
    return t.toile();
  }
  function dessinerEtoiles(l, h) {
    const t = new Toile(l, h), r = alea(99);
    for (let k = 0; k < l * h * 0.004; k++) { const x = r() * l | 0, y = r() * h | 0, c = r() > 0.8 ? [255, 236, 190] : [230, 236, 255]; t.px(x, y, c, 0.5 + r() * 0.5); if (r() > 0.94) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) t.px(x + dx, y + dy, c, 0.4); }
    return t.toile();
  }

  // ---------- montage et mise à jour ----------
  let el = null, k = 1, ty0 = 0, ty1 = 0, ctx, T, monde, nuagesLoin, nuagesProches, etoiles, eclair, e = N, q = 0, compteur, paliers, decLoin = 0, decProches = 0, gauche = 0;
  // nuit d'orage au sommet, ciel d'altitude au milieu, plein jour à la porte
  const CIEL = [[rgb("#0C0920"), rgb("#3A2A5E")], [rgb("#2E4E9E"), rgb("#8AB4E6")], [rgb("#6AA8EC"), rgb("#F4E2B4")]];
  const ciel = q => { const f = q * 2, i = Math.min(1, Math.floor(f)), u = f - i; return [mix(CIEL[i][0], CIEL[i + 1][0], u), mix(CIEL[i][1], CIEL[i + 1][1], u)].map(c => `rgb(${c.map(Math.round).join(",")})`); };

  function monter(scene) {
    el = scene.querySelector(".tour-scene"); compteur = scene.querySelector("#etage"); paliers = [...scene.querySelectorAll(".tour-paliers i")];
    const vh = el.clientHeight, vw = el.clientWidth; k = Math.max(2, vh / 300);
    T = T || dessinerTour();
    el.innerHTML = "";
    const L = Math.ceil(vw / k) + 2, xTour = vw > 900 ? 0.66 : 0.5;
    etoiles = Object.assign(dessinerEtoiles(L, Math.ceil(vh / k)), { className: "tour-etoiles" });
    nuagesLoin = Object.assign(dessinerNuages(L, TH, [[TH * 0.5, 160, 0.16], [TH * 0.45, 60, 0.1], [TH * 0.72, 90, 0.04]], 0.8), { className: "tour-nuages" });
    monde = document.createElement("div"); monde.className = "tour-monde";
    const orage = Object.assign(dessinerNuages(L, 260, [[40, 70, 0.22], [120, 80, 0.12]], 0.85, [58, 48, 92], [30, 24, 52]), { className: "tour-orage" });
    const sol = Object.assign(dessinerSol(L), { className: "tour-sol" });
    const pierre = T.canvas; pierre.className = "tour-pierre";
    const calque = document.createElement("canvas"); calque.width = TW; calque.height = TH; calque.className = "tour-pierre"; ctx = calque.getContext("2d");
    nuagesProches = Object.assign(dessinerNuages(L, TH, [[TH * 0.55, 200, 0.03]], 0.6), { className: "tour-nuages tour-nuages-proches" });
    eclair = document.createElement("div"); eclair.className = "tour-eclair";
    for (const c of [etoiles, nuagesLoin, monde, nuagesProches, eclair]) el.appendChild(c);
    monde.append(orage, sol, pierre, calque);
    const px = v => `${v}px`;
    etoiles.style.width = px(L * k); etoiles.style.height = px(etoiles.height * k);
    for (const c of [nuagesLoin, nuagesProches]) { c.style.width = px(L * k); c.style.height = px(TH * k); }
    orage.style.width = px(L * k); orage.style.height = px(260 * k); orage.style.top = px(-40 * k);
    monde.style.height = px(TH * k);
    gauche = vw * xTour - TW * k / 2;
    for (const c of [pierre, calque]) { c.style.width = px(TW * k); c.style.height = px(TH * k); c.style.left = px(gauche); }
    sol.style.width = px(L * k); sol.style.height = px(sol.height * k); sol.style.top = px((TH - sol.height + 8) * k);
    // le sommet en haut de l'écran au départ, la porte en bas de l'écran à la fin
    ty0 = vh * 0.03; ty1 = vh - TH * k;
    // les nuages croisent le milieu de l'écran à mi-parcours, chacun à sa vitesse
    const tyM = (ty0 + ty1) / 2;
    decLoin = vh / 2 - tyM * 0.6 - TH * 0.5 * k; decProches = vh / 2 - tyM * 1.3 - TH * 0.55 * k;
    maj(q, true);
  }

  function maj(p, force) {
    if (!el) return; q = p;
    const ty = ty0 + (ty1 - ty0) * q;
    monde.style.transform = `translate3d(0,${ty}px,0)`;
    nuagesLoin.style.transform = `translate3d(0,${ty * 0.6 + decLoin}px,0)`;
    nuagesProches.style.transform = `translate3d(0,${ty * 1.3 + decProches}px,0)`;
    etoiles.style.opacity = Math.max(0, 1 - q / 0.3);
    const [haut, bas] = ciel(q); el.style.setProperty("--ciel-haut", haut); el.style.setProperty("--ciel-bas", bas);
    // l'étage affiché suit la descente : 100 au sommet, 1 à la porte
    const n = Math.max(1, Math.min(N, Math.round(N - q * (N - 1))));
    if (n !== e || force) { e = n; compteur.textContent = e; paliers.forEach(pi => pi.classList.toggle("atteint", Number(pi.textContent) >= e)); }
  }

  // le dragon : silhouette en pixels, ailes battantes (deux images)
  const DRAGON = [
    ["......X..........", ".....XXX.....XX..", "XX..XXXXX..XXXX..", ".XXXXXXXXXXXXXRXX", "..XXXXXXXXXXXX...", "....XX...XX......"],
    [".................", "...........XX....", "....XXXXX.XXXX...", "XXXXXXXXXXXXXXRXX", "..XXXXXXXXXXXX...", "...XX.....XX....."],
  ];
  function animer(t) {
    if (!ctx) return; ctx.clearRect(0, 0, TW, TH);
    // fenêtres : allumées depuis le sommet jusqu'à l'étage affiché, celle de l'étage affiché palpite
    for (const f of T.fenetres) { if (f.i < e) continue; const courant = f.i === e, v = courant ? 0.75 + 0.25 * Math.sin(t * 0.006) : 0.85;
      ctx.fillStyle = `rgba(255,${courant ? 236 : 206},${courant ? 150 : 110},${v})`; ctx.fillRect(f.x, f.y + 1, f.w, f.h - 1); ctx.fillRect(f.x + 1, f.y, f.w - 2, 1);
      if (courant) { ctx.fillStyle = "rgba(255,214,120,.2)"; ctx.fillRect(f.x - 3, f.y - 3, f.w + 6, f.h + 6); } }
    // runes et cristal : lueur violette qui respire
    for (const r of T.runes) { const a = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.0015 + r.p)); ctx.fillStyle = `rgba(190,140,255,${a.toFixed(2)})`; ctx.fillRect(r.x, r.y, 2, 1); ctx.fillRect(r.x, r.y + 1, 1, 2); }
    { const c = T.cristal, a = 0.7 + 0.3 * Math.sin(t * 0.004), g = ctx.createRadialGradient(c.x, c.y, 1, c.x, c.y, 26);
      g.addColorStop(0, `rgba(210,170,255,${(0.55 * a).toFixed(2)})`); g.addColorStop(1, "rgba(160,110,255,0)"); ctx.fillStyle = g; ctx.fillRect(c.x - 28, c.y - 28, 56, 56);
      ctx.fillStyle = "#F4E8FF"; ctx.fillRect(c.x - 1, c.y - 7, 2, 12); ctx.fillStyle = "#C8A0FF"; ctx.fillRect(c.x - 3, c.y - 4, 2, 7); ctx.fillRect(c.x + 1, c.y - 4, 2, 7); ctx.fillStyle = "#8A5AD8"; ctx.fillRect(c.x - 2, c.y + 4, 4, 2); }
    // torches et braseros
    for (const f of T.feux) for (let j = 0; j < 5; j++) { const a = hash(j, Math.floor(t / 90) + f.x), dx = Math.round((a - 0.5) * f.r * 2), h = Math.round(hash(j + 7, Math.floor(t / 90)) * f.r * 2.4);
      ctx.fillStyle = j % 3 === 0 ? "rgba(255,240,170,.95)" : "rgba(255,140,40,.9)"; ctx.fillRect(f.x + dx, f.y - h, 1, h + 1); }
    // le dragon tourne autour de la flèche
    { const a = t * 0.00035, dx = Math.cos(a), x = Math.round(CX + dx * 118), y = Math.round(T.cristal.y + 60 + Math.sin(a * 2) * 14 + Math.sin(a) * 20), img = DRAGON[Math.floor(t / 200) % 2];
      const versDroite = -Math.sin(a) > 0;
      img.forEach((l, j) => [...l].forEach((ch, i) => { if (ch === ".") return; ctx.fillStyle = ch === "R" ? "#FF4A3A" : "#120C1E"; ctx.fillRect(versDroite ? x + (i - 8) * 2 : x + (8 - i) * 2, y + j * 2, 2, 2); })); }
    // la foudre : un éclair toutes les quelques secondes, près du sommet
    const periode = 3400, ph = (t % periode) / periode, num = Math.floor(t / periode);
    if (ph < 0.05) { const x0 = 20 + hash(num, 1) * 260; let x = x0, y = 0; ctx.fillStyle = "#F4F0FF";
      while (y < T.cristal.y + 50) { const ny = y + 4 + Math.floor(hash(num, y) * 6), nx = x + Math.round((hash(y, num) - 0.5) * 8); for (let yy = y; yy < ny; yy++) ctx.fillRect(Math.round(x + (nx - x) * (yy - y) / (ny - y)), yy, 1, 1); x = nx; y = ny; } }
    eclair.style.opacity = ph < 0.03 && q < 0.35 ? (0.35 * (1 - q / 0.35)).toFixed(2) : "0";
  }

  window.Tour = { monter, maj, animer };
})();
