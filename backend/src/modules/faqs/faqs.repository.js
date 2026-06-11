const defaultPrisma = require("../../config/database");

function resolvePrismaClient(prismaClient) {
  return prismaClient || defaultPrisma;
}

function createFaqRepository(prismaClient) {
  const activePrisma = resolvePrismaClient(prismaClient);

  return Object.freeze({
    async create(data) {
      return activePrisma.faq.create({
        data: {
          question: data.question,
          answer: data.answer,
          category: data.category,
          status: data.status || "SHOW",
        },
      });
    },

    async update(id, data) {
      return activePrisma.faq.update({
        where: { id },
        data: {
          question: data.question,
          answer: data.answer,
          category: data.category,
          status: data.status,
        },
      });
    },

    async delete(id) {
      return activePrisma.faq.delete({
        where: { id },
      });
    },

    async findById(id) {
      return activePrisma.faq.findUnique({
        where: { id },
      });
    },

    async findMany({ search = "", category = "", status = "" }) {
      const where = {};

      if (category) {
        where.category = category;
      }

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { question: { contains: search } },
          { answer: { contains: search } },
        ];
      }

      return activePrisma.faq.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
    },

    async getCategories() {
      const faqs = await activePrisma.faq.findMany({
        select: { category: true },
        distinct: ["category"],
      });
      return faqs.map((f) => f.category);
    },
  });
}

const faqRepository = createFaqRepository();

module.exports = Object.freeze({
  ...faqRepository,
  createFaqRepository,
});
