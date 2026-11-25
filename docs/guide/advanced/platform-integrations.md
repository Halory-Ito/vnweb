# Platform Integrations and WebMCP

vnweb uses a set of pluggable providers to fill in metadata, characters, images, PVs, and OSTs from external platforms, and pushes play status back to some of them. This page explains how providers are registered, how ID mapping and metadata merging work, what caching looks like, and how these capabilities are exposed to WebMCP tools. Before using them, finish configuration under **Settings → Platforms**; for the hands-on steps, see [Platform Integrations and Metadata Updates](/guide/feats/platforms).

## Provider Overview

The registry lives in `lib/providers/registry.ts` and currently contains five game providers:

| Provider ID   | Name        | Capabilities                                   | Main use                                                                     |
| ------------- | ----------- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `bangumi`     | Bangumi     | `manual-search`, `bulk-import`, `account-bind` | Entry search, account collection import, status push, personal token binding |
| `steam`       | Steam       | `manual-search`, `bulk-import`                 | Game search, importing existing games, trailer sync, OpenID binding          |
| `steamgriddb` | SteamGridDB | `manual-search`                                | Cover, background, icon, and logo images                                     |
| `vndb`        | VNDB        | `manual-search`, `bulk-import`, `account-bind` | Work and character metadata, status push                                     |
| `ymgal`       | YMGal       | `manual-search`, `bulk-import`, `account-bind` | Chinese Galgame metadata and characters                                      |

Character providers are registered separately; there are currently three—`vndb`, `bangumi`, and `ymgal`—see [Characters, Quotes, and Memories](/guide/feats/game-notes).

### Interface Conventions

Game providers implement `GameProvider`:

```ts
export interface GameProvider {
  id: string
  name: string
  description: string
  version: string
  icon: string
  type: 'provider'
  defaultEnabled: boolean
  capabilities: ProviderCapability[]
  accountProviderId?: string

  searchByName?(keyword: string, offset: number, limit: number): Promise<GameSearchResult>
  getById?(id: string): Promise<GameInfo | null>
  searchCollection?(): Promise<BulkImportResult>
  searchByUid?(uid: string): Promise<{ total: number; items: SteamOwnedGameItem[] }>
  importOneByUid?(payload: {
    /* appid, name, images, etc. */
  }): Promise<{ status: 'imported' | 'skipped' }>
}
```

Capabilities come in three kinds: `manual-search` (manual search and import), `bulk-import` (bulk import from an account library), and `account-bind` (account binding and status push). Based on these, the registry offers query functions such as `getManualSearchProviderOptions()`, `getBulkImportProviders()`, and `getAccountBindProviders()`.

Character providers implement `CharacterProvider`, whose key methods are:

```ts
interface CharacterProvider {
  sourceId: string
  normalizeExternalId(rawId: string): string
  resolveExternalId(gameId: number): Promise<string | null>
  fetchCharacters(ctx: {
    gameId: number
    externalId: string
    saveImagesToLocal: boolean
    now: string
  }): Promise<NormalizedCharacterRow[]>
}
```

External IDs are normalized (for example `subject/456` → `456`), then resolved into a unified row structure written to the `character` table.

## Platform Configuration

Configuration is stored in `data/settings/platform.json`, with a template at `data/example/platform.json`. The main fields:

| Platform     | Fields                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Steam        | `apiKey`                                                                                                                              |
| Bangumi      | `useMirror`, `mirrorUrl`, `baseUrl`, `tokenUrl`                                                                                       |
| VNDB         | `baseUrl`, `oauthToken`, `oauthClientId`, `oauthClientSecret`, `oauthAuthorizeUrl`, `oauthTokenUrl`, `oauthUserInfoUrl`, `oauthScope` |
| YMGal        | `baseUrl`, `clientId`, `clientSecret`, `oauthClientId`, `oauthClientSecret`                                                           |
| SteamGridDB  | `apiKey`, `baseUrl`                                                                                                                   |
| Meting       | `bitrate`, `coverSize`, `neteaseCookie`                                                                                               |
| Enhanced API | `useLocalSdk`, `apiBase`, `musicU`, `quality`, `sdkPort`                                                                              |

::: warning Configuration write behavior
Platform settings are saved serially and the file is replaced atomically to avoid concurrent overwrites. Field types and port ranges are validated before saving. If reading fails, an error and a retry entry are shown, and the unreadable config file is kept—don't delete it.
:::

Recent changes include: Bangumi switched to personal-token binding and dropped its OAuth config and authorization endpoints; the Bangumi token URL supports mirror configuration; VNDB no longer depends on environment variables for OAuth and has merged duplicate token config entries; platform calls are now routed uniformly through `platform.json`; platform visibility toggles are grouped by purpose and persisted. Each platform's credentials page also provides a link to the official token source and a panel explaining what the credential is for.

## ID Mapping

A local game and an external platform entry are connected through the `game_id_map` table:

```sql
game_id_map
  id          INTEGER PRIMARY KEY AUTOINCREMENT
  gameId      INTEGER NOT NULL
  provider    TEXT    NOT NULL   -- vndb / steam / bgm / ...
  externalId  TEXT    NOT NULL   -- Platform-side ID

UNIQUE INDEX game_id_map_game_provider_external_unique
  ON (gameId, provider, externalId)
```

Flow:

1. When you import a game via platform search, one or more mapping records are written.
2. `externalSourceIds` in game details also preserves the external ID strings.
3. When syncing characters or PVs, or pushing status, the external ID is first resolved by `(gameId, provider)`, and then the matching provider is called.
4. `resolveGameIdApi` in `api/game.ts` can look a game up in the local library by Chinese name, original name, alias, or VNDB ID.

This mapping layer lets you go from a game to its platform entry and back again.

## Metadata Merging

Bulk metadata updates go through `POST /api/game/metadata-batch`, with a request roughly like this:

```ts
{
  gameIds: [1, 2, 3],
  provider: 'bangumi' | 'steamgriddb',
  fields: ['cover', 'bg', 'developer', 'tags'],
  strategy: 'replace' | 'merge' | 'append',
}
```

| Strategy  | Behavior                                                             |
| --------- | -------------------------------------------------------------------- |
| `replace` | Replace the local field entirely with the platform value             |
| `merge`   | Merge platform and local values (good for synopses, tags, and so on) |
| `append`  | Append to the existing list (good for tags and aliases)              |

Updatable fields include `date`, `cover`, `icon`, `logo`, `bg`, `summary`, `name`, `nameCn`, `tags`, `nsfw`, `ailases`, `platforms`, `gameType`, `gameEngine`, `music`, `script`, `graphic`, `originalPainter`, `animationProduction`, `developer`, `publisher`, `programmer`. The response returns `updatedCount`, `skippedCount`, and `failedCount` so you can check the result.

On the image side, SteamGridDB provides covers, backgrounds, icons, and logos; VNDB covers can be loaded directly in the browser. Remote images from any domain are supported—`images.remotePatterns` in `next.config.ts` allows any http/https host—and remote downloads use a Fetch adapter.

### Status Push

Play status can be synced to Bangumi and VNDB:

- Configure a **many-to-one status mapping** in platform settings to map local statuses onto platform status values.
- Switching play status saves immediately; you can sync manually per platform and watch the progress.
- Each game's push record is written to `game_status_push`, with a primary key of `(gameId, provider)`, recording the target status and push time.
- Appearance settings let you customize the indicator-dot colors for the four push statuses.

See [Launch and Play Records](/guide/feats/play-records) for details.

## Caching and Rate Limiting

- Platform settings prefer the browser cache and read from the server only on a cache miss, to avoid duplicate requests.
- Remote images load on demand rather than pulling every asset at once.
- Bulk imports and bulk metadata updates process targets one by one and depend on upstream availability; on failure, check the returned `failedCount` and the server logs.
- Each upstream service has its own rate limit, so avoid repeatedly triggering a full-library sync in a short window; select games in batches if needed.
- A platform read error shows a retry entry—check your credentials and network first, then retry.

## WebMCP Tool Mapping

WebMCP tools expose the provider capabilities above to models. Tool definitions live in `webmcp/`, each with its own Zod schema, and `ensureWebMcpRuntime()` makes sure the runtime is available.

| Tool                   | Provider / data it depends on                                |
| ---------------------- | ------------------------------------------------------------ |
| `add_game_to_library`  | Platform search + SteamGridDB images                         |
| `sync_game_characters` | VNDB / Bangumi / YMGal character providers + ID mapping      |
| `sync_game_pv`         | Steam trailers; searches by name for candidates when unbound |
| `search_game_ost`      | khinsider / NetEase Cloud sources                            |
| `import_game_ost`      | OST album and track data                                     |
| `import_game_guide`    | Walkthrough JSON structural validation                       |
| `export_quotes_xlsx`   | Quote excerpt table                                          |

`sync_game_pv` renders candidate cards for you to pick from when no platform entry is bound; data is written only after you confirm in the tool. For full usage, see [AI Assistant and WebMCP](/guide/feats/ai-assistant).

## Troubleshooting

| Symptom                         | What to do                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| Can't find a platform entry     | Check the API key / token; confirm `baseUrl` is correct; try different keywords             |
| Bangumi import fails            | Confirm you're using a personal token; if using a mirror, check `mirrorUrl` and `tokenUrl`  |
| VNDB token lacks permissions    | Check the token's write scope (read-only operations don't need write access)                |
| Character sync comes back empty | Verify the external ID in `game_id_map`; confirm that platform has character data           |
| Images fail to load             | Check the network and the image host; try localizing the images; see the remote image proxy |
| Status push has no effect       | Check the many-to-one mapping and the `game_status_push` records; retry the sync manually   |
| Platform config read error      | Don't delete the damaged config file; fix or re-enter the values as prompted, then save     |

## Further Reading

- [Architecture Overview](/guide/advanced/architecture) · [API and Data Layer](/guide/advanced/api-and-data)
- [Contributing Guide](/guide/advanced/contributing) · [Glossary](/guide/advanced/glossary)
- [Platform Integrations and Metadata Updates](/guide/feats/platforms) · [Characters, Quotes, and Memories](/guide/feats/game-notes)
