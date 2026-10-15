/** URL (relative au chemin de base) du logo : livré avec le gabarit ou téléversé. */
export const logoUrl = (logo = 'assets/logo.png') => (logo.startsWith('uploads/') ? logo : `template/${logo}`);
