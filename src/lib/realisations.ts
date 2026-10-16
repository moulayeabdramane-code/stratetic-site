import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Media, Realisation } from "@/payload-types";
import { youTubeThumbnail } from "@/lib/youtube";
import { REALISATIONS_TAG } from "@/collections/hooks/revalidate";

/** Vue d'une réalisation pour le site : découple les composants de Payload. */
export type RealisationView = {
  slug: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  type: "video" | "website" | "pdf";
  youtubeId?: string;
  externalUrl?: string;
  pdfUrl?: string;
  /** Couverture résolue : image envoyée, sinon miniature YouTube. */
  coverUrl: string;
  coverAlt: string;
  showOnHome: boolean;
};

function asMedia(value: number | Media | null | undefined): Media | null {
  return value && typeof value === "object" ? value : null;
}

export function toView(doc: Realisation): RealisationView | null {
  const cover = asMedia(doc.cover);
  const pdf = asMedia(doc.pdf);
  const coverUrl =
    cover?.sizes?.card?.url ||
    cover?.url ||
    (doc.youtubeId ? youTubeThumbnail(doc.youtubeId) : null);
  // Un projet sans visuel ne peut pas s'afficher proprement : on l'écarte.
  if (!coverUrl) return null;

  return {
    slug: doc.slug || String(doc.id),
    title: doc.title,
    category: doc.category ?? "",
    description: doc.description,
    tags: (doc.tags ?? []).map((tag) => tag.label),
    type: doc.type,
    youtubeId: doc.youtubeId ?? undefined,
    externalUrl: doc.externalUrl ?? undefined,
    pdfUrl: pdf?.url ?? undefined,
    coverUrl,
    coverAlt: cover?.alt || doc.title,
    showOnHome: Boolean(doc.showOnHome),
  };
}

async function fetchRealisations(): Promise<RealisationView[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "realisations",
    where: { _status: { equals: "published" } },
    sort: "_order",
    depth: 1,
    pagination: false,
  });
  return docs.map(toView).filter((view): view is RealisationView => view !== null);
}

/** Tous les projets publiés, dans l'ordre de l'admin. Invalidé par les hooks Payload. */
export const getRealisations = unstable_cache(fetchRealisations, ["realisations"], {
  tags: [REALISATIONS_TAG],
});

/** Projets publiés cochés « Afficher sur l'accueil ». */
export async function getHomeRealisations(): Promise<RealisationView[]> {
  return (await getRealisations()).filter((project) => project.showOnHome);
}
