const PIXEL_ID = "1664151050635563";
const CONSENT_KEY = "a360_cookie_consent"; // "accepted" | "rejected"

function loadPixelScript() {
  if (window.fbq) return;
  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
}

export function getConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

export function setConsent(value) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // storage non disponibile (modalità privata ecc.): il banner ricomparirà, non è grave
  }
  if (value === "accepted") loadPixelScript();
}

export function initPixelIfConsented() {
  if (getConsent() === "accepted") loadPixelScript();
}

export function trackLead(tipo) {
  if (getConsent() !== "accepted" || !window.fbq) return;
  window.fbq("track", "Lead", { content_name: tipo === "atleta" ? "Demo Atleta" : "Demo Società" });
}
