// Galerie : les dix-huit biomes du monde (découpés dans la frise de monde.js), les légendes, les paysages, les captures de l'interface ; filtres et visionneuse.
"use strict";
(() => {
  const { $, $$ } = Historia;
  const NOMS = { plaines: "Plaines", falaises: "Falaises blanches", jungle: "Jungle ancestrale", lunaire: "Forêt lunaire", sakuras: "Vallée des sakuras", caldeira: "Caldeira", abysses: "Abysses", desert: "Désert", boreale: "Forêt boréale", prairie: "Prairie alpine", lande: "Lande de bruyère", marais: "Marais maudit", grottes: "Grottes de cristal", steppe: "Steppe embrasée", royaume: "Le royaume", cimes: "Cimes au couchant", aube: "L'aube sur la capitale", crepuscule: "Le royaume au crépuscule" };
  const PAYSAGES = ["royaume", "cimes", "aube", "crepuscule"]; // compositions, pas des biomes du jeu
  const M = Pixel.monde;
  const ELEMENTS = [
    ...M.BIOMES.map((b, k) => ({ type: "biome", k, titre: b.nom, legende: `Biome · légende : ${b.boss}` })),
    ...M.BIOMES.map(b => ({ type: "legende", src: `img/boss/p_${b.portrait}.webp`, titre: b.boss, legende: `Légende · ${b.nom}` })),
    ...PAYSAGES.map(id => ({ type: "paysage", id, titre: NOMS[id], legende: "Paysage · pixel art Historia" })),
    { type: "jeu", src: "img/captures/menus.png", titre: "Carnet du voyageur", legende: "En jeu · menus du bestiaire" },
    { type: "jeu", src: "img/captures/passe.png", titre: "Passe d'aventure", legende: "En jeu · maquette des menus du passe" },
    { type: "jeu", src: "img/captures/tab.png", titre: "Tableau des joueurs", legende: "En jeu · touche Tab" },
  ];

  const grille = $("#grille");
  grille.innerHTML = ELEMENTS.map((e, i) => `<button type="button" class="carte-galerie carte-${e.type}${e.type === "paysage" && i % 2 === 0 ? " large" : ""}" data-i="${i}" data-type="${e.type}" aria-label="Agrandir : ${e.titre}">
    <span class="carte-image">${e.src ? `<img src="${e.src}" alt="" loading="lazy">` : ""}</span>
    <span class="carte-texte"><b>${e.titre}</b><small>${e.legende}</small></span></button>`).join("");
  const cartes = $$(".carte-galerie");
  // un biome = une vue de la frise du monde centrée sur lui (le monde n'est calculé qu'une fois, à la première vue)
  let monde = null;
  function vueBiome(k) {
    // cadrage 16/9 sur le bas de la scène : relief, végétation et un peu de sous-sol
    const y0 = Math.round(M.H * 0.3), H = M.H - y0, V = Math.round(H * 16 / 9); monde = monde || M.rendre(320);
    const b = M.BIOMES[k], off = Math.max(0, Math.min(M.W - V, Math.round(M.debuts[k] + b.l / 2 - V / 2)));
    const cv = document.createElement("canvas"); cv.width = V; cv.height = H; cv.className = "rendu-pixel"; const ctx = cv.getContext("2d");
    for (const c of monde.couches) ctx.drawImage(c.canvas, Math.round(off * c.s), y0, V, H, 0, 0, V, H);
    ctx.save(); ctx.translate(-off, -y0); Pixel.outils.dessinerAnim(ctx, monde.anims, 0); ctx.restore();
    return cv;
  }
  const aVoir = new IntersectionObserver(es => es.forEach(x => { if (!x.isIntersecting) return; aVoir.unobserve(x.target); x.target.appendChild(vueBiome(Number(x.target.dataset.k))); }), { rootMargin: "400px 0px" });
  cartes.forEach(c => { const e = ELEMENTS[c.dataset.i], im = c.querySelector(".carte-image");
    if (e.type === "biome") { im.dataset.k = e.k; aVoir.observe(im); }
    else if (e.type === "paysage") { const large = c.classList.contains("large"); Historia.imageDiffere(im, e.id, large ? 400 : 260, large ? 225 : 180); } });

  // filtres
  $$(".filtre").forEach(f => f.addEventListener("click", () => {
    $$(".filtre").forEach(x => x.setAttribute("aria-pressed", x === f));
    cartes.forEach(c => { c.hidden = f.dataset.filtre !== "tout" && c.dataset.type !== f.dataset.filtre; });
  }));

  // visionneuse
  const vis = $("#visionneuse"), visImg = $("#vis-image"); let iv = 0, retour = null;
  const visibles = () => cartes.filter(c => !c.hidden).map(c => Number(c.dataset.i));
  function ouvrir(i) {
    iv = i; const e = ELEMENTS[i]; visImg.innerHTML = "";
    if (e.type === "biome") visImg.appendChild(vueBiome(e.k));
    else if (e.type === "paysage") { const cv = Pixel.image(Pixel.THEMES[e.id], 480, 270); cv.className = "rendu-pixel"; visImg.appendChild(cv); }
    else visImg.innerHTML = `<img src="${e.src}" alt="${e.titre}">`;
    visImg.className = "vis-image vis-" + e.type;
    $("#vis-titre").textContent = e.titre; $("#vis-legende").textContent = e.legende;
    if (vis.hidden) { retour = document.activeElement; vis.hidden = false; document.body.style.overflow = "hidden"; vis.querySelector(".vis-fermer").focus(); }
  }
  function fermer() { vis.hidden = true; document.body.style.overflow = ""; if (retour) retour.focus(); }
  const pas = d => { const v = visibles(), k = v.indexOf(iv); ouvrir(v[(k + d + v.length) % v.length]); };
  cartes.forEach(c => c.addEventListener("click", () => ouvrir(Number(c.dataset.i))));
  vis.querySelector(".vis-fermer").addEventListener("click", fermer);
  vis.querySelector(".vis-g").addEventListener("click", () => pas(-1));
  vis.querySelector(".vis-d").addEventListener("click", () => pas(1));
  vis.addEventListener("click", e => { if (e.target === vis) fermer(); });
  addEventListener("keydown", e => {
    if (vis.hidden) return;
    if (e.key === "Escape") fermer(); else if (e.key === "ArrowRight") pas(1); else if (e.key === "ArrowLeft") pas(-1);
    else if (e.key === "Tab") { const f = [...vis.querySelectorAll("button")], k = f.indexOf(document.activeElement); e.preventDefault(); f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
  });

  Historia.demarrer();
})();
