import { Reveal } from "@/components/motion/Reveal";

const stats = [
  {
    value: "13 ans",
    label: "d'expérience en communication au Niger et au Sahel",
  },
  {
    value: "100+",
    label: "projets livrés pour des ONG, entreprises et institutions",
  },
  {
    value: "6",
    label: "pôles d'expertise couvrant toute la chaîne de communication",
  },
  {
    value: "48h",
    label: "temps de réponse maximum pour toute demande reçue",
  },
];

export function StatsBand() {
  return (
    <section className="bg-brand-offwhite py-24 px-6 md:px-10">
      <div className="max-w-[1600px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-10">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 80}>
            <p className="font-heading text-5xl text-brand-navy">
              {stat.value}
            </p>
            <p className="text-muted-foreground text-sm mt-3">{stat.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default StatsBand;
