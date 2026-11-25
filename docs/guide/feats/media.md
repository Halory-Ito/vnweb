# PV & OST

**PV** and **OST** in the top bar let you browse media across the whole library; the same-named tabs on a game detail page show only the items associated with that game. Both are "content attached to a game": you first need an entry in the [game library](/guide/feats/game-library), then hang videos and music off it.

## Add and Play PV

1. Open the add form under **PV**, select the game it belongs to, and enter a PV name.
2. Paste a video link, or enable **Upload local video** and choose a file. Supported links include Bilibili, YouTube, direct video URLs, and HLS addresses.
3. After saving, click the entry to play. If it won't play in-app, open the original link from the player.

<!-- Screenshot placeholder: PV page showing a grid of PV cards and the player dialog -->

### Supported URL Types

| Source       | Example                                                    | How it plays                             |
| ------------ | ---------------------------------------------------------- | ---------------------------------------- |
| Bilibili     | Video page links, short share links, embedded player links | Resolved into an embedded player         |
| YouTube      | `watch?v=...`, `shorts/...`                                | Resolved into an embedded player         |
| Direct video | URLs ending in `.mp4` or `.webm`                           | Played directly                          |
| HLS / stream | URLs ending in `.m3u8`, `.mpd`, `.ism`, etc.               | Handled by the player as streaming media |
| Local file   | Enable **Upload local video**, then choose a file          | Uploaded and served by vnweb             |

Bilibili short share links are resolved first and then converted to an embeddable address, so you can paste either a full video page URL or a common share link.

::: tip Which method to choose

- For public videos, prefer a link—it saves space and follows updates at the source.
- If the source may be taken down or require login, **Upload local video** is more reliable.
- For looping a trailer as a background, HLS or a direct URL is usually smoother.
  :::

### Metadata and Organization

PV entries can hold a name and supplementary notes, and are grouped by their game. Give media titles clear language and edition labels—for example "PV1 Chinese Dub" or "Full OP"—so multiple videos for one work don't get confused.

Filter by game on the global **PV** page; the **PV** tab on a game detail page shows only that game. To delete one, go to the corresponding management entry and confirm.

### What to Do When Playback Fails

1. Click **Open original link** first and confirm the video plays at the source.
2. If Bilibili / YouTube embedding fails, check whether your browser restricts third-party embeds.
3. For a direct URL, check whether it has expired or needs authentication / hotlink protection.
4. If a locally uploaded file still fails, confirm it hasn't been moved or cleaned up; see the local asset notes under [Records → Data](/guide/feats/play-records).
5. On a corporate or campus network, video domains may be blocked by the gateway—try another network.

## Import and Play OST

1. Open **OST**, click **Add OST**, and select the associated game.
2. Use **Search albums by keyword** to find a NetEase Cloud Music album, or **Album ID** to read a known one. Verify the edition, then save the album to add.
3. To arrange tracks manually, open the album detail and use **Add Song** to enter a title and audio URL. You can specify a `.lrc` lyric file path or paste lyric text directly.
4. Click a track to start playback. The global player supports playback modes, the queue, and full-screen lyrics.

<!-- Screenshot placeholder: OST shelf page showing album covers, source labels, and the global player -->

### Album Sources

| Source              | How to import                                     | Best for                                                      |
| ------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| NetEase Cloud Music | Search by album keyword or enter a known album ID | Chinese-language OSTs, doujin music, a common everyday source |
| Meting SDK          | Read through the SDK config in platform settings  | Decoupling from the NetEase API, custom playback bitrate      |
| Enhanced API        | Configure `apiBase`, `musicU`, quality, and port  | Higher audio quality or a local SDK invocation                |
| khinsider           | Read by album / soundtrack entry                  | Japanese soundtracks, original game CDs                       |

Search results are labeled with their source (for example Enhanced or Meting), so you know which route an album came through.

### Album ID or Keyword Search?

- Remember the album name but not the ID: use **keyword search**. Results are paginated and your selection is preserved across pages.
- Already have an exact ID: use **Album ID** directly—fastest and least error-prone.
- Many albums share the name: use an ID, or check the cover, year, and track count before saving.

::: warning Verify the edition
A single work often has several releases: original soundtrack, arrange version, drama CD, and so on. Check the cover and track list before saving so different editions don't get mixed into one album.
:::

### Tracks and Metadata

In album detail you can organize tracks:

- Title, audio URL, duration, and cover.
- Lyrics: specify a `.lrc` file path, or paste lyric text directly.
- Source info: tracks from NetEase, Meting, or khinsider carry their own identifiers.

Typical info for a manually added song:

```text
Title:     Colorful World
Audio URL: https://example.com/audio/track01.mp3
Lyrics:    /path/to/track01.lrc   (or paste text)
```

::: tip Lyric files
The timestamps in an `.lrc` file drive word-by-word / line-by-line highlighting. Without a lyric file, pasted plain text still displays, but without precise timing.
:::

## Playback and Organization

### Global Player

Clicking a track brings up the player, which supports:

| Capability         | Description                                                       |
| ------------------ | ----------------------------------------------------------------- |
| Playback modes     | Sequential, loop all, loop one, shuffle                           |
| Queue              | View the upcoming list; expandable / collapsible                  |
| Full-screen lyrics | Expand to full screen with real-time highlighted lyrics           |
| Visualizer         | Multiple album-themed stages with dynamic effects during playback |
| Floating card      | Keep controlling playback after switching pages                   |

```text
Sequential → Loop all → Loop one → Shuffle → (back to sequential)
```

### Organizing Albums

- The OST shelf sets a default number of items per row by screen width: typically 2 rows of 10 on wide screens and 2 rows of 5 on narrow ones.
- The **OST** tab on a game detail page shows only albums associated with that game; a single album can auto-expand.
- Bulk delete is supported; before deleting, confirm you no longer need the cover, tracks, and lyrics.
- Album detail can be managed on its own page for concentrated editing of track info.

## FAQ

### No albums found

1. Check the Meting or Enhanced API config under **Settings → Platforms**.
2. Use the album's original name or publisher as the keyword rather than only the work's Chinese title.
3. Switch to a known album ID for direct reading.

### Album reading fails

- Confirm the network can reach the corresponding music service.
- For Enhanced API, check `apiBase`, `musicU`, `quality`, and the local SDK port; see [Platform Integration & Metadata](/guide/feats/platforms#ost-sources-meting-and-enhanced-api).
- For Meting, check bitrate and cover-size settings; some services only support single-track reading, so import behavior may differ.

### Imported but won't play

Usually the audio URL has expired, needs authentication, or is protected against hotlinking. Open the audio URL to confirm it's reachable, then try another source. For platform API issues, see [Platform Integration → Rate Limits and Failure Handling](/guide/feats/platforms#rate-limits-and-failure-handling).

### Lyrics are out of sync

Check the `.lrc` timestamps; lyrics copied from a web page are often plain text with no time tags. Pasting text works as a stopgap—add a proper LRC file later.

### PV won't play in-app

Open the original link to verify the source; if embedding is restricted, use a direct URL or upload the file locally. See [What to Do When Playback Fails](#what-to-do-when-playback-fails).

### Media files were cleaned up

**Records → Data** can clean up local files not referenced by the database or settings. Before running it, confirm no uploaded files are still in use; see [Play History → About the Records → Data Page](/guide/feats/play-records).

## Summary

- PV supports Bilibili, YouTube, direct URLs, HLS, and local uploads; if it won't play in-app, open the original link.
- OST can be imported from NetEase, Meting, Enhanced API, and khinsider, with manual tracks and LRC lyrics supported too.
- The global player offers four playback modes, a queue, full-screen lyrics, and a visualizer stage.
- For search / playback failures, check platform settings and audio links first.

Next: [Scanning & Game Library](/guide/feats/game-library), [Platform Integration](/guide/feats/platforms), [Launching & Play History](/guide/feats/play-records). To learn about the media API and asset storage, read [API & Data Layer](/guide/advanced/api-and-data).
