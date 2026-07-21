"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ChevronDownIcon, CloseIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type DropdownItem = {
  label: string;
  href: string;
};

type NavLink = {
  label: string;
  href: string;
  dropdown?: DropdownItem[];
};

const SERVICE_DROPDOWN: DropdownItem[] = [
  { label: "Production audiovisuelle", href: "/services#production-audiovisuelle" },
  { label: "Stratégie de communication", href: "/services#strategie" },
  { label: "Réseaux sociaux & digital", href: "/services#reseaux-sociaux" },
  { label: "Design graphique & identité", href: "/services#design" },
  { label: "Sites web", href: "/services#sites-web" },
  { label: "Impression & supports", href: "/services#impression" },
];

const REALISATIONS_DROPDOWN: DropdownItem[] = [
  { label: "Toutes les réalisations", href: "/realisations" },
  { label: "Spots & films institutionnels", href: "/realisations" },
  { label: "Documentaires", href: "/realisations" },
  { label: "Sites web", href: "/realisations" },
  { label: "Campagnes complètes", href: "/realisations" },
];

const NAV_LINKS: NavLink[] = [
  { label: "À propos", href: "/a-propos" },
  { label: "Services", href: "/services", dropdown: SERVICE_DROPDOWN },
  { label: "Réalisations", href: "/realisations", dropdown: REALISATIONS_DROPDOWN },
  { label: "Blog", href: "/blog" },
  { label: "Nous écrire", href: "/contact" },
];

const PROJECT_TYPES = [
  "Spot publicitaire",
  "Documentaire",
  "Film institutionnel",
  "Site web",
  "Design graphique",
  "Campagne complète",
  "Autre",
];
const BUDGETS = [
  "Moins de 1 M FCFA",
  "1 à 5 M FCFA",
  "5 à 15 M FCFA",
  "Plus de 15 M FCFA",
  "À définir ensemble",
];
const DELAIS = [
  "Urgent (moins de 2 semaines)",
  "Ce mois-ci",
  "Ce trimestre",
  "Flexible",
];

const STEP_TITLES = [
  "Qui êtes-vous ?",
  "Quel type de projet ?",
  "Budget et délai",
  "Où vous répondre ?",
];

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        selected
          ? "border-brand-olive bg-brand-olive text-white"
          : "border-border bg-background text-brand-navy hover:border-brand-olive"
      )}
    >
      {label}
    </button>
  );
}

function QuoteWizardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [form, setForm] = useState({
    nom: "",
    organisation: "",
    type: "",
    budget: "",
    delai: "",
    email: "",
    telephone: "",
    message: "",
  });

  useEffect(() => {
    if (!open) {
      const timeout = setTimeout(() => {
        setStep(0);
        setStatus("idle");
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  if (!open) return null;

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canContinue =
    step === 0
      ? form.nom.trim().length > 1
      : step === 1
        ? form.type !== ""
        : step === 2
          ? form.budget !== "" && form.delai !== ""
          : /\S+@\S+\.\S+/.test(form.email);

  const send = async () => {
    setStatus("sending");
    try {
      // FormSubmit relaie la demande par email à contact@stratetic.art,
      // sans ouvrir de client mail chez le visiteur.
      const res = await fetch(
        "https://formsubmit.co/ajax/contact@stratetic.art",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            _subject: `Devis express — ${form.type} — ${form.nom}`,
            _template: "table",
            Nom: form.nom,
            Organisation: form.organisation || "—",
            "Type de projet": form.type,
            "Budget indicatif": form.budget,
            "Délai": form.delai,
            Email: form.email,
            "Téléphone": form.telephone || "—",
            Message: form.message || "—",
          }),
        }
      );
      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  const inputClass =
    "w-full rounded-full border border-border bg-background px-5 py-3 text-sm text-brand-navy outline-none transition-colors focus:border-brand-olive";

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-brand-navy/80 p-4 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl animate-in zoom-in-95 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-6 top-6 text-brand-navy/60 transition-colors hover:text-brand-navy"
        >
          <CloseIcon className="size-5" />
        </button>

        {status === "sent" ? (
          <div className="py-6 text-center">
            <p className="font-heading text-2xl text-brand-navy">
              Demande envoyée ✓
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Merci {form.nom} — nous revenons vers vous sous 48h ouvrées à{" "}
              {form.email}.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-full bg-brand-navy px-6 py-3 font-heading text-sm uppercase text-white"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            {/* Progression sans numérotation : simple barre */}
            <div className="h-1 w-full rounded-full bg-brand-navy/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-olive transition-all duration-300"
                style={{ width: `${((step + 1) / 4) * 100}%` }}
              />
            </div>

            <h3 className="mt-6 font-heading text-2xl text-brand-navy">
              {STEP_TITLES[step]}
            </h3>

            <div className="mt-6 flex flex-col gap-4">
              {step === 0 && (
                <>
                  <input
                    type="text"
                    placeholder="Votre nom *"
                    value={form.nom}
                    onChange={(e) => set("nom")(e.target.value)}
                    className={inputClass}
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Organisation (facultatif)"
                    value={form.organisation}
                    onChange={(e) => set("organisation")(e.target.value)}
                    className={inputClass}
                  />
                </>
              )}

              {step === 1 && (
                <div className="flex flex-wrap gap-2">
                  {PROJECT_TYPES.map((t) => (
                    <Chip
                      key={t}
                      label={t}
                      selected={form.type === t}
                      onClick={() => set("type")(t)}
                    />
                  ))}
                </div>
              )}

              {step === 2 && (
                <>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Budget indicatif
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {BUDGETS.map((b) => (
                      <Chip
                        key={b}
                        label={b}
                        selected={form.budget === b}
                        onClick={() => set("budget")(b)}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                    Délai souhaité
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DELAIS.map((d) => (
                      <Chip
                        key={d}
                        label={d}
                        selected={form.delai === d}
                        onClick={() => set("delai")(d)}
                      />
                    ))}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <input
                    type="email"
                    placeholder="Votre email *"
                    value={form.email}
                    onChange={(e) => set("email")(e.target.value)}
                    className={inputClass}
                    autoFocus
                  />
                  <input
                    type="tel"
                    placeholder="Téléphone (facultatif)"
                    value={form.telephone}
                    onChange={(e) => set("telephone")(e.target.value)}
                    className={inputClass}
                  />
                  <textarea
                    placeholder="Un mot sur votre projet ? (facultatif)"
                    value={form.message}
                    onChange={(e) => set("message")(e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-border bg-background px-5 py-3 text-sm text-brand-navy outline-none transition-colors focus:border-brand-olive resize-none"
                  />
                  {status === "error" && (
                    <p className="text-sm text-red-600">
                      L&apos;envoi a échoué. Réessayez, ou écrivez-nous
                      directement à{" "}
                      <a
                        href="mailto:contact@stratetic.art"
                        className="underline"
                      >
                        contact@stratetic.art
                      </a>
                      .
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-full border border-border px-6 py-3 font-heading text-sm uppercase text-brand-navy transition-colors hover:border-brand-navy"
                >
                  Retour
                </button>
              ) : (
                <span />
              )}
              {step < 3 ? (
                <button
                  type="button"
                  disabled={!canContinue}
                  onClick={() => setStep((s) => s + 1)}
                  className="rounded-full bg-brand-olive px-8 py-3 font-heading text-sm uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuer
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!canContinue || status === "sending"}
                  onClick={send}
                  className="rounded-full bg-brand-olive px-8 py-3 font-heading text-sm uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {status === "sending" ? "Envoi…" : "Envoyer ma demande"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function HeaderNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  // Petit délai avant fermeture : évite que le menu se ferme si la souris
  // quitte brièvement la zone en diagonale avant d'atteindre le panneau.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openDropdownNow = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(label);
  };
  const closeDropdownSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 200);
  };
  // L'accueil ouvre sur le scroll-world (fond clair) : texte sombre.
  // Les pages internes ouvrent sur un bandeau navy : texte blanc.
  const pathname = usePathname();
  const darkOnTop = pathname === "/";

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 100);
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const openQuote = () => {
    setIsMobileMenuOpen(false);
    setIsQuoteOpen(true);
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[60] flex items-center justify-between px-6 py-4 transition-colors duration-300 ease-out lg:px-10",
          isScrolled
            ? "bg-brand-offwhite text-brand-navy shadow-sm"
            : darkOnTop
              ? "bg-transparent text-brand-navy"
              : "bg-transparent text-white"
        )}
      >
        <Logo variant={isScrolled || darkOnTop ? "color" : "white"} />

        <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
          {NAV_LINKS.map((link) => (
            <div
              key={link.label}
              className="relative"
              onMouseEnter={() => link.dropdown && openDropdownNow(link.label)}
              onMouseLeave={() => link.dropdown && closeDropdownSoon()}
            >
              <Link
                href={link.href}
                className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors hover:text-brand-olive xl:text-[15px]"
              >
                {link.label}
                {link.dropdown && (
                  <ChevronDownIcon
                    className={cn(
                      "size-4 transition-transform",
                      openDropdown === link.label && "rotate-180"
                    )}
                  />
                )}
              </Link>

              {link.dropdown && (
                // Le conteneur extérieur touche le lien (top-full, pas de
                // marge) et utilise du padding pour l'espacement visuel : le
                // padding fait partie de la zone survolée, donc la souris ne
                // "tombe" jamais dans un vide entre le lien et le panneau.
                <div
                  className={cn(
                    "absolute left-1/2 top-full w-56 -translate-x-1/2 pt-3",
                    openDropdown === link.label
                      ? "pointer-events-auto"
                      : "pointer-events-none"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-xl bg-white p-2 text-brand-navy shadow-lg transition-all duration-200",
                      openDropdown === link.label
                        ? "translate-y-0 opacity-100"
                        : "-translate-y-2 opacity-0"
                    )}
                  >
                    {link.dropdown.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setOpenDropdown(null)}
                        className="block rounded-lg px-3 py-2 text-sm font-medium normal-case tracking-normal transition-colors hover:bg-brand-offwhite hover:text-brand-olive"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="hidden lg:block">
          <button
            type="button"
            onClick={openQuote}
            className="rounded-full bg-gradient-accent px-5 py-2.5 font-heading text-xs uppercase text-white transition-opacity hover:opacity-90 xl:px-6 xl:py-3 xl:text-sm"
          >
            Devis Express
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Ouvrir le menu"
          className="flex flex-col gap-1.5 lg:hidden"
        >
          <span className="block h-0.5 w-6 bg-current" />
          <span className="block h-0.5 w-6 bg-current" />
          <span className="block h-0.5 w-6 bg-current" />
        </button>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-40 flex flex-col bg-brand-navy px-6 py-4 text-white transition-transform duration-300 ease-out lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        )}
      >
        <div className="flex items-center justify-between">
          <Logo variant="white" />
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Fermer le menu"
          >
            <CloseIcon className="size-6" />
          </button>
        </div>

        <nav className="mt-10 flex flex-1 flex-col gap-6 overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <div key={link.label}>
              <Link
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-heading text-2xl uppercase"
              >
                {link.label}
              </Link>
              {link.dropdown && (
                <div className="mt-3 flex flex-col gap-2 pl-4">
                  {link.dropdown.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-medium uppercase tracking-wide text-white/70 transition-colors hover:text-brand-olive"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <button
          type="button"
          onClick={openQuote}
          className="mb-4 w-full rounded-full bg-gradient-accent px-6 py-3 font-heading text-sm uppercase text-white transition-opacity hover:opacity-90"
        >
          Devis Express
        </button>
      </div>

      <QuoteWizardModal open={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </>
  );
}

export { HeaderNav };
export default HeaderNav;
