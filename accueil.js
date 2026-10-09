// Page d'accueil : présentation interactive (biomes et légendes en carrousels manuels, créatures, progression, Tour).
"use strict";
(() => {
  const { $, $$, calme, couchesDe, surDefilement, surBoucle } = Historia;
  const borne = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lisse = t => 1 - Math.pow(1 - t, 3);
  const fmt = n => n.toLocaleString("fr-FR").replace(/ | /g, " ");

  /* ---------- I · carrousel des biomes ---------- */
  const piste = $("#piste"), BIOMES = Pixel.BIOMES, points = $("#points-biomes");
  piste.innerHTML = BIOMES.map((b, i) => `
    <article class="biome" aria-roledescription="diapositive" aria-label="${i + 1} sur ${BIOMES.length} : ${b.nom}">
      <div class="decor" data-theme="${b.id}" aria-hidden="true"></div>
      <div class="biome-texte">
        <p class="biome-num">${String(i + 1).padStart(2, "0")} / ${String(BIOMES.length).padStart(2, "0")}</p>
        <h3>${b.nom}</h3>
        <p>${b.texte}</p>
        <p class="biome-pastilles"><span>Légende · <b>${b.boss}</b></span><span>${b.creatures}</span></p>
      </div>
      <img class="biome-boss" src="img/boss/p_${b.portrait}.png" alt="" loading="lazy" width="460" height="460">
    </article>`).join("");
  points.innerHTML = BIOMES.map((b, i) => `<button type="button" class="point-biome" aria-label="${b.nom}" aria-current="${i === 0}"><span>${b.nom}</span></button>`).join("");
  const biomes = $$(".biome"), pts = [...points.children];
  let ib = 0;
  function biome(i) {
    ib = (i + BIOMES.length) % BIOMES.length;
    piste.style.transform = `translate3d(${-ib * 100}%,0,0)`;
    // rendu à la demande : le biome affiché et ses deux voisins seulement
    if (monde.dataset.vu) for (const d of [-1, 0, 1]) Historia.monter(biomes[(ib + d + BIOMES.length) % BIOMES.length].querySelector(".decor"));
    biomes.forEach((b, k) => { b.classList.toggle("actif", k === ib); b.setAttribute("aria-hidden", k !== ib);
      couchesDe(b.querySelector(".decor")).forEach(c => { c.style.transform = `translate3d(${(k - ib) * c.dataset.profondeur * -8}%,0,0)`; }); });
    pts.forEach((p, k) => p.setAttribute("aria-current", k === ib));
  }
  pts.forEach((p, k) => p.addEventListener("click", () => biome(k)));
  $$("[data-biome]").forEach(b => b.addEventListener("click", () => biome(ib + Number(b.dataset.biome))));
  let bx = null; const monde = $("#monde");
  monde.addEventListener("pointerdown", e => { if (!e.target.closest("button, a")) bx = e.clientX; });
  monde.addEventListener("pointerup", e => { if (bx !== null && Math.abs(e.clientX - bx) > 60) biome(ib + (e.clientX < bx ? 1 : -1)); bx = null; });

  /* ---------- II · mosaïque des créatures ---------- */
  const PORTRAITS = ["lr_minotaur", "medusa", "phoenix", "lr_yeti", "lr_anubis", "kraken", "cerberus", "tiamat", "azriel", "nightharrow_wendigo", "lr_gryffin", "wu", "flamental", "capra", "elven_druid", "mega_warden", "hana", "demon_of_chaos_gama05", "megalodon", "glume", "skog", "oblivion", "voras", "zahar", "mortos", "lillith", "wolfebersahd", "koboldassassin", "magnus", "kriger", "ent_king"];
  const mosaique = $("#mosaique");
  mosaique.innerHTML = Array.from({ length: 60 }, (_, i) => { const k = (i * 7) % PORTRAITS.length, p = PORTRAITS[k], cache = k % 3 !== 0; return `<span class="tuile${cache ? " cachee" : ""}" style="--d:${((i * 37) % 60) / 60}"><img src="img/boss/p_${p}.png" alt="" loading="lazy" width="120" height="120"></span>`; }).join("");
  const compteur = $("#compteur");

  /* ---------- III · légendes (carrousel manuel) ---------- */
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
  sel.innerHTML = LEGENDES.map((l, i) => `<button type="button" role="tab" class="vignette" aria-selected="${i === 0}" aria-label="${l[1]}" style="--c:${l[5]}"><img src="img/boss/p_${l[0]}.png" alt="" width="68" height="68"></button>`).join("");
  const vignettes = [...sel.children];
  function legende(i, focus) {
    il = (i + LEGENDES.length) % LEGENDES.length; const [p, nom, titre, lieu, pv, c] = LEGENDES[il];
    vignettes.forEach((v, k) => { v.setAttribute("aria-selected", k === il); v.tabIndex = k === il ? 0 : -1; });
    sel.scrollTo({ left: vignettes[il].offsetLeft - sel.clientWidth / 2 + 42, behavior: calme ? "auto" : "smooth" });
    if (focus) vignettes[il].focus({ preventScroll: true });
    img.classList.add("change");
    setTimeout(() => { img.src = `img/boss/p_${p}.png`; img.alt = nom; img.classList.remove("change"); }, calme ? 0 : 220);
    $("#fiche-nom").textContent = nom; $("#fiche-titre").textContent = titre; $("#fiche-lieu").textContent = lieu; $("#fiche-pv").textContent = fmt(pv);
    $("#fiche-danger").style.width = `${Math.round(borne(pv / 1500) * 100)}%`;
    document.documentElement.style.setProperty("--legende", c);
  }
  vignettes.forEach((v, i) => v.addEventListener("click", () => legende(i)));
  $$("[data-pas]").forEach(b => b.addEventListener("click", () => legende(il + Number(b.dataset.pas))));
  sel.addEventListener("keydown", e => { if (e.key === "ArrowRight") { legende(il + 1, true); e.preventDefault(); } if (e.key === "ArrowLeft") { legende(il - 1, true); e.preventDefault(); } });
  let lx = null; const zone = $(".scene-boss");
  zone.addEventListener("pointerdown", e => { lx = e.clientX; });
  zone.addEventListener("pointerup", e => { if (lx !== null && Math.abs(e.clientX - lx) > 50) legende(il + (e.clientX < lx ? 1 : -1)); lx = null; });

  /* ---------- IV · progression : carte carrée façon carte de Minecraft ---------- */
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

  /* ---------- V · la Tour ---------- */
  const tour = $("#tour-svg"); let t = "";
  for (let i = 0; i < 40; i++) { const y = 720 - i * 17, l = 170 - i * 1.4, x = 150 - l / 2; t += `<rect class="etage-r" data-i="${i + 1}" x="${x.toFixed(1)}" y="${y}" width="${l.toFixed(1)}" height="14"/>`; if (i % 5 === 4) t += `<rect class="fenetre-t" data-i="${i + 1}" x="144" y="${y + 3}" width="12" height="8"/>`; }
  t += `<path class="tour-toit" d="M88,44 H212 V36 H200 V24 H188 V12 H176 V0 H164 V-12 H136 V0 H124 V12 H112 V24 H100 V36 H88 Z"/><rect x="146" y="-34" width="8" height="22" fill="#3A2A1E"/><rect x="154" y="-34" width="22" height="12" fill="#E0533B"/><rect x="40" y="736" width="220" height="24" class="tour-socle"/>`;
  tour.innerHTML = t; const etages = [...tour.querySelectorAll("[data-i]")];

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
        const e = Math.max(1, Math.ceil(lisse(borne(p / 0.85)) * 40));
        $("#etage").textContent = e;
        etages.forEach(el => { const k = Number(el.dataset.i); el.classList.toggle("allume", k <= e); el.classList.toggle("sommet", k === e && el.classList.contains("etage-r")); });
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
    if (visibles.has("monde") && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { biome(ib + (e.key === "ArrowRight" ? 1 : -1)); e.preventDefault(); return; }
    const sens = ["ArrowDown", "PageDown"].includes(e.key) ? 1 : ["ArrowUp", "PageUp"].includes(e.key) ? -1 : 0;
    if (!sens) return;
    const y = scrollY + 2, debuts = chaps.map(c => c.offsetTop);
    const scene = epinglees.find(s => y >= s.offsetTop && y < s.offsetTop + s.offsetHeight - innerHeight - 4);
    let cible = scene && sens > 0 ? y + innerHeight : sens > 0 ? debuts.find(d => d > y + 4) : [...debuts].reverse().find(d => d < y - 4);
    if (scene && sens < 0) cible = Math.max(scene.offsetTop, y - innerHeight);
    if (cible === undefined) return;
    e.preventDefault(); scrollTo({ top: cible, behavior: calme ? "auto" : "smooth" });
  });

  /* ---------- VI · mur de la galerie ---------- */
  const MUR = [["biome", "royaume", "Le royaume", "grand"], ["boss", "lr_minotaur", "Le Minotaure"], ["biome", "jungle", "Jungle ancestrale"], ["biome", "sakuras", "Vallée des sakuras"], ["boss", "phoenix", "Le Phénix"], ["biome", "falaises", "Falaises blanches", "large"], ["biome", "lunaire", "Forêt lunaire"], ["biome", "desert", "Désert"], ["boss", "kraken", "Le Kraken"], ["jeu", "img/captures/menus.png", "Les menus en jeu", "large"]];
  const mur = $("#mur");
  mur.innerHTML = MUR.map(([t, id, nom, taille]) => `<a class="brique brique-${t}${taille ? " " + taille : ""}" href="galerie.html" data-t="${t}" data-id="${id}"><span class="brique-image">${t === "boss" ? `<img src="img/boss/p_${id}.png" alt="" loading="lazy">` : t === "jeu" ? `<img src="${id}" alt="" loading="lazy">` : ""}</span><span class="brique-nom">${nom}</span></a>`).join("");
  $$(".brique-biome").forEach(b => { const grand = b.classList.contains("grand"), large = b.classList.contains("large"); Historia.imageDiffere(b.querySelector(".brique-image"), b.dataset.id, grand || large ? 420 : 220, grand ? 300 : 180); });
  // le carrousel des biomes n'est dessiné que lorsqu'on s'en approche
  piste.dataset.aLaDemande = "1";
  new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { monde.dataset.vu = "1"; biome(ib); o.disconnect(); } }, { rootMargin: "900px 0px" }).observe(monde);

  Historia.demarrer();
  biome(0); legende(0);
})();
