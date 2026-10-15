/**
 * Envoi des documents par e-mail.
 *
 * Deux modes (config/settings.json → email.mode) :
 *   - "smtp"   : envoi direct avec le PDF en pièce jointe (nodemailer).
 *                Le mot de passe n'est jamais stocké dans settings.json :
 *                il est lu dans la variable SMTP_PASS (fichier .env).
 *   - "mailto" : l'interface ouvre la messagerie locale et télécharge le PDF
 *                (mailto ne permet pas de joindre un fichier).
 */
import nodemailer from 'nodemailer';
import { formatDateLong, formatMoney } from '../../shared/format.js';

/** Remplace les jetons {TITLE} {NUMBER} {AMOUNT} {DUE} {CLIENT} {TITLE_LOWER}. */
export function fillTemplate(text, doc, settings) {
  const cur = settings.currencies.find((c) => c.code === doc.currency) || settings.currencies[0];
  const title = doc.type === 'proforma' ? 'Facture proforma' : 'Facture';
  return String(text || '')
    .replaceAll('{TITLE}', title)
    .replaceAll('{TITLE_LOWER}', title.toLowerCase())
    .replaceAll('{NUMBER}', doc.number || '')
    .replaceAll('{AMOUNT}', formatMoney(doc.totals?.netToPay ?? 0, cur).replace(/ /g, ' '))
    .replaceAll('{DUE}', formatDateLong(doc.dueDate))
    .replaceAll('{CLIENT}', doc.client?.name || '');
}

export function smtpStatus(settings) {
  const s = settings.email?.smtp || {};
  return {
    mode: settings.email?.mode || 'mailto',
    configured: !!(s.host && s.user && process.env.SMTP_PASS),
    passwordSet: !!process.env.SMTP_PASS,
  };
}

export async function sendDocumentMail({ settings, doc, pdf, to, cc, subject, body }) {
  const s = settings.email.smtp;
  if (!smtpStatus(settings).configured) {
    throw Object.assign(new Error('SMTP non configuré : renseignez email.smtp dans les paramètres et SMTP_PASS dans le fichier .env.'), { status: 400 });
  }
  const transport = nodemailer.createTransport({
    host: s.host,
    port: Number(s.port) || 465,
    secure: s.secure !== false,
    auth: { user: s.user, pass: process.env.SMTP_PASS },
  });
  const info = await transport.sendMail({
    from: s.from || s.user,
    to,
    cc: cc || undefined,
    subject,
    text: body,
    attachments: [{ filename: `${doc.number}.pdf`, content: pdf, contentType: 'application/pdf' }],
  });
  return { messageId: info.messageId, accepted: info.accepted };
}
