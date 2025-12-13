import HttpError from "../helpers/httpError.js"
import { Wishlist } from "../models/wishlist.js"
import mongoose from "mongoose";



export const addToWishList = async (req, res, next) => {
  try {
    const { userId, userRole } = req.userData;

    if (userRole !== "customer") {
      return next(new HttpError("Only customers can add to wishlist", 403));
    }
    else {

      const { id } = req.params;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return next(new HttpError("Invalid or missing book id", 400));
      }
      else {
        let wishlist = await Wishlist.findOne({ user: userId }) || new Wishlist({ user: userId, items: [] });

        const alreadyExists = wishlist.items.some(
          (item) => item.book.toString() === id
        );

        if (alreadyExists) {
          return next(new HttpError("Item is already in your wishlist", 400));
        }
        else {
          wishlist.items.push({ book: id });
          await wishlist.save();
          return res.status(200).json({
            success: true,
            message: "Item successfully added to wishlist",
          });

        }
      }
    }

  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};



export const getAllWishList = async (req, res, next) => {
  try {
    const { userId, userRole } = req.userData;

    if (userRole !== "customer") {
      return next(new HttpError("Only customers can list wishlist", 403));
    }
    else {
      let page = parseInt(req.query.page, 10) || 1;
      let limit = parseInt(req.query.limit, 10) || 10;


      if (page < 1) page = 1;
      if (limit < 1) limit = 10;

      const wishlist = await Wishlist.findOne({ user: userId }).populate(
        "items.book"
      );

      if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
        return next(new HttpError("Wishlist is Empty", 400));
      }

      const totalItems = wishlist.items.length;
      const totalPages = Math.ceil(totalItems / limit);


      if (page > totalPages) {
        return res.status(200).json({
          success: true,
          message: "Wishlist fetched successfully",
          data: [],
          totalItems,
          totalPages,
          currentPage: page,
        });
      }


      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedItems = wishlist.items.slice(startIndex, endIndex);

      const wishlistItems = paginatedItems.map((item) => ({
        bookId: item.book._id,
        title: item.book.title,
        description: item.book.description,
        excerpt: item.book.excerpt,
        page_count: item.book.page_count,
        publish_date: item.book.publish_date,
        author: item.book.author,
        genre: item.book.genre,
        language: item.book.language,
        prize: item.book.prize,
        category: item.book.category,
        image: item.book.image,
      }));

      return res.status(200).json({
        success: true,
        message: "Wishlist fetched successfully",
        data: wishlistItems,
        totalItems,
        totalPages,
        currentPage: page,
      });

    }

  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};




export const removeWishList = async (req, res, next) => {
  try {
    const { userId, userRole } = req.userData
    if (userRole !== "customer") {
      return next(new HttpError("Only customers remove whislist Item"))
    } else {
      const { id } = req.params

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return next(new HttpError("Invalid or missing Book id", 400))
      }
      else {

        const wishlist = await Wishlist.findOne({ user: userId })
        if (!wishlist) {
          return next(new HttpError("Wishlist  not found", 404))
        }
        else {
          const Index = wishlist.items.findIndex((item) => item.book.toString() === id)
          if (Index === -1) {
            return next(new HttpError("Book Not Found In the wishlist", 404));
          }
          else {
            wishlist.items.splice(Index, 1)
            await wishlist.save()
            return res.status(200).json({
              success: true,
              message: "successfully removed from wishlist",
            });

          }
        }

      }
    }
  }
  catch (error) {
    return next(new HttpError(`${error.message}`))
  }

}



export const clearWishList = async (req, res, next) => {
  try {
    const { userId, userRole } = req.userData;

    if (userRole !== "customer") {
      return next(new HttpError("Only customers can clear the cart", 403));
    }
    else {
      const wishlist = await Wishlist.findOne({ user: userId });

      if (!wishlist) {
        return next(new HttpError("Cart not found", 404));
      }
      else {
        wishlist.items = [];
        await wishlist.save();

        return res.status(200).json({
          success: true,
          message: "All cart items have been removed",
        });
      }
    }
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};
