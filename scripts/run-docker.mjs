import { execFileSync, spawn } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);
const command = args[0] || "dev";
const cwd = process.cwd();

function hasDocker() {
  try {
    execFileSync("docker", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function runDocker(cmd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd[0], cmd.slice(1), { stdio: "inherit", cwd });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`docker exited with code ${code}`));
    });
  });
}

async function main() {
  if (!hasDocker()) {
    console.error("Docker is not available on this machine.");
    process.exit(1);
  }

  const volume = `${cwd}:/app`;
  const baseArgs = [
    "run",
    "--rm",
    "-it",
    "-p",
    "3000:3000",
    "-v",
    volume,
    "-w",
    "/app",
    "node:20-bullseye",
  ];

  if (command === "install") {
    await runDocker(["docker", ...baseArgs, "npm", "install"]);
    return;
  }

  const runArgs = `npm install && npm run ${command} ${args
    .slice(1)
    .map((arg) => `"${arg}"`)
    .join(" ")}`.trim();
  await runDocker(["docker", ...baseArgs, "sh", "-c", runArgs]);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
