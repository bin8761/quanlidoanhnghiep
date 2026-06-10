const service = require("./reports.service");
const { sendSuccess } = require("../../shared/response/apiResponse");

function action(method, message) {
  return async function reportAction(req, res, next) {
    try {
      const data = await service[method](req.query);
      return sendSuccess(res, { message, data });
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = Object.freeze({
  summary: action("getSummary", "Report summary retrieved successfully"),
  assetsByCategory: action("getAssetsByCategory", "Assets by category report retrieved successfully"),
  assetsByDepartment: action("getAssetsByDepartment", "Assets by department report retrieved successfully"),
  trends: action("getTrends", "Report trends retrieved successfully"),
  dataQuality: action("getDataQuality", "Data quality report retrieved successfully"),
  assets: action("getAssets", "Report assets retrieved successfully"),
  async exportCsv(req, res, next) {
    try {
      const csv = await service.exportCsv(req.query);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="asset-report.csv"');
      return res.status(200).send(csv);
    } catch (error) {
      return next(error);
    }
  },
  async exportXlsx(req, res, next) {
    try {
      const buffer = await service.exportXlsx(req.query);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="asset-report.xlsx"');
      return res.status(200).send(buffer);
    } catch (error) {
      return next(error);
    }
  },
  async exportPdf(req, res, next) {
    try {
      const buffer = await service.exportPdf(req.query);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="asset-report.pdf"');
      return res.status(200).send(buffer);
    } catch (error) {
      return next(error);
    }
  },
});

