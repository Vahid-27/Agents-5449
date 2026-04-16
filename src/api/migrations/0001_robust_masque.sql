ALTER TABLE `agent_outputs` ADD `version` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `agent_outputs` ADD `is_active` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `blog_sessions` ADD `product_url` text;--> statement-breakpoint
ALTER TABLE `blog_sessions` ADD `product_context` text;