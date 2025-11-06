import { Book } from "../models/book.js";
import mongoose from "mongoose";


// add a new book
export const addNewBook = async (req, res, next) => {
    try {
        console.log(req.body);

        const { title, description, excerpt, page_count, genre, language, author, publish_date } = req.body

        if (!title | !description | !page_count | !publish_date | !author | !genre | !language) {

            return res.status(400).json({
                success: false,
                error: true,
                message: "Required fields: title, author, pageCount, publishDate"
            });
        }

        const date = new Date(publish_date)

        if (isNaN(date)) {
            return res.status(400).json({
                success: false,
                message: "Invalid publishDate format"
            });
        }
        const book = {
            title: title.trim(), description, excerpt, page_count: Number(page_count), genre, language,
            author: author.trim(), publish_date: date
        }

        const newBook = new Book(book)
        await newBook.save()

        if (!newBook) {
            return res.status(400).json({
                success: false,
                error: true,
                message: "book not added"
            });
        }
        else {
            return res.status(201).json({
                success: true,
                error: false,
                message: "successfully added book",
                data: newBook
            });
        }
    } catch (error) {
        next(error);
    }
};


// list books
export const listBooks = async (req, res, next) => {
    try {

        let books = await Book.find()
        if (books.length == 0) {
            return res.status(404).json({
                success: false,
                error: true,
                message: "books not listed",
            });
        }
        else {
            return res.status(200).json({
                success: true,
                error: false,
                message: "Books listed successfully",
                data: books
            })
        }
    } catch (err) {

        next(err)
    }
};


// get a single book
export const getSingleBook = async (req, res, next) => {
    try {

        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Book ID",
            });
        }
        else {
            const book = await Book.findById(id)

            if (!book) {
                return res.status(404).json({
                    success: false,
                    error: true,
                    message: "Book not found",
                });
            }
            else {
                return res.status(200).json({
                    success: true,
                    error: false,
                    message: "successfully found Book",
                    data: book
                });
            }
        }
    } catch (error) {
        next(error);
    }
};


// update a single book
export const updateBook = async (req, res, next) => {
    try {
        const id = req.params.id;
        const book = req.body

        if (book.publish_date) {
            book.publish_date = new Date(book.publish_date);
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Book ID",
            });
        }
        else {
            const updated = await Book.findByIdAndUpdate(id, { $set: book }, { new: true, runValidators: true })

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    error: true,
                    message: "book not found"
                });
            }
            else {
                return res.status(200).json({
                    success: true,
                    error: false,
                    message: "successfully updated book",
                    data: updated
                });
            }
        }
    } catch (error) {

        next(error);
    }
};


// delete a book
export const deleteBook = async (req, res, next) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Book ID",
            });
        }
        else {
            const deleted = await Book.findByIdAndUpdate(id, { is_deleted: true }, { new: true, runValidators: true })
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    error: true,
                    message: "task not deleted"
                });
            }
            else {
                return res.status(200).json({
                    success: true,
                    error: false,
                    message: "successfully deleted task",
                    data: deleted
                });
            }

        }

    } catch (error) {
        next(error);
    }
};






