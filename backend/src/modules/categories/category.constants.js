const CATEGORY_RESPONSE_MESSAGES = Object.freeze({
  LIST_SUCCESS: "Asset categories retrieved successfully",
  CREATED_SUCCESS: "Asset category created successfully",
  UPDATED_SUCCESS: "Asset category updated successfully",
  DELETED_SUCCESS: "Asset category deleted successfully",
});

const CATEGORY_ERROR_MESSAGES = Object.freeze({
  ALREADY_EXISTS: "Asset category name already exists",
  NOT_FOUND: "Asset category not found",
});

module.exports = Object.freeze({
  CATEGORY_RESPONSE_MESSAGES,
  CATEGORY_ERROR_MESSAGES,
});
