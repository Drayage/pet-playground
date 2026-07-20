import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const outputDirectory = "dist-pages";

function injectBuiltAssetsIntoServiceWorker(): Plugin {
  return {
    name: "inject-pages-assets-into-service-worker",
    apply: "build",
    async writeBundle() {
      const assetsDirectory = path.resolve(outputDirectory, "assets");
      const files = await readdir(assetsDirectory, { withFileTypes: true });
      const builtAssets = files
        .filter((file) => file.isFile() && /\.(?:css|js)$/.test(file.name))
        .map((file) => `assets/${file.name}`)
        .sort();
      const serviceWorkerPath = path.resolve(outputDirectory, "sw.js");
      const serviceWorker = await readFile(serviceWorkerPath, "utf8");
      await writeFile(
        serviceWorkerPath,
        serviceWorker.replace("const BUILD_ASSETS = [];", `const BUILD_ASSETS = ${JSON.stringify(builtAssets)};`),
      );
    },
  };
}

export default defineConfig({
  base: "/pet-playground/",
  plugins: [react(), injectBuiltAssetsIntoServiceWorker()],
  build: {
    outDir: outputDirectory,
    emptyOutDir: true,
  },
});
