import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { fr } from "@payloadcms/translations/languages/fr";
import sharp from "sharp";
import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Realisations } from "./collections/Realisations";
import { onInit } from "./seed/onInit";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

export default buildConfig({
  serverURL,
  secret: process.env.PAYLOAD_SECRET || "",
  admin: {
    user: Users.slug,
    theme: "light",
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: " — Admin STRATETIC",
      robots: { index: false, follow: false },
    },
    components: {
      graphics: {
        Logo: "/components/admin/Logo#Logo",
        Icon: "/components/admin/Icon#Icon",
      },
    },
  },
  collections: [Realisations, Media, Users],
  i18n: { supportedLanguages: { fr }, fallbackLanguage: "fr" },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || `file:${path.resolve(process.cwd(), "data/stratetic.db")}`,
    },
    wal: true,
  }),
  // API REST seulement : GraphQL n'est pas utilisé (surface d'attaque en moins).
  graphQL: { disable: true },
  cors: [serverURL],
  csrf: [serverURL],
  sharp,
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  onInit,
});
