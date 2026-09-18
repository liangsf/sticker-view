#!/usr/bin/env node
/**
 * 扫描 sticker-file/ 目录，生成站点数据 data.json
 * 用法: node build.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.join(ROOT, "sticker-file");
const OUT = path.join(ROOT, "data.json");

function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return null;
  }
}

function exists(rel) {
  return fs.existsSync(path.join(SRC, rel));
}

function guessPackName(dir) {
  // 20260917_225829_123 → 20260917
  const m = dir.match(/^(\d{8})/);
  return m ? `表情包 ${m[1]}` : dir;
}

const packs = [];

for (const dir of fs.readdirSync(SRC).sort()) {
  const dirPath = path.join(SRC, dir);
  if (!fs.statSync(dirPath).isDirectory()) continue;

  const manifest = readJsonSafe(path.join(dirPath, "manifest.json"));
  const plan = readJsonSafe(path.join(dirPath, "plan.json"));
  const meta = manifest || plan;

  // 收集贴纸（优先 JSON 元数据，否则从文件名扫描）
  let stickers = [];
  if (meta && meta.stickers) {
    stickers = meta.stickers
      .map((s) => {
        const base = s.id;
        const png = `${base}.png`;
        const gif = s.gif || `${base}.gif`;
        const mp4 = s.mp4 || `${base}.mp4`;
        return {
          id: base,
          label: s.label || base,
          caption: s.caption || "",
          scene: s.scene || "",
          png: exists(`${dir}/${png}`) ? `sticker-file/${dir}/${png}` : null,
          gif: exists(`${dir}/${gif}`) ? `sticker-file/${dir}/${gif}` : null,
          mp4: exists(`${dir}/${mp4}`) ? `sticker-file/${dir}/${mp4}` : null,
        };
      })
      .filter((s) => s.png || s.gif || s.mp4);
  } else {
    // 文件名扫描：png 为 01_xxx.png，gif/mp4 为 01-xxx.gif/.mp4
    const all = fs.readdirSync(dirPath);
    const pngMap = new Map(); // prefix → png filename
    for (const f of all) {
      const m = f.match(/^(\d{2})_(.+)\.png$/);
      if (m) pngMap.set(m[1], { file: f, label: m[2] });
    }
    for (const [prefix, { file, label }] of [...pngMap.entries()].sort()) {
      const gifName = `${prefix}-${label}.gif`;
      const mp4Name = `${prefix}-${label}.mp4`;
      stickers.push({
        id: `${prefix}_${label}`,
        label,
        caption: "",
        scene: "",
        png: exists(`${dir}/${file}`) ? `sticker-file/${dir}/${file}` : null,
        gif: exists(`${dir}/${gifName}`) ? `sticker-file/${dir}/${gifName}` : null,
        mp4: exists(`${dir}/${mp4Name}`) ? `sticker-file/${dir}/${mp4Name}` : null,
      });
    }
  }

  if (!stickers.length) continue;

  const files = (manifest && manifest.files) || {};
  const rel = (name) => (name && exists(`${dir}/${name}`) ? `sticker-file/${dir}/${name}` : null);

  let cover = rel(files.cover) || rel(files.icon);
  if (!cover) cover = stickers.find((s) => s.png)?.png || stickers[0].gif;

  const zipName =
    (manifest && manifest.zip) ||
    fs.readdirSync(dirPath).find((f) => f.toLowerCase().endsWith(".zip"));
  const hasAnim = stickers.some((s) => s.gif);

  packs.push({
    id: dir,
    name: (meta && meta.pack_name) || guessPackName(dir),
    theme: (meta && meta.theme) || "",
    cover,
    banner: rel(files.banner),
    icon: rel(files.icon),
    zip: zipName && exists(`${dir}/${zipName}`) ? `sticker-file/${dir}/${zipName}` : null,
    animated: hasAnim,
    count: stickers.length,
    stickers,
  });
}

fs.writeFileSync(OUT, JSON.stringify({ packs }, null, 2), "utf-8");
console.log(`已生成 data.json：${packs.length} 个表情包，共 ${packs.reduce((n, p) => n + p.count, 0)} 张贴纸`);
