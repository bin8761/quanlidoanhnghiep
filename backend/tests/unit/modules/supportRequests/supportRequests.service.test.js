const { createSupportRequestsService } = require("../../../../src/modules/supportRequests/supportRequests.service");

const adminContext = { authenticatedUser: { userId: "admin-user-id", role: "ADMIN" } };
const userContext = { authenticatedUser: { userId: "employee-user-id", role: "USER" } };

function createRepository(overrides = {}) {
  return {
    findEmployeeByUserId: jest.fn().mockResolvedValue({ id: "employee-id", status: "ACTIVE" }),
    findEmployeeById: jest.fn().mockResolvedValue({ id: "employee-id", status: "ACTIVE" }),
    findAssetById: jest.fn().mockResolvedValue({ id: "asset-id", status: "ASSIGNED" }),
    hasActiveAssignment: jest.fn().mockResolvedValue(true),
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue({
      id: "request-id",
      type: "MAINTENANCE",
      status: "PENDING",
      requesterId: "employee-id",
      assetId: "asset-id",
    }),
    create: jest.fn().mockResolvedValue({ id: "request-id", type: "INCIDENT", status: "PENDING" }),
    updateStatus: jest.fn().mockResolvedValue({ id: "request-id", status: "IN_PROGRESS" }),
    fulfill: jest.fn().mockResolvedValue({ id: "request-id", status: "COMPLETED" }),
    ...overrides,
  };
}

function createNotifications() {
  return {
    notifySupportRequestCreated: jest.fn().mockResolvedValue([]),
    notifySupportRequestUpdated: jest.fn().mockResolvedValue(null),
  };
}

describe("supportRequests.service", () => {
  test("USER can create INCIDENT only for an actively assigned asset", async () => {
    const repository = createRepository();
    const service = createSupportRequestsService({ supportRepository: repository, notifications: createNotifications() });

    await service.create({
      type: "INCIDENT",
      priority: "HIGH",
      assetId: "asset-id",
      description: "Laptop screen is broken",
    }, userContext);

    expect(repository.hasActiveAssignment).toHaveBeenCalledWith("asset-id", "employee-id");
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "INCIDENT",
        priority: "HIGH",
        requesterId: "employee-id",
      }),
      { actorUserId: "employee-user-id" },
    );
  });

  test("USER cannot create INCIDENT for an asset they do not own", async () => {
    const repository = createRepository({ hasActiveAssignment: jest.fn().mockResolvedValue(false) });
    const service = createSupportRequestsService({ supportRepository: repository, notifications: createNotifications() });

    await expect(service.create({
      type: "INCIDENT",
      assetId: "asset-id",
      description: "Laptop screen is broken",
    }, userContext)).rejects.toMatchObject({ statusCode: 403 });
  });

  test("ADMIN can list all support requests without requester fan-out", async () => {
    const repository = createRepository();
    const service = createSupportRequestsService({ supportRepository: repository, notifications: createNotifications() });

    await service.getAll({ status: "PENDING" }, adminContext);

    expect(repository.findAll).toHaveBeenCalledWith({ status: "PENDING" });
  });

  test("terminal statuses require resolution", async () => {
    const repository = createRepository();
    const service = createSupportRequestsService({ supportRepository: repository, notifications: createNotifications() });

    await expect(service.updateStatus("request-id", { status: "REJECTED" }, adminContext))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test("fulfill requires type-specific assets", async () => {
    const repository = createRepository({
      findById: jest.fn().mockResolvedValue({
        id: "request-id",
        type: "NEW_ALLOCATION",
        status: "APPROVED",
        requesterId: "employee-id",
        assetId: null,
      }),
    });
    const service = createSupportRequestsService({ supportRepository: repository, notifications: createNotifications() });

    await expect(service.fulfill("request-id", { resolution: "Approved" }, adminContext))
      .rejects.toMatchObject({ statusCode: 400 });
  });
});
