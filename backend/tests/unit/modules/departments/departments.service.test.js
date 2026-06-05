describe("departments.service", () => {
  function loadDepartmentsService({ repositoryOverrides = {} } = {}) {
    jest.resetModules();

    const repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countEmployees: jest.fn(),
      ...repositoryOverrides,
    };

    jest.doMock("../../../../src/modules/departments/departments.repository", () => repository);

    const departmentsServiceModule = require("../../../../src/modules/departments/departments.service");
    const departmentsService = departmentsServiceModule.createDepartmentsService({ repository });

    return {
      departmentsService,
      repository,
    };
  }

  test("getAllDepartments calls findAll on repository", async () => {
    const list = [{ id: 1, name: "IT" }];
    const { departmentsService, repository } = loadDepartmentsService({
      repositoryOverrides: {
        findAll: jest.fn().mockResolvedValue(list),
      },
    });

    const result = await departmentsService.getAllDepartments();
    expect(repository.findAll).toHaveBeenCalled();
    expect(result).toEqual(list);
  });

  test("getDepartmentById returns department if found", async () => {
    const dept = { id: 1, name: "IT" };
    const { departmentsService, repository } = loadDepartmentsService({
      repositoryOverrides: {
        findById: jest.fn().mockResolvedValue(dept),
      },
    });

    const result = await departmentsService.getDepartmentById(1);
    expect(repository.findById).toHaveBeenCalledWith(1);
    expect(result).toEqual(dept);
  });

  test("getDepartmentById throws 404 AppError if not found", async () => {
    const { departmentsService } = loadDepartmentsService({
      repositoryOverrides: {
        findById: jest.fn().mockResolvedValue(null),
      },
    });

    await expect(departmentsService.getDepartmentById(999)).rejects.toMatchObject({
      statusCode: 404,
      errorCode: "DEPARTMENT_NOT_FOUND",
    });
  });

  test("createDepartment creates department if name is unique", async () => {
    const data = { name: "HR", description: "Human Resources" };
    const created = { id: 2, ...data };
    const { departmentsService, repository } = loadDepartmentsService({
      repositoryOverrides: {
        findByName: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(created),
      },
    });

    const result = await departmentsService.createDepartment(data);
    expect(repository.findByName).toHaveBeenCalledWith("HR");
    expect(repository.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(created);
  });

  test("createDepartment throws validation error if name already exists", async () => {
    const data = { name: "HR" };
    const { departmentsService } = loadDepartmentsService({
      repositoryOverrides: {
        findByName: jest.fn().mockResolvedValue({ id: 2, name: "HR" }),
      },
    });

    await expect(departmentsService.createDepartment(data)).rejects.toMatchObject({
      statusCode: 400,
      errorCode: "VALIDATION_ERROR",
    });
  });

  test("deleteDepartment deletes department if it has no employees", async () => {
    const dept = { id: 1, name: "IT" };
    const { departmentsService, repository } = loadDepartmentsService({
      repositoryOverrides: {
        findById: jest.fn().mockResolvedValue(dept),
        countEmployees: jest.fn().mockResolvedValue(0),
        delete: jest.fn().mockResolvedValue(dept),
      },
    });

    const result = await departmentsService.deleteDepartment(1);
    expect(repository.findById).toHaveBeenCalledWith(1);
    expect(repository.countEmployees).toHaveBeenCalledWith(1);
    expect(repository.delete).toHaveBeenCalledWith(1);
    expect(result).toEqual(dept);
  });

  test("deleteDepartment throws validation error if department has active employees", async () => {
    const dept = { id: 1, name: "IT" };
    const { departmentsService, repository } = loadDepartmentsService({
      repositoryOverrides: {
        findById: jest.fn().mockResolvedValue(dept),
        countEmployees: jest.fn().mockResolvedValue(5),
      },
    });

    await expect(departmentsService.deleteDepartment(1)).rejects.toMatchObject({
      statusCode: 400,
      errorCode: "VALIDATION_ERROR",
    });
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
