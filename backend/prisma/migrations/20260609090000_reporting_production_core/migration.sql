ALTER TABLE `assets`
  ADD COLUMN `owner_department_id` INTEGER NULL;

CREATE INDEX `assets_status_category_id_owner_department_id_location_id_idx`
  ON `assets`(`status`, `category_id`, `owner_department_id`, `location_id`);
CREATE INDEX `asset_assignments_asset_id_status_idx`
  ON `asset_assignments`(`asset_id`, `status`);
CREATE INDEX `asset_assignments_employee_id_status_idx`
  ON `asset_assignments`(`employee_id`, `status`);
CREATE INDEX `asset_assignments_assigned_at_idx`
  ON `asset_assignments`(`assigned_at`);
CREATE INDEX `inventory_sessions_department_id_status_idx`
  ON `inventory_sessions`(`department_id`, `status`);
CREATE INDEX `inventory_items_asset_id_idx`
  ON `inventory_items`(`asset_id`);

ALTER TABLE `assets`
  ADD CONSTRAINT `assets_owner_department_id_fkey`
  FOREIGN KEY (`owner_department_id`) REFERENCES `departments`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
