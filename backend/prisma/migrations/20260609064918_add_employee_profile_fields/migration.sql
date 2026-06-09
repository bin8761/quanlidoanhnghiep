-- AlterTable
ALTER TABLE `employees` ADD COLUMN `allow_profile_update` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `avatar_url` TEXT NULL,
    ADD COLUMN `certificates` JSON NULL,
    ADD COLUMN `current_address` TEXT NULL,
    ADD COLUMN `date_of_birth` DATETIME(3) NULL,
    ADD COLUMN `education` JSON NULL,
    ADD COLUMN `emergency_contact` JSON NULL,
    ADD COLUMN `ethnicity` VARCHAR(191) NULL,
    ADD COLUMN `gender` VARCHAR(191) NULL,
    ADD COLUMN `hometown` VARCHAR(191) NULL,
    ADD COLUMN `identity_card_number` VARCHAR(191) NULL,
    ADD COLUMN `join_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `nationality` VARCHAR(191) NULL,
    ADD COLUMN `permanent_address` TEXT NULL,
    ADD COLUMN `personal_email` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `position` VARCHAR(191) NOT NULL DEFAULT 'Staff',
    ADD COLUMN `skills` JSON NULL;

-- CreateTable
CREATE TABLE `employee_attachments` (
    `id` CHAR(36) NOT NULL,
    `employee_id` CHAR(36) NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_type` VARCHAR(191) NOT NULL,
    `file_url` TEXT NOT NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `uploaded_by_id` CHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_profile_logs` (
    `id` CHAR(36) NOT NULL,
    `employee_id` CHAR(36) NOT NULL,
    `actor_id` CHAR(36) NOT NULL,
    `changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `field_name` VARCHAR(191) NOT NULL,
    `old_value` TEXT NULL,
    `new_value` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `employee_attachments` ADD CONSTRAINT `employee_attachments_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_attachments` ADD CONSTRAINT `employee_attachments_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_profile_logs` ADD CONSTRAINT `employee_profile_logs_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_profile_logs` ADD CONSTRAINT `employee_profile_logs_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
