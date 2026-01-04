import fs from "fs";
import path from "path";
import sharp from "sharp";

const sourcePath = path.join(
  process.cwd(),
  "assets",
  "logo",
  "source.png",
);

const outputDir = path.join(
  process.cwd(),
  "public",
  "farcaster",
);

const background = "#05070A";

function ensureSource() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(
      `[generate-brand-assets] Missing source logo at ${sourcePath}`,
    );
  }
}

async function writeImage({ width, height, fileName }) {
  const targetPath = path.join(outputDir, fileName);
  await sharp(sourcePath)
    .resize(width, height, {
      fit: "contain",
      background,
    })
    .flatten({ background })
    .png()
    .toFile(targetPath);
  console.log(`[generate-brand-assets] wrote ${targetPath}`);
}

async function main() {
  ensureSource();
  fs.mkdirSync(outputDir, { recursive: true });
  await writeImage({ width: 1024, height: 1024, fileName: "icon.png" });
  await writeImage({ width: 2000, height: 2000, fileName: "splash.png" });
  await writeImage({ width: 1200, height: 630, fileName: "og.png" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
