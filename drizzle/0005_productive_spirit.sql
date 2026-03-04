CREATE TABLE `data_import_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(50) NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`fileUrl` text,
	`totalRecords` int DEFAULT 0,
	`processedRecords` int DEFAULT 0,
	`failedRecords` int DEFAULT 0,
	`errorMessage` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `data_import_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingredient_forecasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`ingredientId` int NOT NULL,
	`projectedUsage` decimal(10,3) DEFAULT '0',
	`unit` varchar(32),
	`confidenceScore` decimal(5,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingredient_forecasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `local_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`eventName` varchar(255) NOT NULL,
	`eventType` varchar(50),
	`estimatedAttendance` int,
	`impactMultiplier` decimal(5,2) DEFAULT '1.0',
	`isSimulated` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `local_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_performance_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ingredientId` int NOT NULL,
	`dateGenerated` varchar(10) NOT NULL,
	`alertType` enum('slow_moving','high_waste_risk','seasonal_upward','seasonal_downward') NOT NULL,
	`recommendation` text NOT NULL,
	`seasonalityScore` decimal(5,2) DEFAULT '1.0',
	`isResolved` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_performance_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weather_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`tempMax` decimal(5,2),
	`tempMin` decimal(5,2),
	`condition` varchar(50),
	`precipitationProbability` decimal(5,2) DEFAULT '0',
	`isSimulated` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weather_data_id` PRIMARY KEY(`id`),
	CONSTRAINT `weather_data_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
ALTER TABLE `integrations` MODIFY COLUMN `type` enum('slack','teams','quickbooks','stripe','square','paypal','uber_eats','doordash','grubhub','webhook','toast','xtra_chef') NOT NULL;--> statement-breakpoint
ALTER TABLE `forecasting_data` ADD `projectedLabourHours` decimal(7,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `forecasting_data` ADD `projectedLabourCost` decimal(12,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `forecasting_data` ADD `weatherImpactScore` decimal(5,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `forecasting_data` ADD `eventImpactScore` decimal(5,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `ingredient_forecasts` ADD CONSTRAINT `ingredient_forecasts_ingredientId_ingredients_id_fk` FOREIGN KEY (`ingredientId`) REFERENCES `ingredients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_performance_alerts` ADD CONSTRAINT `stock_performance_alerts_ingredientId_ingredients_id_fk` FOREIGN KEY (`ingredientId`) REFERENCES `ingredients`(`id`) ON DELETE no action ON UPDATE no action;