const express = require("express");
const analysisRouter = express.Router();
const axios = require("axios");
const Groq = require("groq-sdk");
const FinalResults = require("../models/finalResultData");
const AnalysisHistory = require("../models/analysisHistoryData");
const { ObjectId } = require('mongoose').Types;
const multer = require("multer");
const { validate, schemas } = require("../utils/validator.js");
const logger = require("../utils/logger");
const { sendSuccess, sendError } = require("../utils/response.js");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8000";
const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------------- ANALYSIS HISTORY (FILTER + PAGINATION) ----------------
analysisRouter.get("/analysis/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user?._id?.toString();
    const {
      q = "",
      role = "",
      minScore,
      maxScore,
      page = "1",
      limit = "10",
    } = req.query;

    if (!requesterId || requesterId !== userId) {
      return sendError(res, "Forbidden", 403);
    }

    let objectId;
    try {
      objectId = new ObjectId(userId);
    } catch (err) {
      return sendError(res, "Invalid userId format", 400);
    }

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (safePage - 1) * safeLimit;

    const filter = { userId: objectId };
    const andConditions = [];

    if (q && q.trim()) {
      const term = escapeRegex(q.trim());
      andConditions.push({
        $or: [
        { jobRole: { $regex: term, $options: "i" } },
        { role: { $regex: term, $options: "i" } },
        { jobDescription: { $regex: term, $options: "i" } },
        ],
      });
    }

    if (role && role.trim()) {
      const roleRegex = { $regex: `^${escapeRegex(role.trim())}$`, $options: "i" };
      andConditions.push({
        $or: [{ jobRole: roleRegex }, { role: roleRegex }],
      });
    }

    const scoreFilter = {};
    const parsedMin = Number(minScore);
    const parsedMax = Number(maxScore);

    if (!Number.isNaN(parsedMin)) scoreFilter.$gte = parsedMin;
    if (!Number.isNaN(parsedMax)) scoreFilter.$lte = parsedMax;
    if (Object.keys(scoreFilter).length > 0) andConditions.push({ finalScore: scoreFilter });

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    const [rows, total] = await Promise.all([
      AnalysisHistory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      AnalysisHistory.countDocuments(filter),
    ]);

    return sendSuccess(res, rows, "Analysis history fetched", 200, {
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
        hasNext: skip + rows.length < total,
        hasPrev: safePage > 1,
      },
    });
  } catch (err) {
    logger.error("History fetch error", { message: err.message });
    return sendError(res, "Failed to fetch analysis history", 500);
  }
});

// ---------------- RUN ANALYSIS ----------------
analysisRouter.post("/analysis/run", validate(schemas.analysisRun), async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const jobRole = (req.validatedBody?.jobRole || "").toString().trim();
    const jobDescription = (req.validatedBody?.jobDescription || "").toString().trim();

    if (!userId) {
      return sendError(res, "Unauthorized user", 401);
    }

    const response = await axios.post(
      `${PYTHON_SERVICE_URL}/analyze-profile`,
      { userId, jobRole, jobDescription }
    );

    const pythonData = response.data;

    if (!pythonData.success) {
      return sendError(res, pythonData.message, 400);
    }

    return sendSuccess(res, pythonData, "Profile analysis completed", 200, {
      explanation: pythonData.explanation || null,
    });

  } catch (err) {
    logger.error("Analysis error", {
      code: err.code,
      status: err.response?.status,
      message: err.message,
    });

    return sendError(res, "Analysis service failed", 500);
  }
});

// ---------------- GET ANALYSIS + LLM ----------------
analysisRouter.get("/analysis/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { jobRole } = req.query;
    const includeSuggestions = String(req.query.includeSuggestions || "").toLowerCase() === "true";
    const requesterId = req.user?._id?.toString();

    if (!requesterId || requesterId !== userId) {
      return sendError(res, "Forbidden", 403);
    }

    // Convert string userId to ObjectId for database query
    const { ObjectId } = require('mongoose').Types;
    let objectId;
    try {
      objectId = new ObjectId(userId);
    } catch (err) {
      return sendError(res, "Invalid userId format", 400);
    }

    const [result, history] = await Promise.all([
      FinalResults.findOne({ userId: objectId }).lean(),
      AnalysisHistory.find({ userId: objectId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    logger.info("Analysis loaded", {
      userId,
      hasResult: Boolean(result),
      historyCount: history?.length || 0,
    });

    if (!result) {
      return sendError(res, "No analysis found", 404);
    }

    let suggestions = "";

    if (includeSuggestions) {
      const prompt = `
Developer Scores:
${JSON.stringify(result.scores, null, 2)}

Final Score: ${result.finalScore}
Confidence Score: ${result.confidenceScore}% (Based on ${Object.keys(result.scores).filter(k => result.scores[k] > 0).length} connected platforms)

Target Role: ${jobRole || "Not specified"}

The confidence score indicates how reliable this evaluation is based on available data:
- Higher confidence (>70%): Multiple platforms connected with strong data
- Medium confidence (40-70%): Some platforms connected with moderate data  
- Lower confidence (<40%): Limited data available, recommendation may be less accurate

Generate:
- Key strengths (based on highest scoring platforms)
- Weak skills (platforms with low scores or missing data)
- 4 actionable improvement steps (prioritize based on confidence score - if confidence is low, emphasize data collection)
- Resume suggestions
- Brief explanation of what the confidence score means for this candidate

Keep concise and actionable.
`;

      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a concise technical career coach for software developers. You help interpret candidate evaluation data, including confidence scores that indicate data reliability. You do NOT calculate scores - you explain them.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      });

      suggestions = completion.choices?.[0]?.message?.content || "";
    }

    return sendSuccess(res, result, "Analysis fetched", 200, {
      history,
      suggestions,
      explanation: result.explanation || null,
    });

  } catch (err) {
    logger.error("LLM error", { message: err.message });

    return sendError(res, "Suggestion generation failed", 500);
  }
});

module.exports = analysisRouter;
