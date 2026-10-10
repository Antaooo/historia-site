// Page d'accueil : présentation interactive (monde en frise, créatures, peuples, légendes, progression, Tour).
"use strict";
(() => {
  const { $, $$, calme, couchesDe, surDefilement, surBoucle } = Historia;
  const borne = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lisse = t => 1 - Math.pow(1 - t, 3);
  const fmt = n => n.toLocaleString("fr-FR").replace(/ | /g, " ");

  /* ---------- I · le monde : une seule frise continue, vue en coupe (monde.js), une infobulle par biome ---------- */
  const piste = $("#piste"), points = $("#points-biomes"), monde = $("#monde"), bulle = $("#infobulle"), courant = $("#monde-courant");
  const M = Pixel.monde, BIOMES = M.BIOMES, NB = BIOMES.length;
  // teinte de la fenêtre de la légende : l'herbe du biome, ou sa brume
  const teinte = b => b.herbe || b.brume;
  points.innerHTML = BIOMES.map((b, i) => `<button type="button" class="point-biome" data-i="${i}" aria-label="Aller à : ${b.nom}" aria-current="${b.id === "plaines"}"><span>${b.nom}</span></button>`).join("");
  const pts = [...points.children], fleches = $$("[data-biome]");
  let off = 0, ech = 1, R = null, couches = [], sol = null, ctxAnim = null, ctxPart = null, ctxReflet = null, particules = null, reperes = [];
  let ouverte = -1, glisse = false, mondeVisible = false, dernierAnim = -1e9, dims = [0, 0];
  const vue = () => monde.clientWidth, total = () => M.W * ech;
  const borneOff = o => borne(o, 0, Math.max(0, total() - vue()));
  const toile = (l, h, classe) => { const cv = document.createElement("canvas"); cv.width = l; cv.height = h; cv.className = classe; return cv; };
  const taille = cv => { cv.style.width = `${cv.width * ech}px`; cv.style.height = `${cv.height * ech}px`; };

  // construction (et reconstruction au redimensionnement) : une toile par couche, le sol et ses calques dans un même groupe
  function construire() {
    const garde = R ? off / ech : null; // première fois : on s'ouvre sur les plaines, le cœur du royaume
    // sur téléphone, le monde est dézoomé pour voir plus d'un biome ; le haut de l'écran se remplit avec le ciel de chaque biome
    const hauteur = monde.clientHeight; dims = [vue(), hauteur]; ech = hauteur / M.H; if (vue() < 700) ech = Math.min(ech, vue() / 130);
    const reste = Math.max(0, hauteur - M.H * ech), bas = Math.round(Math.min(220, reste * 0.45)), decal = Math.round(reste - bas); // le sol remonte au-dessus des commandes
    R = M.rendre(Math.ceil(vue() / ech));
    piste.innerHTML = ""; couches = [];
    if (decal) { const haut = toile(M.W, 1, "monde-couche"); haut.getContext("2d").drawImage(R.couches[0].canvas, 0, 0, M.W, 1, 0, 0, M.W, 1);
      haut.style.width = `${M.W * ech}px`; haut.style.height = `${decal + 2}px`; piste.appendChild(haut); couches.push({ el: haut, s: 1 }); }
    for (const c of R.couches) { c.canvas.className = "monde-couche"; taille(c.canvas); c.canvas.style.top = `${decal}px`; piste.appendChild(c.canvas); couches.push({ el: c.canvas, s: c.s }); }
    if (bas) { const hl = Math.ceil(bas / ech) + 1, roche = toile(M.W, hl, "monde-couche"), solC = R.couches[R.couches.length - 1].canvas, c = roche.getContext("2d");
      for (let y = 0; y < hl; y += 16) c.drawImage(solC, 0, M.H - 16, M.W, 16, 0, y, M.W, 16); // la roche des profondeurs, répétée
      taille(roche); roche.style.top = `${decal + M.H * ech - 1}px`; piste.appendChild(roche); couches.push({ el: roche, s: 1 }); }
    sol = document.createElement("div"); sol.className = "monde-sol"; sol.style.width = `${M.W * ech}px`;
    const anim = toile(M.W, M.H, "monde-couche"), part = toile(M.W, M.H, "monde-couche"), reflet = toile(M.W, M.H, "monde-couche monde-reflet");
    [anim, part, reflet].forEach(cv => { taille(cv); cv.style.top = `${decal}px`; sol.appendChild(cv); });
    ctxAnim = anim.getContext("2d"); ctxPart = part.getContext("2d"); ctxReflet = reflet.getContext("2d");
    sol.insertAdjacentHTML("beforeend", BIOMES.map((b, i) => `<button type="button" class="repere" data-i="${i}" aria-describedby="infobulle" aria-expanded="false" style="left:${(M.debuts[i] + b.l / 2) * ech}px"><span>${b.nom}</span></button>`).join(""));
    piste.appendChild(sol); couches.push({ el: sol, s: 1 });
    reperes = [...sol.querySelectorAll(".repere")];
    reperes.forEach((r, i) => { r.addEventListener("focus", () => montrer(i)); r.addEventListener("blur", () => { if (!monde.matches(":hover")) cacher(); }); });
    particules = M.creerParticules();
    Pixel.outils.dessinerAnim(ctxAnim, R.anims, 0); particules(ctxPart, 0, 0, M.W);
    const o = ouverte; ouverte = -1; if (o >= 0) montrer(o);
    monde.classList.add("glisse"); { const k = BIOMES.findIndex(b => b.id === "plaines"); aller(garde === null ? (M.debuts[k] + BIOMES[k].l / 2) * ech - vue() / 2 : garde * ech); } requestAnimationFrame(() => monde.classList.remove("glisse"));
  }

  function aller(o) {
    off = borneOff(o);
    for (const c of couches) c.el.style.transform = `translate3d(${-off * c.s}px,0,0)`;
    const centre = R ? M.indexA((off + vue() / 2) / ech) : 0;
    pts.forEach((p, k) => p.setAttribute("aria-current", k === centre));
    if (courant.textContent !== BIOMES[centre].nom) courant.textContent = BIOMES[centre].nom;
    fleches[0].disabled = off <= 1; fleches[1].disabled = !R || off >= borneOff(1e9) - 1;
    if (ouverte >= 0) placer(ouverte);
  }
  const pas = s => aller(off + s * vue() * 0.85);

  // la vie du monde : eau, lave, cascades et fumées environ 10 fois par seconde, particules à chaque image, seulement à l'écran
  surBoucle.push(t => {
    if (!R || !mondeVisible) return;
    const xa = Math.floor(off / ech) - 2, xb = Math.ceil((off + vue()) / ech) + 2;
    ctxPart.clearRect(xa, 0, xb - xa, M.H); particules(ctxPart, t, xa, xb);
    if (t - dernierAnim > 100) { dernierAnim = t; ctxAnim.clearRect(0, 0, M.W, M.H); Pixel.outils.dessinerAnim(ctxAnim, R.anims, t); }
  });
  new IntersectionObserver(es => { mondeVisible = es.some(e => e.isIntersecting); }).observe(monde);

  // surbrillance du biome : les autres s'assombrissent, un liseré doré suit son relief et ses frontières dentelées
  function surligner(k) {
    const c = ctxReflet; c.clearRect(0, 0, M.W, M.H); if (k < 0) return;
    const a0 = M.debuts[k], b0 = a0 + BIOMES[k].l;
    c.fillStyle = "rgba(10,8,24,.45)";
    for (let y = 0; y < M.H; y++) { const d = M.decalage(y), a = a0 - d, b = b0 - d; if (a > 0) c.fillRect(0, y, a, 1); if (b < M.W) c.fillRect(b, y, M.W - b, 1); }
    c.fillStyle = "rgba(255,214,110,.95)";
    for (let x = Math.max(0, a0 - 8); x < Math.min(M.W, b0 + 8); x++) if (M.biomeA(x, M.surf[x]) === k) c.fillRect(x, M.surf[x] - 1, 1, 1);
    c.fillStyle = "rgba(255,214,110,.55)";
    for (let y = 0; y < M.H; y++) { const d = M.decalage(y); if (y < M.surf[Math.max(0, Math.min(M.W - 1, a0 - d))] && y < M.surf[Math.max(0, Math.min(M.W - 1, b0 - d - 1))]) continue; c.fillRect(a0 - d, y, 1, 1); c.fillRect(b0 - d - 1, y, 1, 1); }
  }

  // infobulle : nom, description, légende du biome dans sa fenêtre, créatures
  function remplir(i) {
    const b = BIOMES[i];
    bulle.style.setProperty("--c", teinte(b));
    bulle.innerHTML = `<figure class="fenetre-boss bulle-boss"><img src="img/boss/p_${b.portrait}.webp" alt="" width="320" height="320"></figure>
      <div class="bulle-texte"><p class="bulle-num">${String(i + 1).padStart(2, "0")} / ${String(NB).padStart(2, "0")}</p><h3>${b.nom}</h3>
      <p>${b.texte}</p><p class="bulle-legende">Légende · <b>${b.boss}</b></p><p class="bulle-creatures">${b.creatures}</p></div>`;
  }
  // l'infobulle se pose sous le repère du biome, sans sortir de l'écran ni couvrir le fil des chapitres
  function placer(i) {
    if (!reperes[i]) return;
    const V = vue(), l = bulle.offsetWidth, cx = (M.debuts[i] + BIOMES[i].l / 2) * ech - off, haut = reperes[i].offsetTop + reperes[i].offsetHeight;
    const gauche = borne(cx - l / 2, 16, V - l - (V > 1000 ? 96 : 16));
    bulle.style.left = `${gauche}px`; bulle.style.top = `${haut + 14}px`;
    bulle.style.setProperty("--fleche", `${borne(cx - gauche, 24, l - 24)}px`);
  }
  function montrer(i) {
    if (i === ouverte || !R) return;
    if (ouverte >= 0 && reperes[ouverte]) reperes[ouverte].setAttribute("aria-expanded", "false");
    ouverte = i; remplir(i); reperes[i].setAttribute("aria-expanded", "true"); surligner(i); ctxReflet.canvas.classList.add("visible");
    bulle.hidden = false; placer(i); requestAnimationFrame(() => bulle.classList.add("visible"));
  }
  function cacher() {
    if (ouverte < 0) return;
    if (reperes[ouverte]) reperes[ouverte].setAttribute("aria-expanded", "false");
    ouverte = -1; bulle.classList.remove("visible"); if (ctxReflet) ctxReflet.canvas.classList.remove("visible");
  }
  bulle.addEventListener("transitionend", e => { if (e.propertyName === "opacity" && ouverte < 0) bulle.hidden = true; });
  const biomeSous = x => M.indexA((x - monde.getBoundingClientRect().left + off) / ech);

  // survol à la souris : le biome sous le curseur s'éclaire et montre son infobulle
  const horsFrise = ".monde-commandes, .monde-wiki, .monde-entete, .infobulle";
  monde.addEventListener("pointermove", e => { if (e.pointerType === "mouse" && !glisse && R && !e.target.closest(horsFrise)) montrer(biomeSous(e.clientX)); });
  monde.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") cacher(); });
  addEventListener("keydown", e => { if (e.key === "Escape") cacher(); });

  // glisser (souris ou doigt) ; un toucher sans glisser ouvre ou ferme l'infobulle du biome touché
  let x0 = 0, off0 = 0, bouge = false;
  piste.addEventListener("pointerdown", e => { glisse = true; bouge = false; x0 = e.clientX; off0 = off; piste.setPointerCapture(e.pointerId); });
  piste.addEventListener("pointermove", e => {
    if (!glisse) return;
    if (!bouge && Math.abs(e.clientX - x0) > 6) { bouge = true; monde.classList.add("glisse"); if (e.pointerType === "mouse") cacher(); }
    if (bouge) aller(off0 - (e.clientX - x0));
  });
  const lacher = e => {
    if (!glisse) return; glisse = false; monde.classList.remove("glisse");
    if (!bouge && e.pointerType !== "mouse") { const i = biomeSous(e.clientX); i === ouverte ? cacher() : montrer(i); }
  };
  piste.addEventListener("pointerup", lacher); piste.addEventListener("pointercancel", lacher);
  piste.addEventListener("click", e => { if (bouge) { e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse" && !monde.contains(e.target)) cacher(); });
  // pavé tactile : défilement horizontal
  let roue;
  monde.addEventListener("wheel", e => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault(); monde.classList.add("glisse"); aller(off + e.deltaX);
    clearTimeout(roue); roue = setTimeout(() => monde.classList.remove("glisse"), 120);
  }, { passive: false });

  pts.forEach((p, k) => p.addEventListener("click", () => { aller((M.debuts[k] + BIOMES[k].l / 2) * ech - vue() / 2); montrer(k); }));
  fleches.forEach(b => b.addEventListener("click", () => { cacher(); pas(Number(b.dataset.biome)); }));
  let attenteMonde;
  addEventListener("resize", () => { clearTimeout(attenteMonde); attenteMonde = setTimeout(() => { if (!R) return; if (Math.abs(monde.clientHeight - dims[1]) > 40 || Math.abs(vue() - dims[0]) > 40) construire(); else aller(off); }, 250); });

  /* ---------- III · les peuples : leurs boss en grand, leurs troupes en dessous ---------- */
  const PEUPLES = window.PEUPLES;
  const bannieres = $("#bannieres");
  bannieres.innerHTML = PEUPLES.map(([nom, c, terres, boss, troupes]) => `
    <article class="banniere" role="listitem" style="--c:${c}" aria-label="${nom}">
      <div class="banniere-face">
        <h3 class="banniere-nom">${nom}</h3>
        <p class="banniere-terres">${terres}</p>
        <div class="banniere-boss${boss.length > 1 ? " deux" : ""}">${boss.map(([p, n]) => `<figure class="fenetre-boss banniere-fenetre"><img src="img/boss/p_${p}.webp" alt="" loading="lazy" width="320" height="320"><figcaption>${n}</figcaption></figure>`).join("")}</div>
        <p class="banniere-troupes-titre">Leurs troupes</p>
        <ul class="banniere-troupes${troupes.length < 3 ? " peu" : ""}">${troupes.map(([p, n]) => `<li><span class="troupe-image"><img src="img/sbires/${p}.webp" alt="" loading="lazy" width="160" height="160"></span><span class="troupe-nom">${n}</span></li>`).join("")}</ul>
      </div>
    </article>`).join("");
  // les flèches ne servent que si la rangée déborde de l'écran
  const peuplesTient = () => $("#peuples").classList.toggle("tient", bannieres.scrollWidth <= bannieres.clientWidth + 2);
  addEventListener("resize", peuplesTient); addEventListener("load", peuplesTient); peuplesTient();
  $$("[data-peuple]").forEach(b => b.addEventListener("click", () => {
    const pas = bannieres.firstElementChild.offsetWidth + 20;
    bannieres.scrollBy({ left: Number(b.dataset.peuple) * pas * Math.max(1, Math.floor(bannieres.clientWidth / pas) - 1), behavior: calme ? "auto" : "smooth" });
  }));

  /* ---------- II · mosaïque des créatures ---------- */
  const PORTRAITS = ["lr_minotaur", "medusa", "phoenix", "lr_yeti", "lr_anubis", "kraken", "cerberus", "tiamat", "azriel", "nightharrow_wendigo", "lr_gryffin", "wu", "flamental", "capra", "elven_druid", "mega_warden", "hana", "demon_of_chaos_gama05", "megalodon", "glume", "skog", "oblivion", "voras", "zahar", "mortos", "lillith", "wolfebersahd", "koboldassassin", "magnus", "kriger", "ent_king"];
  const mosaique = $("#mosaique");
  mosaique.innerHTML = Array.from({ length: 60 }, (_, i) => { const k = (i * 7) % PORTRAITS.length, p = PORTRAITS[k], cache = k % 3 !== 0; return `<span class="tuile${cache ? " cachee" : ""}" style="--d:${((i * 37) % 60) / 60}"><img src="img/boss/mini/p_${p}.webp" alt="" loading="lazy" width="120" height="120"></span>`; }).join("");
  const compteur = $("#compteur");

  /* ---------- IV · légendes (carrousel manuel) ---------- */
  const LEGENDES = [
    ["lr_minotaur", "Le Minotaure", "Gardien du labyrinthe", "Falaises blanches", 1250, "#D8C9A6"],
    ["medusa", "Méduse", "Reine au regard de pierre", "Falaises côtières", 1000, "#7FD3C4"],
    ["phoenix", "Le Phénix", "Celui qui renaît des cendres", "Sources ardentes", 1250, "#FF8A3D"],
    ["lr_yeti", "Le Yéti", "Terreur des neiges", "Forêt boréale", 1250, "#A9D2FF"],
    ["lr_anubis", "Anubis", "Juge des morts", "Désert", 1000, "#F2C35B"],
    ["kraken", "Le Kraken", "L'ombre sous la coque", "Abysses", 500, "#3E8BD8"],
    ["cerberus", "Cerbère", "Le chien aux trois gueules", "Steppe embrasée", 1000, "#FF5A3A"],
    ["tiamat", "Tiamat", "Mère des dragons", "Grottes de cristal", 1250, "#C08BFF"],
    ["azriel", "Azriel", "Ange de la mort", "Bois hanté", 1250, "#9AA3B8"],
    ["nightharrow_wendigo", "Le Wendigo", "La faim qui marche", "Taïga ancienne", 900, "#B7C7B0"],
    ["wu", "Wu", "Maître de l'encre", "Bambouseraie brumeuse", 1000, "#9FD3A4"],
    ["flamental", "Flamental", "Cœur de la caldeira", "Caldeira", 1444, "#FFB03A"],
  ];
  const sel = $("#selecteur"), img = $("#boss-image"); let il = 0;
  sel.innerHTML = LEGENDES.map((l, i) => `<button type="button" role="tab" class="vignette" aria-selected="${i === 0}" aria-label="${l[1]}" style="--c:${l[5]}"><img src="img/boss/mini/p_${l[0]}.webp" alt="" width="68" height="68" loading="lazy"></button>`).join("");
  const vignettes = [...sel.children];
  function legende(i, focus) {
    il = (i + LEGENDES.length) % LEGENDES.length; const [p, nom, titre, lieu, pv, c] = LEGENDES[il];
    vignettes.forEach((v, k) => { v.setAttribute("aria-selected", k === il); v.tabIndex = k === il ? 0 : -1; });
    sel.scrollTo({ left: vignettes[il].offsetLeft - sel.clientWidth / 2 + 42, behavior: calme ? "auto" : "smooth" });
    if (focus) vignettes[il].focus({ preventScroll: true });
    img.classList.add("change");
    setTimeout(() => { img.src = `img/boss/p_${p}.webp`; img.alt = nom; img.classList.remove("change"); }, calme ? 0 : 220);
    $("#fiche-lien").href = `bestiaire.html#boss-${p}`; $("#fiche-nom").textContent = nom; $("#fiche-titre").textContent = titre; $("#fiche-lieu").textContent = lieu; $("#fiche-pv").textContent = fmt(pv);
    $("#fiche-danger").style.width = `${Math.round(borne(pv / 1500) * 100)}%`;
    document.documentElement.style.setProperty("--legende", c);
  }
  vignettes.forEach((v, i) => v.addEventListener("click", () => legende(i)));
  $$("[data-pas]").forEach(b => b.addEventListener("click", () => legende(il + Number(b.dataset.pas))));
  sel.addEventListener("keydown", e => { if (e.key === "ArrowRight") { legende(il + 1, true); e.preventDefault(); } if (e.key === "ArrowLeft") { legende(il - 1, true); e.preventDefault(); } });
  let lx = null; const zone = $(".scene-boss");
  zone.addEventListener("pointerdown", e => { lx = e.clientX; });
  zone.addEventListener("pointerup", e => { if (lx !== null && Math.abs(e.clientX - lx) > 50) legende(il + (e.clientX < lx ? 1 : -1)); lx = null; });

  /* ---------- V · progression : carte carrée façon carte de Minecraft ---------- */
  const carte = $("#carte"), cctx = carte.getContext("2d"), curseur = $("#niveau"), N = 161, C = 80, BPX = 125; // 125 blocs par pixel, ±10 000 blocs
  const fond = (() => { // terrain vu du dessus, couleurs et ombrage des cartes de Minecraft
    const al = (x, y, g) => { let h = (x * 374761393 + y * 668265263 + g * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
    const br = (x, y, g, e) => { const x0 = Math.floor(x / e), y0 = Math.floor(y / e), fx = x / e - x0, fy = y / e - y0, l = t => t * t * (3 - 2 * t), a = al(x0, y0, g), b = al(x0 + 1, y0, g), c = al(x0, y0 + 1, g), dd = al(x0 + 1, y0 + 1, g); return a + (b - a) * l(fx) + (c - a) * l(fy) + (a - b - c + dd) * l(fx) * l(fy); };
    const haut = (x, y) => br(x, y, 1, 22) * 0.6 + br(x, y, 2, 9) * 0.3 + br(x, y, 3, 4) * 0.1 + 0.12 - Math.max(0, Math.hypot(x - C, y - C) - 70) * 0.01;
    const img = cctx.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const e = haut(x, y), hum = br(x, y, 7, 18), chaud = br(x, y, 9, 30);
      let c = e < 0.42 ? [64, 96, 210] : e < 0.45 ? [222, 210, 150] : e > 0.78 ? [235, 240, 248] : e > 0.68 ? [128, 128, 132] : chaud > 0.66 && hum < 0.45 ? [214, 196, 122] : hum > 0.55 ? [40, 118, 40] : [112, 168, 56];
      if (Math.abs(x - C) < 4 && Math.abs(y - C) < 4) c = [112, 168, 56];
      const k = e < 0.42 ? (e < 0.36 ? 0.78 : 0.9) : haut(x, y) > haut(x, y - 1) + 0.004 ? 1 : haut(x, y) < haut(x, y - 1) - 0.004 ? 0.72 : 0.86;
      const i = (y * N + x) * 4; img.data[i] = c[0] * k; img.data[i + 1] = c[1] * k; img.data[i + 2] = c[2] * k; img.data[i + 3] = 255;
    }
    return img;
  })();
  const BOSS_CARTE = Array.from({ length: 22 }, (_, i) => { const a = i * 2.39996, d = 10 + ((i * 37) % 70); return [Math.round(C + Math.cos(a) * d), Math.round(C + Math.sin(a) * d)]; });
  function majNiveau() {
    const n = Number(curseur.value), portee = Math.max(2, Math.round(n * 100 / BPX));
    cctx.putImageData(fond, 0, 0);
    const im = cctx.getImageData(0, 0, N, N), dt = im.data;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = Math.max(Math.abs(x - C), Math.abs(y - C)), i = (y * N + x) * 4;
      if (d > portee) { const g = (dt[i] + dt[i + 1] + dt[i + 2]) / 3; for (let k = 0; k < 3; k++) dt[i + k] = (dt[i + k] * 0.35 + g * 0.65) * 0.38; }
      if (d > 0 && d % 4 === 0) { const fort = d % 20 === 0 ? 0.55 : 0.82; for (let k = 0; k < 3; k++) dt[i + k] *= fort; }
      if (d === portee + 1 && (x + y) % 2 === 0) { dt[i] = 255; dt[i + 1] = 214; dt[i + 2] = 90; }
    }
    cctx.putImageData(im, 0, 0);
    // capitale
    cctx.fillStyle = "#F4F0E6"; cctx.fillRect(C - 2, C - 2, 5, 5); cctx.fillStyle = "#8A8478"; cctx.fillRect(C - 2, C + 2, 5, 1); cctx.fillStyle = "#E0533B"; cctx.fillRect(C, C - 4, 2, 2);
    // boss : crânes de pixels
    let accessibles = 0;
    for (const [x, y] of BOSS_CARTE) {
      const ok = Math.max(Math.abs(x - C), Math.abs(y - C)) <= portee; if (ok) accessibles++;
      cctx.fillStyle = ok ? "#F2F2F2" : "#5A5A5A"; cctx.fillRect(x - 1, y - 1, 3, 2); cctx.fillRect(x - 1, y + 1, 1, 1); cctx.fillRect(x + 1, y + 1, 1, 1);
      cctx.fillStyle = ok ? "#C0302A" : "#3A3A3A"; cctx.fillRect(x - 1, y, 1, 1); cctx.fillRect(x + 1, y, 1, 1);
    }
    // joueur : flèche blanche des cartes
    const px = C + Math.round(portee * 0.7), py = C - Math.round(portee * 0.7);
    cctx.fillStyle = "#FFFFFF"; cctx.fillRect(px, py - 2, 1, 1); cctx.fillRect(px - 1, py - 1, 3, 1); cctx.fillRect(px - 2, py, 5, 1); cctx.fillRect(px - 1, py + 1, 1, 1); cctx.fillRect(px + 1, py + 1, 1, 1);
    $("#niveau-val").textContent = n;
    $$(".paliers li").forEach(li => li.classList.toggle("atteint", n >= Number(li.dataset.palier)));
    $("#radar-legende").innerHTML = n === 0 ? "Les terres paisibles autour de la capitale"
      : `Jusqu'à <b>${fmt(n * 100)}</b> blocs du centre, dans toutes les directions · créatures jusqu'au niveau ${n} · <b>${accessibles}</b> boss à ta portée`;
    curseur.style.setProperty("--v", `${n}%`);
  }
  curseur.addEventListener("input", majNiveau); majNiveau();
  $$(".metier").forEach(b => b.addEventListener("click", () => { $$(".metier").forEach(x => { x.classList.toggle("actif", x === b); x.setAttribute("aria-pressed", x === b); }); }));

  /* ---------- VI · la Tour : on la gravit en faisant défiler (tour.js) ---------- */
  const sceneTour = $("#tour"); let tourVisible = false, tourMontee = false;
  const monterTour = () => { Tour.monter(sceneTour); tourMontee = true; Tour.animer(0); };
  new IntersectionObserver(es => { tourVisible = es.some(x => x.isIntersecting); if (tourVisible && !tourMontee) monterTour(); }, { rootMargin: "600px 0px" }).observe(sceneTour);
  surBoucle.push(t => { if (tourVisible && tourMontee) Tour.animer(t); });
  let attenteTour; addEventListener("resize", () => { clearTimeout(attenteTour); attenteTour = setTimeout(() => { if (tourMontee) monterTour(); }, 250); });

  /* ---------- scènes épinglées (créatures, Tour) ---------- */
  const epinglees = $$(".scene");
  surDefilement.push(() => {
    const h = innerHeight;
    for (const s of epinglees) {
      const r = s.getBoundingClientRect(), p = borne(-r.top / (r.height - h));
      if (r.bottom < -h || r.top > 2 * h) continue;
      if (s.dataset.scene === "creatures") {
        const q = lisse(borne(p / 0.75));
        compteur.textContent = q >= 0.999 ? "500+" : fmt(Math.round(500 * q));
        mosaique.style.transform = `scale(${2.6 - 1.6 * q}) rotate(${-6 + 6 * q}deg)`;
        mosaique.style.setProperty("--p", q);
      } else if (s.dataset.scene === "tour") {
        if (!tourMontee) monterTour();
        Tour.maj(borne(p / 0.92));
      }
    }
  });

  // parallaxe de l'ouverture (souris + défilement)
  const ouv = $("#decor-ouverture"); let sx = 0, sy = 0, cx = 0, cy = 0;
  addEventListener("pointermove", e => { sx = e.clientX / innerWidth - 0.5; sy = e.clientY / innerHeight - 0.5; }, { passive: true });
  surBoucle.push(() => {
    if (scrollY > innerHeight * 1.2) return;
    cx += (sx - cx) * 0.06; cy += (sy - cy) * 0.06;
    couchesDe(ouv).forEach(c => { const d = Number(c.dataset.profondeur); c.style.transform = `translate3d(${-cx * d * 4}%, ${scrollY * 0.42 * (1 - d) - cy * d * 10}px, 0)`; });
  });

  // chapitre actif
  const liens = $$(".chapitres a"), visibles = new Set();
  new IntersectionObserver(es => es.forEach(e => {
    e.isIntersecting ? visibles.add(e.target.id) : visibles.delete(e.target.id);
  }), { threshold: 0.35 }).observe(monde);
  const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) liens.forEach(a => a.classList.toggle("actif", a.dataset.chap === e.target.dataset.chap)); }), { rootMargin: "-45% 0px -45% 0px" });
  $$(".chap").forEach(c => obs.observe(c));

  // clavier : ←/→ dans le monde ; ↑/↓ de chapitre en chapitre
  const chaps = $$(".chap");
  addEventListener("keydown", e => {
    if (e.target.closest("input, textarea, [role=tablist]")) return;
    if (visibles.has("monde") && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { cacher(); pas(e.key === "ArrowRight" ? 1 : -1); e.preventDefault(); return; }
    const sens = ["ArrowDown", "PageDown"].includes(e.key) ? 1 : ["ArrowUp", "PageUp"].includes(e.key) ? -1 : 0;
    if (!sens) return;
    const y = scrollY + 2, debuts = chaps.map(c => c.offsetTop);
    const scene = epinglees.find(s => y >= s.offsetTop && y < s.offsetTop + s.offsetHeight - innerHeight - 4);
    let cible = scene && sens > 0 ? y + innerHeight : sens > 0 ? debuts.find(d => d > y + 4) : [...debuts].reverse().find(d => d < y - 4);
    if (scene && sens < 0) cible = Math.max(scene.offsetTop, y - innerHeight);
    if (cible === undefined) return;
    e.preventDefault(); scrollTo({ top: cible, behavior: calme ? "auto" : "smooth" });
  });

  /* ---------- VII · mur de la galerie ---------- */
  const MUR = [["biome", "royaume", "Le royaume", "grand"], ["boss", "lr_minotaur", "Le Minotaure"], ["biome", "jungle", "Jungle ancestrale"], ["biome", "sakuras", "Vallée des sakuras"], ["boss", "phoenix", "Le Phénix"], ["biome", "falaises", "Falaises blanches", "large"], ["biome", "lunaire", "Forêt lunaire"], ["biome", "desert", "Désert"], ["boss", "kraken", "Le Kraken"], ["jeu", "img/captures/menus.png", "Les menus en jeu", "large"]];
  const mur = $("#mur");
  mur.innerHTML = MUR.map(([t, id, nom, taille]) => `<a class="brique brique-${t}${taille ? " " + taille : ""}" href="galerie.html" data-t="${t}" data-id="${id}"><span class="brique-image">${t === "boss" ? `<img src="img/boss/p_${id}.webp" alt="" loading="lazy">` : t === "jeu" ? `<img src="${id}" alt="" loading="lazy">` : ""}</span><span class="brique-nom">${nom}</span></a>`).join("");
  $$(".brique-biome").forEach(b => { const grand = b.classList.contains("grand"), large = b.classList.contains("large"); Historia.imageDiffere(b.querySelector(".brique-image"), b.dataset.id, grand || large ? 420 : 220, grand ? 300 : 180); });
  // la frise des biomes n'est dessinée que lorsqu'on s'en approche
  new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { construire(); o.disconnect(); } }, { rootMargin: "900px 0px" }).observe(monde);

  Historia.demarrer();
  aller(0); legende(0);
})();
