describe("employees.service", () => {
  const EMPLOYEE_ID = "11111111-1111-4111-8111-111111111111";
  const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

  function loadEmployeesService({ repositoryOverrides = {}, deptRepositoryOverrides = {} } = {}) {
    jest.resetModules();

    const repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmployeeCode: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countAssignments: jest.fn(),
      hasUserAccount: jest.fn(),
      isEmployeeLinkedToUser: jest.fn(),
      ...repositoryOverrides,
    };

    const deptRepository = {
      findById: jest.fn(),
      ...deptRepositoryOverrides,
    };

    jest.doMock("../../../../src/modules/employees/employees.repository", () => repository);
    jest.doMock("../../../../src/modules/departments/departments.repository", () => deptRepository);

    const employeesServiceModule = require("../../../../src/modules/employees/employees.service");
    const employeesService = employeesServiceModule.createEmployeesService({
      repository,
      deptRepository,
    });

    return {
      employeesService,
      repository,
      deptRepository,
    };
  }

  test("getAllEmployees calls findAll on repository", async () => {
    const list = [{ id: EMPLOYEE_ID, fullName: "John Doe" }];
    const { employeesService, repository } = loadEmployeesService({
      repositoryOverrides: {
        findAll: jest.fn().mockResolvedValue(list),
      },
    });

    const result = await employeesService.getAllEmployees({ status: "ACTIVE" });
    expect(repository.findAll).toHaveBeenCalledWith({ status: "ACTIVE" });
    expect(result).toEqual(list);
  });

  test("getEmployeeById returns employee if requested by ADMIN", async () => {
    const emp = { id: EMPLOYEE_ID, fullName: "John Doe" };
    const { employeesService, repository } = loadEmployeesService({
      repositoryOverrides: {
        findById: jest.fn().mockResolvedValue(emp),
      },
    });

    const result = await employeesService.getEmployeeById(EMPLOYEE_ID, { role: "ADMIN" });
    expect(repository.findById).toHaveBeenCalledWith(EMPLOYEE_ID);
    expect(result).toEqual(emp);
  });

  test("getEmployeeById returns employee if requested by linked USER owner", async () => {
    const emp = { id: EMPLOYEE_ID, fullName: "John Doe" };
    const { employeesService, repository } = loadEmployeesService({
      repositoryOverrides: {
        findById: jest.fn().mockResolvedValue(emp),
        isEmployeeLinkedToUser: jest.fn().mockResolvedValue(true),
      },
    });

    const result = await employeesService.getEmployeeById(EMPLOYEE_ID, { role: "USER", userId: USER_ID });
    expect(repository.isEmployeeLinkedToUser).toHaveBeenCalledWith(EMPLOYEE_ID, USER_ID);
    expect(result).toEqual(emp);
  });

  test("getEmployeeById throws 403 Forbidden if requested by non-linked USER", async () => {
    const emp = { id: EMPLOYEE_ID, fullName: "John Doe" };
    const { employeesService, repository } = loadEmployeesService({
      repositoryOverrides: {
        findById: jest.fn().mockResolvedValue(emp),
        isEmployeeLinkedToUser: jest.fn().mockResolvedValue(false),
      },
    });

    await expect(
      employeesService.getEmployeeById(EMPLOYEE_ID, { role: "USER", userId: USER_ID }),
    ).rejects.toMatchObject({
      statusCode: 403,
      errorCode: "AUTH_FORBIDDEN",
    });
  });

  test("createEmployee throws validation error if employee code already exists", async () => {
    const data = { employeeCode: "EMP01", fullName: "John Doe", email: "john@company.com" };
    const { employeesService } = loadEmployeesService({
      repositoryOverrides: {
        findByEmployeeCode: jest.fn().mockResolvedValue({ id: EMPLOYEE_ID, employeeCode: "EMP01" }),
      },
    });

    await expect(employeesService.createEmployee(data)).rejects.toMatchObject({
      statusCode: 400,
      errorCode: "VALIDATION_ERROR",
    });
  });

  test("createEmployee throws validation error if email already exists", async () => {
    const data = { employeeCode: "EMP01", fullName: "John Doe", email: "john@company.com" };
    const { employeesService } = loadEmployeesService({
      repositoryOverrides: {
        findByEmployeeCode: jest.fn().mockResolvedValue(null),
        findByEmail: jest.fn().mockResolvedValue({ id: EMPLOYEE_ID, email: "john@company.com" }),
      },
    });

    await expect(employeesService.createEmployee(data)).rejects.toMatchObject({
      statusCode: 400,
      errorCode: "VALIDATION_ERROR",
    });
  });

  test("deleteEmployee throws validation error if employee has a user account", async () => {
    const emp = { id: EMPLOYEE_ID, fullName: "John Doe" };
    const { employeesService, repository } = loadEmployeesService({
      repositoryOverrides: {
        findById: jest.fn().mockResolvedValue(emp),
        hasUserAccount: jest.fn().mockResolvedValue(true),
      },
    });

    await expect(employeesService.deleteEmployee(EMPLOYEE_ID)).rejects.toMatchObject({
      statusCode: 400,
      errorCode: "VALIDATION_ERROR",
    });
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
