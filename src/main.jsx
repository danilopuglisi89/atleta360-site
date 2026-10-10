import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
/* Font serviti dal sito stesso invece che da fonts.googleapis.com: quella
   richiesta bloccava la prima pittura per ~1 secondo sul telefono (misurato
   con Lighthouse) e mandava a Google l'indirizzo di ogni visitatore. Solo i
   pesi in uso: Inter 400/600/700 per il testo, Space Grotesk 600/700 per i
   titoli. */
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <Analytics />
  </StrictMode>
);
