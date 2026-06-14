const mongoose = require("mongoose");
const dns = require("dns");
const logger = require("../utils/logger");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      family: 4,
      retryWrites: true,
      w: 'majority'
    });
    logger.info("Database connected successfully");
    return true;
  } catch (err) {
    logger.error("Error in connection", { message: err.message });
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
    return false;
  }
};

module.exports = {
  connectDb,
};
