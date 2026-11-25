# Backup, Restore & Sync

vnweb splits this set of capabilities into two categories:

- **Game save backups**: copies the save directories each game actually writes to disk, triggered automatically by vnweb when the game exits.
- **App data backup / sync**: saves vnweb's own database, settings files, and local assets, with local backups, ZIP import/export, and sync to WebDAV or S3-compatible object storage.

The main entries are under **Settings → Backup**; sync server configuration is under **Settings → Sync**. The two kinds of data don't substitute for each other: even with remote sync enabled, it's a good idea to enable game save backups separately.

> Before you begin, complete [Installation & Configuration](/guide/intro/installation-and-configuration) and add games; see [Scanning & Game Library](/guide/feats/game-library).

## What Gets Backed Up

App data backups are selected by category. By default, the database, settings files, game saves, and all image types are checked; video, audio, and fonts are unchecked.

| Category                    | Default | Description                                                   |
| --------------------------- | ------- | ------------------------------------------------------------- |
| Database                    | Always  | `local.db` (or the database file specified in `general.json`) |
| Settings files              | Always  | `data/settings/*` and `custom.css`                            |
| Game saves                  | On      | The directory each game's `saveDir` points to                 |
| Images · Game covers        | On      | `cover`                                                       |
| Images · OST covers         | On      | `ost`                                                         |
| Images · Game backgrounds   | On      | `bg`                                                          |
| Images · Custom backgrounds | On      | `bg/custom`                                                   |
| Images · Character sprites  | On      | `characters`                                                  |
| Images · Game CGs           | On      | `cg`                                                          |
| Images · Game icons         | On      | `icon`                                                        |
| Images · Game logos         | On      | `logo`                                                        |
| Images · Brand icons        | On      | Folder logos (`brands`, with legacy directories supported)    |
| Images · Memory images      | On      | `memory`                                                      |
| Images · Other images       | On      | Uncategorized images                                          |
| Video                       | Off     | `.ogg` and similar files under `pv`                           |
| Audio                       | Off     | OST audio and `.lrc` lyrics                                   |
| Fonts                       | Off     | Local font files                                              |

There are 11 image subcategories, expanded by default in settings. Categories are controlled consistently across backup settings, the pre-upload statistics panel, local backups, ZIP export/import, and remote sync.

## Automatic Game Save Backups

1. Under **Settings → Backup → Game Saves**, enable **Enable game save backups**, choose where backups are stored, and save.
2. Open **Game Detail → Settings** for the game to back up and point **Save Path** at the directory the game actually writes saves to—for example `UserData` under the game folder. This path is stored in `game_info.saveDir`.
3. [Launch the game](/guide/feats/play-records) through vnweb and exit normally, then confirm a backup for that game was created in the backup directory.

::: tip Where to put the backup directory
If you're worried about the game's disk failing, put the backup directory on a different physical disk. On desktop, a native folder picker is available for choosing executables and save directories.
:::

## Local Backup and Restore

### Back Up Now

1. Under **Backup Contents**, check the categories to include.
2. Under **Local Backup**, click **Back Up Now**.
3. To save the backup elsewhere, use **Export ZIP**; if you need editable tabular data, use **Export XLSX**.

Each backup entry shows a date, making it easy to find the state from a particular point in time.

### Restore and Import

1. Select the matching entry in the backup list and click **Restore**.
2. To migrate an existing ZIP file, use **Import Backup** and select the archive.
3. After restoring, reopen the application and check that the library, walkthroughs, and settings are as expected.

::: danger Restore replaces current data
Restore and import don't merge—they replace current data with the backup's contents. Before running one, verify the backup date and data categories; to keep current data, save another ZIP first.
:::

Under the hood, asset-directory restore first copies files about to be overwritten to `${directory}.bak`, then writes the files from the backup; settings restore likewise creates `data/settings.bak`. Settings filenames are also whitelist-validated: names containing `.`, `..`, path separators, a leading `.`, or ending in `.bak` / `.tmp` are rejected so an archive can't write to unexpected paths.

## Sync via WebDAV or S3

### Add a Sync Server

Add a configuration under **Sync Servers** and fill in the fields as prompted:

| Protocol                     | Fields                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| WebDAV                       | `server`, `username`, `password`, `remotePath`                                                   |
| S3-compatible object storage | `endpoint`, `bucket`, `region`, `accessKeyId`, `secretAccessKey`, `forcePathStyle`, `remotePath` |

`remotePath` defaults to `/vnweb-backup`. A shared `SyncClient` interface hides the differences between the two protocols, providing connection testing, directory listing, file and directory upload/download, progress callbacks, and more.

### Upload

1. Under **Sync Servers**, confirm the config is enabled and the connection test passed.
2. Open the **pre-upload statistics panel** and check the selected categories, file counts, sizes, and proportions. The panel doesn't list individual filenames, so sensitive paths won't appear in screenshots.
3. Confirm and upload. The remote side first packages everything into `backup.zip`, then generates a `backup-meta.json` date file.
4. The upload shows a progress bar and percentage by category, without a per-file flood of updates.

::: warning Make sure the database is available
The pre-upload statistics check that the database file exists. If the database is missing or the path is abnormal, the panel shows a blocking reason and the upload can't proceed.
:::

### Download and Conflict Handling

1. Configure the same sync location on the other device.
2. Open the download preview; the UI detects the remote backup date and shows a statistics confirmation panel.
3. Check the contents and confirm the pull. Downloads support archive extraction and older uncompressed backups, with a live progress bar throughout.

Conflict rules:

- Before a pull, local files about to be overwritten are backed up as `.bak`, then replaced with the remote contents.
- The database is replaced as a whole, never merged row by row. When both ends have changed data, **the side that pulls later overwrites its own local data**.
- If the target device has game save backups turned off, the pull skips the game saves category.
- Multi-device recommendation: designate one main device to upload, have the others only pull, and save a local ZIP before pulling.

## Security and Encryption Notes

::: danger Credentials and privacy
Account passwords and S3 access keys in sync configs are sensitive and stored in local configuration. Don't publish screenshots or config files that include these fields.
:::

- vnweb doesn't provide end-to-end encryption for backup archives. Transport security depends on whether your WebDAV / S3 service has TLS enabled; object storage can enable server-side encryption (SSE).
- If backups contain game saves, quote excerpts, or memory bodies, use encrypted remote storage or an encrypted container.
- Prefer a dedicated remote directory rather than sharing a root folder with other applications.
- Before restoring a ZIP from someone else, confirm the source is trustworthy. Restore whitelists settings filenames, but database contents themselves can't be verified for origin.

## Troubleshooting

| Symptom                                             | Fix                                                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| No save backup was created after the game exited    | Check the master switch, backup directory permissions, and the game's `saveDir`           |
| Statistics panel says "database file doesn't exist" | Check `dbFileName` in `data/settings/general.json` against the actual file                |
| WebDAV connection test fails                        | Verify the server address, credentials, and remote directory permissions                  |
| S3 upload returns 403                               | Check the access key, bucket, region, and `forcePathStyle` setting                        |
| Upload progress bar stalls                          | Check the network and object-storage rate limits; trim image categories for large backups |
| Download reports an incompatible format             | Confirm the remote is `backup.zip` or an older uncompressed backup; re-upload once        |
| Settings are missing after restore                  | Check whether settings files were selected; look at `data/settings.bak`                   |
| The two ends overwrite each other                   | Re-sync with the "single main device uploads" strategy and export a ZIP before pulling    |

## Further Reading

- [What is vnweb](/guide/intro/what-is-vnweb) · [Installation & Configuration](/guide/intro/installation-and-configuration)
- [Launching & Play History](/guide/feats/play-records) · [Appearance & Themes](/guide/feats/custom-theme)
- [Architecture Overview](/guide/advanced/architecture) · [API & Data Layer](/guide/advanced/api-and-data)
- [FAQ](/guide/advanced/faq) · [Glossary](/guide/advanced/glossary)
