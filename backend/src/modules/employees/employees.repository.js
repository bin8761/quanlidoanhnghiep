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
  status: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: {
      id: true,
      name: true,
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
        },
        select: EMPLOYEE_SELECT,
      });
    },

    async update(id, data) {
      const updateData = {
        fullName: data.fullName,
        email: data.email,
        status: data.status,
      };

      if (typeof data.departmentId !== "undefined") {
        updateData.departmentId = data.departmentId ? Number(data.departmentId) : null;
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
  });
}

const employeesRepository = createEmployeesRepository();

module.exports = Object.freeze({
  ...employeesRepository,
  createEmployeesRepository,
  EMPLOYEE_SELECT,
});
