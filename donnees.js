// Contenus éditables depuis le back-office (donnees/*.json) : journal des nouveautés, feuille de route, encart
// « Dernières nouvelles » de l'accueil. Le HTML livré contient déjà une version de secours ; elle est remplacée
// par les données à jour dès qu'elles arrivent.
"use strict";
(() => {
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const echapper = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const dateLongue = iso => { const [a, m, j] = iso.split("-").map(Number); return `${j === 1 ? "1er" : j} ${MOIS[m - 1]} ${a}`; };
  const dateCourte = iso => { const [, m, j] = iso.split("-").map(Number); return `${j === 1 ? "1er" : j} ${MOIS[m - 1]}`; };
  const resume = (t, n = 115) => t.length <= n ? t : t.slice(0, t.lastIndexOf(" ", n)) + "…";
  const lire = nom => fetch(`donnees/${nom}.json`, { cache: "no-cache" }).then(r => r.ok ? r.json() : Promise.reject(r.status));
  const STATUTS = { fait: ["fait", "Fait"], presque: ["fait-presque", "En cours · presque fini"], "en-cours": ["en-cours", "En cours"], "a-venir": ["a-venir", "À venir"] };

  const rendus = {
    journal: liste => liste.map(n => `        <li class="journal-entree">
          <time datetime="${echapper(n.date)}">${dateLongue(n.date)}</time>
          <article class="carte-verre"><h2 class="h2-petit">${echapper(n.titre)}</h2><p>${echapper(n.texte)}</p></article>
        </li>`).join("\n"),
    route: etapes => etapes.map((e, i) => { const [classe, libelle] = STATUTS[e.statut] || STATUTS["a-venir"]; return `        <li class="route-etape route-${classe}">
          <span class="route-jalon" aria-hidden="true">${i + 1}</span>
          <div class="carte-verre">
            <p class="route-statut">${echapper(e.etiquette || libelle)}</p>
            <h2 class="h2-petit">Étape ${i + 1} · ${echapper(e.titre)}</h2>
            <ul>${(e.puces || []).map(p => `<li>${echapper(p)}</li>`).join("")}</ul>
          </div>
        </li>`; }).join("\n"),
    cartes: liste => liste.slice(0, 3).map(n => `<a class="nouvelle" href="nouveautes.html"><time datetime="${echapper(n.date)}">${dateCourte(n.date)}</time><h3>${echapper(n.titre)}</h3><p>${echapper(resume(n.texte))}</p></a>`).join("\n      "),
  };
  const trier = liste => [...liste].sort((a, b) => b.date.localeCompare(a.date));

  const journal = document.querySelector(".journal"), cartes = document.querySelector(".nouvelles-cartes"), route = document.querySelector(".route");
  if (journal || cartes) lire("nouveautes").then(l => { l = trier(l); if (journal) journal.innerHTML = rendus.journal(l); if (cartes) cartes.innerHTML = rendus.cartes(l); }).catch(() => {});
  if (route) lire("feuille-de-route").then(e => { route.innerHTML = rendus.route(e); }).catch(() => {});

  // le back-office réutilise les mêmes rendus pour son aperçu
  window.HistoriaDonnees = { rendus, trier, echapper, dateLongue };
})();
