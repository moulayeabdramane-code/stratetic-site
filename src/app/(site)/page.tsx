import { HeaderNav } from "@/components/sections/HeaderNav";
import { ScrollWorldHero } from "@/components/scroll-world/ScrollWorldHero";
import { WorkGallery } from "@/components/sections/WorkGallery";
import { WhatWeDo } from "@/components/sections/WhatWeDo";
import { ClientsWhoWeHelp } from "@/components/sections/ClientsWhoWeHelp";
import { BlogTestimonials } from "@/components/sections/BlogTestimonials";
import { NigerInfos } from "@/components/sections/NigerInfos";
import { CtaFooter } from "@/components/sections/CtaFooter";

export default function Home() {
  return (
    <>
      <HeaderNav />
      <main className="flex-1">
        <ScrollWorldHero />
        <WorkGallery />
        <WhatWeDo />
        <ClientsWhoWeHelp />
        <BlogTestimonials />
        <NigerInfos />
        <CtaFooter />
      </main>
    </>
  );
}
