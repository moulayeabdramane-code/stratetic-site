/** Vérification d'un document à partir du contenu de son QR code. */
import { useState } from 'react';
import { api } from '../lib/api.js';
import { formatDateLong } from '../../../shared/format.js';
import { Field, Money, StatusBadge } from '../components/ui.jsx';

export default function Verify() {
  const [text, setText] = useState('');
  const [r, setR] = useState(null);
  const check = async () => setR(await api.post('/verify', { text }));
  return (
    <>
      <div className="page-head">
        <div><h1>Vérifier un document</h1><div className="sub">Collez le texte lu par un scanner de QR code (téléphone) pour contrôler l'authenticité d'une facture.</div></div>
      </div>
      <div className="content stack" style={{ maxWidth: 760 }}>
        <div className="card card-pad stack">
          <Field label="Contenu du QR code">
            <textarea rows={5} value={text} placeholder={'AGENCE STRATETIC — FAC-2026-045\nDate : 14/10/2026\nMontant : 100 000 FCFA\nCode : 3F9A2C61B0'} onChange={(e) => setText(e.target.value)} />
          </Field>
          <div><button className="btn primary" onClick={check} disabled={!text.trim()}>Vérifier</button></div>
        </div>
        {r && (
          <div className={`banner ${r.valid ? 'success' : 'danger'}`}>
            <div className="verify-result">
              <div>
                <strong>{r.valid ? 'Document authentique' : 'Vérification échouée'}</strong>
                {r.reason && <div>{r.reason}</div>}
                {r.document && (
                  <div style={{ marginTop: 6 }}>
                    <a href={`#/documents/${r.document.id}`} className="doc-num">{r.document.number}</a> — {r.document.client} — {formatDateLong(r.document.issueDate)} — <Money value={r.document.netToPay} currency={r.document.currency} /> <StatusBadge status={r.document.status} label={r.document.statusLabel} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
