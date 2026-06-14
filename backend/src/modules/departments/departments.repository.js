const defaultPrisma = require("../../config/database");

function resolvePrismaClient(prismaClient) {
  return prismaClient || defaultPrisma;
}

const DEPARTMENT_SELECT = Object.freeze({
  id: true,
  code: true,
  name: true,
  description: true,
  email: true,
  phone: true,
  establishedDate: true,
  branch: true,
  status: true,
  parentId: true,
  annualBudget: true,
  createdAt: true,
  updatedAt: true,
  managerId: true,
  manager: {
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      email: true,
      avatarUrl: true,
    }
  },
  parent: {
    select: {
      id: true,
      code: true,
      name: true,
    }
  },
  _count: {
    select: {
      employees: true,
      ownedAssets: true,
    }
  }
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

    async findByCode(code) {
      return activePrisma.department.findUnique({
        where: { code },
        select: DEPARTMENT_SELECT,
      });
    },

    async create(data) {
      return activePrisma.department.create({
        data: {
          code: data.code,
          name: data.name,
          description: data.description ?? null,
          managerId: data.managerId ?? null,
          email: data.email ?? null,
          phone: data.phone ?? null,
          establishedDate: data.establishedDate ?? null,
          branch: data.branch ?? null,
          status: data.status ?? "ACTIVE",
          parentId: data.parentId ?? null,
          annualBudget: data.annualBudget ?? 0.00,
        },
        select: DEPARTMENT_SELECT,
      });
    },

    async update(id, data) {
      return activePrisma.department.update({
        where: { id: Number(id) },
        data: {
          code: data.code,
          name: data.name,
          description: data.description,
          managerId: data.managerId,
          email: data.email,
          phone: data.phone,
          establishedDate: data.establishedDate,
          branch: data.branch,
          status: data.status,
          parentId: data.parentId,
          annualBudget: data.annualBudget,
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

    async countChildren(parentId) {
      return activePrisma.department.count({
        where: { parentId: Number(parentId) }
      });
    },

    async getAssetValueStats() {
      const stats = await activePrisma.asset.groupBy({
        by: ['ownerDepartmentId'],
        where: {
          ownerDepartmentId: { not: null }
        },
        _sum: {
          value: true
        }
      });
      return stats.reduce((acc, curr) => {
        acc[curr.ownerDepartmentId] = curr._sum.value ? Number(curr._sum.value) : 0;
        return acc;
      }, {});
    },

    async findByIdDetail(id) {
      const department = await activePrisma.department.findUnique({
        where: { id: Number(id) },
        include: {
          manager: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            }
          },
          parent: {
            select: {
              id: true,
              code: true,
              name: true,
            }
          },
          children: {
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
            }
          },
          employees: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              email: true,
              position: true,
              status: true,
              avatarUrl: true,
            },
            orderBy: { fullName: "asc" }
          },
          ownedAssets: {
            select: {
              id: true,
              assetCode: true,
              name: true,
              category: { select: { id: true, name: true } },
              status: true,
              value: true,
              serialNumber: true,
            },
            orderBy: { assetCode: "asc" }
          },
          quotas: {
            include: {
              category: { select: { id: true, name: true } }
            }
          },
          auditLogs: {
            include: {
              actor: {
                select: {
                  id: true,
                  email: true,
                  employee: {
                    select: {
                      fullName: true
                    }
                  }
                }
              }
            },
            orderBy: { createdAt: "desc" }
          },
          _count: {
            select: {
              employees: true,
              ownedAssets: true,
            }
          }
        }
      });

      if (!department) return null;

      const supportRequests = await activePrisma.supportRequest.findMany({
        where: {
          requester: {
            departmentId: Number(id)
          }
        },
        include: {
          requester: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true
            }
          },
          asset: {
            select: {
              id: true,
              name: true,
              assetCode: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      return {
        ...department,
        supportRequests
      };
    },

    async updateQuotas(id, quotas) {
      return activePrisma.$transaction(async (tx) => {
        await tx.departmentAssetQuota.deleteMany({
          where: { departmentId: Number(id) }
        });
        if (quotas && quotas.length > 0) {
          await tx.departmentAssetQuota.createMany({
            data: quotas.map(q => ({
              departmentId: Number(id),
              categoryId: Number(q.categoryId),
              maxQuantity: Number(q.maxQuantity)
            }))
          });
        }
        return tx.departmentAssetQuota.findMany({
          where: { departmentId: Number(id) },
          include: { category: { select: { id: true, name: true } } }
        });
      });
    },

    async createAuditLog(departmentId, actorId, action, details) {
      return activePrisma.departmentAuditLog.create({
        data: {
          departmentId: Number(departmentId),
          actorId,
          action,
          details: typeof details === 'string' ? details : JSON.stringify(details)
        }
      });
    }
  });
}

const departmentsRepository = createDepartmentsRepository();

module.exports = Object.freeze({
  ...departmentsRepository,
  createDepartmentsRepository,
  DEPARTMENT_SELECT,
});
