const { loadIntegrationHarness } = require("../helpers/integrationHarness");

describe("API integration: core management APIs (Person 2)", () => {
  let harness;

  beforeEach(async () => {
    harness = await loadIntegrationHarness();

    // Mock prisma properties for our new models on harness.prisma
    harness.prisma.department = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    harness.prisma.assetCategory = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    harness.prisma.asset = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn().mockResolvedValue([]),
    };

    // Also override employee to add count and other methods if needed
    harness.prisma.employee.findMany = jest.fn();
    harness.prisma.employee.findUnique = jest.fn().mockImplementation(async ({ where }) => {
      if (where.id) {
        return {
          id: where.id,
          employeeCode: "EMP-X",
          fullName: "Employee X",
          email: "x@company.com",
          status: "ACTIVE",
        };
      }
      return null;
    });
    harness.prisma.employee.create = jest.fn();
    harness.prisma.employee.update = jest.fn();
    harness.prisma.employee.delete = jest.fn();
    harness.prisma.employee.count = jest.fn();

    // Mock user findUnique as well
    harness.prisma.user.findUnique = jest.fn().mockImplementation(async ({ where, select }) => {
      if (select && select.employee) {
        return {
          employee: {
            id: harness.seeds.ids.activeUserEmployeeId || "active-employee-id",
            status: "ACTIVE",
          },
        };
      }
      if (where.id) {
        return { id: where.id, mustChangePassword: false };
      }
      if (where.employeeId) {
        if (where.employeeId === harness.seeds.ids.activeUserEmployeeId) {
          return { id: harness.seeds.ids.activeUserId, employeeId: where.employeeId, mustChangePassword: false };
        }
        if (where.employeeId === harness.seeds.ids.existingUserEmployeeId) {
          return { id: harness.seeds.ids.existingUserId || "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", employeeId: where.employeeId, mustChangePassword: false };
        }
      }
      return null;
    });

    // Mock active assignments count query
    harness.prisma.assetAssignment = {
      count: jest.fn().mockResolvedValue(0),
    };

    // Mock maintenance requests query
    harness.prisma.maintenanceRequest = {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    // Alias supportRequest to maintenanceRequest for test compatibility
    harness.prisma.supportRequest = harness.prisma.maintenanceRequest;

    // Mock department audit logs query
    harness.prisma.departmentAuditLog = {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    };

    // Mock department asset quotas query
    harness.prisma.departmentAssetQuota = {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn().mockResolvedValue([]),
    };
  });

  afterEach(() => {
    if (harness?.restoreEnv) {
      harness.restoreEnv();
    }
  });

  describe("Departments API", () => {
    test("GET /api/departments returns lists for authenticated user", async () => {
      const user = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(user);
      const mockList = [{ id: 1, name: "IT", description: "Information Technology" }];
      harness.prisma.department.findMany.mockResolvedValue(mockList);

      const response = await harness.request
        .get("/api/departments")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([
        { id: 1, name: "IT", description: "Information Technology", totalAssetValue: 0 }
      ]);
    });

    test("POST /api/departments allows ADMIN and rejects USER", async () => {
      const admin = harness.getUserById(harness.seeds.ids.adminUserId);
      const adminToken = harness.signTokenForUser(admin);
      const user = harness.getUserById(harness.seeds.ids.activeUserId);
      const userToken = harness.signTokenForUser(user);

      harness.prisma.department.findUnique.mockResolvedValue(null);
      harness.prisma.department.create.mockResolvedValue({ id: 1, code: "FIN", name: "Finance" });

      // Admin request
      const adminResponse = await harness.request
        .post("/api/departments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ code: "FIN", name: "Finance", description: "Finance Department" });

      expect(adminResponse.status).toBe(201);
      expect(adminResponse.body.data).toEqual({ id: 1, code: "FIN", name: "Finance" });

      // User request
      const userResponse = await harness.request
        .post("/api/departments")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ code: "FIN", name: "Finance" });

      expect(userResponse.status).toBe(403);
      expect(userResponse.body.success).toBe(false);
    });

    test("GET /api/departments/:id?detail=true returns detailed department", async () => {
      const user = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(user);
      const mockDetail = {
        id: 1,
        code: "IT",
        name: "IT",
        description: "Information Technology",
        managerId: "emp-1",
        manager: { id: "emp-1", fullName: "John Doe", email: "john@company.local" },
        employees: [{ id: "emp-2", fullName: "Jane Doe", position: "Dev" }],
        ownedAssets: [{ id: "asset-1", name: "Laptop", value: 15000000 }],
        _count: { employees: 1, ownedAssets: 1 }
      };

      harness.prisma.department.findUnique.mockResolvedValue(mockDetail);

      const response = await harness.request
        .get("/api/departments/1?detail=true")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("IT");
      expect(response.body.data.totalAssetValue).toBe(15000000);
      expect(response.body.data.employees).toHaveLength(1);
    });

    test("POST /api/departments rejects if manager employee not found", async () => {
      const admin = harness.getUserById(harness.seeds.ids.adminUserId);
      const token = harness.signTokenForUser(admin);

      harness.prisma.department.findUnique.mockResolvedValue(null);
      // Mock employee findUnique to return null for manager validation
      harness.prisma.employee.findUnique.mockResolvedValue(null);

      const response = await harness.request
        .post("/api/departments")
        .set("Authorization", `Bearer ${token}`)
        .send({ code: "RD", name: "R&D", managerId: "00000000-0000-0000-0000-000000000000" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Trưởng phòng được gán không tồn tại");
    });
  });

  describe("Categories API", () => {
    test("GET /api/categories returns lists for authenticated user", async () => {
      const user = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(user);
      const mockList = [{ id: 1, name: "Laptop", description: "Office Laptops" }];
      harness.prisma.assetCategory.findMany.mockResolvedValue(mockList);

      const response = await harness.request
        .get("/api/categories")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockList);
    });
  });

  describe("Employees API", () => {
    test("GET /api/employees rejects non-ADMIN", async () => {
      const user = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(user);

      const response = await harness.request
        .get("/api/employees")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    test("GET /api/employees/:id allows self owner and ADMIN", async () => {
      const activeEmployeeId = harness.seeds.ids.activeUserEmployeeId;
      const otherEmployeeId = harness.seeds.ids.existingUserEmployeeId;

      const activeUser = harness.getUserById(harness.seeds.ids.activeUserId);
      const activeUserToken = harness.signTokenForUser(activeUser);

      const adminUser = harness.getUserById(harness.seeds.ids.adminUserId);
      const adminToken = harness.signTokenForUser(adminUser);

      harness.prisma.employee.findUnique.mockImplementation(async ({ where }) => {
        if (where.id === activeEmployeeId) {
          return { id: activeEmployeeId, fullName: "Active User", email: "active.user@company.com" };
        }
        if (where.id === otherEmployeeId) {
          return { id: otherEmployeeId, fullName: "Existing Employee", email: "existing.employee@company.com" };
        }
        return null;
      });

      harness.prisma.user.findUnique.mockImplementation(async ({ where }) => {
        if (where.id) {
          return { id: where.id, mustChangePassword: false };
        }
        if (where.employeeId === activeEmployeeId) {
          return { id: activeUser.id, employeeId: activeEmployeeId, mustChangePassword: false };
        }
        if (where.employeeId === otherEmployeeId) {
          return { id: "other-user-id", employeeId: otherEmployeeId, mustChangePassword: false };
        }
        return null;
      });

      // Owner request - success
      const ownerResponse = await harness.request
        .get(`/api/employees/${activeEmployeeId}`)
        .set("Authorization", `Bearer ${activeUserToken}`);

      expect(ownerResponse.status).toBe(200);
      expect(ownerResponse.body.data.id).toBe(activeEmployeeId);

      // Other user request - forbidden
      const otherUserResponse = await harness.request
        .get(`/api/employees/${otherEmployeeId}`)
        .set("Authorization", `Bearer ${activeUserToken}`);

      expect(otherUserResponse.status).toBe(403);

      // Admin request on other employee - success
      const adminResponse = await harness.request
        .get(`/api/employees/${otherEmployeeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(adminResponse.status).toBe(200);
      expect(adminResponse.body.data.fullName).toBe("Existing Employee");
    });
  });

  describe("Assets API", () => {
    test("POST /api/assets validation check and creation", async () => {
      const admin = harness.getUserById(harness.seeds.ids.adminUserId);
      const token = harness.signTokenForUser(admin);

      harness.prisma.asset.findUnique.mockResolvedValue(null);
      harness.prisma.assetCategory.findUnique.mockResolvedValue({ id: 1, name: "Laptop" });
      harness.prisma.asset.create.mockResolvedValue({
        id: "asset-1-id",
        assetCode: "AST001",
        name: "MacBook Pro",
        categoryId: 1,
        status: "AVAILABLE",
      });

      const response = await harness.request
        .post("/api/assets")
        .set("Authorization", `Bearer ${token}`)
        .send({
          assetCode: "AST001",
          name: "MacBook Pro",
          categoryId: 1,
          serialNumber: "SN12345",
          value: 1500,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.assetCode).toBe("AST001");
    });
  });

  describe("Maintenance Requests API", () => {
    test("POST /api/maintenance-requests allows creation of NEW_ALLOCATION without assetId", async () => {
      const user = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(user);

      harness.prisma.maintenanceRequest.create.mockResolvedValue({
        id: "req-1-id",
        type: "NEW_ALLOCATION",
        assetId: null,
        description: "Need secondary monitor",
        status: "PENDING",
      });

      const response = await harness.request
        .post("/api/maintenance-requests")
        .set("Authorization", `Bearer ${token}`)
        .send({
          type: "NEW_ALLOCATION",
          description: "Need secondary monitor",
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe("NEW_ALLOCATION");
      expect(response.body.data.assetId).toBeNull();
    });

    test("POST /api/maintenance-requests rejects INCIDENT request without assetId", async () => {
      const user = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(user);

      const response = await harness.request
        .post("/api/maintenance-requests")
        .set("Authorization", `Bearer ${token}`)
        .send({
          type: "INCIDENT",
          description: "My laptop screen is broken",
        });

      expect(response.status).toBe(400);
    });
  });
});
