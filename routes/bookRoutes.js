import express from 'express'
import { listBooks, getSingleBook, addNewBook, updateBook, deleteBook } from '../controllers/bookController.js'

const bookRoutes = express.Router()

bookRoutes.post('/addbook', addNewBook)

bookRoutes.get('/viewbooks', listBooks)

bookRoutes.get('/viewbooks/:id', getSingleBook)

bookRoutes.patch('/deletetbook/:id', deleteBook)

bookRoutes.patch('/updatebook/:id', updateBook)



export default bookRoutes       