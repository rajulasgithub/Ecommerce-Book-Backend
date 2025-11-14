import express from 'express'
import { listBooks, getSingleBook, addNewBook, updateBook, deleteBook ,getNewlyAddedBooks} from '../controllers/bookController.js'


const bookRoutes = express.Router()

bookRoutes.get('/viewbooks', listBooks)

bookRoutes.post('/addbook', addNewBook)

bookRoutes.get('/viewbook/:id', getSingleBook)

bookRoutes.patch('/deletetbook/:id', deleteBook)

bookRoutes.patch('/updatebook/:id', updateBook)

bookRoutes.get('/newlyaddedbook', getNewlyAddedBooks)



export default bookRoutes       