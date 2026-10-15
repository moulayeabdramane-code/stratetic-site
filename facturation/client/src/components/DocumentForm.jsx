/** Formulaire d'édition d'un brouillon (facture ou proforma). */
import { useCallback } from 'react';
import { api } from '../lib/api.js';
import { computeTotals } from '../../../shared/totals.js';
import { amountToWords } from '../../../shared/numberToWords.js';
import { addDays, formatMoney, formatNumber, formatRate } from '../../../shared/format.js';
import Icon from './Icon.jsx';
import { Autocomplete, Field, useSettings } from './ui.jsx';

const TERMS = [[0, 'À réception'], [15, '15 j'], [30, '30 j'], [45, '45 j'], [60, '60 j']];
const emptyLine = (vat) => ({ designation: '', detail: '', quantity: 1, unitPrice: 0, discount: 0, vatRate: vat });

export default function DocumentForm({ doc, onChange }) {
  const { settings } = useSettings();
  const set = (patch) => onChange({ ...doc, ...patch });
  const setClient = (patch) => set({ client: { ...doc.client, ...patch } });
  const cur = settings.currencies.find((c) => c.code === doc.currency) || settings.currencies[0];
  const totals = computeTotals(doc, cur.decimals);
  const money = (v) => formatMoney(v, cur);

  const setLine = (i, patch) => set({ lines: doc.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
  const moveLine = (i, d) => {
    const lines = [...doc.lines];
    const [l] = lines.splice(i, 1);
    lines.splice(i + d, 0, l);
    set({ lines });
  };

  const searchClients = useCallback((q) => api.get(`/clients?q=${encodeURIComponent(q)}`), []);
  const searchProducts = useCallback((q) => api.get(`/products?q=${encodeURIComponent(q)}`), []);
  const term = TERMS.find(([d]) => addDays(doc.issueDate, d) === doc.dueDate)?.[0];

  return (
    <div className="stack">
      {/* ---------- Document ---------- */}
      <section className="card card-pad">
        <div className="section-title"><span className="eyebrow">Document</span></div>
        <div className="grid-2">
          <Field label="Type">
            <div className="seg">
              {[['facture', 'Facture'], ['proforma', 'Proforma']].map(([k, l]) => (
                <button type="button" key={k} className={doc.type === k ? 'on' : ''}
                  onClick={() => set({ type: k, watermark: k === 'proforma' ? !!settings.documents.watermark?.proforma : false })}>{l}</button>
              ))}
            </div>
          </Field>
          <Field label="Numéro" hint="attribué à l'émission">
            <input readOnly value="Attribué automatiquement" aria-readonly="true" />
          </Field>
          <Field label="Date d'émission">
            <input type="date" value={doc.issueDate} onChange={(e) => {
              const delta = term ?? 30;
              set({ issueDate: e.target.value, dueDate: addDays(e.target.value, delta) });
            }} />
          </Field>
          <Field label={doc.type === 'proforma' ? 'Valable jusqu\'au' : 'Échéance'}>
            <input type="date" value={doc.dueDate} min={doc.issueDate} onChange={(e) => set({ dueDate: e.target.value })} />
          </Field>
        </div>
        <div className="row-flex" style={{ marginTop: 10 }}>
          <span className="small muted">Délai :</span>
          {TERMS.map(([d, l]) => (
            <button type="button" key={d} className={`btn sm ${term === d ? 'accent' : 'ghost'}`} onClick={() => set({ dueDate: addDays(doc.issueDate, d) })}>{l}</button>
          ))}
        </div>
        <div className="grid-3" style={{ marginTop: 12 }}>
          <Field label="Devise">
            <select value={doc.currency} onChange={(e) => {
              const c = settings.currencies.find((x) => x.code === e.target.value);
              set({ currency: c.code, exchangeRate: c.rate });
            }}>
              {settings.currencies.map((c) => <option key={c.code} value={c.code}>{c.label} ({c.code})</option>)}
            </select>
          </Field>
          {doc.currency !== settings.baseCurrency ? (
            <Field label={`Taux (1 ${cur.label} = … ${settings.currencies.find((c) => c.code === settings.baseCurrency)?.label})`}>
              <input type="number" step="any" min="0" value={doc.exchangeRate} onChange={(e) => set({ exchangeRate: e.target.value })} />
            </Field>
          ) : <div />}
          <Field label="Mode de règlement">
            <select value={doc.paymentMethod} onChange={(e) => set({ paymentMethod: e.target.value })}>
              <option value="">— Non précisé —</option>
              {settings.documents.paymentMethods.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Période facturée" hint="ajoutée aux conditions" className="" >
          <input value={doc.period} placeholder="ex. septembre 2026" onChange={(e) => set({ period: e.target.value })} />
        </Field>
      </section>

      {/* ---------- Client ---------- */}
      <section className="card card-pad">
        <div className="section-title"><span className="eyebrow">Client</span>
          {doc.client.id && <span className="small muted">— fiche client enregistrée</span>}
        </div>
        <div className="stack">
          <Field label="Nom ou raison sociale">
            <Autocomplete
              value={doc.client.name}
              placeholder="Rechercher ou saisir un client…"
              ariaLabel="Nom du client"
              onChange={(v) => setClient({ name: v, id: null })}
              search={searchClients}
              render={(c) => ({ title: c.name, detail: [c.addressLines.join(', '), c.email].filter(Boolean).join(' · ') })}
              onPick={(c) => set({ client: { id: c.id, name: c.name, addressLines: c.addressLines, email: c.email, phone: c.phone, taxIds: c.taxIds } })}
            />
          </Field>
          <Field label="Adresse" hint="une ligne par ligne imprimée">
            <textarea rows={3} value={doc.client.addressLines.join('\n')}
              onChange={(e) => setClient({ addressLines: e.target.value.split('\n') })} />
          </Field>
          <div className="grid-2">
            <Field label="E-mail"><input type="email" value={doc.client.email} onChange={(e) => setClient({ email: e.target.value })} /></Field>
            <Field label="Téléphone"><input value={doc.client.phone} onChange={(e) => setClient({ phone: e.target.value })} /></Field>
          </div>
          <div>
            <div className="label-text" style={{ marginBottom: 6 }}>Identifiants fiscaux (NIF, RCCM, ICE, SIRET, TVA…)</div>
            {doc.client.taxIds.map((t, i) => (
              <div className="row-flex" key={i} style={{ marginBottom: 6, flexWrap: 'nowrap' }}>
                <input style={{ width: 110 }} placeholder="Libellé" value={t.label} aria-label="Libellé de l'identifiant"
                  onChange={(e) => setClient({ taxIds: doc.client.taxIds.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                <input placeholder="Valeur" value={t.value} aria-label="Valeur de l'identifiant"
                  onChange={(e) => setClient({ taxIds: doc.client.taxIds.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                <button type="button" className="btn ghost icon" aria-label="Retirer" onClick={() => setClient({ taxIds: doc.client.taxIds.filter((_, j) => j !== i) })}><Icon name="x" /></button>
              </div>
            ))}
            <button type="button" className="btn sm ghost" onClick={() => setClient({ taxIds: [...doc.client.taxIds, { label: 'NIF', value: '' }] })}><Icon name="plus" />Identifiant</button>
          </div>
        </div>
      </section>

      {/* ---------- Lignes ---------- */}
      <section className="card card-pad">
        <div className="section-title"><span className="eyebrow">Lignes</span></div>
        <div className="table-wrap">
          <table className="lines-table">
            <thead>
              <tr>
                <th>N°</th><th style={{ minWidth: 220 }}>Désignation / détail</th><th style={{ width: 70 }}>Qté</th>
                <th style={{ width: 110 }}>P.U. ({cur.label})</th><th style={{ width: 70 }}>Remise %</th>
                <th style={{ width: 80 }}>TVA</th><th className="right" style={{ width: 100 }}>Total</th><th />
              </tr>
            </thead>
            <tbody>
              {doc.lines.map((l, i) => (
                <tr className="line" key={i}>
                  <td className="ln">{String(i + 1).padStart(2, '0')}</td>
                  <td>
                    <Autocomplete
                      value={l.designation}
                      placeholder="Désignation (ou recherche catalogue)"
                      ariaLabel={`Désignation ligne ${i + 1}`}
                      onChange={(v) => setLine(i, { designation: v })}
                      search={searchProducts}
                      render={(p) => ({ title: p.name, detail: `${formatNumber(p.unitPrice)} ${p.currency} · TVA ${formatRate(p.vatRate)}${p.detail ? ' · ' + p.detail : ''}` })}
                      onPick={(p) => setLine(i, { productId: p.id, designation: p.name, detail: p.detail, unitPrice: p.unitPrice, vatRate: p.vatRate })}
                    />
                    <textarea placeholder="Détail (facultatif, en gris sous la désignation)" value={l.detail} aria-label={`Détail ligne ${i + 1}`}
                      onChange={(e) => setLine(i, { detail: e.target.value })} />
                  </td>
                  <td><input type="number" min="0" step="any" value={l.quantity} aria-label="Quantité" onChange={(e) => setLine(i, { quantity: e.target.value })} /></td>
                  <td><input type="number" min="0" step="any" value={l.unitPrice} aria-label="Prix unitaire" onChange={(e) => setLine(i, { unitPrice: e.target.value })} /></td>
                  <td><input type="number" min="0" max="100" step="any" value={l.discount} aria-label="Remise en %" onChange={(e) => setLine(i, { discount: e.target.value })} /></td>
                  <td>
                    <select value={l.vatRate} aria-label="Taux de TVA" onChange={(e) => setLine(i, { vatRate: Number(e.target.value) })}>
                      {[...new Set([...settings.vatRates, Number(l.vatRate) || 0])].map((r) => <option key={r} value={r}>{formatRate(r)}</option>)}
                    </select>
                  </td>
                  <td className="tot num">{formatNumber(totals.lines[i]?.net || 0, cur.decimals)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" className="btn ghost icon" aria-label="Monter" disabled={i === 0} onClick={() => moveLine(i, -1)}><Icon name="up" /></button>
                    <button type="button" className="btn ghost icon" aria-label="Descendre" disabled={i === doc.lines.length - 1} onClick={() => moveLine(i, 1)}><Icon name="down" /></button>
                    <button type="button" className="btn ghost icon" aria-label="Supprimer la ligne" onClick={() => set({ lines: doc.lines.filter((_, j) => j !== i) })}><Icon name="trash" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className="btn sm" style={{ marginTop: 10 }} onClick={() => set({ lines: [...doc.lines, emptyLine(settings.defaultVatRate)] })}>
          <Icon name="plus" />Ajouter une ligne
        </button>
      </section>

      {/* ---------- Totaux ---------- */}
      <section className="card card-pad">
        <div className="section-title"><span className="eyebrow">Remise, acompte et totaux</span></div>
        <div className="grid-2">
          <Field label="Remise globale">
            <div className="row-flex" style={{ flexWrap: 'nowrap' }}>
              <select style={{ width: 110 }} value={doc.globalDiscount.type} aria-label="Type de remise"
                onChange={(e) => set({ globalDiscount: { ...doc.globalDiscount, type: e.target.value } })}>
                <option value="percent">%</option><option value="amount">{cur.label}</option>
              </select>
              <input type="number" min="0" step="any" value={doc.globalDiscount.value} aria-label="Valeur de la remise"
                onChange={(e) => set({ globalDiscount: { ...doc.globalDiscount, value: e.target.value } })} />
            </div>
          </Field>
          <Field label={`Acompte déjà versé (${cur.label})`}>
            <input type="number" min="0" step="any" value={doc.deposit} onChange={(e) => set({ deposit: e.target.value })} />
          </Field>
        </div>
        <div className="totals-box" style={{ marginTop: 14 }}>
          {totals.globalDiscount > 0 && <>
            <div className="r"><span>Sous-total HT</span><span>{money(totals.subtotal)}</span></div>
            <div className="r"><span>Remise</span><span>−{money(totals.globalDiscount)}</span></div>
          </>}
          <div className="r"><span>Total HT</span><span>{money(totals.totalHT)}</span></div>
          {totals.vat.filter((v) => v.rate > 0).map((v) => (
            <div className="r" key={v.rate}><span>TVA ({formatRate(v.rate)})</span><span>{money(v.amount)}</span></div>
          ))}
          {totals.totalVAT === 0 && <div className="r muted"><span>TVA ({formatRate(0)})</span><span>{money(0)}</span></div>}
          {totals.deposit > 0 && <>
            <div className="r"><span>Total TTC</span><span>{money(totals.totalTTC)}</span></div>
            <div className="r"><span>{doc.depositLabel || 'Acompte versé'}</span><span>−{money(totals.deposit)}</span></div>
          </>}
          <div className="r net"><span>NET À PAYER</span><span>{money(totals.netToPay)}</span></div>
          <div className="small muted" style={{ marginTop: 8 }}><em>{amountToWords(totals.netToPay, cur)}</em></div>
        </div>
      </section>

      {/* ---------- Conditions & options ---------- */}
      <section className="card card-pad">
        <div className="section-title"><span className="eyebrow">Conditions et options</span></div>
        <div className="stack">
          <Field label="Conditions" hint="imprimées en bas à gauche">
            <textarea rows={3} value={doc.conditions} onChange={(e) => set({ conditions: e.target.value })} />
          </Field>
          <div className="row-flex" style={{ gap: 18 }}>
            {doc.type === 'proforma' && (
              <label className="check"><input type="checkbox" checked={doc.watermark} onChange={(e) => set({ watermark: e.target.checked })} />Filigrane « {settings.documents.watermark?.text || 'PROFORMA'} »</label>
            )}
            {settings.documents.qrCode?.enabled && (
              <label className="check"><input type="checkbox" checked={doc.showQr} onChange={(e) => set({ showQr: e.target.checked })} />QR code de vérification</label>
            )}
            {settings.documents.generalTerms?.trim() && (
              <label className="check"><input type="checkbox" checked={doc.includeTerms} onChange={(e) => set({ includeTerms: e.target.checked })} />Joindre les conditions générales</label>
            )}
          </div>
          <Field label="Notes internes" hint="jamais imprimées">
            <textarea rows={2} value={doc.notes} onChange={(e) => set({ notes: e.target.value })} />
          </Field>
        </div>
      </section>
    </div>
  );
}
