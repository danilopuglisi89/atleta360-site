import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { scrollToTop, scrollToSection } from "./smoothScroll";

const LINKS = [
  { href: "#demo", label: "La demo" },
  { href: "#come-funziona", label: "Come funziona" },
  { href: "#chi-sono", label: "Chi sono" },
  { href: "#faq", label: "Domande" },
];

/* Barra che compare dopo la hero: logo + CTA sempre a portata di mano.
   Prima di allora resta nascosta per non coprire l'apertura cinematografica. */
export default function SiteHeader({ onChoose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    /* Una volta passata l'apertura la barra resta: è sottile e serve a tenere
       il "Prova la demo" sempre a portata. Nasconderla scorrendo in giù la
       toglierebbe proprio a chi sta leggendo le sezioni. */
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`a360-header${visible ? " is-visible" : ""}`} aria-hidden={!visible}>
      <a
        href="/"
        className="a360-header-logo"
        aria-label="Torna in cima"
        onClick={(e) => { e.preventDefault(); scrollToTop(); }}
      >
        <img src="/logo-esteso-bianco.png" alt="Atleta360" height="30" />
      </a>
      <nav className="a360-header-nav">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={(e) => { e.preventDefault(); scrollToSection(l.href); }}>
            {l.label}
          </a>
        ))}
      </nav>
      <button className="a360-btn a360-btn-primary a360-header-cta" onClick={() => onChoose("societa")}>
        Prova la demo <ArrowRight size={15} />
      </button>
    </header>
  );
}
