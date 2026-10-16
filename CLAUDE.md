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

- `src/app/(site)/` App Router pages, all French: `/` plus `a-propos`, `services`, `realisations`, `blog`, `contact`, `confidentialite`, `mentions-legales`.
- The home page (`app/(site)/page.tsx`) is `HeaderNav` + `ScrollWorldHero` + a stack of section components from `src/components/sections/`.
- **Content is inline** for most sections: each section/page declares `const` arrays/objects at the top of its own file, typed against `src/types/content.ts`. To change that copy, edit the component.
- **Exception — Réalisations come from the Payload admin** (`/admin`): `src/lib/realisations.ts` reads them via the Payload Local API behind `unstable_cache` (tag `realisations`), invalidated by the collection hooks in `src/collections/hooks/revalidate.ts`. Pages that read Payload call `await connection()` so `next build` never needs the DB.
- Shared building blocks: `components/motion/Reveal.tsx` (scroll-in animation), `components/sections/PageHero.tsx`, `components/ui/` (shadcn primitives).

### Admin (Payload CMS 3)

- Two root layouts via route groups: `src/app/(site)/` (the public site) and `src/app/(payload)/` (Payload admin + REST API — those files are Payload's generated boilerplate, don't edit them by hand).
- Config: `src/payload.config.ts`. Collections in `src/collections/`. SQLite via `@payloadcms/db-sqlite` (`DATABASE_URI`), uploads in `MEDIA_DIR`. Both live on the Coolify volume `/data` in production.
- `src/instrumentation.ts` → `instrumentation-node.ts` initialises Payload at server start: migrations (`prodMigrations`, production only), `ensureAdmin` (first admin from `INITIAL_ADMIN_EMAIL`/`INITIAL_ADMIN_PASSWORD`), and the idempotent seed in `src/seed/`. Any init failure exits the process with code 1 in production.
- After changing a collection: `npm run payload -- generate:types`, then `npm run payload -- migrate:create <name>` and commit `src/migrations/`. After adding an admin custom component: `npm run payload -- generate:importmap`.
- Files loaded by the Payload CLI (`payload.config.ts`, `collections/`, `seed/`, and the `lib/` helpers they import) use **relative imports**, not `@/`.
- Local dev needs a `.env` (see `.env.example`) and a `data/` folder (both gitignored). Reset local content: stop the server, `rm -rf data && mkdir -p data/media`, restart (admin + seed are recreated).

### Design tokens

Brand palette in `globals.css :root` — `--brand-navy #0d2438`, `--brand-olive #96b912`
(the accent), `--brand-offwhite #f5f5f0` — exposed as Tailwind utilities (`bg-brand-navy`,
`text-brand-olive`, …) and gradient helpers (`.text-gradient-accent`, `.bg-gradient-footer`).
Fonts: **Inter** (`--font-body`) + **Archivo** (`--font-heading`, weights 700/800/900);
`h1–h4` are forced uppercase / weight-900 in `@layer base`. A `.dark` block exists but the
site ships **light-only** (no theme toggle is wired).

## Deployment

- `next.config.ts` sets `output: "standalone"` (minimal `.next/standalone` server) and `images.unoptimized: true` (the site's own images are pre-sized `.webp` served as-is; don't reach for `next/image` optimization), wrapped in `withPayload`. `sharp` is installed **only for Payload** (admin-uploaded image variants); `outputFileTracingIncludes` ships `node_modules/@img/**` because Next's tracer misses the native libvips libraries — removing it makes the standalone server crash at startup.
- Multi-stage `Dockerfile` (`node:22-slim`) → standalone runner on **Coolify** (VPS, domain stratetic.art). It uses `npm install` **not `npm ci`** on purpose, to tolerate npm 10/11 lockfile drift — keep it that way.
- Coolify needs a persistent volume on `/data` and the env vars `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` (`DATABASE_URI`/`MEDIA_DIR`/`BACKUP_DIR` default to `/data/...` in the Dockerfile). Nightly backup = Coolify scheduled task `node scripts/backup-db.mjs`.
