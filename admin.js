// Back-office du site : édite donnees/nouveautes.json, donnees/feuille-de-route.json et donnees/config.json
// et les enregistre dans le dépôt GitHub (API Contents) avec le jeton de l'utilisateur. Aucun serveur entre les deux :
// le jeton reste dans ce navigateur (session, ou appareil si « se souvenir »).
"use strict";
(() => {
  const DEPOT = "Antaooo/historia-site", BRANCHE = "main", API = `https://api.github.com/repos/${DEPOT}`;
  const FICHIERS = { nouveautes: "donnees/nouveautes.json", route: "donnees/feuille-de-route.json", reglages: "donnees/config.json" };
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const { rendus, trier, echapper } = window.HistoriaDonnees;
  const etat = $("#etat"), toast = $("#toast");
  const dire = (t, erreur) => { toast.textContent = t; toast.classList.toggle("erreur", !!erreur); toast.classList.add("visible"); clearTimeout(dire.m); dire.m = setTimeout(() => toast.classList.remove("visible"), erreur ? 6000 : 3000); };
  const stock = { lire: () => sessionStorage.getItem("historia-jeton") || localStorage.getItem("historia-jeton"), oublier: () => { sessionStorage.removeItem("historia-jeton"); localStorage.removeItem("historia-jeton"); } };
  let jeton = null;
  const donnees = {}, sha = {}, modifie = { nouveautes: false, route: false, reglages: false };

  // ---------- GitHub ----------
  const appel = (chemin, options = {}) => fetch(API + chemin, { ...options, headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${jeton}`, "X-GitHub-Api-Version": "2022-11-28", ...(options.headers || {}) } })
    .then(async r => { if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(r.status === 401 ? "Jeton refusé (invalide ou expiré)." : r.status === 403 || r.status === 404 ? "Ce jeton n'a pas accès au dépôt en écriture." : r.status === 409 ? "Le fichier a changé entre-temps : recharge la page." : (e.message || `Erreur ${r.status}`)); } return r.json(); });
  const versTexte = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), c => c.charCodeAt(0)));
  const versB64 = texte => { const o = new TextEncoder().encode(texte); let s = ""; for (let i = 0; i < o.length; i += 0x8000) s += String.fromCharCode(...o.subarray(i, i + 0x8000)); return btoa(s); };
  const charger = async cle => { const f = await appel(`/contents/${FICHIERS[cle]}?ref=${BRANCHE}`); sha[cle] = f.sha; donnees[cle] = JSON.parse(versTexte(f.content)); };
  const enregistrer = async (cle, message) => {
    const f = await appel(`/contents/${FICHIERS[cle]}`, { method: "PUT", body: JSON.stringify({ message, branch: BRANCHE, sha: sha[cle], content: versB64(JSON.stringify(donnees[cle], null, 2) + "\n") }) });
    sha[cle] = f.content.sha;
  };

  // ---------- connexion ----------
  async function connecter(t) {
    jeton = t; etat.textContent = "Connexion…";
    try {
      const depot = await appel("");
      if (!depot.permissions || !depot.permissions.push) throw new Error("Ce jeton peut lire le dépôt mais pas y écrire.");
      await Promise.all(Object.keys(FICHIERS).map(charger));
      $("#connexion").hidden = true; $("#editeur").hidden = false; $("#deconnexion").hidden = false;
      etat.textContent = "Connecté · " + DEPOT; toutAfficher();
    } catch (e) { jeton = null; stock.oublier(); etat.textContent = ""; dire(e.message, true); }
  }
  $("#form-connexion").addEventListener("submit", e => {
    e.preventDefault(); const t = $("#jeton").value.trim(); if (!t) return;
    ($("#souvenir").checked ? localStorage : sessionStorage).setItem("historia-jeton", t); $("#jeton").value = ""; connecter(t);
  });
  $("#deconnexion").addEventListener("click", () => { if (Object.values(modifie).some(Boolean) && !confirm("Des modifications ne sont pas publiées. Se déconnecter quand même ?")) return; stock.oublier(); location.reload(); });
  if (stock.lire()) connecter(stock.lire());

  // ---------- onglets ----------
  $$("[data-onglet]").forEach(b => b.addEventListener("click", () => {
    $$("[data-onglet]").forEach(x => x.setAttribute("aria-selected", x === b));
    $$(".admin-panneau").forEach(p => { p.hidden = p.id !== "p-" + b.dataset.onglet; });
  }));
  const marquer = (cle, oui = true) => { modifie[cle] = oui; const b = $(`[data-publier="${cle}"]`); b.textContent = oui ? "Publier •" : "Publier"; };
  addEventListener("beforeunload", e => { if (Object.values(modifie).some(Boolean)) { e.preventDefault(); e.returnValue = ""; } });

  // ---------- nouveautés ----------
  const listeN = $("#liste-nouveautes");
  function afficherNouveautes() {
    const l = donnees.nouveautes;
    listeN.innerHTML = l.map((n, i) => `<div class="carte-verre admin-fiche" data-i="${i}">
      <div class="admin-ligne"><label class="admin-champ admin-date"><span>Date</span><input type="date" data-champ="date" value="${echapper(n.date)}" required></label>
        <label class="admin-champ"><span>Titre</span><input type="text" data-champ="titre" value="${echapper(n.titre)}" maxlength="80" required></label>
        <button type="button" class="admin-suppr" data-suppr aria-label="Supprimer cette nouveauté">Supprimer</button></div>
      <label class="admin-champ"><span>Texte</span><textarea data-champ="texte" rows="3">${echapper(n.texte)}</textarea></label></div>`).join("");
    $("#apercu-nouveautes").innerHTML = rendus.journal(trier(l));
  }
  listeN.addEventListener("input", e => { const c = e.target.dataset.champ, i = e.target.closest("[data-i]")?.dataset.i; if (!c) return; donnees.nouveautes[i][c] = e.target.value; marquer("nouveautes"); $("#apercu-nouveautes").innerHTML = rendus.journal(trier(donnees.nouveautes)); });
  listeN.addEventListener("click", e => { if (!e.target.matches("[data-suppr]")) return; const i = e.target.closest("[data-i]").dataset.i, n = donnees.nouveautes[i]; if (!confirm(`Supprimer « ${n.titre} » ?`)) return; donnees.nouveautes.splice(i, 1); marquer("nouveautes"); afficherNouveautes(); });
  $("#ajout-nouveaute").addEventListener("click", () => { const j = new Date(), aujourdhui = `${j.getFullYear()}-${String(j.getMonth() + 1).padStart(2, "0")}-${String(j.getDate()).padStart(2, "0")}`; donnees.nouveautes.unshift({ date: aujourdhui, titre: "", texte: "" }); marquer("nouveautes"); afficherNouveautes(); listeN.querySelector("[data-champ=titre]").focus(); });

  // ---------- feuille de route ----------
  const listeR = $("#liste-etapes"), STATUTS = [["fait", "Fait"], ["presque", "En cours · presque fini"], ["en-cours", "En cours"], ["a-venir", "À venir"]];
  function afficherRoute() {
    const l = donnees.route;
    listeR.innerHTML = l.map((e, i) => `<div class="carte-verre admin-fiche" data-i="${i}">
      <div class="admin-ligne"><span class="admin-num">${i + 1}</span>
        <label class="admin-champ"><span>Titre</span><input type="text" data-champ="titre" value="${echapper(e.titre)}" maxlength="60"></label>
        <label class="admin-champ admin-statut"><span>Statut</span><select data-champ="statut">${STATUTS.map(([v, t]) => `<option value="${v}"${e.statut === v ? " selected" : ""}>${t}</option>`).join("")}</select></label>
        <span class="admin-ordre"><button type="button" data-monter aria-label="Monter l'étape">▲</button><button type="button" data-descendre aria-label="Descendre l'étape">▼</button></span>
        <button type="button" class="admin-suppr" data-suppr aria-label="Supprimer cette étape">Supprimer</button></div>
      <label class="admin-champ"><span>Étiquette (facultatif, remplace le statut affiché)</span><input type="text" data-champ="etiquette" value="${echapper(e.etiquette || "")}" maxlength="40"></label>
      <label class="admin-champ"><span>Points (un par ligne)</span><textarea data-champ="puces" rows="4">${echapper((e.puces || []).join("\n"))}</textarea></label></div>`).join("");
    $("#apercu-route").innerHTML = rendus.route(l);
  }
  listeR.addEventListener("input", e => { const c = e.target.dataset.champ, i = e.target.closest("[data-i]")?.dataset.i; if (!c) return;
    const v = e.target.value; if (c === "puces") donnees.route[i].puces = v.split("\n").map(x => x.trim()).filter(Boolean); else if (c === "etiquette" && !v.trim()) delete donnees.route[i].etiquette; else donnees.route[i][c] = v;
    marquer("route"); $("#apercu-route").innerHTML = rendus.route(donnees.route); });
  listeR.addEventListener("change", e => { if (e.target.dataset.champ === "statut") listeR.dispatchEvent(new Event("input")); });
  listeR.addEventListener("click", e => {
    const fiche = e.target.closest("[data-i]"); if (!fiche) return; const i = Number(fiche.dataset.i), l = donnees.route;
    if (e.target.matches("[data-suppr]")) { if (!confirm(`Supprimer l'étape « ${l[i].titre} » ?`)) return; l.splice(i, 1); }
    else if (e.target.matches("[data-monter]") && i > 0) [l[i - 1], l[i]] = [l[i], l[i - 1]];
    else if (e.target.matches("[data-descendre]") && i < l.length - 1) [l[i + 1], l[i]] = [l[i], l[i + 1]];
    else return;
    marquer("route"); afficherRoute();
  });
  $("#ajout-etape").addEventListener("click", () => { donnees.route.push({ titre: "Nouvelle étape", statut: "a-venir", puces: [] }); marquer("route"); afficherRoute(); });

  // ---------- réglages ----------
  const R = { discord: "#r-discord", adresse: "#r-adresse", version: "#r-version" }, A = { pastille: "#r-pastille", texte: "#r-texte", lien: "#r-lien" };
  function afficherReglages() {
    const c = donnees.reglages; for (const [k, s] of Object.entries(R)) $(s).value = c[k] || "";
    c.annonce = c.annonce || {}; for (const [k, s] of Object.entries(A)) $(s).value = c.annonce[k] || ""; $("#r-active").checked = c.annonce.active !== false;
  }
  $("#p-reglages").addEventListener("input", () => {
    const c = donnees.reglages; for (const [k, s] of Object.entries(R)) c[k] = $(s).value.trim();
    for (const [k, s] of Object.entries(A)) c.annonce[k] = $(s).value.trim(); c.annonce.active = $("#r-active").checked; marquer("reglages");
  });

  // ---------- publication ----------
  const verifier = cle => {
    if (cle === "nouveautes") { const n = donnees.nouveautes.find(x => !/^\d{4}-\d{2}-\d{2}$/.test(x.date) || !x.titre.trim() || !x.texte.trim()); if (n) return "Chaque nouveauté doit avoir une date, un titre et un texte."; }
    if (cle === "route") { if (donnees.route.some(e => !e.titre.trim())) return "Chaque étape doit avoir un titre."; }
    if (cle === "reglages") { const d = donnees.reglages.discord; if (d && !/^https:\/\/(discord\.gg|discord\.com)\//.test(d)) return "Le lien Discord doit commencer par https://discord.gg/ ou https://discord.com/."; }
    return null;
  };
  const MESSAGES = { nouveautes: "Back-office : nouveautés mises à jour", route: "Back-office : feuille de route mise à jour", reglages: "Back-office : réglages mis à jour" };
  $$("[data-publier]").forEach(b => b.addEventListener("click", async () => {
    const cle = b.dataset.publier, err = verifier(cle); if (err) { dire(err, true); return; }
    if (cle === "nouveautes") donnees.nouveautes = trier(donnees.nouveautes);
    b.disabled = true; b.textContent = "Publication…";
    try { await enregistrer(cle, MESSAGES[cle]); marquer(cle, false); dire("Publié. Le site sera à jour dans une minute environ."); if (cle === "nouveautes") afficherNouveautes(); }
    catch (e) { marquer(cle, modifie[cle]); dire(e.message, true); }
    finally { b.disabled = false; }
  }));

  function toutAfficher() { afficherNouveautes(); afficherRoute(); afficherReglages(); }
})();
