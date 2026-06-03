CREATE TABLE `dashboard_share_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`dashboard_id` text NOT NULL,
	`token` text NOT NULL,
	`label` text,
	`matomo_site_id` integer,
	`expires_at` integer,
	`revoked_at` integer,
	`created_by_user_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`dashboard_id`) REFERENCES `dashboards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dashboard_share_tokens_token_unique` ON `dashboard_share_tokens` (`token`);