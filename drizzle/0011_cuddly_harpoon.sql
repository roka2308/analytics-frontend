CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`actor_email` text,
	`action` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`summary` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `dashboards` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `organizations` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `last_login_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `invite_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `invite_expires_at` integer;