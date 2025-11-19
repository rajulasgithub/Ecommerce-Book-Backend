import express from 'express'
import { addToCart ,getCartItems ,removeCartItem ,clearCart, updateQuantity} from '../controllers/cartController.js'
import userAuthCheck from '../middleware/authCheck.js'
import { check } from 'express-validator'

const cartRoutes = express.Router()

cartRoutes.use(userAuthCheck)

cartRoutes.get('/getallcartitems',getCartItems )

cartRoutes.delete('/clearcartitem', clearCart)

cartRoutes.post('/addtocart/:id', addToCart)

cartRoutes.delete('/deletecartitem/:id', removeCartItem)

cartRoutes.patch('/updatecart/:id', [
    check("quantity").notEmpty().withMessage("Quantity is required").isInt({ min: 1 }).withMessage("Quantity must be a positive integer (min 1)")
],updateQuantity)

export default cartRoutes       