-- Create game_ost_songs table
CREATE TABLE IF NOT EXISTS `game_ost_songs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `gameId` integer NOT NULL,
  `ostId` integer NOT NULL,
  `name` text NOT NULL,
  `url` text NOT NULL,
  `mediaType` text DEFAULT '',
  `createdAt` text DEFAULT (datetime('now')),
  `updatedAt` text DEFAULT (datetime('now'))
);

-- Create game_ost_lyrics table
CREATE TABLE IF NOT EXISTS `game_ost_lyrics` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `ostSongId` integer NOT NULL,
  `lyricsText` text DEFAULT '',
  `lyricsUrl` text DEFAULT '',
  `createdAt` text DEFAULT (datetime('now')),
  `updatedAt` text DEFAULT (datetime('now'))
);