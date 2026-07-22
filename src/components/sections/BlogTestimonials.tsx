"use client";

import Image from "next/image";
import type { BlogPost, Testimonial } from "@/types/content";
import { Reveal } from "@/components/motion/Reveal";

const blogPosts: BlogPost[] = [
  {
    title:
      "TOURNER UN DOCUMENTAIRE À DIFFA : LES 4 CHOSES QU'ON AURAIT AIMÉ SAVOIR AVANT",
    excerpt:
      "Notes de terrain · 6 min — Les contraintes logistiques, sécuritaires, linguistiques et humaines qu'on ne voit pas dans un brief.",
    placeholderLabel: "[Image article]",
  },
  {
    title:
      "POURQUOI LA PLUPART DES RAPPORTS ANNUELS D'ONG AU SAHEL FINISSENT À LA POUBELLE",
    excerpt:
      "Métier · 8 min — Cinq raisons concrètes, avec exemples anonymisés. Et les solutions qu'on applique chez STRATETIC.",
    placeholderLabel: "[Image article]",
  },
  {
    title:
      "KLING 3.0 EN PRODUCTION RÉELLE : NOTRE RETOUR APRÈS 6 MOIS DE TESTS CLIENTS",
    excerpt:
      "Outils & production · 10 min — Ce qui fonctionne, ce qui ne fonctionne pas, exemples concrets de plans générés en IA.",
    placeholderLabel: "[Image article]",
  },
];

const blogImages = [
  "/images/site/diffa-tournage.webp",
  "/images/niger/blog-ong.webp",
  "/images/site/Kling.jpg",
];

// Extraits fidèles des lettres de recommandation officielles remises par les
// clients (CIPMEN 23/04/2026, CDS Niger 27/04/2026, Ambassade de France 01/08/2022).
const testimonials: (Testimonial & { photo: string })[] = [
  {
    quote:
      "Ce qui distingue particulièrement l'Agence STRATETIC, c'est sa manière de penser une marque au-delà du livrable graphique : cohérence d'ensemble entre les supports, attention portée au sens, écoute des équipes internes. Le CIPMEN recommande l'Agence STRATETIC sans réserve.",
    name: "Bello Mahamadou",
    role: "Directeur Général · CIPMEN, Niamey",
    photo: "/images/temoins/bello.webp",
  },
  {
    quote:
      "Les délais ont été tenus, le budget respecté, et les livrables conformes à ce qui avait été convenu. Nous avons apprécié la capacité de l'équipe à comprendre rapidement nos enjeux métiers et à travailler dans des conditions de terrain parfois exigeantes en zone rurale.",
    name: "Abdallah Sidi Moctar",
    role: "Responsable Développement et Partenariats · CDS Niger",
    photo: "/images/temoins/abdallah.webp",
  },
  {
    quote:
      "Les livrables reçus correspondent bien à l'objet du contrat de prestation de services. L'agence STRATETIC a parfaitement su répondre aux exigences du service de coopération et d'action culturelle de l'Ambassade de France.",
    name: "Luc Fabre",
    role: "Conseiller de Coopération et d'Action culturelle · Ambassade de France au Niger",
    photo: "/images/temoins/fabre.webp",
  },
];

function BlogCard({ title, excerpt, image }: BlogPost & { image: string }) {
  return (
    <div>
      <div className="relative aspect-[16/10] rounded-2xl bg-brand-navy/5 border border-border overflow-hidden group">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 90vw"
        />
      </div>
      <h3 className="font-heading uppercase text-xl md:text-2xl mt-4">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm mt-2">{excerpt}</p>
    </div>
  );
}

function TestimonialCard({
  quote,
  name,
  role,
  photo,
}: Testimonial & { photo: string }) {
  return (
    <div className="bg-white rounded-3xl border border-border p-8 flex flex-col gap-6 h-full">
      <p className="text-base md:text-lg font-medium text-brand-navy leading-snug">
        {quote}
      </p>
      <div className="flex items-center gap-4 mt-auto">
        <div className="relative w-14 h-14 rounded-full overflow-hidden border border-border shrink-0">
          <Image src={photo} alt={name} fill className="object-cover" sizes="56px" />
        </div>
        <div>
          <p className="font-semibold text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <div className="py-24 px-6 md:px-10 bg-brand-offwhite">
      <Reveal className="flex items-end gap-4">
        <span className="uppercase text-sm tracking-widest">
          Ce qu&apos;ils disent de notre travail — extraits de lettres de
          recommandation officielles
        </span>
      </Reveal>

      <div className="grid md:grid-cols-3 gap-6 mt-10 items-stretch">
        {testimonials.map((t, i) => (
          <Reveal key={t.name} delay={i * 100} className="h-full">
            <TestimonialCard {...t} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export function BlogSection() {
  return (
    <div className="py-24 px-6 md:px-10 bg-brand-offwhite border-b border-border">
      <Reveal className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between md:flex-wrap">
        <div className="flex items-end gap-4">
          <span className="uppercase text-sm tracking-widest">
            Le blog — Notes de terrain, analyses de métier
          </span>
        </div>
        <a
          href="/blog"
          className="bg-gradient-accent text-white rounded-full px-6 py-3 font-heading uppercase text-sm"
        >
          Voir tous les articles
        </a>
      </Reveal>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
        {blogPosts.map((post, i) => (
          <Reveal key={post.title} delay={i * 100}>
            <BlogCard {...post} image={blogImages[i]} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export function BlogTestimonials() {
  return (
    <>
      <BlogSection />
      <TestimonialsSection />
    </>
  );
}

export default BlogTestimonials;
