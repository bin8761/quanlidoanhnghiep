ALTER TABLE `maintenance_requests`
  MODIFY COLUMN `status` ENUM('PENDING', 'APPROVED', 'IN_PROGRESS', 'WAITING_USER', 'COMPLETED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `priority` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM' AFTER `type`,
  ADD COLUMN `assignee_id` CHAR(36) NULL AFTER `requester_id`,
  ADD COLUMN `approved_by_id` CHAR(36) NULL AFTER `assignee_id`,
  ADD COLUMN `resolution` TEXT NULL AFTER `notes`,
  ADD COLUMN `completed_at` DATETIME(3) NULL AFTER `resolution`,
  ADD COLUMN `cancelled_at` DATETIME(3) NULL AFTER `completed_at`;

CREATE INDEX `maintenance_requests_status_type_priority_idx`
  ON `maintenance_requests` (`status`, `type`, `priority`);
CREATE INDEX `maintenance_requests_requester_id_status_idx`
  ON `maintenance_requests` (`requester_id`, `status`);
CREATE INDEX `maintenance_requests_assignee_id_status_idx`
  ON `maintenance_requests` (`assignee_id`, `status`);
CREATE INDEX `maintenance_requests_asset_id_status_idx`
  ON `maintenance_requests` (`asset_id`, `status`);

ALTER TABLE `maintenance_requests`
  ADD CONSTRAINT `maintenance_requests_assignee_id_fkey`
    FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `maintenance_requests_approved_by_id_fkey`
    FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `support_request_events` (
  `id` CHAR(36) NOT NULL,
  `support_request_id` CHAR(36) NOT NULL,
  `actor_user_id` CHAR(36) NULL,
  `type` ENUM('CREATED', 'APPROVED', 'ASSIGNED', 'STATUS_CHANGED', 'ASSET_STATUS_CHANGED', 'ASSIGNMENT_CREATED', 'ASSIGNMENT_RETURNED', 'ASSIGNMENT_TRANSFERRED', 'COMPLETED', 'REJECTED', 'CANCELLED') NOT NULL,
  `message` TEXT NOT NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `support_request_events_support_request_id_created_at_idx` (`support_request_id`, `created_at`),
  INDEX `support_request_events_actor_user_id_idx` (`actor_user_id`),
  CONSTRAINT `support_request_events_support_request_id_fkey`
    FOREIGN KEY (`support_request_id`) REFERENCES `maintenance_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `support_request_events_actor_user_id_fkey`
    FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
