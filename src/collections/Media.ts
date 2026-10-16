import path from "path";
import type { CollectionConfig } from "payload";
import { authenticated } from "./access";
import { revalidateAfterChange, revalidateAfterDelete } from "./hooks/revalidate";

// Prod : /data/media (volume Coolify, défini dans le Dockerfile). Dev : ./data/media.
const MEDIA_DIR = process.env.MEDIA_DIR || path.resolve(process.cwd(), "data/media");

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Média", plural: "Médias" },
  admin: { useAsTitle: "alt", group: "Contenu" },
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    // Une couverture remplacée change d'URL : on rafraîchit les réalisations.
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      label: "Texte alternatif / description",
    },
  ],
  upload: {
    staticDir: MEDIA_DIR,
    mimeTypes: ["image/*", "application/pdf"],
    adminThumbnail: "thumbnail",
    imageSizes: [
      { name: "thumbnail", width: 400, formatOptions: { format: "webp", options: { quality: 80 } } },
      { name: "card", width: 960, formatOptions: { format: "webp", options: { quality: 82 } } },
      { name: "large", width: 1920, formatOptions: { format: "webp", options: { quality: 85 } } },
    ],
  },
};
