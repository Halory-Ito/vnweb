-- Add lyrics fields to game_ost_songs table
ALTER TABLE `game_ost_songs` ADD COLUMN `lyricsText` text DEFAULT '';
ALTER TABLE `game_ost_songs` ADD COLUMN `lyricsPath` text DEFAULT '';