import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, ".edgeone");
const assetsDir = join(outDir, "assets");
const functionsDir = join(outDir, "cloud-functions");

await rm(outDir, { recursive: true, force: true });
await mkdir(assetsDir, { recursive: true });
await mkdir(join(functionsDir, "api"), { recursive: true });

for (const file of ["index.html", "app.js", "styles.css"]) {
  await copyFile(join(root, file), join(assetsDir, file));
}

for (const file of ["package.json"]) {
  await copyFile(join(root, "cloud-functions", file), join(functionsDir, file));
}

for (const file of ["proxy-image.js", "cache-image.js"]) {
  await copyFile(join(root, "cloud-functions", "api", file), join(functionsDir, "api", file));
}

const config = {
  version: 3,
  routes: [
    { src: "^/api/proxy-image/?$", methods: ["POST", "OPTIONS"] },
    { src: "^/api/cache-image/?$", methods: ["POST", "OPTIONS"] },
    { handle: "filesystem" },
    { src: "^/$", dest: "/index.html" },
    { src: "^/(.*)$", dest: "/index.html" },
  ],
};

await writeFile(join(outDir, "config.json"), `${JSON.stringify(config, null, 2)}\n`, "utf8");

console.log(`EdgeOne output created at ${outDir}`);
