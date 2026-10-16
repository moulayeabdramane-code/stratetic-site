import type { Metadata } from "next";
import Image from "next/image";
import { connection } from "next/server";
import { HeaderNav } from "@/components/sections/HeaderNav";
import { PageHero } from "@/components/sections/PageHero";
import { CtaFooter } from "@/components/sections/CtaFooter";
import { TestimonialsSection } from "@/components/sections/BlogTestimonials";
import { Reveal } from "@/components/motion/Reveal";
import { PdfBooklet } from "@/components/sections/PdfBookletLazy";
import { getRealisations } from "@/lib/realisations";
import { nombreEnLettres, titreProjets } from "@/lib/nombres";

export const metadata: Metadata = {
  title: "Réalisations — STRATETIC",
  description:
    "Spots, documentaires, sites web, campagnes complètes : plus de 100 projets livrés pour des ONG, entreprises et institutions au Niger, au Sahel et au-delà.",
};

export default async function RealisationsPage() {
  // Rendu à la requête : la base n'existe pas pendant le build Docker.
  await connection();
  const projects = await getRealisations();
  const n = projects.length;

  return (
    <>
      <HeaderNav />
      <main className="flex-1">
        <PageHero
          eyebrow="Réalisations"
          title={n > 0 ? `${titreProjets(n)}.` : "Nos réalisations."}
          intro={
            n > 0
              ? `Plus de 100 projets livrés depuis 2013 pour des ONG, entreprises et institutions. En voici ${nombreEnLettres(n)} qui ${n === 1 ? "raconte" : "racontent"} l'étendue de ce qu'on sait faire.`
              : "Plus de 100 projets livrés depuis 2013 pour des ONG, entreprises et institutions."
          }
        />

        <section className="bg-brand-offwhite py-24 px-6 md:px-10">
          {n === 0 ? (
            <p className="max-w-[1600px] mx-auto text-center text-muted-foreground">
              Nos projets arrivent bientôt.
            </p>
          ) : (
            <div className="max-w-[1600px] mx-auto grid md:grid-cols-2 gap-10">
              {projects.map((project, i) => (
                <Reveal key={project.slug} delay={i * 60}>
                  <article id={project.slug} className="h-full flex flex-col scroll-mt-28">
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-border bg-black">
                      {project.type === "video" && project.youtubeId ? (
                        <iframe
                          title={`Film : ${project.title}`}
                          src={`https://www.youtube-nocookie.com/embed/${project.youtubeId}?rel=0`}
                          className="absolute inset-0 w-full h-full"
                          style={{ border: 0 }}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : project.type === "pdf" && project.pdfUrl ? (
                        <PdfBooklet
                          pdfUrl={project.pdfUrl}
                          coverImage={project.coverUrl}
                          title={project.title}
                        />
                      ) : (
                        <a
                          href={project.externalUrl ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Visiter le site : ${project.title}`}
                          className="group block absolute inset-0"
                        >
                          <Image
                            src={project.coverUrl}
                            alt={project.coverAlt}
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
          )}
        </section>

        {/* Le meilleur du nouveau site : la preuve sociale à côté du travail. */}
        <TestimonialsSection />

        <CtaFooter />
      </main>
    </>
  );
}
