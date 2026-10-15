import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const root = "public/images";
const maxWidth = 1600;

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) {
      const meta = statSync(full);
      if (meta.size === 0) continue;
      const img = sharp(full);
      const info = await img.metadata();
      if ((info.width ?? 0) <= maxWidth) continue;
      await img.resize({ width: maxWidth, withoutEnlargement: true, fit: "inside" }).jpeg({ quality: 82, progressive: true }).toFile(`${full}.tmp`);
      await import("node:fs/promises").then(({ rename }) => rename(`${full}.tmp`, full));
      console.log("resized", full);
    }
  }
}

await walk(root);
console.log("done");
