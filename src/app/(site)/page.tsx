import { connection } from "next/server";
import { getHomeRealisations } from "@/lib/realisations";
import { HeaderNav } from "@/components/sections/HeaderNav";
import { ScrollWorldHero } from "@/components/scroll-world/ScrollWorldHero";
import { WorkGallery } from "@/components/sections/WorkGallery";
import { WhatWeDo } from "@/components/sections/WhatWeDo";
import { ClientsWhoWeHelp } from "@/components/sections/ClientsWhoWeHelp";
import { BlogTestimonials } from "@/components/sections/BlogTestimonials";
import { NigerInfos } from "@/components/sections/NigerInfos";
import { CtaFooter } from "@/components/sections/CtaFooter";

export default async function Home() {
  // Rendu à la requête : la base n'existe pas pendant le build Docker.
  await connection();
  const projects = await getHomeRealisations();

  return (
    <>
      <HeaderNav />
      <main className="flex-1">
        <ScrollWorldHero />
        <WorkGallery projects={projects} />
        <WhatWeDo />
        <ClientsWhoWeHelp />
        <BlogTestimonials />
        <NigerInfos />
        <CtaFooter />
      </main>
    </>
  );
}
