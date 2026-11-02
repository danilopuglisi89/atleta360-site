/* Movimento delle pagine di contenuto: barra di lettura, sfondo dell'apertura
   in parallasse, nastro di parole, linea dei passi che segue lo scorrimento,
   blocchi che entrano, barre che si riempiono, numeri che contano, tabellone
   con gli 8 secondi della battuta. Senza JavaScript (o con "riduci movimento")
   si vede tutto subito e fermo: la classe "pronto" la mette solo questo script. */
(function () {
  var fermo = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var barra = document.querySelector(".avanzamento span");
  var sfondo = document.querySelector(".eroe-sfondo");
  var nastro = document.querySelector(".nastro");
  var righe = document.querySelectorAll(".nastro-riga");
  var passi = document.querySelectorAll(".blocco-passi li");
  var tabellone = document.querySelector(".punteggio");

  function alScorrere() {
    var y = scrollY, h = innerHeight;
    if (barra) {
      var max = document.documentElement.scrollHeight - h;
      barra.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
    }
    if (fermo) return;
    if (sfondo && y < h * 1.5) sfondo.style.transform = "translateY(" + (y * 0.4) + "px)";
    // la linea si accende fino a poco sopra il centro dello schermo
    var linea = h * 0.62;
    passi.forEach(function (li) {
      var b = li.getBoundingClientRect();
      var k = Math.max(0, Math.min(1, (linea - b.top - 40) / Math.max(1, b.height - 40)));
      li.style.setProperty("--riempi", (k * 100).toFixed(1) + "%");
      li.classList.toggle("acceso", b.top < linea);
    });
  }
  var inCoda = false;
  addEventListener("scroll", function () {
    if (inCoda) return;
    inCoda = true;
    requestAnimationFrame(function () { inCoda = false; alScorrere(); });
  }, { passive: true });
  addEventListener("resize", alScorrere);
  alScorrere();

  if (fermo || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".grafico, .barre").forEach(function (g) { g.classList.add("visto"); });
    return;
  }

  // blocchi che entrano: le schede di un gruppo arrivano una dopo l'altra
  var gruppi = [
    ".fascia .dentro > h2", ".faq > h2", ".fascia .dentro > p", ".fiducia", ".cta-breve", ".nota",
    ".blocco-per-chi li", ".blocco-abilita li", ".prezzo", ".faq details", ".grafico", ".barre",
    ".cifra", ".punteggio", ".correlate li", ".elenco-guide li", ".contenuto article > h2",
  ];
  var oss = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) {
      if (!v.isIntersecting) return;
      v.target.classList.add("visto");
      oss.unobserve(v.target);
      v.target.querySelectorAll(".conta, .grafico-num").forEach(conta);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  document.querySelectorAll(gruppi.join(",")).forEach(function (el) {
    var posto = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
    el.style.setProperty("--ritardo", (Math.min(posto, 5) * 90) + "ms");
    el.classList.add("pronto");
    oss.observe(el);
  });

  // numeri che contano da zero (prefisso e unità restano fermi)
  function conta(n) {
    var fine = Number(n.getAttribute("data-a")) || 0, t0 = null;
    var prima = n.getAttribute("data-prima") || "", dopo = n.getAttribute("data-dopo") || "";
    function passo(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / 1500);
      n.textContent = prima + Math.round(fine * (1 - Math.pow(1 - k, 3))) + dopo;
      if (k < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  // nastro e tabellone girano solo quando si vedono
  var vivi = { nastro: false, tabellone: false }, inMoto = false, prima = 0, strada = 0, ultimoY = scrollY;
  function giro(t) {
    if (!vivi.nastro && !vivi.tabellone) { inMoto = false; return; }
    var dt = prima ? Math.min(64, t - prima) : 16;
    prima = t;
    if (vivi.nastro) {
      // va da solo e accelera quando si scorre la pagina
      strada += dt * 0.05 + Math.abs(scrollY - ultimoY) * 0.6;
      ultimoY = scrollY;
      righe.forEach(function (r, i) {
        var unita = r.scrollWidth / 3, s = strada % unita;
        r.style.transform = "translateX(" + (i % 2 ? s - unita : -s) + "px)";
      });
    }
    if (vivi.tabellone) {
      var k = (t % 8000) / 8000;
      tabellone.querySelector(".punteggio-timer span").style.transform = "scaleX(" + (1 - k) + ")";
      tabellone.querySelector(".punteggio-sec").textContent = 8 - Math.floor(k * 8);
    }
    requestAnimationFrame(giro);
  }
  function guarda(el, chiave) {
    if (!el) return;
    new IntersectionObserver(function (v) {
      vivi[chiave] = v[0].isIntersecting;
      if (vivi[chiave] && !inMoto) { inMoto = true; prima = 0; requestAnimationFrame(giro); }
    }).observe(el);
  }
  guarda(nastro, "nastro");
  guarda(tabellone, "tabellone");
})();
