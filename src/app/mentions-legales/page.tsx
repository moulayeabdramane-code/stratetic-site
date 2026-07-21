import type { Metadata } from "next";
import { HeaderNav } from "@/components/sections/HeaderNav";
import { PageHero } from "@/components/sections/PageHero";
import { CtaFooter } from "@/components/sections/CtaFooter";

export const metadata: Metadata = {
  title: "Mentions légales — STRATETIC",
};

export default function MentionsLegalesPage() {
  return (
    <>
      <HeaderNav />
      <main className="flex-1">
        <PageHero eyebrow="Légal" title="Mentions légales" />
        <section className="bg-brand-offwhite py-24 px-6 md:px-10">
          <div className="max-w-3xl mx-auto flex flex-col gap-8 text-brand-navy">
            <div>
              <h2 className="font-heading uppercase text-xl">Éditeur du site</h2>
              <p className="text-muted-foreground mt-2">
                STRATETIC — Agence de production audiovisuelle, design et
                communication.
                <br />
                Rond-point Salou Djibo, Banifandou 2, Niamey, Niger.
                <br />
                Téléphone : +227 97 72 72 80 — Email : contact@stratetic.art
              </p>
            </div>
            <div>
              <h2 className="font-heading uppercase text-xl">
                Propriété intellectuelle
              </h2>
              <p className="text-muted-foreground mt-2">
                L&apos;ensemble des contenus de ce site (textes, images, vidéos,
                logos) est la propriété de STRATETIC, sauf mention contraire.
                Toute reproduction sans autorisation écrite préalable est
                interdite.
              </p>
            </div>
            <div>
              <h2 className="font-heading uppercase text-xl">Plateformes liées</h2>
              <p className="text-muted-foreground mt-2">
                STRATETIC est propriétaire de la plateforme d&apos;actualités
                nigerinfos.com.
              </p>
            </div>
          </div>
        </section>
        <CtaFooter />
      </main>
    </>
  );
}
