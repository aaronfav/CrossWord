const major = Number(process.versions.node.split(".")[0]);

if (Number.isNaN(major) || major < 20 || major >= 23) {
  console.error(
    [
      "Unsupported Node.js version. Please use Node 20 LTS or 22 LTS (>=20 <23).",
      "If you already have Node 20/22 installed elsewhere, run:",
      "  npm run install:anynode",
      "  npm run dev:anynode",
    ].join("\n"),
  );
  process.exit(1);
}
