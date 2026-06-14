describe("assets.service", () => {
  const ASSET_ID = "22222222-2222-4222-8222-222222222222";

  function loadAssetsService({ repositoryOverrides = {}, catRepositoryOverrides = {}, deptRepositoryOverrides = {} } = {}) {
    jest.resetModules();

    const repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByAssetCode: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countActiveAssignments: jest.fn(),
      ...repositoryOverrides,
    };

    const catRepository = {
      findById: jest.fn(),
      ...catRepositoryOverrides,
    };
    const deptRepository = {
      findById: jest.fn(),
      ...deptRepositoryOverrides,
    };

    jest.doMock("../../../../src/modules/assets/assets.repository", () => repository);
    jest.doMock("../../../../src/modules/categories/categories.repository", () => catRepository);

    const assetsServiceModule = require("../../../../src/modules/assets/assets.service");
    const assetsService = assetsServiceModule.createAssetsService({
      repository,
      catRepository,
      deptRepository,
    });

    return {
      assetsService,
      repository,
      catRepository,
      deptRepository,
    };
  }

  test("getAllAssets calls findAll on repository", async () => {
    const list = [{ id: ASSET_ID, name: "Dell Laptop" }];
    const { assetsService, repository } = loadAssetsService({
      repositoryOverrides: {
        findAll: jest.fn().mockResolvedValue(list),
      },
    });

    const result = await assetsService.getAllAssets({ status: "AVAILABLE" });
    expect(repository.findAll).toHaveBeenCalledWith({ status: "AVAILABLE" });
    expect(result).toEqual([{ id: ASSET_ID, name: "Dell Laptop", resolvedLocation: null }]);
  });

  test("getAssetById returns asset if found", async () => {
    const asset = { id: ASSET_ID, name: "Dell Laptop" };
    const { assetsService, repository } = loadAssetsService({
      repositoryOverrides: {
        findById: jest.fn().mockResolvedValue(asset),
      },
    });

    const result = await assetsService.getAssetById(ASSET_ID);
    expect(repository.findById).toHaveBeenCalledWith(ASSET_ID);
    expect(result).toEqual({ id: ASSET_ID, name: "Dell Laptop", resolvedLocation: null });
  });

  test("getAssetById throws 404 AppError if not found", async () => {
    const { assetsService } = loadAssetsService({
      repositoryOverrides: {
        findById: jest.fn().mockResolvedValue(null),
      },
    });

    await expect(assetsService.getAssetById(ASSET_ID)).rejects.toMatchObject({
      statusCode: 404,
      errorCode: "ASSET_NOT_FOUND",
    });
  });

  test("createAsset throws validation error if asset code already exists", async () => {
    const data = { assetCode: "AST01", name: "Dell Laptop", categoryId: 1 };
    const { assetsService } = loadAssetsService({
      repositoryOverrides: {
        findByAssetCode: jest.fn().mockResolvedValue({ id: ASSET_ID, assetCode: "AST01" }),
      },
    });

    await expect(assetsService.createAsset(data)).rejects.toMatchObject({
      statusCode: 400,
      errorCode: "VALIDATION_ERROR",
    });
  });

  test("createAsset throws 404 if category does not exist", async () => {
    const data = { assetCode: "AST01", name: "Dell Laptop", categoryId: 99 };
    const { assetsService } = loadAssetsService({
      repositoryOverrides: {
        findByAssetCode: jest.fn().mockResolvedValue(null),
      },
      catRepositoryOverrides: {
        findById: jest.fn().mockResolvedValue(null),
      },
    });

    await expect(assetsService.createAsset(data)).rejects.toMatchObject({
      statusCode: 404,
      errorCode: "CATEGORY_NOT_FOUND",
    });
  });

  test("createAsset throws 404 if owner department does not exist", async () => {
    const data = { assetCode: "AST01", name: "Dell Laptop", categoryId: 1, ownerDepartmentId: 99 };
    const { assetsService } = loadAssetsService({
      repositoryOverrides: { findByAssetCode: jest.fn().mockResolvedValue(null) },
      catRepositoryOverrides: { findById: jest.fn().mockResolvedValue({ id: 1 }) },
      deptRepositoryOverrides: { findById: jest.fn().mockResolvedValue(null) },
    });
    await expect(assetsService.createAsset(data)).rejects.toMatchObject({
      statusCode: 404,
      errorCode: "DEPARTMENT_NOT_FOUND",
    });
  });

  test("importAssets returns row-level success and failure results", async () => {
    const rows = [
      { rowNumber: 2, assetCode: "AST01", name: "Laptop", categoryId: 1 },
      { rowNumber: 3, assetCode: "AST02", name: "Monitor", categoryId: 1 },
    ];
    const { assetsService, repository } = loadAssetsService({
      repositoryOverrides: {
        findByAssetCode: jest.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: ASSET_ID, assetCode: "AST02" }),
        create: jest.fn().mockResolvedValue({
          id: ASSET_ID,
          assetCode: "AST01",
          name: "Laptop",
        }),
      },
      catRepositoryOverrides: {
        findById: jest.fn().mockResolvedValue({ id: 1 }),
      },
    });

    const result = await assetsService.importAssets(rows);

    expect(result).toMatchObject({ total: 2, imported: 1, failed: 1 });
    expect(result.results).toEqual([
      expect.objectContaining({ rowNumber: 2, success: true, code: "AST01" }),
      expect.objectContaining({
        rowNumber: 3,
        success: false,
        code: "AST02",
        message: "Asset code already exists",
      }),
    ]);
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  test("updateAsset throws validation error if changing status from ASSIGNED while actively assigned", async () => {
    const asset = { id: ASSET_ID, name: "Dell Laptop", status: "ASSIGNED", categoryId: 1 };
    const data = { status: "AVAILABLE" };
    const { assetsService, repository } = loadAssetsService({
      repositoryOverrides: {
        findById: jest.fn().mockResolvedValue(asset),
        countActiveAssignments: jest.fn().mockResolvedValue(1),
      },
    });

    await expect(assetsService.updateAsset(ASSET_ID, data)).rejects.toMatchObject({
      statusCode: 400,
      errorCode: "VALIDATION_ERROR",
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  test("deleteAsset throws validation error if asset has active assignment", async () => {
    const asset = { id: ASSET_ID, name: "Dell Laptop", status: "ASSIGNED" };
    const { assetsService, repository } = loadAssetsService({
      repositoryOverrides: {
        findById: jest.fn().mockResolvedValue(asset),
        countActiveAssignments: jest.fn().mockResolvedValue(1),
      },
    });

    await expect(assetsService.deleteAsset(ASSET_ID)).rejects.toMatchObject({
      statusCode: 400,
      errorCode: "VALIDATION_ERROR",
    });
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
