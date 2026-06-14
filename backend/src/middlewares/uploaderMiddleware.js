const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { parser } = require("../services/parser");
const resumeParsedDataModel = require("../models/resumeParsedData");
const logger = require("../utils/logger");

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);

  if (!isMimeAllowed || !isExtAllowed) {
    const invalidTypeError = new Error("Invalid file type. Only PDF, DOC, and DOCX are allowed.");
    invalidTypeError.code = "INVALID_FILE_TYPE";
    return cb(invalidTypeError);
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single("resume");

// Calculate MD5 hash of a file
function calculateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

async function uploader(req, res, next) {
  upload(req, res, async (err) => {
    if (err) {
      logger.error("Multer upload error", { message: err.message });

      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          error: "File too large. Maximum allowed size is 5MB.",
        });
      }

      if (err.code === "INVALID_FILE_TYPE") {
        return res.status(400).json({
          success: false,
          error: "Invalid file type. Only PDF, DOC, and DOCX are allowed.",
        });
      }

      return res.status(400).json({
        success: false,
        error: "File upload failed",
        details: err.message,
      });
    }

    try {
      const userId = req.user?._id;
      const filePath = req.file?.path;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized user",
        });
      }

      // If no file, check if this is a profile-only scraping request (has profileUrls)
      if (!filePath) {
        // Check if request has profileUrls (meaning it's a reuse-resume case)
        const hasProfileUrls = req.body?.profileUrls;
        if (hasProfileUrls) {
          // Allow it to pass through to route handler (will fetch existing resume from DB)
          req.noNewFile = true;
          return next();
        }
        // No file and no profileUrls - this is an error
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
      }

      logger.info("Sending file to Python parser", { filePath });

      // Calculate hash of uploaded file
      const fileHash = calculateFileHash(filePath);
      logger.info("Resume file hash generated", { fileHash });

      // Check if we have an existing resume with the same hash
      const existingResume = await resumeParsedDataModel
        .findOne({ userId })
        .sort({ createdAt: -1 });

      if (existingResume && existingResume.fileHash === fileHash) {
        logger.info("Same resume detected; reusing parsed data", { userId: String(userId) });
        req.parsedResume = existingResume;
        req.resumeReuseReason = "identical_hash";
        return next();
      }

      logger.info("New resume detected; parsing started", { userId: String(userId) });
      let parsed;
      try {
        parsed = await parser(filePath);
        // console.log("Parsed result:", parsed); // Removed - too verbose
      } catch (parseError) {
        logger.error("Resume parsing failed", {
          code: parseError.code,
          message: parseError.message,
        });

        if (parseError.code === "PARSER_TIMEOUT") {
          return res.status(504).json({
            success: false,
            error:
              "Resume parsing timed out. Please try again, or upload a smaller/simple text resume.",
          });
        }

        if (parseError.code === "PARSER_UNAVAILABLE") {
          return res.status(503).json({
            success: false,
            error: "Resume parsing microservice is unavailable.",
          });
        }

        return res.status(500).json({
          success: false,
          error: "Resume parsing microservice failed.",
        });
      }

      // 🔥 CRITICAL VALIDATION
      if (
        !parsed ||
        !parsed.raw_text ||
        parsed.raw_text.trim().length < 50
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Resume parsing failed. The file may be scanned, corrupted, or unsupported.",
        });
      }

      const savedResume = await resumeParsedDataModel.create({
        userId,
        ...parsed,
        filePath,
        fileHash,
      });

      req.parsedResume = savedResume;
      next();
    } catch (error) {
      logger.error("Uploader middleware error", { message: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
}

module.exports = { uploader };
