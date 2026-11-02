/* Pagine di contenuto: contatori anonimi, registro della visita e modulo di
   contatto. Stesse regole del sito (src/analytics.js, src/visita.js): niente
   cookie, id casuale in memoria, il browser di Danilo ("non contare") escluso. */
(function () {
  var pagina = document.body.getAttribute("data-pagina") || "guida";
  var nonContare = false;
  try { nonContare = localStorage.getItem("a360_non_contare") === "1"; } catch (e) {}

  function fonte() {
    var q = new URLSearchParams(location.search);
    var utm = q.get("utm_source") || q.get("ref") || q.get("fonte") || "";
    var host = "";
    try { host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : ""; } catch (e) {}
    if (host === location.hostname.replace(/^www\./, "")) host = "";
    var t = (utm || host).toLowerCase();
    var regole = [["instagram", /instagram|^ig$/], ["facebook", /facebook|^fb$|meta/], ["google", /google|bing|duckduckgo|ecosia|yahoo/],
      ["linkedin", /linkedin|lnkd/], ["whatsapp", /whatsapp|^wa$/], ["danilopuglisi", /danilopuglisi/], ["email", /mail|newsletter/]];
    var cat = t ? "altro" : "diretto";
    for (var i = 0; i < regole.length; i++) if (regole[i][1].test(t)) { cat = regole[i][0]; break; }
    var dett = utm ? [utm, q.get("utm_medium"), q.get("utm_campaign")].filter(Boolean).join(" / ") : host;
    return { categoria: cat, dettaglio: (dett || "").slice(0, 200) };
  }
  var f = fonte();

  function invia(url, dati, urgente) {
    try {
      var corpo = JSON.stringify(dati);
      if (urgente && navigator.sendBeacon && navigator.sendBeacon(url, new Blob([corpo], { type: "application/json" }))) return;
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: corpo, keepalive: true }).catch(function () {});
    } catch (e) {}
  }

  var id = null, azioni = [], profondita = 0, secondi = 0, da = document.visibilityState === "visible" ? Date.now() : 0;
  if (!nonContare && window.crypto && crypto.randomUUID) {
    id = crypto.randomUUID();
    invia("/api/evento", { eventi: ["visita." + pagina, "fonte." + f.categoria] });
    invia("/api/visita", { id: id, tipo: "inizio", pagina: pagina, fonte: f.categoria, dettaglio: f.dettaglio + (f.dettaglio ? " " : "") + "→ " + location.pathname });
  }
  function tempo() { return Math.round(secondi + (da ? (Date.now() - da) / 1000 : 0)); }
  function aggiorna(urgente) { if (id) invia("/api/visita", { id: id, tipo: "aggiorna", profondita: profondita, secondi: tempo(), azioni: azioni }, urgente); }
  function azione(a) { if (id && azioni.indexOf(a) < 0) { azioni.push(a); aggiorna(); } }

  var attesa;
  addEventListener("scroll", function () {
    var max = document.documentElement.scrollHeight - innerHeight;
    if (max <= 0) return;
    var p = Math.min(100, Math.round(scrollY / max * 100));
    if (p > profondita) { profondita = p; clearTimeout(attesa); attesa = setTimeout(aggiorna, 4000); }
  }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") { if (da) { secondi += (Date.now() - da) / 1000; da = 0; } aggiorna(true); }
    else if (!da) da = Date.now();
  });
  addEventListener("pagehide", function () { aggiorna(true); });
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (a && /wa\.me|whatsapp/i.test(a.getAttribute("href"))) azione("whatsapp");
  }, true);

  /* Pulsante fisso sul telefono: compare solo quando né l'apertura né il modulo sono a vista. */
  var barra = document.querySelector(".barra-fissa");
  if (barra && "IntersectionObserver" in window) {
    var visti = new Map();
    var oss = new IntersectionObserver(function (es) {
      es.forEach(function (e) { visti.set(e.target, e.isIntersecting); });
      barra.classList.toggle("visibile", !Array.from(visti.values()).some(Boolean));
    });
    document.querySelectorAll(".eroe, #contatto").forEach(function (el) { oss.observe(el); });
  }

  /* Modulo "colloquio gratuito": va al server come le iscrizioni ai webinar
     (api/iscrizione.js, evento "coaching"). */
  var aperto = Date.now();
  document.querySelectorAll("form[data-modulo]").forEach(function (form) {
    var esito = form.querySelector(".esito");
    form.addEventListener("focusin", function () { azione("form.aperto"); }, { once: true });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = Object.fromEntries(new FormData(form).entries());
      esito.className = "esito";
      // telefono obbligatorio se si vuole essere richiamati o scritti su WhatsApp
      var tel = form.querySelector("[name=telefono]");
      if (tel) tel.required = d.preferenza === "WhatsApp" || d.preferenza === "Telefonata";
      if (!form.checkValidity()) { esito.textContent = "Compila i campi con l'asterisco (il telefono serve se vuoi WhatsApp o una telefonata) e accetta l'informativa."; esito.classList.add("errore"); form.reportValidity(); return; }
      // età e preferenza viaggiano in testa al messaggio: il pannello le mostra così
      var testa = ["Età: " + (d.eta || "?"), "Ricontatto: " + (d.preferenza || "?")].join(" · ");
      d.messaggio = testa + (d.messaggio ? "\n" + d.messaggio : "");
      var bottone = form.querySelector("button");
      bottone.disabled = true; bottone.textContent = "Invio…";
      fetch("/api/iscrizione", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evento: form.getAttribute("data-modulo"), nome: d.nome, cognome: d.cognome, email: d.email, telefono: d.telefono,
          ruolo: d.ruolo, messaggio: d.messaggio, privacy: !!d.privacy, aggiornamenti: false,
          origine: f.categoria, origine_dettaglio: (f.dettaglio ? f.dettaglio + " " : "") + "→ " + location.pathname,
          sito_web: d.sito_web, secondi: Math.round((Date.now() - aperto) / 1000),
        }),
      }).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.ok) throw 0; }); })
        .then(function () {
          azione("form.inviato");
          form.innerHTML = '<p class="esito ok">Grazie! Ti scrivo entro 24 ore per fissare il colloquio.</p>';
        })
        .catch(function () {
          bottone.disabled = false; bottone.textContent = "Prenota il colloquio gratuito di 20 minuti";
          esito.textContent = "Non sono riuscito a inviare la richiesta. Riprova, oppure scrivimi su WhatsApp."; esito.classList.add("errore");
          azione("form.errore");
          invia("/api/evento", { eventi: ["form.errore.altro"] });
        });
    });
  });
})();
