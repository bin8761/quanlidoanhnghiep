const defaultPrisma = require("../../config/database");

function resolvePrismaClient(prismaClient) {
  return prismaClient || defaultPrisma;
}

const CATEGORY_SELECT = Object.freeze({
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
});

function createCategoriesRepository(prismaClient) {
  const activePrisma = resolvePrismaClient(prismaClient);

  return Object.freeze({
    async findAll() {
      return activePrisma.assetCategory.findMany({
        orderBy: { name: "asc" },
        select: CATEGORY_SELECT,
      });
    },

    async findById(id) {
      return activePrisma.assetCategory.findUnique({
        where: { id: Number(id) },
        select: CATEGORY_SELECT,
      });
    },

    async findByName(name) {
      return activePrisma.assetCategory.findUnique({
        where: { name },
        select: CATEGORY_SELECT,
      });
    },

    async create(data) {
      return activePrisma.assetCategory.create({
        data: {
          name: data.name,
          description: data.description ?? null,
        },
        select: CATEGORY_SELECT,
      });
    },

    async update(id, data) {
      return activePrisma.assetCategory.update({
        where: { id: Number(id) },
        data: {
          name: data.name,
          description: data.description,
        },
        select: CATEGORY_SELECT,
      });
    },

    async delete(id) {
      return activePrisma.assetCategory.delete({
        where: { id: Number(id) },
        select: CATEGORY_SELECT,
      });
    },

    async countAssets(id) {
      return activePrisma.asset.count({
        where: { categoryId: Number(id) },
      });
    },
  });
}

const categoriesRepository = createCategoriesRepository();

module.exports = Object.freeze({
  ...categoriesRepository,
  createCategoriesRepository,
  CATEGORY_SELECT,
});
