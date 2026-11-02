/* Movimento delle pagine di contenuto: barra di lettura in alto, blocchi che
   entrano scorrendo, barre del grafico che si riempiono, numeri che contano.
   Senza JavaScript (o con "riduci movimento") si vede tutto subito e fermo:
   la classe "pronto" che nasconde i blocchi la mette solo questo script. */
(function () {
  var fermo = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // barra di lettura
  var barra = document.querySelector(".avanzamento span");
  if (barra) {
    var aggiorna = function () {
      var max = document.documentElement.scrollHeight - innerHeight;
      barra.style.transform = "scaleX(" + (max > 0 ? Math.min(1, scrollY / max) : 0) + ")";
    };
    addEventListener("scroll", aggiorna, { passive: true });
    aggiorna();
  }

  if (fermo || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".grafico").forEach(function (g) { g.classList.add("visto"); });
    return;
  }

  // blocchi che entrano: le schede di un gruppo arrivano una dopo l'altra
  var gruppi = [
    ".fascia .dentro > h2", ".fascia .dentro > p", ".fiducia", ".cta-breve", ".nota",
    ".blocco-per-chi li", ".blocco-passi li", ".prezzo", ".faq details", ".grafico",
    ".correlate li", ".elenco-guide li", ".contenuto article > h2", ".eroe-foto",
  ];
  var elementi = document.querySelectorAll(gruppi.join(","));
  var oss = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) {
      if (!v.isIntersecting) return;
      v.target.classList.add("visto");
      oss.unobserve(v.target);
      if (v.target.classList.contains("grafico")) contaNumeri(v.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  elementi.forEach(function (el) {
    var fratelli = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
    el.style.setProperty("--ritardo", (Math.min(fratelli, 5) * 70) + "ms");
    el.classList.add("pronto");
    oss.observe(el);
  });
  // la linea dei passi si disegna quando il blocco entra
  document.querySelectorAll(".blocco-passi").forEach(function (b) {
    new IntersectionObserver(function (v, o) {
      if (v[0].isIntersecting) { b.classList.add("visto"); o.disconnect(); }
    }, { threshold: 0.2 }).observe(b);
  });

  function contaNumeri(g) {
    g.querySelectorAll(".grafico-num").forEach(function (n) {
      var fine = Number(n.getAttribute("data-a")) || 0, t0 = null;
      function passo(t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / 1400);
        n.textContent = Math.round(fine * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(passo);
      }
      requestAnimationFrame(passo);
    });
  }
})();
