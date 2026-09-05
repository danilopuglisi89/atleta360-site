import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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
