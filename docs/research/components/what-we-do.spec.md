# WhatWeDo Specification

## Overview
- **Target file:** `src/components/sections/WhatWeDo.tsx` (server component, static)
- **Interaction model:** static grid with a hover lift on cards (assumption noted in BEHAVIORS.md — safe, low-risk addition).

## DOM Structure
`<section className="bg-brand-offwhite py-24 px-6 md:px-10">`
- Header row (flex justify-between items-end flex-wrap gap-6, `border-b border-border pb-6 mb-12`): left side eyebrow "(2)" (text-2xl font-heading text-brand-navy/40) + label "Film et photo pour marques ambitieuses" (uppercase text-sm tracking-widest); right side pill link "NOTRE EXPERTISE" (`bg-gradient-accent text-white rounded-full px-6 py-3 font-heading uppercase text-sm`).
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12`, 6 `ServiceCard` items.
- ServiceCard: `rounded-2xl border border-border bg-white p-8 flex flex-col gap-6 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg`, icon (40x40, `text-brand-navy`) top, title (font-heading uppercase text-xl leading-tight) mid, description (text-muted-foreground text-sm) bottom.
- Optional tagline banner below grid (`mt-16 text-center`): "AU SERVICE DES PLUS GRANDES MARQUES AU MONDE DEPUIS 2007" → adapt to Stratetic: "AU SERVICE DE MARQUES AMBITIEUSES DEPUIS [ANNÉE DE CRÉATION]" (font-heading uppercase text-2xl md:text-3xl text-brand-navy) + paragraph below (text-muted-foreground max-w-2xl mx-auto mt-4): "[À COMPLÉTER: texte de présentation Stratetic — implantation, zone géographique, positionnement]"

## Assets
- Icons from `src/components/icons.tsx` via `serviceIconMap`: `commercial`, `corporate`, `social`, `brandFilm`, `animation`, `education`.

## Text Content (verbatim FR placeholders, 6 services mirroring source structure/count)
1. commercial — "PRODUCTION DE PUBLICITÉS TV" — "Racontez l'histoire de votre marque de façon fraîche et engageante, qui capte l'attention et génère des résultats."
2. corporate — "PRODUCTION DE CONTENU CORPORATE" — "Nous créons des vidéos corporate stratégiques et créatives qui racontent votre histoire et ont un impact réel."
3. social — "CONTENU RÉSEAUX SOCIAUX" — "Des visuels qui donnent envie d'être partagés et transforment les internautes en fans de votre marque."
4. brandFilm — "FILM DE MARQUE" — "Des histoires de marque cinématographiques qui captivent l'audience et laissent une impression durable."
5. animation — "ANIMATION & EXPLAINERS" — "Nous donnons vie à vos concepts avec des animations qui éclairent, engagent et font comprendre."
6. education — "VIDÉOS DE FORMATION" — "Nous produisons des vidéos de formation qui font monter les équipes en compétence et simplifient l'apprentissage."

## Responsive Behavior
- **Desktop (1440px):** 3 columns.
- **Tablet (768px):** 2 columns.
- **Mobile (390px):** 1 column, header row stacks (`flex-col items-start`).
- **Breakpoint:** `md` (768px), `lg` (1024px).
