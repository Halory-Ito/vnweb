# What Is vnweb

**vnweb is open-source, local-first, agent-native infrastructure for digital culture.** Starting with visual novels and local single-player games, it brings scattered files, community metadata, media, and personal play records into one self-hostable library—and explores how people and AI agents can curate and understand narrative works under explicit user control.

> Use the Web UI for day-to-day curation, analytics, and AI-assisted workflows; use CMD for quick launches; or open the Tauri desktop app for an integrated native shell. See the [Public Roadmap](/roadmap) for upcoming library features and AI research directions.

![Game detail view](/overview.png)

## What Problem Does It Actually Solve

If you only have three or five games, folders are fine. But once your local visual novel collection reaches dozens or hundreds, folders start to show their limits:

- **Can't find it**: you remember "that one by so-and-so, with a blue cover," but not the actual title.
- **Can't identify it**: downloaded folders may have garbled abbreviations for names, with no cover, developer, or characters.
- **Can't remember it**: how many hours you've played, where you left off, which routes you've cleared—all left to memory.
- **Scattered everywhere**: walkthroughs in browser bookmarks, OSTs in your music app, memories in chat logs, saves on another drive.

What vnweb wants to do is gather these fragments into **one self-hostable library**: the game is the center of gravity, with covers and metadata, characters, PVs, OSTs, walkthroughs, quote excerpts, memories, and play records attached around it.

## Core Capabilities at a Glance

| Capability          | Details                                                                                                                                                                      | Read more                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Game library        | Multi-directory scanning, hierarchical scanning, executable scanning, exclude rules; four layouts—folder/list/grid/mixed; favorites, filtering and sorting, batch operations | [Scanning and Game Library](/guide/feats/game-library)                                                                    |
| Metadata scraping   | Fill in descriptions, tags, characters, and images from Steam, VNDB, Bangumi, YMGal, and SteamGridDB                                                                         | [Platform Integrations and Metadata Updates](/guide/feats/platforms)                                                      |
| Launch and tracking | Set an executable path, launch a local game, record sessions, and roll up playtime                                                                                           | [Launch and Play Records](/guide/feats/play-records)                                                                      |
| Statistics          | Last 7 days, streak days, total time, completed games, goals, heatmap, time distribution, rankings, monthly/yearly reports, poster export                                    | [Launch and Play Records](/guide/feats/play-records)                                                                      |
| Media               | PVs (direct links / HLS / Bilibili / YouTube / local upload), OSTs (NetEase Cloud album search, Meting / Enhanced API, lyrics and fullscreen playback)                       | [PV and OST](/guide/feats/media)                                                                                          |
| Content             | Characters and sprites, memories (MDX / frontmatter), quote excerpts (XLSX export), walkthroughs and route progress                                                          | [Characters, Quotes, and Memories](/guide/feats/game-notes), [Walkthroughs and Route Progress](/guide/feats/walkthroughs) |
| Appearance          | Font and font size, light/dark backgrounds, frosted glass, theme semantic colors, borderless mode, startup animation                                                         | [Appearance and Themes](/guide/feats/custom-theme)                                                                        |
| Data protection     | Save and settings backups, ZIP export/import, WebDAV / S3 remote sync                                                                                                        | [Backup, Restore, and Sync](/guide/feats/save-backup)                                                                     |
| Extensions          | OpenAI-compatible AI assistant, WebMCP tools, interactive generative UI, command-line tool                                                                                   | [AI Assistant and WebMCP](/guide/feats/ai-assistant), [Command-Line Tool](/guide/feats/other)                             |

This isn't a guarantee that every feature is available on every platform. Capabilities differ slightly between entry points, and UI labels may shift between versions; go by what you actually see.

## Who It's For

::: tip You Might Like vnweb If…

- You play visual novels or local single-player games, and you keep the files **on your own computer**.
- You want your metadata as complete as possible, and you're willing to spend a little time configuring platform credentials in exchange for automatic scraping.
- You care about UI details—fonts, backgrounds, borders, and layouts are all yours to tune.
- You want to know "how many hours have I actually logged over the years," and you're willing to look back at the reports.
  :::

On the other hand, these expectations may not be a good fit:

- You want a cloud-synced SaaS you can pick up on any device: vnweb runs on your machine by default, with your data on that machine.
- You only want to manage your Steam library without storing local files: the Steam client is simpler.
- You expect it to automatically recognize every oddly named cracked or translated release: scanning still needs you to confirm the rules and the results; see [Scanning and Game Library](/guide/feats/game-library).

## How It Compares to Similar Tools

These are my own impressions, not objective reviews. Tools keep changing, so it's best to try the current version yourself.

| Tool         | What I liked at the time                                                                 | What felt lacking at the time                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **PotatoVN** | The first time I discovered "there's software like this," and it was convenient to use   | Too little customization—I'm a bit picky about styling                                                        |
| **Vnite**    | Much better looking, with a very rich feature set                                        | Still not enough niche information—I wanted a wiki; and a few small bugs were hard for me to accept           |
| **vnweb**    | Puts metadata, media, walkthroughs, records, and appearance in one self-hostable library | Still growing; some capabilities and platform integrations depend on community and upstream service stability |

I don't want to "beat" anyone. The reason I built vnweb is simple: if an existing tool almost does what I want, I'll fill in that last bit myself.

## Workflow Overview

Once setup is done, the day-to-day loop is actually short:

```text
Scan/Import → Fill in metadata → Set executable path → Launch and track → Review stats → Organize content → Back up
```

1. **Add**: scan local directories, add games manually, or import from a third-party platform.
2. **Enrich**: after configuring platforms, update metadata, images, and characters.
3. **Launch**: confirm the executable path, start the game; when you exit, the session is saved automatically.
4. **Look back**: check trends in the overview, monthly report, or yearly report, or open a single game's Records tab.
5. **Keep it**: write memories, excerpt quotes, organize walkthroughs, and add PVs and OSTs.
6. **Save it**: make a local backup or sync to WebDAV / S3.

Every step has its own doc: start from the [First Use](#first-use) checklist, then jump into the pages in the [core capabilities table](#core-capabilities-at-a-glance) as needed.

## Three Entry Points

### Web UI: Your Daily Workhorse

Open the local service in a browser (`http://localhost:3000` in development by default, `http://localhost:8999` in production/launch mode). Scanning, scraping, statistics, theme settings, and backups all happen here—it's the most complete entry point.

### CMD: Quick Launch and Batch Operations

`vnweb.bat` in the project root is the command-line entry point: with no arguments it starts the web service; with arguments it enters command-line mode. Handy for searching games, listing favorites, or launching the one you played last.

```sh
vnweb list game
vnweb search "White Album"
vnweb start 12       # Launch and track time; press q to stop
vnweb start          # Quick-launch the most recently played game
```

::: warning Paths Are Local to This Machine
Launching from the command line requires an **absolute path on this machine** to the executable. If you move the game to another drive, update the path in [Game Details → Settings](/guide/feats/game-library). For more commands see [Command-Line Tool](/guide/feats/other).
:::

### Desktop App: Open It Like Any Other Software

The repo includes a desktop shell built on **Tauri v2**. The Windows x64 installer offers single-instance management and a system tray, and uses native dialogs to pick executables and save directories. The desktop and web apps share the same user data directory; see [Installation and Configuration](/guide/intro/installation-and-configuration#method-3-tauri-desktop-app) for the build scripts.

## First Use

1. Follow [Installation and Configuration](/guide/intro/installation-and-configuration) to start vnweb and open the web UI.
2. [Scan your local game directories or add games manually](/guide/feats/game-library). If you need covers, characters, or other metadata, [configure the corresponding platforms](/guide/feats/platforms).
3. Open a game's detail page, set its executable path, and [start the game](/guide/feats/play-records). After your first exit, you'll see the session duration in that game's Records.
4. As needed, [maintain walkthroughs](/guide/feats/walkthroughs), [organize memories and quotes](/guide/feats/game-notes), or [enable save backups](/guide/feats/save-backup).

For a tighter, command-by-command path, go straight to [Quick Start: From Zero to Playing in 5 Minutes](/guide/intro/quick-start).

## How It All Started

I got into visual novels in 2024. My first was The Starving (饿殍); I made it about 70% through, but life got in the way and I put it down for a long time.

Then came Fate/stay night (fsn). Similar story: no walkthrough and no habit of saving often, so by the later routes it seemed all I had left were bad endings—and I stopped.

Then Subarashiki Hibi (素晴日). I'd heard so much about it, but at the time I hadn't even finished the prologue; it felt fine, and I didn't keep going.

The first one I actually finished was Danganronpa 1. It felt great, and the art style had real character—that's when I finally understood the appeal of visual novels.

After that I worked my way through Subarashiki Hibi, Danganronpa 2, Mahoutsukai no Yoru (魔法使之夜), and other well-regarded titles, and there was no turning back.

Looking back, that history explains a lot of this project's details. Why build walkthroughs and route progress? Because back then I didn't use a walkthrough and ended up with nothing but bad endings. Why track playtime and recently played games? Because I dropped things so many times that when I picked them up again I always wanted to know "where was I?" Why give every game a place to write memories? Because some stories really make you want to say something after the credits roll.

## Why I Built This

As my local visual novel collection grew, managing it felt inelegant—all I had were folders, which don't match the visual novel aesthetic at all.

At first I used other visual novel managers. PotatoVN came first, and I was genuinely astonished: there was software like this, and it was convenient—but too little customization for my picky styling taste.

Later I found Vnite, which looked much better and had a very rich feature set. But it still wasn't enough: if you're going to manage visual novels, you should support as much niche information as possible—ideally to wiki level. There were also a few small bugs I found hard to accept.

So, between my interest in building this kind of project and a graduation project whose topic I could choose myself, I got started.

> An aside: during my defense I got grilled—"What significance does this project have for the country and society?", "This is your graduation project; you built it just to play games better?", 🥲

## Design Philosophy

### Data Flows Back to Local

Platforms are a source, not a destination. Scraped metadata, characters, and images all end up in the local library; you can go offline and keep using what you've already imported. See [API and Data Layer](/guide/advanced/api-and-data) for the conventions.

### Customizable Without Getting in the Way

Appearance settings offer fonts, backgrounds, frosted glass, theme colors, and borderless mode, but the defaults work out of the box; changing a setting refreshes only the relevant area instead of "touch one thing, re-render the whole page." See [Appearance and Themes](/guide/feats/custom-theme).

### Let Content Connect

A game isn't an isolated entry: characters, PVs, OSTs, walkthroughs, memories, and quotes hang off it, while also being browsable on global pages. That connection is a core concept in the [Architecture Overview](/guide/advanced/architecture).

### Cautious with External Content

Imported metadata, walkthroughs, and memories are third-party content. When an agent reads it, there need to be permission boundaries and user confirmation—an explicit security goal in the public roadmap. See [Platform Integrations and WebMCP](/guide/advanced/platform-integrations) and [About](/about).

## Roadmap Pointers

The v0.2.2 local-first foundation in the table above is already shipped. Guided by [ROADMAP.md](https://github.com/Halory-Ito/vnweb/blob/main/ROADMAP.md), the project is evolving along two tracks:

- **Game library experience**: a CG gallery and per-launch patch management.
- **Narrative and agent research**: multimodal narrative understanding, semantic knowledge graphs, spoiler-aware GraphRAG based on play progress, agent workflows with structured previews/confirmations, and privacy/security evaluations.

These are research and planning directions, not version promises. For details see the [Public Roadmap](/roadmap), [About → What Comes Next](/about#what-comes-next), and the [Changelog](/guide/advanced/changelog).

## Summary

- vnweb is a **local-first** library for visual novels and single-player games—not cloud storage, and not just a launcher.
- It strings scanning, scraping, launch tracking, statistics, media, and content organization into one workflow.
- Three entry points coexist: the Web UI for daily work, CMD for quick launches, and the desktop app for "opening it like software."
- Next up: [Quick Start](/guide/intro/quick-start) → [Game Library](/guide/feats/game-library) → [Platform Integrations](/guide/feats/platforms).

If you're still unsure whether to install it after all this, read the [FAQ](/guide/advanced/faq) and the [Glossary](/guide/advanced/glossary).
