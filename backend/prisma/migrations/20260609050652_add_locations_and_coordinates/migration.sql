-- AlterTable
ALTER TABLE `assets` ADD COLUMN `location_id` INTEGER NULL,
    ADD COLUMN `location_x` DOUBLE NULL,
    ADD COLUMN `location_y` DOUBLE NULL;

-- AlterTable
ALTER TABLE `employees` ADD COLUMN `desk_x` DOUBLE NULL,
    ADD COLUMN `desk_y` DOUBLE NULL,
    ADD COLUMN `location_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `inventory_items` ADD COLUMN `location_id` INTEGER NULL,
    ADD COLUMN `location_x` DOUBLE NULL,
    ADD COLUMN `location_y` DOUBLE NULL;

-- CreateTable
CREATE TABLE `locations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `floor_plan_url` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `locations_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_items` ADD CONSTRAINT `inventory_items_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
