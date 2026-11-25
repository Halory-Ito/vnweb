# Quick Start: From Zero to Playing in 5 Minutes

This page strings together every necessary action after [Installation and Configuration](/guide/intro/installation-and-configuration) into one path: **start → scan → fill in metadata → set paths → launch → review records → back up**. Every step gives the shortest possible action; details and troubleshooting link to the relevant feature docs.

::: tip Before You Begin
You've already got vnweb running per [Installation and Configuration](/guide/intro/installation-and-configuration) and can open the web UI. If not, go back to that page first; if you want to know what vnweb can do, see [What Is vnweb](/guide/intro/what-is-vnweb).
:::

## The Whole Path at a Glance

| Step | Goal               | Expected action                                 | Details                                                                       |
| ---- | ------------------ | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| 0    | Start the service  | Run `vnweb` or `npm run dev`                    | [Installation and Configuration](/guide/intro/installation-and-configuration) |
| 1    | Build the library  | Register a directory and scan it                | [Scanning and Game Library](/guide/feats/game-library)                        |
| 2    | Fill in metadata   | Configure at least one platform and update data | [Platform Integrations](/guide/feats/platforms)                               |
| 3    | Make it launchable | Set the executable path                         | [Game Library → Organize](/guide/feats/game-library)                          |
| 4    | Leave a record     | Start a game and exit normally                  | [Launch and Play Records](/guide/feats/play-records)                          |
| 5    | See the stats      | Open the records overview                       | [Launch and Play Records](/guide/feats/play-records)                          |
| 6    | Protect the result | Make a local backup                             | [Backup, Restore, and Sync](/guide/feats/save-backup)                         |

## Step 0: Start the Service

If you used the one-click Windows initialization, open a new terminal:

```bat
vnweb
```

Then open `http://localhost:8999` in your browser.

If you installed manually from source:

```bash
npm run dev      # http://localhost:3000
# or
npm run build && npm run start   # http://localhost:8999
```

<!-- Screenshot placeholder: the vnweb home dashboard in a browser, showing the last 7 days, streak days, total playtime, and completed games -->

::: warning The Page Won't Open
First confirm the service is still running and the port is correct. Production defaults to 8999 and listens on `0.0.0.0`; development defaults to 3000. For port conflicts see [Installation and Configuration → Common Installation Issues](/guide/intro/installation-and-configuration#common-installation-issues).
:::

## Step 1: Scan Local Games

Assume your games are laid out like this:

```text
D:\Games\
  ├─ SubarashikiHibi\
  │    └─ SUMMER.exe
  ├─ MahoutsukaiNoYoru\
  │    └─ Mahoutsukai.exe
  └─ Danganronpa\
       └─ Danganronpa.exe
```

1. Open **Scan** in the top bar.
2. Click **Add Scan Directory List** and select the parent folder `D:\Games`.
3. Since each game occupies its own directory, choose **hierarchical scan** and set the level to `0`. If there's an extra vendor layer in between, use `1`.
4. If there are tools, uninstallers, or other things you don't want picked up, add exclude paths in the scan config first.
5. Save, then click the start button for that directory; with multiple directories registered you can use **Scan All**.
6. Review new and failed results, then open a game's detail view in **Game Library** to check its name and executable path.

<!-- Screenshot placeholder: the Scan page showing registered directories, scan mode selection, exclude paths, and scan results -->

If your directory levels aren't consistent, use **executable scan** instead. For scanning rule details see [Scanning and Game Library](/guide/feats/game-library).

## Step 2: Fill in Covers and Metadata

A scan usually only brings in directory names and paths. To see covers, descriptions, developers, and characters, you need to connect platforms:

1. Open **Settings → Platforms**, enable the platforms you need, and enter credentials. For a first run, configure at least a **SteamGridDB API Key** (for images) plus one or two of your main metadata sources.
2. Back in the game library, open a game's detail view and use **Update Metadata** to search by game title or platform ID.
3. Check the version and name, then apply the result; if the images aren't right, adjust them individually in the detail view's Settings.

![Game detail view showing the cover, description, basic info, and tags](/game-preview.webp)

::: tip You Don't Need to Configure Everything at Once
Platform credentials can be added gradually. Querying public metadata, reading your personal collection, and pushing play status may require different permissions; only personal features need account binding. For field descriptions see [Platform Integrations and Metadata Updates](/guide/feats/platforms).
:::

## Step 3: Set the Executable Path

1. Open a game's detail view and go to **Settings**.
2. Check that **Executable Path** points to the program you actually want to run, e.g. `D:\Games\SubarashikiHibi\SUMMER.exe`.
3. If the game launches through a launcher but the playtime looks wrong, check here first to make sure it points to the process you actually play.

::: danger The Path Must Be an Absolute Path on This Machine
Command-line launching requires an absolute path on this machine to an existing executable. After moving a game to another drive, come back and update it. See [Game Library → Organize](/guide/feats/game-library).
:::

## Step 4: Launch and Track Time

Back on the detail page, click **Start Game**. vnweb launches the local program and monitors the play process. When you exit normally, the session is saved; to end it from vnweb, use **Stop Game** on the detail page.

```bat
rem You can also launch a specific game from the command line
vnweb start 12

rem With no arguments, quick-launch the most recently played game
vnweb start
```

The command-line version shows a live timer; press `q` to stop and save. More commands are in [Command-Line Tool](/guide/feats/other).

<!-- Screenshot placeholder: the Start Game and Settings buttons at the top of the game detail page, plus the playtime card -->

## Step 5: Review Records

1. Open a game's **Records** tab and switch between week / month / year to see that game's playtime curve.
2. Open the global **Records** page and start with **Overview**: total games, playtime, days, sessions, plus per-session duration distribution, time-of-day distribution, time rankings, and rating rankings.
3. For a finer view of your rhythm, switch to **Monthly Report** (daily playtime, game frequency) or **Yearly Report** (monthly playtime, active months, genre/publisher distribution, annual rankings).
4. To generate a year-in-review in one click, open **Export Report**, choose the year, template, number of games, and what to show, then download a PNG poster.

<!-- Screenshot placeholder: the records overview page showing stat cards and a playtime distribution chart -->

For statistical dimensions and chart explanations see [Launch and Play Records](/guide/feats/play-records).

## Step 6: Make a Backup

One last thing: protect what you've built.

1. Open **Settings → Backup**.
2. Make a **local backup** first and confirm that the database, settings files, and local assets are included.
3. If you need to sync across devices, configure WebDAV or S3 per [Backup, Restore, and Sync](/guide/feats/save-backup).

::: warning Before Backing Up
Make sure no game session is running and no process is writing to the database; operations that rebuild the database, such as `init.bat`, should be preceded by a separate backup.
:::

## Command-Line Shortcut

If you're comfortable with commands, the whole path compresses to this:

```bash
# 1. Start the service (keep it running in another terminal)
vnweb

# 2. List the games already in your library and note their IDs
vnweb list game

# 3. Search for the game you want
vnweb search "Subarashiki"

# 4. Launch and track time (press q to stop and save)
vnweb start 12

# 5. With no arguments, continue the most recently played game
vnweb start
```

Scanning, platform config, and backups are still best done in the Web UI; for the full command list see [Command-Line Tool](/guide/feats/other).

## Common Sticking Points

| Symptom                      | Check first                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| No games found by scanning   | Whether the level is right, the parent folder is correct, and exclude paths aren't too broad                                |
| No metadata found            | Whether the platform is enabled, credentials are valid, and a platform ID needs to be set manually                          |
| Launch error                 | Whether the executable path is absolute and exists, and whether a launcher wraps the process                                |
| Playtime is 0 or looks wrong | Whether it points to the real play process, and whether the session was ended early                                         |
| No data on the stats page    | Whether any session has been saved; refresh and retry                                                                       |
| Images fail to load          | Whether the platform image API is available; see [Platform Integrations → Rate Limits and Failures](/guide/feats/platforms) |

For more, see the [FAQ](/guide/advanced/faq) and the [Glossary](/guide/advanced/glossary).

## Summary

At this point you have a complete loop: **games on your disk, metadata in the library, playtime recorded, and data backed up**.

Continue by interest:

- Organize more games: [Scanning and Game Library](/guide/feats/game-library)
- Make metadata richer: [Platform Integrations and Metadata Updates](/guide/feats/platforms)
- Understand your play: [Launch and Play Records](/guide/feats/play-records)
- Collect PVs and OSTs: [PV and OST](/guide/feats/media)
- Go into the technical details: [Architecture Overview](/guide/advanced/architecture) and [Contributing Guide](/guide/advanced/contributing)
