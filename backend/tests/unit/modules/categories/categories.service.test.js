describe("categories.service", () => {
  function loadCategoriesService({ repositoryOverrides = {} } = {}) {
    jest.resetModules();

    const repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countAssets: jest.fn(),
      ...repositoryOverrides,
    };

    jest.doMock("../../../../src/modules/categories/categories.repository", () => repository);

    const categoriesServiceModule = require("../../../../src/modules/categories/categories.service");
    const categoriesService = categoriesServiceModule.createCategoriesService({ repository });

    return {
      categoriesService,
      repository,
    };
  }

  test("getAllCategories calls findAll on repository", async () => {
    const list = [{ id: 1, name: "Laptop" }];
    const { categoriesService, repository } = loadCategoriesService({
      repositoryOverrides: {
        findAll: jest.fn().mockResolvedValue(list),
      },
    });

    const result = await categoriesService.getAllCategories();
    expect(repository.findAll).toHaveBeenCalled();
    expect(result).toEqual(list);
  });

  test("getCategoryById returns category if found", async () => {
    const cat = { id: 1, name: "Laptop" };
    const { categoriesService, repository } = loadCategoriesService({
      repositoryOverrides: {
        findById: jest.fn().mockResolvedValue(cat),
      },
    });

    const result = await categoriesService.getCategoryById(1);
    expect(repository.findById).toHaveBeenCalledWith(1);
    expect(result).toEqual(cat);
  });

  test("getCategoryById throws 404 AppError if not found", async () => {
    const { categoriesService } = loadCategoriesService({
      repositoryOverrides: {
        findById: jest.fn().mockResolvedValue(null),
      },
    });

    await expect(categoriesService.getCategoryById(999)).rejects.toMatchObject({
      statusCode: 404,
      errorCode: "CATEGORY_NOT_FOUND",
    });
  });

  test("createCategory creates category if name is unique", async () => {
    const data = { name: "Printer", description: "Office printers" };
    const created = { id: 2, ...data };
    const { categoriesService, repository } = loadCategoriesService({
      repositoryOverrides: {
        findByName: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(created),
      },
    });

    const result = await categoriesService.createCategory(data);
    expect(repository.findByName).toHaveBeenCalledWith("Printer");
    expect(repository.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(created);
  });

  test("createCategory throws validation error if name already exists", async () => {
    const data = { name: "Laptop" };
    const { categoriesService } = loadCategoriesService({
      repositoryOverrides: {
        findByName: jest.fn().mockResolvedValue({ id: 1, name: "Laptop" }),
      },
    });

    await expect(categoriesService.createCategory(data)).rejects.toMatchObject({
      statusCode: 400,
      errorCode: "VALIDATION_ERROR",
    });
  });

  test("deleteCategory deletes category if it has no assets", async () => {
    const cat = { id: 1, name: "Laptop" };
    const { categoriesService, repository } = loadCategoriesService({
      repositoryOverrides: {
        findById: jest.fn().mockResolvedValue(cat),
        countAssets: jest.fn().mockResolvedValue(0),
        delete: jest.fn().mockResolvedValue(cat),
      },
    });

    const result = await categoriesService.deleteCategory(1);
    expect(repository.findById).toHaveBeenCalledWith(1);
    expect(repository.countAssets).toHaveBeenCalledWith(1);
    expect(repository.delete).toHaveBeenCalledWith(1);
    expect(result).toEqual(cat);
  });

  test("deleteCategory throws validation error if category has associated assets", async () => {
    const cat = { id: 1, name: "Laptop" };
    const { categoriesService, repository } = loadCategoriesService({
      repositoryOverrides: {
        findById: jest.fn().mockResolvedValue(cat),
        countAssets: jest.fn().mockResolvedValue(10),
      },
    });

    await expect(categoriesService.deleteCategory(1)).rejects.toMatchObject({
      statusCode: 400,
      errorCode: "VALIDATION_ERROR",
    });
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
