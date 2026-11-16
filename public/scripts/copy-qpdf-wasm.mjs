import { copyFileSync, existsSync, mkdirSync } from "node:fs";

const src = "node_modules/@neslinesli93/qpdf-wasm/dist/qpdf.wasm";
if (!existsSync(src)) {
  throw new Error(`Missing ${src}. Did "npm install" finish?`);
}
mkdirSync("public/qpdf", { recursive: true });
copyFileSync(src, "public/qpdf/qpdf.wasm");