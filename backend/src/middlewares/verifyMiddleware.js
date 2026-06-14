const jwt = require("jsonwebtoken");
const userModel = require("../models/user.js");

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: "Unauthorized: No token provided" 
      });
    }

    const decodedMessage = await jwt.verify(token, process.env.JWT_SECRET);
    const { _id } = decodedMessage;
    const user = await userModel.findById(_id);

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: "Unauthorized: No user found" 
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false,
      error: "Unauthorized: Invalid token" 
    });
  }
};

module.exports = {
  userAuth,
};
