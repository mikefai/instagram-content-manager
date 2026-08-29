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
  build: {
    rollupOptions: {
      output: {
        // Split heavy vendor libraries out of the app bundle.
        manualChunks: {
          recharts: ["recharts"],
          radix: [
            "@radix-ui/react-checkbox",
            "@radix-ui/react-dialog",
            "@radix-ui/react-label",
            "@radix-ui/react-progress",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
          ],
          lucide: ["lucide-react"],
        },
      },
    },
  },
});