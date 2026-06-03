const app = require("./app");
const env = require("../config/env");
const { checkDatabaseConnection } = require("../config/database");
const logger = require("../config/logger");

async function startServer() {
  await checkDatabaseConnection();

  const server = app.listen(env.port, () => {
    logger.info(
      {
        port: env.port,
        nodeEnv: env.nodeEnv,
      },
      "Server started successfully",
    );
  });

  server.on("error", (error) => {
    logger.error({ err: error }, "Server failed to start");
  });

  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    logger.error({ err: error }, "Application startup failed");
    process.exitCode = 1;
  });
}

module.exports = {
  startServer,
};
