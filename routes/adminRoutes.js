import express from 'express'
import { listUsers } from '../controllers/adminController.js'
import userAuthCheck from '../middleware/authCheck.js'
import { adminCheck } from '../middleware/adminAuth.js'
import { check } from 'express-validator'





const adminRoutes = express.Router()
adminRoutes.use(userAuthCheck)
adminRoutes.use(adminCheck)

adminRoutes.get('/viewallusers',[
     check("page").
            isInt({ min: 1 }).
            withMessage("Page must be a positive number"),
    
    check("limit").
            isInt({ min: 1, max: 100 }).
            withMessage("Limit must be between 1 and 100"),
    
    check("type")
            .isIn(["customer", "seller", "all"])
            .withMessage("Invalid type. Allowed values: customer, seller, all"),
    
    check("search").
            optional().
            trim()               
], listUsers )
  

export default adminRoutes       