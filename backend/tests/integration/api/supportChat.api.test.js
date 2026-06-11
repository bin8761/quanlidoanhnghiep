const { loadIntegrationHarness } = require("../helpers/integrationHarness");

describe("API integration: supportChat", () => {
  let harness;

  beforeEach(async () => {
    harness = await loadIntegrationHarness();

    // Mock prisma model properties for support chat
    harness.prisma.chatSession = {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    harness.prisma.chatMessage = {
      findMany: jest.fn(),
      create: jest.fn(),
    };

    // Mock transaction
    harness.prisma.$transaction = jest.fn((callback) => callback(harness.prisma));
    
    // Mock user lookup on employee search
    harness.prisma.employee = {
      ...harness.prisma.employee,
      findUnique: jest.fn(),
    };
  });

  afterEach(() => {
    if (harness?.restoreEnv) {
      harness.restoreEnv();
    }
  });

  describe("POST /api/support-chat/messages", () => {
    test("allows standard active user to send a message and get response", async () => {
      const user = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(user);

      // Mock employee findByUserId
      harness.prisma.user.findUnique = jest.fn().mockResolvedValue({
        employeeId: harness.seeds.ids.activeUserEmployeeId,
        employee: { id: harness.seeds.ids.activeUserEmployeeId, status: "ACTIVE" },
      });

      // Mock finding active session (none found - will create)
      harness.prisma.chatSession.findFirst.mockResolvedValue(null);
      
      const mockSession = { id: "session-uuid-1", employeeId: harness.seeds.ids.activeUserEmployeeId, status: "BOT" };
      harness.prisma.chatSession.create.mockResolvedValue(mockSession);
      harness.prisma.chatSession.findUnique.mockResolvedValue(mockSession);

      // Mock save message
      const mockUserMsg = { id: "msg-1", sessionId: "session-uuid-1", senderType: "USER", message: "Hello", createdAt: new Date() };
      harness.prisma.chatMessage.create.mockResolvedValue(mockUserMsg);

      // Mock getEmployeeContext
      const mockEmployeeCtx = {
        id: harness.seeds.ids.activeUserEmployeeId,
        fullName: "Active User",
        email: "active.user@company.com",
        assignments: [],
        supportRequests: [],
      };
      harness.prisma.employee.findUnique.mockResolvedValue(mockEmployeeCtx);

      // Mock getSessionMessages (user msg, then bot fallback response)
      harness.prisma.chatMessage.findMany
        .mockResolvedValueOnce([mockUserMsg]) // first call during context compiling
        .mockResolvedValueOnce([
          mockUserMsg,
          { id: "msg-2", sessionId: "session-uuid-1", senderType: "BOT", message: "Hi! I am the EAM Assistant.", createdAt: new Date() }
        ]);

      const response = await harness.request
        .post("/api/support-chat/messages")
        .set("Authorization", `Bearer ${token}`)
        .send({ message: "Hello" });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[1].senderType).toBe("BOT");
    });

    test("rejects request if not authenticated", async () => {
      const response = await harness.request
        .post("/api/support-chat/messages")
        .send({ message: "Hello" });
      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/support-chat/admin/sessions", () => {
    test("allows ADMIN to list active chat sessions", async () => {
      const admin = harness.getUserById(harness.seeds.ids.adminUserId);
      const token = harness.signTokenForUser(admin);

      const mockSessions = [
        {
          id: "session-uuid-1",
          status: "ACTIVE",
          employee: { fullName: "Test Employee" },
          messages: [{ message: "Help me" }],
        },
      ];
      harness.prisma.chatSession.findMany.mockResolvedValue(mockSessions);

      const response = await harness.request
        .get("/api/support-chat/admin/sessions")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSessions);
    });

    test("rejects standard USER from listing admin sessions", async () => {
      const user = harness.getUserById(harness.seeds.ids.activeUserId);
      const token = harness.signTokenForUser(user);

      const response = await harness.request
        .get("/api/support-chat/admin/sessions")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });
});
