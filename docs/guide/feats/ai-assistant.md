# AI Assistant & WebMCP

The **AI Assistant** in the top bar has three tabs: **Chat**, **WebMCP**, and **Config**. It isn't a built-in cloud assistant: you bring your own OpenAI-compatible model, and WebMCP tools let the model act on your local library. Tool calls return interactive **generative UI cards**, and nothing is written to data until you select and confirm.

> vnweb treats AI as a **local-first, agent-native** foundation for digital culture. Multimodal narrative understanding, semantic knowledge graphs, and spoiler-aware GraphRAG based on play progress are proposed research directions on the [Public Roadmap](/roadmap); see also [Changelog & Roadmap](/guide/advanced/changelog).

## Configure a Model

### Add a Model

1. Click **AI Assistant** in the top bar and switch to **Config**.
2. Add a model with an OpenAI-compatible API and fill in:

   | Field          | Description                                           |
   | -------------- | ----------------------------------------------------- |
   | `name`         | Name shown in the config list                         |
   | `baseUrl`      | API base URL, for example `https://api.openai.com/v1` |
   | `apiKey`       | API key; reads return a masked placeholder            |
   | `model`        | Model name, for example `gpt-4o-mini`                 |
   | `systemPrompt` | Optional system prompt                                |

3. Click Test Connection. The test calls `/api/agent/models` to fetch the upstream model list.
4. After saving, set this config as the active model (`activeConfigId`).

You can have multiple configs, stored under the `agent` node of `data/settings/general.json`:

```json
{
  "agent": {
    "configs": [
      {
        "id": "uuid-...",
        "name": "Local Ollama",
        "baseUrl": "http://127.0.0.1:11434/v1",
        "apiKey": "",
        "model": "qwen2.5:14b"
      }
    ],
    "activeConfigId": "uuid-..."
  }
}
```

::: tip Local models
Any server implementing OpenAI-compatible `/chat/completions` and `/models` will work. Point `baseUrl` at a local address to try tool calls without uploading your data.
:::

### Chat Capabilities

- **Streaming output**: replies stream character by character over the SSE stream from `/api/agent/chat`. Browser axios can't read the response body chunk by chunk, so the API layer uses `fetch` + `ReadableStream`; this is wrapped in `api/agent.ts`, and components don't call `fetch` directly.
- **Collapsible reasoning**: supports incremental `reasoning_content`, rendered separately in a collapsible area.
- **Multimodal attachments**: text and image attachments are supported; you can paste a screenshot so the model can refer to guide text or an on-screen view.
- **Tool calls**: when the model returns `tool_calls`, the front end renders the results as cards; after you confirm, they're sent back to the model to continue.

## How WebMCP Works

WebMCP lets a web page register its own capabilities as tools for agents that support tool calling.

1. **Runtime initialization**: `ensureWebMcpRuntime()` checks whether the browser natively provides `document.modelContext`; otherwise it installs a fallback via `@mcp-b/webmcp-polyfill`. This must run before registering tools and only works on the client.
2. **Tool registration**: each feature module registers tools with `useWebMCP`, describing tool inputs with Zod schemas.
3. **Conversion to OpenAI tools**: registered tools are converted to `AgentToolDefinition` (`type: 'function'`) and sent to the model with the chat request.
4. **Generative UI**: when a tool returns candidates (for example several OST albums), they render as selectable cards. The request only executes after you select and confirm.

The **WebMCP** tab shows the tools currently registered on the page.

## Built-in Tools

There are 7 tools across four modules: games, walkthroughs, OST, and quotes.

| Tool                   | Module       | Purpose                                                                                                             |
| ---------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------- |
| `add_game_to_library`  | Games        | Search by name and add to the library, automatically configuring cover, background, icon, and logo from SteamGridDB |
| `sync_game_characters` | Games        | Sync a game's character profiles and sprites, with binding by data source and external ID                           |
| `sync_game_pv`         | Games        | Sync Steam trailers; when unbound, search by name and render candidate cards to choose from                         |
| `import_game_guide`    | Walkthroughs | Turn uploaded guide text into structured JSON and import it into a game                                             |
| `search_game_ost`      | OST          | Search khinsider / NetEase for OST albums and return multi-select candidate cards                                   |
| `import_game_ost`      | OST          | Import all or selected tracks from the chosen album; same-name albums are skipped by default                        |
| `export_quotes_xlsx`   | Quotes       | Filter quotes by keyword or creation time and export to XLSX                                                        |

### Example Call

Here's how a user request maps to a tool call (actual arguments are generated by the model):

```json
{
  "name": "import_game_guide",
  "arguments": {
    "gameId": 12,
    "guideText": "...raw walkthrough text..."
  }
}
```

Tool execution depends on platform configuration: for example, `add_game_to_library` images come from SteamGridDB, `sync_game_pv` depends on Steam binding, and `sync_game_characters` depends on a VNDB / Bangumi / YMGal data source. Complete setup first as described in [Platform Integration & Metadata](/guide/feats/platforms).

## Typical Scenarios

| What you want to do             | How to describe it                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| Add a game                      | Search for "Game Name", show me the candidates, and add the one I pick to the library. |
| Fill in characters or a trailer | Sync characters for "Game Name" in my library, or find its Steam trailer.              |
| Search and import an OST        | Search for the OST of "Game Name", let me pick the album and tracks, then import.      |
| Import a walkthrough            | Turn the attachment into a vnweb walkthrough and link it to "Game Name" in my library. |
| Export quotes                   | Filter quotes by keyword or creation time and export them to XLSX.                     |

::: tip Be specific
Include the game name, platform, or external ID whenever you can. When several works share a name, the model can't tell which one you mean; once candidate cards appear, check the associated game before confirming.
:::

## Privacy and Data Security

::: danger Data leaves this machine
Once you use an external model service, chat content, attachments, and tool arguments are sent to the `baseUrl` you configured. Check that service's privacy policy and don't enter private information you don't want to share.
:::

- API keys are masked on read: GET `/api/agent/config` returns a placeholder, and saving with the placeholder keeps the previously stored key.
- Local by default: the library and play progress stay local; uploading depends on explicit configuration and explicit tool calls.
- Tool confirmation: write operations that return candidate cards execute only after you select and confirm.
- Roadmap security goals include clear tool permissions, separated read/write access, confirmation for important changes, and evaluating prompt-injection risks in imported metadata and walkthroughs. See the [Public Roadmap](/roadmap) and [Changelog](/guide/advanced/changelog).

## Troubleshooting

| Symptom                                        | Fix                                                                                                                               |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Connection test fails                          | Check that `baseUrl` includes `/v1`, the API key is valid, and the model has `/models` access                                     |
| Chat returns 401 / 403                         | Wrong key or insufficient quota; save the config again                                                                            |
| No streaming output                            | Check whether the server's `/api/agent/chat` returns SSE; a proxy may buffer the response                                         |
| The model doesn't call a tool                  | Confirm the tools appear on the **WebMCP** tab; switch to a model that supports function calling                                  |
| Tool returns candidates but nothing is written | You need to confirm in the card; generating candidates alone doesn't write anything                                               |
| Sync tools fail                                | Check the corresponding platform's credentials and ID mapping; see [Platform Integrations](/guide/advanced/platform-integrations) |
| OST tool results are empty                     | Check the network and source availability; try different keywords                                                                 |
| The model can't see a pasted screenshot        | Confirm the model you're using supports image input                                                                               |

## Further Reading

- [What is vnweb](/guide/intro/what-is-vnweb) · [Installation & Configuration](/guide/intro/installation-and-configuration)
- [Characters, Quotes & Memories](/guide/feats/game-notes) · [Walkthroughs & Route Progress](/guide/feats/walkthroughs)
- [Platform Integration & Metadata](/guide/feats/platforms) · [Command-Line Tools](/guide/feats/other)
- [Platform Integrations & WebMCP](/guide/advanced/platform-integrations) · [FAQ](/guide/advanced/faq)
