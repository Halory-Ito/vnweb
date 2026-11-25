# Changelog and Roadmap

::: warning About This Page
The repo has no standalone `CHANGELOG.md` yet. This page is compiled from `package.json`, `ROADMAP.md`, and `plan.md`, distinguishing **shipped** (checked off in `plan.md`) from **Planned / Example** (roadmap items). It doesn't invent released version numbers—wherever a version appears, its source is noted.
:::

## Current Version Coordinates

| Item                      | Value                              | Source                                 |
| ------------------------- | ---------------------------------- | -------------------------------------- |
| App version               | `0.2.2`                            | `package.json`                         |
| Tauri version             | `0.2.2`                            | `crates/vnweb-desktop/tauri.conf.json` |
| License                   | AGPL-3.0-only                      | `package.json`, `LICENSE`              |
| Framework                 | Next.js `^16.4.5` / React `19.2.3` | `package.json`                         |
| Desktop installer example | `vnweb_0.2.0_x64-setup.exe`        | build result recorded in `plan.md`     |

## Version Timeline (Illustrative)

The table below summarizes the checked-off work in `plan.md` by theme; it is **not a version-by-version release log**:

| Theme                         | Representative work                                                                                                                 | Status                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Documentation and open source | SVG nav icons, update overview screenshot, VitePress module guides, AGPL-3.0 license                                                | Shipped (checked in `plan.md`) |
| OST and music                 | Keyword search, pagination and cross-page selection, import by NetEase Cloud ID, MUSIC_U, Enhanced / Meting source labels           | Shipped                        |
| Settings and platforms        | Config consolidated in `platform.json`, DB path in `general.json`, atomic replacement, type validation, official credential entries | Shipped                        |
| Accounts and status           | Steam OpenID binding, Bangumi personal token, mirror URLs, many-to-one status mapping and manual sync                               | Shipped                        |
| Walkthroughs and memories     | Responsive toolbar, drag-and-drop sorting fix, segmented progress coloring, MDX frontmatter, bulk delete, soundtrack links          | Shipped                        |
| Backup and sync               | Category selection, pre-upload summary, progress bar, compressed backups, native Save As                                            | Shipped                        |
| Packaging and desktop         | runtime-paths consolidation, automatic migrations, standalone, CLI bundle, Tauri v2, NSIS, GitHub Actions                           | Shipped                        |
| AI and roadmap                | AI assistant / WebMCP, public ROADMAP                                                                                               | Shipped                        |

## Shipped Capabilities in Detail

### Documentation and Open Source

- Use SVG icons for the docs home navigation and feature groups, unifying the VitePress home and body styling and responsive layout.
- Write module-by-module VitePress usage guides and update the docs nav; English is served at `/` and Simplified Chinese under `/zh/`.
- Add the AGPL-3.0 open-source license and update the license notice.

### OST and Music

- Unify OST album keyword search with direct calls to the NetEase Cloud Music web API; cap the results panel width and prevent table overflow.
- Paginate search results, 10 albums per page by default, preserving selections across pages; import by the selected NetEase Cloud album IDs.
- Support Meting services that can only read individual tracks; allow configuring Enhanced API's `MUSIC_U` and pass it to the server during playback.
- Label Enhanced or Meting sources in the display area; unify component sizes and font sizes in platform and appearance settings.

### Settings and Platforms

- Migrate all platform config calls to `data/settings/platform.json` and remove the old config entry; consolidate the SQLite path in `data/settings/general.json`.
- Fill in missing files from examples on initialization; save platform settings serially and replace the file atomically to avoid concurrent overwrites.
- Validate platform config field types and port ranges; show platform read errors and retry entries, keeping unreadable config files.
- Add official credential links and hint panels for VNDB, Bangumi, YMGal, and Steam.
- Bangumi switched to personal-token binding and dropped OAuth; its token URL supports mirror configuration.
- Steam OpenID login binding and callback verification; VNDB token write-permission check.
- Configure many-to-one status mapping in appearance settings and sync to Bangumi / VNDB; status changes save immediately, with manual per-platform sync and progress shown.
- Persist each game's platform push record, customize the indicator-dot colors for the four push statuses; group and persist platform visibility toggles by purpose.
- Platform settings prefer the browser cache, reading from the server only on a cache miss.

### Walkthroughs, Memories, and Media

- Improve the walkthrough toolbar's responsive layout and switch to the matching game background when entering a walkthrough detail page.
- Tune walkthrough card proportions and responsive container columns; bottom pagination can be configured by row count and columns per row.
- Fix drag-and-drop sorting of route branches; color the progress bar by segment and give clear completion feedback at 100%.
- Refactor the walkthrough tab on game details to remove nested scrolling and cards inside cards, adding custom colors, confirmation to prevent mis-taps, and a standalone entry.
- Memories can parse Markdown frontmatter; add / edit forms are now scrollable dialogs limited in width and height, supporting description, tags, dates, and custom metadata.
- A memory image's `alt` text becomes its caption automatically; memories can link OST tracks that play automatically when you open the detail page.
- Settings → Memories supports custom metadata and icon search; bulk delete for memories.
- The OST shelf sets a default number of items per row by screen width; the floating player's up-next queue supports an expand / collapse animation.

### Backup and Sync

- Refactor the backup settings page's styling and component structure: flat card flow, outlined buttons, AlertDialog confirmations, Skeleton loading states.
- The pre-upload summary panel shows file counts, sizes, and percentages for the database, saves, images, and other categories.
- Backup contents are customizable: game saves, 11 image categories, video, audio, and fonts; brand icons get their own image category.
- Remote uploads first package `backup.zip` and generate a `backup-meta.json` date file; downloads pull and extract the archive, stay compatible with older uncompressed backups, and show a live progress bar.
- All settings files (including `custom.css`) are covered by local backups, ZIP import / export, and remote sync.
- On the Tauri desktop app, backup ZIP, XLSX, and report PNG exports use native Save As dialogs.

### Packaging and Desktop

- Consolidate application and user-data directories through `lib/server/runtime-paths.mjs`, decoupling path I/O from `process.cwd()`.
- Fill in missing config and run database migrations automatically on both server and CLI startup, supporting takeover of an existing `local.db` and creation of a new one.
- Configure Next.js with `output: 'standalone'` and trim the output; add `build-cli.mjs` and `build-standalone.mjs`.
- Create a Cargo Workspace with the native CLI entry point `crates/vnweb-cli`; no arguments starts the desktop app, arguments go to the CLI, and both share `%APPDATA%\vnweb` by default.
- Build the Tauri v2 desktop shell: single-instance lock, system tray, Windows Job Object child-process management, port allocation and readiness probing, and opening external links in the system browser.
- A resource-prep script embeds `node.exe`, the standalone output, and `vnweb.exe`; NSIS install / uninstall hooks maintain `PATH`.
- GitHub Actions builds a Windows x64 installer and publishes a Release after a push to `main`, generating the description and title automatically.
- Add an "About" tab in Settings showing project info and checking GitHub for updates.
- Enable borderless mode, hybrid layout, grouping by developer, custom backgrounds, and 4px / 80% frosted glass by default.
- Add an "Enable native title bar" setting wired to Tauri window decorations.
- The launch animation supports image / video modes, separate configuration, duration and skip settings; double-click the screen or press Esc to skip.
- The desktop app's first-run initialization and loading screens use the project's light / dark palette and serif brand aesthetic, with step-by-step progress feedback.

## Planned (from ROADMAP.md)

::: tip Example items, no release order promised
The following are intentions and exploration directions from the public roadmap; scope and order depend on prototypes and evaluation. Don't treat them as shipped features.
:::

### Library

| Direction        | Description                                             | Status  |
| ---------------- | ------------------------------------------------------- | ------- |
| CG Gallery       | A dedicated browsing and management module for game CGs | Planned |
| Patch Management | Select patches on a per-launch basis                    | Planned |

### AI R&D

| Direction                          | Description                                                                                                             | Status             |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Multimodal Narrative Understanding | Extract characters, events, and route relations from user-selected text and screenshots, and evaluate traceability      | Proposed / Example |
| Semantic Knowledge Graph           | Define a reusable schema for works, characters, routes, and events, preserving source attribution and supporting export | Proposed / Example |
| Spoiler-safe GraphRAG              | Retrieve the graph by the player's route and progress, evaluating spoiler leakage, relevance, and answer grounding      | Proposed / Example |
| Agent Workflows and Generative UI  | Extend WebMCP's structured results, previews, and change confirmations, evaluating tool selection and task completion   | Proposed / Example |

### Privacy and Security

| Direction                    | Description                                                                                                             | Status |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------ |
| Outbound Visibility          | Local storage by default; the scope and destination of data sent to external models is visible to the user              | Goal   |
| Tool Permissions             | Define permissions, separate read and write access, require confirmation for important changes                          | Goal   |
| Prompt Injection Defense     | Evaluate how well Agents resist injection when consuming imported metadata, walkthroughs, and other third-party content | Goal   |
| Credentials and Supply Chain | Review credential handling, local data protection, and dependency supply-chain risks                                    | Goal   |

If we get OpenAI API credits, the experiments will be used for inference, embeddings, structured output, and tool calls; we plan to open-source reusable components, reference implementations, and evaluation benchmarks built with synthetic or properly licensed material.

## Changelog Maintenance Guidelines

When adding a version entry, follow these conventions:

1. **Version heading**: use the real release version and date, for example `## [0.2.2] - 2026-xx-xx`. Don't invent version numbers for unreleased changes.
2. **Categories**: use the five types `Added` / `Changed` / `Fixed` / `Removed` / `Security` (the Chinese docs use the corresponding Chinese labels).
3. **Entry granularity**: one change per entry, describing the user-visible impact; avoid empty phrases like "improved experience".
4. **Links**: link to the Issue / PR when there is one; check off the matching `plan.md` entry.
5. **Breaking changes**: call out migration steps separately when database schema, config fields, or CLI arguments change.
6. **Fix errors**: check `errors.md` first per repo habit, and delete the entry from that file once it's fixed.
7. **Multilingual**: keep the English and Simplified Chinese docs on the same version timeline; use root-relative paths for English and `/zh/` paths for Chinese internal links.

Example template (illustrative only, not a released version):

```md
## [Example 0.x.0] - 2026-xx-xx

### Added

- Added a CG gallery with browsing by game and category.

### Fixed

- Fixed walkthrough toolbar overflow on some narrow screens.

### Security

- The scope of data sent in model requests is now clearly shown on the config page.
```

## Further Reading

- [Public Roadmap](/roadmap) · [What Is vnweb](/guide/intro/what-is-vnweb) · [Roadmap Source (GitHub)](https://github.com/Halory-Ito/vnweb/blob/main/ROADMAP.md)
- [Architecture Overview](/guide/advanced/architecture) · [Contributing Guide](/guide/advanced/contributing) · [Glossary](/guide/advanced/glossary)
- [AI Assistant and WebMCP](/guide/feats/ai-assistant) · [Appearance and Themes](/guide/feats/custom-theme)
