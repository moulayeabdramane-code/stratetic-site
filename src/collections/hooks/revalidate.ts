import { revalidateTag } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  RequestContext,
} from "payload";

/** Tag du cache des réalisations lu par le site (src/lib/realisations.ts). */
export const REALISATIONS_TAG = "realisations";

// L'import initial tourne au démarrage, hors requête : revalidateTag y lèverait.
// Il passe donc `context.disableRevalidate`.
function revalidate(context: RequestContext) {
  if (context.disableRevalidate) return;
  revalidateTag(REALISATIONS_TAG, { expire: 0 });
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({ doc, context }) => {
  revalidate(context);
  return doc;
};

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc, context }) => {
  revalidate(context);
  return doc;
};
