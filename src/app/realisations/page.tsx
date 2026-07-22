import type { Metadata } from "next";
import Image from "next/image";
import { HeaderNav } from "@/components/sections/HeaderNav";
import { PageHero } from "@/components/sections/PageHero";
import { CtaFooter } from "@/components/sections/CtaFooter";
import { TestimonialsSection } from "@/components/sections/BlogTestimonials";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Réalisations — STRATETIC",
  description:
    "Spots, documentaires, sites web, campagnes complètes : plus de 100 projets livrés pour des ONG, entreprises et institutions au Niger, au Sahel et au-delà.",
};

// Site ARISE / Keneya Yiriwali réalisé par STRATETIC.
const ARISE_URL = "https://arisekeneya.org/";

interface Project {
  slug: string;
  /** ID YouTube du film — absent pour ARISE (projet site web). */
  ytId?: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  image: string;
}

const projects: Project[] = [
  {
    category: "Énergie · Privé",
    slug: "cds-niger",
    ytId: "7KosqdnyWXk",
    title: "CDS Niger — Forum FIER/JNER 2026",
    description:
      "Campagne complète pour le forum sur les énergies renouvelables. Spot audiovisuel, 7 supports print et déclinaisons réseaux sociaux.",
    tags: ["Spot vidéo", "Print & display", "Réseaux sociaux"],
    image: "/images/niger/work-cds.webp",
  },
  {
    category: "ONG · Santé publique",
    slug: "arise-mali",
    title: "ARISE / Keneya Yiriwali (Mali)",
    description:
      "Site de présentation du programme de santé — conception UX/UI et développement sur mesure pour une double audience bailleurs et terrain.",
    tags: ["Site web", "UX/UI Design", "Développement sur mesure"],
    image: "/images/site/Siteweb_Arise.jpg",
  },
  {
    category: "Digital · Emploi",
    slug: "niger-emploi",
    ytId: "1UfF72OEsmM",
    title: "Niger Emploi — Spot publicitaire",
    description:
      "Spot dynamique multi-formats pour la principale plateforme d'offres d'emploi du Niger.",
    tags: ["Spot vidéo", "Multi-formats", "Motion design"],
    image: "/images/niger/work-nigeremploi.webp",
  },
  {
    category: "Institution publique",
    slug: "ansi",
    ytId: "NjAKRQmZIbQ",
    title: "ANSI — Table ronde des bailleurs, Paris",
    description:
      "Spot institutionnel haute exigence, projeté lors de la table ronde internationale pour la transformation numérique du Niger.",
    tags: ["Film institutionnel", "Diffusion internationale"],
    image: "/images/niger/work-ansi.webp",
  },
  {
    category: "Entrepreneuriat · Niger",
    slug: "cipmen",
    ytId: "7e2KbO8m21Q",
    title: "CIPMEN — Film entrepreneuriat",
    description:
      "Film documentaire sur les parcours d'entrepreneurs accompagnés par le centre d'incubation nigérien.",
    tags: ["Film documentaire", "Tournage Niger"],
    image: "/images/niger/work-cipmen.webp",
  },
  {
    category: "Communication · Spot",
    slug: "complait",
    ytId: "_AplCctINfE",
    title: "COMPLAIT — Spot publicitaire",
    description:
      "Spot court et percutant conçu et produit de A à Z — concept, tournage, montage et motion design.",
    tags: ["Spot vidéo", "Motion design"],
    image: "/images/niger/work-complait.webp",
  },
  {
    category: "Agribusiness · ONG",
    slug: "2scale-snv",
    ytId: "QhqzRDhcfck",
    title: "2Scale / SNV — Success Story",
    description:
      "Film de success story pour le programme d'agribusiness inclusif SNV, aux standards de reporting bailleurs internationaux.",
    tags: ["Success story", "Terrain Niger", "Bailleurs"],
    image: "/images/site/ONG.webp",
  },
  {
    category: "Social · Genre · Niger",
    slug: "aet",
    ytId: "KPwU07osF80",
    title: "AET — Projet PISCCA, Niamey",
    description:
      "Retour vidéo sur le plaidoyer mené auprès de 50 filles-mères et mères célibataires — débats télévisés, radios communautaires en haoussa, société civile et autorités locales.",
    tags: ["Film documentaire", "Plaidoyer", "Droits des femmes"],
    image: "/images/site/diffa-tournage.webp",
  },
];

export default function RealisationsPage() {
  return (
    <>
      <HeaderNav />
      <main className="flex-1">
        <PageHero
          eyebrow="Réalisations"
          title="Huit projets, huit univers."
          intro="Plus de 100 projets livrés depuis 2013 pour des ONG, entreprises et institutions. En voici huit qui racontent l'étendue de ce qu'on sait faire."
        />

        <section className="bg-brand-offwhite py-24 px-6 md:px-10">
          <div className="max-w-[1600px] mx-auto grid md:grid-cols-2 gap-10">
            {projects.map((project, i) => (
              <Reveal key={project.title} delay={i * 60}>
                <article id={project.slug} className="h-full flex flex-col scroll-mt-28">
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-border bg-black">
                    {project.ytId ? (
                      <iframe
                        title={`Film : ${project.title}`}
                        src={`https://www.youtube-nocookie.com/embed/${project.ytId}?rel=0`}
                        className="absolute inset-0 w-full h-full"
                        style={{ border: 0 }}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <a
                        href={ARISE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Visiter le site : ${project.title}`}
                        className="group block absolute inset-0"
                      >
                        <Image
                          src={project.image}
                          alt={project.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(min-width: 768px) 45vw, 90vw"
                        />
                        <span className="absolute bottom-4 left-4 bg-gradient-accent text-white text-xs font-heading uppercase px-4 py-2 rounded-full">
                          Visiter le site →
                        </span>
                      </a>
                    )}
                  </div>
                  <p className="uppercase tracking-widest text-xs text-brand-olive mt-5">
                    {project.category}
                  </p>
                  <h2 className="font-heading uppercase text-xl md:text-2xl mt-2">
                    {project.title}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-2">
                    {project.description}
                  </p>
                  <ul className="flex flex-wrap gap-2 mt-4">
                    {project.tags.map((tag) => (
                      <li
                        key={tag}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-navy/5 border border-border text-brand-navy"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Le meilleur du nouveau site : la preuve sociale à côté du travail. */}
        <TestimonialsSection />

        <CtaFooter />
      </main>
    </>
  );
}
