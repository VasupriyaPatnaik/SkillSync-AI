const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    // ================= BASIC INFORMATION =================
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email address");
        }
      },
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // 🔥 Never return password in queries
    },

    // ================= STUDENT PROFILE =================
    degree: {
      type: String,
      default: "",
      trim: true,
    },

    branch: {
      type: String,
      default: "",
      trim: true,
    },

    graduationYear: {
      type: Number,
      default: null,
      min: 2000,
      max: 2035,
    },

    phone: {
      type: String,
      default: "",
      validate(value) {
        if (value && !validator.isMobilePhone(value, "any")) {
          throw new Error("Invalid phone number");
        }
      },
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    // ================= CAREER PREFERENCES =================
    targetRoles: {
      type: [String],
      default: [],
    },

    skillsToImprove: {
      type: [String],
      default: [],
    },

    preferredLocations: {
      type: [String],
      default: [],
    },

    // ================= RESUME + EXTERNAL PROFILES =================
    resumeFile: {
      type: String,
    },

    leetcodeUsername: {
      type: String,
      trim: true,
    },

    githubUsername: {
      type: String,
      trim: true,
    },

    codeforcesUsername: {
      type: String,
      trim: true,
    },

    codechefUsername: {
      type: String,
      trim: true,
    },

    compatibilityScore: {
      type: Number,
      default: 0,
    },

    // ================= PASSWORD RESET =================
    resetToken: {
      type: String,
      select: false,
    },

    resetTokenExpiry: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// ================= INDEXES =================
// Note: email already has unique index via unique: true in schema
userSchema.index({ firstName: 1, lastName: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ updatedAt: -1 });

// ================= PASSWORD HASHING =================
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const hashedPassword = await bcrypt.hash(this.password, 10);
  this.password = hashedPassword;
  next();
});

// ================= JWT METHOD =================
userSchema.methods.getJWT = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ================= PASSWORD VALIDATION =================
userSchema.methods.validatePassword = async function (passwordInput) {
  return bcrypt.compare(passwordInput, this.password);
};

// ================= CLEAN JSON RESPONSE =================
userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;