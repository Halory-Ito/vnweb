# vnweb Roadmap

[简体中文 README](./README.md) · [English README](./README.en.md)

vnweb aims to build open-source, local-first, agent-native infrastructure for digital culture. Visual novels provide the starting point for connecting community metadata with users’ own libraries and exploring how agents can work with that material under user control.

## Available today

- [x] Local game library, multi-directory scanning, metadata imports, and Bangumi and VNDB status synchronization.
- [x] Game details with characters, trailers, soundtracks, play records, memories, quotes, and guides.
- [x] Dashboard, playtime analytics, reports, appearance customization, and WebDAV and S3 backup sync.
- [x] OpenAI-compatible AI assistant, WebMCP tools, and interactive generative UI cards.

## Planned library features

- [ ] Add a CG gallery.
- [ ] Add patch management with per-launch patch selection.

## Proposed AI research and development

These milestones describe experiments and intended outputs. Their scope and release order will depend on what the prototypes and evaluations show.

- [ ] **Multimodal narrative understanding.** Prototype extracting characters, events, and route relationships from user-selected text and screenshots. Evaluate extraction quality and whether answers can point back to their sources.
- [ ] **Semantic knowledge graphs.** Define a reusable schema for works, characters, routes, and events. Preserve source attribution and support querying and exporting the resulting graph.
- [ ] **Spoiler-aware GraphRAG.** Test retrieval over the graph using the player’s route and progress. Measure spoiler leakage, retrieval relevance, and answer grounding across different playthrough states.
- [ ] **Agent workflows and generative UI.** Extend WebMCP workflows with structured tool results, previews, and confirmation for changes to the library. Evaluate tool selection and task completion.

If OpenAI API credits become available, they will support experiments with reasoning, embeddings, structured outputs, and tool calling. Planned open-source outputs include reusable components, documented reference implementations, and evaluation benchmarks using synthetic or appropriately licensed material.

## Privacy and security

- [ ] Keep personal libraries and play progress local by default. Make external model requests, their data scope, and their destinations visible to users.
- [ ] Define tool permissions, separate read and write access, and require user confirmation for consequential changes.
- [ ] Evaluate prompt injection resistance when agents consume imported metadata, guides, and other third-party content.
- [ ] Review credential handling, local data protection, and dependency supply chain risks as integrations expand.

Follow individual tasks in [GitHub Issues](https://github.com/Halory-Ito/vnweb/issues). vnweb is released under the [GNU Affero General Public License v3.0](./LICENSE).
