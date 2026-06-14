const mongoose = require("mongoose");

const leetcodeProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true, // 🔥 One Leetcode profile per user
    },

    name: { type: String, default: "" },

    totalSolved: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },

    ranking: { type: Number, default: 0 },
    reputation: { type: Number, default: 0 },

    contestRating: { type: Number, default: 0 },
    contestsAttended: { type: Number, default: 0 },
    contestGlobalRank: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const leetcodeModel = mongoose.model("LeetcodeProfile", leetcodeProfileSchema);

module.exports = leetcodeModel;