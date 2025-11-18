import express from 'express'
import { addToCart ,getCartItems ,removeCartItem ,clearCart, updateQuantity} from '../controllers/cartController.js'
import userAuthCheck from '../middleware/authCheck.js'
import { check } from 'express-validator'

const cartRoutes = express.Router()

cartRoutes.use(userAuthCheck)

cartRoutes.post('/addtocart/:id',[
     check("id")
    .isMongoId()
    .withMessage("Invalid book ID"),
], addToCart)

cartRoutes.get('/getallcartitems',getCartItems )

cartRoutes.delete('/deletecartitem/:id', [
     check("id")
    .isMongoId()
    .withMessage("Invalid book ID"),
] , removeCartItem)

cartRoutes.delete('/clearcartitem', clearCart)

cartRoutes.patch('/updatecart/:id', [ check("id")
    .isMongoId()
    .withMessage("Invalid cart item ID"),
     check("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer (min 1)")

],updateQuantity)

export default cartRoutes       