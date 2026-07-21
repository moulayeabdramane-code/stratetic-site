# HeaderNav Specification

## Overview
- **Target file:** `src/components/sections/HeaderNav.tsx` (client component, `"use client"`)
- **Interaction model:** scroll-driven (background/color swap) + click-driven (mobile menu toggle, quote wizard trigger)
- **Reference:** iper.com.au nav bar, cloned structure/behavior, Stratetic branding

## DOM Structure
`<header>` fixed top-0 inset-x-0 z-50, full width, flex row, justify-between, items-center, padding `px-6 md:px-10 py-4`.
- Left: `<Logo variant="white">` when not scrolled (over hero), swaps to `<Logo variant="color">` when scrolled (state below).
- Center/right: nav link row (hidden below `md`, replaced by hamburger button): About, Who we help, What we do (with chevron - dropdown, mock/static), Who we've done (dropdown), Content Subscription, Blog, Get in touch.
- Far right: pill button "DEVIS EXPRESS" (bespoke quote CTA) — olive/navy gradient bg, white bold uppercase text, rounded-full, opens the quote wizard modal (see below).
- Mobile: hamburger icon button (only rendered `md:hidden`) toggling a full-screen mobile nav overlay with same links stacked, bg navy, white text.

## Computed Styles (approximate, adapted from source, apply via Tailwind utility classes — do not need literal getComputedStyle values, source uses simple bold sans nav)
### Header container
- position: fixed; z-index: 50; transition: background-color .3s ease, color .3s ease, box-shadow .3s ease
- Before scroll (over hero): `bg-transparent text-white`
- After scroll past hero (~window.scrollY > 400): `bg-brand-offwhite text-brand-navy shadow-sm`
### Nav links
- font: font-sans (Inter), font-weight 600, text-sm md:text-[15px], uppercase tracking-wide, gap-8 (flex row)
- hover: `text-brand-olive` transition-colors
### CTA pill button
- `bg-gradient-accent text-white font-heading text-sm uppercase px-6 py-3 rounded-full` , hover: slight scale/opacity change (`hover:opacity-90`)

## States & Behaviors

### Scroll-triggered nav solidify
- **Trigger:** `window.scrollY > 100` (roughly past the initial video/hero band) — implement via a scroll event listener (throttled with `requestAnimationFrame`) or `useEffect` + passive scroll listener, toggle boolean state `isScrolled`.
- **State A (top):** transparent bg, white text/logo (white logo variant)
- **State B (scrolled):** `--brand-offwhite` bg, navy text/logo (color logo variant), `shadow-sm`
- **Transition:** `transition-colors duration-300 ease-out`

### Quote wizard modal (click-driven)
- **Trigger:** click on "DEVIS EXPRESS" pill (header) or any other CTA button reused across the page (`onOpenQuote` callback prop pattern — export a small client component `QuoteWizardModal` + a shared context/state, OR simplest: local `useState` in a top-level `QuoteWizardProvider` wrapping the page, with a `useQuoteWizard()` hook exposing `open()`).
- Modal: fixed inset-0 z-[100], backdrop `bg-brand-navy/80 backdrop-blur-sm`, centered white rounded-2xl card `max-w-lg w-full p-8`.
- Content: step counter "01/06" top-left (small, muted), heading "60 secondes suffisent pour obtenir un devis pour votre prochain projet vidéo", subtext "Pour commencer, dites-nous en un peu plus sur vous...", a single mock text input (placeholder "Votre nom"), "SUIVANT" button (olive bg, full width, rounded-full). Button is decorative/mock (no real multi-step logic needed — this is a demo per scope defaults), on click just show a small "Merci, nous vous recontacterons" message swap. Close button (X icon, top-right) closes modal.
- **Transition:** modal fade+scale in (`data-[state=open]:animate-in fade-in zoom-in-95`, use shadcn `Dialog` primitive if simplest).

### Mobile menu (click-driven)
- **Trigger:** click hamburger icon (`md:hidden`)
- **State A (closed):** overlay hidden (`translate-x-full` or `opacity-0 pointer-events-none`)
- **State B (open):** full-screen overlay `bg-brand-navy text-white`, links stacked vertically, large `text-2xl font-heading uppercase`
- **Transition:** `transition-transform duration-300 ease-out`

## Per-State Content
### Nav links (verbatim structure, FR copy)
- À propos → `/a-propos`
- Qui nous aidons → `/qui-nous-aidons`
- Ce que nous faisons → `/ce-que-nous-faisons` (dropdown chevron, dropdown items are decorative mock links matching the 6 service names, can link to `#services`)
- Nos réalisations → `/realisations` (dropdown chevron, mock items linking to `#realisations`)
- Abonnement contenu → `/abonnement-contenu`
- Blog → `/blog`
- Nous contacter → `/contact`
- CTA pill: "DEVIS EXPRESS"

## Assets
- `Logo` component (`src/components/Logo.tsx`, already built) — pass `variant="white"` / `variant="color"` per scroll state.
- Icons: `ChevronDownIcon`, `CloseIcon` from `src/components/icons.tsx` (already built).
- Use shadcn `Dialog` for the modal if available (`npx shadcn@latest add dialog` — run this command first, it's already initialized in the project) — otherwise a hand-rolled fixed-overlay div is acceptable.

## Text Content (verbatim, FR placeholders)
See "Per-State Content" above for nav labels. Modal copy:
- "01/06"
- "60 secondes suffisent pour obtenir un devis pour votre prochain projet vidéo"
- "Pour commencer, dites-nous en un peu plus sur vous..."
- Button: "SUIVANT"

## Responsive Behavior
- **Desktop (1440px):** full horizontal nav row, all links visible.
- **Tablet (768px):** collapse nav links + CTA into hamburger menu; keep logo + hamburger icon visible in header bar.
- **Mobile (390px):** same as tablet, header bar padding reduces to `px-4 py-3`.
- **Breakpoint:** `md` (768px) — Tailwind default.
