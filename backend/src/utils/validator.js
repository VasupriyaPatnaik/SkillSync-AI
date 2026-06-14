const Joi = require("joi");

const schemas = {
  signup: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/[A-Za-z]/)
      .pattern(/\d/)
      .required()
      .messages({
        "string.pattern.base": "Password must include at least one letter and one number",
      }),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  analysisRun: Joi.object({
    jobRole: Joi.string().trim().min(2).max(120).allow("").default(""),
    jobDescription: Joi.string().trim().min(10).max(6000).allow("").default(""),
  }),
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    req.validatedBody = value;
    next();
  };
};

module.exports = { schemas, validate };
