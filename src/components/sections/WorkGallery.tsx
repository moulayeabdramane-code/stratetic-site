"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PlayIcon, CloseIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/Reveal";
import type { CaseStudy } from "@/types/content";

// Site ARISE / Keneya Yiriwali réalisé par STRATETIC.
const ARISE_URL = "https://arisekeneya.org/";

type GalleryCaseStudy = CaseStudy & {
  image: string;
  slug: string;
  /** ID YouTube du film — absent pour ARISE (projet site web). */
  ytId?: string;
  /** Lien externe (site livré) pour les projets sans vidéo. */
  external?: string;
};

const caseStudies: GalleryCaseStudy[] = [
  {
    title: "CDS NIGER — FORUM FIER/JNER 2026",
    slug: "cds-niger",
    ytId: "7KosqdnyWXk",
    description:
      "Campagne complète pour le forum sur les énergies renouvelables. Spot audiovisuel, 7 supports print et déclinaisons réseaux sociaux.",
    placeholderLabel: "Énergie · Privé — Campagne complète CDS Niger",
    image: "/images/niger/work-cds.webp",
  },
  {
    title: "ARISE / KENEYA YIRIWALI (MALI)",
    slug: "arise-mali",
    external: ARISE_URL,
    description:
      "Site de présentation du programme de santé — conception UX/UI et développement sur mesure pour une double audience bailleurs et terrain.",
    placeholderLabel: "ONG · Santé publique — Site web ARISE Keneya Yiriwali",
    image: "/images/site/Siteweb_Arise.jpg",
  },
  {
    title: "NIGER EMPLOI — SPOT PUBLICITAIRE",
    slug: "niger-emploi",
    ytId: "1UfF72OEsmM",
    description:
      "Spot dynamique multi-formats pour la principale plateforme d'offres d'emploi du Niger.",
    placeholderLabel: "Digital · Emploi — Spot Niger Emploi",
    image: "/images/niger/work-nigeremploi.webp",
  },
  {
    title: "ANSI — TABLE RONDE DES BAILLEURS, PARIS",
    slug: "ansi",
    ytId: "NjAKRQmZIbQ",
    description:
      "Spot institutionnel haute exigence, projeté lors de la table ronde internationale pour la transformation numérique du Niger.",
    placeholderLabel: "Institution publique — Film institutionnel ANSI",
    image: "/images/niger/work-ansi.webp",
  },
  {
    title: "CIPMEN — FILM ENTREPRENEURIAT",
    slug: "cipmen",
    ytId: "7e2KbO8m21Q",
    description:
      "Film documentaire sur les parcours d'entrepreneurs accompagnés par le centre d'incubation nigérien.",
    placeholderLabel: "Entrepreneuriat · Niger — Film documentaire CIPMEN",
    image: "/images/niger/work-cipmen.webp",
  },
  {
    title: "COMPLAIT — SPOT PUBLICITAIRE",
    slug: "complait",
    ytId: "_AplCctINfE",
    description:
      "Spot court et percutant conçu et produit de A à Z — concept, tournage, montage et motion design.",
    placeholderLabel: "Communication · Spot — COMPLAIT",
    image: "/images/niger/work-complait.webp",
  },
  {
    title: "2SCALE / SNV — SUCCESS STORY",
    slug: "2scale-snv",
    ytId: "QhqzRDhcfck",
    description:
      "Film de success story pour le programme d'agribusiness inclusif SNV, aux standards de reporting bailleurs internationaux.",
    placeholderLabel: "Agribusiness · ONG — Success story 2Scale SNV",
    image: "/images/site/ONG.jpg",
  },
  {
    title: "AET — PROJET PISCCA, NIAMEY",
    slug: "aet",
    ytId: "KPwU07osF80",
    description:
      "Retour vidéo sur le plaidoyer mené auprès de 50 filles-mères et mères célibataires — débats télévisés, radios communautaires en haoussa, société civile et autorités locales.",
    placeholderLabel: "Social · Genre · Niger — Film plaidoyer AET PISCCA",
    image: "/images/site/diffa-tournage.jpg",
  },
];

function CardShell({
  cs,
  onPlay,
}: {
  cs: GalleryCaseStudy;
  onPlay: (ytId: string) => void;
}) {
  // Texte superposé DANS la carte : la hauteur totale = la hauteur d'image,
  // rien ne peut déborder. Vidéo → lightbox YouTube ; ARISE → lien du site.
  const content = (
    <>
      <Image
        src={cs.image}
        alt={cs.placeholderLabel}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(min-width: 1280px) 24vw, (min-width: 768px) 46vw, 92vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="absolute top-4 left-4 flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm group-hover:bg-brand-olive transition-colors">
        <PlayIcon className="h-4 w-4 text-white" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5 text-left">
        <h3 className="font-heading uppercase text-base md:text-lg text-white line-clamp-2">
          {cs.title}
        </h3>
        <p className="text-white/70 text-sm mt-1.5 line-clamp-2">
          {cs.description}
        </p>
        <span className="inline-block text-brand-olive text-xs font-semibold uppercase tracking-wide mt-2 group-hover:underline">
          {cs.ytId ? "▶ Regarder le film" : "Visiter le site →"}
        </span>
      </div>
    </>
  );

  const shellClass =
    "group relative block w-full aspect-video rounded-2xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer";

  if (cs.ytId) {
    return (
      <button
        type="button"
        onClick={() => onPlay(cs.ytId as string)}
        aria-label={`Regarder le film : ${cs.title}`}
        className={shellClass}
      >
        {content}
      </button>
    );
  }
  return (
    <a
      href={cs.external}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visiter le site : ${cs.title}`}
      className={shellClass}
    >
      {content}
    </a>
  );
}

export function WorkGallery() {
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox]);

  return (
    <section id="realisations" className="bg-brand-navy text-white py-20 px-6 md:px-10">
      <div className="max-w-[1600px] mx-auto">
        <Reveal>
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="uppercase tracking-widest text-sm text-white/70">
                Nos réalisations
              </p>
              <h2 className="font-heading uppercase text-3xl md:text-4xl leading-tight mt-3">
                Huit projets, huit univers
              </h2>
            </div>
            <a
              href="/realisations"
              className="bg-gradient-accent text-white rounded-full px-6 py-3 font-heading uppercase text-sm shrink-0"
            >
              Tous les projets
            </a>
          </div>
          <div className="border-b border-white/20 mt-6" />
        </Reveal>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mt-10">
          {caseStudies.map((cs, i) => (
            <Reveal key={cs.title} delay={(i % 4) * 70}>
              <CardShell cs={cs} onPlay={setLightbox} />
            </Reveal>
          ))}
        </div>
      </div>

      {/* Lightbox YouTube */}
      {lightbox && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            aria-label="Fermer la vidéo"
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
          >
            <CloseIcon className="size-5" />
          </button>
          <div
            className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              title="Film STRATETIC"
              src={`https://www.youtube-nocookie.com/embed/${lightbox}?autoplay=1&rel=0`}
              className="w-full h-full"
              style={{ border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default WorkGallery;
