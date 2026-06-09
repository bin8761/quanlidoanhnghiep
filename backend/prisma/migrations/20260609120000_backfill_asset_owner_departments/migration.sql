UPDATE `assets` a
JOIN `asset_assignments` aa ON aa.`asset_id` = a.`id` AND aa.`status` = 'ACTIVE'
JOIN `employees` e ON e.`id` = aa.`employee_id`
SET a.`owner_department_id` = e.`department_id`
WHERE a.`owner_department_id` IS NULL
  AND e.`department_id` IS NOT NULL;

UPDATE `assets` a
JOIN `asset_categories` c ON c.`id` = a.`category_id`
JOIN `departments` d ON d.`name` = 'Phòng Hành chính'
SET a.`owner_department_id` = d.`id`
WHERE a.`owner_department_id` IS NULL
  AND c.`name` IN ('Máy in', 'Máy chiếu', 'Thiết bị phòng họp', 'Thiết bị văn phòng');

UPDATE `assets` a
JOIN `asset_categories` c ON c.`id` = a.`category_id`
JOIN `departments` d ON d.`name` = 'Phòng Kỹ thuật'
SET a.`owner_department_id` = d.`id`
WHERE a.`owner_department_id` IS NULL
  AND c.`name` IN ('Laptop', 'Màn hình', 'Thiết bị ngoại vi', 'Thiết bị mạng', 'Thiết bị di động', 'Máy chủ & Lưu trữ');
