import { Reveal } from "@/components/motion/Reveal";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  intro?: string;
}

/** Bandeau navy d'en-tête pour les pages internes — le HeaderNav (texte blanc
 *  tant qu'on n'a pas scrollé) a besoin d'un fond sombre en haut de page. */
export function PageHero({ eyebrow, title, intro }: PageHeroProps) {
  return (
    <section className="bg-brand-navy text-white pt-40 pb-20 px-6 md:px-10">
      <div className="max-w-[1600px] mx-auto">
        <Reveal>
          <p className="uppercase tracking-widest text-xs text-brand-olive">
            {eyebrow}
          </p>
          <h1
            className="font-heading uppercase text-white leading-[0.9] mt-3"
            style={{ fontSize: "clamp(2.2rem, 6vw, 5rem)" }}
          >
            {title}
          </h1>
          {intro && (
            <p className="text-white/80 text-lg mt-6 max-w-2xl">{intro}</p>
          )}
        </Reveal>
      </div>
    </section>
  );
}

export default PageHero;
