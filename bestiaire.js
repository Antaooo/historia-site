// Bestiaire des légendes : les boss déjà présents dans le monde, vérifiés contre leurs apparitions en jeu.
// Aucune position : seulement le biome et le nom du repaire. Filtres par famille et recherche.
"use strict";
(() => {
  // [portrait, nom, épithète, famille, lieu, repaire, texte]
  const LEGENDES = [
    ["azriel", "Azriel, ange de la mort", "Seigneur de la cathédrale noire", "Morts-vivants", "Bois hanté, Steppe embrasée", "Cathédrale noire", "Sous les vitraux noirs d'une nef effondrée, un ange aux ailes funèbres attend devant son autel. Ses sbires errent dans la nef : n'y entre jamais seul."],
    ["capra", "Capra", "Le démon-bouc de l'autel", "Démons", "Steppe embrasée, Sources ardentes", "Autel du bouc", "Sur un autel noirci entouré de braseros, un porcelet innocent attend au centre du cercle. Ceux qui troublent le rituel voient se lever le démon-bouc."],
    ["cerberus", "Cerbère", "Gardien de la porte des Enfers", "Bêtes et monstres", "Steppe embrasée, Sources ardentes", "Porte des Enfers", "Une gueule de basalte s'ouvre dans les terres brûlées, et trois têtes y montent la garde. Ses chiens des enfers ne laissent jamais un intrus repartir tranquille."],
    ["demon_of_chaos_gama05", "Démon du chaos", "Maître de la forteresse ardente", "Démons", "Caldeira, Coulées de lave", "Forteresse du chaos", "Au sommet d'une butte de basalte fendue par la lave se dresse un bastion en étoile. Celui qui foule son arène voit le démon surgir dans une explosion de flammes."],
    ["elven_druid", "La Druidesse elfe", "Gardienne de l'arbre lunaire", "Elfes", "Forêt lunaire", "Arbre lunaire colossal", "Perchée dans les branches de l'arbre blanc de la forêt lunaire, elle veille sur son peuple. Les gardiens elfes qui l'entourent ne tolèrent aucun étranger."],
    ["ent_king", "Le Roi des ents", "Souverain des forêts anciennes", "Esprits et féerique", "Forêts, Jungle ancestrale", "Chêne colossal", "Au pied des chênes colossaux s'éveille un roi d'écorce, entouré de sa cour de guerriers et de sorciers sylvestres. Toute la forêt se lève quand on menace ses arbres."],
    ["flamental", "Flamental", "Élémentaire de feu des volcans", "Démons", "Caldeira, Coulées de lave", "Errant", "On ne le trouve dans aucun repaire : il marche au hasard des coulées de lave, flamme vivante qui embrase tout sur son passage."],
    ["glume", "Glume", "L'esprit des champignons géants", "Esprits et féerique", "Île aux champignons, Forêt sombre", "Champignons géants", "Sous les chapeaux des champignons géants, une silhouette coiffée de mousse glisse entre les spores. Ne te fie pas à son air discret."],
    ["goblin_king", "Le Roi gobelin", "Chef des pillards verts", "Gobelins", "Plaines, Savane", "Camp gobelin", "Au milieu de son camp de bric et de broc, le roi gobelin commande une horde armée de poêles et de fourches. Là où il trône, sa bande n'est jamais loin."],
    ["hana", "Hana", "Gardienne des sakuras", "Esprits et féerique", "Vallée des sakuras, Jardin des fées", "Sakura colossal", "Au pied du cerisier géant, sur un tapis de pétales roses, une jeune fille aux bois de cerf attend, une lame à la main. La beauté du lieu ne doit pas te faire baisser ta garde."],
    ["kraken", "Le Kraken", "Terreur des épaves englouties", "Créatures marines", "Abysses, Récif des merveilles", "Épaves", "Les navires coulés ne sont pas abandonnés : des tentacules immenses s'enroulent autour de leurs coques. Plonge vers un trésor englouti à tes risques et périls."],
    ["kriger", "Kriger", "Le gardien enchaîné", "Morts-vivants", "Plaines, Forêt", "Église du gardien", "Dans une église en ruine, un guerrier drapé et chargé de chaînes dort d'un sommeil de pierre. Approche-toi trop, et il se réveille."],
    ["lillith", "Lillith", "La démone du cercle", "Démons", "Bois hanté", "Cercle d'invocation", "Au cœur du bois hanté, une clairière de cendres s'ouvre autour d'un cercle de pierres calcinées. Le rituel inachevé n'attend qu'un imprudent pour faire surgir la démone."],
    ["lr_anubis", "Anubis", "Seigneur du tombeau ensablé", "Morts-vivants", "Désert", "Tombeau d'Anubis", "Une pyramide à demi enfouie sous le sable garde son maître à tête de chacal. Il dort sur son trône, entouré de momies, jusqu'à ce qu'un pilleur ose s'approcher."],
    ["lr_gryffin", "Le Griffon", "Seigneur des aiguilles de pierre", "Bêtes et monstres", "Pics de granit, Falaises blanches", "Aire du griffon", "Au sommet d'une aiguille de roche sculptée par le vent, le griffon couve son aire. Celui qui gravit la corniche doit être prêt à affronter ses serres."],
    ["lr_minotaur", "Le Minotaure", "Gardien du labyrinthe", "Bêtes et monstres", "Falaises blanches, Prairie alpine", "Labyrinthe du Minotaure", "Aucun labyrinthe ne ressemble à un autre, et tous mènent à la même arène. Le Minotaure connaît chaque raccourci : il te coupera la route."],
    ["lr_yeti", "Le Yéti", "Le colosse des neiges", "Bêtes et monstres", "Forêt boréale", "Grotte du Yéti", "Une cascade gelée cache l'entrée de sa grotte, au cœur de la forêt boréale. Dans le froid et le silence, le Yéti n'aime pas être dérangé."],
    ["magnus", "Magnus", "Le champion de l'arène", "Humains", "Lande de bruyère, Hautes terres rocheuses", "Arène de Magnus", "Au centre d'une arène de pierre, un feu de camp éteint attend qu'on le rallume. Ceux qui l'osent voient Magnus tomber du ciel, épée au poing."],
    ["medusa", "Méduse", "La gorgone du temple", "Bêtes et monstres", "Falaises blanches, Falaises côtières", "Temple de Méduse", "Entre les colonnes d'un temple en ruine au bord des falaises se dressent des statues aux visages terrifiés. Ne croise jamais son regard."],
    ["mega_warden", "Le Méga-Gardien", "Le colosse des cités antiques", "Golems et êtres minéraux", "Grottes abyssales", "Cité antique", "Tout au fond du monde, parmi les ruines des cités antiques, un gardien plus grand que tous les autres guette le moindre bruit. Avance sans un son."],
    ["megalodon", "Le Mégalodon", "Le requin des profondeurs", "Créatures marines", "Abysses, Récif des merveilles", "Errant", "Il n'a pas de repaire : il chasse en pleine mer, là où l'eau devient sombre. Si une ombre immense passe sous toi, nage vers la rive."],
    ["mortos", "Mortos", "Le dragon revenu d'entre les morts", "Morts-vivants", "Marais maudit", "Cimetière du dragon", "Sur un îlot de boue au milieu du marais repose le squelette d'un dragon colossal. Mais ses os ne dorment pas tous."],
    ["nightharrow_wendigo", "Le Wendigo", "Le chasseur des nuits glacées", "Morts-vivants", "Taïga ancienne, Forêt boréale", "Clairière du Wendigo", "Il existe une clairière glacée où rien ne repousse : c'est là qu'il se terre. Certaines nuits pourtant, il quitte sa tanière et rôde entre les grands conifères."],
    ["oblivion", "Oblivion", "L'ombre du marais maudit", "Morts-vivants", "Marais maudit", "Errant", "Les nuits les plus noires, un cercle de runes rouges s'allume sur la vase du marais maudit. Ce qui en sort n'a plus de nom."],
    ["phoenix", "Le Phénix", "L'oiseau de feu immortel", "Bêtes et monstres", "Steppe embrasée, Sources ardentes", "Nid du Phénix", "Au sommet d'un pic de basalte veiné de magma, le Phénix couve son nid ardent. On dit qu'il renaît toujours de ses cendres."],
    ["pirate_captain", "Le capitaine DeadBeard", "Le maître de la crique", "Pirates", "Plage dorée, Plage tropicale", "Crique des pirates", "Un trois-mâts éventré s'est échoué sur la plage, et son capitaine règne encore sur la dunette. Son équipage garde le sable, où se cache peut-être une clé enterrée."],
    ["skog", "Skog", "L'esprit du cœur de la forêt", "Esprits et féerique", "Forêt, Taïga ancienne", "Cœur de la forêt", "Au plus profond des bois, une clairière sacrée abrite l'esprit de la forêt. Il protège chaque arbre comme une partie de lui-même."],
    ["tiamat", "Tiamat", "Le dragon des ténèbres", "Bêtes et monstres", "Grottes de cristal, Grottes abyssales", "Antre de Tiamat", "Un cercle de pierres noircies marque l'entrée d'un puits qui plonge loin sous terre. Tout au fond, le dragon dort au-dessus de sa caverne, et il tombe sur ceux qui le réveillent."],
    ["viking", "Bjorn l'Exalté", "Chef du camp viking", "Vikings", "Taïga, Forêt boréale", "Camp viking", "Derrière la palissade d'un camp du Nord, sous le toit en carène de la maison longue, Bjorn règne sur ses guerriers. Les plus braves viennent l'y défier."],
    ["voras", "Voras", "La reine araignée du marais", "Bêtes et monstres", "Marais maudit", "Nid de Voras", "Dans un bosquet d'arbres morts tendu de toiles épaisses, la reine araignée guette ses proies. Chaque fil qui vibre la prévient de ton arrivée."],
    ["wolfebersahd", "Wolfebersa", "Le loup-garou berserker", "Bêtes et monstres", "Bois hanté", "Tanière du berserker", "Sous les racines d'un arbre géant, un tertre creusé abrite une bête à moitié homme, à moitié loup. Sa fureur ne connaît aucune limite."],
    ["wu", "Wu, maître d'encre", "Le maître du pavillon", "Esprits et féerique", "Bambouseraie brumeuse", "Pavillon de l'encre", "Derrière une porte de lune, au bord d'un étang à lotus, un pavillon abrite la table du calligraphe. Qui touche à ses pinceaux réveille le maître d'encre."],
    ["zahar", "Zahar", "L'alchimiste fou du marais", "Sorciers et alchimistes", "Marais maudit", "Laboratoire interdit", "Dans une cabane sur pilotis noyée de vapeurs, un alchimiste poursuit des expériences que nul n'aurait dû tenter. Ce qu'il a créé rôde encore autour du laboratoire."],
  ];
  const TEINTE = { "Bêtes et monstres": "#C08A4B", "Morts-vivants": "#5F8F7A", "Démons": "#C0453A", "Esprits et féerique": "#3F9D8F", "Golems et êtres minéraux": "#6AA7C7", "Créatures marines": "#2F7FA5", "Elfes": "#8F6FC9", "Gobelins": "#6F9A2A", "Vikings": "#4C78A8", "Pirates": "#2F7FA5", "Humains": "#C08A4B", "Sorciers et alchimistes": "#9A6FB0" };
  const tri = (a, b) => a.localeCompare(b, "fr");
  const familles = [...new Set(LEGENDES.map(l => l[3]))].sort(tri);
  const liste = [...LEGENDES].sort((a, b) => tri(a[1].replace(/^(Le |La |L')/, ""), b[1].replace(/^(Le |La |L')/, "")));
  const FICHES = liste.map(([p, nom, titre, famille, lieu, repaire, texte]) => `
    <article class="fiche-boss carte-verre" id="boss-${p}" style="--c:${TEINTE[famille] || "#F2C14E"}" data-famille="${famille}" data-texte="${(nom + " " + titre + " " + lieu + " " + repaire + " " + famille).toLowerCase()}">
      <figure class="fenetre-boss fiche-boss-portrait"><img src="img/boss/p_${p}.webp" alt="${nom}" loading="lazy" width="320" height="320"></figure>
      <p class="fiche-boss-famille">${famille}</p>
      <h2 class="fiche-boss-nom">${nom}</h2>
      <p class="fiche-boss-titre">${titre}</p>
      <dl class="fiche-boss-lieu"><div><dt>Biome</dt><dd>${lieu}</dd></div><div><dt>Repaire</dt><dd>${repaire}</dd></div></dl>
      <p class="fiche-boss-texte">${texte}</p>
    </article>`).join("");
  // le générateur de pages (Node) récupère les fiches pour les écrire dans le HTML : contenu lisible sans JavaScript et par les moteurs
  if (typeof document === "undefined") { module.exports = { FICHES, nombre: LEGENDES.length }; return; }
  const { $, $$ } = Historia;
  $("#nb-legendes").textContent = LEGENDES.length;
  $("#familles").innerHTML = `<button type="button" class="filtre" aria-pressed="true" data-famille="">Toutes</button>` + familles.map(f => `<button type="button" class="filtre" aria-pressed="false" data-famille="${f}">${f}</button>`).join("");
  if (!$("#bestiaire").children.length) $("#bestiaire").innerHTML = FICHES;
  const fiches = $$(".fiche-boss"), recherche = $("#recherche"), aucun = $("#aucun");
  let famille = "";
  const sansAccents = t => t.normalize("NFD").replace(/[̀-ͯ]/g, "");
  function filtrer() {
    const q = sansAccents(recherche.value.trim().toLowerCase()); let n = 0;
    fiches.forEach(f => { const ok = (!famille || f.dataset.famille === famille) && (!q || sansAccents(f.dataset.texte).includes(q)); f.hidden = !ok; if (ok) n++; });
    aucun.hidden = n > 0;
  }
  $$("#familles .filtre").forEach(b => b.addEventListener("click", () => { famille = b.dataset.famille; $$("#familles .filtre").forEach(x => x.setAttribute("aria-pressed", x === b)); filtrer(); }));
  recherche.addEventListener("input", filtrer);
  // ---------- onglets : légendes / familiers et montures ----------
  const onglets = { legendes: $("#onglet-legendes"), compagnons: $("#onglet-compagnons") };
  function ouvrir(nom) {
    for (const [k, b] of Object.entries(onglets)) { b.setAttribute("aria-selected", k === nom); $("#panneau-" + k).hidden = k !== nom; }
    if (nom === "compagnons") chargerCompagnons();
  }
  onglets.legendes.addEventListener("click", () => { ouvrir("legendes"); history.replaceState(null, "", location.pathname); });
  onglets.compagnons.addEventListener("click", () => { ouvrir("compagnons"); history.replaceState(null, "", "#compagnons"); });

  // ---------- familiers et montures (données chargées à la première ouverture) ----------
  let compagnons = null;
  function chargerCompagnons() {
    if (compagnons) return;
    compagnons = fetch("donnees/compagnons.json").then(r => r.json()).then(({ familles, compagnons: liste }) => {
      $("#nb-compagnons").textContent = liste.length;
      const fc = $("#familles-c"), grille = $("#compagnons"), rech = $("#recherche-c"), aucunC = $("#aucun-c"), texteF = $("#famille-texte");
      let type = "", fam = -1;
      const boutonsFamilles = () => {
        fc.innerHTML = `<button type="button" class="filtre" aria-pressed="${fam < 0}" data-f="-1">Toutes</button>` +
          familles.map(([n, t], i) => (!type || t === type) ? `<button type="button" class="filtre" aria-pressed="${fam === i}" data-f="${i}">${n}</button>` : "").join("");
      };
      grille.innerHTML = liste.map(([img, nom, t, f]) => `<figure class="compagnon" data-t="${t}" data-f="${f}" data-texte="${(nom + " " + familles[f][0]).toLowerCase()}">
          <span class="compagnon-image"><img src="img/compagnons/${img}.webp" alt="" loading="lazy" width="128" height="128"></span>
          <figcaption><b>${nom}</b><small>${t === "m" ? "Monture" : "Familier"} · ${familles[f][0]}</small></figcaption></figure>`).join("");
      const cartes = [...grille.children];
      const filtrerC = () => {
        const q = sansAccents(rech.value.trim().toLowerCase()); let n = 0;
        cartes.forEach(c => { const ok = (!type || c.dataset.t === type) && (fam < 0 || Number(c.dataset.f) === fam) && (!q || sansAccents(c.dataset.texte).includes(q)); c.hidden = !ok; if (ok) n++; });
        aucunC.hidden = n > 0; texteF.textContent = fam >= 0 ? familles[fam][2] : "";
      };
      $$("#types-c .filtre").forEach(b => b.addEventListener("click", () => {
        type = b.dataset.type; $$("#types-c .filtre").forEach(x => x.setAttribute("aria-pressed", x === b));
        if (fam >= 0 && type && familles[fam][1] !== type) fam = -1; boutonsFamilles(); filtrerC();
      }));
      fc.addEventListener("click", e => { const b = e.target.closest("[data-f]"); if (!b) return; fam = Number(b.dataset.f); boutonsFamilles(); filtrerC(); });
      rech.addEventListener("input", filtrerC);
      boutonsFamilles(); filtrerC();
    }).catch(() => { $("#compagnons").innerHTML = `<p class="bestiaire-aucun">Les compagnons n'ont pas pu être chargés.</p>`; compagnons = null; });
  }
  if (location.hash === "#compagnons") ouvrir("compagnons");

  // bestiaire.html#famille=Démons : ouvre directement une famille
  const voulu = decodeURIComponent((location.hash.match(/famille=([^&]+)/) || [])[1] || "");
  const bouton = $$("#familles .filtre").find(x => x.dataset.famille === voulu); if (voulu && bouton) bouton.click();
})();
