CREATE TABLE `collection_game` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collectionId` integer NOT NULL,
	`gameId` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `collection` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`createdAt` text DEFAULT 'Tue, 03 Mar 2026 02:53:54 GMT',
	`updatedAt` text DEFAULT 'Tue, 03 Mar 2026 02:53:54 GMT'
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_game_info` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`cover` text NOT NULL,
	`icon` text NOT NULL,
	`logo` text NOT NULL,
	`bg` text NOT NULL,
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
	`createdAt` text DEFAULT 'Tue, 03 Mar 2026 02:53:54 GMT',
	`updatedAt` text DEFAULT 'Tue, 03 Mar 2026 02:53:54 GMT'
);
--> statement-breakpoint
INSERT INTO `__new_game_info`("id", "date", "cover", "icon", "logo", "bg", "summary", "name", "nameCn", "tags", "nsfw", "ailases", "platforms", "gameType", "gameEngine", "music", "script", "graphic", "originalPainter", "animationProduction", "developer", "publisher", "programmer", "createdAt", "updatedAt") SELECT "id", "date", "cover", "icon", "logo", "bg", "summary", "name", "nameCn", "tags", "nsfw", "ailases", "platforms", "gameType", "gameEngine", "music", "script", "graphic", "originalPainter", "animationProduction", "developer", "publisher", "programmer", "createdAt", "updatedAt" FROM `game_info`;--> statement-breakpoint
DROP TABLE `game_info`;--> statement-breakpoint
ALTER TABLE `__new_game_info` RENAME TO `game_info`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `game_play` ADD `isRunning` integer DEFAULT 0;