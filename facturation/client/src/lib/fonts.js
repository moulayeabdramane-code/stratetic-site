/**
 * Polices de l'interface (Figtree, Jost), servies par le gabarit. Déclarées ici
 * plutôt qu'en CSS pour que leur adresse suive le chemin de base (<base href>).
 */
const FONTS = [
  ['Figtree', 400, 'figtree-latin-400-normal'], ['Figtree', 500, 'figtree-latin-500-normal'],
  ['Figtree', 600, 'figtree-latin-600-normal'], ['Figtree', 700, 'figtree-latin-700-normal'],
  ['Jost', 600, 'jost-latin-600-normal'], ['Jost', 700, 'jost-latin-700-normal'],
];

export function loadFonts() {
  const style = document.createElement('style');
  style.textContent = FONTS.map(([family, weight, file]) => {
    const url = new URL(`template/fonts/${file}.woff2`, document.baseURI).href;
    return `@font-face { font-family: '${family}'; font-weight: ${weight}; font-display: swap; src: url('${url}') format('woff2'); }`;
  }).join('\n');
  document.head.appendChild(style);
}
