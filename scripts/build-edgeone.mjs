import { copyFile, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, ".edgeone");
const assetsDir = join(outDir, "assets");
const functionsDir = join(outDir, "cloud-functions");

await rm(outDir, { recursive: true, force: true });
await mkdir(assetsDir, { recursive: true });
await mkdir(join(functionsDir, "api"), { recursive: true });

for (const file of ["index.html", "app.js", "styles.css", "icon.png"]) {
  await copyFile(join(root, file), join(assetsDir, file));
}

await copyDirIfExists(join(root, "payments"), join(assetsDir, "payments"));

for (const file of ["package.json"]) {
  await copyFile(join(root, "cloud-functions", file), join(functionsDir, file));
}

await copyDirIfExists(join(root, "cloud-functions", "api"), join(functionsDir, "api"));
await copyDirIfExists(join(root, "cloud-functions", "lib"), join(functionsDir, "lib"));

const config = {
  version: 3,
  routes: [
    { src: "^/api/proxy-image/?$", methods: ["POST", "OPTIONS"] },
    { src: "^/api/cache-image/?$", methods: ["POST", "OPTIONS"] },
    { src: "^/api/reference-image(?:/.*)?$", methods: ["GET", "POST", "OPTIONS"] },
    { src: "^/api/health/?$", methods: ["GET", "OPTIONS"] },
    { src: "^/api/auth/(.*)$", methods: ["GET", "POST", "OPTIONS"] },
    { src: "^/api/generate/(.*)$", methods: ["POST", "OPTIONS"] },
    { src: "^/api/admin/(.*)$", methods: ["GET", "POST", "OPTIONS"] },
    { src: "^/api/billing/(.*)$", methods: ["GET", "POST", "OPTIONS"] },
    { src: "^/api/site/(.*)$", methods: ["GET", "POST", "OPTIONS"] },
    { handle: "filesystem" },
    { src: "^/$", dest: "/index.html" },
    { src: "^/(.*)$", dest: "/index.html" },
  ],
};

await writeFile(join(outDir, "config.json"), `${JSON.stringify(config, null, 2)}\n`, "utf8");

console.log(`EdgeOne output created at ${outDir}`);

async function copyDirIfExists(from, to) {
  let entries = [];
  try {
    entries = await readdir(from, { withFileTypes: true });
  } catch {
    return;
  }
  await mkdir(to, { recursive: true });
  for (const entry of entries) {
    const source = join(from, entry.name);
    const target = join(to, entry.name);
    if (entry.isDirectory()) await copyDirIfExists(source, target);
    else await copyFile(source, target);
  }
}
