const categoryValidators = require("../../../../src/modules/categories/category.validator");

describe("category.validator", () => {
  test("accepts and normalizes a valid category payload", () => {
    const result = categoryValidators.create.body.parse({
      name: "  Laptop  ",
      description: "  Thiết bị di động  ",
    });

    expect(result).toEqual({
      name: "Laptop",
      description: "Thiết bị di động",
    });
  });

  test("normalizes an empty description to null", () => {
    const result = categoryValidators.create.body.parse({
      name: "Laptop",
      description: "",
    });

    expect(result.description).toBeNull();
  });

  test("rejects short category names", () => {
    expect(() =>
      categoryValidators.create.body.parse({
        name: "A",
      }),
    ).toThrow();
  });

  test("accepts an optional search query", () => {
    expect(categoryValidators.list.query.parse({})).toEqual({
      search: "",
    });
  });
});
