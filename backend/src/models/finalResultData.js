const mongoose = require("mongoose");

const FinalResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
      unique: true,
    },

    scores: {
      github: { type: Number, default: 0 },
      leetcode: { type: Number, default: 0 },
      codeforces: { type: Number, default: 0 },
      codechef: { type: Number, default: 0 },
      resume: { type: Number, default: 0 },
    },

    role: {
      type: String,
      default: "",
      trim: true,
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

module.exports = mongoose.model("finalresults", FinalResultSchema);