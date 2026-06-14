const express = require("express");
require("dotenv").config();
require("./config/validate-env");
const { connectDb } = require("./config/database");
const { userAuth } = require("./middlewares/verifyMiddleware.js");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const logger = require("./utils/logger");

const app = express();
app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
});

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
app.use("/api", apiLimiter);

const authRouter = require("./routes/authRoute.js");
const profileRouter = require("./routes/profileRoute.js");
const resumeRouter = require("./routes/resumeRoute.js");
const analysisRouter = require("./routes/analysisRoute.js");
const leetcodeRouter = require("./routes/leetcodeRoutes.js");
const {
  notFoundHandler,
  errorHandler,
} = require("./middlewares/errorHandler.js");

app.use("/api", authRouter);
app.use("/api", userAuth, profileRouter);
app.use("/api", userAuth, resumeRouter);
app.use("/api", userAuth, analysisRouter);
app.use("/api", userAuth, leetcodeRouter);

app.use(notFoundHandler);
app.use(errorHandler);


connectDb()
  .then(() => {
    logger.info("Database connected");
    app.listen(process.env.PORT, () => {
      logger.info(`Server started on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    logger.error("Server startup error", { message: err.message });
  });
