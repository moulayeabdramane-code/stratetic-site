import type { Access } from "payload";

/** Réservé à un utilisateur connecté (l'administrateur). */
export const authenticated: Access = ({ req: { user } }) => Boolean(user);
