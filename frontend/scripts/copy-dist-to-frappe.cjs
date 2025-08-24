/**
 * Copy built assets from ./frontend/dist to Frappe app public and www folders
 * Finalized mapping per request:
 * - SPA entry stays at: workz/www/workz/index.html
 * - Built JS/CSS assets go FLAT into: workz/public/frontend/* (no nested assets/ folder)
 *   Served by Frappe at: /assets/workz/frontend/*
 *
 * Behavior:
 * - Cleans the target public/frontend directory before copying new assets.
 * - Flattens dist output (moves dist/* and dist/assets/* into public/frontend root).
 * - Rewrites index.html to reference /assets/workz/frontend/* asset filenames.
 */
const fs = require("fs");
const path = require("path");

const root = process.cwd(); // ./frontend
const distDir = path.join(root, "dist");

// Resolve Frappe app base (one level up from ./frontend)
const repoRoot = path.resolve(root, "..");
const appPublicBase = path.join(repoRoot, "workz", "public", "frontend");
const appWwwBase = path.join(repoRoot, "workz", "www", "workz");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  for (const entry of fs.readdirSync(p)) {
    const cur = path.join(p, entry);
    const stat = fs.lstatSync(cur);
    if (stat.isDirectory()) rmrf(cur);
    else fs.unlinkSync(cur);
  }
  // keep base dir
}

function copyFileToDir(srcFile, destDir) {
  ensureDir(destDir);
  const base = path.basename(srcFile);
  fs.copyFileSync(srcFile, path.join(destDir, base));
}

function flattenCopyDistToPublic(distPath, publicPath) {
  // Copy top-level files (e.g., index.html, manifest) except index.html (handled separately)
  for (const entry of fs.readdirSync(distPath)) {
    const cur = path.join(distPath, entry);
    const stat = fs.lstatSync(cur);
    if (stat.isDirectory()) continue;
    if (entry.toLowerCase() === "index.html") continue;
    copyFileToDir(cur, publicPath);
  }
  // Copy assets/* contents flat into publicPath
  const assetsDir = path.join(distPath, "assets");
  if (fs.existsSync(assetsDir)) {
    for (const entry of fs.readdirSync(assetsDir)) {
      const from = path.join(assetsDir, entry);
      const stat = fs.lstatSync(from);
      if (stat.isDirectory()) {
        // If Vite created subfolders, copy files inside flat as well
        for (const sub of fs.readdirSync(from)) {
          const subFrom = path.join(from, sub);
          if (fs.lstatSync(subFrom).isFile()) {
            copyFileToDir(subFrom, publicPath);
          }
        }
      } else {
        copyFileToDir(from, publicPath);
      }
    }
  }
}

/**
 * Rewrites built index.html asset URLs to absolute /assets/workz/frontend/<filename>
 * removing any "assets/" path segment because files are flattened.
 */
function rewriteIndexHtmlFlat(srcHtmlPath, destHtmlPath) {
  let html = fs.readFileSync(srcHtmlPath, "utf8");

  // Replace href/src pointing to ./assets/<file> or assets/<file> with /assets/workz/frontend/<file>
  html = html.replace(/(["'(])(?:\.\/)?assets\/([^"')\s>]+)/g, (_m, p1, file) => `${p1}/assets/workz/frontend/${file}`);

  // Also handle any manifest or CSS links not in assets dir that ended up flattened (rare)
  // Ensure favicon path points to flattened location
  html = html.replace(/href="\.\/*favicon\.ico"/g, 'href="/assets/workz/frontend/favicon.ico"');

  fs.writeFileSync(destHtmlPath, html, "utf8");
}

function main() {
  if (!fs.existsSync(distDir)) {
    console.error("Dist directory not found:", distDir);
    process.exit(1);
  }

  // 1) Clean and recreate public/frontend
  ensureDir(appPublicBase);
  rmrf(appPublicBase);
  ensureDir(appPublicBase);

  // 2) Flatten-copy dist into public/frontend (excluding index.html)
  flattenCopyDistToPublic(distDir, appPublicBase);

  // 3) Rewrite and place index.html into www/workz
  ensureDir(appWwwBase);
  const srcIndex = path.join(distDir, "index.html");
  const destIndex = path.join(appWwwBase, "index.html");

  if (fs.existsSync(srcIndex)) {
    rewriteIndexHtmlFlat(srcIndex, destIndex);
  } else {
    console.warn("index.html not found in dist; ensure Vite build output exists.");
  }

  console.log("Copied flattened assets to:");
  console.log(" -", appPublicBase, "(=> /assets/workz/frontend/<files>)");
  console.log(" -", destIndex, "(SPA entry at /workz with rewritten URLs)");
}

main();