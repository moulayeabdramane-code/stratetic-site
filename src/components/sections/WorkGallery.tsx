"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PlayIcon, CloseIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/Reveal";
import { titreProjets } from "@/lib/nombres";
import type { RealisationView } from "@/lib/realisations";

const ACTION_LABEL: Record<RealisationView["type"], string> = {
  video: "▶ Regarder le film",
  website: "Visiter le site →",
  pdf: "Feuilleter le document →",
};

function CardShell({
  project,
  onPlay,
}: {
  project: RealisationView;
  onPlay: (youtubeId: string) => void;
}) {
  // Texte superposé DANS la carte : la hauteur totale = la hauteur d'image,
  // rien ne peut déborder. Vidéo → lightbox YouTube ; site → lien externe ;
  // PDF → livret feuilletable sur /realisations.
  const content = (
    <>
      <Image
        src={project.coverUrl}
        alt={project.coverAlt}
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
          {project.title}
        </h3>
        <p className="text-white/70 text-sm mt-1.5 line-clamp-2">
          {project.description}
        </p>
        <span className="inline-block text-brand-olive text-xs font-semibold uppercase tracking-wide mt-2 group-hover:underline">
          {ACTION_LABEL[project.type]}
        </span>
      </div>
    </>
  );

  const shellClass =
    "group relative block w-full aspect-video rounded-2xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer";

  if (project.type === "video" && project.youtubeId) {
    const youtubeId = project.youtubeId;
    return (
      <button
        type="button"
        onClick={() => onPlay(youtubeId)}
        aria-label={`Regarder le film : ${project.title}`}
        className={shellClass}
      >
        {content}
      </button>
    );
  }
  if (project.type === "website" && project.externalUrl) {
    return (
      <a
        href={project.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visiter le site : ${project.title}`}
        className={shellClass}
      >
        {content}
      </a>
    );
  }
  return (
    <a
      href={`/realisations#${project.slug}`}
      aria-label={`Voir le projet : ${project.title}`}
      className={shellClass}
    >
      {content}
    </a>
  );
}

export function WorkGallery({ projects }: { projects: RealisationView[] }) {
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

  // Aucun projet publié pour l'accueil : la section disparaît.
  if (projects.length === 0) return null;

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
                {titreProjets(projects.length)}
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
          {projects.map((project, i) => (
            <Reveal key={project.slug} delay={(i % 4) * 70}>
              <CardShell project={project} onPlay={setLightbox} />
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
