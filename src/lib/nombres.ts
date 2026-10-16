// Nombres en toutes lettres pour les titres éditoriaux (« Huit projets, huit univers »).
const MOTS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept",
  "dix-huit", "dix-neuf", "vingt",
];

/** 0–20 en lettres ; au-delà, les chiffres. */
export function nombreEnLettres(n: number): string {
  return Number.isInteger(n) && n >= 0 && n < MOTS.length ? MOTS[n] : String(n);
}

/** « Huit projets, huit univers » — accord au singulier pour 1. */
export function titreProjets(n: number): string {
  const mot = nombreEnLettres(n);
  const majuscule = mot.charAt(0).toUpperCase() + mot.slice(1);
  return `${majuscule} ${n === 1 ? "projet" : "projets"}, ${mot} univers`;
}
