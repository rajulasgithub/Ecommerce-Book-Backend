import express from 'express'
import { addToCart ,getCartItems ,removeCartItem ,clearCart, updateQuantity} from '../controllers/cartController.js'
import userAuthCheck from '../middleware/authCheck.js'

const cartRoutes = express.Router()

cartRoutes.post('/addtocart/:id',userAuthCheck, addToCart)

cartRoutes.get('/getallcartitems',userAuthCheck,getCartItems )

cartRoutes.delete('/deletecartitem/:id',userAuthCheck, removeCartItem)

cartRoutes.delete('/clearcartitem',userAuthCheck, clearCart)

cartRoutes.patch('/updatecart/:id', userAuthCheck,updateQuantity)

export default cartRoutes       