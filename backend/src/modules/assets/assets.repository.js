const defaultPrisma = require("../../config/database");

function resolvePrismaClient(prismaClient) {
  return prismaClient || defaultPrisma;
}

const ASSET_SELECT = Object.freeze({
  id: true,
  assetCode: true,
  name: true,
  categoryId: true,
  locationId: true,
  ownerDepartmentId: true,
  locationX: true,
  locationY: true,
  serialNumber: true,
  purchaseDate: true,
  value: true,
  status: true,
  imageUrl: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  category: {
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
  ownerDepartment: {
    select: {
      id: true,
      name: true,
    },
  },
  assignments: {
    where: {
      status: "ACTIVE",
    },
    select: {
      id: true,
      employeeId: true,
      confirmedAt: true,
      signatureUrl: true,
      employee: {
        select: {
          id: true,
          fullName: true,
          departmentId: true,
          locationId: true,
          deskX: true,
          deskY: true,
          location: {
            select: {
              id: true,
              name: true,
              floorPlanUrl: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
});

function createAssetsRepository(prismaClient) {
  const activePrisma = resolvePrismaClient(prismaClient);

  return Object.freeze({
    async findAll(filters = {}) {
      const where = {};

      if (typeof filters.categoryId !== "undefined" && filters.categoryId !== null) {
        where.categoryId = Number(filters.categoryId);
      }

      if (typeof filters.status !== "undefined" && filters.status !== null) {
        where.status = filters.status;
      }

      if (typeof filters.departmentId !== "undefined" && filters.departmentId !== null) {
        where.assignments = {
          some: {
            status: "ACTIVE",
            employee: {
              departmentId: Number(filters.departmentId),
            },
          },
        };
      }

      if (typeof filters.employeeId !== "undefined" && filters.employeeId !== null && filters.employeeId !== "") {
        where.assignments = {
          some: {
            status: "ACTIVE",
            employeeId: filters.employeeId,
          },
        };
      }

      if (typeof filters.keyword !== "undefined" && filters.keyword !== "") {
        where.OR = [
          { name: { contains: filters.keyword } },
          { assetCode: { contains: filters.keyword } },
          { serialNumber: { contains: filters.keyword } },
        ];
      }

      return activePrisma.asset.findMany({
        where,
        orderBy: { assetCode: "asc" },
        select: ASSET_SELECT,
      });
    },

    async findById(id) {
      return activePrisma.asset.findUnique({
        where: { id },
        select: ASSET_SELECT,
      });
    },

    async findByAssetCode(assetCode) {
      return activePrisma.asset.findUnique({
        where: { assetCode },
        select: ASSET_SELECT,
      });
    },

    async create(data) {
      return activePrisma.asset.create({
        data: {
          assetCode: data.assetCode,
          name: data.name,
          categoryId: Number(data.categoryId),
          locationId: data.locationId ? Number(data.locationId) : null,
          ownerDepartmentId: data.ownerDepartmentId ? Number(data.ownerDepartmentId) : null,
          locationX: data.locationX !== undefined && data.locationX !== null ? Number(data.locationX) : null,
          locationY: data.locationY !== undefined && data.locationY !== null ? Number(data.locationY) : null,
          serialNumber: data.serialNumber ?? null,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
          value: data.value ?? null,
          status: data.status ?? "AVAILABLE",
          imageUrl: data.imageUrl ?? null,
          notes: data.notes ?? null,
        },
        select: ASSET_SELECT,
      });
    },

    async update(id, data) {
      const updateData = {};

      if (typeof data.name !== "undefined") updateData.name = data.name;
      if (typeof data.categoryId !== "undefined") updateData.categoryId = Number(data.categoryId);
      if (typeof data.locationId !== "undefined") updateData.locationId = data.locationId ? Number(data.locationId) : null;
      if (typeof data.ownerDepartmentId !== "undefined") updateData.ownerDepartmentId = data.ownerDepartmentId ? Number(data.ownerDepartmentId) : null;
      if (typeof data.locationX !== "undefined") updateData.locationX = data.locationX !== null ? Number(data.locationX) : null;
      if (typeof data.locationY !== "undefined") updateData.locationY = data.locationY !== null ? Number(data.locationY) : null;
      if (typeof data.serialNumber !== "undefined") updateData.serialNumber = data.serialNumber;
      if (typeof data.purchaseDate !== "undefined") updateData.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
      if (typeof data.value !== "undefined") updateData.value = data.value;
      if (typeof data.status !== "undefined") updateData.status = data.status;
      if (typeof data.imageUrl !== "undefined") updateData.imageUrl = data.imageUrl;
      if (typeof data.notes !== "undefined") updateData.notes = data.notes;

      return activePrisma.asset.update({
        where: { id },
        data: updateData,
        select: ASSET_SELECT,
      });
    },

    async delete(id) {
      return activePrisma.asset.delete({
        where: { id },
        select: ASSET_SELECT,
      });
    },

    async countActiveAssignments(id) {
      return activePrisma.assetAssignment.count({
        where: {
          assetId: id,
          status: "ACTIVE",
        },
      });
    },
  });
}

const assetsRepository = createAssetsRepository();

module.exports = Object.freeze({
  ...assetsRepository,
  createAssetsRepository,
  ASSET_SELECT,
});
