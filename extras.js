// Éléments communs ajoutés à toutes les pages : bandeau de la bêta fermée, bouton musique, barre « Jouer » sur téléphone,
// crédit de la musique dans le pied de page.
"use strict";
(() => {
  const lire = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch { /* stockage indisponible : sans conséquence */ } };
  const ADRESSE = "historia.mine.fun", DISCORD = "https://discord.gg/";

  // bandeau d'annonce (texte réglé dans le back-office, donnees/config.json) ; fermé, il ne revient que si l'annonce change
  const ANNONCE = { active: true, pastille: "Bêta fermée", texte: "Elle se prépare : inscris-toi sur le Discord pour faire partie des premiers à entrer dans le royaume.", lien: "S'inscrire" };
  const echapper = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  let bandeau = null;
  const caler = () => document.documentElement.style.setProperty("--decalage", `${bandeau ? Math.max(0, bandeau.offsetHeight - scrollY) : 0}px`);
  addEventListener("scroll", caler, { passive: true }); addEventListener("resize", caler);
  const retirerAnnonce = () => { if (!bandeau) return; bandeau.remove(); bandeau = null; document.body.classList.remove("avec-annonce"); caler(); };
  function annoncer(an, discord) {
    if (!an.active || lire("historia-annonce") === an.texte) { retirerAnnonce(); return; }
    if (!bandeau) {
      bandeau = document.createElement("div"); bandeau.className = "annonce"; bandeau.setAttribute("role", "region"); bandeau.setAttribute("aria-label", "Annonce");
      document.body.prepend(bandeau); document.body.classList.add("avec-annonce");
    }
    bandeau.innerHTML = `<p><span class="annonce-pastille">${echapper(an.pastille)}</span> <span class="annonce-long">${echapper(an.texte)}</span></p>
      <a class="annonce-lien" href="${echapper(discord)}">${echapper(an.lien)}</a><button type="button" class="annonce-fermer" aria-label="Fermer l'annonce">×</button>`;
    bandeau.querySelector(".annonce-fermer").addEventListener("click", () => { ecrire("historia-annonce", an.texte); retirerAnnonce(); });
    caler();
  }
  annoncer(ANNONCE, DISCORD);

  // bouton musique (éteint par défaut, jamais de lecture automatique)
  const audio = new Audio("sons/majestic_hills.ogg"); audio.loop = true; audio.volume = 0; audio.preload = "none";
  const m = document.createElement("button");
  m.type = "button"; m.className = "musique"; m.setAttribute("aria-pressed", "false");
  m.innerHTML = `<span class="musique-barres" aria-hidden="true"><i></i><i></i><i></i></span><span class="musique-texte">Musique</span>`;
  let fondu;
  const volume = (cible, fin) => { clearInterval(fondu); fondu = setInterval(() => { audio.volume = Math.max(0, Math.min(1, audio.volume + (cible > audio.volume ? 0.04 : -0.06))); if (Math.abs(audio.volume - cible) < 0.05) { audio.volume = cible; clearInterval(fondu); if (fin) fin(); } }, 60); };
  m.addEventListener("click", () => {
    const allume = m.getAttribute("aria-pressed") !== "true";
    m.setAttribute("aria-pressed", allume); m.querySelector(".musique-texte").textContent = allume ? "Couper" : "Musique";
    if (allume) { audio.play().then(() => volume(0.35)).catch(() => {}); } else volume(0, () => audio.pause());
  });
  document.body.appendChild(m);

  // barre « Jouer » collée en bas sur téléphone
  const b = document.createElement("div");
  b.className = "barre-mobile";
  b.innerHTML = `<button type="button" class="barre-musique" aria-label="Musique" aria-pressed="false"><span class="musique-barres" aria-hidden="true"><i></i><i></i><i></i></span></button><button type="button" class="barre-ip" data-copier="${ADRESSE}" aria-label="${ADRESSE} : copier l'adresse"><small>Copier l'adresse</small><b>${ADRESSE}</b></button><a class="bouton bouton-discord bouton-petit" href="${DISCORD}">Discord</a>`;
  document.body.appendChild(b);
  // sur téléphone, le bouton musique vit dans la barre du bas
  const bm = b.querySelector(".barre-musique");
  bm.addEventListener("click", () => m.click());
  new MutationObserver(() => bm.setAttribute("aria-pressed", m.getAttribute("aria-pressed"))).observe(m, { attributes: true, attributeFilter: ["aria-pressed"] });
  b.querySelector("[data-copier]").addEventListener("click", async () => { try { await navigator.clipboard.writeText(ADRESSE); Historia.annoncer("Adresse copiée · " + ADRESSE); } catch { Historia.annoncer("Adresse · " + ADRESSE); } });

  // statut du serveur en direct (service public mcsrvstat.us) ; rien n'est affiché s'il ne répond pas
  const statuts = [...document.querySelectorAll(".en-ligne")];
  if (statuts.length && "AbortController" in window) {
    const arret = new AbortController(); setTimeout(() => arret.abort(), 6000);
    fetch(`https://api.mcsrvstat.us/3/${ADRESSE}`, { signal: arret.signal }).then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return;
      const n = d.online && d.players ? d.players.online : null;
      for (const s of statuts) { s.querySelector("b").textContent = !d.online ? "Hors ligne" : n > 0 ? `${n} en ligne` : "Serveur en ligne"; s.classList.toggle("hors-ligne", !d.online); s.hidden = false; }
    }).catch(() => {});
  }

  // pages intérieures : un dernier appel avant le pied de page (adresse à copier, Discord)
  const piedPage = document.querySelector(".pied");
  if (piedPage && document.body.classList.contains("page-interne") && !document.body.classList.contains("admin") && !/404|bientot/.test(location.pathname)) {
    const cta = document.createElement("section"); cta.className = "appel-final"; cta.setAttribute("aria-labelledby", "appel-h");
    cta.innerHTML = `<div class="decor decor-voile" data-theme="aube" aria-hidden="true"></div>
      <div class="conteneur appel-contenu"><p class="numero">Prêt à partir ?</p><h2 id="appel-h">Le royaume t'attend</h2>
      <p class="sous-texte">Minecraft Java 26.2, aucun mod à installer. La bêta fermée se prépare sur le Discord.</p>
      <div class="appel-actions"><button type="button" class="ip" data-copier="${ADRESSE}" aria-label="${ADRESSE} : copier l'adresse"><span class="ip-adresse">${ADRESSE}</span><span class="ip-copier">Copier</span></button>
      <a class="bouton bouton-discord" href="${DISCORD}">Rejoindre le Discord</a></div></div>`;
    cta.id = "jouer"; piedPage.before(cta);
    // le bouton « Jouer » de l'en-tête mène à cet appel, sans quitter la page
    document.querySelectorAll('.entete a[href="index.html#finale"]').forEach(j => { j.href = "#jouer"; });
    cta.querySelector("[data-copier]").addEventListener("click", async () => { try { await navigator.clipboard.writeText(ADRESSE); Historia.annoncer("Adresse copiée · " + ADRESSE); } catch { Historia.annoncer("Adresse · " + ADRESSE); } });
  }

  // réglages du back-office : lien Discord et bandeau d'annonce
  fetch("donnees/config.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : null).then(c => {
    if (!c) return;
    if (c.discord && /^https:\/\//.test(c.discord)) document.querySelectorAll('a[href^="https://discord.gg/"]').forEach(a => { a.href = c.discord; });
    if (c.annonce) annoncer({ ...ANNONCE, ...c.annonce }, c.discord || DISCORD);
    // adresse et version du serveur : remplacées partout où elles s'affichent (textes, boutons de copie)
    const remplacer = (avant, apres) => { if (!apres || apres === avant) return;
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) if (n.nodeValue.includes(avant)) n.nodeValue = n.nodeValue.split(avant).join(apres);
      document.querySelectorAll("[data-copier], [aria-label]").forEach(el => { for (const at of ["data-copier", "aria-label"]) { const v = el.getAttribute(at); if (v && v.includes(avant)) el.setAttribute(at, v.split(avant).join(apres)); } }); };
    remplacer(ADRESSE, c.adresse); remplacer("Java 26.2", c.version);
  }).catch(() => {});

  // tant que le vrai lien d'invitation n'est pas renseigné (back-office), un bouton Discord n'envoie pas vers une page d'erreur
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="https://discord.gg/"]'); if (!a) return;
    if (/^https:\/\/discord\.gg\/?$/.test(a.getAttribute("href"))) { e.preventDefault(); Historia.annoncer("Le Discord ouvre très bientôt : le lien d'invitation arrive ici."); }
  });

  // crédit de la musique (licence CC BY 4.0)
  const pied = document.querySelector(".pied-in");
  if (pied) { const p = document.createElement("p"); p.className = "credit"; p.innerHTML = `Musique : « Majestic Hills », Kevin MacLeod (<a href="https://incompetech.com">incompetech.com</a>), licence <a href="https://creativecommons.org/licenses/by/4.0/deed.fr">CC BY 4.0</a>. Polices : Monocraft (Idrees Hassan) et Figtree (The Figtree Project Authors), licence SIL OFL 1.1.`; pied.appendChild(p); }
})();
