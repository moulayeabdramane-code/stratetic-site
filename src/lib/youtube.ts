// Utilitaires YouTube sans dépendance — utilisés par l'admin (validation) et le site.
const ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function isYouTubeId(value: string): boolean {
  return ID_RE.test(value);
}

/**
 * Extrait l'ID d'une URL YouTube (watch, youtu.be, shorts, embed, nocookie)
 * ou renvoie l'ID tel quel. `null` si rien d'exploitable.
 */
export function extractYouTubeId(input: string): string | null {
  const value = input.trim();
  if (ID_RE.test(value)) return value;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.slice(1).split("/")[0] ?? null;
  } else if (host === "youtube-nocookie.com" || host.endsWith("youtube.com")) {
    id = url.searchParams.get("v");
    if (!id) {
      const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      id = match?.[1] ?? null;
    }
  }
  return id && ID_RE.test(id) ? id : null;
}

/** Miniature générée par YouTube pour toute vidéo (hqdefault existe toujours). */
export function youTubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
