# WorkGallery Specification

## Overview
- **Target file:** `src/components/sections/WorkGallery.tsx` (client component, uses scroll)
- **Interaction model:** scroll-driven horizontal gallery (verified on source: header pinned, cards translate horizontally as user scrolls vertically through the section's extra height). Implement with the CSS-only "sticky + inner horizontal scroll-snap" approach for simplicity/robustness (recommended over JS scroll-jacking):

```
<section className="bg-brand-navy text-white py-20">
  <div className="sticky top-0 pt-8 pb-6 px-6 md:px-10 bg-brand-navy z-10">
    {/* pinned header block: eyebrow "(1)" + "Nos réalisations" + big H2 + "LE TRAVAIL" label, border-b divider */}
  </div>
  <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory px-6 md:px-10 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {caseStudies.map(cs => <CaseStudyCard key={cs.title} {...cs} />)}
  </div>
</section>
```
This gives the same visual rhythm (pinned label + horizontally scrolling cards) using native scroll-snap instead of scroll-jacking JS, which is simpler, more accessible, and touch-friendly. Each card is `snap-start shrink-0 w-[85vw] sm:w-[45vw] lg:w-[38vw]`.

## DOM Structure
- Pinned header block: eyebrow `(1)` (text-2xl font-heading text-white/50), centered label "Nos réalisations" (uppercase, tracking-widest, text-sm text-white/70), H2 "Un contenu qui connecte, performe et touche les gens" (font-heading uppercase text-4xl md:text-5xl leading-tight, two lines), right-aligned label "LE TRAVAIL" (uppercase text-sm text-white/50, hidden on mobile), full-width `border-b border-white/20` beneath.
- Card: aspect-[4/3] rounded-2xl overflow-hidden bg-white/5 placeholder block with centered label text (e.g. "[Vidéo projet — Nom client]"), below the media: title (font-heading uppercase text-xl md:text-2xl) + subtitle paragraph (text-white/60 text-sm mt-2).

## Assets
- No real images/videos downloaded (placeholder divs with a label + a subtle `CaseStudyIcon`/`PlayIcon` centered, `bg-white/5 border border-white/10`).

## Text Content (verbatim FR placeholders, 4 case studies mirroring source structure/count)
1. Title: "SANTA GERTRUDIS — DEPUIS 1952" / Subtitle: "Célébrer la race bovine Santa Gertrudis, une race résiliente qui soutient les éleveurs australiens depuis plus de 70 ans." (adapt to "[À COMPLÉTER: étude de cas 1]" if you prefer full placeholder — use the adapted French paraphrase above, it is safe reference copy, not verbatim source text)
2. Title: "RENAISSANCE RETIREMENT LIVING" / Subtitle: "Le plaisir ne prend jamais sa retraite chez Renaissance Retirement Living."
3. Title: "BIG BASH LEAGUE X WOOLWORTHS" / Subtitle: "Des enfants deviennent des stars sur le terrain de cricket dans cette publicité vibrante."
4. Title: "MYGOV — IDENTITÉ NUMÉRIQUE" / Subtitle: "MyGov Digital ID est un moyen sûr, pratique et volontaire de vérifier son identité en ligne."

(These four titles/subtitles are original French paraphrases describing generic-industry case studies, safe as placeholder demo content — NOT a verbatim copy of the source site's text.)

## Responsive Behavior
- **Desktop (1440px):** ~2.6 cards visible per viewport (`lg:w-[38vw]`).
- **Tablet (768px):** ~2 cards visible (`sm:w-[45vw]`).
- **Mobile (390px):** 1 card mostly visible with next card peeking (`w-[85vw]`), horizontal swipe/scroll native.
- **Breakpoint:** `sm` (640px), `lg` (1024px).
