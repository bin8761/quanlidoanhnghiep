const { createReportsService, escapeCsv } = require("../../../../src/modules/reports/reports.service");

describe("reports.service", () => {
  test("delegates summary filters to repository", async () => {
    const summary = { totalAssets: 10, operationalAssets: 8, utilizationRate: 50 };
    const repository = { getSummary: jest.fn().mockResolvedValue(summary) };
    const service = createReportsService({ reportsRepository: repository });
    await expect(service.getSummary({ status: "ASSIGNED" })).resolves.toEqual(summary);
    expect(repository.getSummary).toHaveBeenCalledWith({ status: "ASSIGNED" });
  });

  test("exports UTF-8 CSV and escapes commas and quotes", async () => {
    const repository = {
      getAssets: jest.fn().mockResolvedValue({
        items: [{
          assetCode: "AST-1", name: 'Laptop, "Pro"', status: "ASSIGNED", category: { name: "Laptop" },
          ownerDepartment: null, assignments: [], location: null, serialNumber: "SN-1", value: 1000,
        }],
        pagination: { totalPages: 1 },
      }),
    };
    const service = createReportsService({ reportsRepository: repository });
    const csv = await service.exportCsv({});
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Laptop, ""Pro"""');
    expect(csv).toContain("Chưa xác định");
  });

  test("escapeCsv keeps simple text and escapes line breaks", () => {
    expect(escapeCsv("simple")).toBe("simple");
    expect(escapeCsv("a\nb")).toBe('"a\nb"');
  });
});
