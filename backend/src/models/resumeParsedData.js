const mongoose = require("mongoose");

const resumeParsedDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    // ✅ Skills (array of strings)
    skills: {
      type: [String],
      default: [],
    },

    // ✅ Project titles only (array of strings)
    projects: {
      type: [String],
      default: [],
    },

    // ✅ Education entries
    education: {
      type: [String],
      default: [],
    },

    // ✅ Experience entries
    experience: {
      type: [String],
      default: [],
    },

    // ✅ Certifications entries
    certifications: {
      type: [String],
      default: [],
    },

    // ✅ Achievements entries
    achievements: {
      type: [String],
      default: [],
    },

    // ✅ Full resume text (for embeddings + scoring)
    raw_text: {
      type: String,
      default: "",
    },

    filePath: {
      type: String,
      required: true,
    },

    // File hash (MD5) for detecting duplicate uploads
    fileHash: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "resumeparseddatas",
  }
);

const resumeParsedDataModel = mongoose.model("ResumeParsedData", resumeParsedDataSchema);

module.exports = resumeParsedDataModel;