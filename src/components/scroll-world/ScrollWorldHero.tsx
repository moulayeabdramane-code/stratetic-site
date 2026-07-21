"use client";

import { useEffect, useRef } from "react";
import { mountScrollWorld, type ScrollWorldConfig } from "./scrub-engine";

const A = "/scroll-world";

const config: ScrollWorldConfig = {
  hint: "faites défiler pour entrer",
  nav: false, // le HeaderNav du site reste la navigation principale
  atmosphere: true,
  diveScroll: 1.3,
  connScroll: 0.9,
  // seedance démarre ses connecteurs légèrement recadrés par rapport à la frame
  // fournie ; un fondu un peu plus large absorbe ce décalage résiduel aux seams.
  crossfade: 0.16,
  sections: [
    {
      id: "brief",
      label: "L'idée",
      still: `${A}/brief.webp`,
      poster: `${A}/brief-poster.webp`,
      posterMobile: `${A}/brief-poster-m.webp`,
      clip: `${A}/vid/brief.mp4`,
      clipMobile: `${A}/vid/brief-m.mp4`,
      accent: "#96b912",
      scroll: 1.6,
      linger: 0.45,
      eyebrow: "Produire ce qui compte",
      title: "L'agence de production que vous cherchiez.",
      body: "Tout commence par un brief — même incomplet : nous transformons votre ambition en un concept qui tient debout.",
      tags: ["Depuis 2013", "Niamey", "Stratégie"],
    },
    {
      id: "plateau",
      label: "Le plateau",
      still: `${A}/plateau.webp`,
      poster: `${A}/plateau-poster.webp`,
      posterMobile: `${A}/plateau-poster-m.webp`,
      clip: `${A}/vid/plateau.mp4`,
      clipMobile: `${A}/vid/plateau-m.mp4`,
      accent: "#96b912",
      eyebrow: "Le tournage",
      title: "Silence, on tourne.",
      body: "Documentaires, spots publicitaires, films institutionnels : nos équipes terrain connaissent le Niger avant de le filmer.",
      tags: ["Documentaires", "Spots", "Films institutionnels"],
    },
    {
      id: "postprod",
      label: "La post-prod",
      still: `${A}/postprod.webp`,
      poster: `${A}/postprod-poster.webp`,
      posterMobile: `${A}/postprod-poster-m.webp`,
      clip: `${A}/vid/postprod.mp4`,
      clipMobile: `${A}/vid/postprod-m.mp4`,
      accent: "#96b912",
      eyebrow: "La post-production",
      title: "Le soin du détail.",
      body: "Montage, étalonnage, mixage : c'est ici que les images deviennent une émotion.",
      tags: ["Montage", "Étalonnage", "Mixage"],
    },
    {
      id: "animation",
      label: "L'animation",
      still: `${A}/animation.webp`,
      poster: `${A}/animation-poster.webp`,
      posterMobile: `${A}/animation-poster-m.webp`,
      clip: `${A}/vid/animation.mp4`,
      clipMobile: `${A}/vid/animation-m.mp4`,
      accent: "#96b912",
      eyebrow: "Design & digital",
      title: "Donner vie aux idées.",
      body: "Design graphique, motion design, sites web rapides et lisibles — même sur 3G à Tillabéry.",
      tags: ["Design", "Motion", "Sites web"],
    },
    {
      id: "diffusion",
      label: "La diffusion",
      still: `${A}/diffusion.webp`,
      poster: `${A}/diffusion-poster.webp`,
      posterMobile: `${A}/diffusion-poster-m.webp`,
      clip: `${A}/vid/diffusion.mp4`,
      clipMobile: `${A}/vid/diffusion-m.mp4`,
      accent: "#96b912",
      eyebrow: "La diffusion",
      title: "Du contenu qui circule.",
      body: "De la télévision aux réseaux sociaux jusqu'à nigerinfos.com, votre message capte l'attention là où elle se trouve.",
      tags: ["TV", "Réseaux sociaux", "NigerInfos"],
    },
    {
      id: "finale",
      label: "Parlons-en",
      still: `${A}/finale.webp`,
      poster: `${A}/finale-poster.webp`,
      posterMobile: `${A}/finale-poster-m.webp`,
      clip: `${A}/vid/finale.mp4`,
      clipMobile: `${A}/vid/finale-m.mp4`,
      accent: "#96b912",
      scroll: 1.8,
      linger: 0.5,
      eyebrow: "Votre histoire, maintenant",
      title: "Racontons votre histoire.",
      body: "ONG, institutions et entreprises nous confient leurs histoires depuis 2013. La suite, c'est vous.",
      cta: {
        primary: { label: "Parlons-en", href: "#contact" },
        secondary: { label: "Voir nos réalisations", href: "#realisations" },
      },
    },
  ],
  connectors: [
    `${A}/vid/conn1.mp4`,
    `${A}/vid/conn2.mp4`,
    `${A}/vid/conn3.mp4`,
    `${A}/vid/conn4.mp4`,
    `${A}/vid/conn5.mp4`,
  ],
  connectorsMobile: [
    `${A}/vid/conn1-m.mp4`,
    `${A}/vid/conn2-m.mp4`,
    `${A}/vid/conn3-m.mp4`,
    `${A}/vid/conn4-m.mp4`,
    `${A}/vid/conn5-m.mp4`,
  ],
};

export function ScrollWorldHero() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Le moteur ne se monte qu'une fois (il construit son DOM dans le
    // conteneur) ; le listener, lui, doit être ré-attaché à chaque cycle
    // d'effet (StrictMode / Fast Refresh le nettoient).
    if (!el.dataset.swMounted) {
      el.dataset.swMounted = "1";
      mountScrollWorld(el, config);
    }

    // Le moteur suppose une page dédiée : ses couches fixes restent visibles
    // après la fin du vol. On les relâche quand le scroll dépasse le monde,
    // pour rendre la main aux sections classiques du site en dessous.
    const onScroll = () => {
      const track = el.querySelector<HTMLElement>(".sw-track");
      if (!track) return;
      const worldEnd = track.offsetHeight - window.innerHeight * 0.6;
      el.classList.toggle("sw-passed", window.scrollY > worldEnd);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div id="hero" ref={ref} className="sw-container">
      {/* Copie statique crawlable : le moteur rend tout côté client,
          ce bloc est la seule version lisible par les crawlers / sans JS. */}
      <section data-sw-seo>
        <h1>STRATETIC — Produire ce qui compte.</h1>
        <p>
          Agence de production audiovisuelle, design et communication basée à
          Niamey. Depuis 2013, nous couvrons toute la chaîne — du brief à la
          diffusion — pour le Niger, le Sahel et ceux qui s&apos;y intéressent.
        </p>
        <h2>Le tournage — Silence, on tourne.</h2>
        <p>
          Documentaires, spots publicitaires, films institutionnels : nos
          équipes terrain connaissent le Niger avant de le filmer.
        </p>
        <h2>La post-production — Le soin du détail.</h2>
        <p>Montage, étalonnage, mixage : les images deviennent une émotion.</p>
        <h2>Design &amp; digital — Donner vie aux idées.</h2>
        <p>
          Design graphique, motion design, sites web rapides et lisibles —
          même sur 3G à Tillabéry.
        </p>
        <h2>La diffusion — Du contenu qui circule.</h2>
        <p>
          De la télévision aux réseaux sociaux jusqu&apos;à nigerinfos.com,
          votre message capte l&apos;attention là où elle se trouve.
        </p>
        <h2>Racontons votre histoire.</h2>
        <p>
          ONG, institutions et entreprises nous confient leurs histoires
          depuis 2013. La suite, c&apos;est vous.
        </p>
        <p>
          <a href="#contact">Parlons-en</a> ·{" "}
          <a href="#realisations">Voir nos réalisations</a>
        </p>
      </section>
    </div>
  );
}

export default ScrollWorldHero;
