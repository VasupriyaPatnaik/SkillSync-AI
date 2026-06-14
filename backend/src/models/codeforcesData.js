const mongoose = require("mongoose");

const codeforcesProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // 🔥 One CF profile per user
    },

    handle: {
      type: String,
      required: true,
    },

    rating: {
      type: Number,
      default: 0,
    },

    maxRating: {
      type: Number,
      default: 0,
    },

    rank: {
      type: String,
      default: "",
    },

    maxRank: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const codeforcesModel = mongoose.model(
  "CodeforcesProfile",
  codeforcesProfileSchema
);

module.exports = codeforcesModel;