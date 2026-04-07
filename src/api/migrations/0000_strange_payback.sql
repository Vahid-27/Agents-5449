CREATE TABLE `agent_outputs` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`agent_num` integer NOT NULL,
	`output` text,
	`parsed_data` text,
	`status` text DEFAULT 'idle',
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `blog_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `blog_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`product` text NOT NULL,
	`blog_type` text,
	`target_audience` text,
	`funnel_stage` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`current_agent` integer DEFAULT 0,
	`status` text DEFAULT 'in_progress'
);
