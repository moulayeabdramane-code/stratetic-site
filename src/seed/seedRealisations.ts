import path from "path";
import type { Payload } from "payload";
import { SEED_PROJECTS } from "./realisations-data";

/**
 * Import initial, idempotent : ne fait rien si la collection a déjà des documents.
 * Création séquentielle → le hook « orderable » attribue l'ordre d'affichage.
 */
export async function seedRealisations(payload: Payload): Promise<void> {
  const { totalDocs } = await payload.count({ collection: "realisations" });
  if (totalDocs > 0) return;

  const publicDir = path.resolve(process.cwd(), "public");
  const context = { disableRevalidate: true };

  for (const project of SEED_PROJECTS) {
    const cover = project.coverFile
      ? await payload.create({
          collection: "media",
          data: { alt: project.title },
          filePath: path.join(publicDir, project.coverFile),
          context,
        })
      : null;
    const pdf = project.pdfFile
      ? await payload.create({
          collection: "media",
          data: { alt: `${project.title} (PDF)` },
          filePath: path.join(publicDir, project.pdfFile),
          context,
        })
      : null;

    await payload.create({
      collection: "realisations",
      context,
      data: {
        title: project.title,
        slug: project.slug,
        category: project.category,
        description: project.description,
        tags: project.tags.map((label) => ({ label })),
        type: project.type,
        youtubeId: project.youtubeId,
        externalUrl: project.externalUrl,
        cover: cover?.id,
        pdf: pdf?.id,
        showOnHome: project.showOnHome,
        _status: "published",
      },
    });
  }

  payload.logger.info(`[seed] ${SEED_PROJECTS.length} réalisations importées.`);
}
