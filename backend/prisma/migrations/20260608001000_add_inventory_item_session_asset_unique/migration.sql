ALTER TABLE `inventory_items`
  ADD CONSTRAINT `inventory_items_session_id_asset_id_key` UNIQUE (`session_id`, `asset_id`);
