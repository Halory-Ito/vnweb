# API and Data Layer

This page covers vnweb's request-wrapping conventions, server route conventions, database schema, and migration scripts. Everything here follows the source code (`AGENTS.md`, `api/`, `app/api/`, `db/schema.ts`, `package.json`).

## Two-Layer API Wrapping

Client requests are wrapped in two layers so server details don't get scattered across components:

| Layer                      | Location                  | Requests it handles                                                                    | Export                                          |
| -------------------------- | ------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Root-level domain requests | `api/`                    | Shared across modules, such as `game`, `character`, `quote`, `ost`, `pv`, `collection` | re-exported from `api/index.ts` with `export *` |
| Module-local requests      | `features/xxx/xxx-api.ts` | Used only within one module, such as `features/guide/guide-api.ts`                     | the module's `index.ts(x)`                      |

Domain types follow the same two-layer split: cross-module types go in `types/` (for example `types/game.ts` and `types/backup.ts`) and are exported from `types/index.ts`; types used only inside a module can stay in that module.

`api/index.ts` currently exports the following domains: `agent`, `character`, `collection`, `game`, `goals`, `media`, `memory`, `ost`, `pv`, `quote`, `recent-visit`, `record`, `system`, `status-settings`, `game-status-sync`.

### Request Instance

`lib/request-utils.ts` creates a single shared axios instance:

```ts
import axios from 'axios'

export const api = axios.create({
  baseURL: `/api`,
  timeout: undefined,
  proxy: false,
})
```

All requests go through it, with paths written relative to `/api` such as `/game/...` and `/quote/...`. AGENTS.md prescribes a consistent axios form:

```ts
export function actionObjectApi() {
  return api.request({
    method: 'method',
    url: 'url',
  })
}
```

In real code you'll also see shorthand calls like `api.get`, `api.post`, and `api.patch`, but they all use the same instance.

::: danger Don't fetch directly in components
Components access data only through the API layer + react-query. The one exception is the SSE streaming chat in `api/agent.ts`: browser-side axios can't read the response body chunk by chunk, so `fetch` + `ReadableStream` is wrapped inside the API layer, and components still never call `fetch` directly.
:::

## Using react-query

Server state is managed by `@tanstack/react-query`. A typical pattern:

```ts
const { data, isLoading, error } = useQuery({
  queryKey: ['game', gameId],
  queryFn: () => getGameById(gameId),
})
```

- `queryKey` should include the domain and parameters so you can invalidate precisely.
- After a mutation, refresh related lists with `queryClient.invalidateQueries({ queryKey: ['game'] })`.
- Pair it with skeletons, silent refreshes, and empty states; see the state-feedback guidelines in `DESIGN.md`.
- Keep client-side UI state (dialog open/closed, selected items) in Jotai, not in the query cache.

## Server Route Conventions

Under `app/api/`, each module provides its server implementation in a `route.ts` that responds through exported HTTP verb functions:

| File                            | Example responsibility                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `app/api/game/route.ts`         | Creates a game (exports `POST`), normalizes fields, and writes `game_info` plus the ID mapping, PVs, and related websites |
| `app/api/character/route.ts`    | Character data                                                                                                            |
| `app/api/guide/route.ts`        | Walkthrough search, import, and bulk delete                                                                               |
| `app/api/ost/route.ts`          | OST search and import                                                                                                     |
| `app/api/pv/route.ts`           | PV metadata                                                                                                               |
| `app/api/quote/route.ts`        | Quote excerpts                                                                                                            |
| `app/api/collection/route.ts`   | Collections                                                                                                               |
| `app/api/recent-visit/route.ts` | Recent visits                                                                                                             |
| `app/api/proxy-image/route.ts`  | Remote image proxy                                                                                                        |
| `app/api/agent/_shared.ts`      | Shared logic for agent routes (not a route file)                                                                          |

Dynamic subroutes follow the directory hierarchy, for example `/api/game/:id` and `/api/guide/:gameId/progress`.

Response convention:

```ts
// Success
return NextResponse.json({ data: { id: gameId } })

// Failure
return NextResponse.json({ error: 'Invalid game info payload' }, { status: 400 })
```

::: tip Field normalization
A route is the boundary between external input and the database. `parseGameInfoPayload` in `app/api/game/route.ts` joins array fields into comma-separated strings and converts booleans to 0/1 before handing them to Drizzle. Don't put this kind of conversion in a component.
:::

## Zod Validation

The project uses Zod `^4.3.6` for structural validation. Typical cases:

1. **Walkthrough import**: `features/guide/import-guide-schema.ts` defines `guideJsonSchema`, requiring `name['zh-cn']`, `routes`, `endings`, and `steps`. Step types are `choice | save | load | note`, ending types are `normal | bad | good | true`, and `level` is an integer from 0 to 5. `validateGuideJson()` parses the input into a consistent shape.
2. **WebMCP tool parameters**: every tool has its own schema file, such as `webmcp/game/lib/add-game-tool-schema.ts`.
3. **Settings loading**: when settings files are read, field types and port ranges are validated so a bad config can't prevent startup.

```ts
const guideStepSchema = z.object({
  type: z.enum(['choice', 'save', 'load', 'note']).optional(),
  content: z.string().min(1, 'Step content cannot be empty'),
  group: z.string().optional(),
  prefix: z.string().optional(),
  subfix: z.string().optional(),
})
```

## Database and Drizzle

The connection is created in `lib/drizzle.ts` using the libSQL driver:

```ts
import { drizzle } from 'drizzle-orm/libsql'
import { databaseUrl, getDbPath } from './server/database-config.mjs'

if (databaseUrl.startsWith('file:') && !databaseUrl.includes(':memory:')) {
  fs.mkdirSync(path.dirname(getDbPath()), { recursive: true })
}

export const db = drizzle({ connection: { url: databaseUrl } })
```

The default database URL is `file:./local.db`. Change it via `dbFileName` in `data/settings/general.json`; the change takes effect after a restart.

### Table Quick Reference

`db/schema.ts` groups its tables by domain as follows:

| Domain              | Table                                 | Notes                                                                                                       |
| ------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Game core           | `game_info`                           | Name, synopsis, tags, developer, cover / background / icon / logo, save directory, timestamps               |
| Game extensions     | `game_id_map`                         | Mapping between local games and external platform IDs, with a unique index `(gameId, provider, externalId)` |
|                     | `relate_website`                      | Links to websites related to a game                                                                         |
|                     | `cg`                                  | CG images, category, dimensions, source, sort order                                                         |
| Media               | `game_pv` / `game_pv_metadata`        | PV URLs and JSON metadata (foreign key with cascade delete)                                                 |
|                     | `game_ost` / `game_ost_songs`         | OST albums and tracks, lyric text / paths, source                                                           |
| Characters and text | `character`                           | Character profiles and sprites, unique on `(gameId, vndbId)`                                                |
|                     | `game_quote`                          | Quote excerpts with `characterId` and `context`                                                             |
|                     | `game_memory`                         | Memory entries (body stored in MDX files)                                                                   |
| Walkthroughs        | `game_guide`                          | Walkthrough body, difficulty, hints, completion flags                                                       |
|                     | `guide_route`                         | Routes, with `sortOrder` for drag-and-drop ordering                                                         |
|                     | `guide_ending`                        | Endings of type `normal/bad/true`, with unlock conditions and CGs                                           |
|                     | `guide_step`                          | Steps: type, group, prefix / suffix, completion flag                                                        |
| Play                | `game_play`                           | Executable path, running flag, accumulated seconds, session count, rating, status, PID                      |
|                     | `game_record`                         | Duration and date of a single play session                                                                  |
|                     | `game_status` / `game_status_mapping` | Custom statuses and platform status mappings                                                                |
|                     | `game_status_push`                    | Push record for each game on each platform, primary key `(gameId, provider)`                                |
| Library             | `collection` / `collection_game`      | Collections and their games                                                                                 |
|                     | `scanner` / `scan_error`              | Scan directory settings, progress, exclude rules, and failure records                                       |
|                     | `library_folder_logo`                 | Folder-to-brand-icon mapping                                                                                |
| Accounts and access | `third_party_account`                 | Third-party account tokens, usernames, avatars, expiry                                                      |
|                     | `recent_visit`                        | Recent visits; only one record per game + entry type                                                        |

Timestamp fields generally use `.$defaultFn(() => dayjs().toString())` for their default value; list-like fields (tags, aliases, platforms) are stored as comma-separated text and split again on read.

### Migration Scripts

See the scripts in `package.json`:

| Command               | Actually runs                                     | Purpose                                           |
| --------------------- | ------------------------------------------------- | ------------------------------------------------- |
| `npm run db:generate` | `drizzle-kit generate`                            | Generate migration SQL from the schema            |
| `npm run db:push`     | `drizzle-kit push`                                | Sync the schema directly to the database          |
| `npm run db:init`     | `drizzle-kit push`                                | Initialize the database (equivalent to `db:push`) |
| `npm run db:migrate`  | `tsx cmd/migrate-db.ts`                           | Run the migration script                          |
| `npm run db:studio`   | `drizzle-kit studio --port 5123 --host 127.0.0.1` | Open the visual database manager                  |

The migration baseline is in `drizzle/0000_initial.sql`, with metadata in `drizzle/meta/`. Both server startup (`instrumentation.ts`) and CLI startup automatically fill in missing config and run migrations, supporting both takeover of an existing `local.db` and creation of a new one.

::: warning Existing database
`init.bat` first backs up an existing database and its `-wal` / `-shm` / `-journal` sidecar files to `backups/db/`, then creates an empty one. Before running anything that rebuilds the database, close vnweb and Drizzle Studio and make a separate backup of your own.
:::

## Configuration and Data Boundaries

- Platform credentials: `data/settings/platform.json`, template at `data/example/platform.json`.
- Appearance settings: `data/settings/appearance.json`, template at `data/example/appearance.json`.
- General settings: `data/settings/general.json`, containing `dbFileName`, `agent`, `goals`.
- Backup settings: `data/settings/backup.json`.
- Custom theme: `custom.css`; when the application and data directories are separated, it lives under `settings/` in the data directory.

All of these files take part in [Backup and Sync](/guide/feats/save-backup). Local paths are centralized in `lib/server/runtime-paths.mjs` to avoid scattered `process.cwd()` calls.

## Further Reading

- [Architecture Overview](/guide/advanced/architecture) · [Platform Integrations and WebMCP](/guide/advanced/platform-integrations)
- [Contributing Guide](/guide/advanced/contributing) · [Glossary](/guide/advanced/glossary)
- [Walkthroughs and Route Progress](/guide/feats/walkthroughs) · [FAQ](/guide/advanced/faq)
