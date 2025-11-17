import express from 'express'
import { listBooks, getSingleBook, addNewBook, updateBook, deleteBook ,getNewlyAddedBooks,getBooksOfSingleUser} from '../controllers/bookController.js'
import userAuthCheck from '../middleware/authCheck.js'


const bookRoutes = express.Router()



bookRoutes.get('/viewbooks', listBooks)

bookRoutes.post('/addbook',userAuthCheck, addNewBook)

bookRoutes.get('/viewbook/:id', getSingleBook)

bookRoutes.patch('/deletetbook/:id', deleteBook)

bookRoutes.patch('/updatebook/:id', updateBook)

bookRoutes.get('/newlyaddedbook', getNewlyAddedBooks)

bookRoutes.get('/userbooks',userAuthCheck ,getBooksOfSingleUser)



export default bookRoutes       