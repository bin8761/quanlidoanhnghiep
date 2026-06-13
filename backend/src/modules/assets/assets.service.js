const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const crypto = require("crypto");
const assetsRepository = require("./assets.repository");
const categoriesRepository = require("../categories/categories.repository");
const locationsRepository = require("../locations/locations.repository");
const departmentsRepository = require("../departments/departments.repository");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");

function resolveAssetLocation(asset) {
  if (!asset) return null;

  let resolvedLocation = null;
  let status = asset.status;

  // 1. Fixed Asset: has its own location coordinates
  if (asset.locationId && asset.locationX !== null && asset.locationY !== null) {
    resolvedLocation = {
      locationId: asset.locationId,
      locationName: asset.location?.name || null,
      floorPlanUrl: asset.location?.floorPlanUrl || null,
      x: asset.locationX,
      y: asset.locationY,
      type: "FIXED",
    };
  }
  // 2. Mobile Asset: check active assignment
  else if (asset.assignments && asset.assignments.length > 0) {
    const activeAssignment = asset.assignments[0];
    
    // ONLY resolve location to employee desk if the assignment is confirmed
    if (activeAssignment.confirmedAt) {
      const employee = activeAssignment.employee;
      if (employee && employee.locationId && employee.deskX !== null && employee.deskY !== null) {
        resolvedLocation = {
          locationId: employee.locationId,
          locationName: employee.location?.name || null,
          floorPlanUrl: employee.location?.floorPlanUrl || null,
          x: employee.deskX,
          y: employee.deskY,
          type: "ASSIGNED",
          employeeName: employee.fullName,
          employeeCode: employee.employeeCode,
        };
      }
    } else if (asset.status === "ASSIGNED") {
      // Handover not confirmed yet! Show status as "PENDING_CONFIRMATION"
      status = "PENDING_CONFIRMATION";
    }
  }

  return {
    ...asset,
    status,
    resolvedLocation,
  };
}

function createAssetsService({
  repository = assetsRepository,
  catRepository = categoriesRepository,
  locRepository = locationsRepository,
  deptRepository = departmentsRepository,
} = {}) {
  async function createAsset(data) {
    const existing = await repository.findByAssetCode(data.assetCode);
    if (existing) {
      throw new AppError({
        message: "Asset code already exists",
        statusCode: 400,
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const cat = await catRepository.findById(data.categoryId);
    if (!cat) {
      throw new AppError({
        message: "Category not found",
        statusCode: 404,
        errorCode: "CATEGORY_NOT_FOUND",
      });
    }

    if (data.locationId) {
      const loc = await locRepository.findById(data.locationId);
      if (!loc) {
        throw new AppError({
          message: "Location not found",
          statusCode: 404,
          errorCode: "LOCATION_NOT_FOUND",
        });
      }
    }
    if (data.ownerDepartmentId) {
      const department = await deptRepository.findById(data.ownerDepartmentId);
      if (!department) {
        throw new AppError({
          message: "Owner department not found",
          statusCode: 404,
          errorCode: "DEPARTMENT_NOT_FOUND",
        });
      }
    }

    const created = await repository.create(data);
    return resolveAssetLocation(created);
  }

  return Object.freeze({
    async getAllAssets(filters = {}) {
      const assets = await repository.findAll(filters);
      return assets.map(resolveAssetLocation);
    },

    async getAssetById(id) {
      const asset = await repository.findById(id);
      if (!asset) {
        throw new AppError({
          message: "Asset not found",
          statusCode: 404,
          errorCode: "ASSET_NOT_FOUND",
        });
      }
      return resolveAssetLocation(asset);
    },

    createAsset,

    async importAssets(rows) {
      const results = [];

      for (const row of rows) {
        try {
          const created = await createAsset(row);
          results.push({
            rowNumber: row.rowNumber,
            success: true,
            id: created.id,
            code: created.assetCode,
          });
        } catch (error) {
          results.push({
            rowNumber: row.rowNumber,
            success: false,
            code: row.assetCode,
            message: error.message || "Unable to import asset",
          });
        }
      }

      return {
        total: results.length,
        imported: results.filter((item) => item.success).length,
        failed: results.filter((item) => !item.success).length,
        results,
      };
    },

    async updateAsset(id, data) {
      const asset = await repository.findById(id);
      if (!asset) {
        throw new AppError({
          message: "Asset not found",
          statusCode: 404,
          errorCode: "ASSET_NOT_FOUND",
        });
      }

      if (data.categoryId) {
        const cat = await catRepository.findById(data.categoryId);
        if (!cat) {
          throw new AppError({
            message: "Category not found",
            statusCode: 404,
            errorCode: "CATEGORY_NOT_FOUND",
          });
        }
      }

      if (data.locationId) {
        const loc = await locRepository.findById(data.locationId);
        if (!loc) {
          throw new AppError({
            message: "Location not found",
            statusCode: 404,
            errorCode: "LOCATION_NOT_FOUND",
          });
        }
      }
      if (data.ownerDepartmentId) {
        const department = await deptRepository.findById(data.ownerDepartmentId);
        if (!department) {
          throw new AppError({
            message: "Owner department not found",
            statusCode: 404,
            errorCode: "DEPARTMENT_NOT_FOUND",
          });
        }
      }

      if (data.status && data.status !== asset.status) {
        const activeAssignmentCount = await repository.countActiveAssignments(id);
        if (activeAssignmentCount > 0 && data.status !== "ASSIGNED") {
          throw new AppError({
            message: "Cannot change status from ASSIGNED while asset is actively assigned to an employee. Use assignment return API.",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }
      }

      const updated = await repository.update(id, data);
      return resolveAssetLocation(updated);
    },

    async deleteAsset(id) {
      const asset = await repository.findById(id);
      if (!asset) {
        throw new AppError({
          message: "Asset not found",
          statusCode: 404,
          errorCode: "ASSET_NOT_FOUND",
        });
      }

      const activeAssignmentCount = await repository.countActiveAssignments(id);
      if (activeAssignmentCount > 0) {
        throw new AppError({
          message: "Cannot delete asset with active assignment",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      return repository.delete(id);
    },

    async uploadImage(file) {
      if (!file) {
        throw new AppError({
          message: "Không tìm thấy tệp tải lên",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      const uploadDir = path.join(__dirname, "../../../uploads/assets");

      // Tạo thư mục nếu chưa tồn tại
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${crypto.randomUUID()}.webp`;
      const filePath = path.join(uploadDir, fileName);

      try {
        await sharp(file.buffer)
          .rotate()
          .resize({ width: 1000, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(filePath);
      } catch (err) {
        throw new AppError({
          message: `Lỗi xử lý hình ảnh: ${err.message}`,
          statusCode: 500,
          errorCode: "IMAGE_PROCESSING_ERROR",
        });
      }

      return `/uploads/assets/${fileName}`;
    },
  });
}

const assetsService = createAssetsService();

module.exports = Object.freeze({
  ...assetsService,
  createAssetsService,
});
