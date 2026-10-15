/**
 * Facture d'exemple (client fictif) reprenant la structure du modèle fourni :
 * même nombre de lignes d'adresse, une ligne d'article avec détail sur deux
 * lignes, TVA 0 %. Sert aux exemples (npm run example) et aux tests du rendu.
 */
export const cipmenInvoice = {
  type: 'facture',
  number: 'FAC-2026-044',
  status: 'envoyee',
  issueDate: '2026-10-14',
  dueDate: '2026-11-13',
  currency: 'XOF',
  exchangeRate: 1,
  client: {
    name: 'CLIENT EXEMPLE',
    addressLines: [
      'Organisation fictive de démonstration',
      'pour les entreprises du Niger',
      'Avenue de la République, quartier Plateau',
      'BP 10 000 Niamey, Niger',
    ],
    taxIds: [{ label: 'NIF', value: '00000' }],
  },
  lines: [
    {
      designation: "Forfait de déplacement de l'équipe STRATETIC — Septembre 2026",
      detail: 'Convention de partenariat du 25 août 2026, article 3.1 (exemple)',
      quantity: 1,
      unitPrice: 100000,
      discount: 0,
      vatRate: 0,
    },
  ],
  globalDiscount: { type: 'percent', value: 0 },
  deposit: 0,
  conditions: "Paiement à réception de facture.\nVirement bancaire à l'ordre d'Agence STRATETIC.",
  period: 'septembre 2026',
  showQr: false,
};

/** Alias explicite (le nom historique est conservé pour les scripts existants). */
export const exampleInvoice = cipmenInvoice;
