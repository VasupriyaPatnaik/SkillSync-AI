const logger = require("../utils/logger");

const requiredEnvVars = [
  "MONGODB_CONNECTION",
  "JWT_SECRET",
  "PORT",
  "CLIENT_URL",
  "PYTHON_SERVICE_URL",
  "GROQ_API_KEY",
  "GITHUB_TOKEN",
];

const missingVars = requiredEnvVars.filter((name) => {
  const value = process.env[name];
  return !value || value.trim() === "";
});

if (missingVars.length > 0) {
  const message = `Missing required environment variables: ${missingVars.join(", ")}`;
  logger.error(message);
  throw new Error(message);
}

logger.info("Environment variables validated successfully");
