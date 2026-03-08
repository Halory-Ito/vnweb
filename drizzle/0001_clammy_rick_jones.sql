CREATE TABLE `character` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`name` text NOT NULL,
	`nameCn` text NOT NULL,
	`gender` integer DEFAULT -1,
	`age` integer DEFAULT 0,
	`description` text DEFAULT '',
	`birthday` text DEFAULT '',
	`createdAt` text DEFAULT 'Sun, 08 Mar 2026 01:26:51 GMT',
	`updatedAt` text DEFAULT 'Sun, 08 Mar 2026 01:26:51 GMT'
);
--> statement-breakpoint
CREATE TABLE `game_id_map` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`provider` text NOT NULL,
	`externalId` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `third_party_account` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text NOT NULL,
	`accountId` text NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text DEFAULT '',
	`expiresAt` text NOT NULL,
	`createdAt` text DEFAULT 'Sun, 08 Mar 2026 01:26:51 GMT',
	`updatedAt` text DEFAULT 'Sun, 08 Mar 2026 01:26:51 GMT'
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_collection` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`createdAt` text DEFAULT 'Sun, 08 Mar 2026 01:26:51 GMT',
	`updatedAt` text DEFAULT 'Sun, 08 Mar 2026 01:26:51 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_collection`("id", "name", "createdAt", "updatedAt") SELECT "id", "name", "createdAt", "updatedAt" FROM `collection`;--> statement-breakpoint
DROP TABLE `collection`;--> statement-breakpoint
ALTER TABLE `__new_collection` RENAME TO `collection`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
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
	`createdAt` text DEFAULT 'Sun, 08 Mar 2026 01:26:51 GMT',
	`updatedAt` text DEFAULT 'Sun, 08 Mar 2026 01:26:51 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_game_info`("id", "date", "cover", "icon", "logo", "bg", "summary", "name", "nameCn", "tags", "nsfw", "ailases", "platforms", "gameType", "gameEngine", "music", "script", "graphic", "originalPainter", "animationProduction", "developer", "publisher", "programmer", "createdAt", "updatedAt") SELECT "id", "date", "cover", "icon", "logo", "bg", "summary", "name", "nameCn", "tags", "nsfw", "ailases", "platforms", "gameType", "gameEngine", "music", "script", "graphic", "originalPainter", "animationProduction", "developer", "publisher", "programmer", "createdAt", "updatedAt" FROM `game_info`;--> statement-breakpoint
DROP TABLE `game_info`;--> statement-breakpoint
ALTER TABLE `__new_game_info` RENAME TO `game_info`;--> statement-breakpoint
CREATE TABLE `__new_game_ost` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`createdAt` text DEFAULT 'Sun, 08 Mar 2026 01:26:51 GMT',
	`updatedAt` text DEFAULT 'Sun, 08 Mar 2026 01:26:51 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_game_ost`("id", "gameId", "name", "url", "createdAt", "updatedAt") SELECT "id", "gameId", "name", "url", "createdAt", "updatedAt" FROM `game_ost`;--> statement-breakpoint
DROP TABLE `game_ost`;--> statement-breakpoint
ALTER TABLE `__new_game_ost` RENAME TO `game_ost`;--> statement-breakpoint
CREATE TABLE `__new_game_pv` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`createdAt` text DEFAULT 'Sun, 08 Mar 2026 01:26:51 GMT',
	`updatedAt` text DEFAULT 'Sun, 08 Mar 2026 01:26:51 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_game_pv`("id", "gameId", "name", "url", "createdAt", "updatedAt") SELECT "id", "gameId", "name", "url", "createdAt", "updatedAt" FROM `game_pv`;--> statement-breakpoint
DROP TABLE `game_pv`;--> statement-breakpoint
ALTER TABLE `__new_game_pv` RENAME TO `game_pv`;--> statement-breakpoint
CREATE TABLE `__new_scan_error` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`directory` text NOT NULL,
	`error` text NOT NULL,
	`status` integer DEFAULT 0,
	`createdAt` text DEFAULT 'Sun, 08 Mar 2026 01:26:51 GMT',
	`updatedAt` text DEFAULT 'Sun, 08 Mar 2026 01:26:51 GMT'
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
	`createdAt` text DEFAULT 'Sun, 08 Mar 2026 01:26:51 GMT',
	`updatedAt` text DEFAULT 'Sun, 08 Mar 2026 01:26:51 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_scanner`("id", "directory", "provider", "progress", "gameCount", "scanMode", "scanLevel", "excludeDirs", "createdAt", "updatedAt") SELECT "id", "directory", "provider", "progress", "gameCount", "scanMode", "scanLevel", "excludeDirs", "createdAt", "updatedAt" FROM `scanner`;--> statement-breakpoint
DROP TABLE `scanner`;--> statement-breakpoint
ALTER TABLE `__new_scanner` RENAME TO `scanner`;