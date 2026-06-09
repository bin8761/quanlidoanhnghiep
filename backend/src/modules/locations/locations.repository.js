const defaultPrisma = require("../../config/database");

function resolvePrismaClient(prismaClient) {
  return prismaClient || defaultPrisma;
}

const LOCATION_SELECT = Object.freeze({
  id: true,
  name: true,
  description: true,
  floorPlanUrl: true,
  createdAt: true,
  updatedAt: true,
});

function createLocationsRepository(prismaClient) {
  const activePrisma = resolvePrismaClient(prismaClient);

  return Object.freeze({
    async findAll() {
      return activePrisma.location.findMany({
        orderBy: { name: "asc" },
        select: LOCATION_SELECT,
      });
    },

    async findById(id) {
      return activePrisma.location.findUnique({
        where: { id: Number(id) },
        include: {
          employees: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
              deskX: true,
              deskY: true,
              assignments: {
                where: { status: "ACTIVE" },
                select: {
                  id: true,
                  assetId: true,
                  asset: {
                    select: {
                      id: true,
                      name: true,
                      assetCode: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
          assets: {
            select: {
              id: true,
              name: true,
              assetCode: true,
              status: true,
              locationX: true,
              locationY: true,
              category: {
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

    async findByName(name) {
      return activePrisma.location.findUnique({
        where: { name },
        select: LOCATION_SELECT,
      });
    },

    async create(data) {
      return activePrisma.location.create({
        data: {
          name: data.name,
          description: data.description ?? null,
          floorPlanUrl: data.floorPlanUrl,
        },
        select: LOCATION_SELECT,
      });
    },

    async update(id, data) {
      return activePrisma.location.update({
        where: { id: Number(id) },
        data: {
          name: data.name,
          description: data.description,
          floorPlanUrl: data.floorPlanUrl,
        },
        select: LOCATION_SELECT,
      });
    },

    async delete(id) {
      return activePrisma.location.delete({
        where: { id: Number(id) },
        select: LOCATION_SELECT,
      });
    },

    async countEmployees(id) {
      return activePrisma.employee.count({
        where: { locationId: Number(id) },
      });
    },

    async countAssets(id) {
      return activePrisma.asset.count({
        where: { locationId: Number(id) },
      });
    },
  });
}

const locationsRepository = createLocationsRepository();

module.exports = Object.freeze({
  ...locationsRepository,
  createLocationsRepository,
  LOCATION_SELECT,
});
