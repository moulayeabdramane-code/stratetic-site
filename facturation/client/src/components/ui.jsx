/** Composants d'interface réutilisables. */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { formatMoney } from '../../../shared/format.js';

// ---------- Paramètres partagés (devises, libellés…) ----------
export const SettingsContext = createContext(null);
export const useSettings = () => useContext(SettingsContext);

/** Montant formaté dans la devise donnée. */
export function Money({ value, currency, className = '' }) {
  const ctx = useSettings();
  const cur = ctx?.settings?.currencies?.find((c) => c.code === (currency || ctx.settings.baseCurrency)) || { label: 'FCFA', decimals: 0 };
  return <span className={`num ${className}`}>{formatMoney(value || 0, cur)}</span>;
}

export function StatusBadge({ status, label }) {
  const labels = { brouillon: 'Brouillon', emise: 'Émise', envoyee: 'Envoyée', payee: 'Payée', en_retard: 'En retard', annulee: 'Annulée', convertie: 'Convertie' };
  return <span className={`badge ${status}`}>{label || labels[status] || status}</span>;
}

export function TypeTag({ type }) {
  return <span className={`type-tag ${type}`}>{type === 'proforma' ? 'PRO' : 'FAC'}</span>;
}

// ---------- Modale ----------
export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <span className="spacer" />
          <button className="btn ghost icon" onClick={onClose} aria-label="Fermer"><Icon name="x" /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- Notifications (toasts) ----------
const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, kind = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, message, kind }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), kind === 'error' ? 7000 : 3500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.message}</div>)}
      </div>
    </ToastContext.Provider>
  );
}

// ---------- Confirmation ----------
export function useConfirm() {
  const [state, setState] = useState(null);
  const confirm = useCallback((opts) => new Promise((resolve) => setState({ ...opts, resolve })), []);
  const close = (v) => { state?.resolve(v); setState(null); };
  const [input, setInput] = useState('');
  const dialog = state && (
    <Modal title={state.title} onClose={() => close(false)} footer={<>
      <button className="btn" onClick={() => close(false)}>Annuler</button>
      <button className={`btn ${state.danger ? 'danger' : 'primary'}`}
        disabled={state.input && !input.trim()}
        onClick={() => { close(state.input ? input.trim() : true); setInput(''); }}>{state.confirmLabel || 'Confirmer'}</button>
    </>}>
      <p style={{ marginTop: 0 }}>{state.message}</p>
      {state.input && (
        <label className="field"><span>{state.input}</span>
          <input autoFocus value={input} onChange={(e) => setInput(e.target.value)} />
        </label>
      )}
    </Modal>
  );
  return [confirm, dialog];
}

// ---------- Auto-complétion ----------
/**
 * Champ texte avec suggestions.
 * @param {(q:string)=>Promise<any[]>} search
 * @param {(item)=>{title:string, detail?:string}} render
 */
export function Autocomplete({ value, onChange, onPick, search, render, placeholder, autoFocus, ariaLabel }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const seq = useRef(0);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const n = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const r = await search(value || '');
        if (n === seq.current) { setItems(r.slice(0, 8)); setActive(0); }
      } catch { /* ignoré */ }
    }, 150);
    return () => clearTimeout(t);
  }, [value, open, search]);

  useEffect(() => {
    const off = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', off);
    return () => document.removeEventListener('mousedown', off);
  }, []);

  const pick = (it) => { onPick(it); setOpen(false); };
  return (
    <div className="ac" ref={box}>
      <input
        value={value} placeholder={placeholder} autoFocus={autoFocus} aria-label={ariaLabel} autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onKeyDown={(e) => {
          if (!open || !items.length) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === 'Enter') { e.preventDefault(); pick(items[active]); }
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && items.length > 0 && (
        <ul className="ac-list" role="listbox">
          {items.map((it, i) => {
            const r = render(it);
            return (
              <li key={it.id ?? i} className={i === active ? 'on' : ''} onMouseDown={(e) => { e.preventDefault(); pick(it); }}>
                <div className="t">{r.title}</div>
                {r.detail && <div className="d">{r.detail}</div>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Champ de formulaire étiqueté. */
export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}{hint && <span className="hint"> — {hint}</span>}</span>
      {children}
    </label>
  );
}
