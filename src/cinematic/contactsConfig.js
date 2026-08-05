/* ============================================================
   SEGNAPOSTO DA SOSTITUIRE — Danilo deve passare i valori reali.
   Finché restano questi placeholder i bottoni funzionano ma puntano
   a destinazioni finte/assenti. Vedi il messaggio di fine sessione
   per l'elenco completo di cosa manca.
   ============================================================ */

// Numero WhatsApp in formato internazionale, senza "+" né spazi (es. "393331234567").
export const WHATSAPP_NUMBER = "390000000000";

export const WHATSAPP_MESSAGE =
  "Ciao Danilo, ho visto Atleta360 e vorrei saperne di più.";

export const WHATSAPP_URL =
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

// URL completo del profilo LinkedIn.
export const LINKEDIN_URL = "https://www.linkedin.com/";

// Pagina Instagram dedicata al progetto Atleta360.
export const INSTAGRAM_URL = "https://www.instagram.com/atleta360.volley/";

// Link di prenotazione (Calendly o simile). "#" finché non esiste.
export const BOOKING_URL = "#";

export const CONTACT_EMAIL = "info@danilopuglisi.com";
