const validators = require("../../../../src/modules/reports/reports.validator");

describe("reports.validator", () => {
  test("accepts a range within 24 months", () => {
    expect(validators.common.query.parse({ from: "2025-01-01", to: "2026-01-01" })).toEqual({
      from: "2025-01-01", to: "2026-01-01",
    });
  });

  test("rejects a range over 24 months", () => {
    expect(() => validators.common.query.parse({ from: "2023-01-01", to: "2026-01-02" })).toThrow();
  });

  test("coerces pagination and department dimension", () => {
    expect(validators.assets.query.parse({ page: "2", pageSize: "50" })).toMatchObject({ page: 2, pageSize: 50 });
    expect(validators.department.query.parse({})).toMatchObject({ dimension: "usage" });
  });
});
