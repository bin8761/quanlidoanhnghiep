const repository = require("./inventory.repository");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");

function inventoryError(message, statusCode = 400) {
  return new AppError({ message, statusCode, errorCode: ERROR_CODES.VALIDATION_ERROR });
}

function createInventoryService({ inventoryRepository = repository } = {}) {
  return Object.freeze({
    async getSessions(filters = {}) {
      return inventoryRepository.findSessions(filters);
    },

    async getSessionById(id) {
      const session = await inventoryRepository.findSessionById(id);
      if (!session) throw inventoryError("Inventory session not found", 404);
      return session;
    },

    async createSession(data) {
      const department = await inventoryRepository.findDepartmentById(data.departmentId);
      if (!department) throw inventoryError("Department not found", 404);

      if (data.assetIds && data.assetIds.length > 0) {
        const uniqueAssetIds = [...new Set(data.assetIds)];
        if (uniqueAssetIds.length !== data.assetIds.length) throw inventoryError("Asset IDs must be unique");

        const assetCount = await inventoryRepository.countAssetsByIds(uniqueAssetIds);
        if (assetCount !== uniqueAssetIds.length) throw inventoryError("One or more assets were not found", 404);
      }

      return inventoryRepository.createSession(data);
    },

    async updateItem(id, data) {
      const item = await inventoryRepository.findItemById(id);
      if (!item) throw inventoryError("Inventory item not found", 404);
      if (item.session.status === "COMPLETED") throw inventoryError("Completed inventory sessions cannot be edited");

      // Validate location if provided
      if (data.locationId) {
        const locationsRepository = require("../locations/locations.repository");
        const loc = await locationsRepository.findById(data.locationId);
        if (!loc) throw inventoryError("Location not found", 404);
      }

      // Update inventory item coordinates and result
      const updatedItem = await inventoryRepository.updateItem(id, data);

      // If updateMaster is true, synchronize coordinates to the master records
      if (data.updateMaster && data.locationId && data.locationX !== undefined && data.locationX !== null && data.locationY !== undefined && data.locationY !== null) {
        const assetsRepository = require("../assets/assets.repository");
        const employeesRepository = require("../employees/employees.repository");

        const asset = item.asset;
        if (asset) {
          const activeAssignment = asset.assignments && asset.assignments[0];
          if (asset.status === "ASSIGNED" && activeAssignment) {
            // Update Employee's desk coordinates
            await employeesRepository.update(activeAssignment.employeeId, {
              locationId: Number(data.locationId),
              deskX: Number(data.locationX),
              deskY: Number(data.locationY),
            });
          } else {
            // Update Fixed Asset's coordinates
            await assetsRepository.update(asset.id, {
              locationId: Number(data.locationId),
              locationX: Number(data.locationX),
              locationY: Number(data.locationY),
            });
          }
        }
      }

      return updatedItem;
    },
  });
}

const service = createInventoryService();

module.exports = Object.freeze({
  ...service,
  createInventoryService,
});
