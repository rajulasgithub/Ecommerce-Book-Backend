import HttpError from "../helpers/httpError.js";
import { Book } from "../models/book.js";
import mongoose from "mongoose";

// add a new book
export const addNewBook = async (req, res, next) => {
    try {
        console.log(req.body);
        const user = req.userData.userId
        const role = req.userData.userRole
         
        if(role !== "seller"){
         return next(new HttpError("Only seller can add the book",403))
        }
        else{

             const {

            image,
            title,
            description,
            excerpt,
            page_count,
            genre,
            language,
            author,
            publish_date,
            prize,
            category
        } = req.body;

        if (
            !user ||
            !image ||
            !title ||
            !description ||
            !page_count ||
            !publish_date ||
            !author ||
            !genre ||
            !language ||
            !prize ||
            !category
        ) {
            return next(new HttpError("All fields are required", 400));
        } else {
            const date = new Date(publish_date);

            if (isNaN(date)) {
                return next(new HttpError("Invalid publish_date format", 400));
            }

            if (Number(prize) > 15000) {
                return next(new HttpError("Please give me a valid Number", 400));
            } else {
                const book = {
                    user,
                    image,
                    title: title.trim(),
                    description,
                    excerpt,
                    page_count: Number(page_count),
                    genre,
                    language,
                    author: author.trim(),
                    publish_date: date,
                    prize: Number(prize),
                    category
                };

                const newBook = new Book(book);
                await newBook.save();

                if (!newBook) {
                    return next(new HttpError("Book Not Found", 400));
                } else {
                    return res.status(201).json({
                        success: true,
                        error: false,
                        message: "Successfully added book",
                        data: newBook
                    });
                }
            }
        }

        }

       
    } catch (error) {
        return next(new HttpError(error.message, 500));
    }
};

// list books
export const listBooks = async (req, res, next) => {

    try {
        const role = req.userData.userRole
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";

        let searchQuery = { is_deleted: false };

      if(role !=="customer"){
          return next(new HttpError("Only customer can list the book",403))
      }
      else{
        if (search) {
            const priceValue = parseInt(search);

            if (!isNaN(priceValue)) {
                searchQuery.prize = priceValue;
            } else {
                searchQuery.$or = [
                    { title: { $regex: search, $options: "i" } },
                    { genre: { $regex: search, $options: "i" } }
                ];
            }
        } else {
            const total = await Book.countDocuments(searchQuery);
            const totalPages = Math.ceil(total / limit);

            const currentPage =
                page > totalPages && totalPages > 0 ? totalPages : page;

            const skip = (currentPage - 1) * limit;

            const books = await Book.find(searchQuery)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            if (books) {
                return res.status(200).json({
                    success: true,
                    error: false,
                    message: "Books listed successfully",
                    data: books,
                    pagination: {
                        total,
                        page: currentPage,
                        limit,
                        totalPages
                    }
                });
            }
            else {
                return next(new HttpError("No books found", 500));
            }

        }       
      }
       
             
       
    } catch (error) {
        return next(new HttpError(error.message, 500));
    }
};

// get a single book
export const getSingleBook = async (req, res, next) => {
    try {
        const id = req.params.id.trim();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new HttpError("Invalid Book ID", 400));
        }
        else {
            const book = await Book.findById(id).select(
                "_id author description excerpt genre image language page_count prize title category publish_date"
            );

            if (!book) {
                return next(new HttpError("Book Not Found", 400));
            }
            else {
                return res.status(200).json({
                    success: true,
                    error: false,
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
        const role = req.userData.userRole
        const id = req.params.id;
        const book = req.body;
        console.log(role)


        if(role !=="seller"){
            return next(new HttpError("Only sellers can update books", 403));
        }
        else{
             if (book.publish_date) {
            book.publish_date = new Date(book.publish_date);
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new HttpError("Invalid Book ID", 400));
        }
        else {
            const updated = await Book.findByIdAndUpdate(
                id,
                { $set: book },
                { new: true }
            );

            if (!updated) {
                return next(new HttpError("Book Not Found", 400));
            }
            else {
                return res.status(200).json({
                    success: true,
                    error: false,
                    message: "Successfully updated book",
                    data: updated
                });
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
        const id = req.params.id;
         const role = req.userData.userRole

         if(role !=="seller"){
             return next(new HttpError("Only sellers can delete books", 403));
         }
         else{
            
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(new HttpError("Invalid Book ID", 400));
        }
        else {
            const deleted = await Book.findByIdAndUpdate(
                id,
                { is_deleted: true },
                { new: true, runValidators: true }
            );

            if (!deleted) {
                return next(new HttpError("Task Not Found", 400));
            }
            else {
                return res.status(200).json({
                    success: true,
                    error: false,
                    message: "Successfully deleted task",
                    data: deleted
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

// list all  books of a specific user
export const getBooksOfSingleUser = async(req,res,next)=>{
    try{
       const user = req.userData.userId
       const role = req.userData.userRole
       console.log(role)

       if(role !=="seller"){
        return next(new HttpError("Only sellers can view their books", 403));
       }
       else{
        const userBooks= await Book.find({user})
     const  bookCount=await Book.countDocuments({user})
       if(!userBooks || userBooks.length ==0){
        return next(new HttpError('No book found for this user',404))
       }
       else{
        res.status(200).json({
            success:true,
            message:"successfully fetched food",
            data:userBooks,
            count:bookCount
        })
       }

       }
       
    }
    catch(error){
        return next(new HttpError(error.message,500))

    }
}







