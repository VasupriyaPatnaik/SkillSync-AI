const validator = require("validator");
const bcrypt = require("bcrypt");

const validateSignUpData = (req) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    throw new Error("All fields are required");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new Error(
      "Password must be at least 8 characters long and contain at least one letter and one number"
    );
  }

  const nameRegex = /^[A-Za-z\s]{2,}$/;
  if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
    throw new Error(
      "First name and last name should only contain letters and spaces"
    );
  }

  return {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase().trim(),
    password,
  };
};

const validateEditprofile = (req) => {
  const allowedFields = [
    "firstName",
    "lastName",
    "email",
    "degree",
    "branch",
    "graduationYear",
    "phone",
    "location",
    "targetRoles",
    "skillsToImprove",
    "preferredLocations",
    "resumeFile",
    "leetcodeUsername",
    "githubUsername",
    "codeforcesUsername",
    "codechefUsername",
  ];
  const isEditAllowed = Object.keys(req.body).every((field) =>
    allowedFields.includes(field)
  );
  if (!isEditAllowed) {
    throw new Error("Invalid fields in profile update");
  }
  return req.body;
};

module.exports = { validateSignUpData, validateEditprofile };
