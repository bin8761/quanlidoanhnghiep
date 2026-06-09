const defaultPrisma = require("../../config/database");

const ISSUE_TYPES = Object.freeze({
  ASSIGNED_WITHOUT_ACTIVE_ASSIGNMENT: "ASSIGNED_WITHOUT_ACTIVE_ASSIGNMENT",
  ACTIVE_ASSIGNMENT_STATUS_MISMATCH: "ACTIVE_ASSIGNMENT_STATUS_MISMATCH",
  MULTIPLE_ACTIVE_ASSIGNMENTS: "MULTIPLE_ACTIVE_ASSIGNMENTS",
  INVALID_STATUS_WITH_ACTIVE_ASSIGNMENT: "INVALID_STATUS_WITH_ACTIVE_ASSIGNMENT",
  MISSING_OWNER_DEPARTMENT: "MISSING_OWNER_DEPARTMENT",
  MISSING_LOCATION: "MISSING_LOCATION",
  MISSING_SERIAL_NUMBER: "MISSING_SERIAL_NUMBER",
  DUPLICATE_SERIAL_NUMBER: "DUPLICATE_SERIAL_NUMBER",
});

function dateBounds(filters = {}) {
  const now = new Date();
  const defaultFrom = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), 1));
  return {
    from: filters.from ? new Date(`${filters.from}T00:00:00.000Z`) : defaultFrom,
    to: filters.to ? new Date(`${filters.to}T23:59:59.999Z`) : now,
  };
}

function buildAssetWhere(filters = {}) {
  const where = {};
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = new Date(`${filters.from}T00:00:00.000Z`);
    if (filters.to) where.createdAt.lte = new Date(`${filters.to}T23:59:59.999Z`);
  }
  if (filters.categoryId) where.categoryId = Number(filters.categoryId);
  if (filters.ownerDepartmentId) where.ownerDepartmentId = Number(filters.ownerDepartmentId);
  if (filters.locationId) where.locationId = Number(filters.locationId);
  if (filters.status) where.status = filters.status;
  if (filters.usageDepartmentId) {
    where.assignments = { some: { status: "ACTIVE", employee: { departmentId: Number(filters.usageDepartmentId) } } };
  }
  return where;
}

function issueWhere(issue) {
  switch (issue) {
    case ISSUE_TYPES.ASSIGNED_WITHOUT_ACTIVE_ASSIGNMENT:
      return { status: "ASSIGNED", assignments: { none: { status: "ACTIVE" } } };
    case ISSUE_TYPES.ACTIVE_ASSIGNMENT_STATUS_MISMATCH:
      return { status: { not: "ASSIGNED" }, assignments: { some: { status: "ACTIVE" } } };
    case ISSUE_TYPES.MULTIPLE_ACTIVE_ASSIGNMENTS:
      return null;
    case ISSUE_TYPES.INVALID_STATUS_WITH_ACTIVE_ASSIGNMENT:
      return { status: { in: ["LOST", "DISPOSED", "BROKEN", "MAINTENANCE"] }, assignments: { some: { status: "ACTIVE" } } };
    case ISSUE_TYPES.MISSING_OWNER_DEPARTMENT:
      return { ownerDepartmentId: null };
    case ISSUE_TYPES.MISSING_LOCATION:
      return { locationId: null };
    case ISSUE_TYPES.MISSING_SERIAL_NUMBER:
      return { OR: [{ serialNumber: null }, { serialNumber: "" }] };
    case ISSUE_TYPES.DUPLICATE_SERIAL_NUMBER:
      return null;
    default:
      return {};
  }
}

const ASSET_REPORT_SELECT = {
  id: true, assetCode: true, name: true, serialNumber: true, value: true, status: true,
  purchaseDate: true, createdAt: true,
  category: { select: { id: true, name: true } },
  ownerDepartment: { select: { id: true, name: true } },
  location: { select: { id: true, name: true } },
  assignments: {
    where: { status: "ACTIVE" },
    select: { id: true, employee: { select: { id: true, fullName: true, department: { select: { id: true, name: true } } } } },
  },
};

function createReportsRepository(prismaClient = defaultPrisma) {
  async function getSpecialIssueIds(issue, baseWhere) {
    if (issue === ISSUE_TYPES.MULTIPLE_ACTIVE_ASSIGNMENTS) {
      const groups = await prismaClient.assetAssignment.groupBy({
        by: ["assetId"], where: { status: "ACTIVE" }, _count: { _all: true }, having: { assetId: { _count: { gt: 1 } } },
      });
      return groups.map((item) => item.assetId);
    }
    if (issue === ISSUE_TYPES.DUPLICATE_SERIAL_NUMBER) {
      const groups = await prismaClient.asset.groupBy({
        by: ["serialNumber"], where: { ...baseWhere, serialNumber: { not: null } }, _count: { _all: true },
        having: { serialNumber: { _count: { gt: 1 } } },
      });
      return groups.map((item) => item.serialNumber).filter(Boolean);
    }
    return null;
  }

  async function countIssue(type, baseWhere) {
    const special = await getSpecialIssueIds(type, baseWhere);
    if (type === ISSUE_TYPES.DUPLICATE_SERIAL_NUMBER) {
      return special.length ? prismaClient.asset.count({ where: { ...baseWhere, serialNumber: { in: special } } }) : 0;
    }
    if (type === ISSUE_TYPES.MULTIPLE_ACTIVE_ASSIGNMENTS) return special.length;
    return prismaClient.asset.count({ where: { AND: [baseWhere, issueWhere(type)] } });
  }

  return Object.freeze({
    async getSummary(filters = {}) {
      const where = buildAssetWhere(filters);
      const { to } = dateBounds(filters);
      const openRequestWhere = { status: { in: ["PENDING", "APPROVED", "IN_PROGRESS", "WAITING_USER"] } };
      const [totalAssets, assetsByStatus, valueAggregate, activeAssignments, openMaintenanceRequests, inventorySessions,
        activeInventorySessions, overdueInventorySessions, overdueSupportRequests, dataQualityCounts] = await Promise.all([
        prismaClient.asset.count({ where }),
        prismaClient.asset.groupBy({ by: ["status"], where, _count: { _all: true } }),
        prismaClient.asset.aggregate({ where, _sum: { value: true } }),
        prismaClient.assetAssignment.count({ where: { status: "ACTIVE", asset: where } }),
        prismaClient.supportRequest.count({ where: openRequestWhere }),
        prismaClient.inventorySession.count(),
        prismaClient.inventorySession.count({ where: { status: "IN_PROGRESS" } }),
        prismaClient.inventorySession.count({ where: { status: { in: ["DRAFT", "IN_PROGRESS"] }, endDate: { lt: to } } }),
        prismaClient.supportRequest.count({ where: { ...openRequestWhere, createdAt: { lt: new Date(to.getTime() - 7 * 86400000) } } }),
        Promise.all(Object.values(ISSUE_TYPES).map((type) => countIssue(type, where))),
      ]);
      const counts = Object.fromEntries(assetsByStatus.map((item) => [item.status, item._count._all]));
      const operationalAssets = Math.max(0, totalAssets - (counts.DISPOSED || 0) - (counts.LOST || 0));
      const utilizationRate = operationalAssets ? Math.round(((counts.ASSIGNED || 0) / operationalAssets) * 100) : 0;
      const availabilityRate = operationalAssets ? Math.round(((counts.AVAILABLE || 0) / operationalAssets) * 100) : 0;
      return {
        totalAssets, operationalAssets, utilizationRate, availabilityRate,
        totalAssetValue: Number(valueAggregate._sum.value || 0),
        activeAssignments, openMaintenanceRequests, inventorySessions, activeInventorySessions,
        overdueInventorySessions, overdueSupportRequests,
        unhealthyAssets: (counts.MAINTENANCE || 0) + (counts.BROKEN || 0),
        dataQualityIssueCount: dataQualityCounts.reduce((sum, count) => sum + count, 0),
        assetsByStatus: assetsByStatus.map((item) => ({ status: item.status, count: item._count._all })),
      };
    },

    async getAssetsByCategory(filters = {}) {
      const rows = await prismaClient.asset.groupBy({ by: ["categoryId"], where: buildAssetWhere(filters), _count: { _all: true } });
      const categories = await prismaClient.assetCategory.findMany({ select: { id: true, name: true } });
      const names = new Map(categories.map((item) => [item.id, item.name]));
      return rows.map((row) => ({ categoryId: row.categoryId, categoryName: names.get(row.categoryId) || "Chưa xác định", count: row._count._all }));
    },

    async getAssetsByDepartment(filters = {}, dimension = "usage") {
      if (dimension === "owner") {
        const rows = await prismaClient.asset.groupBy({ by: ["ownerDepartmentId"], where: buildAssetWhere(filters), _count: { _all: true } });
        const departments = await prismaClient.department.findMany({ select: { id: true, name: true } });
        const names = new Map(departments.map((item) => [item.id, item.name]));
        return rows.map((row) => ({ departmentId: row.ownerDepartmentId, departmentName: names.get(row.ownerDepartmentId) || "Chưa xác định", count: row._count._all }));
      }
      const departments = await prismaClient.department.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, employees: { select: { assignments: { where: { status: "ACTIVE", asset: buildAssetWhere(filters) }, select: { id: true } } } } },
      });
      return departments.map((department) => ({ departmentId: department.id, departmentName: department.name, count: department.employees.reduce((sum, employee) => sum + employee.assignments.length, 0) }));
    },

    async getTrends(filters = {}) {
      const { from, to } = dateBounds(filters);
      const where = buildAssetWhere(filters);
      where.createdAt = { gte: from, lte: to };
      const assets = await prismaClient.asset.findMany({ where, select: { createdAt: true, status: true } });
      const months = new Map();
      for (const asset of assets) {
        const month = asset.createdAt.toISOString().slice(0, 7);
        const item = months.get(month) || { month, added: 0, disposed: 0, lost: 0 };
        item.added += 1;
        if (asset.status === "DISPOSED") item.disposed += 1;
        if (asset.status === "LOST") item.lost += 1;
        months.set(month, item);
      }
      return [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
    },

    async getDataQuality(filters = {}) {
      const where = buildAssetWhere(filters);
      return Promise.all(Object.values(ISSUE_TYPES).map(async (type) => ({ type, count: await countIssue(type, where) })));
    },

    async getAssets(filters = {}) {
      const baseWhere = buildAssetWhere(filters);
      let where = baseWhere;
      if (filters.issue) {
        const special = await getSpecialIssueIds(filters.issue, baseWhere);
        if (filters.issue === ISSUE_TYPES.MULTIPLE_ACTIVE_ASSIGNMENTS) where = { AND: [baseWhere, { id: { in: special } }] };
        else if (filters.issue === ISSUE_TYPES.DUPLICATE_SERIAL_NUMBER) where = { AND: [baseWhere, { serialNumber: { in: special } }] };
        else where = { AND: [baseWhere, issueWhere(filters.issue)] };
      }
      const page = Number(filters.page || 1);
      const pageSize = Number(filters.pageSize || 20);
      const [total, items] = await Promise.all([
        prismaClient.asset.count({ where }),
        prismaClient.asset.findMany({ where, select: ASSET_REPORT_SELECT, orderBy: { assetCode: "asc" }, skip: (page - 1) * pageSize, take: pageSize }),
      ]);
      return { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
    },
  });
}

module.exports = Object.freeze({ ...createReportsRepository(), createReportsRepository, ISSUE_TYPES, buildAssetWhere });
