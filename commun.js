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
  const proche = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !scenes.has(e.target)) monter(e.target); }), { rootMargin: "900px 0px" });
  function monterTout() {
    for (const el of $$(".decor[data-theme]")) {
      if (!el.dataset.suivi) { el.dataset.suivi = "1"; vis.observe(el); if (!el.closest("[data-a-la-demande]")) proche.observe(el); }
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
