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

  // fonds en pixel art
  const scenes = new Map();
  const vis = new IntersectionObserver(es => es.forEach(e => { const s = scenes.get(e.target); if (s) s.visible = e.isIntersecting; }));
  function monterTout() {
    for (const el of $$(".decor[data-theme]")) {
      const th = Pixel.THEMES[el.dataset.theme]; if (!th) continue;
      const anc = scenes.get(el), s = Pixel.monter(el, th);
      s.visible = anc ? anc.visible : false; scenes.set(el, s); if (!anc) vis.observe(el);
    }
  }
  const couchesDe = el => (scenes.get(el) || { couches: [] }).couches.filter(c => Number(c.dataset.profondeur) > 0);

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
    calme, $, $$, annoncer, couchesDe, surDefilement, surBoucle, monterTout,
    demarrer() { monterTout(); defiler(); if (!calme) requestAnimationFrame(boucle); },
  };
})();
