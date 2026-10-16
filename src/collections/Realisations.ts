import type { CollectionConfig } from "payload";
import { extractYouTubeId, isYouTubeId } from "../lib/youtube";
import { slugify } from "../lib/slug";
import { authenticated } from "./access";
import { revalidateAfterChange, revalidateAfterDelete } from "./hooks/revalidate";

export const Realisations: CollectionConfig = {
  slug: "realisations",
  labels: { singular: "Réalisation", plural: "Réalisations" },
  // Ordre par glisser-déposer (champ _order), utilisé par l'accueil et /realisations.
  orderable: true,
  versions: { drafts: true },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "type", "showOnHome", "_status"],
    group: "Contenu",
  },
  access: {
    // Public : uniquement les projets publiés. Admin : tout.
    read: ({ req: { user } }) => (user ? true : { _status: { equals: "published" } }),
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: "title", type: "text", required: true, label: "Titre" },
    {
      name: "slug",
      type: "text",
      unique: true,
      index: true,
      label: "Identifiant d'URL",
      admin: {
        position: "sidebar",
        description: "Ancre /realisations#… — généré depuis le titre si vide.",
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (typeof value === "string" && value.trim()) return slugify(value);
            return typeof data?.title === "string" ? slugify(data.title) : value;
          },
        ],
      },
    },
    { name: "category", type: "text", label: "Catégorie", admin: { description: "ex. Énergie · Privé" } },
    { name: "description", type: "textarea", required: true, label: "Description" },
    {
      name: "tags",
      type: "array",
      label: "Tags",
      labels: { singular: "Tag", plural: "Tags" },
      fields: [{ name: "label", type: "text", required: true, label: "Tag" }],
    },
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: "video",
      label: "Type de projet",
      options: [
        { label: "Vidéo (YouTube)", value: "video" },
        { label: "Site web", value: "website" },
        { label: "Document PDF", value: "pdf" },
      ],
    },
    {
      name: "youtubeId",
      type: "text",
      label: "Vidéo YouTube",
      admin: {
        condition: (_, siblingData) => siblingData?.type === "video",
        description: "Collez l'URL YouTube complète : l'identifiant est extrait automatiquement.",
      },
      hooks: {
        beforeValidate: [
          ({ value }) => (typeof value === "string" ? (extractYouTubeId(value) ?? value.trim()) : value),
        ],
      },
      validate: (value: string | null | undefined, { siblingData }: { siblingData: { type?: string } }) => {
        if (siblingData?.type !== "video") return true;
        if (!value) return "Requis pour un projet vidéo.";
        return isYouTubeId(value) || "URL ou identifiant YouTube invalide.";
      },
    },
    {
      name: "externalUrl",
      type: "text",
      label: "Adresse du site",
      admin: { condition: (_, siblingData) => siblingData?.type === "website" },
      validate: (value: string | null | undefined, { siblingData }: { siblingData: { type?: string } }) => {
        if (siblingData?.type !== "website") return true;
        if (!value) return "Requis pour un projet site web.";
        return /^https?:\/\/\S+$/i.test(value) || "Adresse invalide (doit commencer par https://).";
      },
    },
    {
      name: "pdf",
      type: "upload",
      relationTo: "media",
      label: "Fichier PDF",
      filterOptions: { mimeType: { equals: "application/pdf" } },
      admin: { condition: (_, siblingData) => siblingData?.type === "pdf" },
      validate: (value: unknown, { siblingData }: { siblingData: { type?: string } }) =>
        siblingData?.type !== "pdf" || Boolean(value) || "Requis pour un projet PDF.",
    },
    {
      name: "cover",
      type: "upload",
      relationTo: "media",
      label: "Image de couverture",
      filterOptions: { mimeType: { contains: "image/" } },
      admin: {
        description: "Optionnelle pour une vidéo (la miniature YouTube est utilisée par défaut).",
      },
      validate: (value: unknown, { siblingData }: { siblingData: { type?: string } }) =>
        siblingData?.type === "video" || Boolean(value) || "Image de couverture requise.",
    },
    {
      name: "showOnHome",
      type: "checkbox",
      defaultValue: false,
      label: "Afficher sur l'accueil",
      admin: { position: "sidebar" },
    },
  ],
};
