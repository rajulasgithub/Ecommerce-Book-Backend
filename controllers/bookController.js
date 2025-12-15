import { validationResult } from "express-validator";
import HttpError from "../helpers/httpError.js";
import { Book } from "../models/book.js";
import mongoose from "mongoose";
import { sendDeleteBookEmail } from "../config/mail/nodemailer.js";
import emailTemplates from "../config/mail/emailTemplate.js";
import { User } from "../models/user.js";


export const addNewBook = async (req, res, next) => {
  try {
    const error = validationResult(req);
    console.log("Validation errors:", error);

    if (!error.isEmpty()) {

      console.log("Validation error details:", error.array());
      return next(new HttpError("Invalid User Input", 400));
    }

    const { userId, userRole } = req.userData;

    if (userRole !== "seller") {
      return next(new HttpError("Only seller can add the book", 403));
    }
    else {
      const {
        title,
        description,
        excerpt,
        page_count,
        genre,
        language,
        author,
        publish_date,
        prize,
        category,
      } = req.body;

      const imagePath = req.file ? req.file.path : null;

      const date = new Date(publish_date);

      const book = {
        user: userId,
        image: imagePath,
        title,
        description,
        excerpt,
        page_count: Number(page_count),
        genre,
        language,
        author,
        publish_date: date,
        prize: Number(prize),
        category,
      };

      const newBook = new Book(book);
      await newBook.save();

      if (!newBook) {
        return next(new HttpError("Book not added", 400));
      }
      else {
        return res.status(201).json({
          success: true,
          message: "Successfully added book",
        });
      }
    }
  } catch (error) {
    console.error("Add book error:", error);
    return next(new HttpError(error.message, 500));
  }
};


// list books
export const listBooks = async (req, res, next) => {
  try {

    const error = validationResult(req)

    if (!error.isEmpty()) {
      return next(new HttpError("Invalid User Input", 400));
    }
    else {
      const { userRole, userId } = req.userData;
      let { page, limit, search = "" } = req.query;

      page = Number(page)
      limit = Number(limit)

      let searchQuery = { is_deleted: false };

      if (search) {
        const priceValue = Number(search);

        if (!isNaN(priceValue)) {
          searchQuery.prize = priceValue;
        } else {
          searchQuery.$or = [
            { title: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
          ];
        }
      }
      if (userRole === "seller") {
        searchQuery.user = userId;
      }

      const total = await Book.countDocuments(searchQuery);
      const totalPages = Math.ceil(total / limit);

      const currentPage =
        page > totalPages && totalPages > 0 ? totalPages : page;

      const skip = (currentPage - 1) * limit;


      const books = await Book.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return res.status(200).json({
        success: true,
        error: false,
        message: "Books listed successfully",
        data: books,
        pagination: {
          total,
          page: currentPage,
          limit,
          totalPages,
        },
      });

    }

  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};



// get a single book
export const getSingleBook = async (req, res, next) => {
  try {

    const { id } = req.params

    if (!id) {
      return next(new HttpError("Book ID is required", 400));
    }
    else {

      const book = await Book.findById(id).select(
        "_id author description excerpt genre image language page_count prize title category publish_date"
      );
      if (!book) {
        return next(new HttpError("Book Not Found", 404));
      }
      else {
        return res.status(200).json({
          success: true,
          message: "Successfully found Book",
          data: book,
        });
      }
    }
  } catch (error) {
    return next(new HttpError(error.message, 400));
  }
};


// update a single book

export const updateBook = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new HttpError("Invalid User Input", 400));
    }
    else {
      const { userRole, userId } = req.userData;

      if (userRole !== "seller") {
        return next(new HttpError("Only sellers can update books", 403));
      }
      else {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return next(new HttpError("Invalid Book ID", 400));
        }
        else {

          const updatedData = { ...req.body };


          if (req.file) {
            updatedData.image = req.file.path;
          }
          const date = new Date(updatedData.publish_date);
          updatedData.publish_date = date;

          updatedData.page_count = Number(updatedData.page_count);

          updatedData.prize = Number(updatedData.prize);


          const updatedBook = await Book.findByIdAndUpdate(
            id,
            { $set: updatedData }
          );

          if (!updatedBook) {
            return next(new HttpError("Book not updated", 400));
          }
          else {
            return res.status(200).json({
              success: true,
              message: "Successfully updated book",
            });

          }
        }
      }
    }

  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};


// delete a book
export const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userRole } = req.userData;
      console.log(id)
      console.log(req.params)
    
    if (userRole !== "seller") {
      return next(new HttpError("Only sellers and admin can delete books", 403));
    }
    else {

      const book = await Book.findById(id).populate("user");
      if (!book) {
        return next(new HttpError("Book not found", 404));
      }
      else {
        book.is_deleted = true;
        await book.save();

        const user = await User.findById(book.user);
        if (!user) {
          return next(new HttpError("User not found", 404));
        }
        else{
           return res.status(200).json({
          success: true,
          message: "Successfully deleted book and notified user",
        });

        }
       
      }
    }
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};


// newly added books
export const getNewlyAddedBooks = async (req, res, next) => {
  try {
    const books = await Book.find({ is_deleted: false })
      .sort({ createdAt: -1 })
      .limit(8);

    if (books) {
      return res.status(200).json({
        success: true,
        error: false,
        message: "Newly added books fetched successfully",
        data: books
      });
    }
    else {
      return next(new HttpError("No books Found", 404));
    }
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};



// add reviewand rating

export const addReview = async (req, res, next) => {
  try {

    const { userRole, userId } = req.userData;

    if (userRole !== "customer") {
      return next(new HttpError("Only customers can add a review", 403));
    }
    else {
      const { rating, comment } = req.body;
      const { bookId } = req.params;

      const book = await Book.findById(bookId);
      if (!book) {
        return next(new HttpError("No book found", 404));
      }
      else {
        let existingReview = book.reviews.find(
          (r) => r.user.toString() === userId.toString()
        );

        if (existingReview) {

          if (rating !== undefined) existingReview.rating = rating;
          if (comment) existingReview.comment = comment;
        } else {

          book.reviews.push({
            user: userId,
            rating,
            comment,
          });
        }

        book.calculateRating();

        await book.save();

        return res.status(200).json({
          success: true,
          message: "Review added successfully",
          data: book,
        })
      }
    }

  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};