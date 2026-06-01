ALTER TABLE `organizations` ADD `slug` text;
--> statement-breakpoint
UPDATE `organizations` SET `slug` = lower(replace(replace(replace(replace(replace(replace(name, ' ', '-'), 'Ä', 'ae'), 'Ö', 'oe'), 'Ü', 'ue'), 'ß', 'ss'), '.', '')) WHERE slug IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);
