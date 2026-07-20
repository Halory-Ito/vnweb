ALTER TABLE `game_guide` ADD COLUMN `finished` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `guide_route` ADD COLUMN `finished` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `guide_ending` ADD COLUMN `finished` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `guide_step` ADD COLUMN `finished` integer DEFAULT 0;
