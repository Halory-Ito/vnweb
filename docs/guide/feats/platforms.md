# Platform Integration & Metadata

Scanning can create entries, but covers, synopses, characters, collections, and play status come from external platforms. This page explains what the five platforms are for, their fields, update strategies, and security boundaries. For the basics of building a library, see [Scanning & Game Library](/guide/feats/game-library); for media sources, see [PV & OST](/guide/feats/media).

## Configure Platforms

Open **Settings → Platforms**, enable the platforms you need, and fill in credentials as prompted. Querying public metadata, reading personal collections, and pushing play status may require different permissions; personal features require binding an account first.

![Game detail page showing the cover, playtime, and tabs for characters, OST, and records](/overview.png)

### Platform Overview

| Platform    | How to configure and what it's for                                                                                                                                                            | Account required?                       |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Steam       | Set a Steam Web API Key and bind your Steam account to import owned games and use "Sync playtime" on the account card. Reading your library requires the account to make game details public. | Yes, for library import / playtime sync |
| Bangumi     | Enter a personal access token as instructed. If you use a mirror, also check the selected API source. Once bound, you can read collections and push status.                                   | Yes, for collections / status push      |
| VNDB        | Bind an account with a VNDB token. Grant read-list or modify-list permissions according to what you need.                                                                                     | Yes, for list read / write              |
| YMGal       | Configure a Client ID and Client Secret to query YMGal metadata. To read account collections, bind a user ID as instructed.                                                                   | Yes, for collection read                |
| SteamGridDB | Set an API Key to supplement covers, backgrounds, icons, and logos.                                                                                                                           | Key only                                |

::: tip Keep public metadata and personal data separate
Looking up work information (title, synopsis, cover, characters) usually needs no account; only reading "My Collection" or pushing play status back to a platform requires authorization. Decide which credentials you actually need based on the feature, and avoid over-authorizing.
:::

### What the Config File Looks Like

Platform settings are saved to `data/settings/platform.json`; a sample lives at `data/example/platform.json`. The core fields:

```json
{
  "steam": { "apiKey": "" },
  "bangumi": {
    "useMirror": false,
    "mirrorUrl": "",
    "baseUrl": "",
    "tokenUrl": ""
  },
  "vndb": {
    "baseUrl": "https://api.vndb.org/kana",
    "oauthToken": "",
    "oauthScope": ""
  },
  "ymgal": {
    "baseUrl": "https://www.ymgal.games",
    "clientId": "",
    "clientSecret": ""
  },
  "steamgriddb": {
    "apiKey": "",
    "baseUrl": "https://www.steamgriddb.com/api/v2"
  },
  "meting": { "bitrate": 320, "coverSize": 300, "neteaseCookie": "" },
  "enhanced": {
    "useLocalSdk": false,
    "apiBase": "https://music.163.com/api",
    "musicU": "",
    "quality": "standard",
    "sdkPort": 3001
  }
}
```

::: danger Never publish this file
API keys, access tokens, `neteaseCookie`, and `musicU` are personal credentials. Don't commit them to a public repository, paste them into issues, or include them in screenshots; make sure backups are stored privately too.
:::

## Platform-by-Platform Details

### Steam

**Purpose**: import owned games, supplement work metadata, and start playtime sync from the Steam account card under **Settings → Platforms**.

**Configuration notes**:

- Enter your Steam Web API Key.
- Bind your Steam account before using personal features.
- Reading your library requires the account to make relevant game details public; if the library is empty, check your privacy settings first.

**Update strategy**: a library import is a one-time pull; imported entries can still be updated by name or platform ID. Playtime sync is best run manually at intervals—avoid triggering it repeatedly in a short period.

::: warning Privacy settings
Steam libraries and playtime are governed by account privacy settings. If vnweb can't read data, first confirm the account details are public as you intended, then check whether the Key is valid.
:::

### Bangumi

**Purpose**: read collections, fill in metadata per entry, and push play status back to Bangumi.

**Configuration notes**:

- Enter a personal access token as instructed, not an OAuth client configuration.
- When using a mirror, check the selected API source and token URL; `useMirror`, `mirrorUrl`, `baseUrl`, and `tokenUrl` must belong to the same service.
- Once bound, you can read collections and push status.

**Update strategy**: matching by entry ID is more reliable. Before pushing status, check the mapping between local statuses and Bangumi statuses; see [Sync Play Status](#sync-play-status) below.

### VNDB

**Purpose**: query visual novel metadata, characters, and covers; read/modify your list; and push play status.

**Configuration notes**:

- Bind an account with a VNDB token.
- Grant read-list or modify-list permissions as needed; you don't need write access just to query public metadata.
- `baseUrl` defaults to `https://api.vndb.org/kana` and can be adjusted as needed.

**Update strategy**: matching by platform ID is more accurate than searching by name; when a work has several VNDB records, cross-check the release date and developer.

::: warning Token permissions
Writing status requires the matching permission. If a push fails, confirm the token's scope covers the operation, then retry.
:::

### YMGal

**Purpose**: query YMGal (Yuemu) metadata and covers; bind a user to read account collections.

**Configuration notes**:

- Configure `clientId` and `clientSecret` for metadata queries.
- To read account collections, bind a user ID as instructed.
- `baseUrl` defaults to `https://www.ymgal.games`.

**Update strategy**: like VNDB, prefer linking by platform entry ID; verify versions in the results so information from different editions doesn't get mixed together.

### SteamGridDB

**Purpose**: supplement covers, backgrounds, icons, and logos.

**Configuration notes**: only an API Key is needed; `baseUrl` defaults to `https://www.steamgriddb.com/api/v2`.

**Update strategy**: images are derived data that can be fetched repeatedly. For entries where you've manually replaced a cover or background, check whether you want to overwrite it before updating.

### OST Sources: Meting and Enhanced API

Strictly speaking these aren't "metadata platforms", but they live in the platform settings and are covered here together. The `meting` config controls bitrate, cover size, and the NetEase Cloud cookie; the `enhanced` config controls local SDK invocation, API base, `musicU`, audio quality, and port. Field details are in [PV & OST → Import and Play OST](/guide/feats/media#import-and-play-ost).

## Import Collections and Update Metadata

1. To add platform collections to your local library, open **Game Library → Add menu → Import from Third Party**, pick a source, and check the games to import.
2. To fill in metadata for an existing entry, choose **Update Metadata** in the game's right-click menu and search by name or platform ID. Verify the version and name before applying the result.
3. To maintain images individually, match a platform entry, or change the executable path, open **Settings** on the game detail page. After importing a third-party entry, verify the executable path here if you want to launch a locally installed copy.

::: tip Import vs. update
**Import** solves "it's not in the library yet"; **update** solves "it's in the library but the metadata is incomplete". Both can change covers and metadata, but neither fills in the executable path for you.
:::

For bulk maintenance across several games, go back to [Scanning & Game Library → Organize the Game Library](/guide/feats/game-library#organize-the-game-library) and use the bulk actions; for launch settings after an import, see [Launching & Play History](/guide/feats/play-records#launch-the-game-and-start-tracking).

## Sync Play Status

Bind Bangumi or VNDB under **Settings → Platforms**, then check the mapping between local and platform statuses. Edit the play status on a game detail page, select or confirm the entry through the corresponding platform entry point, and save. Steam playtime sync is started from the Steam account card under **Settings → Platforms**.

### How Status Mapping Works

Local play statuses (such as "Want to Play", "Playing", "Completed", "On Hold") don't necessarily map one-to-one to a platform's status set. The project supports **many-to-one mapping** in the platform's settings area: several local statuses can map to a single platform status.

```text
Local status → platform status mapping → platform entry → push result
```

::: warning Associate the entry before pushing
Before a push, associate the platform entry on the game detail page via search or by entering an ID. Without an association, the platform doesn't know which work you mean.
:::

### Reading Push Results

Association and push records are persisted per game, so you can check whether a particular status has been synced. Appearance settings let you customize the indicator colors for the four push statuses; the exact look depends on the current version's UI.

## Rate Limits and Failure Handling

External platforms usually have rate limits or temporary outages. These practices are safest:

1. **Small batch first, then larger**: update one game to confirm credentials and matching rules work before processing multiple entries.
2. **Retry later on failure**: when a platform read fails, the UI usually shows an error and a retry option; don't click repeatedly at high frequency.
3. **Stagger platforms**: limits are independent per platform—a failed Steam sync doesn't affect a Bangumi metadata update.
4. **Keep the original config**: if config loading fails, don't delete the file outright; check the JSON syntax and field types first. The project validates field types and port ranges.
5. **Verify the API source**: when Bangumi uses a mirror, `baseUrl` and the token URL must agree; when querying YMGal, confirm `baseUrl` points to the site you actually use.

::: danger Don't share credentials
Don't lend your keys, tokens, or cookies to others, or save them on a public machine. When collaborating, have each person request their own credentials.
:::

## Account and Cookie Safety

- Platform credentials are stored locally in `data/settings/platform.json`; treat it as a private file.
- NetEase Cloud `neteaseCookie` / `musicU` are equivalent to account access—if leaked, invalidate them on the platform promptly.
- Redact screenshots when troubleshooting: cover keys, tokens, cookies, usernames, and user IDs.
- When backing up settings files, make sure the destination (including WebDAV / S3 remotes) is private storage; see [Backup, Restore & Sync](/guide/feats/save-backup).
- If you stop using a platform, clear its credentials to reduce exposure.

## FAQ

### Config becomes invalid right after saving

Platform config may be read from the browser cache first. Refresh the page after saving and check again; if it's still wrong, inspect the field types in `data/settings/platform.json`.

### No entries found

First confirm the platform is enabled and the credentials are valid; then try searching by platform ID instead of name. Names containing Chinese, Japanese, or bracketed edition text can give unstable results.

### Library or collection is empty

Check account privacy settings and authorization scope; for Bangumi mirrors, check that `baseUrl` and `tokenUrl` point to the same source.

### Status push fails

Confirm the token has write permission, the platform entry is associated, and the mapping is as expected. See [Sync Play Status](#sync-play-status).

### Image updates overwrote my cover

Updating metadata writes to image fields. If you've manually replaced a cover, confirm the overwrite first—or set it again after updating.

## Summary

- Public metadata lookups usually need no account; personal collections and status pushes do.
- Steam handles library and playtime, Bangumi / VNDB handle collections and status, YMGal handles Yuemu metadata, and SteamGridDB handles images.
- Prefer platform IDs for matching; validate on a small batch before bulk updates.
- Credentials are personal data—redact them in backups and screenshots.

Next: [Launching & Play History](/guide/feats/play-records), [PV & OST](/guide/feats/media), [Scanning & Game Library](/guide/feats/game-library). To learn how providers are implemented, read [Platform Integrations & WebMCP](/guide/advanced/platform-integrations).
