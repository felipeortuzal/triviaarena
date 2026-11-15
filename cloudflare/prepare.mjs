import {mkdir,copyFile} from "node:fs/promises";
await mkdir("cloudflare/public/assets",{recursive:true});
await copyFile("assets/riviera-logo-transparent.png","cloudflare/public/assets/riviera-logo-transparent.png");
await copyFile("assets/riviera-reference-beach.jpg","cloudflare/public/assets/riviera-reference-beach.jpg");
await copyFile("riviera-showdown.html","cloudflare/public/offline.html");
console.log("Assets aprovados e modo offline copiados para Cloudflare.");
