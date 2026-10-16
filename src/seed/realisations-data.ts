// Données de l'import initial : les 9 projets du site avant l'admin, dans l'ordre d'affichage.
export type SeedProject = {
  slug: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  type: "video" | "website" | "pdf";
  youtubeId?: string;
  externalUrl?: string;
  /** Chemin relatif à public/ — envoyé dans la médiathèque. */
  coverFile?: string;
  /** Chemin relatif à public/ — envoyé dans la médiathèque. */
  pdfFile?: string;
  showOnHome: boolean;
};

export const SEED_PROJECTS: SeedProject[] = [
  {
    slug: "cds-niger",
    title: "CDS Niger — Forum FIER/JNER 2026",
    category: "Énergie · Privé",
    description:
      "Campagne complète pour le forum sur les énergies renouvelables. Spot audiovisuel, 7 supports print et déclinaisons réseaux sociaux.",
    tags: ["Spot vidéo", "Print & display", "Réseaux sociaux"],
    type: "video",
    youtubeId: "7KosqdnyWXk",
    showOnHome: true,
  },
  {
    slug: "arise-mali",
    title: "ARISE / Keneya Yiriwali (Mali)",
    category: "ONG · Santé publique",
    description:
      "Site de présentation du programme de santé — conception UX/UI et développement sur mesure pour une double audience bailleurs et terrain.",
    tags: ["Site web", "UX/UI Design", "Développement sur mesure"],
    type: "website",
    externalUrl: "https://arisekeneya.org/",
    coverFile: "images/site/Siteweb_Arise.jpg",
    showOnHome: true,
  },
  {
    slug: "niger-emploi",
    title: "Niger Emploi — Spot publicitaire",
    category: "Digital · Emploi",
    description:
      "Spot dynamique multi-formats pour la principale plateforme d'offres d'emploi du Niger.",
    tags: ["Spot vidéo", "Multi-formats", "Motion design"],
    type: "video",
    youtubeId: "1UfF72OEsmM",
    showOnHome: true,
  },
  {
    slug: "ansi",
    title: "ANSI — Table ronde des bailleurs, Paris",
    category: "Institution publique",
    description:
      "Spot institutionnel haute exigence, projeté lors de la table ronde internationale pour la transformation numérique du Niger.",
    tags: ["Film institutionnel", "Diffusion internationale"],
    type: "video",
    youtubeId: "NjAKRQmZIbQ",
    showOnHome: true,
  },
  {
    slug: "cipmen",
    title: "CIPMEN — Film entrepreneuriat",
    category: "Entrepreneuriat · Niger",
    description:
      "Film documentaire sur les parcours d'entrepreneurs accompagnés par le centre d'incubation nigérien.",
    tags: ["Film documentaire", "Tournage Niger"],
    type: "video",
    youtubeId: "7e2KbO8m21Q",
    showOnHome: true,
  },
  {
    slug: "complait",
    title: "COMPLAIT — Spot publicitaire",
    category: "Communication · Spot",
    description:
      "Spot court et percutant conçu et produit de A à Z — concept, tournage, montage et motion design.",
    tags: ["Spot vidéo", "Motion design"],
    type: "video",
    youtubeId: "_AplCctINfE",
    showOnHome: true,
  },
  {
    slug: "2scale-snv",
    title: "2Scale / SNV — Success Story",
    category: "Agribusiness · ONG",
    description:
      "Film de success story pour le programme d'agribusiness inclusif SNV, aux standards de reporting bailleurs internationaux.",
    tags: ["Success story", "Terrain Niger", "Bailleurs"],
    type: "video",
    youtubeId: "QhqzRDhcfck",
    showOnHome: true,
  },
  {
    slug: "aet",
    title: "AET — Projet PISCCA, Niamey",
    category: "Social · Genre · Niger",
    description:
      "Retour vidéo sur le plaidoyer mené auprès de 50 filles-mères et mères célibataires — débats télévisés, radios communautaires en haoussa, société civile et autorités locales.",
    tags: ["Film documentaire", "Plaidoyer", "Droits des femmes"],
    type: "video",
    youtubeId: "KPwU07osF80",
    showOnHome: true,
  },
  {
    slug: "cptp-catalogue",
    title: "CPTP — Catalogue des formations 2026",
    category: "Institution publique · Formation",
    description:
      "Conception graphique et mise en page du catalogue annuel des formations du Centre de Perfectionnement des Travaux Publics de Niamey — direction artistique complète, de la couverture au dernier module.",
    tags: ["Design graphique", "Mise en page", "Catalogue institutionnel"],
    type: "pdf",
    coverFile: "images/site/catalogue-cptp-cover.webp",
    pdfFile: "documents/catalogue-formations-cptp-2026.pdf",
    showOnHome: false,
  },
];
