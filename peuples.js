// Les peuples du royaume : leurs boss et leurs troupes (créatures vérifiées dans les apparitions en jeu).
// Partagé par l'accueil (chapitre III) et le bestiaire (onglet Créatures) ; lisible aussi par le générateur de pages (Node).
"use strict";
(() => {
  // [nom, couleur, terres, boss [[portrait, nom]], troupes [[portrait, nom]]]
  const PEUPLES = [
    ["Elfes", "#8F6FC9", "Forêt lunaire · Jardin des fées", [["elven_druid", "La Druidesse elfe"]], [["elven_swordsman", "Épéiste elfe"], ["elven_ranger", "Rôdeur elfe"], ["elven_mage", "Mage elfe"], ["elven_runebear", "Ours runique"]]],
    ["Nains", "#8A8A96", "Pics de granit · Mines", [["dwarf_blacksmith", "Le Forgeron nain"]], [["dwarf_knight", "Chevalier nain"], ["dwarf_huntsman", "Chasseur nain"], ["dwarf_cleric", "Clerc nain"], ["koboldassassin", "Assassin kobold"]]],
    ["Gobelins", "#6F9A2A", "Plaines · Savane · Steppe", [["goblin_king", "Le Roi gobelin"], ["kur", "Kur"]], [["gp2_goblin_archer", "Guerrier gobelin"], ["gp2_goblin_shaman", "Chaman gobelin"]]],
    ["Vikings", "#4C78A8", "Taïga · Forêt boréale", [["viking", "Bjorn l'Exalté"]], [["viking_npc", "Guerrier viking"]]],
    ["Pirates", "#2F7FA5", "Côtes · Abysses", [["pirate_captain", "Capitaine DeadBeard"], ["kraken", "Le Kraken"]], [["piratepack_crewmate", "Pirate de l'équipage"], ["pirate_swordsman", "Pirate sabreur"], ["pirate_gunner", "Pirate tireur"], ["piratepack_crab", "Crabe pirate"]]],
    ["Morts-vivants", "#5F8F7A", "Désert · Marais maudit · Forêts", [["lr_anubis", "Anubis"], ["mortos", "Mortos"]], [["lr_anubis_mummy", "Momie d'Anubis"], ["tower_skeleton", "Squelette de la tour"], ["azriel_minion", "Sbire d'Azriel"], ["modelfoundry_mutant_zombie_strong", "Zombie mutant"]]],
    ["Démons", "#A23A3A", "Bois hanté · Caldeira", [["lillith", "Lillith"], ["demon_of_chaos_gama05", "Démon du chaos"]], [["halloweenpackvol3_imp", "Diablotin"], ["piglin_mage", "Piglin mage"], ["piglin_marauder", "Piglin maraudeur"], ["demon_reaper", "Faucheur démoniaque"]]],
    ["Esprits de la forêt", "#3F9D8F", "Forêts · Vallée des sakuras", [["ent_king", "Le Roi des ents"], ["hana", "Hana"]], [["ent_warrior", "Ent guerrier"], ["ent_sorcerer", "Ent sorcier"], ["sakura_tree_ent", "Ent de cerisier"], ["oak_entling", "Pousse d'ent"]]],
    ["Golems", "#6AA7C7", "Grottes · Géodes", [["mega_warden", "Le Méga-Gardien"], ["amethystgolem", "Golem d'améthyste"]], [["diamondgolem", "Golem de diamant"], ["emeraldgolem", "Golem d'émeraude"], ["quartzgolem", "Golem de quartz"], ["rock_golem", "Golem de roche"]]],
  ];
  if (typeof module !== "undefined") module.exports = PEUPLES; else window.PEUPLES = PEUPLES;
})();
