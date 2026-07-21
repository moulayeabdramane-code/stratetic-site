import { serviceIconMap } from "@/components/icons";
import { Reveal } from "@/components/motion/Reveal";
import type { ServiceCard } from "@/types/content";

const services: ServiceCard[] = [
  {
    icon: "commercial",
    title: "PRODUCTION AUDIOVISUELLE",
    description:
      "Documentaires, spots publicitaires, films institutionnels. De l'écriture à la diffusion, avec nos équipes terrain au Niger.",
  },
  {
    icon: "corporate",
    title: "STRATÉGIE DE COMMUNICATION",
    description:
      "Plans de communication, positionnement, messages clés. On cadre avant de produire.",
  },
  {
    icon: "social",
    title: "RÉSEAUX SOCIAUX & DIGITAL",
    description:
      "Gestion éditoriale, création de contenus courts, community management. Une présence constante et cohérente.",
  },
  {
    icon: "brandFilm",
    title: "DESIGN GRAPHIQUE & IDENTITÉ",
    description:
      "Logos, chartes, rapports annuels, infographies. Des supports pensés pour être utilisés, pas admirés.",
  },
  {
    icon: "animation",
    title: "SITES WEB",
    description:
      "Sites vitrines, plateformes de contenu. Rapides, lisibles, optimisés même sur 3G à Tillabéry.",
  },
  {
    icon: "education",
    title: "IMPRESSION & SUPPORTS PHYSIQUES",
    description:
      "Affiches, kakémonos, brochures, goodies. Parce qu'un atelier à Maradi se vit aussi avec du papier et du tissu.",
  },
];

export function WhatWeDo() {
  return (
    <section id="services" className="bg-brand-offwhite py-24 px-6 md:px-10">
      {/* Header row */}
      <Reveal>
        <div className="flex flex-col items-start gap-6 border-b border-border pb-6 mb-12 md:flex-row md:items-end md:justify-between md:flex-wrap">
          <div className="flex items-end gap-4">
            <span className="uppercase text-sm tracking-widest">
              Six pôles, une seule équipe
            </span>
          </div>
          <a
            href="#expertise"
            className="bg-gradient-accent text-white rounded-full px-6 py-3 font-heading uppercase text-sm"
          >
            Notre expertise
          </a>
        </div>
      </Reveal>

      {/* Services grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {services.map((service, i) => {
          const Icon = serviceIconMap[service.icon];
          return (
            <Reveal key={service.title} delay={i * 80}>
              <div className="rounded-2xl border border-border bg-white p-8 flex flex-col gap-6 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                <Icon className="w-10 h-10 text-brand-navy" />
                <h3 className="font-heading uppercase text-xl leading-tight">
                  {service.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {service.description}
                </p>
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* Tagline banner */}
      <Reveal delay={services.length * 80 + 120}>
        <div className="mt-16 text-center">
          <p className="font-heading uppercase text-2xl md:text-3xl text-brand-navy">
            Produire ce qui compte, depuis 2013
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
            Agence de production audiovisuelle, design et communication basée à
            Niamey. On couvre toute la chaîne — du brief à la diffusion — pour
            le Niger, le Sahel et ceux qui s&apos;y intéressent. Plus de 100
            projets livrés, 13 ans d&apos;expérience, réponse garantie sous 48h
            ouvrées.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

export default WhatWeDo;
