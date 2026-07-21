import Image from "next/image";
import { ArrowDownIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/Reveal";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-end overflow-hidden bg-brand-navy"
    >
      {/* Background image layer */}
      <Image
        src="/images/hero-bg.png"
        alt=""
        fill
        priority
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />

      {/* Background video layer */}
      {/* affichera le showreel une fois /videos/hero-reel.mp4 fourni par le client */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/images/hero-bg.png"
        className="absolute inset-0 h-full w-full object-cover opacity-0"
      >
        <source src="/videos/hero-reel.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-brand-navy/40 z-[1]" />

      {/* Floating photo placeholder cards (desktop only) */}
      <div className="hidden lg:block absolute top-32 right-24 z-[2]">
        <Reveal delay={200} y={16}>
          <div className="absolute -rotate-6 -translate-x-16 -translate-y-4 aspect-[3/4] w-56 rounded-3xl border-4 border-white/10 bg-brand-offwhite/10 shadow-2xl overflow-hidden flex items-center justify-center">
            <Image
              src="/images/hero-card-1.png"
              alt="Tournage vidéo"
              fill
              className="object-cover rounded-3xl"
            />
          </div>
        </Reveal>
        <Reveal delay={350} y={16}>
          <div className="relative rotate-3 translate-x-8 translate-y-16 aspect-[3/4] w-56 rounded-3xl border-4 border-white/10 bg-brand-offwhite/10 shadow-2xl overflow-hidden flex items-center justify-center">
            <Image
              src="/images/hero-card-2.png"
              alt="Tournage vidéo"
              fill
              className="object-cover rounded-3xl"
            />
          </div>
        </Reveal>
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 max-w-[1600px] mx-auto w-full px-6 md:px-10 pb-24 pt-40">
        <Reveal delay={0} y={24}>
          <p className="uppercase tracking-widest text-xs text-brand-olive">
            DU CONTENU QUI CONNECTE, PERFORME ET TOUCHE LES GENS
          </p>
        </Reveal>

        <Reveal delay={100} y={24}>
          <h1
            className="font-heading text-white leading-[0.85] mt-2"
            style={{ fontSize: "clamp(2.5rem, 9vw, 9rem)" }}
          >
            L&apos;AGENCE DE PRODUCTION QUE VOUS CHERCHIEZ
          </h1>
        </Reveal>

        <Reveal delay={200} y={24}>
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8 mt-8">
            <a
              href="#contact"
              className="text-gradient-accent-on-dark font-heading text-xl uppercase"
            >
              Parlons-en
            </a>
            <ArrowDownIcon className="h-5 w-5 text-white" />
            <a
              href="#work"
              className="text-white font-bold uppercase text-lg hover:underline"
            >
              VOIR NOS RÉALISATIONS
            </a>
          </div>
        </Reveal>

        <Reveal delay={300} y={24}>
          <p className="max-w-xl text-white/80 text-lg mt-10">
            Nous accompagnons des marques ambitieuses pour créer du contenu qui
            capte l&apos;attention, façonne la culture et génère de l&apos;impact.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export default Hero;
