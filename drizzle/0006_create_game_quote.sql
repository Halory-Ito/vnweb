CREATE TABLE `game_quote` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`content` text NOT NULL,
	`characterId` text DEFAULT '',
	`context` text DEFAULT '',
	`createdAt` text DEFAULT '',
	`updatedAt` text DEFAULT ''
);
