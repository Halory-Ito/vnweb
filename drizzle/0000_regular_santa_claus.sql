CREATE TABLE `collection_game` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collectionId` integer NOT NULL,
	`gameId` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `collection` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`createdAt` text DEFAULT 'Sat, 07 Mar 2026 00:01:26 GMT',
	`updatedAt` text DEFAULT 'Sat, 07 Mar 2026 00:01:26 GMT'
);
--> statement-breakpoint
CREATE TABLE `game_info` (
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
	`createdAt` text DEFAULT 'Sat, 07 Mar 2026 00:01:26 GMT',
	`updatedAt` text DEFAULT 'Sat, 07 Mar 2026 00:01:26 GMT'
);
--> statement-breakpoint
CREATE TABLE `game_ost` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`createdAt` text DEFAULT 'Sat, 07 Mar 2026 00:01:26 GMT',
	`updatedAt` text DEFAULT 'Sat, 07 Mar 2026 00:01:26 GMT'
);
--> statement-breakpoint
CREATE TABLE `game_play` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`exePath` text DEFAULT '',
	`isRunning` integer DEFAULT 0,
	`totalPlayTime` integer DEFAULT 0,
	`playCount` integer DEFAULT 0,
	`rating` integer DEFAULT 0,
	`lastLaunchedAt` text DEFAULT '',
	`status` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `game_pv` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`createdAt` text DEFAULT 'Sat, 07 Mar 2026 00:01:26 GMT',
	`updatedAt` text DEFAULT 'Sat, 07 Mar 2026 00:01:26 GMT'
);
--> statement-breakpoint
CREATE TABLE `game_record` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`playTime` integer DEFAULT 0,
	`playDate` text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE `scan_error` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`directory` text NOT NULL,
	`error` text NOT NULL,
	`status` integer DEFAULT 0,
	`createdAt` text DEFAULT 'Sat, 07 Mar 2026 00:01:26 GMT',
	`updatedAt` text DEFAULT 'Sat, 07 Mar 2026 00:01:26 GMT'
);
--> statement-breakpoint
CREATE TABLE `scanner` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`directory` text NOT NULL,
	`provider` text NOT NULL,
	`progress` integer DEFAULT 0,
	`gameCount` integer DEFAULT 0,
	`scanMode` integer DEFAULT 0,
	`scanLevel` integer DEFAULT 0,
	`excludeDirs` text DEFAULT '',
	`createdAt` text DEFAULT 'Sat, 07 Mar 2026 00:01:26 GMT',
	`updatedAt` text DEFAULT 'Sat, 07 Mar 2026 00:01:26 GMT'
);
--> statement-breakpoint
CREATE TABLE `relate_website` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL
);
