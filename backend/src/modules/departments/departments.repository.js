const defaultPrisma = require("../../config/database");

function resolvePrismaClient(prismaClient) {
  return prismaClient || defaultPrisma;
}

const DEPARTMENT_SELECT = Object.freeze({
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
});

function createDepartmentsRepository(prismaClient) {
  const activePrisma = resolvePrismaClient(prismaClient);

  return Object.freeze({
    async findAll() {
      return activePrisma.department.findMany({
        orderBy: { name: "asc" },
        select: DEPARTMENT_SELECT,
      });
    },

    async findById(id) {
      return activePrisma.department.findUnique({
        where: { id: Number(id) },
        select: DEPARTMENT_SELECT,
      });
    },

    async findByName(name) {
      return activePrisma.department.findUnique({
        where: { name },
        select: DEPARTMENT_SELECT,
      });
    },

    async create(data) {
      return activePrisma.department.create({
        data: {
          name: data.name,
          description: data.description ?? null,
        },
        select: DEPARTMENT_SELECT,
      });
    },

    async update(id, data) {
      return activePrisma.department.update({
        where: { id: Number(id) },
        data: {
          name: data.name,
          description: data.description,
        },
        select: DEPARTMENT_SELECT,
      });
    },

    async delete(id) {
      return activePrisma.department.delete({
        where: { id: Number(id) },
        select: DEPARTMENT_SELECT,
      });
    },

    async countEmployees(id) {
      return activePrisma.employee.count({
        where: { departmentId: Number(id) },
      });
    },
  });
}

const departmentsRepository = createDepartmentsRepository();

module.exports = Object.freeze({
  ...departmentsRepository,
  createDepartmentsRepository,
  DEPARTMENT_SELECT,
});
