# About vnweb

This page answers three questions: who vnweb is, why it exists, and where it's headed. If you're wondering "how do I install it and use it," start with the [Documentation](/), [Installation and Configuration](/guide/intro/installation-and-configuration), or [Quick Start](/guide/intro/quick-start).

## In One Sentence

vnweb is **open-source, local-first, agent-native infrastructure for digital culture**—starting as a management hub for visual novels and local single-player games that organizes disk folders into a library, enriches metadata, tracks play sessions, connects walkthroughs, PVs, OSTs, memories, and quotes, and explores human–agent collaboration under user control.

![vnweb game detail view](/overview.png)

For a fuller look at the product's positioning, who it's for, and how it compares to similar tools, see [What Is vnweb](/guide/intro/what-is-vnweb); that page also keeps the real story of how I got into visual novels and decided to build this project.

## Where It Came From

The story starts with a very ordinary annoyance: more and more visual novels on my disk, and nothing but folders to show for them. A folder won't tell you how many hours you've spent on a game, where its cover is, who its characters are, or which route you last reached.

I started with PotatoVN and was amazed that such software existed—but it wasn't customizable enough. Then I found Vnite, with a much richer interface and feature set, yet I still wanted something closer to a "wiki-level" depth of niche information—characters, routes, music, walkthroughs, and quotes all attached to the same game. When it turned out I could choose my own graduation project topic, that was that.

That experience shaped vnweb's character: it should be as easy to use as a tool, yet flexible enough for every player to organize "their own little narrative universe" in their own way.

::: tip This Is Not a Commercial Product
vnweb is an open-source project released under the AGPL-3.0 license. There's no account system, no forced cloud sync, and no plan to treat your game library as data to be harvested.
:::

## Principles I Stick To

### Local First, Your Data Stays Yours

Game directories, executable paths, play sessions, and settings all live on the computer running vnweb. The default database is `local.db` in the project directory, settings are collected in `data/settings/`, and sample files sit in `data/example/`. You're free to back them up, export them, or move them anywhere.

### Aggregate, Don't Possess

Metadata can come from Steam, VNDB, Bangumi, YMGal, SteamGridDB, NetEase Cloud Music, and elsewhere—but what vnweb does is bring that information into _your_ library, not tie you to any one platform. For the purpose and boundaries of platform credentials, see [Platform Integrations and Metadata Updates](/guide/feats/platforms).

### Records Exist for Looking Back

Tracking time isn't about grading anyone. It's about opening a yearly report late one night and thinking, "So that's how much time I spent on these stories that year." For statistical dimensions, report templates, and export options, see [Launch and Play Records](/guide/feats/play-records).

### Clear Module Boundaries

The frontend is split by feature into `features/`; cross-module requests and types are collected under the root-level `api/` and `types/`; and the actual requests are served by routes under `app/api/`. That way, changing one module doesn't pull everything else along with it. To understand the code structure, read [Architecture Overview](/guide/advanced/architecture) and [API and Data Layer](/guide/advanced/api-and-data).

## Tech Stack at a Glance

| Layer            | Technology                                                                          |
| ---------------- | ----------------------------------------------------------------------------------- |
| Framework        | Next.js 16 (App Router / Turbopack), React 19, TypeScript 5                         |
| UI               | Tailwind CSS 4, shadcn/ui (Radix UI), Lucide, Recharts, Motion                      |
| Data and storage | SQLite (libSQL), Drizzle ORM, TanStack Query 5, Jotai, axios                        |
| Media and sync   | hls.js, `@meting/core`, ExcelJS, MDX / react-markdown, WebDAV, `@aws-sdk/client-s3` |
| Agent            | OpenAI-compatible APIs, `usewebmcp`, interactive generative UI                      |
| Desktop          | Tauri v2, Rust CLI entry point, Windows Job Object child-process hosting            |
| Tooling          | oxlint, oxfmt, VitePress, `tsx`                                                     |

When choosing dependencies I prefer what's already at hand: reuse shadcn/ui and Tailwind v4 for styling, reuse the project's wrapped `api` instance for requests, and avoid pulling in a library when a native implementation will do. See the [Contributing Guide](/guide/advanced/contributing) for details.

## What It Can Do Today

| Area         | Implemented capabilities                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Game library | Multi-directory scanning, hierarchical/executable scanning, exclude rules, four layouts, favorites, filtering and sorting, batch operations |
| Metadata     | Scraping from Steam / VNDB / Bangumi / YMGal / SteamGridDB, Steam playtime sync, Bangumi / VNDB status push                                 |
| Content      | Characters and sprites, PVs, OSTs, memories (MDX + frontmatter), quote excerpts, walkthroughs and route progress                            |
| Statistics   | Home overview, goal tracking, heatmap, time distribution, monthly/yearly reports, poster export                                             |
| Appearance   | Custom font and font size, light/dark and mobile backgrounds, frosted glass, theme semantic colors, borderless mode, startup animation      |
| Data         | Save and settings backups, ZIP export/import, WebDAV / S3 remote sync                                                                       |
| Extensions   | OpenAI-compatible AI assistant, WebMCP tools, command-line tool, Tauri desktop app                                                          |

For step-by-step entry points, see the [documentation home](/). Features link to one another: for example, from the [Game Library](/guide/feats/game-library) to [Platform Integrations](/guide/feats/platforms), and on to [Play Records](/guide/feats/play-records).

## What Comes Next

The public roadmap splits the direction into two kinds. Already completed: the local game library, multi-source metadata and status sync, the detail-page content system, statistics and backup sync, the AI assistant, and WebMCP. Still in progress:

- **Game library**: a CG gallery; patch management that lets you choose patches at launch.
- **Narrative understanding**: extracting characters, events, and route relationships from text and screenshots the user chooses, and evaluating whether they can be traced back to sources.
- **Semantic knowledge graph**: reusable schemas for works, characters, routes, and events, preserving source provenance and supporting query and export.
- **Spoiler-aware GraphRAG**: retrieval based on the player's current route and progress, measuring spoiler leakage, relevance, and how well answers are grounded.
- **Agent workflows**: more structured tool results, previews and confirmations, and evaluation of tool selection and task completion rates.
- **Privacy and security**: visibility into the scope and destination of external model requests, separation of read/write permissions, evaluation of prompt-injection resistance, and review of credentials and supply chain.

These are research directions, not commitments to specific releases. Explore the structured [Public Roadmap](/roadmap), track progress in [ROADMAP.md](https://github.com/Halory-Ito/vnweb/blob/main/ROADMAP.md) and GitHub Issues, or review shipped milestones in the [Changelog](/guide/advanced/changelog).

::: warning About the Roadmap
Items marked "proposed" or "planned" may change in scope or order as prototypes are evaluated. Don't rely on unreleased interfaces in automated workflows.
:::

## Open Source and License

vnweb uses the **GNU Affero General Public License v3.0 (AGPL-3.0)**. You're free to use, modify, and distribute it; if you offer a modified version as a network service, you must make the corresponding source available to its users. The full terms are in the LICENSE file at the repository root.

I think this license fits vnweb's character: it's a tool you can self-host, and community improvements should be able to flow back.

## Acknowledgements

Without these works and projects, vnweb today wouldn't exist:

- **Metadata and walkthrough sources**: [VNDB](https://vndb.org/), [Bangumi](https://bgm.tv/), [Steam](https://store.steampowered.com/), [YMGal](https://www.ymgal.games/), [SteamGridDB](https://www.steamgriddb.com/), [yjgalgame](https://www.yjgalgame.com/).
- **Infrastructure**: [Next.js](https://nextjs.org/), [React](https://react.dev/), [shadcn/ui](https://ui.shadcn.com/), [Drizzle ORM](https://orm.drizzle.team/), VitePress.
- **More importantly**: everyone who writes stories with care, and every player willing to organize their playthroughs with care.

## Get Involved

- Questions about how to use it: start with the [FAQ](/guide/advanced/faq) and the [Glossary](/guide/advanced/glossary).
- Found a bug or want a feature: describe the reproduction steps, your system environment, and redacted errors in GitHub Issues.
- Want to change code or docs: read the [Contributing Guide](/guide/advanced/contributing), then run `npm run lint`, `npm run fmt:check`, and `npm run build` before submitting.
- Want to understand how platform credentials are configured and why: [Platform Integrations and WebMCP](/guide/advanced/platform-integrations) is the better starting point.

## Summary

vnweb is a tool written by a visual novel fan for other fans: local-first, metadata-aggregating, with records you can look back on and a structure you can extend. It isn't perfect yet, but every day it moves a little closer to being "a library that understands visual novels."

- Want to use it: [Installation and Configuration](/guide/intro/installation-and-configuration) → [Quick Start](/guide/intro/quick-start)
- Want to understand the design: [What Is vnweb](/guide/intro/what-is-vnweb)
- Want to contribute: [Contributing Guide](/guide/advanced/contributing)

> The secret is but a flower. (秘则为花。)
>
> — The original About page contained only these four words; it's preserved here as a signature.
