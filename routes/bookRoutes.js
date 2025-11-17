import express from 'express'
import { listBooks, getSingleBook, addNewBook, updateBook, deleteBook ,getNewlyAddedBooks,getBooksOfSingleUser} from '../controllers/bookController.js'
import userAuthCheck from '../middleware/authCheck.js'


const bookRoutes = express.Router()



bookRoutes.get('/viewbooks',userAuthCheck, listBooks)

bookRoutes.post('/addbook',userAuthCheck, addNewBook)

bookRoutes.get('/viewbook/:id', getSingleBook)

bookRoutes.patch('/deletetbook/:id',userAuthCheck, deleteBook)

bookRoutes.patch('/updatebook/:id',userAuthCheck, updateBook)

bookRoutes.get('/newlyaddedbook', getNewlyAddedBooks)

bookRoutes.get('/adminbooks',userAuthCheck ,getBooksOfSingleUser)



export default bookRoutes       