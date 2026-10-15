/** Fenêtres d'action sur un document émis : e-mail, paiement. */
import { useEffect, useState } from 'react';
import { api, download } from '../lib/api.js';
import { todayISO } from '../../../shared/format.js';
import Icon from './Icon.jsx';
import { Field, Modal, useSettings, useToast } from './ui.jsx';

/** Envoi par e-mail : SMTP direct, ou messagerie locale (mailto) + PDF téléchargé. */
export function EmailDialog({ doc, onClose, onDone }) {
  const toast = useToast();
  const [m, setM] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.get(`/documents/${doc.id}/email`).then(setM).catch((e) => toast(e.message, 'error')); }, [doc.id, toast]);
  if (!m) return null;
  const set = (k, v) => setM({ ...m, [k]: v });

  const sendSmtp = async () => {
    setBusy(true);
    try {
      await api.post(`/documents/${doc.id}/email`, { to: m.to, cc: m.cc, subject: m.subject, body: m.body });
      toast(`E-mail envoyé à ${m.to}`);
      onDone();
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  const openMailto = async () => {
    download(`api/documents/${doc.id}/pdf?download=1`);
    const href = `mailto:${encodeURIComponent(m.to)}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`;
    window.location.href = href;
    await api.post(`/documents/${doc.id}/sent`, { via: 'mailto' });
    toast('PDF téléchargé : joignez-le au message ouvert dans votre messagerie.');
    onDone();
  };

  return (
    <Modal title={`Envoyer ${doc.number}`} onClose={onClose} wide footer={<>
      <button className="btn" onClick={onClose}>Fermer</button>
      <button className="btn" onClick={openMailto} disabled={!m.to}><Icon name="mail" />Ouvrir ma messagerie</button>
      <button className="btn primary" onClick={sendSmtp} disabled={!m.to || busy || !m.smtp.configured}
        title={m.smtp.configured ? '' : 'SMTP non configuré (Paramètres > E-mail)'}>
        <Icon name="send" />{busy ? 'Envoi…' : 'Envoyer avec le PDF'}
      </button>
    </>}>
      <div className="stack">
        {!m.smtp.configured && (
          <div className="banner info">
            <div><strong>Envoi direct indisponible</strong>Le serveur SMTP n'est pas configuré. « Ouvrir ma messagerie » télécharge le PDF et prépare le message : il suffit de joindre le fichier.</div>
          </div>
        )}
        <div className="grid-2">
          <Field label="Destinataire"><input type="email" value={m.to} onChange={(e) => set('to', e.target.value)} /></Field>
          <Field label="Copie (facultatif)"><input type="email" value={m.cc || ''} onChange={(e) => set('cc', e.target.value)} /></Field>
        </div>
        <Field label="Objet"><input value={m.subject} onChange={(e) => set('subject', e.target.value)} /></Field>
        <Field label="Message"><textarea rows={8} value={m.body} onChange={(e) => set('body', e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

/** Enregistrement d'un paiement (partiel ou total). */
export function PaymentDialog({ doc, onClose, onDone }) {
  const { settings } = useSettings();
  const toast = useToast();
  const [p, setP] = useState({ date: todayISO(), amount: doc.balance, method: doc.paymentMethod || settings.documents.paymentMethods[0] || '', note: '' });
  const save = async () => {
    try {
      await api.post(`/documents/${doc.id}/payments`, p);
      toast('Paiement enregistré');
      onDone();
    } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <Modal title="Enregistrer un paiement" onClose={onClose} footer={<>
      <button className="btn" onClick={onClose}>Annuler</button>
      <button className="btn primary" onClick={save} disabled={!(Number(p.amount) > 0)}>Enregistrer</button>
    </>}>
      <div className="grid-2">
        <Field label="Date"><input type="date" value={p.date} onChange={(e) => setP({ ...p, date: e.target.value })} /></Field>
        <Field label={`Montant (${doc.currency})`} hint={`solde ${doc.balance}`}>
          <input type="number" min="0" step="any" value={p.amount} onChange={(e) => setP({ ...p, amount: e.target.value })} />
        </Field>
        <Field label="Mode">
          <select value={p.method} onChange={(e) => setP({ ...p, method: e.target.value })}>
            {settings.documents.paymentMethods.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="Référence / note"><input value={p.note} onChange={(e) => setP({ ...p, note: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}
