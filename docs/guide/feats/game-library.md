# Scanning & Game Library

The game library is the main entry point for every feature: scanning turns local folders into entries, metadata scraping makes them readable, launching and play tracking revolve around it, and PVs, OSTs, walkthroughs, and memories all hang off it. For your first library build, follow the [Quick Start](/guide/intro/quick-start).

## Scan Local Games

### Register Scan Directories

1. Open **Scan** in the top bar, click **Add scan directory list**, and select the parent folder that contains your games.
2. Choose a scan mode based on the folder structure (see the table below).
3. After saving, click the start button for that scan directory. To process multiple registered directories, click **Scan All**.
4. When the scan finishes, review the added and failed results, then open a game in the **Game Library** to verify its name and executable path.

::: tip Paths are local to this machine
Directory paths refer to the computer running vnweb. Even when you access the web UI from another machine, scanning still reads the disk on the server's computer.
:::

### The Two Scan Modes

| Mode                | When to use it                                                                     | How to set the depth                                              | Example                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Depth scan**      | A collection where each game occupies its own folder                               | Enter the number of levels between the game folder and its parent | `D:\Games\Game Name` → select `D:\Games`, depth `0`; `D:\Games\Publisher\Game Name` → depth `1` |
| **Executable scan** | Folder depths are inconsistent, or you want to find games directly by their `.exe` | No depth needed                                                   | Find every game behind executables in a mixed folder                                            |

Depth must be an **integer greater than or equal to 0**; saving is rejected otherwise.

<!-- Screenshot placeholder: Scan page showing the registered directory list, scan mode selection, depth input, and excluded-path configuration -->

### Excluded Paths

The scan configuration can maintain a global list of excluded paths. Add tool folders, uninstallers, runtimes, and similar directories so they aren't mistaken for games.

```text
D:\Games\_tools
D:\Games\CommonRedist
D:\Games\__MacOSX
```

::: warning Excluded paths are string matches
If a game never shows up, first check whether its parent path is caught by an exclusion rule. Conversely, if the scan turns up a lot of noise, add more excluded paths and scan again.
:::

### Detection Rules vs. Actual Results

Scanning "discovers candidates"; it doesn't "guarantee accuracy":

- Depth scan treats subdirectories under the parent as candidates, with depth deciding how many levels to descend.
- Executable scan uses executables in the folder as clues.
- You still need to verify names, covers, and executable paths in the game library; use manual add or platform import to correct things when needed.

### After Moving a Folder

If you move a game to another drive, update its location under **Game Details → Settings → Executable Path**. Command-line launching in particular depends on an absolute path; see [Launching & Play History](/guide/feats/play-records#launch-the-game-and-start-tracking).

## Add Manually or Import in Bulk

### Add a Single Game

To add just one game, open the library's add menu and choose **Add Manually**. You can enter a name and search for metadata to select, or simply fill in the basic details yourself.

Good for:

- A scan produced the wrong name and you want to create a fresh entry.
- The game isn't in a standard folder, such as a standalone or portable build.
- You already know which platform entry to bind and want to create the entry straight from search results.

### Import from a Third Party

If you already have a third-party collection, use **Import from Third Party** in the same menu. Pick a source (Steam, Bangumi, VNDB, YMGal, etc.), load your account's collection, and check the games you want to import.

```text
Game Library → Add menu → Import from Third Party → Select source → Check entries → Confirm import
```

::: tip Configure credentials before importing
Personal collections require account authorization. Bind your account under [Platform Integration & Metadata](/guide/feats/platforms#configure-platforms) first, then come back to import. If you plan to launch imported games locally, also verify the executable path in the entry's **Settings**.
:::

See [Platform Integration & Metadata](/guide/feats/platforms) for import sources and configuration fields, and [Import Collections and Update Metadata](/guide/feats/platforms#import-collections-and-update-metadata) on that page for the metadata update strategy after import.

## Organize the Game Library

### Four Layouts

The library offers **folder, list, grid, and mixed** layouts:

| Layout | Best for                                                               |
| ------ | ---------------------------------------------------------------------- |
| Folder | Browsing by folder/group, close to a file explorer                     |
| List   | More entries per screen, easy to compare by name or playtime           |
| Grid   | Cover-first, visual browsing                                           |
| Mixed  | Categories on the left, content on the right; good for large libraries |

The default appearance settings usually enable borderless mode and the mixed layout; layouts are a visual preference and can be changed in [Appearance & Themes](/guide/feats/custom-theme).

### Filter and Sort

Use filters and sorting to find games quickly. Common dimensions include name, total playtime, last launched, rating, platform/developer categories, and favorites.

::: tip Organizing a large library
First split the library into smaller groups with "Group by developer" or favorites, then sort by recently played within each group. This is faster than searching the whole library every time.
:::

### Favorites and Bulk Actions

- Use favorites to group games you're playing, plan to clear, or belong to the same series.
- To work on multiple games, enter multi-select mode, select entries, then use the bulk menu.
- If you have duplicate entries, use the merge flow to tidy them up; check both sides' data and records before merging so you don't lose sessions.

::: danger Confirm the scope of bulk actions
Bulk updates or deletes affect multiple records at once. Before running one, verify your filters and the number of selected entries—especially entries with custom covers, memories, or walkthroughs.
:::

### Game Detail Page

Click a game to open its detail page. Common sections:

| Section                          | Purpose                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview                         | Synopsis, basic info (developer/publisher/release date/genre/engine/platform), tags, and extra info                                                           |
| Settings                         | Executable path, save path, images, and platform associations                                                                                                 |
| Related People                   | Characters and sprites, see [Characters, Quotes & Memories](/guide/feats/game-notes)                                                                          |
| PV                               | Associated trailers, see [Add and Play PV](/guide/feats/media#add-and-play-pv)                                                                                |
| OST                              | Associated albums and tracks, see [Import and Play OST](/guide/feats/media#import-and-play-ost)                                                               |
| Records                          | This game's playtime history, see [Launching & Play History](/guide/feats/play-records)                                                                       |
| Memories / Quotes / Walkthroughs | Content you've built up yourself, see [Characters, Quotes & Memories](/guide/feats/game-notes) and [Walkthroughs & Route Progress](/guide/feats/walkthroughs) |

![Game detail page showing the cover, playtime, and tabs for characters, OST, and records](/overview.png)

## Covers and Metadata

### Where Metadata Comes From

Scanning only creates the entry; covers, synopses, tags, characters, publishers, and other metadata are mainly filled in by platforms:

1. Enable the relevant platforms under **Settings → Platforms** and enter credentials.
2. In a game's right-click menu, choose **Update Metadata**, then search by game name or platform ID.
3. Verify the version and name before applying the result.

Image assets (covers, backgrounds, icons, logos) can also be supplemented from sources such as SteamGridDB; fields and uses are described in [Platform Integration & Metadata](/guide/feats/platforms#configure-platforms).

### Manual Maintenance

To maintain images individually, match a platform entry, or change the executable path, open **Settings** on the game detail page. After importing a third-party entry, if you want to launch a locally installed copy, be sure to verify the executable path here.

::: warning Names and versions
One title may have separate entries for the original, a remake, and a localized version. When updating metadata, cross-check release date, developer, and platform so you don't put a remake's cover on the original.
:::

## FAQ

### The scan returns 0 results

1. Make sure you selected the parent folder, not the game folder itself.
2. Check the depth: `D:\Games\Game Name` → `0`; add one more publisher level → `1`.
3. Check whether an excluded path covers the target folder.
4. If folder depths are messy, switch to **Executable scan**.

### The scan picks up things that aren't games

Add tool folders, uninstallers, and runtime directories to the excluded paths, then scan again. If needed, delete the false entries and rescan.

### The game name is wrong or covers are scrambled

Use **Update Metadata** to match again by platform ID; names can be corrected directly in the basic info. Watch for version differences when matching.

### Imported games won't launch

A third-party collection only brings metadata, not a local executable. Go to the game's **Settings** and enter an absolute path to the program; see [Launching & Play History](/guide/feats/play-records#launch-the-game-and-start-tracking).

### Duplicate entries

Use the merge flow in bulk actions; before merging, check both entries' records and media associations, and consider making a [backup](/guide/feats/save-backup) first.

### Images fail to display

Platform image endpoints can be affected by the network. Confirm the platform configuration works, then try updating metadata again; see [Platform Integration → Rate Limits and Failure Handling](/guide/feats/platforms#rate-limits-and-failure-handling).

## Summary

- Scanning "discovers"; human review makes it "accurate".
- Depth scan reads folder structure; executable scan looks at `.exe` files.
- Platform imports build a library quickly, but local launching still needs an executable path.
- Four layouts plus favorites and bulk actions are the keys to managing a large library.

Next: [Platform Integration & Metadata](/guide/feats/platforms) → [Launching & Play History](/guide/feats/play-records) → [PV & OST](/guide/feats/media). To understand how data is stored, read [API & Data Layer](/guide/advanced/api-and-data).
