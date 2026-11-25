# Walkthroughs & Route Progress

vnweb's walkthrough module breaks a text guide into four levels—**guide → route → ending → step**—and every step can be checked off. That lets you follow a guide as you play, and later look back at which routes you've taken and which endings you still need. Walkthroughs are available both globally (the **Walkthroughs** item in the top bar) and as a tab inside a game's detail page.

> Before reading this page, it helps to know [Scanning & Game Library](/guide/feats/game-library) and [Launching & Play History](/guide/feats/play-records). A walkthrough must be associated with an entry in the game library.

## The Four-Level Structure at a Glance

| Level  | Table          | Key fields                                                              | Meaning                                               |
| ------ | -------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Guide  | `game_guide`   | `gameId`, `name`, `level`, `tips`, `finished`                           | One complete guide, which can contain multiple routes |
| Route  | `guide_route`  | `guideId`, `name`, `sortOrder`, `finished`                              | A character route or chapter; drag to reorder         |
| Ending | `guide_ending` | `routeId`, `name`, `type`, `requirements`, `sortOrder`                  | A specific END; type is normal / bad / good / true    |
| Step   | `guide_step`   | `endingId`, `type`, `content`, `group`, `prefix`, `subfix`, `sortOrder` | A choice, save, load, or note                         |

Every level has a `finished` flag and `sortOrder`. A step's `group` groups it by date or chapter (for example "July 25"), while `prefix` / `subfix` mark second-playthrough choices or CG collection hints.

## Import a Walkthrough

### Method 1: Search and Import

1. First add the target game to the library.
2. Open **Walkthroughs** in the top bar and click **Import Walkthrough**.
3. On the **Search Import** tab, search by name and select the matching result.
4. Confirm the game association is correct, then submit. If the game already has a walkthrough, an overwrite confirmation appears; the import continues only after you confirm.

The search calls the server-side `/api/guide/search` and returns entries with a name, cover, developer, tags, and a route preview.

### Method 2: JSON Import

If you already have guide text, switch to **JSON Import**. Expand **Format Notes & AI Prompt** to get the built-in organizing prompt (source at `features/guide/data/import-guide-prompt.md`); fill in the game name and raw guide text, have the model produce JSON in the required format, then paste and submit.

#### Minimal Valid Example

```json
{
  "name": {
    "zh-cn": "Wonderful Everyday",
    "en-us": "Wonderful Everyday"
  },
  "level": 0,
  "tips": ["★ marks choices available on a second playthrough"],
  "routes": [
    {
      "name": "Yuki Route",
      "endings": [
        {
          "name": "Yuki Route END2",
          "type": "normal",
          "steps": [
            {
              "type": "choice",
              "content": "Go for a walk / Head back and do what needs to be done...",
              "prefix": "★",
              "group": "July 2"
            },
            { "type": "save", "content": "SAVE 2", "group": "July 2" },
            { "type": "load", "content": "LOAD 2" },
            {
              "type": "note",
              "content": "After Yuki Route END2, select It's my own Invention to begin"
            }
          ]
        }
      ]
    }
  ]
}
```

#### Field Constraints

Import is validated with Zod (`features/guide/import-guide-schema.ts`). The main constraints:

| Field                                              | Required | Constraint                                                                  |
| -------------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| `name`                                             | Yes      | Object; `name['zh-cn']` must be non-empty; `en-us` and `ja-jp` are optional |
| `routes`                                           | Yes      | Array with at least 1 route                                                 |
| `routes[].name`                                    | Yes      | Non-empty string                                                            |
| `routes[].endings`                                 | Yes      | Array with at least 1 ending                                                |
| `endings[].name`                                   | Yes      | Non-empty string                                                            |
| `endings[].type`                                   | No       | `normal` / `bad` / `good` / `true`, defaults to `normal`                    |
| `endings[].steps`                                  | Yes      | Array with at least 1 step                                                  |
| `steps[].content`                                  | Yes      | Non-empty string                                                            |
| `steps[].type`                                     | No       | `choice` / `save` / `load` / `note`, defaults to `choice`                   |
| `level`                                            | No       | Integer from 0 to 5                                                         |
| `uid` / `vndb_id` / `seoName` / `cover` / `romaji` | No       | External identifiers and display info                                       |
| `developer` / `releaseDate` / `tags` / `tips`      | No       | Supplementary metadata                                                      |
| `show` / `nsfw_content` / `views`                  | No       | Display and statistics fields                                               |

::: warning Output pure JSON only
The prompt asks the model to emit valid JSON only—no markdown fences, comments, or explanatory text. If you get a "parse failed" error after pasting, check for extra text before or after the JSON and make sure the quotes are half-width.
:::

You can also use the AI assistant's `import_game_guide` tool to turn attachment text into structured JSON and import it directly; see [AI Assistant & WebMCP](/guide/feats/ai-assistant).

## Multiple Walkthroughs per Game

The `game_guide` table only requires `gameId` and has no unique constraint, so one game can have several walkthroughs—for example a full END route map and a separate CG collection checklist. Notes:

- The list page (`/guide` or the game detail tab) shows walkthrough cards with the number of completed steps and a percentage.
- Route / ending dropdowns can be filtered by `guideId`, so you don't attach a route from guide A to an ending from guide B.
- Deletion supports batch selection: select several walkthroughs and delete them at once.
- If import warns that a walkthrough already exists, decide whether to overwrite it or keep both—overwriting replaces the game's existing walkthrough data.

::: tip When to keep them separate
If the two walkthroughs have completely different route structures (for example the "main story" and an "FD"), keep them as separate entries. If one is just a revised version of the same guide, overwriting is simpler.
:::

## Play Step by Step

1. Open a walkthrough from the list or the game detail's **Walkthroughs** tab. On entry, the background image switches to the associated game's.
2. Select a route and an ending in order, then view the steps for that END.
3. Follow the choice, save (`save`), load (`load`), and note (`note`) steps, checking each one off as you finish.
4. Route and ending pages show their own completion progress. You can also use **Mark All Complete** or **Reset Progress** at the corresponding level.
5. Progress updates are submitted via `PATCH /api/guide/{gameId}/progress` with `type` (`step` / `ending` / `route` / `guide`), `id`, and `finished`.

### Progress Feedback

Progress bars are colored by completion, with stronger visual feedback past 75% and 100%; at 100% the card shows a completed border and badge. The color bands are roughly:

| Completion | Semantic color      |
| ---------- | ------------------- |
| 100%       | emerald (complete)  |
| ≥ 75%      | sky                 |
| ≥ 50%      | amber               |
| > 0%       | rose                |
| 0%         | muted (not started) |

The top toolbar lets you adjust the number of card columns, paginate by row, and distinguish step types by custom color. The responsive layout collapses some toolbar items on narrow screens.

### Corrections and Sorting

- Add or edit routes, endings, and steps at the corresponding level.
- Routes support drag sorting; on save, the new `sortOrder` is submitted via `PATCH /api/guide/route/sort`.
- After reordering, recheck the order of save / load hints so you don't follow the guide into the wrong branch.

## Troubleshooting

| Symptom                                            | Fix                                                                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Error `name["zh-cn"] cannot be empty`              | Fill in `name.zh-cn` at the JSON top level                                                                    |
| Error `routes cannot be an empty array`            | Write at least one route                                                                                      |
| Error `endings` / `steps cannot be an empty array` | At least one ending per route and one step per ending                                                         |
| Error `content cannot be empty`                    | Check for a step that has only `type` and no content                                                          |
| Overwrite confirmation appears                     | The game already has a walkthrough; confirm overwrite or cancel and save under a different game               |
| Route order isn't saved after dragging             | Wait for the request to finish before refreshing; check the network or server logs                            |
| Checked progress isn't persisted                   | Make sure the page wasn't closed before the request finished; check `/api/guide/{gameId}/progress` for errors |
| Step prefixes / groups don't show                  | Check that `prefix` and `group` were filled in and imported correctly                                         |

::: danger Spoiler warning
Walkthroughs show full routes and endings by default. To hide spoilers according to play progress, you currently have to avoid lingering on pages for routes you haven't reached. The progress-aware GraphRAG approach is still at the proposal stage on the [roadmap](/guide/advanced/changelog).
:::

## Further Reading

- [What is vnweb](/guide/intro/what-is-vnweb) · [Installation & Configuration](/guide/intro/installation-and-configuration)
- [Characters, Quotes & Memories](/guide/feats/game-notes) · [Launching & Play History](/guide/feats/play-records)
- [Appearance & Themes](/guide/feats/custom-theme) · [AI Assistant & WebMCP](/guide/feats/ai-assistant)
- [API & Data Layer](/guide/advanced/api-and-data) · [FAQ](/guide/advanced/faq)
