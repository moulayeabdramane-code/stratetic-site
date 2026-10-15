/**
 * Paramètres : émetteur, banque, mentions, couleurs, numérotation (verrouillée
 * après la 1re émission), devises, TVA, e-mail, sauvegarde / import / export.
 * Tout est enregistré dans config/settings.json.
 */
import { useState } from 'react';
import { api, download } from '../lib/api.js';
import { useLocalPref } from '../lib/hooks.js';
import { logoUrl } from '../lib/logo.js';
import { formatDocNumber, todayISO } from '../../../shared/format.js';
import Icon from '../components/Icon.jsx';
import { Field, useConfirm, useSettings, useToast } from '../components/ui.jsx';

const TABS = [
  ['issuer', 'Émetteur'], ['bank', 'Banque et pied de page'], ['documents', 'Documents'], ['theme', 'Couleurs et logo'],
  ['numbering', 'Numérotation'], ['currencies', 'Devises et TVA'], ['email', 'E-mail'], ['backup', 'Sauvegarde'],
];
const COLOR_LABELS = {
  navy: 'Bleu nuit (bandeau, tableau)', green: 'Vert vif (filets, net à payer)', greenDark: 'Vert des libellés',
  text: 'Texte principal', muted: 'Texte secondaire', dark: 'Texte foncé', panel: 'Fond du cartouche',
  line: 'Filets et bordures', highlight: 'Fond « Arrêtée à »', headerText: 'Texte des en-têtes',
};
const lines = (a) => (a || []).join('\n');
const split = (t) => t.split('\n');

export default function Settings({ onSaved }) {
  const ctx = useSettings();
  const toast = useToast();
  const [s, setS] = useState(() => structuredClone(ctx.settings));
  const [tab, setTab] = useLocalPref('settings-tab', 'issuer');
  const [dirty, setDirty] = useState(false);
  const [confirm, confirmDialog] = useConfirm();
  const locked = ctx.issuedCount > 0;

  const up = (path, value) => {
    const next = structuredClone(s);
    const keys = path.split('.');
    let o = next;
    keys.slice(0, -1).forEach((k) => { o = o[k]; });
    o[keys.at(-1)] = value;
    setS(next);
    setDirty(true);
  };
  const save = async () => {
    try {
      const clean = structuredClone(s);
      clean.issuer.addressLines = clean.issuer.addressLines.filter((l) => l.trim());
      clean.bank.lines = clean.bank.lines.filter((l) => l.trim());
      await api.put('/settings', clean);
      toast('Paramètres enregistrés');
      setDirty(false);
      await onSaved();
    } catch (e) { toast(e.message, 'error'); }
  };
  const uploadLogo = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        const saved = await api.post('/settings/logo', { dataUrl: r.result });
        setS((cur) => ({ ...cur, issuer: { ...cur.issuer, logo: saved.issuer.logo } }));
        toast('Logo mis à jour');
        onSaved();
      } catch (e) { toast(e.message, 'error'); }
    };
    r.readAsDataURL(file);
  };
  const importBackup = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = async () => {
      let data;
      try { data = JSON.parse(r.result); } catch { toast('Fichier JSON illisible', 'error'); return; }
      const ok = await confirm({
        title: 'Restaurer une sauvegarde',
        message: `Toutes les données actuelles seront remplacées par celles du fichier « ${file.name} » (exporté le ${data.exportedAt?.slice(0, 10) || '?'}). Une copie de sécurité est faite automatiquement dans data/backups/.`,
        confirmLabel: 'Restaurer', danger: true,
      });
      if (!ok) return;
      try {
        const res = await api.post('/import/json', data);
        toast(`Restauration terminée : ${res.restored.documents} documents, ${res.restored.clients} clients`);
        onSaved();
      } catch (e) { toast(e.message, 'error'); }
    };
    r.readAsText(file);
  };

  const n = s.numbering;
  const year = Number(todayISO().slice(0, 4));

  return (
    <>
      <div className="page-head">
        <div><h1>Paramètres</h1><div className="sub">Enregistrés dans config/settings.json. Les documents déjà émis gardent les paramètres de leur date d'émission.</div></div>
        <span className="spacer" />
        {dirty && <span className="save-state pending"><span className="dot" />Modifications non enregistrées</span>}
        <button className="btn primary" onClick={save} disabled={!dirty}><Icon name="check" />Enregistrer</button>
      </div>
      <div className="content">
        <div className="card">
          <div className="tabs" role="tablist">
            {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
          </div>
          <div className="card-pad stack" style={{ maxWidth: 880 }}>
            {tab === 'issuer' && <>
              <div className="grid-2">
                <Field label="Nom affiché (en-tête)"><input value={s.issuer.name} onChange={(e) => up('issuer.name', e.target.value)} /></Field>
                <Field label="Nom court (QR code, e-mails)"><input value={s.issuer.shortName} onChange={(e) => up('issuer.shortName', e.target.value)} /></Field>
              </div>
              <Field label="Adresse" hint="une ligne par ligne imprimée"><textarea rows={3} value={lines(s.issuer.addressLines)} onChange={(e) => up('issuer.addressLines', split(e.target.value))} /></Field>
              <div className="grid-2">
                <Field label="E-mail"><input value={s.issuer.email} onChange={(e) => up('issuer.email', e.target.value)} /></Field>
                <Field label="Téléphone"><input value={s.issuer.phone} onChange={(e) => up('issuer.phone', e.target.value)} /></Field>
              </div>
              <div>
                <div className="label-text" style={{ marginBottom: 6 }}>Identifiants légaux (NIF, RC…)</div>
                {s.issuer.legalIds.map((t, i) => (
                  <div className="row-flex" key={i} style={{ marginBottom: 6, flexWrap: 'nowrap' }}>
                    <input style={{ width: 110 }} value={t.label} aria-label="Libellé" onChange={(e) => up(`issuer.legalIds.${i}.label`, e.target.value)} />
                    <input value={t.value} aria-label="Valeur" onChange={(e) => up(`issuer.legalIds.${i}.value`, e.target.value)} />
                    <button className="btn ghost icon" aria-label="Retirer" onClick={() => up('issuer.legalIds', s.issuer.legalIds.filter((_, j) => j !== i))}><Icon name="x" /></button>
                  </div>
                ))}
                <button className="btn sm ghost" onClick={() => up('issuer.legalIds', [...s.issuer.legalIds, { label: '', value: '' }])}><Icon name="plus" />Identifiant</button>
              </div>
            </>}

            {tab === 'bank' && <>
              <Field label="Banque"><input value={s.bank.name} onChange={(e) => up('bank.name', e.target.value)} /></Field>
              <Field label="Coordonnées" hint="une ligne par ligne imprimée"><textarea rows={4} value={lines(s.bank.lines)} onChange={(e) => up('bank.lines', split(e.target.value))} /></Field>
              <div className="grid-2">
                <Field label="Pied de page — gauche"><input value={s.footer.left} onChange={(e) => up('footer.left', e.target.value)} /></Field>
                <Field label="Pied de page — droite"><input value={s.footer.right} onChange={(e) => up('footer.right', e.target.value)} /></Field>
              </div>
            </>}

            {tab === 'documents' && <>
              <div className="grid-2">
                <Field label="Titre des factures"><input value={s.documents.titles.facture} onChange={(e) => up('documents.titles.facture', e.target.value)} /></Field>
                <Field label="Titre des proformas"><input value={s.documents.titles.proforma} onChange={(e) => up('documents.titles.proforma', e.target.value)} /></Field>
                <Field label="Délai de paiement par défaut (jours)"><input type="number" min="0" value={s.documents.paymentTermsDays.facture} onChange={(e) => up('documents.paymentTermsDays.facture', Number(e.target.value))} /></Field>
                <Field label="Validité des proformas (jours)"><input type="number" min="0" value={s.documents.paymentTermsDays.proforma} onChange={(e) => up('documents.paymentTermsDays.proforma', Number(e.target.value))} /></Field>
              </div>
              <Field label="Conditions par défaut"><textarea rows={3} value={s.documents.defaultConditions} onChange={(e) => up('documents.defaultConditions', e.target.value)} /></Field>
              <Field label="Mentions légales" hint="ajoutées sous les conditions, sur chaque document"><textarea rows={2} value={s.documents.legalMentions} onChange={(e) => up('documents.legalMentions', e.target.value)} /></Field>
              <Field label="Conditions générales de vente" hint="page annexe, si cochée sur le document"><textarea rows={6} value={s.documents.generalTerms} onChange={(e) => up('documents.generalTerms', e.target.value)} /></Field>
              <Field label="Modes de règlement" hint="un par ligne"><textarea rows={3} value={lines(s.documents.paymentMethods)} onChange={(e) => up('documents.paymentMethods', split(e.target.value).filter((x) => x.trim()))} /></Field>
              <div className="grid-2">
                <label className="check"><input type="checkbox" checked={!!s.documents.watermark.proforma} onChange={(e) => up('documents.watermark.proforma', e.target.checked)} />Filigrane sur les proformas (par défaut)</label>
                <Field label="Texte du filigrane"><input value={s.documents.watermark.text} onChange={(e) => up('documents.watermark.text', e.target.value)} /></Field>
                <label className="check"><input type="checkbox" checked={!!s.documents.qrCode.enabled} onChange={(e) => up('documents.qrCode.enabled', e.target.checked)} />QR code de vérification</label>
                <Field label="Légende du QR code"><input value={s.documents.qrCode.caption} onChange={(e) => up('documents.qrCode.caption', e.target.value)} /></Field>
              </div>
            </>}

            {tab === 'theme' && <>
              <div>
                <div className="label-text" style={{ marginBottom: 8 }}>Logo (affiché sur fond bleu nuit)</div>
                <div className="row-flex">
                  <span className="logo-preview"><img src={logoUrl(s.issuer.logo)} alt="Logo actuel" /></span>
                  <label className="btn"><Icon name="upload" />Remplacer…<input type="file" accept="image/png,image/jpeg,image/svg+xml" hidden onChange={(e) => uploadLogo(e.target.files[0])} /></label>
                </div>
                <p className="small muted">PNG transparent conseillé, proportions 4,5 : 1 (zone de 218 × 48 px).</p>
              </div>
              <div className="grid-2">
                {Object.keys(COLOR_LABELS).map((k) => (
                  <div className="color-row" key={k}>
                    <input type="color" value={s.theme[k]} aria-label={COLOR_LABELS[k]} onChange={(e) => up(`theme.${k}`, e.target.value.toUpperCase())} />
                    <span className="small">{COLOR_LABELS[k]}</span>
                    <input value={s.theme[k]} aria-label={`${COLOR_LABELS[k]} (hex)`} onChange={(e) => up(`theme.${k}`, e.target.value)} />
                  </div>
                ))}
              </div>
            </>}

            {tab === 'numbering' && <>
              {locked && (
                <div className="banner info"><Icon name="lock" size={18} /><div><strong>Numérotation verrouillée</strong>{ctx.issuedCount} document(s) émis : le format et les préfixes ne peuvent plus changer, et aucun numéro ne peut être modifié à la main.</div></div>
              )}
              <div className="grid-2">
                <Field label="Remise à zéro">
                  <select value={n.reset} disabled={locked} onChange={(e) => up('numbering.reset', e.target.value)}>
                    <option value="annual">Chaque année (1er janvier)</option><option value="continuous">Jamais (numérotation continue)</option>
                  </select>
                </Field>
                <Field label="Format" hint="{PREFIX} {YEAR} {SEQ}"><input value={n.format} disabled={locked} onChange={(e) => up('numbering.format', e.target.value)} /></Field>
                <Field label="Préfixe factures"><input value={n.prefixes.facture} disabled={locked} onChange={(e) => up('numbering.prefixes.facture', e.target.value)} /></Field>
                <Field label="Préfixe proformas"><input value={n.prefixes.proforma} disabled={locked} onChange={(e) => up('numbering.prefixes.proforma', e.target.value)} /></Field>
                <Field label="Nombre de chiffres"><input type="number" min="1" max="8" value={n.padding} disabled={locked} onChange={(e) => up('numbering.padding', Number(e.target.value))} /></Field>
                <Field label="Exemple"><input readOnly value={`${formatDocNumber(n.format, n.prefixes.facture, year, 1, n.padding)} · ${formatDocNumber(n.format, n.prefixes.proforma, year, 1, n.padding)}`} /></Field>
              </div>
              <div>
                <h3 style={{ marginBottom: 6 }}>Reprise d'une numérotation existante</h3>
                <p className="small muted" style={{ marginTop: 0 }}>Dernier numéro déjà utilisé hors de l'application, pour l'année en cours. Modifiable uniquement tant que le compteur n'a pas servi.</p>
                <div className="grid-2">
                  {['facture', 'proforma'].map((t) => {
                    const key = n.reset === 'continuous' ? 'continu' : String(year);
                    const used = ctx.counters.some((c) => c.type === t && c.year === (n.reset === 'continuous' ? 0 : year));
                    return (
                      <Field key={t} label={`Dernier n° ${t === 'facture' ? 'facture' : 'proforma'} ${key}`} hint={used ? 'verrouillé' : ''}>
                        <input type="number" min="0" disabled={used} value={n.start?.[t]?.[key] ?? 0}
                          onChange={(e) => up(`numbering.start.${t}`, { ...(n.start?.[t] || {}), [key]: Number(e.target.value) })} />
                      </Field>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 style={{ marginBottom: 6 }}>Compteurs</h3>
                <table className="table">
                  <thead><tr><th>Série</th><th>Année</th><th className="right">Dernier numéro attribué</th></tr></thead>
                  <tbody>
                    {ctx.counters.length === 0 && <tr><td colSpan="3" className="empty">Aucun document émis.</td></tr>}
                    {ctx.counters.map((c) => <tr key={`${c.type}${c.year}`} style={{ cursor: 'default' }}><td>{c.type}</td><td>{c.year || 'continu'}</td><td className="right num">{c.last}</td></tr>)}
                  </tbody>
                </table>
                <p className="small muted">Prochains numéros : <span className="doc-num">{ctx.nextNumbers.facture}</span> · <span className="doc-num">{ctx.nextNumbers.proforma}</span></p>
              </div>
            </>}

            {tab === 'currencies' && <>
              <Field label="Devise de référence (statistiques)">
                <select value={s.baseCurrency} onChange={(e) => up('baseCurrency', e.target.value)}>
                  {s.currencies.map((c) => <option key={c.code} value={c.code}>{c.label} ({c.code})</option>)}
                </select>
              </Field>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Code</th><th>Libellé</th><th>Décimales</th><th>Taux manuel</th><th>En lettres (sing. / plur.)</th><th>Centimes (sing. / plur.)</th><th /></tr></thead>
                  <tbody>
                    {s.currencies.map((c, i) => (
                      <tr key={i} style={{ cursor: 'default' }}>
                        <td><input style={{ width: 70 }} value={c.code} onChange={(e) => up(`currencies.${i}.code`, e.target.value.toUpperCase())} /></td>
                        <td><input style={{ width: 80 }} value={c.label} onChange={(e) => up(`currencies.${i}.label`, e.target.value)} /></td>
                        <td><input style={{ width: 60 }} type="number" min="0" max="3" value={c.decimals} onChange={(e) => up(`currencies.${i}.decimals`, Number(e.target.value))} /></td>
                        <td><input style={{ width: 100 }} type="number" step="any" min="0" value={c.rate} disabled={c.code === s.baseCurrency} onChange={(e) => up(`currencies.${i}.rate`, Number(e.target.value))} /></td>
                        <td><div className="row-flex" style={{ flexWrap: 'nowrap' }}>
                          <input value={c.words.singular} onChange={(e) => up(`currencies.${i}.words.singular`, e.target.value)} />
                          <input value={c.words.plural} onChange={(e) => up(`currencies.${i}.words.plural`, e.target.value)} />
                        </div></td>
                        <td><div className="row-flex" style={{ flexWrap: 'nowrap' }}>
                          <input value={c.words.subSingular || ''} onChange={(e) => up(`currencies.${i}.words.subSingular`, e.target.value)} />
                          <input value={c.words.subPlural || ''} onChange={(e) => up(`currencies.${i}.words.subPlural`, e.target.value)} />
                        </div></td>
                        <td>{c.code !== s.baseCurrency && <button className="btn ghost icon" aria-label="Retirer" onClick={() => up('currencies', s.currencies.filter((_, j) => j !== i))}><Icon name="x" /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div><button className="btn sm" onClick={() => up('currencies', [...s.currencies, { code: '', label: '', decimals: 2, rate: 1, words: { singular: '', plural: '', subSingular: 'centime', subPlural: 'centimes' } }])}><Icon name="plus" />Devise</button></div>
              <p className="small muted">Taux = valeur d'une unité de la devise en devise de référence (ex. 1 EUR = 655,957 FCFA). Il est proposé à la saisie et reste modifiable sur chaque document.</p>
              <div className="grid-2">
                <Field label="Taux de TVA proposés (%)" hint="séparés par des virgules">
                  <input value={s.vatRates.join(', ')} onChange={(e) => up('vatRates', e.target.value.split(',').map((x) => Number(x.trim().replace(',', '.'))).filter((x) => !Number.isNaN(x)))} />
                </Field>
                <Field label="TVA par défaut (%)">
                  <select value={s.defaultVatRate} onChange={(e) => up('defaultVatRate', Number(e.target.value))}>
                    {s.vatRates.map((r) => <option key={r} value={r}>{r} %</option>)}
                  </select>
                </Field>
              </div>
            </>}

            {tab === 'email' && <>
              <Field label="Mode d'envoi">
                <select value={s.email.mode} onChange={(e) => up('email.mode', e.target.value)}>
                  <option value="mailto">Messagerie locale (mailto + PDF téléchargé)</option>
                  <option value="smtp">Envoi direct SMTP avec pièce jointe</option>
                </select>
              </Field>
              <div className="grid-2">
                <Field label="Serveur SMTP"><input value={s.email.smtp.host} onChange={(e) => up('email.smtp.host', e.target.value)} /></Field>
                <Field label="Port"><input type="number" value={s.email.smtp.port} onChange={(e) => up('email.smtp.port', Number(e.target.value))} /></Field>
                <Field label="Utilisateur"><input value={s.email.smtp.user} onChange={(e) => up('email.smtp.user', e.target.value)} /></Field>
                <Field label="Expéditeur"><input value={s.email.smtp.from} onChange={(e) => up('email.smtp.from', e.target.value)} /></Field>
              </div>
              <label className="check"><input type="checkbox" checked={s.email.smtp.secure !== false} onChange={(e) => up('email.smtp.secure', e.target.checked)} />Connexion chiffrée (SSL/TLS, port 465)</label>
              <div className={`banner ${ctx.smtp.passwordSet ? 'success' : 'warning'}`}>
                <div><strong>Mot de passe SMTP : {ctx.smtp.passwordSet ? 'défini' : 'non défini'}</strong>
                  Par sécurité, il n'est jamais stocké dans les paramètres : ajoutez la ligne <code>SMTP_PASS=…</code> au fichier <code>.env</code> à la racine du projet, puis redémarrez. Pour Yahoo ou Gmail, utilisez un « mot de passe d'application ».</div>
              </div>
              <Field label="Objet" hint="{TITLE} {NUMBER} {AMOUNT} {DUE} {CLIENT}"><input value={s.email.subject} onChange={(e) => up('email.subject', e.target.value)} /></Field>
              <Field label="Message"><textarea rows={7} value={s.email.body} onChange={(e) => up('email.body', e.target.value)} /></Field>
            </>}

            {tab === 'backup' && <>
              <div className="grid-2">
                <div className="card card-pad">
                  <h3>Sauvegarde complète</h3>
                  <p className="small muted">Documents, clients, catalogue, paiements, compteurs, journal, paramètres et clé des QR codes dans un fichier JSON. À conserver en lieu sûr.</p>
                  <button className="btn primary" onClick={() => download('api/export/json')}><Icon name="download" />Exporter (JSON)</button>
                </div>
                <div className="card card-pad">
                  <h3>Restauration</h3>
                  <p className="small muted">Remplace toutes les données (et la clé des QR codes) par celles d'une sauvegarde. Copie de sécurité automatique.</p>
                  <label className="btn danger"><Icon name="upload" />Importer un JSON…<input type="file" accept="application/json,.json" hidden onChange={(e) => { importBackup(e.target.files[0]); e.target.value = ''; }} /></label>
                </div>
                <div className="card card-pad">
                  <h3>Historique CSV</h3>
                  <p className="small muted">Tous les documents (séparateur « ; », compatible Excel).</p>
                  <button className="btn" onClick={() => download('api/export/csv')}><Icon name="download" />Exporter (CSV)</button>
                </div>
              </div>
            </>}
          </div>
        </div>
      </div>
      {confirmDialog}
    </>
  );
}
