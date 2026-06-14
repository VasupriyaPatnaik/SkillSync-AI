const axios = require("axios");
const logger = require("../utils/logger");

async function runPreprocessor(userId) {
  try {
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

    logger.info("Preprocessor started", { userId });

    const response = await axios.post(
      `${pythonServiceUrl}/preprocess`,
      { userId },
      { timeout: 180000 } // Increased timeout to 3 minutes
    );

    if (response.data?.success) {
      logger.info("Preprocessor success", { userId });
      return response.data;
    } else {
      logger.warn("Preprocessor failed", { userId, error: response.data?.error });
      throw new Error(response.data?.error || "Preprocessing failed");
    }
  } catch (err) {
    logger.error("Preprocessor error", {
      userId,
      code: err.code,
      status: err.response?.status,
      message: err.message,
    });
    throw new Error("Preprocessing failed");
  }
}

module.exports = { runPreprocessor };
