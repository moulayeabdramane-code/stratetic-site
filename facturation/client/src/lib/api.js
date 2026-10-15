/** Client HTTP de l'API locale. Les erreurs serveur sont remontées avec leur message. */
async function request(method, url, body) {
  const res = await fetch(`api${url}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  if (res.status === 204) return null;
  const type = res.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await res.json() : await res.text();
  // Session expirée ou changement de mot de passe exigé : l'application affiche l'écran adapté
  if (res.status === 401 && data?.login) window.dispatchEvent(new Event('auth:required'));
  if (res.status === 403 && data?.mustChangePassword) window.dispatchEvent(new Event('auth:mustchange'));
  if (!res.ok) {
    const err = new Error(data?.error || `Erreur ${res.status}`);
    err.errors = data?.errors;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (url) => request('GET', url),
  post: (url, body = {}) => request('POST', url, body),
  put: (url, body) => request('PUT', url, body),
  del: (url) => request('DELETE', url),
  /** Aperçu HTML d'un brouillon (non enregistré). */
  preview: async (doc) => {
    const res = await fetch('api/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(doc) });
    return res.text();
  },
};

/** Construit une query string en ignorant les valeurs vides. */
export const qs = (params) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== '' && v != null) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : '';
};

/** Déclenche le téléchargement d'un fichier servi par l'API. */
export function download(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
