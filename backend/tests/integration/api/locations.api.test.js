const { loadIntegrationHarness } = require("../helpers/integrationHarness");

describe("API integration: locations (interactive maps)", () => {
  let harness;

  beforeEach(async () => {
    harness = await loadIntegrationHarness();

    // Mock prisma model properties for location
    harness.prisma.location = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    harness.prisma.employee = {
      ...harness.prisma.employee,
      count: jest.fn().mockResolvedValue(0),
    };

    harness.prisma.asset = {
      ...harness.prisma.asset,
      count: jest.fn().mockResolvedValue(0),
    };
  });

  afterEach(() => {
    if (harness?.restoreEnv) {
      harness.restoreEnv();
    }
  });

  describe("GET /api/locations", () => {
    test("allows standard user to list locations", async () => {
      const user = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(user);
      const mockLocations = [
        { id: 1, name: "Văn phòng Tầng 1", floorPlanUrl: "http://example.com/map1.jpg" },
      ];
      harness.prisma.location.findMany.mockResolvedValue(mockLocations);

      const response = await harness.request
        .get("/api/locations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockLocations);
    });

    test("rejects request if not authenticated", async () => {
      const response = await harness.request.get("/api/locations");
      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/locations", () => {
    const payload = {
      name: "Phòng kỹ thuật",
      description: "Mô tả phòng",
      floorPlanUrl: "http://example.com/map.jpg",
    };

    test("allows ADMIN to create a location", async () => {
      const admin = harness.getUserById(harness.seeds.ids.adminUserId);
      const token = harness.signTokenForUser(admin);
      const mockCreated = { id: 2, ...payload };

      harness.prisma.location.findUnique.mockResolvedValue(null);
      harness.prisma.location.create.mockResolvedValue(mockCreated);

      const response = await harness.request
        .post("/api/locations")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCreated);
    });

    test("rejects USER with 403 Forbidden", async () => {
      const user = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(user);

      const response = await harness.request
        .post("/api/locations")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe("AUTH_FORBIDDEN");
    });
  });

  describe("PUT /api/locations/:id", () => {
    const payload = {
      name: "Phòng kỹ thuật mới",
      description: "Mô tả mới",
    };

    test("allows ADMIN to update a location", async () => {
      const admin = harness.getUserById(harness.seeds.ids.adminUserId);
      const token = harness.signTokenForUser(admin);
      const mockLocation = { id: 1, name: "Phòng cũ", floorPlanUrl: "http://example.com/map.jpg" };
      const mockUpdated = { ...mockLocation, ...payload };

      harness.prisma.location.findById = jest.fn().mockResolvedValue(mockLocation); // Mock of controller helper or repository
      harness.prisma.location.findUnique.mockImplementation(async ({ where }) => {
        if (where.id === 1) return mockLocation;
        if (where.name === payload.name) return null;
        return null;
      });
      harness.prisma.location.update.mockResolvedValue(mockUpdated);

      const response = await harness.request
        .put("/api/locations/1")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUpdated);
    });

    test("rejects USER with 403 Forbidden", async () => {
      const user = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(user);

      const response = await harness.request
        .put("/api/locations/1")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /api/locations/:id", () => {
    test("allows ADMIN to delete location when no assets/employees are assigned", async () => {
      const admin = harness.getUserById(harness.seeds.ids.adminUserId);
      const token = harness.signTokenForUser(admin);
      const mockLocation = { id: 1, name: "Phòng cũ", floorPlanUrl: "http://example.com/map.jpg" };

      harness.prisma.location.findUnique.mockResolvedValue(mockLocation);
      harness.prisma.employee.count.mockResolvedValue(0);
      harness.prisma.asset.count.mockResolvedValue(0);
      harness.prisma.location.delete.mockResolvedValue(mockLocation);

      const response = await harness.request
        .delete("/api/locations/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockLocation);
    });

    test("rejects deletion with 400 if employees are assigned", async () => {
      const admin = harness.getUserById(harness.seeds.ids.adminUserId);
      const token = harness.signTokenForUser(admin);
      const mockLocation = { id: 1, name: "Phòng cũ", floorPlanUrl: "http://example.com/map.jpg" };

      harness.prisma.location.findUnique.mockResolvedValue(mockLocation);
      harness.prisma.employee.count.mockResolvedValue(5); // 5 employees assigned

      const response = await harness.request
        .delete("/api/locations/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("rejects USER with 403 Forbidden", async () => {
      const user = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(user);

      const response = await harness.request
        .delete("/api/locations/1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });
});
