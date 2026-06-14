const express = require("express");
const authRouter = express.Router();
const crypto = require("crypto");

const { validateSignUpData } = require("../services/validate.js");
const userModel = require("../models/user.js");
const bcrypt = require("bcrypt");
const { validate, schemas } = require("../utils/validator.js");
const logger = require("../utils/logger");
const { sendSuccess, sendError } = require("../utils/response.js");

authRouter.post("/signup", validate(schemas.signup), async (req, res) => {
  try {
    const requestWithValidatedBody = {
      ...req,
      body: req.validatedBody,
    };
    const data = validateSignUpData(requestWithValidatedBody);
    const { firstName, lastName, email, password } = data;
    
    // Don't hash password here - the pre-save hook in user model will do it
    const user = new userModel({
      firstName,
      lastName,
      email,
      password, // Pass plain password, let pre-save hook hash it
    });
    await user.save();
    return sendSuccess(res, { user }, "User Created Successfully");
  } catch (err) {
    logger.error("Signup error", { message: err.message });
    return sendError(res, err.message, 500);
  }
});

authRouter.post("/login", validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.validatedBody;

    // 🔥 IMPORTANT FIX
    const user = await userModel
      .findOne({ email })
      .select("+password");

    if (!user) {
      return sendError(res, "Invalid email or password", 401);
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      return sendError(res, "Invalid email or password", 401);
    }

    const token = user.getJWT();
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return sendSuccess(
      res,
      {
        user,
        token,
      },
      "Login successful"
    );

  } catch (err) {
    logger.error("Login error", { message: err.message });
    return sendError(res, "Server error", 500);
  }
});

authRouter.post("/logout", async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", null, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      expires: new Date(Date.now()),
    });
    return sendSuccess(res, null, "Logout Successfully");
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});

// ---------------- FORGOT PASSWORD ----------------
authRouter.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, "Email is required", 400);
    }

    const user = await userModel.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Don't reveal whether email exists (security best practice)
      return sendSuccess(res, null, "If an account exists with this email, you will receive a password reset link", 200);
    }

    // Generate a 6-character alphanumeric token
    const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase();
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with reset token
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    logger.info("Password reset token generated", { email });

    // TODO: Replace with email delivery service and avoid returning token in production.
    return sendSuccess(
      res,
      { resetToken },
      "Password reset instructions sent. Please check your email or use the reset code provided.",
      200
    );
  } catch (err) {
    logger.error("Forgot password error", { message: err.message });
    return sendError(res, "Failed to process password reset request", 500);
  }
});

// ---------------- RESET PASSWORD ----------------
authRouter.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return sendError(res, "Reset token and new password are required", 400);
    }

    // Validate password format
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return sendError(
        res,
        "Password must be at least 8 characters long and contain at least one letter and one number",
        400
      );
    }

    // Find user with matching reset token and valid expiry
    const user = await userModel
      .findOne({
        resetToken,
        resetTokenExpiry: { $gt: new Date() },
      })
      .select("+resetToken +resetTokenExpiry");

    if (!user) {
      return sendError(res, "Invalid or expired reset token", 400);
    }

    // Update password
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    logger.info("Password reset successful", { userId: user._id.toString() });

    return sendSuccess(res, null, "Password reset successfully. Please log in with your new password.", 200);
  } catch (err) {
    logger.error("Reset password error", { message: err.message });
    return sendError(res, "Failed to reset password", 500);
  }
});

module.exports = authRouter;
