// Page Progression : calculateur de métiers, répartition des statistiques, zones par distance, spécialités, rangs.
"use strict";
(() => {
  const { $, $$ } = Historia;
  const fmt = n => n.toLocaleString("fr-FR").replace(/ | /g, " ");

  // métiers
  const METIERS = [["Mineur", "#9AA8B8", 12], ["Artisan", "#D9A35A", 8], ["Cuisinier", "#E2785A", 6], ["Chasseur", "#7FB85A", 14]];
  $("#reglages").innerHTML = METIERS.map(([n, c, v], i) => `<label class="reglage" style="--c:${c}"><span>${n} <b data-v="${i}">${v}</b></span><input type="range" min="0" max="25" value="${v}" data-m="${i}" class="curseur curseur-c" aria-label="Niveau de ${n}"></label>`).join("");
  const majMetiers = () => {
    const v = $$("[data-m]").map(e => Number(e.value)); const tot = v.reduce((a, b) => a + b, 0);
    v.forEach((x, i) => { $(`[data-v="${i}"]`).textContent = x; $(`[data-m="${i}"]`).style.setProperty("--v", `${x * 4}%`); });
    $("#total").textContent = tot;
    $("#barre-metiers").innerHTML = v.map((x, i) => `<i style="width:${x}%;background:${METIERS[i][1]}"></i>`).join("");
  };
  $$("[data-m]").forEach(e => e.addEventListener("input", majMetiers)); majMetiers();

  // statistiques
  const STATS = [["Force", "Des coups plus puissants.", "#E2785A"], ["Vitalité", "Plus de points de vie.", "#E25A7A"], ["Défense", "Moins de dégâts subis.", "#7FA8D8"], ["Agilité", "Plus vif, plus rapide.", "#7FD8A8"], ["Chance", "Meilleur butin, coups critiques.", "#F2C14E"]];
  const pts = STATS.map(() => 0), TOTAL = 10;
  $("#stats-liste").innerHTML = STATS.map(([n, d, c], i) => `<article class="stat carte-verre" style="--c:${c}"><h3>${n}</h3><p>${d}</p><div class="stat-jauge" aria-hidden="true">${"<i></i>".repeat(TOTAL)}</div><div class="stat-boutons"><button type="button" data-s="${i}" data-d="-1" aria-label="Retirer un point en ${n}">−</button><b data-sv="${i}">0</b><button type="button" data-s="${i}" data-d="1" aria-label="Ajouter un point en ${n}">+</button></div></article>`).join("");
  const majStats = () => {
    const reste = TOTAL - pts.reduce((a, b) => a + b, 0); $("#points").textContent = reste;
    pts.forEach((p, i) => { $(`[data-sv="${i}"]`).textContent = p; [...$$(".stat")[i].querySelectorAll(".stat-jauge i")].forEach((g, k) => g.classList.toggle("plein", k < p)); });
    $$("[data-s]").forEach(b => { b.disabled = b.dataset.d === "1" ? reste === 0 : pts[b.dataset.s] === 0; });
  };
  $$("[data-s]").forEach(b => b.addEventListener("click", () => { const i = Number(b.dataset.s), d = Number(b.dataset.d), reste = TOTAL - pts.reduce((a, c) => a + c, 0); if (d > 0 && reste === 0) return; pts[i] = Math.max(0, pts[i] + d); majStats(); }));
  $("#remise").addEventListener("click", () => { pts.fill(0); majStats(); }); majStats();

  // zones
  const dist = $("#distance");
  $("#anneaux").innerHTML = Array.from({ length: 20 }, (_, z) => `<span style="--t:${z / 19}"><i>${z % 4 === 0 ? fmt(z * 500) : ""}</i></span>`).join("");
  const majZone = () => {
    const d = Number(dist.value), z = Math.min(19, Math.floor(d / 500)), min = z * 5 + 1, max = z * 5 + 5;
    $("#distance-val").textContent = fmt(d); dist.style.setProperty("--v", `${d / 100}%`);
    [...$("#anneaux").children].forEach((s, k) => { s.classList.toggle("ici", k === z); s.classList.toggle("passe", k < z); });
    $("#zone-info").innerHTML = `Zone ${z + 1} · ${fmt(z * 500)} à ${fmt((z + 1) * 500)} blocs · créatures de <b>niveau ${min} à ${max}</b>${z >= 19 ? " · le bout du monde" : ""}`;
  };
  dist.addEventListener("input", majZone); majZone();

  // spécialités
  const SPE = [["Forgeron", "Armes"], ["Tanneur", "Armures"], ["Arcier", "Arcs"], ["Alchimiste", "Potions"], ["Mage", "Grimoires"]];
  const choisies = [];
  $("#specialites-liste").innerHTML = SPE.map(([n, d], i) => `<button type="button" class="spe carte-verre" aria-pressed="false" data-spe="${i}"><b>${n}</b><span>${d}</span></button>`).join("");
  $$("[data-spe]").forEach(b => b.addEventListener("click", () => {
    const i = Number(b.dataset.spe), k = choisies.indexOf(i);
    if (k >= 0) choisies.splice(k, 1); else { choisies.push(i); if (choisies.length > 2) choisies.shift(); }
    $$("[data-spe]").forEach(x => x.setAttribute("aria-pressed", choisies.includes(Number(x.dataset.spe))));
    $("#choix").innerHTML = choisies.length ? choisies.map((c, j) => `<b>${SPE[c][0]}</b> au niveau ${j ? 60 : 30}`).join(" · ") : "Aucune spécialité choisie.";
  }));

  // rangs (blasons du tableau des joueurs, du plus bas au plus haut)
  const RANGS = [["apprenti", "Apprenti"], ["adepte", "Adepte"], ["combattant", "Combattant"], ["guerrier", "Guerrier"], ["chevalier", "Chevalier"], ["elite", "Élite"], ["veteran", "Vétéran"], ["maitre", "Maître"], ["heros", "Héros"], ["legende", "Légende"], ["divinite", "Divinité"]];
  $("#echelle").innerHTML = RANGS.map(([f, n], i) => `<li style="--i:${i}"><img src="img/blasons/blason_rank_${f}.png" alt="" width="42" height="48"><span>${n}</span></li>`).join("");

  Historia.demarrer();
})();
