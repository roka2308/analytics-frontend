CREATE TABLE `access_grants` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`scope_type` text NOT NULL,
	`scope_id` text NOT NULL,
	`role` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`branding_logo_base64` text,
	`branding_accent_hsl` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`type` text DEFAULT 'matomo' NOT NULL,
	`label` text NOT NULL,
	`matomo_site_id` integer,
	`config` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `organizations` ADD `customer_id` text REFERENCES customers(id);--> statement-breakpoint
CREATE UNIQUE INDEX `access_grant_scope_idx` ON `access_grants` (`user_id`,`scope_type`,`scope_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_slug_unique` ON `customers` (`slug`);--> statement-breakpoint
INSERT INTO customers (id, name, slug)
SELECT 'cust_default', 'Standard-Kunde', 'standard-kunde'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE id = 'cust_default');--> statement-breakpoint
UPDATE organizations SET customer_id = 'cust_default' WHERE customer_id IS NULL;--> statement-breakpoint
INSERT INTO data_sources (id, organization_id, type, label, matomo_site_id, created_at)
SELECT 'ds_' || ms.id, ms.organization_id, 'matomo', ms.label, ms.matomo_site_id, ms.created_at
FROM matomo_sites ms
WHERE NOT EXISTS (SELECT 1 FROM data_sources ds WHERE ds.id = 'ds_' || ms.id);--> statement-breakpoint
INSERT INTO access_grants (id, user_id, scope_type, scope_id, role, created_at)
SELECT 'grant_proj_' || u.id, u.id, 'project', u.organization_id, NULL, (unixepoch())
FROM users u
WHERE u.organization_id IS NOT NULL
  AND u.role != 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM access_grants g
    WHERE g.user_id = u.id AND g.scope_type = 'project' AND g.scope_id = u.organization_id
  );