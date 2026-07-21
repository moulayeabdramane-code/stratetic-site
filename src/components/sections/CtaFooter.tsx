import Image from "next/image";
import { Logo } from "@/components/Logo";
import {
  ArrowRightIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  YoutubeIcon,
} from "@/components/icons";
import type { FooterLinkGroup } from "@/types/content";
import { Reveal } from "@/components/motion/Reveal";

const sitemapLinks: FooterLinkGroup = {
  heading: "Navigation",
  links: [
    { label: "À propos", href: "/a-propos" },
    { label: "Services", href: "/services" },
    { label: "Réalisations", href: "/realisations" },
    { label: "Blog", href: "/blog" },
    { label: "Nous écrire", href: "/contact" },
  ],
};

const legalLinks: FooterLinkGroup = {
  heading: "Légal",
  links: [
    { label: "Mentions légales", href: "/mentions-legales" },
    { label: "Confidentialité", href: "/confidentialite" },
    { label: "nigerinfos.com", href: "https://www.nigerinfos.com" },
  ],
};

const socialLinks = [
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
    label: "Youtube",
    href: "https://www.youtube.com/@stratetic4097",
    Icon: YoutubeIcon,
  },
];

const contactLinks: FooterLinkGroup = {
  heading: "Contact",
  links: [
    { label: "contact@stratetic.art", href: "mailto:contact@stratetic.art" },
    { label: "+227 97 72 72 80", href: "tel:+22797727280" },
    { label: "Rond-point Salou Djibo, Banifandou 2 — Niamey, Niger", href: "#" },
  ],
};

function FooterLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2 text-white/90 hover:text-white font-medium"
    >
      {label}
      <ArrowRightIcon className="w-[14px] h-[14px] group-hover:translate-x-1 transition-transform" />
    </a>
  );
}

export function CtaFooter() {
  return (
    <>
      {/* Block A — CTA */}
      <section id="contact" className="bg-brand-offwhite py-24 px-6 md:px-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-[1600px] mx-auto">
          <Reveal className="border-t border-border pt-8">
            <h2 className="font-heading uppercase text-4xl md:text-5xl leading-[0.95]">
              Un brief même incomplet, c&apos;est suffisant pour commencer
            </h2>
            <p className="text-muted-foreground text-lg mt-6 max-w-md">
              Racontez-nous votre projet — documentaire, spot, site web,
              campagne complète. Réponse garantie sous 48h ouvrées.
            </p>
            <a
              href="mailto:contact@stratetic.art"
              className="bg-gradient-accent text-white font-heading uppercase px-8 py-4 rounded-full mt-8 inline-block"
            >
              Nous écrire
            </a>
          </Reveal>
          <Reveal
            delay={150}
            y={36}
            className="relative overflow-hidden aspect-[4/3] rounded-3xl bg-brand-navy/5 border border-border"
          >
            <Image
              src="/images/cta-team.webp"
              alt="L'équipe STRATETIC en session de brainstorming créatif"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 45vw, 90vw"
            />
          </Reveal>
        </div>
      </section>

      {/* Block B — Footer */}
      <footer className="bg-gradient-footer text-white px-6 md:px-10 pt-20 pb-10">
        <Reveal
          as="div"
          className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-10 pb-16 border-b border-white/20"
        >
          <div>
            <Logo variant="white" />
            <p className="text-white/70 max-w-sm mt-4">
              Produire ce qui compte. Depuis Niamey, pour le Niger, le Sahel
              et ceux qui s&apos;y intéressent.
            </p>
          </div>
          <h2 className="font-heading uppercase text-4xl md:text-7xl text-right leading-none">
            Nous contacter
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 py-16">
          <Reveal delay={0 * 80} className="flex flex-col gap-4">
            {sitemapLinks.links.map((link) => (
              <FooterLink key={link.label} {...link} />
            ))}
          </Reveal>
          <Reveal delay={1 * 80} className="flex flex-col gap-4">
            {legalLinks.links.map((link) => (
              <FooterLink key={link.label} {...link} />
            ))}
          </Reveal>
          <Reveal delay={2 * 80} className="flex flex-col gap-4">
            {socialLinks.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                className="group inline-flex items-center gap-2 text-white/90 hover:text-white font-medium"
              >
                <Icon className="w-4 h-4" />
                {label}
                <ArrowRightIcon className="w-[14px] h-[14px] group-hover:translate-x-1 transition-transform" />
              </a>
            ))}
          </Reveal>
          <Reveal delay={3 * 80} className="flex flex-col gap-4">
            {contactLinks.links.map((link) => (
              <FooterLink key={link.label} {...link} />
            ))}
          </Reveal>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-t border-white/20 pt-8">
          <div>
            <p className="font-heading uppercase text-lg">Newsletter</p>
            <p className="text-white/60 text-sm mt-1">
              Un article par mois, c&apos;est tout.
            </p>
          </div>
          <a
            href="mailto:contact@stratetic.art?subject=Inscription%20newsletter"
            className="bg-gradient-accent text-white font-heading uppercase text-sm px-6 py-3 rounded-full self-start md:self-auto"
          >
            S&apos;abonner
          </a>
        </div>

        <div className="pt-8 text-white/60 text-sm">
          © 2026 STRATETIC — Tous droits réservés.
        </div>
      </footer>
    </>
  );
}

export default CtaFooter;
