const mongoose = require("mongoose");

const gitHubDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // 🔥 One GitHub profile per user
    },

    name: { type: String },

    followers: { type: Number, default: 0 },
    publicRepos: { type: Number, default: 0 },

    totalStars: { type: Number, default: 0 },
    totalForks: { type: Number, default: 0 },

    totalPRs: { type: Number, default: 0 },
    totalIssues: { type: Number, default: 0 },

    topLanguages: [{ type: String }],

    // Enhanced metrics for better evaluation
    totalCommits: { type: Number, default: 0 },
    avgCommitsPerRepo: { type: Number, default: 0 },
    activeRepositories: { type: Number, default: 0 },
    repositoriesWithREADME: { type: Number, default: 0 },
    lastCommitDate: { type: Date, default: null },
    commitFrequency: { type: String, default: "low" }, // low, moderate, high, very-high
    projectComplexity: { type: Number, default: 0 }, // 0-100 based on languages and forks
    documentationQuality: { type: Number, default: 0 }, // 0-100 based on README presence
    collaborationScore: { type: Number, default: 0 }, // 0-100 based on forks and PRs
    contributionConsistency: { type: Number, default: 0 }, // 0-100 based on commit patterns
  },
  { timestamps: true }
);

gitHubDataSchema.index({ updatedAt: -1 });

const githubModel = mongoose.model("GithubProfile", gitHubDataSchema);
module.exports = githubModel;