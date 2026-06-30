const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const logger = require("../utils/logger");

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

const DEFAULT_PARSER_TIMEOUT_MS = 120000;

const parsedTimeout = Number(process.env.RESUME_PARSER_TIMEOUT_MS);

const RESUME_PARSER_TIMEOUT_MS =
  Number.isFinite(parsedTimeout) && parsedTimeout > 0
    ? parsedTimeout
    : DEFAULT_PARSER_TIMEOUT_MS;

async function parser(filePath) {
  if (!filePath) {
    throw new Error("filePath is required");
  }

  try {
    const form = new FormData();

    // Send the actual PDF file instead of its path
    form.append("resume", fs.createReadStream(filePath));

    const response = await axios.post(
      `${PYTHON_SERVICE_URL}/parse-resume`,
      form,
      {
        headers: form.getHeaders(),
        timeout: RESUME_PARSER_TIMEOUT_MS,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error || "Parsing failed");
    }

    return response.data.data;
  } catch (err) {
    logger.error("Resume parsing error", {
      code: err.code,
      status: err.response?.status,
      message: err.message,
    });

    if (err.code === "ECONNABORTED") {
      const timeoutError = new Error(
        `Resume parsing timed out after ${RESUME_PARSER_TIMEOUT_MS}ms.`
      );
      timeoutError.code = "PARSER_TIMEOUT";
      throw timeoutError;
    }

    if (
      err.code === "ECONNREFUSED" ||
      err.code === "ENOTFOUND"
    ) {
      const unavailableError = new Error(
        "Resume parsing service unavailable. Ensure Python microservice is running."
      );
      unavailableError.code = "PARSER_UNAVAILABLE";
      throw unavailableError;
    }

    if (err.response) {
      throw new Error(
        err.response.data?.error ||
          `Python parser returned ${err.response.status}`
      );
    }

    throw new Error("Resume parsing failed.");
  }
}

module.exports = { parser };