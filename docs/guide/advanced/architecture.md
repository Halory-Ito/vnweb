# Architecture Overview

This page explains vnweb's technology stack, layering, request flow, rendering and state management, and how the Web / CLI / desktop entry points share a single copy of your data—all from the source code's point of view. For the exact API patterns, see [API and Data Layer](/guide/advanced/api-and-data); for platform integration details, see [Platform Integrations and WebMCP](/guide/advanced/platform-integrations).

## Technology Stack at a Glance

Versions follow `package.json` (currently `0.2.2`).

| Category          | Technology                            | Version / Notes                                                                                |
| ----------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Framework         | Next.js                               | `^16.4.5`, App Router + Turbopack, `output: 'standalone'`                                      |
| UI                | React / React DOM                     | `19.2.3`                                                                                       |
| Language          | TypeScript                            | `^5.9.3`, `strict: true`, path alias `@/*`                                                     |
| Styling           | Tailwind CSS                          | `^4.3.3` + `@tailwindcss/postcss`, `tw-animate-css`                                            |
| Component library | shadcn/ui                             | `radix-ui`, `@base-ui/react`, `class-variance-authority`, 50+ components under `components/ui` |
| Icons and charts  | Lucide, Recharts                      | `lucide-react`, `recharts`                                                                     |
| Animation         | Motion                                | `motion`                                                                                       |
| Database          | SQLite (libSQL) + Drizzle ORM         | `@libsql/client`, `drizzle-orm ^0.45.1`, migrations managed by `drizzle-kit`                   |
| Server state      | TanStack Query                        | `@tanstack/react-query ^5.90.21`                                                               |
| Client state      | Jotai                                 | `jotai ^2.18.0`                                                                                |
| HTTP              | axios                                 | `^1.13.5`, wrapped as a single `api` instance                                                  |
| Validation        | Zod                                   | `^4.3.6`, used for walkthrough imports, tool parameters, and more                              |
| Media             | hls.js, `@meting/core`, ExcelJS       | video playback, OST lookup, XLSX export                                                        |
| Text rendering    | MDX / react-markdown                  | `next-mdx-remote`, `remark-gfm`, `rehype-highlight`                                            |
| Sync              | webdav, `@aws-sdk/client-s3`          | remote backups                                                                                 |
| Agent             | `usewebmcp`, `@mcp-b/webmcp-polyfill` | WebMCP registration and fallback                                                               |
| CLI               | `commander`                           | `^14.0.3`, entry point `cmd/tui.ts`                                                            |
| Desktop           | Tauri v2 + Rust                       | `crates/vnweb-cli`, `crates/vnweb-desktop`, Cargo workspace                                    |
| Tooling           | oxlint / oxfmt / VitePress / tsx      | Vitest tests are skipped                                                                       |

## Layered Architecture

```text
Browser / Tauri WebView
        │
        ▼
app/            Routes and pages (App Router: layout / page / loading)
        │
        ▼
features/       Module views, components, and hooks
        │
        ▼
api/ (or features/xxx/xxx-api.ts)   Client-side request wrappers
        │
        ▼
lib/request-utils.ts  axios instance (baseURL: /api)
        │  HTTP
        ▼
app/api/**/route.ts  Server routes (NextRequest → NextResponse)
        │
        ▼
lib/server/*         Server services, settings I/O, backups, platform calls
        │
        ▼
db/schema.ts         Drizzle schema
        │
        ▼
SQLite / libSQL (local.db or the path set in general.json)
```

Cross-cutting concerns:

- `types/`: domain types shared across modules, split by domain and re-exported from `types/index.ts`.
- `components/ui/`: shadcn/ui-style base components that any module can reuse.
- `lib/providers/`: the registry and implementations of external platform providers.
- `lib/settings/`: settings file I/O and default values.
- `webmcp/`: tool definitions, schemas, and generative UI components.
- `crates/`, `cmd/`, `scripts/`: native entry points and build scripts.

## Directory Responsibilities

| Directory       | Responsibility                                                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app`           | Next.js App Router pages and the `app/api` server routes; `custom.css`, `default.css`, `globals.css`                                                                       |
| `api`           | Root-level cross-module request layer, split by domain: `game`, `character`, `collection`, `quote`, `ost`, `pv`, `agent`, `record`, and more; entry point `index.ts`       |
| `types`         | Root-level cross-module type layer: `game`, `character`, `backup`, `agent`, `record-types`, and more; entry point `index.ts`                                               |
| `features`      | 16 feature modules: `agent`, `appearance`, `backup`, `cg`, `character`, `dashboard`, `game`, `guide`, `home`, `ost`, `pv`, `quote`, `recent`, `record`, `scan`, `settings` |
| `lib`           | Shared utilities: `providers`, `server`, `settings`, `sync-client`, `drizzle.ts`, `request-utils.ts`, and more                                                             |
| `components/ui` | shadcn/ui base components such as `button`, `dialog`, `table`, `tabs`, `chart`                                                                                             |
| `db`            | `schema.ts`, the Drizzle table definitions                                                                                                                                 |
| `drizzle`       | Migration SQL and metadata (`0000_initial.sql`, `meta/`)                                                                                                                   |
| `cmd`           | CLI: `tui.ts`, `migrate-db.ts`, `init-settings.ts`                                                                                                                         |
| `webmcp`        | Tools organized by module: `game`, `guide`, `ost`, `quote`, plus shared `lib`                                                                                              |
| `crates`        | Rust: the native CLI entry point and the Tauri desktop shell                                                                                                               |
| `scripts`       | `build-cli.mjs`, `build-standalone.mjs`, `run-tauri.mjs`, `prepare-tauri-resources.mjs`                                                                                    |
| `docs`          | VitePress Chinese docs; the English site mirrors them under `/en/`                                                                                                         |

By convention, every `features/xxx` module contains `hooks`, `components`, `data`, `views`, `lib`, and a module entry file. Requests used only inside the module live in `features/xxx/xxx-api.ts`; types used only inside the module can stay in the module.

## Request Flow

Take "reading game details" as an example:

```ts
// api/game.ts: client-side wrapper
export const getGameById = async (id: string) => {
  const response = await api.get(`/game/${id}`)
  return (response.data as { data: GameDetail }).data
}
```

1. A component calls `getGameById` through a hook, usually wrapped in `useQuery`.
2. The `api` instance comes from `lib/request-utils.ts`: `baseURL: '/api'`, `proxy: false`.
3. Next.js routes `/api/game/:id` to the corresponding `app/api/game/.../route.ts`.
4. The server queries the tables defined in `db/schema.ts` with Drizzle and returns the result wrapped as `{ data: ... }`.
5. Exceptions are caught by the route and returned as `{ error }` with a non-2xx status; the frontend handles them at the point of use with error boundaries.

Example server route (from the create-game logic in `app/api/game/route.ts`):

```ts
export { createGame as POST }

async function createGame(req: NextRequest) {
  const body = await req.json()
  // Validate and normalize fields → db.insert(GameInfoTable) → write ID mapping / PV / related sites
  return NextResponse.json({ data: { id: gameId } })
}
```

::: warning Don't fetch directly in a component
The project convention explicitly forbids components from calling `fetch`. The one exception is the SSE streaming chat in `api/agent.ts`: browser-side axios can't read the response body chunk by chunk, so the API layer wraps `fetch` + `ReadableStream` internally.
:::

## Rendering and State Management

- **Routing and layouts**: `app/layout.tsx` provides the global shell; `app/game/layout.tsx`, `app/settings/layout.tsx`, and others provide module-level layouts. `app/page.tsx` is the home dashboard.
- **Page splitting**: larger pages put views in `features/xxx/views` and interaction logic in `features/xxx/hooks`, leaving components responsible only for rendering.
- **Server state**: TanStack Query manages request caching and invalidation, paired with skeletons, silent refreshes, and empty states.
- **Client state**: Jotai manages cross-component UI state; `next-themes` manages light and dark mode.
- **Error boundaries**: key areas need error boundaries so a local failure doesn't bring down the whole page.
- **Rendering performance**: avoid a small change triggering a full-page re-render; backgrounds and appearance sync are render-isolated, and navigation and detail-tab switches reuse layouts.
- **Styling constraints**: keep a single component under 200 lines and consider splitting it past 150; prefer the shadcn/ui outlined style; use responsive layouts and the global `--app-font-family` font. See [Appearance and Themes](/guide/feats/custom-theme).

## Startup, Migration, and Runtime Paths

`instrumentation.ts` runs initialization logic when the server starts: it fills in missing settings files and runs database migrations, supporting both the takeover of an existing `local.db` and the creation of a new one. The CLI goes through the same bootstrap on startup.

Paths are centralized in `lib/server/runtime-paths.mjs`:

| Variable         | Meaning                                          | Default         |
| ---------------- | ------------------------------------------------ | --------------- |
| `VNWEB_APP_DIR`  | Application directory (code, standalone output)  | `process.cwd()` |
| `VNWEB_DATA_DIR` | User data directory (settings, assets, database) | `process.cwd()` |

Paths such as `data/settings`, `data/example`, `assets`, `public`, `temp-backup`, and `custom.css` are derived from these. When the application and data directories are separated, `custom.css` lives under `settings/` in the data directory.

## Tauri / CLI Entry Points

```text
Installation directory
├── vnweb.exe              Native entry point (Rust)
├── vnweb-desktop.exe      Tauri desktop shell
├── runtime/node.exe       Embedded Node runtime
└── standalone/
    ├── server.js          Next.js standalone server
    ├── cli/vnweb-cli.mjs  Standalone CLI bundle
    ├── .next/             Pages and static assets
    ├── data/              Settings examples and runtime data
    └── drizzle/           Migration files
```

- With no arguments, `vnweb.exe` starts the desktop app first; the desktop app allocates a port, probes the server, then shows the window.
- With arguments, they are forwarded to `vnweb-cli.mjs`; see [Command-Line Tool](/guide/feats/other) for the available commands.
- The Tauri side also implements a single-instance lock, a system tray, Windows Job Object child-process management, and handing external links to the system browser.
- NSIS install and uninstall hooks maintain the user's `PATH`.

## Build Artifacts

| Script                     | Output                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `npm run build`            | `.next/`, with `output: 'standalone'`                                                                              |
| `npm run build:cli`        | `dist/cli/vnweb-cli.mjs`                                                                                           |
| `npm run build:standalone` | `.next/standalone`, trimmed of private data and supplemented with the CLI, static assets, examples, and migrations |
| `npm run tauri:build`      | Windows x64 NSIS installer                                                                                         |

`next.config.ts`'s `outputFileTracingExcludes` excludes `.git`, `docs`, `crates`, `target`, `local.db*`, and other directories to keep the output small; remote images from any domain are allowed so platform covers can load. `/game` redirects to `/game/home`.

## Further Reading

- [What Is vnweb](/guide/intro/what-is-vnweb) · [Installation and Configuration](/guide/intro/installation-and-configuration)
- [API and Data Layer](/guide/advanced/api-and-data) · [Platform Integrations and WebMCP](/guide/advanced/platform-integrations)
- [Contributing Guide](/guide/advanced/contributing) · [Glossary](/guide/advanced/glossary)
