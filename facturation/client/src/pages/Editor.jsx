/**
 * Éditeur de document.
 *  - Brouillon : formulaire + aperçu en direct + sauvegarde automatique.
 *  - Document émis : lecture seule, actions (PDF, e-mail, paiements, conversion,
 *    duplication, annulation) et journal de traçabilité.
 */
import { useEffect, useRef, useState } from 'react';
import { api, download } from '../lib/api.js';
import { navigate, useDebounced } from '../lib/hooks.js';
import { formatDateLong, formatDateShort, formatDateTime } from '../../../shared/format.js';
import Icon from '../components/Icon.jsx';
import Preview from '../components/Preview.jsx';
import DocumentForm from '../components/DocumentForm.jsx';
import { EmailDialog, PaymentDialog } from '../components/Dialogs.jsx';
import { Money, StatusBadge, useConfirm, useSettings, useToast } from '../components/ui.jsx';

const ACTIONS = {
  'création': 'Création', modification: 'Modification', 'émission': 'Émission', envoi: 'Envoi', paiement: 'Paiement',
  'paiement complet': 'Paiement complet', 'paiement supprimé': 'Paiement supprimé', annulation: 'Annulation',
  conversion: 'Conversion en facture', duplication: 'Duplication',
};

export default function Editor({ id, newType }) {
  const toast = useToast();
  const ctx = useSettings();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState(null);

  // Création d'un nouveau brouillon, puis redirection vers son URL
  useEffect(() => {
    if (!newType) return;
    api.post('/documents', { type: newType })
      .then((d) => window.location.replace(`#/documents/${d.id}`))
      .catch((e) => setError(e.message));
  }, [newType]);

  const load = async () => {
    try { setDoc(await api.get(`/documents/${id}`)); } catch (e) { setError(e.message); }
  };
  useEffect(() => { if (id) load(); }, [id]);

  if (error) return <div className="content"><div className="banner danger">{error}</div></div>;
  if (!doc) return <div className="empty-state">Chargement…</div>;
  return doc.number || doc.status !== 'brouillon'
    ? <IssuedView doc={doc} reload={load} toast={toast} ctx={ctx} />
    : <DraftView initial={doc} onIssued={(d) => { setDoc(d); ctx.reload(); }} toast={toast} />;
}

// ---------------------------------------------------------------------------
// Brouillon
// ---------------------------------------------------------------------------

function DraftView({ initial, onIssued, toast }) {
  const [doc, setDoc] = useState(initial);
  const [save, setSave] = useState({ state: 'saved', at: initial.updatedAt });
  const [html, setHtml] = useState(null);
  const [tab, setTab] = useState('form');
  const [confirm, confirmDialog] = useConfirm();
  const { nextNumbers } = useSettings();
  const first = useRef(true);

  // Sauvegarde automatique (1 s après la dernière frappe)
  const debounced = useDebounced(doc, 1000);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setSave({ state: 'saving' });
    api.put(`/documents/${doc.id}`, debounced)
      .then((d) => setSave({ state: 'saved', at: d.updatedAt }))
      .catch((e) => setSave({ state: 'error', message: e.message }));
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  // Aperçu en direct
  const previewDoc = useDebounced(doc, 350);
  useEffect(() => { api.preview(previewDoc).then(setHtml); }, [previewDoc]);

  const change = (d) => { setDoc(d); setSave({ state: 'pending' }); };
  const label = doc.type === 'proforma' ? 'proforma' : 'facture';

  const issue = async () => {
    const ok = await confirm({
      title: `Émettre la ${label}`,
      message: `Le prochain numéro (${nextNumbers[doc.type]}) sera attribué définitivement. Le document ne pourra plus être modifié ni supprimé, seulement annulé.`,
      confirmLabel: 'Émettre',
    });
    if (!ok) return;
    try {
      await api.put(`/documents/${doc.id}`, doc);
      const d = await api.post(`/documents/${doc.id}/issue`);
      toast(`${label === 'facture' ? 'Facture' : 'Proforma'} ${d.number} émise`);
      onIssued(d);
    } catch (e) {
      toast(e.errors?.length ? e.errors.join(' ') : e.message, 'error');
    }
  };
  const remove = async () => {
    if (!(await confirm({ title: 'Supprimer le brouillon', message: 'Ce brouillon sera définitivement supprimé.', confirmLabel: 'Supprimer', danger: true }))) return;
    await api.del(`/documents/${doc.id}`);
    toast('Brouillon supprimé');
    navigate('/');
  };

  return (
    <>
      <div className="page-head">
        <a className="btn ghost icon" href="#/" aria-label="Retour"><Icon name="back" /></a>
        <div>
          <h1>{doc.type === 'proforma' ? 'Proforma' : 'Facture'} — brouillon</h1>
          <SaveState save={save} />
        </div>
        <span className="spacer" />
        <button className="btn danger" onClick={remove}><Icon name="trash" />Supprimer</button>
        <button className="btn primary" onClick={issue}><Icon name="check" />Émettre la {label}</button>
      </div>
      <div className="content">
        <div className="mobile-tabs seg" role="tablist">
          <button className={tab === 'form' ? 'on' : ''} onClick={() => setTab('form')}>Saisie</button>
          <button className={tab === 'preview' ? 'on' : ''} onClick={() => setTab('preview')}>Aperçu</button>
        </div>
        <div className="editor" data-tab={tab}>
          <div className="form-pane"><DocumentForm doc={doc} onChange={change} /></div>
          <div className="preview-pane">
            {html ? <Preview html={html} /> : <div className="card empty-state">Préparation de l'aperçu…</div>}
            <p className="small muted" style={{ marginTop: 8 }}>Aperçu identique au PDF. Le numéro sera attribué à l'émission.</p>
          </div>
        </div>
      </div>
      {confirmDialog}
    </>
  );
}

function SaveState({ save }) {
  if (save.state === 'error') return <span className="save-state error"><span className="dot" />Échec de la sauvegarde : {save.message}</span>;
  if (save.state === 'pending' || save.state === 'saving') return <span className="save-state pending"><span className="dot" />Enregistrement…</span>;
  return <span className="save-state"><span className="dot" />Brouillon enregistré {save.at ? `à ${formatDateTime(save.at).slice(11)}` : ''}</span>;
}

// ---------------------------------------------------------------------------
// Document émis
// ---------------------------------------------------------------------------

function IssuedView({ doc, reload, toast, ctx }) {
  const [dialog, setDialog] = useState(null);
  const [audit, setAudit] = useState([]);
  const [confirm, confirmDialog] = useConfirm();
  useEffect(() => { api.get(`/documents/${doc.id}/audit`).then(setAudit); }, [doc.id, doc.updatedAt, doc.status]);

  const act = async (fn, msg) => {
    try { const r = await fn(); if (msg) toast(msg); return r; } catch (e) { toast(e.message, 'error'); return null; }
  };
  const isFacture = doc.type === 'facture';
  const open = ['emise', 'envoyee'].includes(doc.status);

  const convert = async () => {
    if (!(await confirm({ title: 'Convertir en facture', message: `Une facture définitive sera émise avec le prochain numéro (${ctx.nextNumbers.facture}), datée d'aujourd'hui, en reprenant toutes les données de ${doc.number || 'cette proforma'}.`, confirmLabel: 'Convertir' }))) return;
    const f = await act(() => api.post(`/documents/${doc.id}/convert`));
    if (f) { toast(`Facture ${f.number} émise`); ctx.reload(); navigate(`/documents/${f.id}`); }
  };
  const duplicate = async (type) => {
    const d = await act(() => api.post(`/documents/${doc.id}/duplicate`, { type }), 'Copie créée (brouillon)');
    if (d) navigate(`/documents/${d.id}`);
  };
  const cancel = async () => {
    const reason = await confirm({ title: `Annuler ${doc.number}`, message: 'Le document conservera son numéro (aucun trou dans la numérotation) et apparaîtra comme annulé.', input: "Motif de l'annulation", confirmLabel: 'Annuler le document', danger: true });
    if (reason) { await act(() => api.post(`/documents/${doc.id}/cancel`, { reason }), 'Document annulé'); reload(); }
  };
  const markSent = async () => { await act(() => api.post(`/documents/${doc.id}/sent`, { via: 'manuel' }), 'Marqué comme envoyé'); reload(); };
  const delPayment = async (p) => {
    if (!(await confirm({ title: 'Supprimer le paiement', message: `Supprimer le paiement du ${formatDateShort(p.date)} ?`, danger: true, confirmLabel: 'Supprimer' }))) return;
    await act(() => api.del(`/documents/${doc.id}/payments/${p.id}`), 'Paiement supprimé'); reload();
  };

  return (
    <>
      <div className="page-head">
        <a className="btn ghost icon" href="#/" aria-label="Retour"><Icon name="back" /></a>
        <div>
          <h1><span className="doc-num">{doc.number || 'Brouillon'}</span> <StatusBadge status={doc.displayStatus} label={doc.statusLabel} /></h1>
          <div className="sub">{doc.type === 'proforma' ? 'Proforma' : 'Facture'} · {doc.client?.name} · émise le {formatDateLong(doc.issueDate)}</div>
        </div>
        <span className="spacer" />
        {doc.number && <>
          <a className="btn" href={`api/documents/${doc.id}/pdf`} target="_blank" rel="noreferrer"><Icon name="print" />Imprimer</a>
          <button className="btn" onClick={() => download(`api/documents/${doc.id}/pdf?download=1`)}><Icon name="download" />PDF</button>
        </>}
        {doc.number && doc.status !== 'annulee' && <button className="btn primary" onClick={() => setDialog('email')}><Icon name="mail" />Envoyer</button>}
      </div>
      <div className="content">
        <div className="editor">
          <div className="stack">
            {doc.status === 'annulee' && (
              <div className="banner warning"><div><strong>Document annulé le {formatDateShort(doc.cancelledAt)}</strong>Motif : {doc.cancelReason}</div></div>
            )}
            {doc.displayStatus === 'en_retard' && (
              <div className="banner danger" role="alert"><Icon name="alert" size={20} /><div><strong>Échéance dépassée depuis le {formatDateLong(doc.dueDate)}</strong>Solde restant : <Money value={doc.balance} currency={doc.currency} /></div></div>
            )}
            {doc.convertedToId && (
              <div className="banner info"><div>Convertie en facture <a href={`#/documents/${doc.convertedToId}`} className="doc-num">{doc.convertedToNumber}</a>.</div></div>
            )}
            {doc.sourceId && (
              <div className="banner info"><div>Issue de la proforma <a href={`#/documents/${doc.sourceId}`} className="doc-num">{doc.sourceNumber || 'brouillon'}</a>.</div></div>
            )}

            <section className="card card-pad">
              <div className="section-title"><span className="eyebrow">Actions</span></div>
              <div className="row-flex">
                {doc.status === 'emise' && <button className="btn" onClick={markSent}><Icon name="send" />Marquer envoyée</button>}
                {isFacture && open && <button className="btn accent" onClick={() => setDialog('payment')}><Icon name="money" />Enregistrer un paiement</button>}
                {!isFacture && !['convertie', 'annulee'].includes(doc.status) && <button className="btn accent" onClick={convert}><Icon name="repeat" />Convertir en facture</button>}
                <button className="btn" onClick={() => duplicate(doc.type)}><Icon name="copy" />Dupliquer</button>
                <button className="btn" onClick={() => duplicate(isFacture ? 'proforma' : 'facture')}><Icon name="copy" />Copier en {isFacture ? 'proforma' : 'facture'}</button>
                {doc.number && !['annulee', 'convertie', 'payee'].includes(doc.status) && <button className="btn danger" onClick={cancel}><Icon name="ban" />Annuler</button>}
              </div>
              <div className="locked-note small muted" style={{ marginTop: 12 }}>
                <Icon name="lock" size={14} /> Document émis : le contenu et le numéro sont verrouillés.
              </div>
            </section>

            <section className="card card-pad">
              <div className="section-title"><span className="eyebrow">Montants</span></div>
              <div className="totals-box" style={{ margin: 0, width: '100%' }}>
                <div className="r"><span>Total HT</span><Money value={doc.totals?.totalHT} currency={doc.currency} /></div>
                <div className="r"><span>TVA</span><Money value={doc.totals?.totalVAT} currency={doc.currency} /></div>
                {doc.totals?.deposit > 0 && <div className="r"><span>Acompte déduit</span><span>−<Money value={doc.totals.deposit} currency={doc.currency} /></span></div>}
                <div className="r net"><span>NET À PAYER</span><Money value={doc.totals?.netToPay} currency={doc.currency} /></div>
                {isFacture && <>
                  <div className="r" style={{ marginTop: 8 }}><span>Déjà payé</span><Money value={doc.paid} currency={doc.currency} /></div>
                  <div className="r"><strong>Solde</strong><strong><Money value={doc.balance} currency={doc.currency} /></strong></div>
                </>}
              </div>
            </section>

            {isFacture && doc.payments.length > 0 && (
              <section className="card">
                <div className="card-head"><span className="eyebrow">Paiements</span></div>
                <table className="table">
                  <tbody>
                    {doc.payments.map((p) => (
                      <tr key={p.id} style={{ cursor: 'default' }}>
                        <td className="num">{formatDateShort(p.date)}</td>
                        <td>{p.method}{p.note ? <span className="muted"> — {p.note}</span> : ''}</td>
                        <td className="right"><Money value={p.amount} currency={doc.currency} /></td>
                        <td className="right"><button className="btn ghost icon" aria-label="Supprimer le paiement" onClick={() => delPayment(p)}><Icon name="trash" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            <section className="card card-pad">
              <div className="section-title"><span className="eyebrow">Traçabilité</span></div>
              <ul className="timeline">
                {audit.map((a) => (
                  <li key={a.id}>
                    <span className="num muted">{formatDateTime(a.at)}</span>
                    <span>{ACTIONS[a.action] || a.action}{a.details && <span className="muted"> — {describe(a.details)}</span>}{a.user && <span className="muted"> · {a.user}</span>}</span>
                  </li>
                ))}
              </ul>
              {doc.signature && <p className="small muted" style={{ marginBottom: 0 }}>Code de vérification : <span className="doc-num">{doc.signature}</span></p>}
            </section>
          </div>
          <div className="preview-pane">
            <Preview src={`api/documents/${doc.id}/preview?v=${encodeURIComponent(doc.updatedAt)}`} />
          </div>
        </div>
      </div>
      {dialog === 'email' && <EmailDialog doc={doc} onClose={() => setDialog(null)} onDone={() => { setDialog(null); reload(); }} />}
      {dialog === 'payment' && <PaymentDialog doc={doc} onClose={() => setDialog(null)} onDone={() => { setDialog(null); reload(); }} />}
      {confirmDialog}
    </>
  );
}

function describe(d) {
  return Object.entries(d).map(([k, v]) => {
    const keys = { number: 'n°', from: 'depuis', facture: 'facture', reason: 'motif', amount: 'montant', date: 'date', method: 'mode', via: 'via', to: 'à', type: 'type', mode: 'mode' };
    return `${keys[k] || k} ${v}`;
  }).join(', ');
}
