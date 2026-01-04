import fs from "fs";
import path from "path";
import wordListPath from "word-list";

const targetDir = path.join(
  process.cwd(),
  "app",
  "assets",
  "word-list",
);
const targetFile = path.join(targetDir, "words.txt");

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(wordListPath, targetFile);
console.log(
  `[sync-wordlist] copied ${wordListPath} -> ${targetFile}`,
);
