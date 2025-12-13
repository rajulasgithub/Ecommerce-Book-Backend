import expres from 'express'
import { addToWishList, clearWishList, getAllWishList, removeWishList } from '../controllers/wishlistController.js'
import userAuthCheck from '../middleware/authCheck.js'


const wishlistRoute = expres.Router()

wishlistRoute.use(userAuthCheck)

wishlistRoute.post('/addtowishlist/:id', addToWishList)

wishlistRoute.get('/getallwishlistitem', getAllWishList)

wishlistRoute.delete('/removewishlistitem/:id', removeWishList)

wishlistRoute.delete('/clearwishlist', clearWishList)


export default wishlistRoute