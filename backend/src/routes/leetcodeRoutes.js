const express = require("express");
const router = express.Router();
const { userAuth } = require("../middlewares/verifyMiddleware.js");
const { saveLeetCodeProfile } = require("../services/leetcodeService");
const logger = require("../utils/logger");
const { sendSuccess, sendError } = require("../utils/response.js");

router.get("/profile/:username", userAuth, async (req, res) => {
  try {
    const username = req.params.username;
    const userId = req.user?._id;

    if (!userId) {
      return sendError(res, "User not authenticated", 401);
    }

    const result = await saveLeetCodeProfile(username, userId);
    return sendSuccess(res, result, "Profile fetched successfully");
  } catch (err) {
    logger.error("Failed to fetch LeetCode profile", { message: err.message });
    return sendError(res, "Failed to fetch profile: " + err.message, 500);
  }
});

module.exports = router;
