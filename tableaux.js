// Tableaux vivants : les écrans d'attente du jeu, rejoués en couches comme en jeu. Les couches (img/tableaux/) et leur liste
// (donnees/tableaux.json) sont produites par le générateur du serveur. Sert à l'ouverture de l'accueil ([data-tableaux]) et à tableaux.html.
(function () {
  "use strict";
  const BASE = "img/tableaux/", DUREES = { nuages: [512, 640, 576], brume: 1536, ombres: 512, rayons: 1152 }, OPACITES = { brume: .45, ombres: .2, rayons: .14 };
  const SORTES = { paysage: "Paysage", ville: "Capitales et villages", boss: "Boss", equipement: "Équipement" };
  const calme = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Empile les couches du tableau t dans el : image fixe d'abord (elle s'affiche tout de suite), puis les boucles et les bandes qui glissent. */
  function monter(el, t) {
    el.textContent = "";
    const scene = document.createElement("div"); scene.className = "tv-scene"; el.appendChild(scene);
    const couche = (fichier, bande, duree, opacite) => {
      const i = new Image(); i.alt = ""; i.decoding = "async"; i.src = BASE + fichier;
      if (bande) { i.className = "tv-bande"; i.style.animationDuration = duree + "s"; }
      if (opacite) i.style.opacity = opacite;
      scene.appendChild(i);
    };
    couche(`tableau_${t.cle}.png`);
    if (calme) return;   // mouvement réduit demandé : on en reste à l'image fixe
    couche(`ciel_${t.cle}.apng`);
    if (t.interieur) return;
    for (let k = 0; k < t.nuages; k++) couche(`nuages_${t.cle}_${k}.png`, true, DUREES.nuages[k % 3]);
    couche(`reliefs_${t.cle}.apng`);
    if (t.brume) couche(`brume_${t.cle}.png`, true, DUREES.brume, OPACITES.brume);
    couche(`terre_${t.cle}.apng`);
    if (t.ombres) couche(`ombres_${t.cle}.png`, true, DUREES.ombres, OPACITES.ombres);
    if (t.rayons) couche(`rayons_${t.cle}.png`, true, DUREES.rayons, OPACITES.rayons);
  }
  const charger = () => fetch("donnees/tableaux.json").then(r => r.json());
  const nom = t => t.titre + (t.heure ? " — " + t.heure : "");

  // un décor : un tableau tiré au hasard parmi ceux de data-tableaux
  for (const el of document.querySelectorAll("[data-tableaux]")) charger().then(L => {
    const choix = el.dataset.tableaux.split(",").map(c => L.find(t => t.cle === c.trim())).filter(Boolean);
    if (choix.length) monter(el, choix[Math.floor(Math.random() * choix.length)]);
  }).catch(() => {});

  // la page des tableaux : visionneuse, filtres, vignettes
  const cadre = document.getElementById("tv-cadre");
  if (cadre) charger().then(L => {
    const grille = document.getElementById("tv-grille"), titre = document.getElementById("tv-titre"), lieu = document.getElementById("tv-lieu");
    let courant = 0, visibles = L.map((_, k) => k);
    const montrer = k => {
      courant = k; const t = L[k]; monter(cadre, t);
      titre.textContent = nom(t); lieu.textContent = SORTES[t.sorte] + " · " + t.lieu;
      grille.querySelectorAll(".tv-vignette").forEach(v => v.setAttribute("aria-current", String(+v.dataset.k === k)));
    };
    L.forEach((t, k) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "tv-vignette"; b.dataset.k = k; b.dataset.sorte = t.sorte;
      const i = new Image(); i.loading = "lazy"; i.alt = ""; i.src = BASE + `tableau_${t.cle}.png`; b.appendChild(i);
      const s = document.createElement("span"); s.textContent = nom(t); const sm = document.createElement("small"); sm.textContent = SORTES[t.sorte]; s.appendChild(sm); b.appendChild(s);
      b.addEventListener("click", () => { montrer(k); cadre.scrollIntoView({ behavior: calme ? "auto" : "smooth", block: "center" }); });
      grille.appendChild(b);
    });
    const pas = d => { const i = visibles.indexOf(courant); montrer(visibles[(Math.max(0, i) + d + visibles.length) % visibles.length]); };
    document.getElementById("tv-precedent").addEventListener("click", () => pas(-1));
    document.getElementById("tv-suivant").addEventListener("click", () => pas(1));
    for (const f of document.querySelectorAll("[data-tv-filtre]")) f.addEventListener("click", () => {
      document.querySelectorAll("[data-tv-filtre]").forEach(x => x.setAttribute("aria-pressed", String(x === f)));
      const s = f.dataset.tvFiltre; visibles = L.map((t, k) => s === "tout" || t.sorte === s ? k : -1).filter(k => k >= 0);
      grille.querySelectorAll(".tv-vignette").forEach(v => { v.hidden = !visibles.includes(+v.dataset.k); });
      if (!visibles.includes(courant) && visibles.length) montrer(visibles[0]);
    });
    const voulu = L.findIndex(t => t.cle === location.hash.slice(1));
    montrer(voulu >= 0 ? voulu : Math.floor(Math.random() * L.length));
  }).catch(() => { cadre.textContent = "Les tableaux n'ont pas pu être chargés."; });
})();
