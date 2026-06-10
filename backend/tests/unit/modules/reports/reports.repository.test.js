const { buildAssetWhere } = require("../../../../src/modules/reports/reports.repository");

describe("reports.repository", () => {
  test("buildAssetWhere keeps snapshot filters independent from date range", () => {
    const where = buildAssetWhere({
      from: "2025-01-01",
      to: "2025-12-31",
      categoryId: 2,
      ownerDepartmentId: 3,
      usageDepartmentId: 4,
      locationId: 5,
      status: "ASSIGNED",
    });
    expect(where).toMatchObject({
      categoryId: 2,
      ownerDepartmentId: 3,
      locationId: 5,
      status: "ASSIGNED",
      assignments: { some: { status: "ACTIVE", employee: { departmentId: 4 } } },
    });
    expect(where.createdAt).toBeUndefined();
  });

  test("buildAssetWhere applies date range only for recorded asset trends", () => {
    expect(buildAssetWhere({ from: "2025-01-01", to: "2025-12-31" }, { includeRecordedAt: true })).toMatchObject({
      createdAt: {
        gte: new Date("2025-01-01T00:00:00.000Z"),
        lte: new Date("2025-12-31T23:59:59.999Z"),
      },
    });
  });
});
