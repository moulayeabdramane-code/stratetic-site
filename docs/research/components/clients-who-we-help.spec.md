# ClientsWhoWeHelp Specification

## Overview
- **Target file:** `src/components/sections/ClientsWhoWeHelp.tsx` (server component; the client-list hover can be plain CSS, no JS needed)
- **Interaction model:** static list with CSS-only hover color shift on client names; static grid for "who we help"; a decorative video-player mockup (no scroll behavior).

## DOM Structure (three stacked blocks in one section, matches source's nested `section-brand`)

### Block A — Clients list
`<div className="py-24 px-6 md:px-10 border-b border-border">`
- Small label top: "NOS PARTENAIRES" (uppercase tracking-widest text-sm text-muted-foreground mb-8)
- Stack of client name rows, each: `<div className="border-b border-border py-4 group">` containing a `<span>` with class `text-[clamp(2rem,8vw,7rem)] font-heading uppercase leading-none text-brand-navy transition-colors duration-300 group-hover:text-brand-olive cursor-default">`. 8-10 placeholder client names stacked (see Text Content).
- Paragraph below the stack (max-w-2xl mt-8 text-muted-foreground): "Que vous soyez une marque locale ou internationale, nous aidons les organisations avant-gardistes à créer du contenu vidéo qui connecte et qui a de l'impact."

### Block B — Who We Help
`<div className="py-24 px-6 md:px-10 grid lg:grid-cols-[1fr_420px] gap-16 items-start border-b border-border">`
- Left col: header row (eyebrow "(4)" + "Qui nous aidons" label + "EN SAVOIR PLUS" gradient pill link), then `grid sm:grid-cols-2 gap-x-10 gap-y-8 mt-10` of 6 `AudienceRow` items.
  - AudienceRow: flex gap-4 items-start; thumbnail placeholder `w-16 h-16 rounded-xl bg-brand-navy/5 border border-border shrink-0 flex items-center justify-center text-[10px] text-muted-foreground text-center` (label "[Photo]"); text block: title (font-heading uppercase text-lg) + description (text-sm text-muted-foreground mt-1).
- Right col (`hidden lg:block`): `RetroTvPlayer` decorative component — a CSS-drawn "old TV" frame (rounded rectangle body `bg-brand-navy`, screen inset `bg-black rounded-lg`, two small "antenna" lines via absolute positioned rotated divs on top corners, 2-3 small circle "knobs" on the right side of the frame) wrapping a placeholder screen area with a centered `PlayIcon` button and a fake scrubber bar (`div` with a smaller olive-filled inner div at ~40% width) + fake timestamp text "01:33".

## Assets
- No icons needed beyond `PlayIcon` (already built).
- Thumbnails/photos: pure placeholder blocks, no downloads.

## Text Content (verbatim FR placeholders)
### Client names (stack, 9 items)
BERRY BOTTLE · CLIENT ENTREPRISE · ÉTABLISSEMENT SCOLAIRE · EXTRA MEDIA · GARMIN · GOUVERNEMENT FÉDÉRAL · SANTÉ PUBLIQUE · UNIVERSITÉ · GROUPE SANTÉ
(Use these 9 generic/placeholder names — do not reuse the real source client names/logos, since those are third-party trademarks unrelated to Stratetic.)

### Who We Help (6 cards)
1. "AGENCES" — "Pour amplifier leur vision créative, nous aidons les agences de publicité en tant que partenaire créatif, en livrant du contenu vidéo corporate qui dépasse les attentes des clients."
2. "SECTEUR PUBLIC" — "Nous aidons les organismes publics à créer des solutions de production vidéo professionnelles, avec un historique de campagnes efficaces."
3. "MARQUES" — "Pour renforcer la présence de marque et l'engagement client, nous aidons les marques à créer du contenu vidéo qui résonne avec leur audience cible."
4. "SOCIÉTÉS DE PRODUCTION VIDÉO" — "Des services de production vidéo spécialisés proposés à d'autres agences, en support de tournages complexes et de post-production."
5. "STARTUPS" — "Nous aidons les startups à faire forte impression avec des vidéos soignées qui mettent en valeur leur proposition de valeur unique."
6. "ASSOCIATIONS" — "Pour donner vie à leur travail d'impact, nous accompagnons les associations en tant que partenaire créatif, avec un contenu qui touche les audiences."

### Section labels
- "(3)" and "(4)" numbering, "OUR COLLABORATORS" → "NOS PARTENAIRES", "LEARN MORE" → "EN SAVOIR PLUS"

## Responsive Behavior
- **Desktop (1440px):** client names huge via clamp(); who-we-help 2-col grid + right-side TV player visible.
- **Tablet (768px):** client name font size scales down via clamp() automatically; who-we-help stays 2-col; TV player hidden (`hidden lg:block` already handles this).
- **Mobile (390px):** who-we-help grid collapses to 1 column (`sm:grid-cols-2` → default 1 col).
- **Breakpoint:** `sm` (640px), `lg` (1024px).
