// Serveur statique minimal pour la maquette du site (aucune dépendance).
// Usage : node serveur.js [port]   (4321 par défaut)
"use strict";
const http = require("http"), fs = require("fs"), path = require("path");
const RACINE = __dirname, PORT = Number(process.argv[2]) || 4321;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".ttf": "font/ttf", ".ogg": "audio/ogg", ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8" };

http.createServer((req, res) => {
  let chemin;
  try { chemin = decodeURIComponent(new URL(req.url.replace(/^\/+/, "/"), "http://x").pathname); } catch { res.writeHead(400); return res.end(); }
  if (chemin.endsWith("/")) chemin += "index.html";
  const fichier = path.normalize(path.join(RACINE, chemin));
  if (!fichier.startsWith(RACINE) || fichier.includes(`${path.sep}outils${path.sep}`)) { res.writeHead(403); return res.end(); }
  fs.readFile(fichier, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Page introuvable"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Maquette du site : http://localhost:${PORT}/`));
