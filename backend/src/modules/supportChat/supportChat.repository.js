const defaultPrisma = require("../../config/database");

const supportChatRepository = Object.freeze({
  async findActiveSessionByEmployeeId(employeeId, prisma = defaultPrisma) {
    return prisma.chatSession.findFirst({
      where: {
        employeeId,
        status: { in: ["BOT", "ACTIVE"] },
      },
    });
  },

  async createSession(employeeId, prisma = defaultPrisma) {
    return prisma.chatSession.create({
      data: {
        employeeId,
        status: "BOT",
      },
    });
  },

  async findSessionById(id, prisma = defaultPrisma) {
    return prisma.chatSession.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            position: true,
            status: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  },

  async listActiveSessions(prisma = defaultPrisma) {
    return prisma.chatSession.findMany({
      where: {
        status: { in: ["BOT", "ACTIVE"] },
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            position: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });
  },

  async updateSessionStatus(sessionId, status, prisma = defaultPrisma) {
    return prisma.chatSession.update({
      where: { id: sessionId },
      data: { status },
    });
  },

  async saveMessage(sessionId, senderType, senderId, message, prisma = defaultPrisma) {
    // Save the message and touch the session's updatedAt timestamp
    return prisma.$transaction(async (tx) => {
      const chatMessage = await tx.chatMessage.create({
        data: {
          sessionId,
          senderType,
          senderId,
          message,
        },
      });

      await tx.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });

      return chatMessage;
    });
  },

  async getSessionMessages(sessionId, prisma = defaultPrisma) {
    return prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });
  },

  async findEmployeeByUserId(userId, prisma = defaultPrisma) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        employeeId: true,
        employee: {
          select: { id: true, status: true },
        },
      },
    });
    if (user?.employee) return user.employee;
    if (user?.employeeId) {
      return prisma.employee.findUnique({
        where: { id: user.employeeId },
        select: { id: true, status: true },
      });
    }
    return null;
  },

  async getEmployeeContext(employeeId, prisma = defaultPrisma) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: { select: { name: true } },
        location: { select: { name: true } },
        assignments: {
          where: { status: "ACTIVE" },
          include: {
            asset: {
              select: {
                assetCode: true,
                name: true,
                serialNumber: true,
                status: true,
                purchaseDate: true,
                value: true,
              },
            },
          },
        },
        supportRequests: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            type: true,
            priority: true,
            status: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });
    return employee;
  },
});

module.exports = supportChatRepository;
