# FAQ

Grouped Q&A by scenario. For more systematic explanations, see [Installation and Configuration](/guide/intro/installation-and-configuration), the individual [feature pages](/guide/feats/game-library), and [Architecture Overview](/guide/advanced/architecture).

## Installation and Startup

### Q1: What environment do I need to run vnweb?

Node.js 20.9 or newer and npm; Windows is recommended. Local directory scanning, launching executables, process timing, and system fonts all require the computer running vnweb to access file paths directly. See [Installation and Configuration](/guide/intro/installation-and-configuration).

### Q2: What does one-click installation do on Windows?

Double-clicking `init.bat` checks the environment, installs dependencies, fills in missing settings under `data/settings/` from `data/example/`, initializes the database, builds a production version, and adds the project directory to the user's `PATH`. After that, just run `vnweb` in a new terminal; the default port is `8999`.

### Q3: Will running `init.bat` lose my existing data?

It rebuilds the database. The script first backs up the existing `local.db` and its `-wal` / `-shm` / `-journal` sidecar files to `backups/db/`, then creates an empty one. Close the vnweb service and Drizzle Studio before running it, and make a separate backup of your own.

### Q4: Which ports do development and production use?

`npm run dev` defaults to `http://localhost:3000`; `npm run start` defaults to `http://localhost:8999` and listens on `0.0.0.0`. The production port comes from the `-p` flag in the `start` script in `package.json`.

### Q5: Where is the database, and can I change it?

The default is `file:./local.db`; change it via `dbFileName` in `data/settings/general.json`, effective after a restart. When the application and data directories are separated, paths are controlled by `VNWEB_APP_DIR` and `VNWEB_DATA_DIR`.

## Scanning and Game Library

### Q6: What scan modes are supported?

Two: hierarchical directory scanning and executable scanning. You can set the scan depth, exclude directories, and register multiple game directories. Scan settings are stored in the `scanner` table and failures in `scan_error`. See [Scanning and Game Library](/guide/feats/game-library).

### Q7: How many library layouts are there?

Four: folder, list, grid, and hybrid. You can group by developer, show or hide card titles, and configure rounded corners and folder color palettes. See [Appearance and Themes](/guide/feats/custom-theme).

### Q8: What if scanning finds duplicate games?

You can merge several source entries into a target game with the merge endpoint (`POST /api/game/merge`), or check for an existing entry with the same name when importing. Deduplication by external ID relies on the unique index on `game_id_map`.

### Q9: How do I bulk-edit metadata or NSFW flags?

The library supports multi-select batch actions; the API layer provides `batchUpdateGameMetadata` (with a selectable provider, fields, and `replace` / `merge` / `append` strategy) and `batchMarkNsfw`.

## Scraping and Platforms

### Q10: Which platforms does vnweb support?

Five built-in game providers: Bangumi, Steam, SteamGridDB, VNDB, and YMGal; plus three character providers: VNDB, Bangumi, and YMGal. See [Platform Integrations and WebMCP](/guide/advanced/platform-integrations).

### Q11: Why do I need to configure platform credentials?

Searching for entries, importing account collections, syncing characters, and pushing status all require authorization on the platform side. Credentials go in `data/settings/platform.json`, with a template at `data/example/platform.json`; fill them in under **Settings → Platforms**.

### Q12: Does Bangumi still use OAuth?

No. Bangumi now uses **personal-token** binding, and its OAuth config and authorization endpoints have been removed; the token URL supports mirror configuration.

### Q13: Is a VNDB token mandatory?

Reading work and character metadata usually doesn't need one; writing status does require the right permissions, so check your token's write scope before configuring it. VNDB OAuth no longer depends on environment variables.

### Q14: What if images fail to load?

Check network access to the image host; you can try saving character images locally. For remote images, `next.config.ts` allows any http/https host, and the server also provides an image-proxy route.

## Launch and Records

### Q15: How do I launch a game?

In the web UI, set the executable path in the game's detail view and click Start; or run `vnweb start <game ID>` from the command line. The CLI requires an absolute path, and omitting the ID launches the most recently played game. See [Launch and Play Records](/guide/feats/play-records) and [Command-Line Tool](/guide/feats/other).

### Q16: How do I end and save a timing session?

On the CLI timing screen, press **`q`** to end and save; `Ctrl+C` exits immediately and does **not** save the current session.

### Q17: Can I sync play status to Bangumi / VNDB?

Yes. First configure a many-to-one mapping from local statuses to platform statuses in platform settings; changes save as soon as you switch status, and you can sync manually per platform. Push records are stored in the `game_status_push` table.

## Walkthroughs, Quotes, and Memories

### Q18: What is the walkthrough import format?

Both platform-search imports and JSON imports are supported. The JSON must contain `name.zh-cn` and `routes`, with at least one ending per route and one step per ending. The UI includes a built-in "format guide & AI prompt". See [Walkthroughs and Route Progress](/guide/feats/walkthroughs).

### Q19: Can I export quotes to a spreadsheet?

Yes. On the global **Quotes** page, click **Export XLSX** and export by game or filter; on the desktop app this opens a native Save As dialog. You can also use the AI tool `export_quotes_xlsx`.

### Q20: Does the body of a memory support Markdown?

Yes. Memories use MDX / frontmatter, so you can include headings, quotes, and images; a Markdown image's `alt` text becomes its caption automatically, and you can link an OST track to play along with it. See [Characters, Quotes, and Memories](/guide/feats/game-notes).

## Backup and Sync

### Q21: Are game-save backups and app backups the same thing?

No. Game-save backups copy each game's `saveDir` directory and are triggered by vnweb when you exit a game; app-data backups save the database, settings files, and local assets. It's a good idea to enable both. See [Backup, Restore, and Sync](/guide/feats/save-backup).

### Q22: Which remote sync services are supported?

WebDAV and S3-compatible object storage. Both are abstracted behind a `SyncClient` interface: uploads are packaged as `backup.zip` together with a `backup-meta.json` date file, and downloads support a progress bar plus extracting the archive to restore.

### Q23: Does a restore merge data?

No. Restore / import replaces everything, so check the backup date and keep a separate copy of the ZIP first. The implementation backs up the directories that are about to be overwritten as `.bak`.

### Q24: Can I choose what goes into a backup?

Yes. Game saves, 11 image categories, video, audio, and fonts can all be selected in backup settings and the pre-upload summary panel. Settings files (`data/settings/*` and `custom.css`) are always included.

## Themes and Appearance

### Q25: How do I change the font?

In **Settings → Appearance**, pick a font installed on your machine, adjust the size / weight, and confirm to apply. The global font is driven by `--app-font-family`; components shouldn't specify their own font family.

### Q26: Where do theme variables go?

In the CSS editor under **Settings → Theme**, use `:root` for light mode and `.dark` for dark mode; you can also edit `app/custom.css` in the source. See [Appearance and Themes](/guide/feats/custom-theme).

### Q27: How do borderless mode and the native title bar work together?

The Borderless toggle controls how component borders are rendered; on the desktop app, turning off "Native title bar" makes the header draggable and double-click-to-maximize, with custom window buttons shown. This setting only affects desktop window decorations.

## AI and Tools

### Q28: Does the AI assistant need an internet connection?

It depends on the model configuration. You can connect an OpenAI-compatible cloud service or point `baseUrl` at a compatible service running locally. With an external service, conversations, attachments, and tool parameters are sent to that address—mind your privacy. See [AI Assistant and WebMCP](/guide/feats/ai-assistant).

### Q29: Why isn't the model calling my tools?

Check that the tools are registered on the **WebMCP** tab; use a model that supports function calling; and include the game name in your prompt. When candidate cards come back, you need to confirm in the card before anything is actually written.

## Performance and Troubleshooting

### Q30: What if the page feels sluggish?

Avoid loading many remote images at once; use skeletons and pagination; don't trigger full-library syncs too often. During development, watch rendering performance so a small state change doesn't re-render the whole page.

### Q31: What should I do about a Hydration error?

Memory detail pages render with MDX; in the past, nesting `<center>` inside `<p>` triggered a Hydration error. Use standard Markdown syntax instead.

### Q32: I changed a setting but nothing happened—why?

Font size / weight needs to be confirmed to apply; a database path change needs a restart; platform settings are read from the browser cache, so refresh or retry as prompted in the UI.

## Further Reading

- [What Is vnweb](/guide/intro/what-is-vnweb) · [Installation and Configuration](/guide/intro/installation-and-configuration)
- [Glossary](/guide/advanced/glossary) · [Changelog and Roadmap](/guide/advanced/changelog) · [Contributing Guide](/guide/advanced/contributing)
