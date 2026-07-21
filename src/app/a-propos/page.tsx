import type { Metadata } from "next";
import Image from "next/image";
import { HeaderNav } from "@/components/sections/HeaderNav";
import { PageHero } from "@/components/sections/PageHero";
import { CtaFooter } from "@/components/sections/CtaFooter";
import { ClientsWhoWeHelp } from "@/components/sections/ClientsWhoWeHelp";
import { StatsBand } from "@/components/sections/StatsBand";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "À propos — STRATETIC",
  description:
    "STRATETIC est née en 2013 à Niamey. Une équipe réduite, polyvalente, qui garde la main du début à la fin — pour le Niger, le Sahel et ceux qui s'y intéressent.",
};

const pillars = [
  {
    title: "On connaît le terrain avant de le filmer",
    description:
      "Nos équipes nigériennes parlent les langues locales, connaissent les codes, savent négocier une autorisation à Diffa ou Tahoua.",
  },
  {
    title: "On couvre toute la chaîne",
    description:
      "De l'idée à la diffusion. Un seul interlocuteur, pas quatre prestataires qui ne se coordonnent pas.",
  },
  {
    title: "On intègre les outils de notre époque",
    description:
      "L'IA générative (Kling, Suno, Higgsfield) utilisée sur des livrables payants réels — pas en démo.",
  },
];

const nameValues = [
  {
    letters: "STRAT",
    word: "Stratégie",
    description:
      "Chaque projet démarre par une réflexion stratégique. Nous ne produisons pas du contenu au kilomètre — nous construisons des messages calibrés qui servent vos objectifs, vos bailleurs et vos publics cibles.",
  },
  {
    letters: "ÉTIC",
    word: "Éthique",
    description:
      "Transparence envers nos clients, respect des communautés filmées, juste rémunération des équipes locales. L'éthique n'est pas une posture — c'est la méthode qui guide chaque décision de production.",
  },
  {
    letters: "TIC",
    word: "Technologies de l'Information et de la Communication",
    description:
      "Nous intégrons les outils numériques d'aujourd'hui — IA générative, plateformes web, réseaux sociaux — au service de communications plus efficaces, plus accessibles et mieux adaptées aux réalités du Sahel.",
  },
];

export default function AProposPage() {
  return (
    <>
      <HeaderNav />
      <main className="flex-1">
        <PageHero
          eyebrow="Qui on est"
          title="Une agence, un territoire, une exigence."
          intro="STRATETIC est née en 2013 d'un constat simple : au Niger, beaucoup de belles histoires ne sont jamais racontées correctement. Soit parce que les moyens manquent. Soit parce que ceux qui filment ne connaissent pas le terrain."
        />

        <section className="bg-brand-offwhite py-24 px-6 md:px-10">
          <div className="max-w-[1600px] mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <h2 className="font-heading uppercase text-3xl md:text-4xl leading-tight">
                On a monté une agence qui fait le contraire.
              </h2>
              <p className="text-muted-foreground text-lg mt-6 max-w-xl">
                Une équipe réduite, polyvalente, qui garde la main du début à
                la fin. Depuis Niamey, pour le Niger, le Sahel et ceux qui
                s&apos;y intéressent.
              </p>
              <div className="flex flex-col gap-8 mt-10">
                {pillars.map((pillar) => (
                  <div key={pillar.title} className="border-l-2 border-brand-olive pl-6">
                    <h3 className="font-heading uppercase text-xl">
                      {pillar.title}
                    </h3>
                    <p className="text-muted-foreground mt-2">
                      {pillar.description}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={150} y={36}>
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-border">
                <Image
                  src="/images/apropos-team.webp"
                  alt="Montage et étalonnage STRATETIC en post-production"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 45vw, 90vw"
                />
              </div>
            </Reveal>
          </div>
        </section>

        <section className="bg-white py-24 px-6 md:px-10 border-y border-border">
          <div className="max-w-[1600px] mx-auto">
            <Reveal>
              <p className="uppercase tracking-widest text-sm text-muted-foreground">
                Notre nom
              </p>
              <h2 className="font-heading uppercase text-3xl md:text-4xl mt-4">
                Trois valeurs inscrites dans notre ADN
              </h2>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              {nameValues.map((value, i) => (
                <Reveal key={value.letters} delay={i * 100}>
                  <div className="rounded-2xl border border-border bg-brand-offwhite p-8 h-full">
                    <p className="font-heading text-4xl text-brand-olive">
                      {value.letters}
                    </p>
                    <h3 className="font-heading uppercase text-lg mt-3">
                      {value.word}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-3">
                      {value.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <StatsBand />

        {/* Le meilleur du nouveau site : la liste clients géante + les
            audiences que nous servons. */}
        <ClientsWhoWeHelp />

        <CtaFooter />
      </main>
    </>
  );
}
