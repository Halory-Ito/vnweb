# Roadmap

**Open-source, local-first, agent-native infrastructure for digital culture.**

Visual novels provide the starting point for connecting scattered community metadata with users' own local libraries—and for exploring how AI agents can work with narrative material under explicit human control.

::: info Scope and Expectations
This page mirrors [ROADMAP.md](https://github.com/Halory-Ito/vnweb/blob/main/ROADMAP.md) and separates **shipped capabilities** in `v0.2.2` from **planned features** and **proposed AI research**. Proposed items describe experiments and intended open-source outputs; scope and sequence depend on prototype evaluation, with no fixed release dates promised.
:::

## Vision

Most game managers treat entries as isolated titles with a cover and a play button. Digital culture—and visual novels in particular—carries rich narrative structure: routes, endings, characters, soundtracks, quotes, and personal play logs.

vnweb's long-term goal is to make works, characters, and narrative material easier to **connect, search, and reuse across sources**, while letting users decide which data remains strictly local and which data external services may process.

## Available Today (`v0.2.2` Foundation)

The local-first foundation is already shipped and ready for daily use across Web UI, Desktop (Tauri v2), and CLI:

| Pillar                          | Shipped Capabilities                                                                                                                                                                                                       | Guide                                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Library & Metadata Sync**     | Multi-directory, hierarchical, and executable scanning; four layouts; collections; scraping from Steam, VNDB, Bangumi, YMGal, and SteamGridDB; Steam playtime sync and Bangumi / VNDB status push                          | [Game Library](/guide/feats/game-library) · [Platforms](/guide/feats/platforms)                                      |
| **Narrative Dossier & Media**   | Character profiles and sprites, PVs (HLS / direct / Bilibili / YouTube), OSTs (NetEase / Meting / Enhanced API / fullscreen player), MDX memories with frontmatter, quote exports (XLSX), and four-level walkthroughs      | [Media](/guide/feats/media) · [Notes](/guide/feats/game-notes) · [Walkthroughs](/guide/feats/walkthroughs)           |
| **Analytics, Theming & Backup** | Session tracking, daily and yearly goals, monthly heatmaps, session duration distributions, monthly/yearly reports and PNG posters; custom fonts, backgrounds, frosted glass, semantic colors, and WebDAV / S3 backup sync | [Play Records](/guide/feats/play-records) · [Themes](/guide/feats/custom-theme) · [Backup](/guide/feats/save-backup) |
| **AI Assistant & WebMCP**       | OpenAI-compatible streaming chat with reasoning display and image/text attachments, 7 built-in WebMCP tools, and interactive Generative UI confirmation cards                                                              | [AI Assistant & WebMCP](/guide/feats/ai-assistant) · [Platform & WebMCP](/guide/advanced/platform-integrations)      |

## Planned Library Features

Near-term library capabilities tracked on the public roadmap:

- **CG Gallery** (`Planned`): A dedicated gallery module for browsing, organizing, and reviewing extracted or collected CG artwork per game.
- **Per-Launch Patch Management** (`Planned`): Manage game patches (translations, voice patches, restoration mods) and select which patch configuration applies at launch.

## Proposed AI Research & Development

These tracks describe active research directions and experimental milestones:

### 1. Multimodal Narrative Understanding

`Proposed Research`

Prototype extracting characters, key events, and route relationships from **user-selected** text excerpts and gameplay screenshots. Evaluation focuses on extraction accuracy and **source provenance**—whether generated claims can trace directly back to the selected text or visual context.

### 2. Semantic Knowledge Graphs

`Proposed Research`

Define a reusable, open schema linking **works, characters, routes, and narrative events**. Preserves source attribution across community metadata and local notes, with support for structured querying and portable export.

### 3. Spoiler-Aware GraphRAG

`Proposed Research`

Experiment with retrieval over the semantic knowledge graph conditioned on the player's **current route and play progress**. Evaluation measures:

- **Spoiler leakage rate** across earlier vs. completed routes
- **Retrieval relevance** for plot, character, and choice questions
- **Answer grounding** against attributed local/source passages

### 4. Agent Workflows & Generative UI

`Proposed Research`

Extend the existing [WebMCP](/guide/feats/ai-assistant) layer with richer structured tool results, side-by-side change previews, and explicit confirmation gates before mutating the library. Evaluation focuses on tool selection reliability and end-to-end task completion.

### 5. Open-Source Deliverables & Benchmarks

`Proposed Output`

Experiments with reasoning, embeddings, structured outputs, and tool calling (supported by OpenAI API credits when available) aim to produce open-source artifacts for the wider community:

- Reusable schemas and extraction/retrieval components
- Documented reference implementations
- Reproducible evaluation benchmarks built on synthetic or appropriately licensed material

## Privacy, Permissions & Security Goals

Because agent-native workflows touch personal libraries and untrusted third-party guides or metadata, security is treated as a first-class engineering track:

| Area                                         | Target Design                                                                                                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Local-First & Outbound Visibility**        | Keep personal libraries and play progress local by default. Make every external model request—its payload scope and destination—explicitly visible to the user. |
| **Tool Permissions & Read/Write Separation** | Separate read-only inspection tools from state-mutating tools, and require explicit user confirmation before applying consequential changes.                    |
| **Prompt Injection Resistance**              | Evaluate agent behavior against prompt injection embedded in imported metadata, third-party walkthroughs, and external web content.                             |
| **Credentials & Supply Chain**               | Continually review API token storage, local file protection, and dependency supply-chain risks as platform and agent integrations grow.                         |

## Follow & Contribute

- Source of truth: [ROADMAP.md](https://github.com/Halory-Ito/vnweb/blob/main/ROADMAP.md)
- Task tracking: [GitHub Issues](https://github.com/Halory-Ito/vnweb/issues)
- Shipped history: [Changelog](/guide/advanced/changelog)
- Development workflow: [Contributing Guide](/guide/advanced/contributing)
