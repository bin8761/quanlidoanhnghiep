const repository = require("./reports.repository");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

function escapeCsv(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function getAllAssetsForExport(filters) {
  const firstPage = await repository.getAssets({ ...filters, page: 1, pageSize: 100 });
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, firstPage.pagination.totalPages - 1) }, (_, index) =>
      repository.getAssets({ ...filters, page: index + 2, pageSize: 100 })),
  );
  return [firstPage, ...remainingPages].flatMap((page) => page.items);
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
      const items = await getAllAssetsForExport(filters);
      const header = ["Mã tài sản", "Tên tài sản", "Trạng thái", "Danh mục", "Phòng ban sở hữu", "Phòng ban sử dụng", "Vị trí", "Serial", "Giá trị"];
      const rows = items.map((asset) => [
        asset.assetCode, asset.name, asset.status, asset.category?.name, asset.ownerDepartment?.name || "Chưa xác định",
        asset.assignments[0]?.employee?.department?.name || "Chưa xác định", asset.location?.name || "Chưa xác định",
        asset.serialNumber, asset.value,
      ]);
      return `\uFEFF${[header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n")}`;
    },

    async exportXlsx(filters) {
      const items = await getAllAssetsForExport(filters);
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "EAM System";
      workbook.created = new Date();

      const sheet = workbook.addWorksheet("Báo cáo tài sản", {
        pageSetup: { fitToPage: true, fitToWidth: 1, orientation: "landscape" },
      });

      // Header styling
      const headerRow = sheet.addRow([
        "Mã tài sản", "Tên tài sản", "Trạng thái", "Danh mục",
        "Phòng ban sở hữu", "Phòng ban sử dụng", "Vị trí",
        "Serial Number", "Giá trị (VNĐ)", "Ngày mua",
      ]);
      headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B4332" } };
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 11 };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FF81B79A" } },
          left: { style: "thin", color: { argb: "FF81B79A" } },
          bottom: { style: "thin", color: { argb: "FF81B79A" } },
          right: { style: "thin", color: { argb: "FF81B79A" } },
        };
      });
      headerRow.height = 32;

      // Status color mapping
      const statusColors = {
        AVAILABLE: "FFD1FAE5",
        ASSIGNED: "FFDBEAFE",
        MAINTENANCE: "FFFEF3C7",
        BROKEN: "FFFEE2E2",
        LOST: "FFFCE7F3",
        DISPOSED: "FFF1F5F9",
      };

      // Data rows
      items.forEach((asset, index) => {
        const status = asset.status || "";
        const row = sheet.addRow([
          asset.assetCode,
          asset.name,
          status,
          asset.category?.name || "",
          asset.ownerDepartment?.name || "Chưa xác định",
          asset.assignments[0]?.employee?.department?.name || "Chưa xác định",
          asset.location?.name || "Chưa xác định",
          asset.serialNumber || "",
          asset.value ? Number(asset.value) : 0,
          asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString("vi-VN") : "",
        ]);

        const bgColor = statusColors[status] || "FFFFFFFF";
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
          cell.border = {
            top: { style: "thin", color: { argb: "FFDDDDDD" } },
            left: { style: "thin", color: { argb: "FFDDDDDD" } },
            bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
            right: { style: "thin", color: { argb: "FFDDDDDD" } },
          };
          cell.alignment = { vertical: "middle", wrapText: true };
        });

        // Value column numeric format
        const valueCell = row.getCell(9);
        valueCell.numFmt = '#,##0 "đ"';
        valueCell.alignment = { horizontal: "right", vertical: "middle" };

        row.height = 22;
      });

      // Set column widths
      sheet.columns = [
        { key: "code", width: 14 },
        { key: "name", width: 36 },
        { key: "status", width: 14 },
        { key: "category", width: 20 },
        { key: "ownerDept", width: 22 },
        { key: "usageDept", width: 22 },
        { key: "location", width: 20 },
        { key: "serial", width: 22 },
        { key: "value", width: 18 },
        { key: "purchaseDate", width: 14 },
      ];

      // Freeze header row
      sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];

      // Add summary sheet
      const summarySheet = workbook.addWorksheet("Tóm tắt");
      const totalValue = items.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
      const statusCounts = items.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {});

      summarySheet.addRow(["Thống kê tổng hợp"]).font = { bold: true, size: 14 };
      summarySheet.addRow([]);
      summarySheet.addRow(["Tổng số tài sản", items.length]);
      summarySheet.addRow(["Tổng giá trị", totalValue]).getCell(2).numFmt = '#,##0 "đ"';
      summarySheet.addRow([]);
      summarySheet.addRow(["Phân bổ theo trạng thái"]).font = { bold: true };
      Object.entries(statusCounts).forEach(([status, count]) => {
        summarySheet.addRow([status, count]);
      });
      summarySheet.addRow([]);
      summarySheet.addRow(["Ngày xuất báo cáo", new Date().toLocaleString("vi-VN")]);

      summarySheet.getColumn(1).width = 32;
      summarySheet.getColumn(2).width = 20;

      return workbook.xlsx.writeBuffer();
    },

    async exportPdf(filters) {
      const items = await getAllAssetsForExport(filters);
      const summary = await reportsRepository.getSummary(filters);

      return new Promise((resolve, reject) => {
        const chunks = [];
        const doc = new PDFDocument({
          margin: 40,
          size: "A4",
          layout: "landscape",
          info: {
            Title: "Báo cáo tài sản - EAM System",
            Author: "EAM System",
            Subject: "Asset Management Report",
          },
        });

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Try to use a bundled font, or system Arial on Mac, fallback to Helvetica
        let fontPath = path.join(__dirname, "../../shared/fonts/NotoSans-Regular.ttf");
        let boldFontPath = path.join(__dirname, "../../shared/fonts/NotoSans-Bold.ttf");
        let hasFonts = fs.existsSync(fontPath) && fs.existsSync(boldFontPath);
        
        if (!hasFonts) {
          const macArial = "/System/Library/Fonts/Supplemental/Arial.ttf";
          const macArialBold = "/System/Library/Fonts/Supplemental/Arial Bold.ttf";
          if (fs.existsSync(macArial) && fs.existsSync(macArialBold)) {
            fontPath = macArial;
            boldFontPath = macArialBold;
            hasFonts = true;
          }
        }

        if (hasFonts) {
          doc.registerFont("Regular", fontPath);
          doc.registerFont("Bold", boldFontPath);
        }

        const regularFont = hasFonts ? "Regular" : "Helvetica";
        const boldFont = hasFonts ? "Bold" : "Helvetica-Bold";

        const pageWidth = doc.page.width - 80; // margins
        const now = new Date().toLocaleString("vi-VN");

        // Header bar
        doc.rect(40, 40, pageWidth, 50).fill("#1B4332");
        doc.font(boldFont).fontSize(16).fillColor("#FFFFFF").text(
          hasFonts ? "BÁO CÁO TÀI SẢN - EAM SYSTEM" : "BAO CAO TAI SAN - EAM SYSTEM",
          52, 54, { align: "left" }
        );
        doc.font(regularFont).fontSize(9).fillColor("#81B79A").text(
          hasFonts ? `Xuất báo cáo: ${now}` : `Xuat bao cao: ${now}`,
          52, 74, { align: "left" }
        );

        // Summary metrics row
        const metricY = 108;
        const metricWidth = (pageWidth - 20) / 4;
        const metrics = [
          { label: hasFonts ? "Tổng tài sản" : "Tong tai san", value: String(summary.totalAssets) },
          { label: hasFonts ? "Tỷ lệ sử dụng" : "Ty le su dung", value: `${summary.utilizationRate}%` },
          { label: hasFonts ? "Tỷ lệ khả dụng" : "Ty le kha dung", value: `${summary.availabilityRate}%` },
          { label: hasFonts ? "Yêu cầu bảo trì" : "Yeu cau mo", value: String(summary.openMaintenanceRequests) },
        ];
        metrics.forEach((metric, i) => {
          const x = 40 + i * (metricWidth + 6);
          doc.rect(x, metricY, metricWidth, 44).fill(i % 2 === 0 ? "#F0FDF4" : "#EFF6FF").stroke("#E2E8F0");
          doc.font(boldFont).fontSize(18).fillColor("#1B4332").text(metric.value, x + 8, metricY + 6, { width: metricWidth - 16 });
          doc.font(regularFont).fontSize(8).fillColor("#64748B").text(metric.label, x + 8, metricY + 28, { width: metricWidth - 16 });
        });

        // Table header
        const tableY = 164;
        const colWidths = [80, 150, 80, 100, 110, 100, 90, 90];
        const colHeaders = hasFonts 
          ? ["Mã tài sản", "Tên tài sản", "Trạng thái", "Danh mục", "Phòng ban sở hữu", "Phòng ban sử dụng", "Vị trí", "Giá trị (VNĐ)"]
          : ["Ma tai san", "Ten tai san", "Trang thai", "Danh muc", "Phong ban", "Su dung", "Vi tri", "Gia tri (VND)"];

        doc.rect(40, tableY, pageWidth, 20).fill("#1B4332");
        let xPos = 40;
        colHeaders.forEach((header, i) => {
          doc.font(boldFont).fontSize(8).fillColor("#FFFFFF").text(header, xPos + 4, tableY + 5, { width: colWidths[i] - 8, ellipsis: true });
          xPos += colWidths[i];
        });

        // Table rows
        let rowY = tableY + 20;
        const rowHeight = 18;
        const statusAbbr = hasFonts
          ? { AVAILABLE: "Sẵn sàng", ASSIGNED: "Đã bàn giao", MAINTENANCE: "Bảo trì", BROKEN: "Hỏng hóc", LOST: "Thất lạc", DISPOSED: "Thanh lý" }
          : { AVAILABLE: "San sang", ASSIGNED: "Da ban giao", MAINTENANCE: "Bao tri", BROKEN: "Hong", LOST: "That lac", DISPOSED: "Thanh ly" };
        const statusFillColors = { AVAILABLE: "#D1FAE5", ASSIGNED: "#DBEAFE", MAINTENANCE: "#FEF3C7", BROKEN: "#FEE2E2", LOST: "#FCE7F3", DISPOSED: "#F1F5F9" };

        items.slice(0, 100).forEach((asset, idx) => {
          // Alternate rows
          if (idx % 2 === 0) {
            doc.rect(40, rowY, pageWidth, rowHeight).fill("#FAFAFA");
          }

          const status = asset.status || "";
          const statusColor = statusFillColors[status] || "#FFFFFF";
          doc.rect(40 + colWidths[0] + colWidths[1], rowY, colWidths[2], rowHeight).fill(statusColor);

          const cols = [
            asset.assetCode || "",
            asset.name || "",
            statusAbbr[status] || status,
            asset.category?.name || "",
            asset.ownerDepartment?.name || (hasFonts ? "Chưa xác định" : "Chua xac dinh"),
            asset.assignments[0]?.employee?.department?.name || (hasFonts ? "Chưa bàn giao" : "Chua ban giao"),
            asset.location?.name || (hasFonts ? "Chưa xác định" : "Chua xac dinh"),
            asset.value ? `${Number(asset.value).toLocaleString("vi-VN")}` : "0",
          ];

          xPos = 40;
          cols.forEach((col, i) => {
            doc.font(regularFont).fontSize(7).fillColor("#1E293B").text(String(col), xPos + 4, rowY + 5, { width: colWidths[i] - 8, ellipsis: true });
            xPos += colWidths[i];
          });

          rowY += rowHeight;

          // Add new page if needed
          if (rowY > doc.page.height - 60) {
            doc.addPage({ layout: "landscape", size: "A4" });
            rowY = 40;
          }
        });

        if (items.length > 100) {
          doc.font(regularFont).fontSize(8).fillColor("#64748B").text(
            hasFonts 
              ? `... và ${items.length - 100} tài sản khác. Vui lòng xuất Excel để xem đầy đủ.`
              : `... va ${items.length - 100} tai san khac. Vui long xuat Excel de xem day du.`,
            40, rowY + 8
          );
        }

        // Footer
        const footerY = doc.page.height - 30;
        doc.rect(40, footerY - 8, pageWidth, 20).fill("#F1F5F9");
        doc.font(regularFont).fontSize(7).fillColor("#94A3B8").text(
          hasFonts
            ? `Báo cáo được tạo tự động bởi EAM System • ${now} • Tổng: ${items.length} tài sản`
            : `Bao cao duoc tao tu dong boi EAM System • ${now} • Tong: ${items.length} tai san`,
          44, footerY - 2, { width: pageWidth - 8, align: "center" }
        );

        doc.end();
      });
    },
  });
}

module.exports = Object.freeze({ ...createReportsService(), createReportsService, escapeCsv });

