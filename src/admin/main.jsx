import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/space-grotesk/700.css";
import "../avviso.css";
import "./admin.css";
import Admin from "./Admin";

createRoot(document.getElementById("admin")).render(
  <StrictMode>
    <Admin />
  </StrictMode>
);
