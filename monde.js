// Le monde d'Historia en une seule frise continue, vue en coupe comme dans Minecraft : un même relief traverse
// dix-huit biomes, chacun avec ses vrais blocs, ses couleurs d'herbe, d'eau, de ciel et de brume (celles du worldgen),
// sa végétation et son fluide. Les frontières sont franches et dentelées, bloc par bloc, sans fondu.
// Pixel.monde.rendre(largeurVue) -> { W, H, couches: [{ canvas, s }], anims, surf, debuts, biomeA(x, y), particules(ctx, t, x0, x1) }
"use strict";
(() => {
  const { Toile, sprite, lueur, rgb, mix, ton, alea, bruit, BAYER, PARTICULES } = Pixel.outils;
  const H = 180, BL = 2, MER = Math.round(H * 0.78); // hauteur logique, taille d'un bloc, niveau de la mer

  // ---------- les biomes, dans l'ordre de la frise : des cimes jusqu'à l'océan ----------
  // couleurs ciel, brume, eau, herbe, feuilles : relevées dans les fichiers de biome du worldgen
  const B = (o) => o;
  const BIOMES = [
    B({ id: "pics_de_granit", nom: "Pics de granit", l: 102, ciel: "#86AEF2", brume: "#D8C8D2", eau: "#3D6FA8", froid: true,
      relief: { forme: "pics", base: 0.72, amp: 0.34 }, sol: { dessus: "#A77462", terre: "#93614F", roche: "#7F7F7F", ep: 9 }, neige: 0.56,
      arbres: [["sapinNeige", 1]], densite: 0.012, rochers: 0.03, particules: "neige",
      boss: "Le Griffon", portrait: "lr_gryffin", texte: "Des pitons de granite rose sous la neige, des éboulis et des séracs. Le griffon y a son aire, et les nains y creusent leurs mines.", creatures: "Griffon, nains des mines, golems de roche" }),
    B({ id: "foret_boreale", nom: "Forêt boréale", l: 95, ciel: "#A9C6E3", brume: "#DCE6EF", eau: "#3A6A9C", herbe: "#7FA895", feuilles: "#6D9A86", froid: true,
      relief: { forme: "collines", base: 0.725, amp: 0.07 }, sol: { terre: "#7A5A3C", roche: "#7F7F7F", ep: 3 }, neige: 1,
      arbres: [["sapinNeige", 1], ["sapinNeige", 1], ["bouleau", 1]], densite: 0.16, rochers: 0.01, particules: "neige",
      boss: "Le Yéti", portrait: "lr_yeti", texte: "Épicéas et pins enneigés, bouleaux tordus, congères et rochers givrés. Le Yéti dort dans sa grotte.", creatures: "Ours, vikings, wendigo" }),
    B({ id: "taiga_ancienne", nom: "Taïga ancienne", l: 88, ciel: "#8AA3B8", brume: "#AEBCC6", eau: "#33607A", herbe: "#6A9560", feuilles: "#54804A",
      relief: { forme: "collines", base: 0.735, amp: 0.07 }, sol: { dessus: "#6E5233", terre: "#6B4C2E", roche: "#7F7F7F", ep: 3, mousse: 0.5 },
      arbres: [["sapin", 2], ["sapin", 2], ["sapin", 1]], densite: 0.11, rochers: 0.015,
      boss: "Le Wendigo", portrait: "nightharrow_wendigo", texte: "Des épicéas ancestraux immenses, des tapis de mousse et des ruisselets. La nuit, quelque chose d'affamé rôde entre les troncs.", creatures: "Ours, vikings, wendigo" }),
    B({ id: "lande_de_bruyere", nom: "Lande de bruyère", l: 82, ciel: "#9DB0C6", brume: "#C9D1D8", eau: "#4A5E6E", herbe: "#8E9A55", feuilles: "#7D8C4E",
      relief: { forme: "collines", base: 0.74, amp: 0.09 }, sol: { terre: "#7A5A3C", roche: "#7F7F7F", ep: 3 },
      arbres: [["bruyere", 1], ["bruyere", 1], ["bruyere", 1], ["buisson", 1], ["chene", 1]], densite: 0.1, menhirs: 0.012, rochers: 0.02, particules: "papillons",
      boss: "Magnus", portrait: "magnus", texte: "Bruyère violette et fougère aigle, tourbières, cairns et pierres dressées. Magnus, champion de la lande, attend les défis dans son arène.", creatures: "Vikings, squelettes de la tour de guet, rats de l'ossuaire, Oog l'ogre" }),
    B({ id: "plaines", nom: "Plaines", l: 102, ciel: "#7DAEFF", brume: "#C8DFFF", eau: "#3F76E4", herbe: "#9DC25B", feuilles: "#7FAF35",
      relief: { forme: "collines", base: 0.745, amp: 0.05 }, sol: { terre: "#86603E", roche: "#7F7F7F", ep: 3 },
      arbres: [["chene", 1], ["buisson", 1]], densite: 0.035, fleurs: ["#FFE070", "#FFFFFF", "#FF6A5A", "#7AA8FF"], maisons: [0.42, 0.5, 0.57], particules: "papillons",
      boss: "Kriger", portrait: "kriger", texte: "Prairies fleuries, bosquets et haies bocagères, tournesols sauvages et hameaux. Kriger garde son église.", creatures: "Villageois, canards, gobelins" }),
    B({ id: "falaises_blanches", nom: "Falaises blanches", l: 95, ciel: "#8CC4F2", brume: "#E6EAEE", eau: "#4C9ACB", herbe: "#90A86C", feuilles: "#7C9A5E",
      relief: { forme: "falaises", base: 0.68, amp: 0.25 }, sol: { terre: "#E6E2DA", roche: "#D9D5CC", ep: 6, veines: "#B8B4AC" },
      arbres: [["chene", 1], ["buisson", 1]], densite: 0.015, fleurs: ["#FFFFFF", "#FFFFFF", "#F4F0E0"], cascade: true,
      boss: "Le Minotaure", portrait: "lr_minotaur", texte: "De grandes parois éclatantes de calcite, des cascades, et des replats d'herbe semés de fleurs blanches. Le Minotaure garde son labyrinthe.", creatures: "Nains, golems, griffon" }),
    B({ id: "foret_lunaire", nom: "Forêt lunaire", l: 88, ciel: "#5A5FB0", brume: "#9A94D0", eau: "#1E3A8A", herbe: "#7F76B8", feuilles: "#6C5FB0",
      relief: { forme: "collines", base: 0.735, amp: 0.07 }, sol: { terre: "#5E4A6A", roche: "#7F7F7F", ep: 3 },
      arbres: [["lunaire", 2], ["lunaire", 1], ["cristal", 1]], densite: 0.09, fleurs: ["#E8D8FF", "#C8A8FF"], particules: "lucioles",
      boss: "La Druidesse elfe", portrait: "elven_druid", texte: "Un bois elfique au crépuscule éternel. Troncs blancs, feuillages violets, cristaux d'améthyste qui luisent au sol.", creatures: "Elfes, golems de cristal, lucioles" }),
    B({ id: "bois_hante", nom: "Bois hanté", l: 82, ciel: "#545A62", brume: "#3E4A45", eau: "#2B2F33", herbe: "#5E5A6B", feuilles: "#3A3345",
      relief: { forme: "collines", base: 0.745, amp: 0.05 }, sol: { terre: "#4A3A30", roche: "#7F7F7F", ep: 3 },
      arbres: [["chene", 1], ["mort", 1], ["champignon", 1]], densite: 0.1, particules: "spores", brumeForte: 0.35,
      boss: "Azriel", portrait: "azriel", texte: "Chênes noirs, toiles d'araignée, champignons et ossements blanchis. Une cathédrale noire se dresse au cœur du bois.", creatures: "Bestiaire d'Halloween, ents flétris, chauves-souris vampires, Roi Citrouille" }),
    B({ id: "marais_maudit", nom: "Marais maudit", l: 82, ciel: "#6B7160", brume: "#4A5238", eau: "#3F4A2A", herbe: "#5B5E3A", feuilles: "#3F3A28",
      relief: { forme: "plat", base: 0.775, amp: 0.03 }, sol: { terre: "#4E4030", roche: "#7F7F7F", ep: 3 },
      arbres: [["mort", 1], ["chene", 1]], densite: 0.05, nenuphars: true, particules: "lucioles", brumeForte: 0.3,
      boss: "Mortos", portrait: "mortos", texte: "Eaux croupies, troncs pourris, champignons et ossements. Le dragon Mortos dort dans son cimetière.", creatures: "Zombies mutants, ents flétris, chauves-souris vampires" }),
    B({ id: "vallee_des_sakuras", nom: "Vallée des sakuras", l: 88, ciel: "#9CCBF2", brume: "#F4D9E6", eau: "#72D6EE", herbe: "#A6D985", feuilles: "#9BD27A",
      relief: { forme: "collines", base: 0.735, amp: 0.08, creux: { x: 0.72, l: 0.12, prof: 0.06 } }, sol: { terre: "#86603E", roche: "#7F7F7F", ep: 3 },
      arbres: [["sakura", 2], ["sakura", 1], ["bambou", 1]], densite: 0.07, fleurs: ["#FFC8DC", "#FFFFFF"], nenuphars: true, particules: "petales",
      boss: "Hana", portrait: "hana", texte: "Cerisiers étagés, tapis de pétales roses, bambous et mousse, nénuphars sur l'eau limpide.", creatures: "Ents des cerisiers, elfes" }),
    B({ id: "bambouseraie_brumeuse", nom: "Bambouseraie brumeuse", l: 82, ciel: "#B7D2DA", brume: "#DDE7E2", eau: "#4B9FB2", herbe: "#7DB35A", feuilles: "#C9573A",
      relief: { forme: "collines", base: 0.73, amp: 0.07 }, sol: { terre: "#7A5A3C", roche: "#7F7F7F", ep: 3 },
      arbres: [["bambou", 1], ["bambou", 1], ["bambou", 1], ["feuillu", 1]], densite: 0.16, brumeForte: 0.28,
      boss: "Wu, maître d'encre", portrait: "wu", texte: "Des nappes de bambous dans la brume, des érables rouges et des pierres dressées. Wu y médite dans son pavillon de l'encre.", creatures: "Pandas, mimiques" }),
    B({ id: "jungle_ancestrale", nom: "Jungle ancestrale", l: 102, ciel: "#8DBFD0", brume: "#C3D8B2", eau: "#35A391", herbe: "#4CA836", feuilles: "#2E9B26",
      relief: { forme: "collines", base: 0.73, amp: 0.09 }, sol: { terre: "#6B4A2E", roche: "#7F7F7F", ep: 3, mousse: 0.3 },
      arbres: [["jungle", 2], ["jungle", 1], ["buisson", 1], ["fougere", 1]], densite: 0.09, colonnes: 0.008, particules: "papillons",
      boss: "Le Roi des ents", portrait: "ent_king", texte: "Arbres géants et lianes, cascades, colonnes brisées et temples engloutis par la mousse.", creatures: "Crocodiles, tortues alligators, pandas, ents" }),
    B({ id: "desert", nom: "Désert", l: 102, ciel: "#9FB8D6", brume: "#E3D3AF", eau: "#3C8DBF", chaud: true,
      relief: { forme: "dunes", base: 0.745, amp: 0.07, creux: { x: 0.74, l: 0.14, prof: 0.07 } }, sol: { dessus: "#DDD2A4", terre: "#D8CB98", roche: "#C9B985", ep: 4, gres: true },
      arbres: [["cactus", 1], ["cactus", 1], ["mort", 1]], densite: 0.02, palmiers: true,
      boss: "Anubis", portrait: "lr_anubis", texte: "Des dunes écrasées de chaleur, des aiguilles de grès, des ossements, et des oasis de palmiers. Le tombeau d'Anubis attend sous le sable.", creatures: "Momies, soldats-cactus, lézards épineux, scolopendres géantes" }),
    B({ id: "steppe_embrasee", nom: "Steppe embrasée", l: 82, ciel: "#DDA878", brume: "#E39A5C", eau: "#8A5A3C", herbe: "#DB9429", feuilles: "#C0662A", chaud: true,
      relief: { forme: "collines", base: 0.74, amp: 0.05 }, sol: { terre: "#7A4E2E", roche: "#7F7F7F", ep: 3 },
      arbres: [["mort", 1], ["mort", 1], ["buisson", 1]], densite: 0.03, orgues: 0.01, particules: "braises",
      boss: "Cerbère", portrait: "cerberus", texte: "Herbes sèches couleur de braise, arbres calcinés, orgues de basalte et cheminées de feu. La porte des enfers s'ouvre ici.", creatures: "Zombies mutants, gobelins, drakes du Nether, ents infernaux" }),
    B({ id: "sources_ardentes", nom: "Sources ardentes", l: 82, ciel: "#9CB9D6", brume: "#E2DED2", eau: "#3FCFC6", herbe: "#98A35C", feuilles: "#88A050", chaud: true,
      relief: { forme: "falaises", base: 0.72, amp: 0.1, creux: { x: 0.45, l: 0.2, prof: 0.2 } }, sol: { terre: "#D8CBB0", roche: "#A35A3A", ep: 4, veines: "#C77A4A" },
      arbres: [["buisson", 1], ["mort", 1]], densite: 0.02, particules: "bulles",
      boss: "Le Phénix", portrait: "phoenix", texte: "Bassins turquoise et ocre étagés, concrétions de travertin et cheminées minérales. Le Phénix y a fait son nid.", creatures: "Drakes du Nether, ents infernaux, chiens des enfers" }),
    B({ id: "caldeira", nom: "Caldeira", l: 102, ciel: "#B77653", brume: "#B5532B", eau: "#7B3A24", herbe: "#5C4A3C", chaud: true, fluide: "lave",
      relief: { forme: "cratere", base: 0.74, amp: 0.2 }, sol: { dessus: "#4A4648", terre: "#3A3638", roche: "#2E2A2E", ep: 3, magma: true },
      arbres: [], densite: 0, orgues: 0.025, particules: "braises",
      boss: "Flamental", portrait: "flamental", texte: "Un cratère de basalte noir, des lacs de lave, des orgues de basalte et de l'obsidienne. L'air est chargé d'étincelles.", creatures: "Piglins, démon du chaos" }),
    B({ id: "falaises_cotieres", nom: "Falaises côtières", l: 82, ciel: "#8CB2DA", brume: "#CCDAE3", eau: "#4EAAD0", herbe: "#80A063", feuilles: "#6F9152",
      relief: { forme: "falaises", base: 0.66, amp: 0.18, pente: 0.24 }, sol: { terre: "#8A8A8C", roche: "#7F7F7F", ep: 5 },
      arbres: [["chene", 1], ["buisson", 1]], densite: 0.015, fleurs: ["#FF6A5A", "#7AA8FF"], particules: "oiseaux",
      boss: "Méduse", portrait: "medusa", texte: "Des falaises d'andésite battues par les vagues, de l'herbe saline et des épaves échouées. Méduse garde son temple.", creatures: "Pirates, hommes-poissons, roi homard" }),
    B({ id: "abysses", nom: "Abysses", l: 116, ciel: "#6C94E0", brume: "#B4C4DC", eau: "#1E3A7C",
      relief: { forme: "ocean", base: 0.97, amp: 0.04 }, sol: { dessus: "#C8BC8C", terre: "#8A8478", roche: "#7F7F7F", ep: 3 },
      arbres: [], densite: 0, kelp: 0.12, cheminees: true, particules: "bulles",
      boss: "Le Kraken", portrait: "kraken", texte: "Un océan profond. Des forêts de kelp géant, des ossements de léviathan et des cheminées de magma qui crachent des bulles.", creatures: "Mégalodon, anguilles électriques, régalecs" }),
  ];
  const debuts = []; let W = 0; for (const b of BIOMES) { debuts.push(W); W += b.l; }
  BIOMES.forEach(b => { for (const k of ["ciel", "brume", "eau", "herbe", "feuilles"]) if (b[k]) b["_" + k] = rgb(b[k]); });

  // biome d'une colonne (sans dentelure) et biome d'un bloc (frontière dentelée selon la profondeur, comme une limite de chunks)
  const indexA = x => { let k = 0; while (k < BIOMES.length - 1 && x >= debuts[k + 1]) k++; return k; };
  const nj = bruit(911), nj2 = bruit(377);
  const decalage = y => (Math.round((nj(y / 9) - 0.5) * 6) + Math.round((nj2(y / 2.3) - 0.5) * 2)) * BL;
  const biomeA = (x, y) => indexA(x + decalage(y));

  // ---------- relief continu : chaque biome a sa forme, mêlée à celle du voisin sur quelques blocs ----------
  const n1 = bruit(21), n2 = bruit(22), n3 = bruit(23), n4 = bruit(24);
  function forme(b, k, x) {
    const r = b.relief, u = (x - debuts[k]) / b.l; let h;
    switch (r.forme) {
      case "pics": h = Math.pow(1 - Math.abs(n1(x / 34) * 2 - 1), 1.5) * 0.85 + n3(x / 6) * 0.15; break;
      case "falaises": { const brut = (n1(x / 40) * 0.75 + n2(x / 16) * 0.25) * 6, p = Math.floor(brut); h = (p + Math.pow(brut - p, 5)) / 6; break; }
      case "dunes": h = (Math.sin(x / 19) * 0.5 + 0.5) * 0.6 + n2(x / 30) * 0.4; break;
      case "plat": h = n2(x / 12) * 0.6 + n3(x / 5) * 0.4; break;
      case "cratere": { const d = Math.abs(u - 0.5) * 2; h = d > 0.72 ? 0.75 + n3(x / 4) * 0.25 : -0.55 + d * 0.4 + n3(x / 5) * 0.1; break; }
      case "ocean": h = n2(x / 20) * 0.7 + n3(x / 6) * 0.3; break;
      default: h = n1(x / 30) * 0.6 + n2(x / 12) * 0.3 + n4(x / 5) * 0.1;
    }
    let y = r.base - h * r.amp;
    if (r.pente) y += Math.max(0, u - 0.55) / 0.45 * r.pente; // les falaises côtières plongent vers la mer
    if (r.creux) { const d = (u - r.creux.x) / r.creux.l; y += r.creux.prof * Math.exp(-d * d * 2.2); }
    return y;
  }
  const TRANSITION = 14; // demi-largeur du raccord de relief entre deux biomes, en pixels
  const surf = new Int16Array(W);
  for (let cx = 0; cx < W; cx += BL) {
    const x = cx + BL / 2; let somme = 0, poids = 0;
    for (let k = 0; k < BIOMES.length; k++) {
      const a = debuts[k], b = a + BIOMES[k].l, d = x < a ? a - x : x > b ? x - b : 0;
      if (d >= TRANSITION) continue; const w = 1 - d / TRANSITION; somme += forme(BIOMES[k], k, x) * w; poids += w;
    }
    const y = Math.round(somme / poids * H / BL) * BL;
    for (let i = 0; i < BL && cx + i < W; i++) surf[cx + i] = y;
  }

  // ---------- rendu ----------
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const lisses = {}; // couleur d'un champ (ciel, brume…) par colonne, lissée par moyenne glissante, pour l'atmosphère
  const melange = (champ, x, demi) => {
    const cle = champ + demi; if (!lisses[cle]) {
      const brut = Array.from({ length: W }, (_, i) => { const b = BIOMES[indexA(i)]; return b["_" + champ] || b._herbe || b._brume; }), cumul = [[0, 0, 0]];
      for (const c of brut) { const p = cumul[cumul.length - 1]; cumul.push([p[0] + c[0], p[1] + c[1], p[2] + c[2]]); }
      lisses[cle] = brut.map((_, i) => { const a = Math.max(0, i - demi), b = Math.min(W, i + demi + 1); return [0, 1, 2].map(k => (cumul[b][k] - cumul[a][k]) / (b - a)); });
    }
    return lisses[cle][Math.max(0, Math.min(W - 1, Math.round(x)))];
  };

  function rendre(vue) {
    vue = Math.max(60, Math.min(W, Math.round(vue)));
    const r = alea(1234), couches = [], anims = [];
    const largeurCouche = s => Math.ceil(vue + (W - vue) * s) + 2;
    const versSol = (x, s) => Math.max(0, Math.min(W - 1, Math.round((x - vue / 2) / s + vue / 2))); // colonne du sol au centre de la vue quand cette colonne y passe

    // 1. ciel : il suit le sol, chaque biome a son ciel au-dessus de lui (dégradé lissé d'un biome à l'autre, comme en marchant)
    { const t = new Toile(W, H), haut = [], bas = [];
      for (let x = 0; x < W; x++) { haut.push(melange("ciel", x, 40)); bas.push(melange("brume", x, 40)); }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const f = Math.min(1, y / (H * 0.7)), bande = Math.floor(f * 12 + BAYER[y & 3][x & 3] * 0.95) / 12; t.px(x, y, mix(ton(haut[x], -0.06), bas[x], bande)); }
      couches.push({ canvas: t.toile(), s: 1 }); }

    // 2. soleil carré et nuages, très loin : ils glissent à peine
    { const s = 0.08, L = largeurCouche(s), t = new Toile(L, H), soleil = [255, 248, 214];
      const sx = Math.round(vue * 0.8), sy = Math.round(H * 0.16), sr = 8;
      [[2.3, 0.1], [1.6, 0.2]].forEach(([k, f]) => { for (let j = -sr * k; j <= sr * k; j++) for (let i = -sr * k; i <= sr * k; i++) if (Math.hypot(i, j) <= sr * k) t.px(sx + i, sy + j, soleil, f); });
      t.rect(sx - sr / 2, sy - sr / 2, sr, sr, soleil);
      for (let k = 0; k < L / 34; k++) { const x0 = r() * L | 0, y = (0.04 + r() * 0.26) * H | 0, l = 10 + r() * 20 | 0, c = [255, 255, 255];
        t.rect(x0, y + 2, l, 4, c, 0.9); t.rect(x0 + 3, y, l * 0.5 | 0, 3, c, 0.9); t.rect(x0, y + 6, l, 1, [214, 220, 232], 0.85); }
      couches.push({ canvas: t.toile(), s }); }

    // 3. montagnes lointaines, enneigées : la brume du biome au premier plan les teinte ensuite
    { const s = 0.3, L = largeurCouche(s), t = new Toile(L, H), m = bruit(51), m2 = bruit(52), c = rgb("#8C98B8");
      for (let x = 0; x < L; x++) { const h = Math.pow(1 - Math.abs(m(x / 24) * 2 - 1), 1.4) * 0.8 + m2(x / 7) * 0.2, y0 = Math.round(H * (0.7 - h * 0.22));
        for (let y = y0; y < H; y++) t.px(x, y, y - y0 < 3 + (x * 7) % 3 && h > 0.55 ? [236, 242, 250] : ton(c, -Math.min(0.12, (y - y0) / 300))); }
      couches.push({ canvas: t.toile(), s }); }

    // 4. collines à mi-distance, aux feuillages des biomes voisins (lissés)
    { const s = 0.6, L = largeurCouche(s), t = new Toile(L, H), m = bruit(61), m2 = bruit(62);
      for (let x = 0; x < L; x++) { const X = versSol(x, s), f = melange("feuilles", X, 60), c = ton(f, -0.15);
        const y0 = Math.round(H * (0.68 - (m(x / 20) * 0.7 + m2(x / 7) * 0.3) * 0.09));
        for (let y = y0; y < H; y++) t.px(x, y, ton(c, (y - y0) < 2 ? 0.1 : -0.03));
        if (r() < 0.3) { const rr = 2 + (r() * 3 | 0); for (let j = -rr; j <= rr; j++) for (let i = -rr; i <= rr; i++) if (i * i + j * j <= rr * rr) t.px(x + i, y0 - rr + 1 + j, ton(c, j < 0 && i < 0 ? 0.08 : 0)); } }
      couches.push({ canvas: t.toile(), s }); }

    // 5. brume du biome, posée sur les lointains : elle suit le sol et donne à chaque biome son atmosphère
    { const t = new Toile(W, H);
      for (let x = 0; x < W; x++) { const b = BIOMES[indexA(x)], c = melange("brume", x, 30), force = 0.45 + (b.brumeForte || 0);
        for (let y = Math.round(H * 0.3); y < H; y++) { const a = Math.min(1, (y - H * 0.3) / (H * 0.42)) * force; t.px(x, y, c, a); } }
      couches.push({ canvas: t.toile(), s: 1 }); }

    // 6. le sol, en coupe : blocs de surface, terre, roche et minerais, eau ou lave, végétation
    const s = 1, t = new Toile(W, H), eauPts = [], lavePts = [];
    const MINERAIS = [[[40, 40, 44], 0.006, 4], [[216, 175, 147], 0.008, 20], [[252, 238, 75], 0.003, 40], [[93, 236, 245], 0.0015, 55]];
    for (let x = 0; x < W; x++) {
      const y0 = surf[x];
      for (let y = Math.max(0, y0); y < H; y++) {
        const k = biomeA(x, y), b = BIOMES[k], so = b.sol, prof = Math.floor((y - y0) / BL), bx = x >> 1, by = y >> 1, v = hash(bx, by), pv = hash(x, y);
        let c;
        if (prof === 0) {
          if (b.neige && (b.neige === 1 || y0 < H * b.neige)) c = y - y0 === 0 ? [250, 252, 255] : [226, 234, 246];
          else if (so.dessus) c = rgb(so.dessus);
          else c = y - y0 === 0 ? ton(b._herbe, 0.1) : mix(b._herbe, rgb(so.terre), pv < 0.5 ? 0.35 : 0.7);
          if (so.mousse && pv < so.mousse * 0.4) c = ton(b._herbe || c, -0.1);
        } else if (prof <= so.ep) { c = rgb(so.terre); if (so.veines && (bx * 3 + by * 5) % 11 === 0) c = rgb(so.veines); }
        else {
          c = rgb(so.roche); if (so.gres && prof < so.ep + 6) c = ton(rgb(so.terre), -0.08 - (by % 3 === 0 ? 0.05 : 0));
          const d = prof - so.ep; for (const [mc, p, min] of MINERAIS) if (d > min / BL && hash(bx * 7, by * 13) < p * 2) c = mc;
          if (so.magma && hash(bx + 9, by) < 0.05) { c = [230, 110, 30]; lavePts.push([x, y]); }
          if (y > H - 22) c = mix(c, [60, 60, 70], Math.min(1, (y - (H - 22)) / 22) * 0.6); // ardoise des profondeurs
        }
        c = ton(c, (v - 0.5) * 0.12 + (pv < 0.08 ? -0.06 : 0) - Math.min(0.3, prof * 0.012));
        t.px(x, y, c);
      }
      // fluide : sous le niveau de la mer, l'eau prend la couleur de l'eau du biome (ou la lave dans la caldeira)
      if (y0 > MER) for (let y = MER; y < y0; y++) {
        const b = BIOMES[biomeA(x, y)], lave = b.fluide === "lave", base = lave ? [255, 122, 40] : b._eau, k = (y - MER) / 40;
        const c = lave ? (y === MER ? [255, 214, 74] : ton(base, -0.25 * Math.min(1, k))) : (y === MER ? ton(base, 0.45) : ton(base, -0.35 * Math.min(1, k) + (BAYER[y & 3][x & 3] < 0.1 ? 0.06 : 0)));
        t.px(x, y, c, lave || y === MER ? 1 : 0.9);
        if (y - MER < 10 && (x * 7 + y) % 3 === 0) (lave ? lavePts : eauPts).push([x, y]);
        if (lave && y === MER) lueur(t, x, MER - 3, 4, [255, 120, 40], 0.1);
      }
    }
    if (eauPts.length) anims.push({ type: "eau", points: eauPts });
    if (lavePts.length) anims.push({ type: "lave", points: lavePts });

    // végétation et éléments de décor, biome par biome (jamais dans l'eau)
    const pal = b => { const f = b._feuilles || b._herbe || [90, 140, 60]; return { a: ton(f, -0.28), b: f, c: ton(f, 0.18), t: [106, 74, 46], u: [74, 50, 30], w: [236, 232, 220], k: [42, 42, 42], n: [250, 252, 255],
      v: [150, 120, 220], l: [220, 200, 255], p: [176, 110, 230], g: [84, 140, 60], r: [140, 140, 140] }; };
    const PAL = {
      sakura: { a: rgb("#F2A6C4"), b: rgb("#F8C4D8"), c: rgb("#FFFFFF"), t: rgb("#5A3A2A") },
      lunaire: { v: rgb("#7A5FC8"), l: rgb("#B8A0F0"), w: rgb("#EDEAF4") },
      cristal: { w: rgb("#F4E8FF"), l: rgb("#C8A0FF"), p: rgb("#8A5AD8") },
      cactus: { g: rgb("#4E8A3A"), l: rgb("#6EAA4E") },
      mort: { k: rgb("#3A2E26") },
      champignon: { c: rgb("#C83A3A"), l: rgb("#F4E8E0"), t: rgb("#E8DCC8") },
      bruyere: { p: rgb("#9A5AB8"), l: rgb("#C88AE0"), g: rgb("#5E7A3A") },
      palmier: { b: rgb("#5AA040"), c: rgb("#7AC050"), t: rgb("#8A6A40") },
    };
    const toits = { r: rgb("#9A3F2E"), w: rgb("#E2CFA8"), y: rgb("#FFD27A"), d: rgb("#5A3A24") };
    const sec = x => surf[x] <= MER; // terre émergée
    BIOMES.forEach((b, k) => {
      const a = debuts[k] + 6, z = debuts[k] + b.l - 6, p = pal(b);
      // maisons du hameau
      for (const m of b.maisons || []) { const x = Math.round(debuts[k] + m * b.l); if (sec(x)) { sprite(t, "maison", x, surf[x] + 1, 1, toits); anims.push({ type: "fumee", x: x - 2, y: surf[x] - 8 }); } }
      for (let x = a; x < z; x++) {
        if (!sec(x)) continue; const y = surf[x];
        if (b.fleurs && r() < 0.08) t.px(x, y - 1, rgb(b.fleurs[r() * b.fleurs.length | 0]));
        else if (b._herbe && !b.neige && r() < 0.25) t.px(x, y - 1, ton(b._herbe, 0.12));
        if (b.maisons && b.maisons.some(m => Math.abs(x - (debuts[k] + m * b.l)) < 8)) continue;
        if (b.arbres.length && r() < b.densite) {
          const [nom, e] = b.arbres[r() * b.arbres.length | 0];
          if (nom === "bambou") { const h = 12 + r() * 16 | 0; for (let j = 0; j < h; j++) t.px(x, y - 1 - j, j % 5 === 4 ? [70, 120, 50] : [110, 170, 70]); t.px(x - 1, y - h, [90, 160, 70]); t.px(x + 1, y - h + 2, [90, 160, 70]); t.px(x + 1, y - h + 1, [120, 190, 80]); continue; }
          const pp = PAL[nom] ? { ...p, ...PAL[nom] } : p; sprite(t, nom, x, y + 1, e, pp);
          if (nom === "cristal") lueur(t, x, y - 4, 6, [200, 160, 255], 0.2);
          if (nom === "champignon") lueur(t, x, y - 3, 5, [255, 120, 120], 0.15);
        }
        if (b.rochers && r() < b.rochers) sprite(t, "rocher", x, y + 1, 1, { r: ton(rgb(b.sol.roche), 0.05), l: ton(rgb(b.sol.roche), 0.25) });
        if (b.menhirs && r() < b.menhirs) { t.rect(x - 1, y - 9, 3, 9, [128, 128, 132]); t.rect(x - 1, y - 9, 1, 9, [150, 150, 154]); }
        if (b.colonnes && r() < b.colonnes) { const h = 8 + r() * 10 | 0; t.rect(x - 1, y - h, 3, h, [150, 150, 140]); t.rect(x - 1, y - h, 3, 2, [96, 140, 70]); }
        if (b.orgues && r() < b.orgues) { const h = 6 + r() * 14 | 0, l = 2 + (r() * 2 | 0); for (let i = 0; i < l; i++) t.rect(x + i, y - h - (i % 2) * 2, 1, h + (i % 2) * 2, i % 2 ? [50, 48, 52] : [72, 70, 76]); }
      }
      // palmiers autour de l'oasis
      if (b.palmiers && b.relief.creux) { const c = Math.round(debuts[k] + b.relief.creux.x * b.l); for (const dx of [-14, -9, 10, 15]) { const x = c + dx; if (sec(x)) sprite(t, "palmier", x, surf[x] + 1, 1, { ...p, ...PAL.palmier }); } }
      // nénuphars
      if (b.nenuphars) for (let x = a; x < z; x++) if (!sec(x) && r() < 0.15) t.rect(x, MER - 1, 2, 1, [70, 130, 50]);
      // cascade : à la plus grande marche du biome
      if (b.cascade) { let best = 0, bx = 0; for (let x = a; x < z - 3; x++) { const d = surf[x + 3] - surf[x]; if (d > best) { best = d; bx = x; } }
        if (best > 8) { const eau = [159, 212, 242], hauts = [surf[bx], surf[bx], surf[bx]]; for (let i = 0; i < 3; i++) for (let y = surf[bx]; y < surf[bx + 3]; y++) t.px(bx + 1 + i, y, (y + i * 3) % 7 < 2 ? [240, 250, 255] : eau);
          anims.push({ type: "cascade", x0: bx + 1, l: 3, bas: surf[bx + 3], couleur: "rgb(159,212,242)", hauts }); } }
      // kelp et cheminées des abysses
      if (b.kelp) for (let x = a; x < z; x += 2) if (r() < b.kelp) { const l = 10 + r() * 34 | 0; for (let j = 0; j < l && surf[x] - j > MER + 3; j++) t.px(x + Math.round(Math.sin(j / 3 + x) * 1.2), surf[x] - 1 - j, j % 4 === 0 ? [90, 160, 80] : [60, 130, 64]); }
      if (b.cheminees) for (const f of [0.3, 0.62]) { const x = Math.round(debuts[k] + f * b.l), y = surf[x]; t.rect(x - 2, y - 8, 5, 8, [52, 46, 50]); t.rect(x - 1, y - 9, 3, 1, [255, 120, 40]); lueur(t, x, y - 10, 5, [255, 120, 40], 0.18); }
    });
    couches.push({ canvas: t.toile(), s, sol: true });
    return { W, H, MER, couches, anims, surf, debuts, biomeA, indexA, decalage };
  }

  // ---------- particules : chaque biome a les siennes, dans sa portion de frise ----------
  function creerParticules() {
    const r = alea(4321), groupes = [];
    BIOMES.forEach((b, k) => { const def = PARTICULES[b.particules]; if (!def) return;
      const n = Math.max(4, Math.round(b.l * H * def.nb * 0.7)), parts = [];
      for (let i = 0; i < n; i++) { const p = { p: r() * 6.28, v: 0.5 + r() }; def.init(p, b.l, H, r); if (b.particules === "bulles") p.y = MER + r() * (H - MER); parts.push(p); }
      groupes.push({ def, x0: debuts[k], l: b.l, parts, eau: b.particules === "bulles" }); });
    return (ctx, t, xa, xb) => {
      for (const g of groupes) { if (g.x0 + g.l < xa || g.x0 > xb) continue; const def = g.def;
        for (const p of g.parts) { let [x, y] = def.pas(p, t, g.l, H); x = ((x % g.l) + g.l) % g.l; if (g.eau && y < MER + 2) continue;
          const a = def.alpha(p, t), c = p.c || def.couleur, X = Math.round(g.x0 + x), Y = Math.round(y);
          if (def.halo) { ctx.fillStyle = `rgba(${c},${a * 0.25})`; ctx.fillRect(X - 1, Y - 1, 3, 3); }
          ctx.fillStyle = `rgba(${c},${a})`;
          if (def.oiseau) { const o = Math.sin(t * 0.012 + p.p) > 0 ? 1 : 0; ctx.fillRect(X, Y, 1, 1); ctx.fillRect(X - 1, Y - o, 1, 1); ctx.fillRect(X + 1, Y - o, 1, 1); }
          else if (def.aile) { const o = Math.sin(t * 0.03 + p.p) > 0 ? 1 : 0; ctx.fillRect(X - 1, Y - o, 1, 1); ctx.fillRect(X + 1, Y - o, 1, 1); }
          else ctx.fillRect(X, Y, 1, 1); } }
    };
  }

  Pixel.monde = { BIOMES, W, H, MER, debuts, rendre, creerParticules, indexA, biomeA, decalage, surf };
})();
