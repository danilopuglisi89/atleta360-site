import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const radice = (f) => fileURLToPath(new URL(f, import.meta.url));

export default defineConfig({
  plugins: [react()],
  // @vercel/analytics/react importa React via interop CJS: senza forzare qui
  // la pre-ottimizzazione, esbuild genera un secondo chunk "react" distinto
  // da quello usato dal resto dell'app, con conseguente "Invalid hook call".
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      // due pagine: il sito e il pannello /admin. Il codice del pannello sta in
      // un pacchetto suo e non viene mai scaricato da chi visita il sito.
      input: { main: radice("./index.html"), admin: radice("./admin.html") },
      output: {
        manualChunks: {
          // Supabase serve solo al momento dell'invio del form: tenerlo fuori
          // dal bundle iniziale accorcia il primo render della hero.
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
});
