import type { Metadata } from "next";
import { HeaderNav } from "@/components/sections/HeaderNav";
import { PageHero } from "@/components/sections/PageHero";
import { CtaFooter } from "@/components/sections/CtaFooter";
import { ContactForm } from "@/components/sections/ContactForm";
import { Reveal } from "@/components/motion/Reveal";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  YoutubeIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Nous écrire — STRATETIC",
  description:
    "Un brief même incomplet, c'est suffisant pour commencer. Réponse sous 48h ouvrées. Rond-point Salou Djibo, Banifandou 2, Niamey, Niger.",
};

const coordinates = [
  {
    label: "Adresse",
    value: "Rond-point Salou Djibo, Banifandou 2\nNiamey, Niger",
  },
  { label: "Téléphone", value: "+227 97 72 72 80", href: "tel:+22797727280" },
  {
    label: "Email",
    value: "contact@stratetic.art",
    href: "mailto:contact@stratetic.art",
  },
];

const socials = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/stratetic.art",
    Icon: FacebookIcon,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/stratetic/",
    Icon: InstagramIcon,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/82051062",
    Icon: LinkedinIcon,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@stratetic4097",
    Icon: YoutubeIcon,
  },
];

export default function ContactPage() {
  return (
    <>
      <HeaderNav />
      <main className="flex-1">
        <PageHero
          eyebrow="Nous écrire"
          title="Un brief même incomplet, c'est suffisant pour commencer."
          intro="Documentaire, spot, site web, campagne complète — racontez-nous votre projet tel qu'il est aujourd'hui. Réponse sous 48h ouvrées."
        />

        <section className="bg-brand-offwhite py-24 px-6 md:px-10">
          <div className="max-w-[1600px] mx-auto grid lg:grid-cols-2 gap-12">
            <Reveal>
              <div className="flex flex-col gap-8">
                {coordinates.map((item) => (
                  <div key={item.label}>
                    <p className="uppercase tracking-widest text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="font-heading text-2xl text-brand-navy hover:text-brand-olive transition-colors mt-1 inline-block"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="font-heading text-2xl text-brand-navy mt-1 whitespace-pre-line">
                        {item.value}
                      </p>
                    )}
                  </div>
                ))}
                <div>
                  <p className="uppercase tracking-widest text-xs text-muted-foreground">
                    Réseaux
                  </p>
                  <div className="flex gap-4 mt-3">
                    {socials.map(({ label, href, Icon }) => (
                      <a
                        key={label}
                        href={href}
                        aria-label={label}
                        className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-brand-navy hover:bg-brand-navy hover:text-white transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <ContactForm />
            </Reveal>
          </div>
        </section>

        {/* Notre position — Rond-point Salou Djibo, Banifandou 2, Niamey */}
        <section className="bg-white py-24 px-6 md:px-10 border-t border-border">
          <div className="max-w-[1600px] mx-auto">
            <Reveal>
              <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="uppercase tracking-widest text-xs text-brand-olive">
                    Où nous trouver
                  </p>
                  <h2 className="font-heading uppercase text-3xl md:text-4xl mt-3">
                    Rond-point Salou Djibo, Niamey
                  </h2>
                </div>
                <a
                  href="https://maps.app.goo.gl/Kx9JJku7jjUckZYo8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-accent text-white rounded-full px-6 py-3 font-heading uppercase text-sm shrink-0"
                >
                  Ouvrir dans Google Maps
                </a>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="mt-8 rounded-3xl overflow-hidden border border-border">
                <iframe
                  title="STRATETIC — Rond-point Salou Djibo, Banifandou 2, Niamey"
                  src="https://www.google.com/maps?q=Stratetic,+Rond+Point+Salou+Djibo,+Niamey&ll=13.5266304,2.1069824&z=16&output=embed"
                  className="w-full h-[420px] md:h-[480px] block"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Reveal>
          </div>
        </section>

        <CtaFooter />
      </main>
    </>
  );
}
