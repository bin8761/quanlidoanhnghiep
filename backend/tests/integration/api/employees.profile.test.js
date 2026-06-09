const { loadIntegrationHarness } = require("../helpers/integrationHarness");

describe("API integration: employee profile", () => {
  let harness;

  beforeEach(async () => {
    harness = await loadIntegrationHarness();

    // Mock Prisma model properties for employeeAttachment and employeeProfileLog
    harness.prisma.employeeAttachment = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    harness.prisma.employeeProfileLog = {
      findMany: jest.fn(),
      create: jest.fn(),
    };

    // Mock prisma.employee
    harness.prisma.employee = {
      findUnique: jest.fn(),
      update: jest.fn(),
    };
  });

  afterEach(() => {
    if (harness?.restoreEnv) {
      harness.restoreEnv();
    }
  });

  describe("GET /api/employees/:id", () => {
    test("allows own employee to retrieve their profile", async () => {
      const activeUser = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(activeUser);
      const employeeId = harness.seeds.ids.activeUserEmployeeId;

      const mockEmployee = {
        id: employeeId,
        employeeCode: "EMP-204",
        fullName: "Active User",
        email: "active.user@company.com",
        allowProfileUpdate: true,
      };

      harness.prisma.employee.findUnique.mockResolvedValue(mockEmployee);

      const response = await harness.request
        .get(`/api/employees/${employeeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(employeeId);
    });

    test("allows admin to retrieve any employee profile", async () => {
      const admin = harness.getUserById(harness.seeds.ids.adminUserId);
      const token = harness.signTokenForUser(admin);
      const employeeId = harness.seeds.ids.existingUserEmployeeId;

      const mockEmployee = {
        id: employeeId,
        employeeCode: "EMP-202",
        fullName: "Existing Employee",
        email: "existing.employee@company.com",
        allowProfileUpdate: true,
      };

      harness.prisma.employee.findUnique.mockResolvedValue(mockEmployee);

      const response = await harness.request
        .get(`/api/employees/${employeeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(employeeId);
    });

    test("rejects request if not own employee profile and not admin", async () => {
      const activeUser = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(activeUser);
      const otherEmployeeId = harness.seeds.ids.existingUserEmployeeId;

      const mockEmployee = {
        id: otherEmployeeId,
        employeeCode: "EMP-202",
        fullName: "Existing Employee",
        email: "existing.employee@company.com",
        allowProfileUpdate: true,
      };

      harness.prisma.employee.findUnique.mockResolvedValue(mockEmployee);

      const response = await harness.request
        .get(`/api/employees/${otherEmployeeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe("AUTH_FORBIDDEN");
    });
  });

  describe("PUT /api/employees/:id", () => {
    test("allows own employee to update personal fields", async () => {
      const activeUser = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(activeUser);
      const employeeId = harness.seeds.ids.activeUserEmployeeId;

      const oldEmployee = {
        id: employeeId,
        fullName: "Active User",
        email: "active.user@company.com",
        phone: "0901234567",
        allowProfileUpdate: true,
      };

      harness.prisma.employee.findUnique.mockResolvedValue(oldEmployee);
      harness.prisma.employee.update.mockResolvedValue({
        ...oldEmployee,
        phone: "0909999999",
      });

      const response = await harness.request
        .put(`/api/employees/${employeeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          fullName: "Active User",
          phone: "0909999999",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.phone).toBe("0909999999");
      expect(harness.prisma.employeeProfileLog.create).toHaveBeenCalled();
    });

    test("rejects own employee update if allowProfileUpdate is false", async () => {
      const activeUser = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(activeUser);
      const employeeId = harness.seeds.ids.activeUserEmployeeId;

      const oldEmployee = {
        id: employeeId,
        fullName: "Active User",
        email: "active.user@company.com",
        phone: "0901234567",
        allowProfileUpdate: false,
      };

      harness.prisma.employee.findUnique.mockResolvedValue(oldEmployee);

      const response = await harness.request
        .put(`/api/employees/${employeeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          phone: "0909999999",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("khóa");
    });

    test("rejects own employee update of protected job fields", async () => {
      const activeUser = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(activeUser);
      const employeeId = harness.seeds.ids.activeUserEmployeeId;

      const oldEmployee = {
        id: employeeId,
        fullName: "Active User",
        email: "active.user@company.com",
        position: "Developer",
        allowProfileUpdate: true,
      };

      harness.prisma.employee.findUnique.mockResolvedValue(oldEmployee);

      const response = await harness.request
        .put(`/api/employees/${employeeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          position: "Senior Developer",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("cố định");
    });

    test("allows admin to update protected job fields and toggle allowProfileUpdate", async () => {
      const admin = harness.getUserById(harness.seeds.ids.adminUserId);
      const token = harness.signTokenForUser(admin);
      const employeeId = harness.seeds.ids.activeUserEmployeeId;

      const oldEmployee = {
        id: employeeId,
        fullName: "Active User",
        email: "active.user@company.com",
        position: "Developer",
        allowProfileUpdate: true,
      };

      harness.prisma.employee.findUnique.mockResolvedValue(oldEmployee);
      harness.prisma.employee.update.mockResolvedValue({
        ...oldEmployee,
        position: "Senior Developer",
        allowProfileUpdate: false,
      });

      const response = await harness.request
        .put(`/api/employees/${employeeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          position: "Senior Developer",
          allowProfileUpdate: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.position).toBe("Senior Developer");
      expect(response.body.data.allowProfileUpdate).toBe(false);
    });
  });

  describe("Attachments & Logs Endpoints", () => {
    test("allows employee to fetch own attachments and profile logs", async () => {
      const activeUser = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(activeUser);
      const employeeId = harness.seeds.ids.activeUserEmployeeId;

      const mockAttachments = [{ id: "attach-1", fileName: "cv.pdf", fileType: "CV" }];
      const mockLogs = [{ id: "log-1", fieldName: "phone", oldValue: "A", newValue: "B" }];

      harness.prisma.employeeAttachment.findMany.mockResolvedValue(mockAttachments);
      harness.prisma.employeeProfileLog.findMany.mockResolvedValue(mockLogs);

      const attachRes = await harness.request
        .get(`/api/employees/${employeeId}/attachments`)
        .set("Authorization", `Bearer ${token}`);

      const logsRes = await harness.request
        .get(`/api/employees/${employeeId}/logs`)
        .set("Authorization", `Bearer ${token}`);

      expect(attachRes.status).toBe(200);
      expect(attachRes.body.data).toEqual(mockAttachments);

      expect(logsRes.status).toBe(200);
      expect(logsRes.body.data).toEqual(mockLogs);
    });

    test("allows employee to upload own attachment if allowProfileUpdate is true", async () => {
      const activeUser = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(activeUser);
      const employeeId = harness.seeds.ids.activeUserEmployeeId;

      const employee = { id: employeeId, allowProfileUpdate: true };
      harness.prisma.employee.findUnique.mockResolvedValue(employee);

      const payload = { fileName: "cert.pdf", fileType: "CERTIFICATE", fileUrl: "/uploads/cert.pdf" };
      const createdAttachment = { id: "attach-2", ...payload };
      harness.prisma.employeeAttachment.create.mockResolvedValue(createdAttachment);

      const response = await harness.request
        .post(`/api/employees/${employeeId}/attachments`)
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdAttachment);
    });

    test("allows employee to delete own attachment if allowProfileUpdate is true", async () => {
      const activeUser = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(activeUser);
      const employeeId = harness.seeds.ids.activeUserEmployeeId;

      const employee = { id: employeeId, allowProfileUpdate: true };
      harness.prisma.employee.findUnique.mockResolvedValue(employee);

      const attachment = { id: "attach-2", employeeId };
      harness.prisma.employeeAttachment.findUnique.mockResolvedValue(attachment);
      harness.prisma.employeeAttachment.delete.mockResolvedValue(attachment);

      const response = await harness.request
        .delete(`/api/employees/${employeeId}/attachments/attach-2`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
