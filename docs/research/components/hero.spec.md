# Hero Specification

## Overview
- **Target file:** `src/components/sections/Hero.tsx`
- **Interaction model:** static content over a looping bg video; works with HeaderNav's scroll-detection (no coupling needed, independent).

## DOM Structure
`<section id="hero" className="relative min-h-screen flex flex-col justify-end overflow-hidden bg-brand-navy">`
1. Background layer (absolute inset-0, z-0): `<video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-70">` pointing to `/videos/hero-reel.mp4` (placeholder — file may not exist; wrap in a check or just reference the path and add a code comment `{/* TODO: remplacer par le showreel Stratetic */}`; ALSO add `poster="/brand/hero-poster-placeholder.jpg"` — if that file doesn't exist that's fine, Next won't error at build time for a missing public asset reference, it's just a broken image at runtime, acceptable for this placeholder phase).
2. Dark overlay div absolute inset-0 `bg-brand-navy/40` z-[1].
3. Content wrapper, relative z-10, max-w-[1600px] mx-auto w-full px-6 md:px-10 pb-24 pt-40.
4. Two floating rotated photo-placeholder cards (absolute, top-right area, desktop only `hidden lg:block`): two overlapping `<div>` rounded-3xl border-4 border-white/10 shadow-2xl, aspect-[3/4] w-56, bg-brand-offwhite/10 with a centered muted label "[Photo showreel]", one rotated `-rotate-6` positioned further back/left, one `rotate-3` in front offset down-right — pure decorative placeholders (no real images).
5. H1: "L'AGENCE DE PRODUCTION QUE VOUS CHERCHIEZ" — huge uppercase, `text-[13vw] leading-[0.85] md:text-[7rem] lg:text-[9rem]` (use `clamp()` via arbitrary value or inline style for true fluid scaling: `style={{ fontSize: "clamp(2.5rem, 9vw, 9rem)" }}`), font-heading, white.
6. CTA row (flex gap-8 items-center mt-8): gradient-text link "Parlons-en" (`text-gradient-accent font-heading text-xl uppercase`) + `ArrowDownIcon` (white) + plain link "VOIR NOS RÉALISATIONS" (white, bold, uppercase, text-lg, hover:underline).
7. Below CTA row, intro paragraph (max-w-xl, text-white/80, text-lg mt-10): "Nous accompagnons des marques ambitieuses pour créer du contenu qui capte l'attention, façonne la culture et génère de l'impact."
8. Small eyebrow line above paragraph, uppercase tracking-widest text-xs text-brand-olive: "DU CONTENU QUI CONNECTE, PERFORME ET TOUCHE LES GENS"

## States & Behaviors
- N/A for click/hover on this section specifically (nav handles its own scroll state). The two photo cards are static (no scroll/hover animation per source sweep).
- Video: `muted autoPlay loop playsInline` — required for autoplay to work cross-browser.

## Assets
- Placeholder video path `/videos/hero-reel.mp4` (does not need to exist for the build to pass; note in code comment that the client should supply their real showreel).
- No downloaded images — pure placeholder divs per project's mock-data-for-demo scope.

## Text Content (verbatim FR placeholders)
- Eyebrow: "DU CONTENU QUI CONNECTE, PERFORME ET TOUCHE LES GENS"
- H1: "L'AGENCE DE PRODUCTION QUE VOUS CHERCHIEZ"
- Gradient link: "Parlons-en"
- Plain link: "VOIR NOS RÉALISATIONS"
- Paragraph: "Nous accompagnons des marques ambitieuses pour créer du contenu qui capte l'attention, façonne la culture et génère de l'impact."

## Responsive Behavior
- **Desktop (1440px):** H1 ~9rem, floating photo cards visible top-right.
- **Tablet (768px):** H1 scales down via clamp(), photo cards hidden (`hidden lg:block`), padding reduces.
- **Mobile (390px):** H1 ~2.5-3rem via clamp(), CTA row wraps to column (`flex-col items-start gap-4`), section min-height stays `min-h-screen`.
- **Breakpoint:** `lg` (1024px) for photo cards, general fluid scaling elsewhere via `clamp()`.
