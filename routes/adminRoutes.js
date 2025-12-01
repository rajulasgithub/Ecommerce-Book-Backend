import express from 'express'
import { listUsers } from '../controllers/adminController'
import userAuthCheck from '../middleware/authCheck'
import { adminCheck } from '../middleware/adminAuth'
import { check } from 'express-validator'





const adminRoutes = express.Router()
adminRoutes.use(userAuthCheck)
adminRoutes.use(adminCheck)

adminRoutes.post('/viewallusers',[
     check("page").
            isInt({ min: 1 }).
            withMessage("Page must be a positive number"),
    
        check("limit").
            isInt({ min: 1, max: 100 }).
            withMessage("Limit must be between 1 and 100"),
    
        check("search").
            optional().
            trim()               
], listUsers )
  




export default adminRoutes       