# Page Topology — iper.com.au (source reference for Agence Stratetic clone)

Rebrand target: **Agence Stratetic** (stratetic.art). Content replaced with FR placeholders. Palette replaced (navy `#0d2438` / olive `#96b912` / off-white `#f5f5f0`) per user brief. Structure, layout, animations cloned from source.

## Global
- Body font: `Neuemontreal` (400/500/700) → replaced with **Inter** (Google Fonts, free) for the clone.
- Heading font: `Mangogrotesque` / `Mango Grotesque Vf` (weight 900, uppercase, huge display sizes ~178px hero) → replaced with **Archivo** (Google Fonts, weight 900) — closest free equivalent to a bold uppercase grotesque display face.
- Body bg: `#fff` (site) → `#f5f5f0` (Stratetic off-white) for light sections.
- Dark sections bg: `rgb(20,20,20)` (site near-black) → `#0d2438` (Stratetic navy).
- Neutral off-white band bg: `rgb(246,239,237)` (site cream) → `#f5f5f0` (Stratetic off-white, same role).
- No accent color on source (monochrome). Clone adds **olive `#96b912`** as accent: CTA button fills, hover underlines, small tag/label highlights, active states.
- Nav is transparent overlay on hero (text white), becomes solid off-white bar after scroll (`.navbar` bg `rgb(246,239,237)` → `#f5f5f0`, text navy).

## Sections (top-to-bottom, pixel offsets at 1440px viewport, source page)

| # | Section class | Top (px) | Height (px) | Interaction model | Stratetic replacement content |
|---|---|---|---|---|---|
| 0 | Quote-wizard overlay (first load) | overlay | n/a | click-driven multi-step form ("60 seconds..." step 1/6) | Same wizard mechanic, FR copy, Stratetic branding |
| 1 | `section-video` + `section-hero` | 0–1568 | 477+1028 | scroll (nav shrink/solidify on scroll past hero), background video loop | Hero headline "L'AGENCE DE PRODUCTION QUE VOUS CHERCHIEZ" (placeholder), same CTA buttons (Parlons-en / Voir nos réalisations) |
| 2 | `section-work` (dark) | 1568–4108 | 2540 | click-driven case-study tabs/carousel | "(1) Nos réalisations" — 4 case-study cards, FR placeholder copy |
| 3 | `section-what-we-do` (light) | 4108–5353 | 1244 | static grid, hover cards | "(2) Notre expertise" — 6 service cards |
| 4 | `section-brand` | 5353–9846 | 4493 | tagline + clients logo marquee (auto-scroll) + "Who we help" grid | "(3) Nos clients" marquee + "(4) À qui nous aidons" 6 cards |
| 5 | `section-help` | 9846–10679 | 833 | static / already counted above per DOM nesting — verify on build | merged into section 4 spec if nested |
| 6 | `section-play` | 10679–11477 | 798 | blog teaser cards | "(5) Blog" — 2 post teasers |
| 7 | `section-testimonials` | 11477–12114 | 637 | auto-playing slick carousel, drag/swipe | testimonials carousel, FR placeholder quotes (keep same count/structure) |
| 8 | `section-cta` | 12114–12532 | 419 | static | "Racontons la prochaine grande histoire de votre marque" CTA |
| 9 | `section-footer` | 12532–13142 | 572 | static, hover links | Stratetic footer: logo (white variant), nav links, socials, contact placeholder, copyright |

Note: `section-help` and others may be nested inside `section-brand`'s DOM subtree rather than siblings — confirmed via DOM walk during component extraction, spec files reflect actual nesting.

## Global behaviors
- Nav: transparent over hero → solid `#f5f5f0` bg + navy text after scrolling past hero (~541px scrollY, i.e. past `section-video`).
- Clients marquee: infinite auto-scroll horizontal (no click).
- Testimonials: slick-carousel (jsdelivr slick-carousel@1.8.1 detected in source `<link>` tags) — arrows/dots, possibly autoplay.
- Case-study "work" section: numbered "(1)" prefix pattern repeats per section — likely a shared numbered-section-label component used across sections 2–7.
