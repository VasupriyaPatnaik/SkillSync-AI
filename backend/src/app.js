const express = require("express");
require("dotenv").config();
require("./config/validate-env");

const { connectDb } = require("./config/database");
const { userAuth } = require("./middlewares/verifyMiddleware");

const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const logger = require("./utils/logger");

const authRouter = require("./routes/authRoute");
const profileRouter = require("./routes/profileRoute");
const resumeRouter = require("./routes/resumeRoute");
const analysisRouter = require("./routes/analysisRoute");
const leetcodeRouter = require("./routes/leetcodeRoutes");

const {
  notFoundHandler,
  errorHandler,
} = require("./middlewares/errorHandler");

const app = express();

const PORT = process.env.PORT || 5000;

// ================= SECURITY =================
app.use(helmet());

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

// ================= RATE LIMITER =================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
});

app.use("/api", apiLimiter);

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SkillSync AI Backend is running 🚀",
  });
});

// ================= ROUTES =================
app.use("/api", authRouter);
app.use("/api", userAuth, profileRouter);
app.use("/api", userAuth, resumeRouter);
app.use("/api", userAuth, analysisRouter);
app.use("/api", userAuth, leetcodeRouter);

// ================= ERROR HANDLERS =================
// Keep these LAST
app.use(notFoundHandler);
app.use(errorHandler);

// ================= DATABASE & SERVER =================
connectDb()
  .then((connected) => {
    if (!connected) {
      logger.warn("Starting server without an active MongoDB connection");
    } else {
      logger.info("Database connected");
    }

    app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("Server startup error", {
      message: err.message,
    });
  });