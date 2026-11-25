# Glossary

This table collects the concepts that come up most often in vnweb's docs and source code. Click a link in the "See also" column to jump to the detailed explanation.

## How to Use This Table

- Grouped by topic into five sets: **Works and Gameplay**, **Metadata and Platforms**, **Engineering**, **Agents and Data**, and **Backup and Desktop**.
- The "English / Alias" column gives field names, interface names, or platform terms you'll commonly find in the source, making it easy to jump from the docs to a code search.
- A concept may appear on several pages; the table links to the single most relevant one. For the full picture, see [Architecture Overview](/guide/advanced/architecture).
- This table is updated as features evolve. If a term's meaning disagrees with the code, the source code wins, and you can propose a fix through the [Contributing Guide](/guide/advanced/contributing).

## Works and Gameplay

| Term      | English / Alias          | Meaning                                                                                                                     | See also                                                     |
| --------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| VN        | Visual Novel             | A genre centered on text narrative, supported by character art and music; the main type of game vnweb manages               | [What Is vnweb](/guide/intro/what-is-vnweb)                  |
| Galgame   | Bishōjo game             | A term of Japanese origin, often used interchangeably with visual novel; the repo's walkthrough prompts use it as well      | [Walkthroughs and Route Progress](/guide/feats/walkthroughs) |
| ADV / AVG | Adventure Game           | A common classification for visual novels, often found in platform metadata                                                 | [Scanning and Game Library](/guide/feats/game-library)       |
| Route     | Route                    | The second level of a walkthrough, usually corresponding to a character route or chapter; can be reordered by drag-and-drop | [Walkthroughs and Route Progress](/guide/feats/walkthroughs) |
| END       | Ending                   | A specific ending under a route, of type `normal` / `bad` / `good` / `true`                                                 | [Walkthroughs and Route Progress](/guide/feats/walkthroughs) |
| Step      | Step                     | An actionable item under an ending, of type `choice` (option), `save` (save), `load` (load), or `note` (note)               | [Walkthroughs and Route Progress](/guide/feats/walkthroughs) |
| CG        | Computer Graphics        | Event artwork / illustrations for a game; can be filed under the "Game CG" backup category                                  | [Backup, Restore, and Sync](/guide/feats/save-backup)        |
| PV        | Promotion Video, trailer | Promotional video; supports HLS, direct video links, Bilibili, YouTube, and other sources                                   | [PV and OST](/guide/feats/media)                             |
| OST       | Original Soundtrack      | A game's soundtrack albums and tracks; supports NetEase Cloud, Meting, Enhanced API, and other sources                      | [PV and OST](/guide/feats/media)                             |
| FD        | Fan Disc                 | A follow-up release after the main work; best kept as a walkthrough separate from the original                              | [Walkthroughs and Route Progress](/guide/feats/walkthroughs) |

## Metadata and Platforms

| Term                   | English / Alias             | Meaning                                                                                                       | See also                                                                  |
| ---------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Scraping / Scraper     | Scraping / Metadata Scraper | The process of fetching work metadata and images from external platforms into the local library               | [Platform Integrations and Metadata Updates](/guide/feats/platforms)      |
| Provider               | Data source / plug-in       | A platform adapter implementing a common interface, such as `bangumi`, `steam`, `vndb`                        | [Platform Integrations and WebMCP](/guide/advanced/platform-integrations) |
| Capability flag        | Capability                  | A provider's three possible capabilities: `manual-search`, `bulk-import`, `account-bind`                      | [Platform Integrations and WebMCP](/guide/advanced/platform-integrations) |
| Character Provider     | Character Provider          | A provider dedicated to character metadata and sprites; currently VNDB / Bangumi / YMGal                      | [Characters, Quotes, and Memories](/guide/feats/game-notes)               |
| ID Mapping             | ID Mapping                  | The correspondence between a local `gameId` and a platform `externalId`, stored in `game_id_map`              | [API and Data Layer](/guide/advanced/api-and-data)                        |
| Account Bind           | Account Bind                | Linking a platform account to your local library, to import collections or push status                        | [Platform Integrations and WebMCP](/guide/advanced/platform-integrations) |
| Status Push            | Status Push                 | Syncing local play status to Bangumi / VNDB, with records written to `game_status_push`                       | [Launch and Play Records](/guide/feats/play-records)                      |
| Many-to-one mapping    | Status Mapping              | A configuration that maps several local statuses onto one platform status value                               | [Platform Integrations and Metadata Updates](/guide/feats/platforms)      |
| Bangumi Personal Token | Personal Token              | The credential Bangumi uses today, which replaced OAuth configuration                                         | [Platform Integrations and WebMCP](/guide/advanced/platform-integrations) |
| VNDB ID                | `v\d+` / `c\d+`             | VNDB work IDs (such as `v184`) and character IDs (such as `c123`)                                             | [Characters, Quotes, and Memories](/guide/feats/game-notes)               |
| SteamGridDB            | Image library               | An image source for covers, backgrounds, icons, and logos                                                     | [Platform Integrations and WebMCP](/guide/advanced/platform-integrations) |
| Meting                 | `@meting/core`              | An SDK for reading tracks from music platforms such as NetEase Cloud; bitrate and cover size are configurable | [Platform Integrations and Metadata Updates](/guide/feats/platforms)      |
| Enhanced API           | Enhanced API                | An OST playback option with configurable `MUSIC_U` and a local SDK                                            | [Platform Integrations and Metadata Updates](/guide/feats/platforms)      |
| yjgalgame              | Walkthrough source          | A community walkthrough site you can search and import walkthroughs from                                      | [Walkthroughs and Route Progress](/guide/feats/walkthroughs)              |

## Engineering

| Term                | English / Alias      | Meaning                                                                                | See also                                              |
| ------------------- | -------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| App Router          | Next.js App Router   | Next.js's routing paradigm, organizing pages as `page.tsx` / `layout.tsx` under `app/` | [Architecture Overview](/guide/advanced/architecture) |
| Turbopack           | —                    | Next.js's build tool, enabled in `next.config.ts` in this project                      | [Architecture Overview](/guide/advanced/architecture) |
| Standalone          | Standalone output    | A server bundle produced by `output: 'standalone'` that runs without the source tree   | [Architecture Overview](/guide/advanced/architecture) |
| route.ts            | Server route         | `app/api/**/route.ts` exports HTTP verb functions as the server implementation         | [API and Data Layer](/guide/advanced/api-and-data)    |
| Drizzle             | Drizzle ORM          | A TypeScript ORM; schema in `db/schema.ts`, migrations in `drizzle/`                   | [API and Data Layer](/guide/advanced/api-and-data)    |
| libSQL              | `@libsql/client`     | A SQLite-compatible client driver used to connect to the local database file           | [API and Data Layer](/guide/advanced/api-and-data)    |
| Migration           | Migration            | Schema changes generated by `drizzle-kit generate` and applied by `db:migrate`         | [API and Data Layer](/guide/advanced/api-and-data)    |
| react-query         | TanStack Query       | A library for server state, caching, and invalidation                                  | [API and Data Layer](/guide/advanced/api-and-data)    |
| Jotai               | —                    | An atomic client-side state management library                                         | [Architecture Overview](/guide/advanced/architecture) |
| Zod                 | —                    | A runtime schema-validation library used for walkthrough imports and tool parameters   | [API and Data Layer](/guide/advanced/api-and-data)    |
| shadcn/ui           | —                    | A collection of Radix-based components, located in `components/ui/`                    | [Contributing Guide](/guide/advanced/contributing)    |
| Tailwind CSS v4     | —                    | A utility-class styling framework; custom components must use v4 syntax                | [Contributing Guide](/guide/advanced/contributing)    |
| Borderless          | Borderless           | The border toggle in appearance settings; component borders must respect its state     | [Appearance and Themes](/guide/feats/custom-theme)    |
| `--app-font-family` | Global font variable | The CSS variable that drives the app's font everywhere                                 | [Appearance and Themes](/guide/feats/custom-theme)    |
| oxlint / oxfmt      | —                    | The project's lint and formatting tools, replacing ESLint / Prettier respectively      | [Contributing Guide](/guide/advanced/contributing)    |

## Agents and Data

| Term              | English / Alias                      | Meaning                                                                                                      | See also                                                                  |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Agent             | Agent                                | A model system that senses context, calls tools, and completes tasks                                         | [AI Assistant and WebMCP](/guide/feats/ai-assistant)                      |
| WebMCP            | Web Model Context Protocol           | A mechanism for a web page to register capabilities as tools for an Agent to call                            | [AI Assistant and WebMCP](/guide/feats/ai-assistant)                      |
| Polyfill          | `@mcp-b/webmcp-polyfill`             | A fallback for when the browser doesn't natively support `document.modelContext`                             | [Platform Integrations and WebMCP](/guide/advanced/platform-integrations) |
| Tool Calling      | Tool Calling / Function Calling      | The model outputs a structured function name and arguments, which the app executes and returns the result of | [AI Assistant and WebMCP](/guide/feats/ai-assistant)                      |
| Generative UI     | Generative UI                        | An interactive card rendered from a tool's result; write operations run only after confirmation              | [AI Assistant and WebMCP](/guide/feats/ai-assistant)                      |
| SSE               | Server-Sent Events                   | The response protocol used by streaming chat; read at the API layer with `fetch` + `ReadableStream`          | [AI Assistant and WebMCP](/guide/feats/ai-assistant)                      |
| OpenAI-compatible | OpenAI-compatible                    | A model service implementing the same API shape, connectable by swapping `baseUrl`                           | [AI Assistant and WebMCP](/guide/feats/ai-assistant)                      |
| frontmatter       | YAML Frontmatter                     | The metadata block at the head of a Markdown file, used for a memory's title, tags, date, and so on          | [Characters, Quotes, and Memories](/guide/feats/game-notes)               |
| MDX               | —                                    | A format that lets you use components in Markdown; memory bodies render with MDX                             | [Characters, Quotes, and Memories](/guide/feats/game-notes)               |
| XLSX              | Excel workbook                       | The spreadsheet format exported for quote excerpts, timing records, and so on, generated with ExcelJS        | [Characters, Quotes, and Memories](/guide/feats/game-notes)               |
| Local-first       | Local-first                          | Keeping metadata and progress on the device by default; sending data out is an explicit user decision        | [What Is vnweb](/guide/intro/what-is-vnweb)                               |
| GraphRAG          | Graph Retrieval-Augmented Generation | A proposed knowledge-graph-based retrieval approach aimed at controlling spoilers by progress                | [Changelog and Roadmap](/guide/advanced/changelog)                        |

## Backup and Desktop

| Term               | English / Alias              | Meaning                                                                                            | See also                                              |
| ------------------ | ---------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| WebDAV             | —                            | An HTTP-based remote file protocol used for backup sync                                            | [Backup, Restore, and Sync](/guide/feats/save-backup) |
| S3                 | S3-compatible Object Storage | Object storage compatible with the S3 API; endpoint, bucket, and so on are configurable            | [Backup, Restore, and Sync](/guide/feats/save-backup) |
| `backup-meta.json` | —                            | The date metadata file in a remote backup directory                                                | [Backup, Restore, and Sync](/guide/feats/save-backup) |
| Tauri              | Tauri v2                     | A framework that builds the desktop shell in Rust and renders the UI with web technologies         | [Command-Line Tool](/guide/feats/other)               |
| Cargo Workspace    | —                            | A Rust workspace containing the `vnweb-cli` and `vnweb-desktop` crates                             | [Architecture Overview](/guide/advanced/architecture) |
| NSIS               | —                            | A Windows installer format whose install / uninstall hooks maintain the user's `PATH`              | [Command-Line Tool](/guide/feats/other)               |
| Portable mode      | Portable                     | When a `portable` marker exists in the install directory, data is written to `user-data` inside it | [Command-Line Tool](/guide/feats/other)               |
| `VNWEB_DATA_DIR`   | —                            | An environment variable that sets the user data directory; its default varies by install type      | [Command-Line Tool](/guide/feats/other)               |

## Scenario Index

### I want to organize my games into the library

1. First understand the difference between **VN**, **Galgame**, and **ADV / AVG** labels—they affect platform search keywords.
2. Configure scan directories and exclude rules, and see which fields **Scraping** writes from platforms.
3. Link local games to platform entries through **ID Mapping**; duplicate entries can be handled with the merge endpoint.
4. When you need images, distinguish the covers / backgrounds / icons / logos from **SteamGridDB** from a game's own **CG**.

See also: [Scanning and Game Library](/guide/feats/game-library) · [Platform Integrations and Metadata Updates](/guide/feats/platforms)

### I want to follow a walkthrough

1. A walkthrough is structured as **Route → END → Step**, and the step type determines how it's presented in the UI.
2. Keep an **FD** as a walkthrough separate from the main work.
3. Progress checkmarks persist through the API; the `group` field corresponds to a date or chapter grouping.

See also: [Walkthroughs and Route Progress](/guide/feats/walkthroughs)

### I want to add AI capabilities

1. **OpenAI-compatible** determines whether a model can be plugged in directly; **SSE** determines whether output can stream.
2. **WebMCP** is the tool-registration mechanism, with **Polyfill** covering browsers that lack native support.
3. The result of a **Tool Calling** may render as a **Generative UI** card, and only writes after confirmation.
4. Model arguments often contain a **VNDB ID** or platform name, which **ID Mapping** resolves back to a game.

See also: [AI Assistant and WebMCP](/guide/feats/ai-assistant) · [Platform Integrations and WebMCP](/guide/advanced/platform-integrations)

### I want to migrate or back up my data

1. First tell apart the configuration fields of the two remote protocols, **WebDAV** and **S3**.
2. `backup-meta.json` in the remote directory tells you the backup date; a restore replaces everything rather than merging.
3. **Tauri**, **Cargo Workspace**, **NSIS**, and **Portable mode** in the installer determine where your data lands.
4. For path issues, check `VNWEB_DATA_DIR` and `VNWEB_APP_DIR` first.

See also: [Backup, Restore, and Sync](/guide/feats/save-backup) · [Command-Line Tool](/guide/feats/other)

### I want to contribute

1. Pages are organized under **App Router**, and the build output is **Standalone**.
2. Requests reach **Drizzle** / **libSQL** through **route.ts**; schema changes land through **Migrations**.
3. Use **react-query** for server state, **Jotai** for client state, and **Zod** for input validation.
4. Reuse **shadcn/ui** for UI first, write custom styles with **Tailwind CSS v4**, and check with `oxlint / oxfmt`.

See also: [Contributing Guide](/guide/advanced/contributing) · [API and Data Layer](/guide/advanced/api-and-data)

## Further Reading

- [Architecture Overview](/guide/advanced/architecture) · [API and Data Layer](/guide/advanced/api-and-data)
- [Platform Integrations and WebMCP](/guide/advanced/platform-integrations) · [FAQ](/guide/advanced/faq)
