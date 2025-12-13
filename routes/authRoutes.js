import express from 'express'
import { userRegister, userLogin, updateUserProfile, getSellerStats, getProfile, getHomeBooks } from '../controllers/authController.js'
import { check } from 'express-validator'
import userAuthCheck from '../middleware/authCheck.js';
import upload from '../middleware/fileUpload.js';


const authRoutes = express.Router()

authRoutes.get("/gethomebooks", getHomeBooks);

authRoutes.post(
  "/register",
  [
    check("firstName")
      .trim()
      .notEmpty()
      .withMessage("First name is required"),

    check("lastName")
      .trim()
      .notEmpty()
      .withMessage("Last name is required"),

    check("countryCode")
      .trim()
      .notEmpty()
      .withMessage("Country code is required")
      .matches(/^\+\d{1,3}$/)
      .withMessage("Invalid country code"),

    check("phone")
      .trim()
      .notEmpty()
      .matches(/^[0-9]+$/)
      .withMessage("Phone must contain only digits")
      .withMessage("Phone number is required")
      .isNumeric()
      .withMessage("Phone must contain only numbers")
      .isLength({ min: 5, max: 12 })
      .withMessage("Phone number length is invalid"),

    check("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),

    check("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number")
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage("Password must contain at least one special character"),

    check("role")
      .notEmpty()
      .withMessage("Role is required")
      .isIn(["customer", "seller", "admin"])
      .withMessage("Invalid role type"),
  ],
  userRegister
);


authRoutes.post('/login', [
  check("email").
    notEmpty().
    withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),

  check("password").
    notEmpty().
    withMessage("Password is required")
], userLogin)



authRoutes.use(userAuthCheck)

authRoutes.patch(
  "/updateprofile",
  upload.single("image"),
  [
    check("firstname").optional().isString().withMessage("Invalid lastname"),
    check("lastname").optional().isString().withMessage("Invalid lastname"),
    check("email").optional().isEmail().withMessage("Invalid email"),
    check("phone")
      .optional()
      .custom((value) => {
        const cleaned = value.replace(/\s/g, "");
        const regex = /^\+?[0-9]{10,15}$/;
        if (!regex.test(cleaned)) {
          throw new Error("Enter a valid phone number with country code");
        }
        return true;
      }),
    check("bio").optional().isString(),
  ],
  updateUserProfile
);

authRoutes.get("/profile", getProfile);
authRoutes.get("/getsellerstats", getSellerStats);


export default authRoutes       