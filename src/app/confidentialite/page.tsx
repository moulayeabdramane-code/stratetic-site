import type { Metadata } from "next";
import { HeaderNav } from "@/components/sections/HeaderNav";
import { PageHero } from "@/components/sections/PageHero";
import { CtaFooter } from "@/components/sections/CtaFooter";

export const metadata: Metadata = {
  title: "Politique de confidentialité — STRATETIC",
};

export default function ConfidentialitePage() {
  return (
    <>
      <HeaderNav />
      <main className="flex-1">
        <PageHero eyebrow="Légal" title="Politique de confidentialité" />
        <section className="bg-brand-offwhite py-24 px-6 md:px-10">
          <div className="max-w-3xl mx-auto flex flex-col gap-8 text-brand-navy">
            <div>
              <h2 className="font-heading uppercase text-xl">
                Données collectées
              </h2>
              <p className="text-muted-foreground mt-2">
                Ce site ne collecte pas de données personnelles à votre insu.
                Les informations que vous nous transmettez par email ou via la
                newsletter servent uniquement à répondre à votre demande et ne
                sont jamais cédées à des tiers.
              </p>
            </div>
            <div>
              <h2 className="font-heading uppercase text-xl">Newsletter</h2>
              <p className="text-muted-foreground mt-2">
                Vous pouvez vous désinscrire à tout moment en nous écrivant à
                contact@stratetic.art.
              </p>
            </div>
            <div>
              <h2 className="font-heading uppercase text-xl">Contact</h2>
              <p className="text-muted-foreground mt-2">
                Pour toute question relative à vos données :
                contact@stratetic.art.
              </p>
            </div>
          </div>
        </section>
        <CtaFooter />
      </main>
    </>
  );
}
