const repository = require("./reports.repository");

function createReportsService({ reportsRepository = repository } = {}) {
  return Object.freeze({
    getSummary() {
      return reportsRepository.getSummary();
    },
    getAssetsByCategory() {
      return reportsRepository.getAssetsByCategory();
    },
    getAssetsByDepartment() {
      return reportsRepository.getAssetsByDepartment();
    },
  });
}

const service = createReportsService();

module.exports = Object.freeze({
  ...service,
  createReportsService,
});
