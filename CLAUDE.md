# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> The import above is the single most important rule: this is **Next.js 16** with
> breaking changes from older versions. Read the relevant guide in
> `node_modules/next/dist/docs/` before writing framework code, and heed deprecation notices.

## What this is

`agence-stratetic` — the marketing site for **Stratetic**, an audiovisual production /
design / communication agency in Niamey, Niger. The whole UI is in **French**
(routes, copy, code comments). Live at stratetic.art.

## Commands

```bash
npm run dev      # dev server on http://localhost:3000
npm run build    # production build (also the CI/Docker build step)
npm run start    # serve the production build
npm run lint     # eslint (flat config, eslint-config-next)
```

There is **no test framework** wired up — no test runner, no test files. Don't invent a `test` command; verify changes with `npm run build` + the dev server.

## Stack

- **Next.js 16** App Router, **React 19**, **TypeScript strict**. Path alias `@/*` → `src/*`.
- **Tailwind CSS v4** — CSS-first, **no `tailwind.config`**. Theme + tokens live in `src/app/globals.css` via `@theme inline` and `:root`. Configured through `@tailwindcss/postcss`.
- **shadcn v4** (`base-nova` style) on **Base UI** (`@base-ui/react`), `lucide-react` icons. Config in `components.json`; `cn()` helper in `src/lib/utils.ts`.
- **Lenis** smooth scroll, mounted globally in `SmoothScrollProvider` (disabled under `prefers-reduced-motion`).

## Architecture

### The scroll-world hero (the non-obvious part — read all three files together)

The landing hero is a **scroll-scrubbed camera-flight**: as you scroll, pre-rendered
video clips play frame-by-frame, flying "into" each scene and connecting to the next.

- `src/components/scroll-world/scrub-engine.js` — a **framework-agnostic, zero-dependency vanilla-JS engine** (~530 lines). It builds its **own DOM** and injects its **own namespaced CSS** (`@layer sw`, `.sw-*` classes) into a container element you hand it via `mountScrollWorld(el, config)`. Treat this as a vendored library; prefer configuring/overriding it over editing internals.
- `scrub-engine.d.ts` — the TypeScript surface (`ScrollWorldConfig`, `ScrollWorldSection`, `mountScrollWorld`).
- `src/components/scroll-world/ScrollWorldHero.tsx` — the React bridge. It:
  - holds the full config (6 sections + 5 connector clips, olive accent `#96b912`);
  - mounts the engine **exactly once** via a ref + `el.dataset.swMounted` guard (survives StrictMode / Fast Refresh double-effects);
  - toggles a `.sw-passed` class once scroll passes the world, **releasing the engine's fixed layers** so the normal page sections below become visible/clickable (the engine assumes a full dedicated page; this repo embeds it above other content);
  - renders a static `[data-sw-seo]` block — the **only crawlable / no-JS version** of the hero, since the engine is client-only.
- Engine CSS is overridden by **non-layered** rules at the bottom of `globals.css` (they beat `@layer sw`): the engine's topbar is hidden (the site uses its own `HeaderNav`), copy is repositioned, and `.sw-passed` fades the fixed layers out.
- Runtime assets: `public/scroll-world/` (stills + posters, `*-m.webp` = mobile) and `public/scroll-world/vid/` (`brief.mp4`… dives, `conn1..5.mp4` connectors, `*-m.mp4` = mobile). The raw generation workspace in `assets/scroll-world-work/` (Seedance/Kling renders, JSON/err logs) is **not shipped** — only the pipeline's final output lives under `public/`.

### Pages & content

- `src/app/` App Router pages, all French: `/` plus `a-propos`, `services`, `realisations`, `blog`, `contact`, `confidentialite`, `mentions-legales`.
- The home page (`app/page.tsx`) is `HeaderNav` + `ScrollWorldHero` + a stack of section components from `src/components/sections/`.
- **Content is inline**, not from a CMS or data files: each section/page declares `const` arrays/objects at the top of its own file, typed against the interfaces in `src/types/content.ts`. To change copy, edit the component.
- Shared building blocks: `components/motion/Reveal.tsx` (scroll-in animation), `components/sections/PageHero.tsx`, `components/ui/` (shadcn primitives).

### Design tokens

Brand palette in `globals.css :root` — `--brand-navy #0d2438`, `--brand-olive #96b912`
(the accent), `--brand-offwhite #f5f5f0` — exposed as Tailwind utilities (`bg-brand-navy`,
`text-brand-olive`, …) and gradient helpers (`.text-gradient-accent`, `.bg-gradient-footer`).
Fonts: **Inter** (`--font-body`) + **Archivo** (`--font-heading`, weights 700/800/900);
`h1–h4` are forced uppercase / weight-900 in `@layer base`. A `.dark` block exists but the
site ships **light-only** (no theme toggle is wired).

## Deployment

- `next.config.ts` sets `output: "standalone"` (minimal `.next/standalone` server) and `images.unoptimized: true` (images are pre-sized `.webp` served as-is — **no `sharp` at runtime**; don't reach for `next/image` optimization).
- Multi-stage `Dockerfile` (`node:20-slim`) → standalone runner on **Coolify** (VPS, domain stratetic.art). It uses `npm install` **not `npm ci`** on purpose, to tolerate npm 10/11 lockfile drift — keep it that way.
