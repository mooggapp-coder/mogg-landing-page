/**
 * Generate PWA icons from src/assets/mogg-logo.png
 * Run: node scripts/generate-pwa-icons.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LOGO = path.join(ROOT, "src", "assets", "mogg-logo.png");
const OUT = path.join(ROOT, "public");
const BG = { r: 0, g: 0, b: 0, alpha: 1 };

async function make(size, file, padRatio) {
  const pad = Math.round(size * padRatio);
  const inner = size - pad * 2;
  const logo = await sharp(LOGO)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, top: pad, left: pad }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, file));

  console.log("wrote", file, `${size}x${size}`);
}

if (!fs.existsSync(LOGO)) {
  console.error("Logo not found:", LOGO);
  process.exit(1);
}

await make(192, "pwa-192x192.png", 0.12);
await make(512, "pwa-512x512.png", 0.12);
await make(512, "pwa-512x512-maskable.png", 0.2);
await make(180, "apple-touch-icon.png", 0.12);
console.log("PWA icons ready in public/");
