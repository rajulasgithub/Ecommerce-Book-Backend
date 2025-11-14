import express from 'express'
import { addToCart ,getCartItems ,removeCartItem ,clearCart, updateQuantity} from '../controllers/cartController.js'

const cartRoutes = express.Router()

cartRoutes.post('/addtocart/:id', addToCart)

cartRoutes.get('/getallcartitems',getCartItems )

cartRoutes.delete('/deletecartitem/:id', removeCartItem)

cartRoutes.delete('/clearcartitem', clearCart)

cartRoutes.patch('/updatecart/:id', updateQuantity)

export default cartRoutes       