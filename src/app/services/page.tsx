import type { Metadata } from "next";
import { HeaderNav } from "@/components/sections/HeaderNav";
import { PageHero } from "@/components/sections/PageHero";
import { CtaFooter } from "@/components/sections/CtaFooter";
import { StatsBand } from "@/components/sections/StatsBand";
import { Reveal } from "@/components/motion/Reveal";
import { serviceIconMap } from "@/components/icons";
import type { ServiceCard } from "@/types/content";

export const metadata: Metadata = {
  title: "Services — STRATETIC",
  description:
    "Six pôles, une seule équipe : production audiovisuelle, stratégie de communication, réseaux sociaux, design graphique, sites web, impression. Du brief à la diffusion.",
};

interface ServiceDetail extends ServiceCard {
  id: string;
  number: string;
  details: string[];
}

const services: ServiceDetail[] = [
  {
    id: "production-audiovisuelle",
    number: "01",
    icon: "commercial",
    title: "Production audiovisuelle",
    description:
      "Documentaires, spots publicitaires, films institutionnels. De l'écriture à la diffusion, avec nos équipes terrain au Niger.",
    details: [
      "Documentaires et success stories aux standards des bailleurs internationaux",
      "Spots publicitaires multi-formats pour la TV et le digital",
      "Films institutionnels haute exigence, diffusés jusque dans les tables rondes internationales",
      "Équipes nigériennes qui parlent les langues locales et connaissent le terrain",
    ],
  },
  {
    id: "strategie",
    number: "02",
    icon: "corporate",
    title: "Stratégie de communication",
    description:
      "Plans de communication, positionnement, messages clés. On cadre avant de produire.",
    details: [
      "Plans de communication complets",
      "Positionnement et messages clés calibrés pour vos publics cibles",
      "Réflexion stratégique en amont de chaque production",
    ],
  },
  {
    id: "reseaux-sociaux",
    number: "03",
    icon: "social",
    title: "Réseaux sociaux & digital",
    description:
      "Gestion éditoriale, création de contenus courts, community management. Une présence constante et cohérente.",
    details: [
      "Gestion éditoriale et calendriers de publication",
      "Création de contenus courts pensés pour chaque plateforme",
      "Community management en continu",
    ],
  },
  {
    id: "design",
    number: "04",
    icon: "brandFilm",
    title: "Design graphique & identité",
    description:
      "Logos, chartes, rapports annuels, infographies. Des supports pensés pour être utilisés, pas admirés.",
    details: [
      "Logos et chartes graphiques",
      "Rapports annuels qui se lisent vraiment",
      "Infographies et supports de présentation",
    ],
  },
  {
    id: "sites-web",
    number: "05",
    icon: "animation",
    title: "Sites web",
    description:
      "Sites vitrines, plateformes de contenu. Rapides, lisibles, optimisés même sur 3G à Tillabéry.",
    details: [
      "Sites vitrines et plateformes de contenu",
      "Conception UX/UI et développement sur mesure",
      "Performance pensée pour les réalités du réseau au Sahel",
    ],
  },
  {
    id: "impression",
    number: "06",
    icon: "education",
    title: "Impression & supports physiques",
    description:
      "Affiches, kakémonos, brochures, goodies. Parce qu'un atelier à Maradi se vit aussi avec du papier et du tissu.",
    details: [
      "Affiches, kakémonos et displays événementiels",
      "Brochures et supports imprimés",
      "Goodies et supports textiles",
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      <HeaderNav />
      <main className="flex-1">
        <PageHero
          eyebrow="Ce qu'on fait"
          title="Six pôles, une seule équipe."
          intro="On couvre toute la chaîne de communication — du brief à la diffusion. Un seul interlocuteur, pas quatre prestataires qui ne se coordonnent pas."
        />

        <section className="bg-brand-offwhite py-24 px-6 md:px-10">
          <div className="max-w-[1600px] mx-auto flex flex-col gap-8">
            {services.map((service, i) => {
              const Icon = serviceIconMap[service.icon];
              return (
                <Reveal key={service.id} delay={i * 60}>
                  <article
                    id={service.id}
                    className="rounded-2xl border border-border bg-white p-8 md:p-12 grid md:grid-cols-[auto_1fr] gap-8 scroll-mt-28"
                  >
                    <div className="flex md:flex-col items-center md:items-start gap-4">
                      <span className="font-heading text-3xl text-brand-navy/30">
                        {service.number}
                      </span>
                      <Icon className="w-10 h-10 text-brand-navy" />
                    </div>
                    <div>
                      <h2 className="font-heading uppercase text-2xl md:text-3xl">
                        {service.title}
                      </h2>
                      <p className="text-muted-foreground mt-3 max-w-2xl">
                        {service.description}
                      </p>
                      <ul className="mt-6 grid sm:grid-cols-2 gap-x-8 gap-y-3">
                        {service.details.map((detail) => (
                          <li
                            key={detail}
                            className="text-sm text-brand-navy flex items-start gap-2"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-olive shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>

        <StatsBand />

        <CtaFooter />
      </main>
    </>
  );
}
