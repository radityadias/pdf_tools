import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const out = "public/tesseract";
mkdirSync(join(out, "core"), { recursive: true });
mkdirSync(join(out, "lang"), { recursive: true });

const worker = "node_modules/tesseract.js/dist/worker.min.js";
if (!existsSync(worker)) {
  throw new Error(`Missing ${worker}. Did "npm install" finish?`);
}
copyFileSync(worker, join(out, "worker.min.js"));

const coreDir = "node_modules/tesseract.js-core";
if (!existsSync(coreDir)) {
  throw new Error(`Missing ${coreDir}. Is tesseract.js installed?`);
}
for (const file of readdirSync(coreDir)) {
  if (file.startsWith("tesseract-core")) {
    copyFileSync(join(coreDir, file), join(out, "core", file));
  }
}