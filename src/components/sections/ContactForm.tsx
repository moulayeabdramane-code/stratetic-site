"use client";

import { useState } from "react";

/** Formulaire de contact à envoi direct : la demande part via FormSubmit
 *  vers contact@stratetic.art sans ouvrir de client mail chez le visiteur. */
export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [form, setForm] = useState({
    nom: "",
    email: "",
    sujet: "",
    message: "",
  });

  const set =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const valid =
    form.nom.trim().length > 1 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.message.trim().length > 5;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setStatus("sending");
    try {
      const res = await fetch(
        "https://formsubmit.co/ajax/contact@stratetic.art",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            _subject: `Contact site — ${form.sujet || form.nom}`,
            _template: "table",
            Nom: form.nom,
            Email: form.email,
            Sujet: form.sujet || "—",
            Message: form.message,
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
    "w-full rounded-full border border-border bg-white px-5 py-3 text-sm text-brand-navy outline-none transition-colors focus:border-brand-olive";

  if (status === "sent") {
    return (
      <div className="rounded-3xl border border-border bg-white p-8 md:p-12 text-center">
        <p className="font-heading uppercase text-2xl text-brand-navy">
          Message envoyé ✓
        </p>
        <p className="text-muted-foreground text-sm mt-3">
          Merci {form.nom} — nous vous répondons sous 48h ouvrées à{" "}
          {form.email}.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={send}
      className="rounded-3xl border border-border bg-white p-8 md:p-12 flex flex-col gap-4"
    >
      <h2 className="font-heading uppercase text-2xl">Écrivez-nous ici</h2>
      <p className="text-muted-foreground text-sm">
        Votre message part directement dans notre boîte — pas besoin
        d&apos;ouvrir votre messagerie. Réponse sous 48h ouvrées.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Votre nom *"
          value={form.nom}
          onChange={set("nom")}
          className={inputClass}
        />
        <input
          type="email"
          placeholder="Votre email *"
          value={form.email}
          onChange={set("email")}
          className={inputClass}
        />
      </div>
      <input
        type="text"
        placeholder="Sujet (facultatif)"
        value={form.sujet}
        onChange={set("sujet")}
        className={inputClass}
      />
      <textarea
        placeholder="Votre message * — un brief même incomplet suffit"
        value={form.message}
        onChange={set("message")}
        rows={6}
        className="w-full rounded-2xl border border-border bg-white px-5 py-3 text-sm text-brand-navy outline-none transition-colors focus:border-brand-olive resize-none"
      />
      {status === "error" && (
        <p className="text-sm text-red-600">
          L&apos;envoi a échoué. Réessayez, ou écrivez-nous à{" "}
          <a href="mailto:contact@stratetic.art" className="underline">
            contact@stratetic.art
          </a>
          .
        </p>
      )}
      <button
        type="submit"
        disabled={!valid || status === "sending"}
        className="self-start bg-gradient-accent text-white font-heading uppercase px-8 py-4 rounded-full transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === "sending" ? "Envoi…" : "Envoyer le message"}
      </button>
    </form>
  );
}

export default ContactForm;
