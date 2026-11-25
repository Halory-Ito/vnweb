# Installation and Configuration

This page gets vnweb running. Once it's installed, follow [Quick Start](/guide/intro/quick-start) for a full walkthrough; to learn what the project is first, see [What Is vnweb](/guide/intro/what-is-vnweb).

## Requirements

Prepare **Node.js 20.9 or newer** and npm. `init.bat` explicitly checks the version and exits with an error if it's below 20.9.

```bash
node -v    # v20.9+ recommended
npm -v
```

Windows is the recommended platform: local directory scanning, executable launching, process timing, system fonts, and native dialogs all depend on the machine running vnweb having direct access to files and processes. Other platforms can start the web service from source, but anything involving executables or system fonts may behave differently.

::: tip You Don't Need to Set Up a Database Server
vnweb uses SQLite (libSQL); the default database file is `local.db` in the project directory. No separate MySQL or PostgreSQL installation is required.
:::

## Method 1: One-Click Initialization on Windows

1. Clone the repository or download the source.
2. Double-click `init.bat` in the project root. It installs dependencies, fills in missing settings, initializes the database, builds the app, and adds the project directory to the user's `PATH`.
3. In a new terminal, run `vnweb`, then open `http://localhost:8999` in your browser.

### What the Script Actually Does in Six Steps

| Step | Action                                                                                  | Common cause of failure                                      |
| ---- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1/6  | Check Node.js, npm, and their versions                                                  | Node.js not installed, or version below 20.9                 |
| 2/6  | `npm install` to install dependencies                                                   | Network or npm registry configuration issue                  |
| 3/6  | `node --import tsx cmd/init-settings.ts` to fill in missing config from `data/example/` | Config file format broken by manual edits                    |
| 4/6  | Back up the existing database and run `npm run db:migrate`                              | Database locked by vnweb / Drizzle Studio                    |
| 5/6  | `npm run build` to build the production version                                         | TypeScript / build errors—see the log above                  |
| 6/6  | Write the project directory into the user's `PATH`                                      | Insufficient permissions; skip with `VNWEB_INIT_SKIP_PATH=1` |

::: warning When a Database Already Exists
`init.bat` moves an existing database and its sidecar files (`-wal` / `-shm` / `-journal`) to `backups/db/`, then creates an empty one. If you already have a game library, close vnweb and Drizzle Studio first and keep a separate backup before updating.
:::

If you don't want to modify user environment variables, set `VNWEB_INIT_SKIP_PATH=1` before running; if you don't want the script to pause at the end, set `VNWEB_INIT_NO_PAUSE=1`.

```bat
set VNWEB_INIT_SKIP_PATH=1
init.bat
```

## Method 2: Manual Installation

For when you want to see every step, or you're running from source on a non-Windows platform.

```bash
git clone https://github.com/Halory-Ito/vnweb.git
cd vnweb
npm install
npm run db:push
```

Build and start it locally; the default address is `http://localhost:8999`.

```bash
npm run build
npm run start        # next start -p 8999 --hostname 0.0.0.0
```

To run in development mode, use `npm run dev`; the default address is `http://localhost:3000`.

```bash
npm run dev          # http://localhost:3000
```

::: tip Development or Production?
Development mode picks up changes immediately on port 3000—good for debugging. Production mode needs a build first, runs on port 8999, and listens on `0.0.0.0`—good for long-term use and LAN access.
:::

### Database Commands

| Command               | What it does                                                    |
| --------------------- | --------------------------------------------------------------- |
| `npm run db:push`     | Sync `db/schema.ts` to the database (common for first install)  |
| `npm run db:init`     | Another entry point for `drizzle-kit push`                      |
| `npm run db:migrate`  | Run migrations; `init.bat` uses it to initialize a new database |
| `npm run db:generate` | Generate migration files from the schema                        |
| `npm run db:studio`   | Open Drizzle Studio at `127.0.0.1:5123`                         |

::: danger Don't Run Multiple Database-Writing Processes at Once
`npm run db:studio`, the dev/start server, and the command-line tool can all open the same SQLite file. Close them all before migrating or rebuilding, or you may hit file locks or write conflicts.
:::

## Method 3: Tauri Desktop App

The project includes a desktop shell based on **Tauri v2** and a native CLI entry point written in Rust. Windows x64 users can download the `*_x64-setup.exe` installer from the project Releases; the installer maintains the user's `PATH`.

Scripts provided in the repo:

| Command                 | What it does                                    |
| ----------------------- | ----------------------------------------------- |
| `npm run tauri:prepare` | Stage the standalone server and CLI resources   |
| `npm run tauri:dev`     | Desktop development mode                        |
| `npm run tauri`         | Run a Tauri command through the script          |
| `npm run tauri:build`   | Stage resources and build the desktop installer |

The desktop app has a single-instance lock, a system tray, and child-process lifecycle management, and uses native dialogs when picking executables and save directories. Exporting backup ZIPs, timing XLSX files, and report poster PNGs also goes through native Save As dialogs.

::: tip Desktop and Web Data
By default the desktop app uses a shared user data directory. Both server start and CLI start fill in missing config and run database migrations automatically, so they can take over an existing `local.db` or create a fresh one. Config paths are centralized through `VNWEB_APP_DIR` / `VNWEB_DATA_DIR`; see "Directory Structure" below.
:::

## Deployment and Standalone Package

### About Docker

::: warning No Official Dockerfile Yet
The repo **does not provide a Dockerfile or docker-compose file**. If you want to containerize it, you'll need to write your own image that installs Node.js 20.9+, copies the source, runs `npm install`, `npm run db:migrate`, and `npm run build`, then uses `npm run start` as the entry point. Mount the user data directory and database file for persistence.
:::

An easier self-hosting route is the standalone build included with the project:

```bash
npm run build:standalone   # Build a server and CLI that run without the source tree
npm run build:cli          # Build the command-line tool only
```

`build:standalone` gathers the server entry `server.js`, static assets, `data/example`, migration files, and the CLI under `.next/standalone/`, and generates `vnweb-portable.bat`. The portable launcher supports these environment variables:

| Variable         | Default                           | Description                             |
| ---------------- | --------------------------------- | --------------------------------------- |
| `VNWEB_APP_DIR`  | Directory containing the launcher | Application resource directory          |
| `VNWEB_DATA_DIR` | `<app dir>/user-data`             | User data directory                     |
| `PORT`           | `8999`                            | Listening port                          |
| `HOSTNAME`       | `0.0.0.0`                         | Listening address                       |
| `VNWEB_DB_URL`   | `dbFileName` from `general.json`  | Database URL; overrides the config file |

The production service listens on `0.0.0.0:8999` by default. If you expose it to the public internet, put a reverse proxy with authentication and HTTPS in front of it—don't expose a service holding credentials directly.

## Database and Directory Structure

### Key Paths

| Path                                                         | Contents                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| `local.db`                                                   | Default SQLite database (project root)                             |
| `data/settings/`                                             | The settings actually in effect                                    |
| `data/example/`                                              | Commit-ready setting examples; missing files are filled in at init |
| `data/services/`                                             | Service-side data directory (if present)                           |
| `assets/`                                                    | Local assets such as images and fonts                              |
| `drizzle/`                                                   | Migration files                                                    |
| `backups/db/`                                                | Database backups made before one-click initialization              |
| `app/custom.css`, or `custom.css` in the user data directory | Custom styles                                                      |

The database path is determined by `VNWEB_DB_URL` or the `dbFileName` in `data/settings/general.json`, defaulting to `file:./local.db`. After changing it, restart the app for the change to take effect.

```json
// data/settings/general.json
{
  "dbFileName": "file:./local.db",
  "agent": { "configs": [], "activeConfigId": "" },
  "goals": { "dailyPlayMinutes": 60, "yearlyCompletedGames": 12 }
}
```

::: warning Change Config Before Initializing
If you want a non-default database path, edit `dbFileName` in `data/settings/general.json` before initializing. An already running app needs a restart to pick up the new config.
:::

## First-Run Setup

vnweb doesn't force a step-by-step popup wizard, but after the first launch it's worth configuring things in this order:

1. **Confirm the UI opens**: `http://localhost:3000` in development, `http://localhost:8999` in production.
2. **Register game directories**: open Scan, add scan directories, and choose a mode; see [Scanning and Game Library](/guide/feats/game-library).
3. **Configure platform credentials**: as needed, fill in Steam, Bangumi, VNDB, YMGal, SteamGridDB, plus the Meting / Enhanced API settings for OSTs under Settings → Platforms; see [Platform Integrations and Metadata Updates](/guide/feats/platforms).
4. **Set executable paths**: confirm the path in a game's detail Settings, then you can [launch and track time](/guide/feats/play-records).
5. **Tune appearance and backups**: set fonts, backgrounds, and borders to your taste; for backup strategy see [Backup, Restore, and Sync](/guide/feats/save-backup).
6. **Run through the whole flow**: [Quick Start](/guide/intro/quick-start) turns the steps above into a five-minute path.

Platform config fields and their purposes (`data/example/platform.json`):

| Group         | Key fields                                               | Purpose                                         |
| ------------- | -------------------------------------------------------- | ----------------------------------------------- |
| `steam`       | `apiKey`                                                 | Steam Web API key, for library and playtime     |
| `bangumi`     | `useMirror`, `mirrorUrl`, `baseUrl`, `tokenUrl`          | Personal token and mirror API sources           |
| `vndb`        | `baseUrl`, `oauthToken`, `oauthScope`, etc.              | VNDB account and list permissions               |
| `ymgal`       | `baseUrl`, `clientId`, `clientSecret`, etc.              | YMGal metadata and user collection              |
| `steamgriddb` | `apiKey`, `baseUrl`                                      | Covers, backgrounds, icons, logos               |
| `meting`      | `bitrate`, `coverSize`, `neteaseCookie`                  | OST bitrate, cover art, and NetEase credentials |
| `enhanced`    | `useLocalSdk`, `apiBase`, `musicU`, `quality`, `sdkPort` | Enhanced API playback method                    |

::: danger Credential Safety
Never put API keys, tokens, or cookies in public files, screenshots, or issues. Platform settings are saved to `data/settings/platform.json`—manage it with local file permissions, and redact values before troubleshooting.
:::

## Common Installation Issues

### Port Already in Use

The production port defaults to `8999`. If it's taken, change the `-p` argument in the `start` script in `package.json`, or use the portable launcher's `PORT` environment variable, then visit the new port.

### `init.bat` Reports a Database Backup Failure

Usually vnweb or Drizzle Studio still holds the database file. Close those processes and retry; if the original database wasn't deleted, it stays in `backups/db/`.

### Dependency Installation Fails

Check your network or npm registry configuration, then rerun `npm install`. If step 2 fails, `init.bat` stops immediately and won't continue to database initialization.

### Build Fails

Read the specific log above `npm run build`. Common causes are a Node.js version below 20.9 or a local change that introduced a type error. You can run `npm run lint` and `npm run fmt:check` first to narrow it down.

### The Page Opens but Games Won't Launch

This is a configuration issue, not an installation one: check that the game's executable path is an **absolute path on this machine** and that the file still exists. See [Launch and Play Records](/guide/feats/play-records) and [Command-Line Tool](/guide/feats/other).

### Config Changes Don't Take Effect

Database paths, platform credentials, and the like are read by the server; after editing `data/settings/`, restart the app. Platform settings may be read from the browser cache first—refresh the page if needed.

## Summary

- Recommended path: double-click `init.bat` → run `vnweb` → open `http://localhost:8999`.
- Manual path: `npm install` → `npm run db:push` → `npm run dev`, or `npm run build && npm run start`.
- The desktop app and standalone package are available; Docker requires your own image.
- Once installed, head straight to [Quick Start](/guide/intro/quick-start); for problems see the [FAQ](/guide/advanced/faq).
