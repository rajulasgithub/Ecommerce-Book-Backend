import express from 'express'
import { listBooks, getSingleBook, addNewBook, updateBook, deleteBook ,getNewlyAddedBooks} from '../controllers/bookController.js'
import userAuthCheck from '../middleware/authCheck.js'
import {  check} from 'express-validator'


const bookRoutes = express.Router()


bookRoutes.get('/viewbook/:id', getSingleBook)

bookRoutes.get('/newlyaddedbook', getNewlyAddedBooks)

bookRoutes.use(userAuthCheck)

bookRoutes.patch('/deletetbook/:id', deleteBook)

bookRoutes.get('/viewbooks',[
    check("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive number"),
    check("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    check("search").optional().trim().isString().withMessage("Search must be a string"),
], listBooks)

bookRoutes.post('/addbook',[ check("image").trim().notEmpty().withMessage("Image URL is required").isURL().withMessage("Image must be a valid URL"),
    check("title").trim().notEmpty().withMessage("Title is required").isLength({ min: 5 }).withMessage("Title must be at least 2 characters"),
    check("description").trim().notEmpty().withMessage("Description is required").isLength({ min: 20 }).withMessage("Description must be at least 20 characters"),
    check("excerpt").trim().notEmpty().withMessage("Excerpt is required").isLength({ min: 10 }).withMessage("Excerpt must be at least 10 characters"),
    check("page_count").notEmpty().withMessage("Page count is required").isInt({ min: 1 }).withMessage("Page count must be a positive number"),
    check("publish_date").notEmpty().withMessage("Publish date is required").isISO8601().withMessage("Publish date must be a valid date"),
    check("author").trim().notEmpty().withMessage("Author is required").isLength({ min: 3 }).withMessage("Author name must be at least 3 characters"),
    check("genre").trim().notEmpty().withMessage("Genres are required"),
    check("language").trim().notEmpty().withMessage("Languages are required"),
    check("prize").notEmpty().withMessage("Price is required").isFloat({ min: 1 }).withMessage("Price must be a positive number"),
    check("category").trim().notEmpty().withMessage("Category is required").isIn(["Academic","Fiction","Non-Fiction","Comics", "Children","Poetry"]).withMessage("Invalid category selected"),
], addNewBook)


bookRoutes.patch('/updatebook/:id',[
    check("image").optional().trim().isURL().withMessage("Image must be a valid URL"),
    check("title").optional().trim().notEmpty().withMessage("Title cannot be empty").isLength({ min: 2 }).withMessage("Title must be at least 2 characters"),
    check("description").optional().trim().notEmpty().withMessage("Description cannot be empty").isLength({ min: 20 }).withMessage("Description must be at least 20 characters"),
    check("excerpt").optional().trim().notEmpty().withMessage("Excerpt cannot be empty").isLength({ min: 10 }).withMessage("Excerpt must be at least 10 characters"),
    check("page_count").optional().notEmpty().withMessage("Page count cannot be empty").isInt({ min: 1 }).withMessage("Page count must be a positive number"),
    check("publish_date").optional().notEmpty().withMessage("Publish date cannot be empty").isISO8601().withMessage("Publish date must be a valid date"),
    check("author").optional().trim().notEmpty().withMessage("Author cannot be empty").isLength({ min: 3 }).withMessage("Author name must be at least 3 characters"),
    check("genre").optional().trim().notEmpty().withMessage("Genre cannot be empty"),
    check("language").optional().trim().notEmpty().withMessage("Language cannot be empty"),
    check("prize").optional().notEmpty().withMessage("Price cannot be empty").isFloat({ min: 1 }).withMessage("Price must be a positive number"),
    check("category").optional().trim().notEmpty().withMessage("Category cannot be empty").isIn(["Academic","Fiction","Non-Fiction", "Comics","Children","Poetry"]).withMessage("Invalid category selected")
], updateBook)





export default bookRoutes       