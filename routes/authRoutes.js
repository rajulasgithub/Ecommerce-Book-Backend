import express from 'express'
import {userRegister, userLogin } from '../controllers/authController.js'
import checkAuth from '../middleware/authCheck.js'
import { check } from 'express-validator'

const authRoutes = express.Router()

authRoutes.post('/register',[ 
    check("name").trim().notEmpty().withMessage("Name is required"),
    check("email").trim().notEmpty().withMessage("Email is required").isEmail({ require_tld: true }).withMessage("Invalid email format"),
    check("phone").trim().notEmpty().withMessage("Phone number is required").isLength({ min: 10, max: 10 }).withMessage("Phone must be exactly 10 digits").isMobilePhone().withMessage("Invalid phone number"),
    check("password").notEmpty().withMessage("Password is required").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    check("role").notEmpty().withMessage("Role is required").isIn(["customer", "seller", "admin"]).withMessage("Role must be customer, seller, or admin"),
], userRegister),
   


authRoutes.post('/login', [
    check("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format"),
    check("password").notEmpty().withMessage("Password is required")
], userLogin )

export default authRoutes       