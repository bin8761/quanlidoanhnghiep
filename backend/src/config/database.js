const env = require("./env");
const logger = require("./logger");

const globalForPrisma = globalThis;

function loadPrismaClient() {
  try {
    return require("@prisma/client").PrismaClient;
  } catch (error) {
    throw new Error(
      'Prisma Client is not available yet. Run the user-managed Prisma commands, including "npx prisma generate", before using src/config/database.js.',
    );
  }
}

function createPrismaClient() {
  const PrismaClient = loadPrismaClient();

  return new PrismaClient({
    datasources: {
      db: {
        url: env.databaseUrl,
      },
    },
  });
}

const prisma = globalForPrisma.__prismaClient || createPrismaClient();

if (env.nodeEnv !== "production") {
  globalForPrisma.__prismaClient = prisma;
}

async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    logger.info("Prisma database connection check succeeded");
    return true;
  } catch (error) {
    logger.error({ err: error }, "Prisma database connection check failed");
    throw error;
  }
}

module.exports = prisma;
module.exports.prisma = prisma;
module.exports.checkDatabaseConnection = checkDatabaseConnection;
