DELETE FROM `game_id_map`
WHERE `id` NOT IN (
        SELECT MIN(`id`)
        FROM `game_id_map`
        GROUP BY `gameId`,
            `provider`,
            `externalId`
    );
--> statement-breakpoint
CREATE UNIQUE INDEX `game_id_map_game_provider_external_unique` ON `game_id_map` (`gameId`, `provider`, `externalId`);