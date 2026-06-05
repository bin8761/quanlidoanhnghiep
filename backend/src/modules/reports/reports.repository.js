const defaultPrisma = require("../../config/database");

function createReportsRepository(prismaClient = defaultPrisma) {
  return Object.freeze({
    async getSummary() {
      const [totalAssets, assetsByStatus, activeAssignments, openMaintenanceRequests, inventorySessions] = await Promise.all([
        prismaClient.asset.count(),
        prismaClient.asset.groupBy({ by: ["status"], _count: { _all: true } }),
        prismaClient.assetAssignment.count({ where: { status: "ACTIVE" } }),
        prismaClient.maintenanceRequest.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
        prismaClient.inventorySession.count(),
      ]);

      return {
        totalAssets,
        activeAssignments,
        openMaintenanceRequests,
        inventorySessions,
        assetsByStatus: assetsByStatus.map((item) => ({ status: item.status, count: item._count._all })),
      };
    },

    async getAssetsByCategory() {
      const categories = await prismaClient.assetCategory.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          _count: { select: { assets: true } },
        },
      });

      return categories.map((category) => ({
        categoryId: category.id,
        categoryName: category.name,
        count: category._count.assets,
      }));
    },

    async getAssetsByDepartment() {
      const departments = await prismaClient.department.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          employees: {
            select: {
              assignments: {
                where: { status: "ACTIVE" },
                select: { id: true },
              },
            },
          },
        },
      });

      return departments.map((department) => ({
        departmentId: department.id,
        departmentName: department.name,
        count: department.employees.reduce((sum, employee) => sum + employee.assignments.length, 0),
      }));
    },
  });
}

const reportsRepository = createReportsRepository();

module.exports = Object.freeze({
  ...reportsRepository,
  createReportsRepository,
});
