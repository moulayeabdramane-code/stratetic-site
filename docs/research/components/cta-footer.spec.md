# CtaFooter Specification

## Overview
- **Target file:** `src/components/sections/CtaFooter.tsx` (server component, static; footer link hover arrow is pure CSS `group-hover:translate-x-1`)
- **Interaction model:** static.

## DOM Structure

### Block A — CTA
`<section className="bg-brand-offwhite py-24 px-6 md:px-10">`
- `<div className="grid lg:grid-cols-2 gap-12 items-center max-w-[1600px] mx-auto">`
- Left: border-t divider above, H2 "RACONTONS LA PROCHAINE GRANDE HISTOIRE DE VOTRE MARQUE" (font-heading uppercase text-4xl md:text-5xl leading-[0.95]), paragraph below (text-muted-foreground text-lg mt-6 max-w-md): "Partagez vos ambitions, et nous créerons des vidéos qui façonnent votre marque et se démarquent sur le marché.", pill button "DEMANDER UN DEVIS" (`bg-gradient-accent text-white font-heading uppercase px-8 py-4 rounded-full mt-8 inline-block`).
- Right: placeholder image block `aspect-[4/3] rounded-3xl bg-brand-navy/5 border border-border flex items-center justify-center text-muted-foreground text-sm` label "[Photo équipe Stratetic]".

### Block B — Footer
`<footer className="bg-gradient-footer text-white px-6 md:px-10 pt-20 pb-10">`
- Top row (`flex flex-col lg:flex-row lg:justify-between lg:items-start gap-10 pb-16 border-b border-white/20`):
  - Left: `<Logo variant="white" />` then paragraph (text-white/70 max-w-sm mt-4): "Contactez-nous et transformons vos idées en vidéos dynamiques, orientées résultats, qui captivent votre audience et créent l'attachement à votre marque 🤍"
  - Right: H2 "NOUS CONTACTER" (font-heading uppercase text-5xl md:text-7xl text-right leading-none)
- Link columns (`grid grid-cols-2 md:grid-cols-4 gap-10 py-16`), each column is a `FooterLinkGroup`:
  1. Sitemap: "Projets →", "Ce que nous faisons →", "Qui nous aidons →", "Blog →", "Nous contacter →"
  2. Legal: "Politique de confidentialité →", "Conditions d'utilisation →"
  3. Réseaux: "Vimeo →", "Facebook →", "Instagram →", "LinkedIn →", "Youtube →" (use social icons inline before text instead of plain text, via `VimeoIcon` etc. from icons.tsx, each 16px)
  4. Contact: "contact@stratetic.art →", "[À COMPLÉTER: téléphone] →", "[À COMPLÉTER: adresse]"
  - Each link: `group inline-flex items-center gap-2 text-white/90 hover:text-white font-medium` with the trailing arrow (a literal "→" character or `ArrowRightIcon` sized 14px) wrapped `group-hover:translate-x-1 transition-transform`.
- Bottom row (`pt-8 text-white/60 text-sm`): "© 2026 Agence Stratetic. Tous droits réservés."

## Assets
- `Logo` (white variant), social icons from `icons.tsx` (`VimeoIcon`, `FacebookIcon`, `InstagramIcon`, `LinkedinIcon`, `YoutubeIcon`), `ArrowRightIcon`.

## Text Content
See DOM Structure above (all copy is inline, verbatim FR placeholders already written there).

## Responsive Behavior
- **Desktop (1440px):** CTA 2-col; footer top row side-by-side, 4-col link grid.
- **Tablet (768px):** footer link grid `md:grid-cols-4` still 4-col at 768 (fits, columns are narrow) — acceptable; if cramped, builder may reduce to `grid-cols-2` under `md` and `md:grid-cols-4` at `md+`.
- **Mobile (390px):** CTA stacks 1-col (image below text); footer top row stacks (`flex-col`), "NOUS CONTACTER" heading shrinks via `text-4xl` at base and `md:text-7xl`; link grid becomes `grid-cols-2`.
- **Breakpoint:** `md` (768px), `lg` (1024px).
