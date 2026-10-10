// Commun à toutes les pages : en-tête, menu mobile, barre de progression, copie de l'adresse, fonds en pixel art
// (montage, particules des fonds visibles, reconstruction au redimensionnement).
"use strict";
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const calme = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const entete = $("#entete"), barre = $("#progression"), burger = $(".burger"), nav = $("#nav");
  if (burger) burger.addEventListener("click", () => { const o = nav.classList.toggle("ouvert"); burger.setAttribute("aria-expanded", o); burger.setAttribute("aria-label", o ? "Fermer le menu" : "Ouvrir le menu"); });

  const toast = $("#toast"); let tm;
  const annoncer = t => { if (!toast) return; toast.textContent = t; toast.classList.add("visible"); clearTimeout(tm); tm = setTimeout(() => toast.classList.remove("visible"), 2200); };
  $$("[data-copier]").forEach(b => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(b.dataset.copier); annoncer("Adresse copiée · " + b.dataset.copier); } catch { annoncer("Adresse · " + b.dataset.copier); }
  }));

  // fonds en pixel art, dessinés à la demande : un fond n'est calculé qu'à l'approche de l'écran (ou sur appel de monter)
  const scenes = new Map(), visibles = new Set();
  function monter(el) {
    const th = Pixel.THEMES[el.dataset.theme]; if (!th) return null;
    const s = Pixel.monter(el, th); s.visible = visibles.has(el); scenes.set(el, s); return s;
  }
  const vis = new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target); const s = scenes.get(e.target); if (s) s.visible = e.isIntersecting; }));
  // les fonds à l'écran sont dessinés tout de suite ; ceux qui approchent attendent un temps mort, un par un,
  // pour ne jamais bloquer le navigateur au chargement
  const file = [], auRepos = f => ("requestIdleCallback" in window ? requestIdleCallback(f, { timeout: 1500 }) : setTimeout(f, 60));
  let enCours = false;
  const suivant = () => { const el = file.shift(); if (!el) { enCours = false; return; } if (!scenes.has(el)) monter(el); auRepos(suivant); };
  const proche = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting || scenes.has(e.target)) return;
    const r = e.target.getBoundingClientRect();
    // un décor qui a son affiche (image fixe déjà affichée) attend un temps mort, même à l'écran
    if (r.bottom > 0 && r.top < innerHeight && !("affiche" in e.target.dataset)) monter(e.target);
    else if (!file.includes(e.target)) { file.push(e.target); if (!enCours) { enCours = true; auRepos(suivant); } }
  }), { rootMargin: "500px 0px" });
  // un fond qui arrive à l'écran avant son tour est dessiné aussitôt
  const urgent = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting || scenes.has(e.target) || "affiche" in e.target.dataset) return; const i = file.indexOf(e.target); if (i >= 0) file.splice(i, 1); monter(e.target); }));
  function monterTout() {
    for (const el of $$(".decor[data-theme]")) {
      if (!el.dataset.suivi) { el.dataset.suivi = "1"; vis.observe(el); if (!el.closest("[data-a-la-demande]")) { proche.observe(el); urgent.observe(el); } }
      if (scenes.has(el)) monter(el); // redimensionnement : on redessine ce qui l'était déjà
    }
  }
  const couchesDe = el => (scenes.get(el) || { couches: [] }).couches.filter(c => Number(c.dataset.profondeur) > 0);
  // une image fixe (galerie, mur) dessinée seulement quand sa vignette approche de l'écran
  const images = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; images.unobserve(e.target); const { theme, l, h } = e.target.dataset; const cv = Pixel.image(Pixel.THEMES[theme], +l, +h); cv.className = "rendu-pixel"; e.target.appendChild(cv); }), { rootMargin: "600px 0px" });
  const imageDiffere = (el, theme, l, h) => { Object.assign(el.dataset, { theme, l, h }); images.observe(el); };

  const surDefilement = [], surBoucle = [];
  function defiler() {
    const y = scrollY, total = document.documentElement.scrollHeight - innerHeight;
    if (entete) entete.classList.toggle("solide", y > 40);
    if (barre) barre.style.transform = `scaleX(${total > 0 ? y / total : 0})`;
    surDefilement.forEach(f => f(y));
  }
  addEventListener("scroll", () => requestAnimationFrame(defiler), { passive: true });

  let largeur = innerWidth, attente;
  addEventListener("resize", () => { if (Math.abs(innerWidth - largeur) < 40) return; largeur = innerWidth; clearTimeout(attente); attente = setTimeout(() => { monterTout(); defiler(); }, 250); });

  function boucle(t) { scenes.forEach(s => { if (s.visible) s.animer(t); }); surBoucle.forEach(f => f(t)); requestAnimationFrame(boucle); }

  window.Historia = {
    calme, $, $$, annoncer, couchesDe, surDefilement, surBoucle, monterTout, imageDiffere,
    monter: el => scenes.get(el) || monter(el),
    demarrer() { monterTout(); defiler(); if (!calme) requestAnimationFrame(boucle); },
  };
})();

// sommaire des pages intérieures : section en cours, rangé en descendant, effacé sur le pied de page
(() => {
  const s = document.querySelector(".sommaire"); if (!s) return;
  const liens = [...s.querySelectorAll('a[href^="#"]')], cibles = liens.map(a => document.getElementById(a.getAttribute("href").slice(1))).filter(Boolean);
  const pied = document.querySelector(".pied"); let dernier = scrollY, piedVisible = false;
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) liens.forEach(a => a.setAttribute("aria-current", a.getAttribute("href") === "#" + e.target.id)); }), { rootMargin: "-40% 0px -55% 0px" });
  cibles.forEach(c => io.observe(c));
  if (pied) new IntersectionObserver(es => { piedVisible = es[0].isIntersecting; maj(); }).observe(pied);
  function maj() { const y = scrollY, descend = y > dernier + 4, monte = y < dernier - 4; if (descend || monte || piedVisible) s.classList.toggle("range", piedVisible || (descend && y > 300)); if (descend || monte) dernier = y; }
  addEventListener("scroll", () => requestAnimationFrame(maj), { passive: true });
  s.addEventListener("focusin", () => s.classList.remove("range"));
})();

// menu mobile : se ferme avec Échap, au clic à l'extérieur ou sur un lien
(() => {
  const burger = document.querySelector(".burger"), nav = document.getElementById("nav"); if (!burger || !nav) return;
  const fermer = (rendreFocus) => { if (!nav.classList.contains("ouvert")) return; nav.classList.remove("ouvert"); burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Ouvrir le menu"); if (rendreFocus) burger.focus(); };
  addEventListener("keydown", e => { if (e.key === "Escape") fermer(true); });
  document.addEventListener("click", e => { if (!nav.contains(e.target) && !burger.contains(e.target)) fermer(false); });
  nav.addEventListener("click", e => { if (e.target.closest("a")) fermer(false); });
})();

// typographie française : espace insécable avant ? ! : ; » et après «, pour qu'aucun signe ne se retrouve seul à la ligne
(() => {
  const zone = document.body, tw = document.createTreeWalker(zone, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest("script, style, code, pre, textarea") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const corriger = t => t.replace(/ ([?!:;»])/g, " $1").replace(/« /g, "« ");
  let n; while ((n = tw.nextNode())) { const v = corriger(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
})();
