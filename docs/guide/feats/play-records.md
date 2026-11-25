# Launching & Play History

vnweb doesn't just open games for you—it turns every session into data you can look back on. This page explains how timing works, where the data lives, how to view it by month or year, and how to export it as a poster. For prerequisites (building a library and setting paths), see [Scanning & Game Library](/guide/feats/game-library) and [Quick Start](/guide/intro/quick-start).

## Launch the Game and Start Tracking

1. Open a game in the **Game Library**, go to **Settings**, and confirm **Executable Path** points to the program you want to run.
2. Back on the detail page, click **Start Game**. vnweb launches the local program and monitors the play process.
3. After you exit the game normally, check the game's **Records** tab for the session. To end a game from vnweb, use **End Game** on the detail page.

![Game detail page showing playtime and the last launched time](/overview.png)

### How Timing Works

One play session roughly corresponds to one session row in the database:

| Field                      | Meaning                                 |
| -------------------------- | --------------------------------------- |
| Associated game            | Which game this session belongs to      |
| Start time `startAt`       | When the session began                  |
| Duration `durationSeconds` | Seconds played in this session          |
| Running state `isRunning`  | Whether timing is still active          |
| Executable path            | The program actually launched this time |

**Start Game** launches the program, writes the start time, and marks the session as running; when the session ends, the duration is calculated and saved. It therefore measures **the span from launch to exit**, not the in-game save time.

::: warning When launching through a launcher
If the duration doesn't match expectations, first check that **Executable Path** points to the process you actually play. A path pointing to a launcher, a shell wrapper, or another `.exe` can make the wrong process the timing target. See [Scanning & Game Library → Organize the Game Library](/guide/feats/game-library#organize-the-game-library) for how to fix it.
:::

### Launching and Timing from the Command Line

You can also start a game and track time with the [command-line tool](/guide/feats/other):

```bat
vnweb start 12       :: launch the game with ID 12
vnweb start          :: quick-launch the most recently played game
```

The CLI shows `Session time: HH:MM:SS` in real time. Press `q` to end and save the session, or `Ctrl+C` to exit without saving.

## Reading Session Records

- **Single game**: open the **Records** tab on a detail page; switch between **week / month / year** and between line and bar charts.
- **Global overview**: open the **Records** page and look at Overview, Monthly Report, and Yearly Report for the big picture.
- **By day / week**: the "Daily playtime" chart in the Monthly Report gives a day-by-day curve for the month; a single game's **Records** switched to **Week** shows the daily distribution for that week.

::: tip Time boundaries
Week views use calendar weeks (starting Sunday); month and year views use calendar months and years. Use the left/right arrows to page backward—you can't page into the future.
:::

## Home Page and Statistics

### Home at a Glance

The home page shows recent play, streak days, total playtime, and completed games, with optional goals:

| Metric                      | Meaning                                                                          |
| --------------------------- | -------------------------------------------------------------------------------- |
| Playtime in the last 7 days | Accumulated time over the past week                                              |
| Play streak                 | Current streak in days; if you haven't played today, it's counted from yesterday |
| Total playtime              | Accumulated time across all saved sessions                                       |
| Completed                   | Number of games marked as finished                                               |

Click the goal edit entry to set **daily playtime (minutes)** and **games completed this year**; the home page shows progress rings. Goals are stored in the `goals` field of `data/settings/general.json`.

### Records → Overview

Overview is for reviewing overall scale and distribution:

| Card / chart                          | How to read it                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Total games, playtime, days, sessions | A session count isn't the same as a day count—multiple sessions on one day count as a single active day |
| Character / OST / PV / quote counts   | How rich your accumulated content is                                                                    |
| Single-session duration distribution  | Session counts by duration range—are you a "short and frequent" player or a "one long sit" player?      |
| Playtime distribution                 | Total time by hour of day, with peak hours marked                                                       |
| Playtime ranking / rating ranking     | Find the titles you truly spent time on                                                                 |

::: tip Chart colors
Chart colors and opacity follow the chart settings in [Appearance & Themes](/guide/feats/custom-theme), so changing the theme updates the stats pages too.
:::

### Monthly Report

The Monthly Report answers "what happened this month":

- Playtime, active days, and peak hours for the period.
- Daily playtime (line / bar), with a drill-down to a specific day.
- This month's most-played games, top 10 by session count.
- This month's playtime ranking.

### Yearly Report

The Yearly Report answers "how my narrative year looked":

- Monthly playtime and monthly active days (line / bar).
- Yearly playtime distribution: a pie chart switchable by **genre** or **publisher**.
- Yearly game ranking.

### Where Weekly and Daily Views Live

The **Records** navigation currently lists **Overview, Yearly Report, Monthly Report, Export Report, and Data** by default. A weekly view exists in the code but may not be listed in the default navigation. To read weekly or daily granularity:

- **Weekly**: open a single game's **Records** and switch to **Week**.
- **Daily**: open the daily curve in the **Monthly Report**, or look at the daily bars in a single game's **Week** view.

### About the Records → Data Page

::: warning Don't go to the wrong page
**Records → Data** shows **local static asset data**—disk usage statistics for local files such as images and fonts, plus unused-asset cleanup—not play details. To check a specific session, use a single game's **Records** or the Overview / Monthly Report.
:::

## Data Export

### Yearly Report Poster

Open **Records → Export Report**, choose a year, template, number of games, and which information to show, then click **Generate Poster** to download a PNG.

| Option              | Meaning                                                    |
| ------------------- | ---------------------------------------------------------- |
| Year                | The year to review; you can also view all                  |
| Template            | Four styles: Classic, Modern, Minimal, and Game            |
| Number of games     | How many titles to show on the poster                      |
| Information to show | Playtime, rating, last played, session count, covers, etc. |
| Colors              | Background and title colors                                |

On desktop, export opens a native Save As dialog so you can pick the location directly.

### Other Exports

- Quote entries can be filtered by keyword or creation time and exported to XLSX; see [Characters, Quotes & Memories](/guide/feats/game-notes).
- Timing records also support XLSX export, again using the native Save As dialog on desktop.
- Exporting and importing backup ZIPs is covered in [Backup, Restore & Sync](/guide/feats/save-backup).

## Charts at a Glance

| Chart            | Where it appears                                   | Purpose                             |
| ---------------- | -------------------------------------------------- | ----------------------------------- |
| Line / bar chart | Single-game records, Monthly Report, Yearly Report | Playtime changes over a time series |
| Pie chart        | Yearly Report                                      | Playtime share by genre / publisher |
| Heatmap          | Home / Overview areas                              | Activity intensity in calendar form |
| Ranking cards    | Overview, Monthly Report, Yearly Report            | Sorted by playtime or rating        |
| Progress ring    | Home page                                          | Daily and yearly goal completion    |

Chart data comes from saved sessions, so **complete records come first, good-looking charts second**. If a chart is empty, first confirm the game was actually launched and a session was ended.

## FAQ

### I played but the duration is 0

1. Did the session end normally? Force-closing vnweb mid-session may prevent it from being saved.
2. Was **End Game** clicked by mistake? Ending early truncates the duration.
3. Does the executable path point to the process you actually played?

### The duration is much longer than reality

If the game is closed but a process lingers in the background, vnweb may still be timing it. Check how you exited; if needed, use **End Game** on the detail page.

### My streak broke

Streak days use calendar days; if you haven't played today, it's counted from yesterday. Backfilling historical sessions isn't part of normal operations—record sessions as they happen.

### Statistics don't match a single game's records

Check filters and time ranges: global statistics and a single game's records may differ in range boundaries and NSFW entry visibility. Trust the data within the same page.

### I set a goal but nothing changed

Goals are saved in config and read on the home page. Refresh after changing them; the config lives in `data/settings/general.json`, and a server restart may be required if the server caches it.

### Poster generation failed

Confirm the year has data and cover assets are reachable; if a network image fails, update metadata first—see [Platform Integration → Failure Handling](/guide/feats/platforms#rate-limits-and-failure-handling).

## Summary

- Timing is based on a "launch → end" session; the key is a correct executable path.
- For one game, use the **Records** week / month / year views; globally, use Overview, Monthly Report, and Yearly Report.
- **Records → Data** is local asset cleanup, not play details.
- The Yearly Report exports PNG posters in four styles, with native Save As on desktop.

Next: [PV & OST](/guide/feats/media), [Characters, Quotes & Memories](/guide/feats/game-notes), [Backup, Restore & Sync](/guide/feats/save-backup). To see how statistics travel from the API to the charts, read [API & Data Layer](/guide/advanced/api-and-data).
