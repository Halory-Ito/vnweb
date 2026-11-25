# Characters, Quotes & Memories

This page covers three kinds of "detail data" you can build up around a game: **character profiles** pulled from platforms, **quote excerpts** you record yourself, and **play memories** saved as MDX articles. All three hang off a game's detail page, but their data shapes and uses differ: characters are structured metadata, quotes are short text entries, and memories are long-form posts with frontmatter.

> Before you start, complete [Installation & Configuration](/guide/intro/installation-and-configuration) and add a game to the [game library](/guide/feats/game-library). Character syncing depends on external platforms; see [Platform Integration & Metadata](/guide/feats/platforms) for credentials.

## Feature Overview

| Capability        | Where                                                  | Main data                  | Typical use                              |
| ----------------- | ------------------------------------------------------ | -------------------------- | ---------------------------------------- |
| Character sync    | Game detail → Related People → Character sync settings | `character` table          | Bulk import sprites and profiles         |
| Character profile | Character card → Character detail                      | Structured fields + images | View height, birthday, related quotes    |
| Quote excerpts    | Top bar "Quotes" / Game detail → Quotes                | `game_quote` table         | Save memorable lines, export to XLSX     |
| Memories          | Game detail → Memories                                 | MDX + frontmatter          | Write long play notes, replay soundtrack |
| Memory metadata   | Settings → Memories                                    | Settings files             | Custom fields and icons                  |

## Organize Character Data

### Sync Flow

1. Open the target game's detail page and switch to the **Related People** tab.
2. Click **Character Sync Settings** and choose a **data source** in the dialog. The built-in sources are VNDB, Bangumi, and YMGal.
3. Check or enter the platform's **game ID**. vnweb first looks up the local-game-to-platform mapping in the `game_id_map` table; only type it manually if no mapping is found.
4. Optionally check **Save character images locally**. When checked, sprites are downloaded to the local asset directory and included in backups; otherwise the remote image URLs are kept.
5. Click **Save** to start syncing and wait for the character cards to appear.

::: tip Where to get the ID
VNDB character IDs look like `c123` and work IDs like `v184`. If you previously searched with VNDB and added the game through [Platform Integration](/guide/feats/platforms), the mapping was written to `game_id_map` automatically and you usually don't need to enter an ID manually.
:::

### Synced Character Profiles

Each character entry stores these structured fields:

| Group          | Fields                                                | Meaning                                                       |
| -------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| Identity       | `name` / `original`                                   | Translated name and original-language name                    |
| Bio            | `description`                                         | Character introduction returned by the platform               |
| Appearance     | `imageUrl`                                            | Sprite URL or local path                                      |
| Body           | `height` / `weight` / `bust` / `waist` / `hips`       | Height (cm), weight (kg), and measurements                    |
| Details        | `bloodType` / `age` / `birthdayMonth` / `birthdayDay` | Blood type, age, birthday                                     |
| Classification | `sex` / `gender`                                      | Biological sex and gender identity, stored as JSON text       |
| Deduplication  | `vndbId`                                              | Forms a unique index with `gameId` to prevent duplicate syncs |

Click a character card to open its detail and see quote excerpts associated with that character—provided you selected the character when creating the quote.

### Differences Between Data Sources

| Source  | Strengths                                                               | Notes                                                                                                                                         |
| ------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| VNDB    | The most complete character fields, including measurements and birthday | Requires an API address; the token is only for write operations (see [Platform Integrations & WebMCP](/guide/advanced/platform-integrations)) |
| Bangumi | Good coverage of Chinese-language entries                               | The character-list response structure is validated before syncing; nothing is written if it's abnormal                                        |
| YMGal   | Supplements Chinese domestic galgame data                               | Requires the matching account credentials                                                                                                     |

::: warning Syncing overwrites rather than merges
Characters with the same `(gameId, vndbId)` are updated. If you've manually edited a character's bio, syncing again may overwrite your changes. Keep important content in a memory as well.
:::

## Add and Export Quotes

### Create a Quote

1. Go to **Quotes** in the top bar, or open the **Quotes** tab on a game detail page.
2. Click **Add Quote**, fill in the line in `content`, and associate the game via `gameId`.
3. If character data has been synced, select the character in the **Character** field so you can find the quote later from that character's detail page.
4. Optional: fill in `context` to record the story situation before the line.
5. After saving, find it with the search box and game / character filters.

### How Quotes Are Stored

```sql
-- Key fields of the game_quote table (from db/schema.ts)
id          INTEGER PRIMARY KEY AUTOINCREMENT
gameId      INTEGER NOT NULL
content     TEXT    NOT NULL
characterId TEXT    DEFAULT ''   -- references character.id
context     TEXT    DEFAULT ''
createdAt   TEXT    DEFAULT ''
updatedAt   TEXT    DEFAULT ''
```

`characterId` is stored as text to accommodate the empty string used when there is "no associated character".

### Export to XLSX

On the global **Quotes** page, click **Export XLSX**, choose which games to include and how to export, and a spreadsheet file is generated. ExcelJS builds the workbook on the server.

- **Export by game**: select specific games, ideal for a line script for a single work.
- **Export by filter**: combine search keywords and creation-time filters for a themed quote collection.
- **Desktop**: on Tauri desktop, export opens a native Save As dialog so you can pick the path.

The AI assistant's `export_quotes_xlsx` tool performs the same filtering and export; see [AI Assistant & WebMCP](/guide/feats/ai-assistant).

## Write Play Memories

A memory is a post with Markdown body and frontmatter metadata, suited to longer impressions, route retrospectives, or plot notes.

### Create and Edit

1. Open **Game Detail → Memories** and click New.
2. Enter a title and body. Markdown is supported, for example:

   ```md
   ## Yuki's Route

   It wasn't until I reached the seaside that I understood: those recurring monologues weren't foreshadowing—they were an echo.

   > Whose "everyday" is it that we keep talking about?
   ```

3. Upload screenshots. A Markdown image's text (`alt`) is automatically shown as the caption.
4. Optionally associate OST tracks and enable autoplay. To pick tracks, organize the songs first in [PV & OST](/guide/feats/media).
5. After saving, open the entry to read. On narrow screens the table of contents appears above the article; on wide screens it appears on the left.

The memory form is a scrollable dialog with bounded width and height, so long posts don't disturb page layout. The list supports batch delete, with a confirmation step for higher-risk operations.

### Frontmatter Metadata

A memory's extra information lives in Markdown frontmatter, kept in sync both ways with the editor form:

```yaml
---
title: The Day I First Cleared It
description: A few notes on Summer Pocket
tags:
  - Impressions
  - First Playthrough
date: 2026-03-14
---
The body starts here.
```

- A built-in set of common blog metadata fields (with icons) is available.
- Under **Settings → Memories** you can maintain **custom metadata**, such as "Platform Played On" or "Personal Rating", and pick a field icon.
- Memory images are a separate backup category, included in local backups, ZIP exports, and remote sync; see [Backup, Restore & Sync](/guide/feats/save-backup).

::: tip MDX rendering
Memory detail pages render with MDX. You can mix headings, quotes, images, and custom components in the body. A historical issue where `<center>` nested inside `<p>` caused a hydration error has been fixed; standard Markdown syntax is still recommended when writing.
:::

## Relationship to Platform Metadata

Character syncing and platform metadata share the same ID mapping mechanism:

1. When importing a game through platform search, write `game_id_map(provider, externalId)`.
2. The game's `externalSourceIds` also retains each platform's external ID.
3. During character sync, resolve the external ID by `(gameId, provider)`, then call the corresponding provider to fetch the character list.
4. Fetched fields are normalized into a unified `NormalizedCharacterRow`, then written to the `character` table.

This mapping layer lets you go from a game to its platform entry and back from a platform entry to the local game. Status push (syncing play status to Bangumi / VNDB) reuses the same mapping; see [Platform Integrations & WebMCP](/guide/advanced/platform-integrations) and [Launching & Play History](/guide/feats/play-records).

## Troubleshooting

| Symptom                                   | Possible cause                                            | Fix                                                     |
| ----------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| Character list is empty after syncing     | Wrong game ID, or the platform has no character data      | Recheck the ID in sync settings; try another source     |
| Character images show as broken           | Remote image host restrictions, or local download failed  | Check **Save locally** and resync; check the network    |
| No quotes visible in a character's detail | The quote wasn't associated with that character           | Edit the quote and select the character                 |
| XLSX export is empty                      | No entries match the current filters                      | Clear the search term or select a different game        |
| Memory body renders incorrectly           | Non-standard MDX tags were used                           | Switch to standard Markdown syntax                      |
| Memory metadata is missing                | The editor wasn't saved, or a backup restore overwrote it | Check frontmatter; recover an older version from backup |

::: danger Data boundaries
vnweb keeps its library and play records local by default. External platforms are only used to read metadata or push status; uploading data depends on an explicit action in platform settings. The scope handled by models and third-party services is covered in [AI Assistant & WebMCP](/guide/feats/ai-assistant).
:::

## Further Reading

- [What is vnweb](/guide/intro/what-is-vnweb) · [Installation & Configuration](/guide/intro/installation-and-configuration)
- [Scanning & Game Library](/guide/feats/game-library) · [Platform Integration & Metadata](/guide/feats/platforms)
- [PV & OST](/guide/feats/media) · [Walkthroughs & Route Progress](/guide/feats/walkthroughs)
- [API & Data Layer](/guide/advanced/api-and-data) · [Glossary](/guide/advanced/glossary)
