const {
  createCategoryService,
} = require("../../../../src/modules/categories/category.service");
const ERROR_CODES = require("../../../../src/shared/errors/errorCodes");

function createRepository(overrides = {}) {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    ...overrides,
  };
}

describe("category.service", () => {
  test("lists categories using a trimmed search value", async () => {
    const categories = [{ id: "category-1", name: "Laptop" }];
    const repository = createRepository({
      findAll: jest.fn().mockResolvedValue(categories),
    });
    const service = createCategoryService({ repository });

    await expect(service.list("  lap  ")).resolves.toEqual(categories);
    expect(repository.findAll).toHaveBeenCalledWith("lap");
  });

  test("creates an active category with normalized data", async () => {
    const createdCategory = {
      id: "category-1",
      name: "Laptop",
      description: "Thiết bị di động",
      status: "ACTIVE",
    };
    const repository = createRepository({
      findByName: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(createdCategory),
    });
    const service = createCategoryService({ repository });

    await expect(
      service.create({
        name: "  Laptop  ",
        description: "  Thiết bị di động  ",
      }),
    ).resolves.toEqual(createdCategory);
    expect(repository.create).toHaveBeenCalledWith({
      name: "Laptop",
      description: "Thiết bị di động",
      status: "ACTIVE",
    });
  });

  test("rejects duplicate category names", async () => {
    const repository = createRepository({
      findByName: jest.fn().mockResolvedValue({
        id: "existing-category",
        name: "Laptop",
      }),
    });
    const service = createCategoryService({ repository });

    await expect(
      service.create({ name: "Laptop", description: null }),
    ).rejects.toMatchObject({
      statusCode: 409,
      errorCode: ERROR_CODES.CATEGORY_ALREADY_EXISTS,
    });
  });

  test("maps a Prisma unique constraint race to duplicate category error", async () => {
    const repository = createRepository({
      findByName: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockRejectedValue({ code: "P2002" }),
    });
    const service = createCategoryService({ repository });

    await expect(
      service.create({ name: "Laptop", description: null }),
    ).rejects.toMatchObject({
      statusCode: 409,
      errorCode: ERROR_CODES.CATEGORY_ALREADY_EXISTS,
    });
  });

  test("updates an existing category", async () => {
    const updatedCategory = {
      id: "category-1",
      name: "Laptop doanh nghiệp",
      description: null,
      status: "ACTIVE",
    };
    const repository = createRepository({
      findById: jest.fn().mockResolvedValue({
        id: "category-1",
        name: "Laptop",
      }),
      findByName: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(updatedCategory),
    });
    const service = createCategoryService({ repository });

    await expect(
      service.update("category-1", {
        name: " Laptop doanh nghiệp ",
        description: "",
      }),
    ).resolves.toEqual(updatedCategory);
    expect(repository.update).toHaveBeenCalledWith("category-1", {
      name: "Laptop doanh nghiệp",
      description: null,
    });
  });

  test("rejects updates for a missing category", async () => {
    const repository = createRepository({
      findById: jest.fn().mockResolvedValue(null),
    });
    const service = createCategoryService({ repository });

    await expect(
      service.update("missing-category", {
        name: "Laptop",
        description: null,
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      errorCode: ERROR_CODES.CATEGORY_NOT_FOUND,
    });
  });

  test("deletes an existing category", async () => {
    const repository = createRepository({
      findById: jest.fn().mockResolvedValue({
        id: "category-1",
        name: "Laptop",
      }),
      remove: jest.fn().mockResolvedValue(undefined),
    });
    const service = createCategoryService({ repository });

    await expect(service.remove("category-1")).resolves.toBeUndefined();
    expect(repository.remove).toHaveBeenCalledWith("category-1");
  });
});
