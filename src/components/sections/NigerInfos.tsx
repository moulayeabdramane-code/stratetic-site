import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";

const stats = [
  { value: "100K+", label: "Abonnés Facebook" },
  { value: "10M+", label: "Visites mensuelles" },
  { value: "2500+", label: "Articles publiés" },
  { value: "2022", label: "En ligne depuis" },
];

const tags = [
  "Politique",
  "Diplomatie",
  "Économie",
  "Sécurité",
  "Sahel",
  "Culture",
  "Environnement",
];

export function NigerInfos() {
  return (
    <section className="bg-brand-navy text-white py-24 px-6 md:px-10">
      <div className="max-w-[1600px] mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <Reveal>
          <p className="uppercase tracking-widest text-sm text-white/60">
            Nos plateformes média
          </p>
          <h2 className="font-heading uppercase text-4xl md:text-5xl leading-tight mt-4">
            Une voix indépendante
            <br />
            pour le Sahel
          </h2>
          <p className="text-white/80 mt-6 max-w-xl">
            STRATETIC est propriétaire de{" "}
            <a
              href="https://www.nigerinfos.com"
              className="font-semibold text-brand-olive hover:underline"
            >
              nigerinfos.com
            </a>
            , plateforme d&apos;actualités dédiée au Niger, au Sahel et à
            l&apos;Afrique.
          </p>
          <p className="text-white/70 mt-3 max-w-xl">
            Politique, diplomatie, économie, sécurité — une couverture
            rigoureuse et analytique pour les décideurs, les organisations et
            les citoyens informés.
          </p>
          <ul className="flex flex-wrap gap-2 mt-6">
            {tags.map((tag) => (
              <li
                key={tag}
                className="text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-full border border-white/20 text-white/80"
              >
                {tag}
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-10">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-heading text-3xl text-brand-olive">
                  {stat.value}
                </p>
                <p className="text-xs uppercase tracking-wide text-white/60 mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <a
            href="https://www.nigerinfos.com"
            className="bg-gradient-accent text-white font-heading uppercase px-8 py-4 rounded-full mt-10 inline-block"
          >
            Visiter nigerinfos.com
          </a>
        </Reveal>

        <Reveal delay={150} y={36}>
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/site/screencapture-nigerinfos.webp"
                alt="La une de nigerinfos.com"
                fill
                className="object-cover object-top"
                sizes="(min-width: 1024px) 45vw, 90vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-3">
                <div className="relative h-10 w-32">
                  <Image
                    src="/images/site/logo_NigerInfos.png"
                    alt="NigerInfos"
                    fill
                    className="object-contain object-left"
                    sizes="128px"
                  />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default NigerInfos;
