-- CreateEnum
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `type` ENUM('ASSET_ASSIGNED', 'ASSET_RETURNED', 'ASSET_TRANSFERRED', 'MAINTENANCE_UPDATED') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `data` JSON NULL,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_read_at_created_at_idx`(`user_id`, `read_at`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
