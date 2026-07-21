# BlogTestimonials Specification

## Overview
- **Target file:** `src/components/sections/BlogTestimonials.tsx` (client component for the testimonials drag/scroll row; blog grid can be static/server markup inside the same file, component itself needs `"use client"` for the carousel scroll-snap + optional drag handling)
- **Interaction model:** Blog = static grid. Testimonials = carousel (peek-a-boo layout via scroll-snap flex row, native drag-to-scroll via CSS `overflow-x-auto` + `scroll-snap-type: x mandatory`, no external carousel library needed).

## DOM Structure

### Block A — Blog
`<div className="py-24 px-6 md:px-10 bg-brand-offwhite border-b border-border">`
- Header row: eyebrow "(5)" + label "Explorer tendances, insights et parcours créatifs" + pill link "VOIR TOUS LES ARTICLES".
- Grid `grid md:grid-cols-2 gap-8 mt-10`, 2 `BlogCard`: image placeholder (aspect-[16/10] rounded-2xl bg-brand-navy/5 border border-border overflow-hidden group, label "[Image article]", `group-hover:scale-105 transition-transform duration-500` on an inner placeholder div to simulate the zoom), title (font-heading uppercase text-xl md:text-2xl mt-4), excerpt (text-muted-foreground text-sm mt-2).

### Block B — Testimonials
`<div className="py-24 bg-brand-offwhite">`
- Small eyebrow centered or left, in px-6 md:px-10 container: "(6)" + "Ce que nos clients disent de nous" (adapt source "WE'RE KIND OF A BIG DEAL... ACCORDING TO OUR CLIENTS" → FR: "ILS NOUS FONT CONFIANCE. ENFIN, C'EST CE QU'ILS DISENT.")
- Scroll row: `<div className="flex gap-6 overflow-x-auto snap-x snap-mandatory px-6 md:px-10 pt-10 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">`, 6-8 `TestimonialCard` (mirrors source's larger list, trimmed for placeholder brevity):
  - Card: `snap-center shrink-0 w-[85vw] sm:w-[420px] bg-white rounded-3xl border border-border p-8 flex flex-col gap-6`; quote paragraph (text-lg font-medium text-brand-navy leading-snug); footer row (flex items-center gap-3 mt-auto): circular avatar placeholder (`w-10 h-10 rounded-full bg-brand-navy/10`), name (font-semibold text-sm) + role (text-xs text-muted-foreground).

## Assets
- No real photos — placeholder blocks per scope defaults (mock data for demo).

## Text Content (verbatim FR placeholders)
### Blog posts (2)
1. "COMMENT BRIEFER UN TALENT SANS PERDRE DE TEMPS SUR LE TOURNAGE" — "Le guide d'un producteur expérimenté pour briefer les talents de façon à améliorer leur performance et respecter le planning."
2. "LES AUTORISATIONS DE TOURNAGE EN FRANCE" — "Permis, autorisations et usage de l'espace public sont les causes les plus fréquentes de retard de tournage. Cet article explique quand une autorisation est nécessaire et comment nous nous en occupons pour nos clients."

### Testimonials (6 placeholders, generic/anonymized — do NOT reuse the real named clients from the source site)
1. "L'équipe de Stratetic est toujours un plaisir à travailler. Leur travail est toujours livré au plus haut niveau, dans les délais et le budget." — "Responsable Marketing" — "Enseigne Retail"
2. "Nous avons fait appel à Stratetic pour nos publicités. Une équipe créative, à l'écoute, et toujours dans les temps." — "Directeur Commercial" — "PME industrielle"
3. "Un travail d'une grande qualité professionnelle du script au montage final. Les retours du public ont été très positifs." — "Chargée de communication" — "Établissement d'enseignement"
4. "Stratetic a su orienter notre projet dans une direction créative et émotive, avec un résultat visuellement magnifique." — "Responsable Administratif" — "Collectivité locale"
5. "Une expérience de production fluide du premier brief jusqu'à la livraison finale. Nous recommandons sans hésiter." — "Fondateur" — "Startup"
6. "Le résultat a dépassé nos attentes et Stratetic a parfaitement compris notre audience cible." — "Responsable Communication" — "Organisme public"

## Responsive Behavior
- **Desktop (1440px):** blog 2-col grid; testimonials show ~2.3 cards with peek.
- **Tablet (768px):** blog 2-col retained (`md:grid-cols-2`); testimonials show ~1.5 cards (`sm:w-[420px]`).
- **Mobile (390px):** blog collapses to 1 col; testimonials show 1 card mostly, peek of next (`w-[85vw]`).
- **Breakpoint:** `sm` (640px), `md` (768px).
