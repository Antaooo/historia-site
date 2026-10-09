// Galerie : biomes en pixel art (rendus fixes), légendes, captures de l'interface ; filtres et visionneuse.
"use strict";
(() => {
  const { $, $$ } = Historia;
  const NOMS = { plaines: "Plaines", falaises: "Falaises blanches", jungle: "Jungle ancestrale", lunaire: "Forêt lunaire", sakuras: "Vallée des sakuras", caldeira: "Caldeira", abysses: "Abysses", desert: "Désert", boreale: "Forêt boréale", prairie: "Prairie alpine", lande: "Lande de bruyère", marais: "Marais maudit", grottes: "Grottes de cristal", steppe: "Steppe embrasée", royaume: "Le royaume", cimes: "Cimes au couchant", aube: "L'aube sur la capitale", crepuscule: "Le royaume au crépuscule" };
  const ELEMENTS = [
    ...Object.keys(NOMS).map(id => ({ type: "biome", id, titre: NOMS[id], legende: "Biome · pixel art Historia" })),
    ...[["lr_minotaur", "Le Minotaure", "Falaises blanches"], ["phoenix", "Le Phénix", "Sources ardentes"], ["kraken", "Le Kraken", "Abysses"], ["tiamat", "Tiamat", "Grottes de cristal"], ["lr_anubis", "Anubis", "Désert"], ["ent_king", "Roi des ents", "Jungle ancestrale"], ["medusa", "Méduse", "Falaises côtières"], ["azriel", "Azriel", "Bois hanté"]]
      .map(([p, t, l]) => ({ type: "legende", src: `img/boss/p_${p}.png`, titre: t, legende: `Légende · ${l}` })),
    { type: "jeu", src: "img/captures/menus.png", titre: "Carnet du voyageur", legende: "En jeu · menus du bestiaire" },
    { type: "jeu", src: "img/captures/passe.png", titre: "Passe d'aventure", legende: "En jeu · maquette des menus du passe" },
    { type: "jeu", src: "img/captures/tab.png", titre: "Tableau des joueurs", legende: "En jeu · touche Tab" },
  ];

  const grille = $("#grille");
  grille.innerHTML = ELEMENTS.map((e, i) => `<button type="button" class="carte-galerie carte-${e.type}${e.type === "biome" && i % 5 === 0 ? " large" : ""}" data-i="${i}" data-type="${e.type}" aria-label="Agrandir : ${e.titre}">
    <span class="carte-image">${e.type === "biome" ? "" : `<img src="${e.src}" alt="" loading="lazy">`}</span>
    <span class="carte-texte"><b>${e.titre}</b><small>${e.legende}</small></span></button>`).join("");
  const cartes = $$(".carte-galerie");
  // rendus fixes des biomes, à la taille de leur carte
  cartes.forEach(c => { const e = ELEMENTS[c.dataset.i]; if (e.type !== "biome") return; const large = c.classList.contains("large"); Historia.imageDiffere(c.querySelector(".carte-image"), e.id, large ? 400 : 260, large ? 225 : 180); });

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
    if (e.type === "biome") { const cv = Pixel.image(Pixel.THEMES[e.id], 480, 270); cv.className = "rendu-pixel"; visImg.appendChild(cv); }
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
