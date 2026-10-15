/**
 * Conversion d'un montant en toutes lettres (français, orthographe traditionnelle).
 *
 * Règles appliquées :
 *  - traits d'union entre dizaines et unités (< 100) uniquement ;
 *  - « et » pour 21, 31, 41, 51, 61 et 71 ;
 *  - « cent » et « quatre-vingt » prennent un « s » s'ils sont multipliés et terminent
 *    le nombre, ou s'ils précèdent « million(s) » / « milliard(s) » (noms), mais
 *    pas devant « mille » (adjectif numéral invariable) ;
 *  - « mille » est invariable, « million » et « milliard » s'accordent ;
 *  - « de » s'intercale entre un nombre rond de millions/milliards et la devise
 *    (« un million de francs CFA »).
 */

const UNITS = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
  'dix-sept', 'dix-huit', 'dix-neuf',
];
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

/** 0 – 99. `final` : le mot termine le nombre (accord de « quatre-vingts »). */
function below100(n, final) {
  if (n < 20) return UNITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (t <= 6) {
    if (u === 0) return TENS[t];
    if (u === 1) return `${TENS[t]} et un`;
    return `${TENS[t]}-${UNITS[u]}`;
  }
  if (t === 7) {
    // 70 – 79 : soixante-dix, soixante et onze, soixante-douze…
    if (u === 1) return 'soixante et onze';
    return `soixante-${UNITS[10 + u]}`;
  }
  // 80 – 99
  if (t === 8 && u === 0) return final ? 'quatre-vingts' : 'quatre-vingt';
  const rest = t === 8 ? u : 10 + u;
  return `quatre-vingt-${UNITS[rest]}`;
}

/** 0 – 999. `final` : idem below100, appliqué à « cent » et « quatre-vingt ». */
function below1000(n, final) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts = [];
  if (h > 0) {
    if (h === 1) parts.push('cent');
    else parts.push(`${UNITS[h]} ${r === 0 && final ? 'cents' : 'cent'}`);
  }
  if (r > 0 || h === 0) parts.push(below100(r, final));
  return parts.join(' ');
}

/**
 * Entier positif -> lettres.
 * @param {number} n entier >= 0 (jusqu'à 999 999 999 999)
 */
export function integerToWords(n) {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'zéro';
  const groups = [
    { value: 1e9, singular: 'milliard', plural: 'milliards', noun: true },
    { value: 1e6, singular: 'million', plural: 'millions', noun: true },
    { value: 1e3, singular: 'mille', plural: 'mille', noun: false },
  ];
  const parts = [];
  let rest = n;
  for (const g of groups) {
    const q = Math.floor(rest / g.value);
    rest %= g.value;
    if (q === 0) continue;
    if (!g.noun && q === 1) {
      parts.push('mille');
    } else {
      // Devant un nom (million/milliard), « cents »/« quatre-vingts » s'accordent.
      parts.push(`${below1000(q, g.noun)} ${q > 1 ? g.plural : g.singular}`);
    }
  }
  if (rest > 0) parts.push(below1000(rest, true));
  return parts.join(' ');
}

/**
 * Montant + devise -> lettres, avec majuscule initiale.
 * @param {number} amount
 * @param {{decimals:number, words:{singular:string, plural:string, subSingular?:string, subPlural?:string}}} currency
 * @returns {string} ex. « Cent mille francs CFA »
 */
export function amountToWords(amount, currency) {
  const decimals = currency?.decimals ?? 0;
  const words = currency?.words ?? { singular: 'franc CFA', plural: 'francs CFA' };
  const negative = amount < 0;
  const factor = 10 ** decimals;
  const totalUnits = Math.round(Math.abs(amount) * factor);
  const intPart = Math.floor(totalUnits / factor);
  const subPart = totalUnits % factor;

  let text = integerToWords(intPart);
  const roundMillions = intPart >= 1e6 && intPart % 1e6 === 0;
  text += roundMillions ? ' de ' : ' ';
  text += intPart > 1 ? words.plural : words.singular;

  if (subPart > 0 && words.subSingular) {
    text += ` et ${integerToWords(subPart)} ${subPart > 1 ? words.subPlural : words.subSingular}`;
  }
  if (negative) text = `moins ${text}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
