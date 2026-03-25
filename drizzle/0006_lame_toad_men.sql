ALTER TABLE `receipt_settings` ADD `templateType` enum('classic','modern','minimalist') DEFAULT 'classic';--> statement-breakpoint
ALTER TABLE `receipt_settings` ADD `customCss` text;--> statement-breakpoint
ALTER TABLE `system_settings` ADD `primaryColor` varchar(32) DEFAULT '#e11d48';--> statement-breakpoint
ALTER TABLE `system_settings` ADD `fontFamily` varchar(64) DEFAULT 'Inter';--> statement-breakpoint
ALTER TABLE `system_settings` ADD `borderRadius` varchar(16) DEFAULT '0.5rem';