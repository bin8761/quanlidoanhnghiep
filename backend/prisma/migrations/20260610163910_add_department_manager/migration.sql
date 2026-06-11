-- AlterTable
ALTER TABLE `departments` ADD COLUMN `manager_id` CHAR(36) NULL;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_manager_id_fkey` FOREIGN KEY (`manager_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
