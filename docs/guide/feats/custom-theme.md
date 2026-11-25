# Appearance & Themes

vnweb's appearance system has three layers: **layout and interaction** (sidebar, borders, title bar, cards), **font and background** (global font, wallpaper, frosted glass), and **theme variables** (shadcn/ui-style CSS variables). All settings are saved in `data/settings/appearance.json`, with a sample template at `data/example/appearance.json`; custom themes live in `custom.css`, and both are included in backups.

> Before changing appearance, it's worth reading the project's shared [design guidelines](/guide/advanced/contributing), which define the font-size scale, responsive breakpoints, and component constraints.

## Settings at a Glance

| Group             | Key items                                                                              | Default                                           |
| ----------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `layout`          | Hide sidebar / top bar, borderless, native title bar, library layout, grouping, radius | Borderless on, mixed layout, grouped by developer |
| `font`            | Font file, size, weight                                                                | 16px / 400                                        |
| `background`      | Custom background (PC / mobile), transition effect                                     | On, center-fade, 420ms                            |
| `glass`           | Frosted-glass blur and opacity                                                         | blur 4px / opacity 80%                            |
| `chart` / `guide` | Chart primary color, walkthrough step-type colors                                      | Chart `#e84479`                                   |
| `status`          | Play-status names and indicator colors                                                 | Four push statuses are customizable               |
| `emptyState`      | Empty-state kaomoji or image                                                           | `(´・ω・\`)`                                      |
| `startup`         | Startup animation (image / video, duration, skip method)                               | Off by default                                    |

## Adjust Layout, Font, and Background

Go to **Settings → Appearance** to adjust the following.

### Layout and Borders

- **Hide sidebar / top bar**: collapse global navigation elements as needed to give content more room.
- **Borderless**: controls how component borders appear. In-app component borders should follow this switch; when on, the overall look is cleaner. On by default.
- **Native title bar**: desktop (Tauri) only. With the native title bar off, the global header supports dragging and double-click to maximize, with custom minimize / maximize (restore) / close buttons on the right.
- **Game library layout**: folder, list, grid, and mixed; you can set grid presentation, group by developer, card title visibility, and corner radius.
- **Folder color palette**: cycling and random color selection, with action buttons right-aligned.

::: tip Packaged build vs. source build
Native title bar settings only affect desktop window decoration; in a browser, the browser controls the window.
:::

### Font

- You can pick a locally installed font. On Windows, the system font list is read.
- **Global font size** and **weight** can be adjusted; saving requires the user to confirm before it takes effect.
- The global font is driven uniformly by the CSS variable `--app-font-family`:

  ```css
  :root {
    --app-font-family: 'Your Font', serif;
  }
  ```

::: warning Don't specify font families in components
The project's guidelines require components not to distinguish fonts with `font-mono` / `font-sans` / `font-serif` classes; use `--app-font-family` throughout. Exceptions: paths, domains, numbers, and code may use `font-mono` per the design guidelines, and the font preview area may show actual fonts.
:::

### Background and Frosted Glass

- With a custom background enabled, you can choose or upload separate images for **light mode, dark mode, and mobile**.
- Transition effects include `center-fade` and others, with adjustable duration (420ms by default).
- The frosted-glass parameters `glass.blur` (4px by default) and `glass.opacity` (80% by default) control the blur and opacity of interface overlays.
- Background and appearance sync triggers are render-isolated, so switching settings tabs doesn't cause a border flicker.

### Startup Animation (Desktop)

**Appearance → Startup Animation** supports both image and video modes, each with its own config and files:

| Option                 | Description                                               |
| ---------------------- | --------------------------------------------------------- |
| `enabled`              | Whether the startup animation is enabled                  |
| `activeType`           | `image` or `video`                                        |
| `durationMs`           | How long the image is shown (2000ms by default)           |
| `skippable`            | Whether it can be skipped                                 |
| `muted`                | Whether the video plays muted                             |
| `matchMediaWindowSize` | Scale the startup window safely to the asset's resolution |

Skipping is **double-click the screen or press Esc**—there's no on-screen skip button. Both images and videos can be renamed before or after upload, and both fill the startup window completely.

## Use a Custom Theme

Go to **Settings → Theme**, enter theme variables in the CSS editor, and save to see the effect. The format follows shadcn/ui conventions:

```css
:root {
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.2 0 0);
  --primary: oklch(0.55 0.2 280);
  --primary-foreground: oklch(0.98 0 0);
  --border: oklch(0.9 0 0);
  --radius: 0.5rem;
}

.dark {
  --background: oklch(0.16 0 0);
  --foreground: oklch(0.95 0 0);
  /* dark mode variables */
}
```

- `:root` defines light mode; `.dark` defines dark mode.
- The theme editor accepts shadcn/ui-format variables.
- To keep a default style set in source control, edit the project's `app/custom.css`. When the app directory and data directory are separated (for example a Tauri packaged build), the runtime reads `custom.css` from the data directory, so the source file doesn't directly affect an installed app.

Recommended tools:

- [tweakcn Theme Editor](https://tweakcn.com/)
- [shadcn/ui theme examples](https://ui.jln.dev/)

::: danger Risks of custom CSS
The theme editor accepts arbitrary CSS, and a bad rule can make the interface unreadable. Back up `custom.css` first (it's saved along with [backups](/guide/feats/save-backup)); if you break it, restore that file from the backup.
:::

## Design Guidelines Quick Reference

When adding or modifying a page, follow the conventions in `DESIGN.md`:

| Scenario             | Guideline                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Page title           | Regular pages don't re-render a top-level `<h1>`; navigation's active state and the browser tab provide orientation |
| Section title        | `text-lg sm:text-xl font-semibold tracking-tight`                                                                   |
| Body text            | `text-sm leading-relaxed`                                                                                           |
| Supporting info      | `text-xs text-muted-foreground`                                                                                     |
| Numbers              | Rankings, percentages, durations, etc. must use `tabular-nums`                                                      |
| Long-text truncation | Parent container `min-w-0`; text uses `truncate` / `line-clamp-2`, avoiding fixed pixel widths                      |
| Components           | Prefer existing shadcn/ui components, prefer outlined style, avoid cards nested in cards                            |
| Responsiveness       | Check narrow-screen layout and style consistency on every change                                                    |

A single component file must not exceed 200 lines; above 150 lines, consider splitting into child components, and extract business logic into custom hooks.

## Troubleshooting

| Symptom                                         | Fix                                                                                           |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Font change has no effect                       | Confirm it was applied in the confirmation dialog and wait for settings to be written to disk |
| Custom background doesn't show on mobile        | Mobile background is a separate option and needs its own upload                               |
| Some colors don't change after saving the theme | Check whether you only wrote `:root` and forgot `.dark`, or misspelled a variable             |
| The border switch seems ineffective             | Refresh to confirm; some component borders are controlled globally by the borderless switch   |
| Custom window buttons aren't visible on desktop | They only appear when **Native title bar** is off                                             |
| Startup animation doesn't play                  | Check `enabled` and that the media file was uploaded; in video mode, confirm the file exists  |
| Page overflows on narrow screens                | Check for a missing `min-w-0` or a hard-coded fixed width                                     |

## Further Reading

- [What is vnweb](/guide/intro/what-is-vnweb) · [Installation & Configuration](/guide/intro/installation-and-configuration)
- [Walkthroughs & Route Progress](/guide/feats/walkthroughs) · [Backup, Restore & Sync](/guide/feats/save-backup)
- [Architecture Overview](/guide/advanced/architecture) · [Contributing Guide](/guide/advanced/contributing)
- [FAQ](/guide/advanced/faq) · [Glossary](/guide/advanced/glossary)
