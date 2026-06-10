const repository = require("./reports.repository");

function escapeCsv(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function createReportsService({ reportsRepository = repository } = {}) {
  return Object.freeze({
    getSummary: (filters) => reportsRepository.getSummary(filters),
    getAssetsByCategory: (filters) => reportsRepository.getAssetsByCategory(filters),
    getAssetsByDepartment: (filters) => reportsRepository.getAssetsByDepartment(filters, filters.dimension),
    getTrends: (filters) => reportsRepository.getTrends(filters),
    getDataQuality: (filters) => reportsRepository.getDataQuality(filters),
    getAssets: (filters) => reportsRepository.getAssets(filters),
    async exportCsv(filters) {
      const firstPage = await reportsRepository.getAssets({ ...filters, page: 1, pageSize: 100 });
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(0, firstPage.pagination.totalPages - 1) }, (_, index) =>
          reportsRepository.getAssets({ ...filters, page: index + 2, pageSize: 100 })),
      );
      const items = [firstPage, ...remainingPages].flatMap((page) => page.items);
      const header = ["Mã tài sản", "Tên tài sản", "Trạng thái", "Danh mục", "Phòng ban sở hữu", "Phòng ban sử dụng", "Vị trí", "Serial", "Giá trị"];
      const rows = items.map((asset) => [
        asset.assetCode, asset.name, asset.status, asset.category?.name, asset.ownerDepartment?.name || "Chưa xác định",
        asset.assignments[0]?.employee?.department?.name || "Chưa xác định", asset.location?.name || "Chưa xác định",
        asset.serialNumber, asset.value,
      ]);
      return `\uFEFF${[header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n")}`;
    },
  });
}

module.exports = Object.freeze({ ...createReportsService(), createReportsService, escapeCsv });
