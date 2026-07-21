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
	`createdAt` text DEFAULT (datetime('now')),
	`updatedAt` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
ALTER TABLE `guide_ending` ADD `cg` text DEFAULT '';