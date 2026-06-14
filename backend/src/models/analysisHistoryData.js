const mongoose = require("mongoose");

const analysisHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
      index: true,
    },
    jobRole: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      default: "",
      trim: true,
    },
    jobDescription: {
      type: String,
      default: "",
      trim: true,
    },
    scores: {
      github: { type: Number, default: 0 },
      leetcode: { type: Number, default: 0 },
      codeforces: { type: Number, default: 0 },
      codechef: { type: Number, default: 0 },
      resume: { type: Number, default: 0 },
    },
    skillGaps: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    skillRecommendations: {
      type: [String],
      default: [],
    },
    explanation: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    finalScore: {
      type: Number,
      default: 0,
    },

    confidenceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

analysisHistorySchema.index({ userId: 1, createdAt: -1 });
analysisHistorySchema.index({ userId: 1, jobRole: 1, createdAt: -1 });
analysisHistorySchema.index({ userId: 1, role: 1, createdAt: -1 });

module.exports = mongoose.model("analysishistories", analysisHistorySchema);
