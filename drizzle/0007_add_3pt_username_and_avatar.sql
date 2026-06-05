PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_character` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`vndbId` text NOT NULL,
	`name` text NOT NULL,
	`original` text DEFAULT '',
	`description` text DEFAULT '',
	`imageUrl` text DEFAULT '',
	`bloodType` text DEFAULT '',
	`height` integer,
	`weight` integer,
	`bust` integer,
	`waist` integer,
	`hips` integer,
	`age` integer,
	`birthdayMonth` integer,
	`birthdayDay` integer,
	`sex` text DEFAULT '',
	`gender` text DEFAULT '',
	`createdAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT',
	`updatedAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_character`("id", "gameId", "vndbId", "name", "original", "description", "imageUrl", "bloodType", "height", "weight", "bust", "waist", "hips", "age", "birthdayMonth", "birthdayDay", "sex", "gender", "createdAt", "updatedAt") SELECT "id", "gameId", "vndbId", "name", "original", "description", "imageUrl", "bloodType", "height", "weight", "bust", "waist", "hips", "age", "birthdayMonth", "birthdayDay", "sex", "gender", "createdAt", "updatedAt" FROM `character`;--> statement-breakpoint
DROP TABLE `character`;--> statement-breakpoint
ALTER TABLE `__new_character` RENAME TO `character`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `character_game_vndb_unique` ON `character` (`gameId`,`vndbId`);--> statement-breakpoint
CREATE TABLE `__new_collection` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`createdAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT',
	`updatedAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_collection`("id", "name", "createdAt", "updatedAt") SELECT "id", "name", "createdAt", "updatedAt" FROM `collection`;--> statement-breakpoint
DROP TABLE `collection`;--> statement-breakpoint
ALTER TABLE `__new_collection` RENAME TO `collection`;--> statement-breakpoint
CREATE TABLE `__new_game_info` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`cover` text DEFAULT '',
	`icon` text DEFAULT '',
	`logo` text DEFAULT '',
	`bg` text DEFAULT '',
	`summary` text NOT NULL,
	`name` text NOT NULL,
	`nameCn` text NOT NULL,
	`tags` text NOT NULL,
	`nsfw` integer NOT NULL,
	`ailases` text NOT NULL,
	`platforms` text NOT NULL,
	`gameType` text NOT NULL,
	`gameEngine` text NOT NULL,
	`music` text NOT NULL,
	`script` text NOT NULL,
	`graphic` text NOT NULL,
	`originalPainter` text NOT NULL,
	`animationProduction` text NOT NULL,
	`developer` text NOT NULL,
	`publisher` text NOT NULL,
	`programmer` text NOT NULL,
	`createdAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT',
	`updatedAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_game_info`("id", "date", "cover", "icon", "logo", "bg", "summary", "name", "nameCn", "tags", "nsfw", "ailases", "platforms", "gameType", "gameEngine", "music", "script", "graphic", "originalPainter", "animationProduction", "developer", "publisher", "programmer", "createdAt", "updatedAt") SELECT "id", "date", "cover", "icon", "logo", "bg", "summary", "name", "nameCn", "tags", "nsfw", "ailases", "platforms", "gameType", "gameEngine", "music", "script", "graphic", "originalPainter", "animationProduction", "developer", "publisher", "programmer", "createdAt", "updatedAt" FROM `game_info`;--> statement-breakpoint
DROP TABLE `game_info`;--> statement-breakpoint
ALTER TABLE `__new_game_info` RENAME TO `game_info`;--> statement-breakpoint
CREATE TABLE `__new_game_memory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`title` text DEFAULT '',
	`description` text DEFAULT '',
	`imageUrl` text DEFAULT '',
	`createdAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT',
	`updatedAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_game_memory`("id", "gameId", "title", "description", "imageUrl", "createdAt", "updatedAt") SELECT "id", "gameId", "title", "description", "imageUrl", "createdAt", "updatedAt" FROM `game_memory`;--> statement-breakpoint
DROP TABLE `game_memory`;--> statement-breakpoint
ALTER TABLE `__new_game_memory` RENAME TO `game_memory`;--> statement-breakpoint
CREATE TABLE `__new_game_ost_songs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`ostId` integer NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`mediaType` text DEFAULT '',
	`lyricsText` text DEFAULT '',
	`lyricsPath` text DEFAULT '',
	`createdAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT',
	`updatedAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_game_ost_songs`("id", "gameId", "ostId", "name", "url", "mediaType", "lyricsText", "lyricsPath", "createdAt", "updatedAt") SELECT "id", "gameId", "ostId", "name", "url", "mediaType", "lyricsText", "lyricsPath", "createdAt", "updatedAt" FROM `game_ost_songs`;--> statement-breakpoint
DROP TABLE `game_ost_songs`;--> statement-breakpoint
ALTER TABLE `__new_game_ost_songs` RENAME TO `game_ost_songs`;--> statement-breakpoint
CREATE TABLE `__new_game_ost` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`name` text NOT NULL,
	`cover` text NOT NULL,
	`resource` text DEFAULT '',
	`createdAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT',
	`updatedAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_game_ost`("id", "gameId", "name", "cover", "resource", "createdAt", "updatedAt") SELECT "id", "gameId", "name", "cover", "resource", "createdAt", "updatedAt" FROM `game_ost`;--> statement-breakpoint
DROP TABLE `game_ost`;--> statement-breakpoint
ALTER TABLE `__new_game_ost` RENAME TO `game_ost`;--> statement-breakpoint
CREATE TABLE `__new_game_pv` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`createdAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT',
	`updatedAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_game_pv`("id", "gameId", "name", "url", "createdAt", "updatedAt") SELECT "id", "gameId", "name", "url", "createdAt", "updatedAt" FROM `game_pv`;--> statement-breakpoint
DROP TABLE `game_pv`;--> statement-breakpoint
ALTER TABLE `__new_game_pv` RENAME TO `game_pv`;--> statement-breakpoint
CREATE TABLE `__new_game_quote` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`content` text NOT NULL,
	`characterId` text DEFAULT '',
	`context` text DEFAULT '',
	`createdAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT',
	`updatedAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_game_quote`("id", "gameId", "content", "characterId", "context", "createdAt", "updatedAt") SELECT "id", "gameId", "content", "characterId", "context", "createdAt", "updatedAt" FROM `game_quote`;--> statement-breakpoint
DROP TABLE `game_quote`;--> statement-breakpoint
ALTER TABLE `__new_game_quote` RENAME TO `game_quote`;--> statement-breakpoint
CREATE TABLE `__new_proxy_config` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`host` text NOT NULL,
	`port` integer NOT NULL,
	`username` text DEFAULT '',
	`password` text DEFAULT '',
	`enabled` integer DEFAULT 0,
	`createdAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT',
	`updatedAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_proxy_config`("id", "name", "type", "host", "port", "username", "password", "enabled", "createdAt", "updatedAt") SELECT "id", "name", "type", "host", "port", "username", "password", "enabled", "createdAt", "updatedAt" FROM `proxy_config`;--> statement-breakpoint
DROP TABLE `proxy_config`;--> statement-breakpoint
ALTER TABLE `__new_proxy_config` RENAME TO `proxy_config`;--> statement-breakpoint
CREATE TABLE `__new_scan_error` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`directory` text NOT NULL,
	`error` text NOT NULL,
	`status` integer DEFAULT 0,
	`createdAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT',
	`updatedAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_scan_error`("id", "directory", "error", "status", "createdAt", "updatedAt") SELECT "id", "directory", "error", "status", "createdAt", "updatedAt" FROM `scan_error`;--> statement-breakpoint
DROP TABLE `scan_error`;--> statement-breakpoint
ALTER TABLE `__new_scan_error` RENAME TO `scan_error`;--> statement-breakpoint
CREATE TABLE `__new_scanner` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`directory` text NOT NULL,
	`provider` text NOT NULL,
	`progress` integer DEFAULT 0,
	`gameCount` integer DEFAULT 0,
	`scanMode` integer DEFAULT 0,
	`scanLevel` integer DEFAULT 0,
	`excludeDirs` text DEFAULT '',
	`createdAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT',
	`updatedAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_scanner`("id", "directory", "provider", "progress", "gameCount", "scanMode", "scanLevel", "excludeDirs", "createdAt", "updatedAt") SELECT "id", "directory", "provider", "progress", "gameCount", "scanMode", "scanLevel", "excludeDirs", "createdAt", "updatedAt" FROM `scanner`;--> statement-breakpoint
DROP TABLE `scanner`;--> statement-breakpoint
ALTER TABLE `__new_scanner` RENAME TO `scanner`;--> statement-breakpoint
CREATE TABLE `__new_third_party_account` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text NOT NULL,
	`accountId` text NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text DEFAULT '',
	`username` text DEFAULT '',
	`avatar` text DEFAULT '',
	`expiresAt` text NOT NULL,
	`createdAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT',
	`updatedAt` text DEFAULT 'Fri, 05 Jun 2026 01:41:26 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_third_party_account`("id", "provider", "accountId", "accessToken", "refreshToken", "username", "avatar", "expiresAt", "createdAt", "updatedAt") SELECT "id", "provider", "accountId", "accessToken", "refreshToken", '', '', "expiresAt", "createdAt", "updatedAt" FROM `third_party_account`;--> statement-breakpoint
DROP TABLE `third_party_account`;--> statement-breakpoint
ALTER TABLE `__new_third_party_account` RENAME TO `third_party_account`;