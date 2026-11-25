# Command-Line Tools & Desktop Integration

Use the web UI for day-to-day management and the command line for quick launches. vnweb offers three entry points: `vnweb.bat` in the source directory, a Commander-based Node CLI (`cmd/tui.ts`), and the native `vnweb.exe` in the installer (written in Rust, which either starts the desktop app or forwards arguments to the CLI).

> The CLI reads and writes the same SQLite database directly, so you don't need to start the web service first—but it's best to close a running vnweb to avoid database write contention.

## Entry Points and Quick Launch

### Windows Batch Entry

Run `.\vnweb.bat` in the project directory:

- **No arguments**: start the already-built web service (port `8999` by default).
- **With arguments**: enter command-line mode and forward to the CLI.

If you used `init.bat` to add the project directory to your user `PATH`, you can use `vnweb` from any directory in a new terminal. See [Installation & Configuration](/guide/intro/installation-and-configuration) for running from source.

### Native Entry (Installer)

`vnweb.exe` in the installer behaves slightly differently:

| Invocation             | Behavior                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `vnweb` (no arguments) | If `vnweb-desktop.exe` is in the same directory, start the Tauri desktop app; otherwise run `standalone/server.js` |
| `vnweb <arguments>`    | Forward to `cli/vnweb-cli.mjs`                                                                                     |

It resolves directories in this order:

- `VNWEB_APP_DIR`: application directory (containing `standalone/server.js`).
- `VNWEB_DATA_DIR`: user data directory. When not set explicitly, portable installs use `user-data` under the install directory and normal Windows installs use `%APPDATA%\vnweb`.
- `VNWEB_NODE_PATH`: embedded Node runtime path, defaulting to `runtime/node.exe` under the install directory, then falling back to `node` on PATH.
- `PORT` / `HOSTNAME`: listen parameters when starting the service with no arguments, defaulting to `8999` / `0.0.0.0`.

## Command Reference

Commands are built with `commander`, the program name is `vnweb`, and `--help` and version info are built in.

```powershell
vnweb --help                       # show help and examples
vnweb list game                    # list all games (alias: list g)
vnweb list g -p 2 -s 10            # page 2, 10 per page
vnweb list collection              # list all collections (alias: list c)
vnweb open "Favorites"             # view games in a collection by name
vnweb open 3                       # view by collection ID
vnweb search "White Album"         # search by name keyword
vnweb search "Fate" -p 1 -s 5      # search with pagination
vnweb start 12                     # launch and track game ID 12 (alias: s)
vnweb s 12                          # same as above
vnweb start                         # launch the most recently played game
```

### Command Details

| Command                      | Arguments                                  | Options                                               | Description                                                       |
| ---------------------------- | ------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------- |
| `list game` / `list g`       | None                                       | `-p, --page`, default `1`; `-s, --size`, default `20` | List games in descending order of last played, total time, and ID |
| `list collection` / `list c` | None                                       | None                                                  | List collections in descending ID order                           |
| `search`                     | `<keyword...>`, space-separated            | `-p` / `-s`                                           | Fuzzy match against Chinese and original names                    |
| `open`                       | `<collection_name...>`, name or numeric ID | `-p` / `-s`                                           | List games in the specified collection                            |
| `start` / `s`                | `[game_id]`, optional                      | None                                                  | Launch a game and start tracking time                             |

### Output Notes

Table columns are `id`, title (Chinese name preferred), whether it's running, accumulated time (`HH:MM:SS`), and last played date. With no data, it shows "No games yet" or "No collections yet".

Pagination slices the query results; out-of-range page numbers are clamped to the valid range.

## Launch Games and Track Time

1. Find the game ID with `list game` or `search`.
2. In the web UI's **Game Detail → Settings**, confirm the executable path. The CLI requires an **absolute path** to an existing file; forward slashes in the path are normalized to Windows backslashes.
3. Run `vnweb start <ID>`. The program starts the process in `detached` mode and writes `isRunning = 1` and `lastLaunchedAt` to the `game_play` table.
4. The timing display refreshes the "Session time" every second. Press **`q`** to end and save the record (calls `finalizeGameSession`).
5. If a game is already being tracked, running the command again reports "timer already attached" instead of starting a second process.

::: danger Ctrl+C does not save the session
In the `start` command, `Ctrl+C` exits the process directly and **does not** call `finalizeGameSession`. Press `q` to save the current duration.
:::

If you omit the ID, the game with the most recent `lastLaunchedAt` is chosen. If nothing has ever been launched through vnweb, you'll be prompted to specify a game ID.

## Working with the Desktop App

The desktop app is a **Tauri v2** shell (`crates/vnweb-desktop`) embedding the standalone server and Node runtime. It provides:

- **Single-instance lock**: prevents multiple windows from opening.
- **System tray**: stays in the background for quick access.
- **Child process lifecycle management**: uses a Job Object on Windows to manage the server process.
- **Port allocation and readiness check**: starts `server.js` and verifies the service is available before showing the UI.
- **External links**: opened in the system default browser instead of navigating inside the app.
- **Native file dialogs**: Save As for backup ZIPs, timing XLSXs, and report PNGs; pickers for game executables and save directories.
- **Borderless / title bar integration**: custom window controls appear when **Native title bar** is off; see [Appearance & Themes](/guide/feats/custom-theme).

Related npm scripts:

| Script                     | Purpose                                                     |
| -------------------------- | ----------------------------------------------------------- |
| `npm run cli`              | Run the CLI via `tsx cmd/tui.ts`                            |
| `npm run build:cli`        | Build a standalone CLI bundle to `dist/cli/vnweb-cli.mjs`   |
| `npm run build:standalone` | Build a standalone server that runs without the source tree |
| `npm run tauri:dev`        | Start Tauri development mode                                |
| `npm run tauri:build`      | Prepare assets and build the desktop installer              |
| `npm run tauri:prepare`    | Only prepare Tauri embedded assets                          |

The desktop and web apps share the same data directory and settings files, so [backup and sync](/guide/feats/save-backup) settings apply to both.

## Troubleshooting

| Symptom                                         | Fix                                                                         |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| `vnweb` isn't recognized as a command           | Confirm you ran `init.bat`, then open a new terminal so `PATH` takes effect |
| CLI says "no exe path configured for this game" | Set the executable in the web UI first                                      |
| Error "exe path must be absolute"               | Use a full path such as `D:\Games\Game\game.exe`                            |
| Game launches but no timing starts              | Check that you ended with `q`; `Ctrl+C` mid-session doesn't save            |
| Database is locked                              | Close the web service and Drizzle Studio, then retry                        |
| Desktop port conflict                           | Check port allocation and whether a stray server process remains            |
| CLI entry missing from the installer            | Rebuild standalone assets or set `VNWEB_APP_DIR`                            |

## Further Reading

- [What is vnweb](/guide/intro/what-is-vnweb) · [Installation & Configuration](/guide/intro/installation-and-configuration)
- [Launching & Play History](/guide/feats/play-records) · [AI Assistant & WebMCP](/guide/feats/ai-assistant)
- [Architecture Overview](/guide/advanced/architecture) · [Contributing Guide](/guide/advanced/contributing)
- [FAQ](/guide/advanced/faq) · [Glossary](/guide/advanced/glossary)
