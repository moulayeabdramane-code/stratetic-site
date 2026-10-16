import type { CollectionConfig } from "payload";
import { authenticated } from "./access";

export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Administrateur", plural: "Administrateurs" },
  admin: { useAsTitle: "email", group: "Réglages" },
  // 5 essais ratés → compte verrouillé 10 minutes.
  auth: { maxLoginAttempts: 5, lockTime: 10 * 60 * 1000 },
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [],
};
