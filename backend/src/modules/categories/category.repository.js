const CATEGORY_SELECT = Object.freeze({
  id: true,
  name: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

function resolvePrismaClient(prismaClient) {
  return prismaClient || require("../../config/database");
}

function createCategoryRepository(prismaClient) {
  return Object.freeze({
    async findAll(search = "") {
      const prisma = resolvePrismaClient(prismaClient);
      const where = search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : undefined;

      return prisma.assetCategory.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        select: CATEGORY_SELECT,
      });
    },

    async findById(id) {
      const prisma = resolvePrismaClient(prismaClient);
      return prisma.assetCategory.findUnique({
        where: { id },
        select: CATEGORY_SELECT,
      });
    },

    async findByName(name) {
      const prisma = resolvePrismaClient(prismaClient);
      return prisma.assetCategory.findUnique({
        where: { name },
        select: CATEGORY_SELECT,
      });
    },

    async create(data) {
      const prisma = resolvePrismaClient(prismaClient);
      return prisma.assetCategory.create({
        data,
        select: CATEGORY_SELECT,
      });
    },

    async update(id, data) {
      const prisma = resolvePrismaClient(prismaClient);
      return prisma.assetCategory.update({
        where: { id },
        data,
        select: CATEGORY_SELECT,
      });
    },

    async remove(id) {
      const prisma = resolvePrismaClient(prismaClient);
      return prisma.assetCategory.delete({
        where: { id },
        select: CATEGORY_SELECT,
      });
    },
  });
}

const categoryRepository = createCategoryRepository();

module.exports = Object.freeze({
  ...categoryRepository,
  createCategoryRepository,
  CATEGORY_SELECT,
});
