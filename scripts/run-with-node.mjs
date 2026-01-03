import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const command = args[0] || "dev";
const cwd = process.cwd();

function getNodeBinary() {
  try {
    const output = execFileSync(process.execPath, ["scripts/find-node.mjs"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    });
    return output.trim();
  } catch {
    return null;
  }
}

function resolveNpm(nodePath) {
  const nodeDir = path.dirname(nodePath);
  if (process.platform === "win32") {
    const npmCmd = path.join(nodeDir, "npm.cmd");
    if (fs.existsSync(npmCmd)) return npmCmd;
  } else {
    const npmBin = path.join(nodeDir, "npm");
    if (fs.existsSync(npmBin)) return npmBin;
  }
  return "npm";
}

function runCommand(bin, binArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, binArgs, { stdio: "inherit", cwd });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${bin} exited with code ${code}`));
    });
  });
}

async function main() {
  const nodePath = getNodeBinary();
  if (!nodePath) {
    console.error(
      "No compatible Node.js binary found (>=20 <23). If Docker is installed, try `npm run dev:docker`.",
    );
    process.exit(1);
  }

  const npmBin = resolveNpm(nodePath);
  const hasLock =
    fs.existsSync(path.join(cwd, "package-lock.json")) ||
    fs.existsSync(path.join(cwd, "npm-shrinkwrap.json"));
  const installArgs = hasLock ? ["ci"] : ["install"];

  if (command === "install") {
    await runCommand(npmBin, installArgs);
    return;
  }

  await runCommand(npmBin, installArgs);
  await runCommand(npmBin, ["run", command, ...args.slice(1)]);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
