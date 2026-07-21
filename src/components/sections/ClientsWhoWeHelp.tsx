"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { PlayIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/Reveal";
import type { ClientName, AudienceCard } from "@/types/content";

const clientNames: ClientName[] = [
  { name: "OIM" },
  { name: "ENABEL" },
  { name: "OXFAM" },
  { name: "MERCY CORPS" },
  { name: "ACF" },
  { name: "SNV" },
  { name: "OIF" },
  { name: "EDUCO" },
  { name: "PISCCA" },
  { name: "CDS NIGER" },
  { name: "NIGER EMPLOI" },
  { name: "ANSI" },
  { name: "CIPMEN" },
  { name: "BSIC" },
];

const audiences: AudienceCard[] = [
  {
    title: "ONG INTERNATIONALES",
    description:
      "Films documentaires, success stories et rapports aux standards des bailleurs internationaux — avec des équipes terrain qui connaissent les communautés filmées.",
    placeholderLabel: "[Photo]",
  },
  {
    title: "INSTITUTIONS PUBLIQUES",
    description:
      "Spots institutionnels haute exigence, campagnes nationales et films diffusés jusque dans les tables rondes internationales.",
    placeholderLabel: "[Photo]",
  },
  {
    title: "ENTREPRISES PRIVÉES",
    description:
      "Campagnes de lancement, spots publicitaires et identités visuelles qui font tripler les chiffres d'engagement dès la première semaine.",
    placeholderLabel: "[Photo]",
  },
  {
    title: "PROJETS DE DÉVELOPPEMENT",
    description:
      "De la santé publique à l'agribusiness, nous mettons en images les réalités du terrain pour une double audience : bailleurs et bénéficiaires.",
    placeholderLabel: "[Photo]",
  },
  {
    title: "BANQUES & MICROFINANCE",
    description:
      "Supports print, identité visuelle et vidéos de formation en un seul contrat cohérent, sans perdre en qualité sur aucun média.",
    placeholderLabel: "[Photo]",
  },
  {
    title: "INCUBATEURS & STARTUPS",
    description:
      "Films entrepreneuriat et contenus qui racontent les parcours de ceux qui construisent l'économie nigérienne de demain.",
    placeholderLabel: "[Photo]",
  },
];

const audienceImages: Record<string, string> = {
  "ONG INTERNATIONALES": "/images/niger/aud-ong.webp",
  "INSTITUTIONS PUBLIQUES": "/images/niger/aud-institutions.webp",
  "ENTREPRISES PRIVÉES": "/images/niger/aud-entreprises.webp",
  "PROJETS DE DÉVELOPPEMENT": "/images/niger/aud-developpement.webp",
  "BANQUES & MICROFINANCE": "/images/niger/aud-banques.webp",
  "INCUBATEURS & STARTUPS": "/images/niger/aud-startups.webp",
};

function AudienceRow({ title, description }: AudienceCard) {
  const image = audienceImages[title];
  return (
    <div className="flex gap-4 items-start">
      <div className="relative overflow-hidden w-16 h-16 rounded-xl bg-brand-navy/5 border border-border shrink-0">
        {image && (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover rounded-xl"
            sizes="64px"
          />
        )}
      </div>
      <div>
        <h3 className="font-heading uppercase text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

function RetroTvPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeLabel, setTimeLabel] = useState("00:55");

  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
    } else {
      v.pause();
    }
  };

  return (
    <div className="relative rounded-3xl bg-brand-navy p-6 pr-14">
      {/* Antennas */}
      <div className="absolute -top-4 left-10 h-10 w-1 bg-brand-navy rotate-[-25deg] origin-bottom rounded-full" />
      <div className="absolute -top-4 right-16 h-10 w-1 bg-brand-navy rotate-[25deg] origin-bottom rounded-full" />

      {/* Knobs */}
      <div className="absolute right-4 top-8 h-4 w-4 rounded-full bg-brand-olive" />
      <div className="absolute right-4 top-16 h-4 w-4 rounded-full bg-white/20" />
      <div className="absolute right-4 top-24 h-4 w-4 rounded-full bg-white/20" />

      {/* Screen — le spot Stratetic */}
      <div className="relative aspect-video rounded-lg bg-black overflow-hidden">
        <video
          ref={videoRef}
          src="/videos/spot-stratetic.mp4"
          poster="/videos/spot-stratetic-poster.webp"
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
          onClick={toggle}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setProgress(0);
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (!v.duration) return;
            setProgress((v.currentTime / v.duration) * 100);
            setTimeLabel(format(v.duration - v.currentTime));
          }}
        />

        {!playing && (
          <button
            type="button"
            aria-label="Lire le spot Stratetic"
            onClick={toggle}
            className="absolute inset-0 m-auto flex items-center justify-center h-16 w-16 rounded-full bg-brand-olive text-brand-navy transition-transform hover:scale-110"
          >
            <PlayIcon className="h-6 w-6 ml-1" />
          </button>
        )}

        {/* Scrubber */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 pointer-events-none">
          <div className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-olive"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-white/70 tabular-nums">
            {timeLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ClientsWhoWeHelp() {
  return (
    <section>
      {/* Block A — Clients list */}
      <div className="py-24 px-6 md:px-10 border-b border-border">
        <p className="uppercase tracking-widest text-sm text-muted-foreground mb-8">
          Nos partenaires
        </p>
        <div>
          {clientNames.map((client, i) => (
            <Reveal key={client.name} delay={i * 60}>
              <div className="border-b border-border py-4 group">
                <span className="inline-block text-[clamp(2rem,8vw,7rem)] font-heading uppercase leading-none text-brand-navy transition-all duration-300 group-hover:text-brand-olive group-hover:translate-x-2 cursor-default">
                  {client.name}
                </span>
                <span className="block h-0.5 w-0 bg-brand-olive transition-all duration-300 group-hover:w-full mt-1" />
              </div>
            </Reveal>
          ))}
        </div>
        <p className="max-w-2xl mt-8 text-muted-foreground">
          ONG internationales, institutions, entreprises : plus de 100 projets
          livrés au Niger, au Sahel et au-delà — avec une satisfaction client
          de 4,9 / 5.
        </p>
      </div>

      {/* Block B — Who We Help + Retro TV player */}
      <div className="py-24 px-6 md:px-10 grid lg:grid-cols-[1fr_420px] gap-16 items-start border-b border-border">
        <div>
          <Reveal>
            <div className="flex items-start justify-between gap-4">
              <p className="uppercase tracking-widest text-sm text-muted-foreground text-center flex-1">
                Qui nous aidons
              </p>
              <span className="bg-gradient-accent text-white text-xs uppercase tracking-widest px-4 py-2 rounded-full">
                En savoir plus
              </span>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8 mt-10">
            {audiences.map((audience, i) => (
              <Reveal key={audience.title} delay={i * 80}>
                <AudienceRow {...audience} />
              </Reveal>
            ))}
          </div>
        </div>

        <div className="max-w-[480px] w-full mx-auto lg:mx-0">
          <Reveal y={16} delay={160}>
            <RetroTvPlayer />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default ClientsWhoWeHelp;
