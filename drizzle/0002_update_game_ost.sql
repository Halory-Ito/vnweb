-- Migration: Update game_ost table and create new tables
-- This migration preserves existing data in game_ost table

-- Step 1: Rename url column to cover (preserve data)
ALTER TABLE `game_ost` RENAME COLUMN `url` TO `cover`;

-- Step 2: Add resource column (not null with default)
ALTER TABLE `game_ost` ADD COLUMN `resource` text DEFAULT '';