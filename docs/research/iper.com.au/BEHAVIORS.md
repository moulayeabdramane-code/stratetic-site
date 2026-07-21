# Behaviors — iper.com.au (reference for Agence Stratetic clone)

## Global
- **Nav**: fixed/sticky top. Transparent (white text) over hero video. After scrolling past hero (~541px scrollY), background becomes solid `#f6efed`-equivalent (clone: `#f5f5f0`) and text becomes dark (clone: navy `#0d2438`). Implementation: scroll listener or IntersectionObserver on a hero sentinel, toggle a class, `transition: background-color .3s ease, color .3s ease`.
- **Quote wizard overlay**: click-driven multi-step form ("60 seconds is all it will take..." step counter "01/06"). Triggered by "BESPOKE QUOTE" / "REQUEST A QUOTE" buttons. Out of scope for pixel-perfect logic (mock as a simple modal with step indicator + Next button, non-functional multi-step demo is acceptable per "mock data for demo purposes" scope default).
- **Accent gradient**: one-off gradient text/bg treatment, source colors `linear-gradient(90deg, rgb(250,49,92) 1%, rgb(255,101,7))` (pink→orange) used on: "Let's talk" hero link (`background-clip:text`), "OUR EXPERTISE" pill button, "REQUEST A QUOTE" CTA button, footer background (diagonal version). **Clone replacement:** same gradient *treatment* (bg-clip text on links/buttons, diagonal full-bg on footer) but recolored navy→olive, e.g. `linear-gradient(90deg, #0d2438 0%, #96b912 100%)` for buttons/text, and a softer/deeper diagonal `linear-gradient(135deg, #0d2438, #5c6e12)` for the footer surface (footer text stays white/off-white for contrast).

## Section: Hero (`section-video` + `section-hero`)
- Full-bleed looping muted background video (showreel), dark overlay likely ~30-40% black over video for text contrast.
- H1 huge uppercase display type (~178px desktop), CTA row: gradient-text "Let's talk" link + down-arrow icon + "VIEW OUR WORK" plain bold link.
- Two overlapping rotated photo cards (rounded corners ~24px, slight rotation ±6°, drop shadow, z-index stacked) float over the intro paragraph area — **static positioning**, no scroll/hover animation detected in the sweep performed (treat as static decorative images; note for builder to double check on final build via visual QA).
- **Interaction model: scroll-driven** (nav shrink) + static hero content.

## Section: Work (`section-work`, dark bg)
- **Interaction model: scroll-driven horizontal gallery.** Section header ("CONTENT THAT CONNECTS, PERFORMS, AND MOVES PEOPLE" + "(1) What we've done" + "THE WORK" label) is pinned/sticky at the top of the section while 4 case-study cards translate horizontally left as the user scrolls down through the section's extra scroll height (classic scroll-jacked horizontal-scroll pattern, e.g. `position: sticky` container + inner flex row translated via scroll progress, or GSAP ScrollTrigger `pin: true` + horizontal tween).
- Each card: large image/video thumbnail + title (bold uppercase) + short subtitle below, side-by-side 2-up per viewport, next card partially visible entering from the right edge as you scroll.
- Implementation approach: `position: sticky` wrapper the height of (contentWidth - viewportWidth) scaled, inner track `transform: translateX()` driven by a scroll listener computing progress within the section's bounding rect (IntersectionObserver + scroll deltas), OR simpler CSS-only `overflow-x: auto` with `scroll-snap` if exact JS scroll-jacking isn't required for a demo-fidelity clone — **recommend the CSS scroll-snap-in-sticky-container approach** for simplicity/perf unless exact 1:1 scroll-jack feel is required.

## Section: What We Do (`section-what-we-do`, light bg `#f6efed`→ clone `#f5f5f0`)
- **Interaction model: static grid.** "(2) Film and Photo for Ambitious Brands" label + "OUR EXPERTISE" gradient pill button (top-right). 6 cards in a 3-column grid (2 rows), each: icon (simple geometric line-icon), bold uppercase title, gray subtitle paragraph, thin border, rounded corners (~16px), white/cream card bg. No hover elevation detected in sweep — recommend adding a subtle hover lift (`translateY(-4px)` + shadow) as a reasonable, low-risk enhancement consistent with the card affordance, flag as an assumption in the spec.

## Section: Clients + Who We Help (`section-brand`, contains nested sub-sections)
- **Clients list**: static (NOT a marquee/animation — verified: no CSS animation on the collection-list wrapper or items). Large stacked uppercase client names (`text-size-218` class ~ huge font-size), each name is a link with class `div-hover-brand` — hover reveals/highlights (likely a color change or small logo swap; exact hover pixel values not captured, flag as assumption: on hover, name color shifts from black to a muted gray or reveals a small thumbnail — implement a simple `hover:opacity` or `hover:color` accent-olive shift as safe default). "OUR COLLABORATORS" tagline sits above.
- **Who We Help grid**: 2-column list of 6 rows (Agencies, Public Sector, Brands, Video Production Companies, Startups, Non-profit), each row: small square rounded-corner photo thumbnail (with a small "play" badge overlay on at least one, suggesting these thumbnails might link to video case studies) + bold uppercase title + gray paragraph. "LEARN MORE" gradient link/button near section top.
- **Embedded retro-TV video player**: a stylized old-CRT-TV-shaped video player (illustrated frame, antenna, dials) with a real video inside showing a case-study clip, custom scrubber/play controls skinned to match. This is a decorative flourish — clone can approximate with an SVG/CSS TV frame wrapping a native `<video>` with custom controls (play button, time, progress bar, prev/next chevrons as seen in the reference).
- **Interaction model:** static / hover-only (no scroll-driven behavior detected here beyond the page-level scroll).

## Section: Blog (`section-play`)
- 2 simple teaser cards: large image (rounded corners) + bold uppercase title + gray subtitle. "OPEN ALL BLOGS" link/button. Static, no special behavior beyond a probable hover image-zoom (safe default: `hover:scale-105` on the image with `overflow:hidden` on the container).

## Section: Testimonials (`section-testimonials`)
- **Interaction model: carousel (slick-carousel@1.8.1 detected via `<link>` in `<head>`).** White rounded cards on the section's off-white bg, one large "active" card + partial peek of the next/previous card at the edges (typical slick `centerMode` config). Each card: quote paragraph (bold, dark) + small circular avatar + name + role/company. Likely auto-plays and/or supports drag/swipe; arrows may be hidden in favor of drag. Clone recommendation: implement with a lightweight React carousel (embla-carousel-react or a hand-rolled scroll-snap flex row) rather than pulling in slick/jQuery — preserve the *visual* peek-a-boo layout and drag/swipe behavior, not the literal library.

## Section: CTA (`section-cta`)
- Static two-column: big uppercase headline "START YOUR BRAND'S NEXT GREAT STORY" + paragraph + gradient "REQUEST A QUOTE" pill button on the left; a photo (team/behind-the-scenes) on the right with rounded corners.

## Section: Footer (`section-footer`)
- Full-bleed diagonal gradient background (pink→orange on source; navy→olive on clone), white text throughout.
- Huge uppercase "GET IN TOUCH" heading top-right, brand name + short paragraph top-left.
- 4-column link list: Sitemap (Projects, What we do, Who we help, Play, Contact us), Legal (Privacy Policy, Term of use), Socials (Vimeo, Facebook, Instagram, LinkedIn, Youtube), Contact (email, phone, address) — each link has a trailing "→" arrow, likely a hover `translateX` micro-animation on the arrow (safe default to implement).
- Bottom-left copyright line.

## Responsive
- Not exhaustively swept at 768px/390px per section due to time constraints of this session; builders should default to: 3-col grids → 1-col stack under ~768px, 2-col "who we help"/blog → 1-col stack under ~640px, horizontal work-gallery → vertical stacked cards (disable scroll-jack) under ~768px, hero H1 clamp from 178px down to ~48px via `clamp()`, footer 4-col → 2-col (tablet) → 1-col (mobile).
