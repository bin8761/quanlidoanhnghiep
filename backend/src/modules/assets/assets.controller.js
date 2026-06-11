const assetsService = require("./assets.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

const assetsController = {
  async listAssets(req, res, next) {
    try {
      const { keyword, status, categoryId, departmentId, employeeId } = req.query;
      const assets = await assetsService.getAllAssets({
        keyword,
        status,
        categoryId: categoryId ? Number(categoryId) : undefined,
        departmentId: departmentId ? Number(departmentId) : undefined,
        employeeId,
      });

      return sendSuccess(res, {
        statusCode: 200,
        message: "Assets retrieved successfully",
        data: assets,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getAsset(req, res, next) {
    try {
      const { id } = req.params;
      const asset = await assetsService.getAssetById(id);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Asset retrieved successfully",
        data: asset,
      });
    } catch (error) {
      return next(error);
    }
  },

  async createAsset(req, res, next) {
    try {
      const created = await assetsService.createAsset(req.body);
      return sendSuccess(res, {
        statusCode: 201,
        message: "Asset created successfully",
        data: created,
      });
    } catch (error) {
      return next(error);
    }
  },

  async importAssets(req, res, next) {
    try {
      const result = await assetsService.importAssets(req.body.rows);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Asset import completed",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  },

  async updateAsset(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await assetsService.updateAsset(id, req.body);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Asset updated successfully",
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  },

  async deleteAsset(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await assetsService.deleteAsset(id);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Asset deleted successfully",
        data: deleted,
      });
    } catch (error) {
      return next(error);
    }
  },

  async uploadAssetImage(req, res, next) {
    try {
      const imageUrl = await assetsService.uploadImage(req.file);
      return sendSuccess(res, {
        statusCode: 200,
        message: "Image uploaded successfully",
        data: { imageUrl },
      });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = assetsController;
