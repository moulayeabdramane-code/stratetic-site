import type { Metadata } from "next";
import Image from "next/image";
import { HeaderNav } from "@/components/sections/HeaderNav";
import { PageHero } from "@/components/sections/PageHero";
import { CtaFooter } from "@/components/sections/CtaFooter";
import { NigerInfos } from "@/components/sections/NigerInfos";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Blog — STRATETIC",
  description:
    "Notes de terrain, analyses de métier : tourner au Sahel, communiquer pour des ONG, produire avec l'IA générative. Un article par mois, c'est tout.",
};

interface Article {
  category: string;
  readTime: string;
  title: string;
  excerpt: string;
  image: string;
}

const articles: Article[] = [
  {
    category: "Notes de terrain",
    readTime: "6 min",
    title:
      "Tourner un documentaire à Diffa : les 4 choses qu'on aurait aimé savoir avant",
    excerpt:
      "Les contraintes logistiques, sécuritaires, linguistiques et humaines qu'on ne voit pas dans un brief.",
    image: "/images/site/diffa-tournage.webp",
  },
  {
    category: "Métier",
    readTime: "8 min",
    title:
      "Pourquoi la plupart des rapports annuels d'ONG au Sahel finissent à la poubelle",
    excerpt:
      "Cinq raisons concrètes, avec exemples anonymisés. Et les solutions qu'on applique chez STRATETIC.",
    image: "/images/niger/blog-ong.webp",
  },
  {
    category: "Outils & production",
    readTime: "10 min",
    title:
      "Kling 3.0 en production réelle : notre retour après 6 mois de tests clients",
    excerpt:
      "Ce qui fonctionne, ce qui ne fonctionne pas, exemples concrets de plans générés en IA.",
    image: "/images/site/Kling.jpg",
  },
];

export default function BlogPage() {
  return (
    <>
      <HeaderNav />
      <main className="flex-1">
        <PageHero
          eyebrow="Le blog"
          title="Notes de terrain, analyses de métier."
          intro="Ce qu'on apprend en tournant au Sahel, en communiquant pour des ONG et en produisant avec les outils d'aujourd'hui. Un article par mois, c'est tout."
        />

        <section className="bg-brand-offwhite py-24 px-6 md:px-10">
          <div className="max-w-[1600px] mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {articles.map((article, i) => (
              <Reveal key={article.title} delay={i * 80}>
                <article className="h-full flex flex-col">
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-border bg-white group">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 90vw"
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-5">
                    <span className="uppercase tracking-widest text-xs text-brand-olive">
                      {article.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {article.readTime}
                    </span>
                  </div>
                  <h2 className="font-heading uppercase text-xl mt-2">
                    {article.title}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-2">
                    {article.excerpt}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Notre plateforme média a toute sa place sur la page éditoriale. */}
        <NigerInfos />

        <CtaFooter />
      </main>
    </>
  );
}
