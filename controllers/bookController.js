import { Book } from "../models/book.js";
import mongoose from "mongoose";


// add a new book
export const addNewBook = async (req, res, next) => {
    try {
        console.log(req.body);

        const {image , title, description, excerpt, page_count, genre, language, author, publish_date,prize ,category  } = req.body

        if ( !image | !title | !description | !page_count | !publish_date | !author | !genre | !language | !prize |! category) {

            return res.status(400).json({
                success: false,
                error: true,
                message: "Required fields: title, author, pageCount, publishDate ,prize"
            });
        }

        const date = new Date(publish_date)

        if (isNaN(date)) {
            return res.status(400).json({
                success: false,
                message: "Invalid publishDate format"
            });
        }


         if (Number(prize) > 15000) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "please give a valide prize",
      });
    }
        const book = {
          image, title: title.trim(), description, excerpt, page_count: Number(page_count), genre, language,
            author: author.trim(), publish_date: date,prize:Number(prize),category
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
    const page = parseInt(req.query.page) || 1;      
    const limit = parseInt(req.query.limit) || 10;
    
    const search = req.query.search || "";

    let searchQuery = { is_deleted: false };

if (search) {
    
 
  const priceValue = parseInt(search);
  if (!isNaN(priceValue)) {
   
    searchQuery.prize = priceValue;
  } else {
    
    searchQuery.$or = [
      { title: { $regex: search, $options: "i" } }, 
      { genre: { $regex: search, $options: "i" } },
    ];
  }
}

   const total = await Book.countDocuments(searchQuery);
   const totalPages = Math.ceil(total / limit);


const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
const skip = (currentPage - 1) * limit;

const books = await Book.find(searchQuery).sort({createdAt:-1})
  .skip(skip)
  .limit(limit);

return res.status(200).json({
  success: true,
  error: false,
  message: books.length ? "Books listed successfully" : "No books found",
  data: books,
  pagination: {
    total,
    page: currentPage,
    limit,
    totalPages,
  },
});
  } catch (err) {
    next(err);
  }
};






// get a single book
export const getSingleBook = async (req, res, next) => {
    try {

        const id = req.params.id.trim();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Book ID",
            });
        }
        else {
            const book = await Book.findById(id).select(' _id  author description excerpt genre image language page_count prize title category publish_date')

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
            const updated = await Book.findByIdAndUpdate(id, { $set: book }, { new: true })

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



// newly added books

export const getNewlyAddedBooks = async (req, res, next) => {
  try {
    // Fetch 8 most recently added books that are not deleted
    const books = await Book.find({ is_deleted: false })
      .sort({ createdAt: -1 }) // newest first
      .limit(8);

    return res.status(200).json({
      success: true,
      error: false,
      message: books.length ? "Newly added books fetched successfully" : "No books found",
      data: books,
    });
  } catch (error) {
    console.error("Error fetching newly added books:", error);
    next(error);
  }
};




