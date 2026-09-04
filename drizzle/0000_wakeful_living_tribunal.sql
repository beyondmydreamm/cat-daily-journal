CREATE TABLE `cat_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`occurred_at` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`next_due_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cat_events_occurred_at_idx` ON `cat_events` (`occurred_at`);