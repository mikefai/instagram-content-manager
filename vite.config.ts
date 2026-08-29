import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
      // The app imports icons from `nucleo-sharp`; the npm package `nucleo-sharp`
      // exports `Icon*`-prefixed names (e.g. `IconCalendar`), not the names used
      // here. Resolve the module to the local shim instead — see src/lib/nucleo-sharp.tsx.
      "nucleo-sharp": path.resolve(dirname, "./src/lib/nucleo-sharp.tsx"),
    },
  },
});