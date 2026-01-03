import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function parseVersion(raw) {
  const match = raw.trim().match(/^v(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function isCompatible(version) {
  if (!version) return false;
  return version.major >= 20 && version.major < 23;
}

function compareCandidates(a, b) {
  const preferMajor = (version) => (version.major === 20 ? 2 : 1);
  const majorScore = preferMajor(b.version) - preferMajor(a.version);
  if (majorScore !== 0) return majorScore;
  if (b.version.minor !== a.version.minor) return b.version.minor - a.version.minor;
  return b.version.patch - a.version.patch;
}

function uniquePaths(paths) {
  const seen = new Set();
  return paths.filter((item) => {
    const normalized = path.normalize(item);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function listNodePaths() {
  const platform = process.platform;
  try {
    if (platform === "win32") {
      const output = execFileSync("where.exe", ["node"], { encoding: "utf8" });
      return uniquePaths(output.split(/\r?\n/).filter(Boolean));
    }
    const output = execFileSync("which", ["-a", "node"], { encoding: "utf8" });
    return uniquePaths(output.split(/\r?\n/).filter(Boolean));
  } catch {
    return [];
  }
}

function getVersionForPath(nodePath) {
  try {
    const output = execFileSync(nodePath, ["-v"], { encoding: "utf8" });
    return parseVersion(output);
  } catch {
    return null;
  }
}

const candidates = listNodePaths()
  .filter((nodePath) => fs.existsSync(nodePath))
  .map((nodePath) => ({
    path: nodePath,
    version: getVersionForPath(nodePath),
  }))
  .filter((entry) => isCompatible(entry.version));

if (candidates.length === 0) {
  console.error(
    "No compatible Node.js binary found (>=20 <23). Install Node 20/22 or use Docker if available.",
  );
  process.exit(1);
}

const selected = candidates.sort(compareCandidates)[0];
console.log(selected.path);
