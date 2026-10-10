// Les peuples du royaume : leurs boss et leurs troupes (créatures vérifiées dans les apparitions en jeu).
// Partagé par l'accueil (chapitre III) et le bestiaire (onglet Créatures) ; lisible aussi par le générateur de pages (Node).
"use strict";
(() => {
  // Règles : les boss d'un peuple sont ses chefs, jamais une légende (Anubis, Mortos, le Kraken… n'appartiennent à aucun peuple) ;
  // les troupes sont des membres ordinaires du peuple, jamais un boss.
  // [nom, couleur, terres, boss [[portrait, nom]], troupes et faune de leurs terres [[portrait, nom]], thème du décor (pixel.js)]
  const PEUPLES = [
    ["Elfes", "#8F6FC9", "Forêt lunaire · Jardin des fées", [["elven_druid", "La Druidesse elfe"]], [["elven_swordsman", "Épéiste elfe"], ["elven_ranger", "Rôdeur elfe"], ["elven_mage", "Mage elfe"], ["elven_runebear", "Ours runique"]], "lunaire"],
    ["Nains", "#8A8A96", "Pics de granit · Mines", [["dwarf_blacksmith", "Le Forgeron nain"]], [["dwarf_knight", "Chevalier nain"], ["dwarf_huntsman", "Chasseur nain"], ["dwarf_cleric", "Clerc nain"]], "falaises"],
    ["Gobelins", "#6F9A2A", "Plaines · Savane · Steppe", [["goblin_king", "Le Roi gobelin"], ["kur", "Kur"]], [["mob_goblin_warrior", "Gobelin guerrier"], ["mob_goblin_assassin", "Gobelin assassin"], ["mob_goblin_archer", "Gobelin archer"], ["mob_goblin_shaman", "Gobelin chaman"]], "plaines"],
    ["Vikings", "#4C78A8", "Taïga · Forêt boréale", [["viking", "Bjorn l'Exalté"]], [["viking_npc", "Guerrier viking"], ["bear_brown", "Ours brun"], ["bear_polar", "Ours polaire"]], "boreale"],
    ["Pirates", "#2F7FA5", "Côtes · Abysses", [["pirate_captain", "Le capitaine DeadBeard"], ["captain_octo", "Le capitaine Octo"]], [["piratepack_crewmate", "Pirate de l'équipage"], ["pirate_swordsman", "Pirate sabreur"], ["pirate_gunner", "Pirate tireur"], ["piratepack_crab", "Crabe pirate"]], "abysses"],
    ["Morts-vivants", "#5F8F7A", "Marais maudit · Ossuaires · Tours en ruine", [["oblivion", "Oblivion"]], [["halloweenpackvol3_mummy", "Momie"], ["tower_skeleton", "Squelette de la tour"], ["undeadminer", "Mineur mort-vivant"], ["modelfoundry_mutant_zombie_strong", "Zombie mutant"]], "marais"],
    ["Démons", "#A23A3A", "Bois hanté · Caldeira", [["lillith", "Lillith"], ["demon_of_chaos_gama05", "Le Démon du chaos"]], [["halloweenpackvol3_imp", "Diablotin"], ["piglin_mage", "Piglin mage"], ["piglin_marauder", "Piglin maraudeur"], ["demon_reaper", "Faucheur démoniaque"]], "caldeira"],
    ["Esprits de la forêt", "#3F9D8F", "Forêts · Vallée des sakuras · Île aux champignons", [["skog", "Skog"], ["glume", "Glume"]], [["ent_warrior", "Ent guerrier"], ["ent_sorcerer", "Ent sorcier"], ["sakura_tree_ent", "Ent de cerisier"], ["oak_entling", "Pousse d'ent"]], "sakuras"],
    ["Golems", "#6AA7C7", "Grottes · Géodes", [["mega_warden", "Le Méga-Gardien"], ["amethystgolem", "Le Golem d'améthyste"]], [["diamondgolem", "Golem de diamant"], ["emeraldgolem", "Golem d'émeraude"], ["quartzgolem", "Golem de quartz"], ["rock_golem", "Golem de roche"]], "grottes"],
  ];
  // les diapositives du chapitre III (accueil) : écrites dans la page par outils/seo.js, ou par accueil.js à défaut
  const diapos = () => PEUPLES.map(([nom, c, terres, boss, troupes, theme], i) => `
    <article class="peuple-diapo" style="--c:${c}" data-fond="img/peuples/fond-${theme}.webp" aria-roledescription="diapositive" aria-label="${i + 1} sur ${PEUPLES.length} : ${nom}">
      <div class="peuple-grille">
        <div class="peuple-gauche">
          <p class="peuple-terres">${terres}</p>
          <h3 class="peuple-nom">${nom}</h3>
          <div class="peuple-boss${boss.length > 1 ? " deux" : ""}">${boss.map(([p, n]) => `<figure class="fenetre-boss"><img src="img/boss/p_${p}.webp" alt="" loading="lazy" width="320" height="320"><figcaption><small>Boss</small><b>${n}</b></figcaption></figure>`).join("")}</div>
        </div>
        <div class="peuple-droite">
          <p class="peuple-sous-titre">${troupes.some(([p]) => /^bear_/.test(p)) ? "Leurs troupes et la faune de leurs terres" : "Leurs troupes"}</p>
          <ul class="peuple-creatures">${troupes.slice(0, 4).map(([p, n]) => `<li><span class="creature-image"><img src="img/sbires/${p}.webp" alt="" loading="lazy" width="160" height="160"></span><span class="creature-nom">${n}</span></li>`).join("")}</ul>
        </div>
      </div>
    </article>`).join("");
  PEUPLES.diapos = diapos;
  if (typeof module !== "undefined") module.exports = PEUPLES; else window.PEUPLES = PEUPLES;
})();
