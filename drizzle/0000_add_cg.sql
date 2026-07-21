CREATE TABLE `cg` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`name` text DEFAULT '',
	`url` text NOT NULL,
	`thumbnail` text DEFAULT '',
	`category` text DEFAULT '',
	`description` text DEFAULT '',
	`source` text DEFAULT '',
	`width` integer,
	`height` integer,
	`fileSize` integer,
	`sortOrder` integer DEFAULT 0,
	`createdAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT',
	`updatedAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT'
);
--> statement-breakpoint
CREATE TABLE `character` (
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
	`createdAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT',
	`updatedAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `character_game_vndb_unique` ON `character` (`gameId`,`vndbId`);--> statement-breakpoint
CREATE TABLE `collection_game` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collectionId` integer NOT NULL,
	`gameId` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `collection` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`createdAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT',
	`updatedAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT'
);
--> statement-breakpoint
CREATE TABLE `game_guide` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`name` text NOT NULL,
	`cover` text DEFAULT '',
	`level` integer DEFAULT 0,
	`tips` text DEFAULT '',
	`finished` integer DEFAULT 0,
	`createdAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT',
	`updatedAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT'
);
--> statement-breakpoint
CREATE TABLE `game_id_map` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`provider` text NOT NULL,
	`externalId` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_id_map_game_provider_external_unique` ON `game_id_map` (`gameId`,`provider`,`externalId`);--> statement-breakpoint
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
	`saveDir` text DEFAULT '',
	`createdAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT',
	`updatedAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT'
);
--> statement-breakpoint
CREATE TABLE `game_memory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`title` text DEFAULT '',
	`description` text DEFAULT '',
	`imageUrl` text DEFAULT '',
	`createdAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT',
	`updatedAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT'
);
--> statement-breakpoint
CREATE TABLE `game_ost_songs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`ostId` integer NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`mediaType` text DEFAULT '',
	`lyricsText` text DEFAULT '',
	`lyricsPath` text DEFAULT '',
	`createdAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT',
	`updatedAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT'
);
--> statement-breakpoint
CREATE TABLE `game_ost` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`name` text NOT NULL,
	`cover` text NOT NULL,
	`resource` text DEFAULT '',
	`createdAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT',
	`updatedAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT'
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
	`createdAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT',
	`updatedAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT'
);
--> statement-breakpoint
CREATE TABLE `game_quote` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`content` text NOT NULL,
	`characterId` text DEFAULT '',
	`context` text DEFAULT '',
	`createdAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT',
	`updatedAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT'
);
--> statement-breakpoint
CREATE TABLE `game_record` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`playTime` integer DEFAULT 0,
	`playDate` text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE `guide_ending` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`routeId` integer NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'normal',
	`cover` text DEFAULT '',
	`cg` text DEFAULT '',
	`requirements` text DEFAULT '',
	`finished` integer DEFAULT 0,
	`sortOrder` integer DEFAULT 0,
	`createdAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT',
	`updatedAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT'
);
--> statement-breakpoint
CREATE TABLE `guide_route` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guideId` integer NOT NULL,
	`name` text NOT NULL,
	`finished` integer DEFAULT 0,
	`sortOrder` integer DEFAULT 0,
	`createdAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT',
	`updatedAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT'
);
--> statement-breakpoint
CREATE TABLE `guide_step` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`endingId` integer NOT NULL,
	`type` text DEFAULT 'choice',
	`content` text NOT NULL,
	`group` text DEFAULT '',
	`prefix` text DEFAULT '',
	`subfix` text DEFAULT '',
	`finished` integer DEFAULT 0,
	`sortOrder` integer DEFAULT 0,
	`createdAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT',
	`updatedAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT'
);
--> statement-breakpoint
CREATE TABLE `proxy_config` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`host` text NOT NULL,
	`port` integer NOT NULL,
	`username` text DEFAULT '',
	`password` text DEFAULT '',
	`enabled` integer DEFAULT 0,
	`createdAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT',
	`updatedAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT'
);
--> statement-breakpoint
CREATE TABLE `scan_error` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`directory` text NOT NULL,
	`error` text NOT NULL,
	`status` integer DEFAULT 0,
	`createdAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT',
	`updatedAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT'
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
	`createdAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT',
	`updatedAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT'
);
--> statement-breakpoint
CREATE TABLE `third_party_account` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text NOT NULL,
	`accountId` text NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text DEFAULT '',
	`username` text DEFAULT '',
	`avatar` text DEFAULT '',
	`expiresAt` text NOT NULL,
	`createdAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT',
	`updatedAt` text DEFAULT 'Tue, 21 Jul 2026 04:51:52 GMT'
);
--> statement-breakpoint
CREATE TABLE `relate_website` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL
);
