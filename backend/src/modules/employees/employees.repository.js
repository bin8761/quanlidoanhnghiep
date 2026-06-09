const defaultPrisma = require("../../config/database");

function resolvePrismaClient(prismaClient) {
  return prismaClient || defaultPrisma;
}

const EMPLOYEE_SELECT = Object.freeze({
  id: true,
  employeeCode: true,
  fullName: true,
  email: true,
  departmentId: true,
  locationId: true,
  deskX: true,
  deskY: true,
  status: true,
  avatarUrl: true,
  position: true,
  joinDate: true,
  phone: true,
  personalEmail: true,
  dateOfBirth: true,
  gender: true,
  permanentAddress: true,
  currentAddress: true,
  emergencyContact: true,
  education: true,
  skills: true,
  certificates: true,
  hometown: true,
  ethnicity: true,
  nationality: true,
  identityCardNumber: true,
  allowProfileUpdate: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: {
      id: true,
      name: true,
    },
  },
  location: {
    select: {
      id: true,
      name: true,
      floorPlanUrl: true,
    },
  },
  user: {
    select: {
      role: true,
      isActive: true,
    },
  },
});

function createEmployeesRepository(prismaClient) {
  const activePrisma = resolvePrismaClient(prismaClient);

  return Object.freeze({
    async findAll(filters = {}) {
      const where = {};
      if (typeof filters.departmentId !== "undefined") {
        where.departmentId = Number(filters.departmentId);
      }
      if (typeof filters.status !== "undefined") {
        where.status = filters.status;
      }
      if (typeof filters.keyword !== "undefined" && filters.keyword !== "") {
        where.OR = [
          { fullName: { contains: filters.keyword } },
          { employeeCode: { contains: filters.keyword } },
          { email: { contains: filters.keyword } },
        ];
      }

      return activePrisma.employee.findMany({
        where,
        orderBy: { employeeCode: "asc" },
        select: EMPLOYEE_SELECT,
      });
    },

    async findById(id) {
      return activePrisma.employee.findUnique({
        where: { id },
        select: EMPLOYEE_SELECT,
      });
    },

    async findByEmployeeCode(employeeCode) {
      return activePrisma.employee.findUnique({
        where: { employeeCode },
        select: EMPLOYEE_SELECT,
      });
    },

    async findByEmail(email) {
      return activePrisma.employee.findUnique({
        where: { email },
        select: EMPLOYEE_SELECT,
      });
    },

    async create(data) {
      return activePrisma.employee.create({
        data: {
          employeeCode: data.employeeCode,
          fullName: data.fullName,
          email: data.email,
          departmentId: data.departmentId ? Number(data.departmentId) : null,
          status: data.status ?? "ACTIVE",
          avatarUrl: data.avatarUrl ?? null,
          position: data.position ?? "Staff",
          joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
          phone: data.phone ?? null,
          personalEmail: data.personalEmail ?? null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender ?? null,
          permanentAddress: data.permanentAddress ?? null,
          currentAddress: data.currentAddress ?? null,
          emergencyContact: data.emergencyContact ?? null,
          education: data.education ?? null,
          skills: data.skills ?? null,
          certificates: data.certificates ?? null,
          hometown: data.hometown ?? null,
          ethnicity: data.ethnicity ?? null,
          nationality: data.nationality ?? null,
          identityCardNumber: data.identityCardNumber ?? null,
          allowProfileUpdate: data.allowProfileUpdate ?? true,
        },
        select: EMPLOYEE_SELECT,
      });
    },

    async update(id, data) {
      const updateData = {};
      const fields = [
        "fullName", "email", "status",
        "avatarUrl", "position", "phone", "personalEmail",
        "gender", "permanentAddress", "currentAddress",
        "emergencyContact", "education", "skills", "certificates",
        "hometown", "ethnicity", "nationality", "identityCardNumber",
        "allowProfileUpdate"
      ];
      for (const field of fields) {
        if (typeof data[field] !== "undefined") {
          updateData[field] = data[field];
        }
      }

      if (typeof data.departmentId !== "undefined") {
        updateData.departmentId = data.departmentId ? Number(data.departmentId) : null;
      }

      if (typeof data.locationId !== "undefined") {
        updateData.locationId = data.locationId ? Number(data.locationId) : null;
      }

      if (typeof data.deskX !== "undefined") {
        updateData.deskX = data.deskX !== null ? Number(data.deskX) : null;
      }

      if (typeof data.deskY !== "undefined") {
        updateData.deskY = data.deskY !== null ? Number(data.deskY) : null;
      }

      if (typeof data.joinDate !== "undefined") {
        updateData.joinDate = data.joinDate ? new Date(data.joinDate) : null;
      }

      if (typeof data.dateOfBirth !== "undefined") {
        updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
      }

      return activePrisma.employee.update({
        where: { id },
        data: updateData,
        select: EMPLOYEE_SELECT,
      });
    },

    async delete(id) {
      return activePrisma.employee.delete({
        where: { id },
        select: EMPLOYEE_SELECT,
      });
    },

    async countAssignments(id) {
      return activePrisma.assetAssignment.count({
        where: {
          employeeId: id,
          status: "ACTIVE",
        },
      });
    },

    async hasUserAccount(id) {
      const user = await activePrisma.user.findUnique({
        where: { employeeId: id },
        select: { id: true },
      });
      return Boolean(user);
    },

    async isEmployeeLinkedToUser(employeeId, userId) {
      const user = await activePrisma.user.findUnique({
        where: { employeeId },
        select: { id: true },
      });
      return Boolean(user && user.id === userId);
    },

    // Attachments methods
    async findAttachmentsByEmployeeId(employeeId) {
      return activePrisma.employeeAttachment.findMany({
        where: { employeeId },
        orderBy: { uploadedAt: "desc" },
        include: {
          uploadedBy: {
            select: {
              email: true,
              role: true,
            },
          },
        },
      });
    },

    async findAttachmentById(id) {
      return activePrisma.employeeAttachment.findUnique({
        where: { id },
      });
    },

    async createAttachment(data) {
      return activePrisma.employeeAttachment.create({
        data: {
          employeeId: data.employeeId,
          fileName: data.fileName,
          fileType: data.fileType,
          fileUrl: data.fileUrl,
          uploadedById: data.uploadedById,
        },
        include: {
          uploadedBy: {
            select: {
              email: true,
              role: true,
            },
          },
        },
      });
    },

    async deleteAttachment(id) {
      return activePrisma.employeeAttachment.delete({
        where: { id },
      });
    },

    // Logs methods
    async findProfileLogsByEmployeeId(employeeId) {
      return activePrisma.employeeProfileLog.findMany({
        where: { employeeId },
        orderBy: { changedAt: "desc" },
        include: {
          actor: {
            select: {
              email: true,
              role: true,
              employee: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      });
    },

    async createProfileLog(data) {
      return activePrisma.employeeProfileLog.create({
        data: {
          employeeId: data.employeeId,
          actorId: data.actorId,
          fieldName: data.fieldName,
          oldValue: data.oldValue ? String(data.oldValue) : null,
          newValue: data.newValue ? String(data.newValue) : null,
        },
      });
    },
  });
}

const employeesRepository = createEmployeesRepository();

module.exports = Object.freeze({
  ...employeesRepository,
  createEmployeesRepository,
  EMPLOYEE_SELECT,
});
