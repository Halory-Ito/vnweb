# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

vnweb is a web management panel for visual novels and local single-player games — a local game library, launcher, media organizer, and play tracker. Designed for Windows desktop use, it integrates with Steam, VNDB, Bangumi, and YMGAL.

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run start        # Production server (port 8999)
npm run lint         # oxlint (NOT eslint)
npm run lint:fix     # oxlint --fix
npm run fmt          # oxfmt (NOT prettier)
npm run fmt:check    # oxfmt --check
npm run test         # vitest (watch mode)
npm run test:run     # vitest single run
npm run test:node    # API/lib tests only (node project)
npm run test:browser # Page tests only (browser project via WebDriverIO Edge)
npm run db:push      # Push schema changes to SQLite
npm run db:studio    # Drizzle Studio (port 5123)
npm run cli          # TUI game launcher (tsx cmd/tui.ts)
```

Pre-commit hook runs `npm test` via Husky.

## Architecture

**Stack**: Next.js 16 (App Router) + React 19 + TypeScript + SQLite (Drizzle ORM) + Tailwind CSS v4 + shadcn/ui (new-york style)

**State**: Jotai for client atoms (`atom/global.ts`), TanStack Query for server state.

**API layer**: All requests go through `lib/request-utils.ts` (axios instance with `/api` baseURL). Components never call `fetch` directly. API routes live in `app/api/`.

**Database**: Single schema file at `db/schema.ts` with ~17 tables. Migrations in `drizzle/`. SQLite via `local.db`.

**Plugin system** (`lib/plugins/`): Three plugin types — `ProviderPlugin` (data sources: Steam, VNDB, Bangumi, YMGAL, SteamGridDB), `FeaturePlugin` (hooks for PV resolution, metadata enrichment; built-in: Bilibili, YouTube), `CharacterProviderPlugin` (character data from VNDB, Bangumi, YMGAL). Plugins register client-side via `PluginProvider` → `bootstrapPlugins()`.

**Providers** (`lib/providers/`): Data source integrations that wrap external APIs (Steam, VNDB, Bangumi, SteamGridDB, YMGAL). Registered through the plugin system.

**Settings** (`lib/settings/`): Client settings use localStorage with custom events for cross-tab sync. Server config in `app/config.ts` (gitignored, see `app/config.example.ts`).

**Layout**: Full-screen with resizable sidebar + header + content. Background images render behind a glass overlay with 4 transition styles. Page-specific components use `_ui/` co-located subdirectories.

**Windows features** (`win/`): Icon extraction from .exe, local font reading, game process monitoring.

**CLI** (`cmd/tui.ts`): Commander-based TUI for game list/search/launch with play timer. Entry via `vnweb.bat`.

## Key Conventions

- Max 200 lines per component; split at 150. Extract business logic to custom hooks.
- Prefer shadcn/ui components (outlined style). Use Tailwind CSS v4 for custom styling.
- No nested card components.
- Add dependencies only if existing ones can't do the job; prefer native APIs.
- Track work in `plan.md` (check off completed features). Check `errors.md` for known bugs.
- Path aliases: `@/*` → root, `@/fonts` → `lib/font-utils`, `@/components/*` → `components/*`.

## Formatting

oxfmt config: 80 char width, no semicolons, single quotes, trailing commas, sorted imports (builtin+external, then internal with newline, then type imports), sorted Tailwind classes. oxlint ignores `components/` (shadcn files).