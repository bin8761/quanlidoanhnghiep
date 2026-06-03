const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const env = require("../config/env");
const errorHandler = require("../middlewares/errorHandler");
const requestId = require("../middlewares/requestId");
const requestLogger = require("../middlewares/requestLogger");
const routes = require("../routes");

const JSON_PAYLOAD_LIMIT = "1mb";
const LOCAL_FRONTEND_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function createCorsOptions() {
  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (env.nodeEnv !== "production" && LOCAL_FRONTEND_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS origin is not allowed: ${origin}`));
    },
    credentials: true,
  };
}

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(requestId);
app.use(cors(createCorsOptions()));
app.use(express.json({ limit: JSON_PAYLOAD_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_PAYLOAD_LIMIT }));
app.use(requestLogger);
app.use(routes);
app.use(errorHandler);

module.exports = app;
