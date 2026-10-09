# Historia · site vitrine

Site public du serveur Minecraft d'aventure **Historia** : présentation interactive, galerie, progression.
Maquette en HTML, CSS et JavaScript, sans dépendance ni étape de construction.

## En ligne

https://antaooo.github.io/historia-site/

## Lancer en local

```bash
node serveur.js 4321
```

Puis ouvrir http://localhost:4321.

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html`, `accueil.js` | Accueil : présentation en chapitres (monde, créatures, légendes, progression, Tour, galerie, FAQ) |
| `galerie.html`, `galerie.js` | Galerie : biomes en pixel art, légendes, captures en jeu, visionneuse |
| `progression.html`, `progression.js` | Progression : métiers, statistiques, zones, spécialités, rangs, passe |
| `pixel.js` | Moteur des fonds en pixel art (paysages des biomes, particules), générés dans la page |
| `commun.js`, `extras.js` | En-tête, copie de l'adresse, bandeau de la bêta, bouton musique, barre mobile |
| `style.css`, `pages.css` | Styles |

## Licences des ressources

- **Polices** : Monocraft (Idrees Hassan) et Figtree (The Figtree Project Authors), SIL Open Font License 1.1 (`polices-libres/`). Hébergées sur le site, sans appel à Google.
- **Musique** : « Majestic Hills », Kevin MacLeod (incompetech.com), CC BY 4.0, créditée dans le pied de page.
- **Portraits des boss** (`img/boss/`) : rendus des modèles des packs de créatures utilisés sur le serveur, montrés pour présenter le serveur. Ils ne sont pas sous licence libre : merci de ne pas les réutiliser.
- Paysages, textures, logo et icônes : dessinés pour Historia.

Historia est un serveur non officiel, ni approuvé par Mojang ou Microsoft, ni associé à eux.
