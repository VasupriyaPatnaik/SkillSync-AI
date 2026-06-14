const mongoose = require("mongoose");

const codechefProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // 🔥 One Codechef profile per user
    },

    name: { type: String, default: "" },

    rating: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },

    contestsParticipated: { type: Number, default: 0 },
    totalProblemsSolved: { type: Number, default: 0 },

    globalRank: { type: Number, default: 0 },
    countryRank: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CodechefProfile", codechefProfileSchema);